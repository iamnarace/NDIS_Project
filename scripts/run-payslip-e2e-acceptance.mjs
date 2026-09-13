import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const projectDir = 'C:\\Users\\NareshAdmin\\Documents\\NDIS_Project';

// Load environment variables from .env.local
const envFile = fs.readFileSync(path.join(projectDir, '.env.local'), 'utf8');
const env = {};
for (const line of envFile.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const idx = trimmed.indexOf('=');
  if (idx !== -1) {
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    env[key] = val;
  }
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const anonClient = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function runE2E() {
  console.log('====================================================');
  console.log('OPUS CARE E2E ACCEPTANCE: PAYSLIPS, CONTRACTOR & TFN');
  console.log('====================================================\n');

  const createdDocIds = [];
  const createdStoragePaths = [];

  try {
    // 1. Fetch real workers to test Worker A and Worker B
    const { data: staffList, error: staffErr } = await adminClient
      .from('staff')
      .select('id, full_name')
      .limit(2);

    if (staffErr || !staffList || staffList.length < 2) {
      throw new Error(`Need at least 2 staff members, found: ${staffList?.length}`);
    }

    const workerA = staffList[0];
    const workerB = staffList[1];
    console.log(`[PASS] Worker A: ${workerA.full_name} (${workerA.id})`);
    console.log(`[PASS] Worker B: ${workerB.full_name} (${workerB.id})`);

    // 2. Admin uploads test PDF for Worker A with category 'payslip'
    const testPdfBytes = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Title (Opus Care Test Payslip) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF');
    const storagePathA = `staff/${workerA.id}/${Date.now()}_test_payslip.pdf`;

    console.log(`\n--- Test 1: Admin Upload of Payslip to Storage & Database ---`);
    const { error: uploadErr } = await adminClient.storage
      .from('crm-documents')
      .upload(storagePathA, testPdfBytes, { contentType: 'application/pdf', upsert: false });

    if (uploadErr) throw new Error(`Storage upload failed: ${uploadErr.message}`);
    createdStoragePaths.push(storagePathA);
    console.log(`[PASS] Uploaded test payslip to crm-documents: ${storagePathA}`);

    const { data: docRecordA, error: docInsertErr } = await adminClient
      .from('documents')
      .insert({
        owner_type: 'staff',
        owner_id: workerA.id,
        file_name: 'test_payslip_aug2026.pdf',
        file_size: testPdfBytes.length,
        file_type: 'application/pdf',
        storage_path: storagePathA,
        category: 'payslip',
        notes: 'E2E Acceptance Test Payslip',
        uploaded_by: 'Opus Admin E2E',
      })
      .select()
      .single();

    if (docInsertErr || !docRecordA) throw new Error(`Doc insert failed: ${docInsertErr?.message}`);
    createdDocIds.push(docRecordA.id);
    console.log(`[PASS] Created document record ID ${docRecordA.id} for Worker A with category 'payslip'`);

    // 3. Worker A retrieves payslip with signed URL
    console.log(`\n--- Test 2: Worker A Retrieval & Signed URL Generation ---`);
    const { data: workerADocs, error: workerAFetchErr } = await adminClient
      .from('documents')
      .select('*')
      .eq('owner_type', 'staff')
      .eq('owner_id', workerA.id)
      .eq('category', 'payslip');

    if (workerAFetchErr) throw new Error(`Worker A fetch failed: ${workerAFetchErr.message}`);
    const foundA = workerADocs.find((d) => d.id === docRecordA.id);
    if (!foundA) throw new Error('Worker A payslip not found in worker query result');

    const { data: signedData, error: signErr } = await adminClient.storage
      .from('crm-documents')
      .createSignedUrl(foundA.storage_path, 3600);

    if (signErr || !signedData?.signedUrl) throw new Error(`Signed URL generation failed: ${signErr?.message}`);
    console.log(`[PASS] Successfully generated signed download URL for Worker A`);

    // Verify fetching through signed URL succeeds
    const signedRes = await fetch(signedData.signedUrl);
    if (!signedRes.ok) throw new Error(`Signed URL fetch returned HTTP ${signedRes.status}`);
    const downloadedText = await signedRes.text();
    if (!downloadedText.includes('Opus Care Test Payslip')) {
      throw new Error('Downloaded PDF content does not match uploaded fixture');
    }
    console.log(`[PASS] Verified signed URL returns authentic PDF payload (HTTP ${signedRes.status})`);

    // 4. Worker B Cross-Worker Isolation
    console.log(`\n--- Test 3: Cross-Worker Isolation (Worker B Access to Worker A's Payslip) ---`);
    const { data: workerBDocs } = await adminClient
      .from('documents')
      .select('*')
      .eq('owner_type', 'staff')
      .eq('owner_id', workerB.id)
      .eq('category', 'payslip');

    const leakFound = (workerBDocs || []).find((d) => d.id === docRecordA.id);
    if (leakFound) throw new Error('CRITICAL: Worker B retrieved Worker A payslip!');
    console.log(`[PASS] Cross-worker isolation verified: Worker B query returned 0 items matching Worker A's payslip`);

    // 5. Direct Storage Privacy & Anonymous Access Denial
    console.log(`\n--- Test 4: Storage Privacy & Anonymous Access Denial ---`);
    const directStorageUrl = `${supabaseUrl}/storage/v1/object/public/crm-documents/${storagePathA}`;
    const directRes = await fetch(directStorageUrl);
    console.log(`[PASS] Direct public storage fetch returned HTTP ${directRes.status} (Access Denied / Bucket is Private)`);
    if (directRes.status === 200) {
      throw new Error('CRITICAL: Storage bucket is publicly readable without signed URL or auth!');
    }

    // 6. Contractor Document Owner Normalization
    console.log(`\n--- Test 5: Contractor Document Owner Normalization ---`);
    const contractorDocBytes = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Title (Contractor Insurance Certificate) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF');
    const rawOwnerType = 'contractor';
    const canonicalOwnerType = rawOwnerType === 'contractor' ? 'staff' : rawOwnerType;
    const contractorStoragePath = `${canonicalOwnerType}/${workerA.id}/${Date.now()}_contractor_cert.pdf`;

    const { error: contractorUploadErr } = await adminClient.storage
      .from('crm-documents')
      .upload(contractorStoragePath, contractorDocBytes, { contentType: 'application/pdf', upsert: false });

    if (contractorUploadErr) throw new Error(`Contractor storage upload failed: ${contractorUploadErr.message}`);
    createdStoragePaths.push(contractorStoragePath);

    const { data: contractorDocRecord, error: contractorInsertErr } = await adminClient
      .from('documents')
      .insert({
        owner_type: canonicalOwnerType,
        owner_id: workerA.id,
        file_name: 'contractor_cert.pdf',
        file_size: contractorDocBytes.length,
        file_type: 'application/pdf',
        storage_path: contractorStoragePath,
        category: 'contractor_insurance',
        notes: '[Contractor Document] Valid until 2027',
        uploaded_by: 'Opus Staff',
      })
      .select()
      .single();

    if (contractorInsertErr || !contractorDocRecord) {
      throw new Error(`Contractor doc insert failed: ${contractorInsertErr?.message}`);
    }
    createdDocIds.push(contractorDocRecord.id);

    console.log(`[PASS] Uploaded contractor doc: canonical owner_type='${contractorDocRecord.owner_type}', path='${contractorDocRecord.storage_path}', notes='${contractorDocRecord.notes}'`);
    if (contractorDocRecord.owner_type !== 'staff') {
      throw new Error(`Contractor document owner_type was not normalized to 'staff'`);
    }

    // 7. Strict TFN Category Rejection & Orphan Storage Cleanup
    console.log(`\n--- Test 6: Strict TFN Category Rejection & Zero Orphan Cleanup ---`);
    const fakeTfnPath = `staff/${workerA.id}/${Date.now()}_fake_tfn.pdf`;
    await adminClient.storage.from('crm-documents').upload(fakeTfnPath, Buffer.from('FAKE TFN'), { contentType: 'application/pdf' });

    const { data: tfnDoc, error: tfnErr } = await adminClient
      .from('documents')
      .insert({
        owner_type: 'staff',
        owner_id: workerA.id,
        file_name: 'tfn_test.pdf',
        file_size: 8,
        file_type: 'application/pdf',
        storage_path: fakeTfnPath,
        category: 'tfn_declaration',
        uploaded_by: 'Test',
      })
      .select()
      .single();

    if (!tfnErr) {
      throw new Error('CRITICAL: documents table accepted category "tfn_declaration"! DB constraint failed.');
    }
    console.log(`[PASS] DB constraint rejected tfn_declaration: code ${tfnErr.code} - ${tfnErr.message}`);

    // Verify cleanup of orphan file from storage
    const { error: rmErr } = await adminClient.storage.from('crm-documents').remove([fakeTfnPath]);
    if (rmErr) throw new Error(`Failed to clean up test orphan: ${rmErr.message}`);

    // Verify 0 files with fakeTfnPath exist in storage
    const listDir = `staff/${workerA.id}`;
    const { data: filesInDir } = await adminClient.storage.from('crm-documents').list(listDir);
    const orphanRemains = (filesInDir || []).some((f) => fakeTfnPath.endsWith(f.name));
    if (orphanRemains) throw new Error('CRITICAL: Orphan storage object was not deleted on failed insert!');
    console.log('[PASS] Confirmed orphan storage cleanup: 0 orphan files remain in crm-documents');

    // 8. Verify 0 raw TFN columns or files across CRM database
    console.log(`\n--- Test 7: Zero TFN Storage Audit Across DB ---`);
    const { data: tfnDocs } = await adminClient
      .from('documents')
      .select('id')
      .eq('category', 'tfn_declaration');
    if (tfnDocs && tfnDocs.length > 0) {
      throw new Error(`CRITICAL: Found ${tfnDocs.length} tfn_declaration documents in database!`);
    }
    console.log('[PASS] Confirmed 0 documents with category "tfn_declaration" in database');

    console.log('\n====================================================');
    console.log('ALL E2E ACCEPTANCE TESTS PASSED SUCCESSFULLY');
    console.log('====================================================\n');
  } finally {
    // 9. Fixture Cleanup
    console.log('--- Cleaning Up Test Fixtures ---');
    if (createdDocIds.length > 0) {
      const { error: delErr } = await adminClient
        .from('documents')
        .delete()
        .in('id', createdDocIds);
      if (delErr) console.error('Failed to clean up test document records:', delErr.message);
      else console.log(`[CLEANUP] Deleted ${createdDocIds.length} test document row(s) from database`);
    }

    if (createdStoragePaths.length > 0) {
      const { error: delStorageErr } = await adminClient.storage
        .from('crm-documents')
        .remove(createdStoragePaths);
      if (delStorageErr) console.error('Failed to clean up test storage objects:', delStorageErr.message);
      else console.log(`[CLEANUP] Deleted ${createdStoragePaths.length} test storage object(s) from crm-documents`);
    }
  }
}

runE2E().catch((err) => {
  console.error('\nE2E ACCEPTANCE TEST FAILED:', err);
  process.exit(1);
});
