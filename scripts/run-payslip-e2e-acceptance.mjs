import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const projectDir = 'C:\\Users\\NareshAdmin\\Documents\\NDIS_Project';

// Load environment variables from .env.local
const localEnvPath = path.join(projectDir, '.env.local');
const envFile = fs.readFileSync(localEnvPath, 'utf8');

const env = {};
for (const line of envFile.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const idx = trimmed.indexOf('=');
  if (idx !== -1) {
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    env[key] = val;
    process.env[key] = val;
  }
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const adminSecret = env.ADMIN_ACCESS_KEY || process.env.ADMIN_ACCESS_KEY || 'opuscare_local_test_admin_key_2026';

if (!supabaseUrl || !serviceKey) {
  console.error('Missing configuration: Supabase URL or Service Role Key');
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const adminSessionToken = crypto
  .createHmac('sha256', adminSecret)
  .update('opuscare_ndis_admin_session_salt')
  .digest('hex');

const BASE_URL = 'http://localhost:3009';

async function runE2E() {
  console.log('================================================================');
  console.log('OPUS CARE TRUE E2E ACCEPTANCE: HTTP ENDPOINTS, WORKERS & RLS');
  console.log('================================================================\n');

  const createdDocIds = [];
  const createdStoragePaths = [];
  const createdUserIds = [];

  try {
    // 1. Fetch 2 distinct real staff members to act as Worker A and Worker B
    const { data: staffList, error: staffErr } = await adminClient
      .from('staff')
      .select('id, full_name, reference_number')
      .limit(2);

    if (staffErr || !staffList || staffList.length < 2) {
      throw new Error(`Need at least 2 staff members, found: ${staffList?.length}`);
    }

    const workerA = staffList[0];
    const workerB = staffList[1];
    console.log(`[PASS] Selected Worker A: ${workerA.full_name} (${workerA.id})`);
    console.log(`[PASS] Selected Worker B: ${workerB.full_name} (${workerB.id})`);

    // 2. Admin authenticated upload via actual POST /api/crm/documents endpoint
    console.log(`\n--- Phase 1: Admin Upload via Actual POST /api/crm/documents Endpoint ---`);
    const testPdfContent = `%PDF-1.4\n1 0 obj\n<< /Title (Opus Care Statutory Payslip Verification) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF`;
    const payslipBlob = new Blob([testPdfContent], { type: 'application/pdf' });

    const adminFormData = new FormData();
    adminFormData.append('file', payslipBlob, 'test_payslip_aug2026.pdf');
    adminFormData.append('ownerType', 'staff');
    adminFormData.append('ownerId', workerA.id);
    adminFormData.append('category', 'payslip');
    adminFormData.append('notes', 'E2E Acceptance Test Payslip');

    const adminUploadRes = await fetch(`${BASE_URL}/api/crm/documents`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminSessionToken}`,
      },
      body: adminFormData,
    });

    if (!adminUploadRes.ok) {
      const errText = await adminUploadRes.text();
      throw new Error(`Admin upload failed (HTTP ${adminUploadRes.status}): ${errText}`);
    }

    const adminJson = await adminUploadRes.json();
    const uploadedDocA = adminJson.document;
    if (!uploadedDocA || !uploadedDocA.id) {
      throw new Error(`Unexpected document response: ${JSON.stringify(adminJson)}`);
    }

    console.log(`[PASS] POST /api/crm/documents returned HTTP 200 OK`);
    console.log(`[PASS] Created document ID: ${uploadedDocA.id}`);
    console.log(`[PASS] Storage path: ${uploadedDocA.storage_path}`);
    console.log(`[PASS] Category: ${uploadedDocA.category} | Owner type: ${uploadedDocA.owner_type}`);

    createdDocIds.push(uploadedDocA.id);
    createdStoragePaths.push(uploadedDocA.storage_path);

    // Verify storage object really exists in Supabase crm-documents bucket
    const { data: storageListing, error: listErr } = await adminClient.storage
      .from('crm-documents')
      .list(`staff/${workerA.id}`);

    if (listErr) throw new Error(`Failed to list storage: ${listErr.message}`);
    const foundInStorage = (storageListing || []).some((f) => uploadedDocA.storage_path.endsWith(f.name));
    if (!foundInStorage) {
      throw new Error(`CRITICAL: Object ${uploadedDocA.storage_path} not found in crm-documents bucket!`);
    }
    console.log(`[PASS] Verified object physically exists in crm-documents bucket`);

    // 3. Authenticate as TEST Worker A and retrieve via GET /api/portal/worker/payslips
    console.log(`\n--- Phase 2: Authenticated Worker A Payslip Retrieval & Signed URL ---`);
    const testWorkerAEmail = `e2e_worker_a_${Date.now()}@opuscare.com.au`;
    const testWorkerPassword = 'TempPassword123!SecureE2E';

    const { data: authUserA, error: createErrA } = await adminClient.auth.admin.createUser({
      email: testWorkerAEmail,
      password: testWorkerPassword,
      email_confirm: true,
      user_metadata: { full_name: 'Test Worker A', role: 'worker' },
    });
    if (createErrA || !authUserA?.user) throw new Error(`Failed to create test user A: ${createErrA?.message}`);
    createdUserIds.push(authUserA.user.id);

    // Upsert profile for Worker A
    const { error: profileErrA } = await adminClient
      .from('profiles')
      .upsert({
        id: authUserA.user.id,
        email: testWorkerAEmail,
        role: 'worker',
        portal_staff_id: workerA.id,
        is_active: true,
        full_name: 'Test Worker A',
      });
    if (profileErrA) throw new Error(`Failed to upsert profile A: ${profileErrA.message}`);

    // Sign in as Worker A to get JWT token
    const clientA = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
    const { data: sessionA, error: loginErrA } = await clientA.auth.signInWithPassword({
      email: testWorkerAEmail,
      password: testWorkerPassword,
    });
    if (loginErrA || !sessionA?.session?.access_token) throw new Error(`Worker A sign-in failed: ${loginErrA?.message}`);
    const tokenA = sessionA.session.access_token;
    console.log(`[PASS] Authenticated Worker A and obtained valid session JWT`);

    // Call GET /api/portal/worker/payslips as Worker A
    const workerARes = await fetch(`${BASE_URL}/api/portal/worker/payslips`, {
      headers: {
        Authorization: `Bearer ${tokenA}`,
      },
    });

    if (!workerARes.ok) {
      const errText = await workerARes.text();
      throw new Error(`Worker A payslips fetch failed (HTTP ${workerARes.status}): ${errText}`);
    }

    const workerAData = await workerARes.json();
    console.log(`[PASS] GET /api/portal/worker/payslips returned HTTP 200 for Worker A (Count: ${workerAData.count})`);

    const payslipMatch = (workerAData.payslips || []).find((p) => p.id === uploadedDocA.id);
    if (!payslipMatch) {
      throw new Error(`Worker A payslip not found in worker response! Response: ${JSON.stringify(workerAData)}`);
    }
    console.log(`[PASS] Found uploaded payslip in Worker A results (ID: ${payslipMatch.id})`);
    if (!payslipMatch.downloadUrl) {
      throw new Error('Signed download URL was not generated for Worker A!');
    }
    console.log(`[PASS] Signed download URL generated: ${payslipMatch.downloadUrl.slice(0, 60)}...`);

    // Download PDF through signed URL and verify content
    const downloadRes = await fetch(payslipMatch.downloadUrl);
    if (!downloadRes.ok) {
      throw new Error(`Signed URL download returned HTTP ${downloadRes.status}`);
    }
    const downloadedContent = await downloadRes.text();
    if (!downloadedContent.includes('Opus Care Statutory Payslip Verification')) {
      throw new Error('Downloaded PDF content does not match uploaded payload!');
    }
    console.log(`[PASS] Downloaded PDF through signed URL (HTTP 200) and verified authentic payload`);

    // 4. Authenticate as TEST Worker B and verify cross-worker isolation
    console.log(`\n--- Phase 3: Cross-Worker Isolation (Worker B Access to Worker A's Payslip) ---`);
    const testWorkerBEmail = `e2e_worker_b_${Date.now()}@opuscare.com.au`;

    const { data: authUserB, error: createErrB } = await adminClient.auth.admin.createUser({
      email: testWorkerBEmail,
      password: testWorkerPassword,
      email_confirm: true,
      user_metadata: { full_name: 'Test Worker B', role: 'worker' },
    });
    if (createErrB || !authUserB?.user) throw new Error(`Failed to create test user B: ${createErrB?.message}`);
    createdUserIds.push(authUserB.user.id);

    // Upsert profile for Worker B
    const { error: profileErrB } = await adminClient
      .from('profiles')
      .upsert({
        id: authUserB.user.id,
        email: testWorkerBEmail,
        role: 'worker',
        portal_staff_id: workerB.id,
        is_active: true,
        full_name: 'Test Worker B',
      });
    if (profileErrB) throw new Error(`Failed to upsert profile B: ${profileErrB.message}`);

    // Sign in as Worker B to get JWT token
    const clientB = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
    const { data: sessionB, error: loginErrB } = await clientB.auth.signInWithPassword({
      email: testWorkerBEmail,
      password: testWorkerPassword,
    });
    if (loginErrB || !sessionB?.session?.access_token) throw new Error(`Worker B sign-in failed: ${loginErrB?.message}`);
    const tokenB = sessionB.session.access_token;
    console.log(`[PASS] Authenticated Worker B and obtained valid session JWT`);

    // Call GET /api/portal/worker/payslips as Worker B
    const workerBRes = await fetch(`${BASE_URL}/api/portal/worker/payslips`, {
      headers: {
        Authorization: `Bearer ${tokenB}`,
      },
    });

    if (!workerBRes.ok) {
      throw new Error(`Worker B payslips fetch returned HTTP ${workerBRes.status}`);
    }

    const workerBData = await workerBRes.json();
    const leakFound = (workerBData.payslips || []).find((p) => p.id === uploadedDocA.id);
    if (leakFound) {
      throw new Error(`CRITICAL ISOLATION FAILURE: Worker B retrieved Worker A's payslip!`);
    }
    console.log(`[PASS] Cross-worker isolation verified: Worker B received 0 items matching Worker A's payslip`);

    // 5. Anonymous caller access checks
    console.log(`\n--- Phase 4: Anonymous Access Denial & Direct Storage Privacy ---`);
    const anonPayslipRes = await fetch(`${BASE_URL}/api/portal/worker/payslips`);
    console.log(`[PASS] Anonymous GET /api/portal/worker/payslips returned HTTP ${anonPayslipRes.status} (expected 401)`);
    if (anonPayslipRes.status !== 401) {
      throw new Error(`Anonymous payslip request should return 401, got HTTP ${anonPayslipRes.status}`);
    }

    const anonDocRes = await fetch(`${BASE_URL}/api/crm/documents?ownerId=${workerA.id}`);
    console.log(`[PASS] Anonymous GET /api/crm/documents returned HTTP ${anonDocRes.status} (expected 401)`);
    if (anonDocRes.status !== 401) {
      throw new Error(`Anonymous crm documents request should return 401, got HTTP ${anonDocRes.status}`);
    }

    const directStorageUrl = `${supabaseUrl}/storage/v1/object/public/crm-documents/${uploadedDocA.storage_path}`;
    const directStorageRes = await fetch(directStorageUrl);
    console.log(`[PASS] Direct public storage fetch returned HTTP ${directStorageRes.status} (Access Denied / Private Bucket)`);
    if (directStorageRes.status === 200) {
      throw new Error('CRITICAL: Storage bucket is publicly readable without signed URL or auth!');
    }

    // 6. Direct PostgreSQL RLS Verification with Authenticated Worker Clients
    console.log(`\n--- Phase 5: Direct PostgreSQL RLS Verification with Authenticated Worker Clients ---`);
    const { data: rlsQueryA, error: rlsErrA } = await clientA
      .from('documents')
      .select('*')
      .eq('id', uploadedDocA.id);

    if (rlsErrA) throw new Error(`Worker A RLS query failed: ${rlsErrA.message}`);
    if (!rlsQueryA || rlsQueryA.length === 0) {
      throw new Error('Worker A RLS query returned 0 rows for own document!');
    }
    console.log(`[PASS] Authenticated Worker A client successfully queried own document under RLS`);

    const { data: rlsQueryB, error: rlsErrB } = await clientB
      .from('documents')
      .select('*')
      .eq('id', uploadedDocA.id);

    if (rlsErrB) throw new Error(`Worker B RLS query failed: ${rlsErrB.message}`);
    if (rlsQueryB && rlsQueryB.length > 0) {
      throw new Error('CRITICAL: Authenticated Worker B client bypassed RLS and retrieved Worker A document!');
    }
    console.log(`[PASS] Authenticated Worker B client returned 0 rows for Worker A document (RLS Enforced!)`);

    // 7. Contractor Document Owner Normalization via Actual Endpoint
    console.log(`\n--- Phase 6: Contractor Document Owner Normalization via POST /api/crm/documents ---`);
    const contractorPdfBlob = new Blob(['%PDF-1.4 Contractor Insurance'], { type: 'application/pdf' });
    const contractorFormData = new FormData();
    contractorFormData.append('file', contractorPdfBlob, 'contractor_cert_2026.pdf');
    contractorFormData.append('ownerType', 'contractor');
    contractorFormData.append('ownerId', workerA.id);
    contractorFormData.append('category', 'contractor_insurance');
    contractorFormData.append('notes', 'Contractor Public Liability Certificate');

    const contractorUploadRes = await fetch(`${BASE_URL}/api/crm/documents`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminSessionToken}`,
      },
      body: contractorFormData,
    });

    if (!contractorUploadRes.ok) {
      const errText = await contractorUploadRes.text();
      throw new Error(`Contractor upload failed (HTTP ${contractorUploadRes.status}): ${errText}`);
    }

    const contractorJson = await contractorUploadRes.json();
    const contractorDoc = contractorJson.document;
    console.log(`[PASS] Contractor upload succeeded: canonical owner_type='${contractorDoc.owner_type}'`);
    console.log(`[PASS] Storage path: ${contractorDoc.storage_path}`);
    console.log(`[PASS] Notes: ${contractorDoc.notes}`);

    createdDocIds.push(contractorDoc.id);
    createdStoragePaths.push(contractorDoc.storage_path);

    if (contractorDoc.owner_type !== 'staff') {
      throw new Error(`Contractor document owner_type was not normalized to 'staff'`);
    }
    if (!contractorDoc.storage_path.startsWith(`staff/${workerA.id}/`)) {
      throw new Error(`Contractor storage path should use canonical staff/${workerA.id}/ folder`);
    }
    if (!contractorDoc.notes.includes('[Contractor Document]')) {
      throw new Error(`Contractor document notes missing '[Contractor Document]' prefix`);
    }

    // 8. Strict TFN Rejection & Zero Orphan Cleanup via Actual Endpoint
    console.log(`\n--- Phase 7: Strict TFN Rejection & Zero Orphan Cleanup via Actual Endpoint ---`);
    const tfnPdfBlob = new Blob(['FAKE TFN'], { type: 'application/pdf' });
    const tfnFormData = new FormData();
    tfnFormData.append('file', tfnPdfBlob, 'fake_tfn_form.pdf');
    tfnFormData.append('ownerType', 'staff');
    tfnFormData.append('ownerId', workerA.id);
    tfnFormData.append('category', 'tfn_declaration');

    const tfnUploadRes = await fetch(`${BASE_URL}/api/crm/documents`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminSessionToken}`,
      },
      body: tfnFormData,
    });

    console.log(`[PASS] TFN upload rejected: returned HTTP ${tfnUploadRes.status} (expected 500 error)`);
    if (tfnUploadRes.ok) {
      throw new Error('CRITICAL: POST /api/crm/documents accepted forbidden category tfn_declaration!');
    }

    const { data: storageAfterTfn } = await adminClient.storage
      .from('crm-documents')
      .list(`staff/${workerA.id}`);

    const orphanFound = (storageAfterTfn || []).some((f) => f.name.includes('fake_tfn_form'));
    if (orphanFound) {
      throw new Error('CRITICAL: Orphan storage object was left behind after failed TFN upload!');
    }
    console.log(`[PASS] Confirmed zero orphan storage files remain in crm-documents`);

    // 9. Confirm zero raw TFN documents in database
    console.log(`\n--- Phase 8: Database Audit for Zero TFN Documents ---`);
    const { data: tfnDocs } = await adminClient
      .from('documents')
      .select('id')
      .eq('category', 'tfn_declaration');

    if (tfnDocs && tfnDocs.length > 0) {
      throw new Error(`CRITICAL: Found ${tfnDocs.length} tfn_declaration documents in database!`);
    }
    console.log('[PASS] Confirmed 0 documents with category "tfn_declaration" in database');

    console.log('\n================================================================');
    console.log('ALL TRUE E2E ACCEPTANCE PHASES PASSED WITH 100% SUCCESS');
    console.log('================================================================\n');
  } finally {
    // 10. Clean up all fixtures
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

    for (const uid of createdUserIds) {
      try {
        await adminClient.from('profiles').delete().eq('id', uid);
        await adminClient.auth.admin.deleteUser(uid);
        console.log(`[CLEANUP] Deleted test auth user & profile ${uid}`);
      } catch (e) {
        console.error(`Failed to delete test auth user ${uid}:`, e.message);
      }
    }
  }
}

runE2E().catch((err) => {
  console.error('\nTRUE E2E ACCEPTANCE TEST FAILED:', err);
  process.exit(1);
});
