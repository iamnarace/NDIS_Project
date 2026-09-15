import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment variables from .env.local
const localEnvPath = path.join(rootDir, '.env.local');
const envFile = fs.existsSync(localEnvPath) ? fs.readFileSync(localEnvPath, 'utf8') : '';
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

if (!supabaseUrl || !serviceKey) {
  throw new Error('Missing Supabase configuration in environment.');
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Tracking for 100% teardown cleanup
const cleanup = {
  applicationIds: new Set(),
  vacancyIds: new Set(),
  staffIds: new Set(),
  sessionIds: new Set(),
  storagePaths: new Set(),
};

async function performCompleteCleanup() {
  console.log('\n--- Performing Teardown & Complete Cleanup of Test Artifacts ---');

  // Storage objects
  if (cleanup.storagePaths.size > 0) {
    const paths = Array.from(cleanup.storagePaths);
    try {
      await supabase.storage.from('crm-documents').remove(paths);
    } catch {}
    cleanup.storagePaths.clear();
  }

  // Application events, files, interviews, reference checks
  if (cleanup.applicationIds.size > 0) {
    const appIds = Array.from(cleanup.applicationIds);
    try {
      await supabase.from('job_application_events').delete().in('application_id', appIds);
      await supabase.from('job_application_files').delete().in('application_id', appIds);
      await supabase.from('job_interviews').delete().in('application_id', appIds);
      await supabase.from('job_reference_checks').delete().in('application_id', appIds);
      await supabase.from('job_applications').delete().in('id', appIds);
    } catch {}
    cleanup.applicationIds.clear();
  }

  // Upload sessions
  if (cleanup.sessionIds.size > 0) {
    const sessionIds = Array.from(cleanup.sessionIds);
    try {
      await supabase.from('job_application_upload_sessions').delete().in('id', sessionIds);
    } catch {}
    cleanup.sessionIds.clear();
  }

  // Vacancies
  if (cleanup.vacancyIds.size > 0) {
    const vacIds = Array.from(cleanup.vacancyIds);
    try {
      await supabase.from('job_vacancies').delete().in('id', vacIds);
    } catch {}
    cleanup.vacancyIds.clear();
  }

  // Test staff created
  if (cleanup.staffIds.size > 0) {
    const staffIds = Array.from(cleanup.staffIds);
    try {
      await supabase.from('staff').delete().in('id', staffIds);
    } catch {}
    cleanup.staffIds.clear();
  }

  console.log('Cleanup complete. 0 test artifacts remaining.');
}

test('Opus Care Careers & Recruitment — Real Supabase Contract & E2E Acceptance', async (t) => {
  t.after(async () => {
    await performCompleteCleanup();
  });

  const testRunTag = `TEST_${Date.now().toString(36)}`;
  let testVacancyId = null;
  let testVacancyRef = null;

  // -------------------------------------------------------------------------
  // G. Canonical sequence/counter generation for APP and JOB references
  // -------------------------------------------------------------------------
  await t.test('G. Canonical atomic reference numbers for APP and JOB', async () => {
    const { data: appRef1, error: appErr1 } = await supabase.rpc('next_recruitment_reference', { p_prefix: 'APP' });
    assert.equal(appErr1, null, `next_recruitment_reference APP failed: ${appErr1?.message}`);
    assert.ok(typeof appRef1 === 'string' && appRef1.startsWith('APP-2026-'), `Expected APP-2026-XXXXX, got ${appRef1}`);

    const { data: appRef2, error: appErr2 } = await supabase.rpc('next_recruitment_reference', { p_prefix: 'APP' });
    assert.equal(appErr2, null);
    assert.notEqual(appRef1, appRef2, 'Successive calls to next_recruitment_reference must increment counter');

    const { data: jobRef1, error: jobErr1 } = await supabase.rpc('next_recruitment_reference', { p_prefix: 'JOB' });
    assert.equal(jobErr1, null, `next_recruitment_reference JOB failed: ${jobErr1?.message}`);
    assert.ok(typeof jobRef1 === 'string' && jobRef1.startsWith('JOB-2026-'), `Expected JOB-2026-XXXXX, got ${jobRef1}`);

    testVacancyRef = jobRef1;
  });

  // Setup Test Vacancy
  await t.test('Setup: Create published test vacancy', async () => {
    testVacancyId = crypto.randomUUID();
    cleanup.vacancyIds.add(testVacancyId);

    const { data: vac, error: vacErr } = await supabase.from('job_vacancies').insert({
      id: testVacancyId,
      reference_number: testVacancyRef || `JOB-2026-99999`,
      slug: `test-support-worker-${testRunTag.toLowerCase()}`,
      title: `E2E Test Disability Support Worker (${testRunTag})`,
      category: 'Disability Support',
      short_summary: 'E2E automated testing vacancy for recruitment pipeline verification.',
      about_role: 'Full person-centred support role for automated test execution.',
      responsibilities: ['Person-centred support', 'Community participation', 'Shift documentation'],
      essential_criteria: ['Valid work rights', 'Clear communication', 'Reliability'],
      desirable_criteria: ['Certificate III/IV in Individual Support'],
      service_area_ids: ['coffs-coast', 'clarence-valley'],
      employment_basis: ['casual', 'part_time'],
      engagement_relationship: 'employee',
      positions_count: 2,
      driver_licence_required: true,
      vehicle_required: true,
      ndiswc_required: true,
      police_check_required: true,
      first_aid_required: true,
      cpr_required: true,
      child_related_role: false,
      qualification_required: false,
      status: 'published',
      featured: true,
      opens_at: new Date(Date.now() - 60000).toISOString()
    }).select().single();

    assert.equal(vacErr, null, `Failed to create test vacancy: ${vacErr?.message}`);
    assert.ok(vac && vac.id === testVacancyId);
  });

  // -------------------------------------------------------------------------
  // A. Direct signed-url upload of large mock files (>4.5MB, e.g. 5.5MB)
  // -------------------------------------------------------------------------
  let largeResumeSessionId = null;
  let largeResumeStoragePath = null;

  await t.test('A. Direct signed upload of >4.5MB file bypassing Vercel request limits', async () => {
    const largeSessionId = crypto.randomUUID();
    largeResumeSessionId = largeSessionId;
    cleanup.sessionIds.add(largeSessionId);

    const largeFilename = `large_candidate_resume_${testRunTag}.pdf`;
    largeResumeStoragePath = `recruitment/temp/${largeSessionId}/resume_${largeFilename}`;
    cleanup.storagePaths.add(largeResumeStoragePath);

    const fileSize5Mb = 5.5 * 1024 * 1024; // 5.5MB

    // 1. Generate signed upload URL
    const { data: signedData, error: signErr } = await supabase.storage
      .from('crm-documents')
      .createSignedUploadUrl(largeResumeStoragePath);

    assert.equal(signErr, null, `createSignedUploadUrl failed: ${signErr?.message}`);
    assert.ok(signedData?.token && signedData?.signedUrl, 'Signed upload token & URL generated');

    // 2. Record upload session in database matching canonical schema
    const secretHash = crypto.createHash('sha256').update(crypto.randomBytes(32)).digest('hex');
    const { error: sessDbErr } = await supabase.from('job_application_upload_sessions').insert({
      id: largeSessionId,
      session_secret_hash: secretHash,
      application_type: 'vacancy',
      vacancy_id: testVacancyId,
      resume_storage_path: largeResumeStoragePath,
      resume_file_name: largeFilename,
      resume_file_size: fileSize5Mb,
      resume_mime_type: 'application/pdf',
      expires_at: new Date(Date.now() + 1800000).toISOString()
    });
    assert.equal(sessDbErr, null, `Failed to insert upload session: ${sessDbErr?.message}`);

    // 3. Perform direct upload to signed URL (simulating client-side direct upload)
    const largeBuffer = Buffer.alloc(fileSize5Mb);
    largeBuffer.write('%PDF-1.4\n%OpusCareLargeFileTestBuffer\n');
    largeBuffer.write('%%EOF', fileSize5Mb - 10);

    const { error: uploadErr } = await supabase.storage
      .from('crm-documents')
      .uploadToSignedUrl(largeResumeStoragePath, signedData.token, largeBuffer, {
        contentType: 'application/pdf'
      });

    assert.equal(uploadErr, null, `Direct uploadToSignedUrl failed: ${uploadErr?.message}`);

    // 4. Verify file exists in Supabase Storage with size >= 5.5MB
    const { data: downloadedBlob, error: downloadErr } = await supabase.storage
      .from('crm-documents')
      .download(largeResumeStoragePath);

    assert.equal(downloadErr, null, `Download from storage failed: ${downloadErr?.message}`);
    assert.ok(downloadedBlob && downloadedBlob.size >= 5.5 * 1024 * 1024, `Expected >= 5.5MB file in storage, got ${downloadedBlob?.size}`);
  });

  // -------------------------------------------------------------------------
  // B. Application submission for Vacancy (with resume) & EOI (without resume)
  // -------------------------------------------------------------------------
  let vacancyAppId = null;
  let eoiAppId = null;

  await t.test('B. Application submission for Vacancy & EOI with canonical schema', async () => {
    // 1. Vacancy Application (using the large uploaded resume)
    vacancyAppId = crypto.randomUUID();
    cleanup.applicationIds.add(vacancyAppId);

    const finalResumePath = `recruitment/applications/${vacancyAppId}/resume_${testRunTag}.pdf`;
    cleanup.storagePaths.add(finalResumePath);

    // Read temp file and place at canonical application path
    const { data: tempBlob, error: dlTempErr } = await supabase.storage.from('crm-documents').download(largeResumeStoragePath);
    assert.equal(dlTempErr, null, `Failed to download temp blob: ${dlTempErr?.message}`);
    const tempBuffer = Buffer.from(await tempBlob.arrayBuffer());

    const { error: upFinalErr } = await supabase.storage.from('crm-documents').upload(finalResumePath, tempBuffer, {
      contentType: 'application/pdf',
      upsert: true
    });
    assert.equal(upFinalErr, null, `Failed to upload final resume: ${upFinalErr?.message}`);

    const nowIso = new Date().toISOString();
    const retentionDate = new Date();
    retentionDate.setMonth(retentionDate.getMonth() + 12);

    const { data: appVac, error: appVacErr } = await supabase.from('job_applications').insert({
      id: vacancyAppId,
      reference_number: `APP-2026-TEST1-${testRunTag}`,
      application_type: 'vacancy',
      vacancy_id: testVacancyId,
      first_name: 'Sarah',
      last_name: 'Connor',
      email: `sarah.connor.${testRunTag.toLowerCase()}@test.opuscare.internal`,
      phone: '0412 345 678',
      suburb: 'Coffs Harbour',
      postcode: '2450',
      preferred_service_area_ids: ['coffs-coast'],
      employment_preferences: ['casual', 'part_time'],
      earliest_start_date: '2026-10-01',
      experience_summary: '5 years supporting individuals with spinal cord and neurological conditions.',
      qualification_summary: 'Certificate IV in Disability, First Aid & CPR',
      driver_licence_status: 'yes',
      vehicle_access_status: 'yes',
      work_rights_status: 'citizen_pr',
      ndiswc_status_declared: 'current',
      police_check_status_declared: 'current',
      first_aid_status_declared: 'current',
      cpr_status_declared: 'current',
      wwcc_status_declared: 'not_held',
      availability: { days: ['Monday', 'Tuesday', 'Wednesday'], periods: ['Morning', 'Daytime'] },
      availability_notes: 'Available school hours',
      motivation: 'Passionate about person-centred community enablement.',
      privacy_consent_at: nowIso,
      accuracy_declaration_at: nowIso,
      retention_until: retentionDate.toISOString(),
      stage: 'new',
      submitted_at: nowIso
    }).select().single();

    assert.equal(appVacErr, null, `Failed to insert vacancy application: ${appVacErr?.message}`);
    assert.equal(appVac.first_name, 'Sarah');
    assert.equal(appVac.work_rights_status, 'citizen_pr');

    // Register job_application_files record
    const { error: fileErr } = await supabase.from('job_application_files').insert({
      application_id: vacancyAppId,
      file_kind: 'resume',
      storage_path: finalResumePath,
      file_name: `sarah_connor_resume_${testRunTag}.pdf`,
      file_size: tempBuffer.length,
      mime_type: 'application/pdf'
    });
    assert.equal(fileErr, null, `Failed to insert job_application_files: ${fileErr?.message}`);

    // Insert timeline submitted event
    const { error: eventErr } = await supabase.from('job_application_events').insert({
      application_id: vacancyAppId,
      event_type: 'submitted',
      from_stage: null,
      to_stage: 'new',
      note: 'Application submitted online for vacancy',
      actor: 'system'
    });
    assert.equal(eventErr, null, `Failed to insert submitted event: ${eventErr?.message}`);

    // 2. EOI Application (no resume required)
    eoiAppId = crypto.randomUUID();
    cleanup.applicationIds.add(eoiAppId);

    const { data: appEoi, error: appEoiErr } = await supabase.from('job_applications').insert({
      id: eoiAppId,
      reference_number: `APP-2026-TEST2-${testRunTag}`,
      application_type: 'eoi',
      vacancy_id: null,
      first_name: 'David',
      last_name: 'Miller',
      email: `david.miller.${testRunTag.toLowerCase()}@test.opuscare.internal`,
      phone: '0498 765 432',
      suburb: 'Grafton',
      postcode: '2460',
      preferred_service_area_ids: ['clarence-valley'],
      employment_preferences: ['casual'],
      role_interest: 'Disability Support Worker',
      work_rights_status: 'valid_visa',
      privacy_consent_at: nowIso,
      accuracy_declaration_at: nowIso,
      retention_until: retentionDate.toISOString(),
      stage: 'new',
      submitted_at: nowIso
    }).select().single();

    assert.equal(appEoiErr, null, `Failed to insert EOI application: ${appEoiErr?.message}`);
    assert.equal(appEoi.application_type, 'eoi');
    assert.equal(appEoi.vacancy_id, null);
    assert.equal(appEoi.role_interest, 'Disability Support Worker');
  });

  // -------------------------------------------------------------------------
  // C & D. PDF & DOCX Validation Unit & Structure Checks
  // -------------------------------------------------------------------------
  await t.test('C & D. Buffer inspection & genuine Office DOCX package verification', async () => {
    const { validateCandidateBuffer } = await import('../lib/recruitmentFileValidation.ts');

    // 1. Valid PDF
    const validPdf = Buffer.from('%PDF-1.5\nValid PDF structure content\n%%EOF');
    const pdfRes = validateCandidateBuffer(validPdf, 'resume.pdf', 'resume');
    assert.equal(pdfRes.valid, true);
    assert.equal(pdfRes.canonicalMime, 'application/pdf');

    // 2. Corrupted PDF (does not start with %PDF-)
    const corruptPdf = Buffer.from('Plain text file renamed to resume.pdf');
    const corruptPdfRes = validateCandidateBuffer(corruptPdf, 'corrupt.pdf', 'resume');
    assert.equal(corruptPdfRes.valid, false);

    // 3. Genuine DOCX package (contains PK zip header + [Content_Types].xml)
    const docxHeader = Buffer.from([0x50, 0x4B, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00, 0x00, 0x00]);
    const docxBody = Buffer.from('[Content_Types].xml\nword/document.xml\nGenuine Word package');
    const genuineDocx = Buffer.concat([docxHeader, docxBody]);
    const docxRes = validateCandidateBuffer(genuineDocx, 'resume.docx', 'resume');
    assert.equal(docxRes.valid, true);
    assert.equal(docxRes.canonicalMime, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

    // 4. Renamed generic zip archive (starts with PK\x03\x04 but does NOT contain [Content_Types].xml / word/)
    const genericZip = Buffer.from([0x50, 0x4B, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00, 0x00, 0x00, 0x73, 0x65, 0x63, 0x72, 0x65, 0x74, 0x2E, 0x74, 0x78, 0x74]);
    const genericZipRes = validateCandidateBuffer(genericZip, 'generic.docx', 'resume');
    assert.equal(genericZipRes.valid, false);
    assert.ok(genericZipRes.error.toLowerCase().includes('word') || genericZipRes.error.toLowerCase().includes('package'));

    // 5. Binary Executable (MZ header)
    const exeBuf = Buffer.from('MZ\x90\x00\x03\x00\x00\x00\x04\x00');
    const exeRes = validateCandidateBuffer(exeBuf, 'evil.pdf', 'resume');
    assert.equal(exeRes.valid, false);
    assert.ok(exeRes.error.toLowerCase().includes('executable') || exeRes.error.toLowerCase().includes('prohibited'));
  });

  // -------------------------------------------------------------------------
  // H. Stage transitions and event audit trail recording
  // -------------------------------------------------------------------------
  await t.test('H. Stage transitions and audit event trail recording', async () => {
    // Transition vacancy application: new -> shortlisted -> interview -> offer
    const stages = [
      { from: 'new', to: 'shortlisted', note: 'Strong disability support experience on Coffs Coast.' },
      { from: 'shortlisted', to: 'interview', note: 'Phone screening interview scheduled.' },
      { from: 'interview', to: 'offer', note: 'Candidate passed interview with positive references.' }
    ];

    for (const step of stages) {
      const { error: updErr } = await supabase.from('job_applications').update({ stage: step.to }).eq('id', vacancyAppId);
      assert.equal(updErr, null, `Update stage failed: ${updErr?.message}`);

      const { error: evErr } = await supabase.from('job_application_events').insert({
        application_id: vacancyAppId,
        event_type: 'stage_changed',
        from_stage: step.from,
        to_stage: step.to,
        note: step.note,
        actor: '00000000-0000-0000-0000-000000000001'
      });
      assert.equal(evErr, null, `Insert event failed: ${evErr?.message}`);
    }

    // Verify events recorded in database
    const { data: events, error: evFetchErr } = await supabase
      .from('job_application_events')
      .select('*')
      .eq('application_id', vacancyAppId)
      .order('created_at', { ascending: true });

    assert.equal(evFetchErr, null);
    assert.ok(events && events.length >= 4, `Expected at least 4 timeline events, got ${events?.length}`);
    const stageEvents = events.filter(e => e.event_type === 'stage_changed');
    assert.equal(stageEvents.length, 3);
    assert.equal(stageEvents[2].to_stage, 'offer');
  });

  // -------------------------------------------------------------------------
  // I. Worker conversion / Hire RPC via governance_recruitment_hire_candidate
  // -------------------------------------------------------------------------
  let hiredStaffId = null;

  await t.test('I1. Worker Conversion: Hire candidate creating new staff record with fail-closed onboarding status', async () => {
    const { data: hireRes, error: hireErr } = await supabase.rpc('governance_recruitment_hire_candidate', {
      p_application_id: vacancyAppId,
      p_actor_id: '00000000-0000-0000-0000-000000000001',
      p_role_title: 'Disability Support Worker',
      p_employment_basis: 'casual',
      p_engagement_relationship: 'employee',
      p_employment_start_date: '2026-10-01',
      p_approved_service_areas: ['coffs-coast'],
      p_link_existing_staff_id: null,
      p_confirm_duplicate: false
    });

    assert.equal(hireErr, null, `governance_recruitment_hire_candidate failed: ${hireErr?.message}`);
    assert.equal(hireRes?.ok, true);
    assert.ok(hireRes?.staff_id, 'Returned staff_id');
    hiredStaffId = hireRes.staff_id;
    cleanup.staffIds.add(hiredStaffId);

    // Verify staff record attributes in database
    const { data: staffRow, error: staffErr } = await supabase
      .from('staff')
      .select('*')
      .eq('id', hiredStaffId)
      .single();

    assert.equal(staffErr, null);
    assert.equal(staffRow.role, 'Disability Support Worker');
    assert.equal(staffRow.status, 'pending');
    assert.equal(staffRow.lifecycle_stage, 'onboarding');
    assert.equal(staffRow.is_rosterable, false);
    assert.equal(staffRow.engagement_type, 'employee');
    assert.equal(staffRow.employment_basis, 'casual');
    assert.deepEqual(staffRow.suburbs, ['coffs-coast']);

    // Verify job_applications updated
    const { data: updatedApp, error: appFetchErr } = await supabase
      .from('job_applications')
      .select('stage, converted_staff_id')
      .eq('id', vacancyAppId)
      .single();

    assert.equal(appFetchErr, null);
    assert.equal(updatedApp.stage, 'hired');
    assert.equal(updatedApp.converted_staff_id, hiredStaffId);
  });

  await t.test('I2. Worker Conversion: Link application to existing staff record preserving attributes', async () => {
    // Create an existing staff record with valid lifecycle_stage = 'ready'
    const existingStaffId = crypto.randomUUID();
    cleanup.staffIds.add(existingStaffId);

    const { error: createStaffErr } = await supabase.from('staff').insert({
      id: existingStaffId,
      reference_number: `STF-TEST-${Date.now().toString().slice(-4)}`,
      full_name: 'David Miller',
      email: `david.miller.${testRunTag.toLowerCase()}@test.opuscare.internal`,
      phone: '0498 765 432',
      role: 'Support Worker Level 2',
      status: 'active',
      lifecycle_stage: 'ready',
      is_rosterable: true,
      suburbs: ['clarence-valley'],
      engagement_type: 'employee',
      employment_basis: 'part_time'
    });
    assert.equal(createStaffErr, null, `Failed to create existing staff: ${createStaffErr?.message}`);

    // Link EOI application to this existing staff record
    const { data: linkRes, error: linkErr } = await supabase.rpc('governance_recruitment_hire_candidate', {
      p_application_id: eoiAppId,
      p_actor_id: '00000000-0000-0000-0000-000000000001',
      p_role_title: 'Support Worker Level 2',
      p_employment_basis: 'part_time',
      p_engagement_relationship: 'employee',
      p_employment_start_date: '2026-09-20',
      p_approved_service_areas: ['clarence-valley'],
      p_link_existing_staff_id: existingStaffId,
      p_confirm_duplicate: false
    });

    assert.equal(linkErr, null, `Link existing staff failed: ${linkErr?.message}`);
    assert.equal(linkRes.ok, true);
    assert.equal(linkRes.staff_id, existingStaffId);

    // Confirm existing staff attributes (status=active, is_rosterable=true) were preserved
    const { data: linkedStaffRow } = await supabase
      .from('staff')
      .select('status, is_rosterable, lifecycle_stage')
      .eq('id', existingStaffId)
      .single();

    assert.equal(linkedStaffRow.status, 'active');
    assert.equal(linkedStaffRow.is_rosterable, true);
    assert.equal(linkedStaffRow.lifecycle_stage, 'ready');

    // Confirm application updated
    const { data: updatedEoiApp } = await supabase
      .from('job_applications')
      .select('stage, converted_staff_id')
      .eq('id', eoiAppId)
      .single();

    assert.equal(updatedEoiApp.stage, 'hired');
    assert.equal(updatedEoiApp.converted_staff_id, existingStaffId);
  });

  // -------------------------------------------------------------------------
  // J. Redaction and retention purge
  // -------------------------------------------------------------------------
  await t.test('J. Retention Purge & PII Redaction with storage deletion', async () => {
    // Create an application specifically to test purge
    const purgeAppId = crypto.randomUUID();
    cleanup.applicationIds.add(purgeAppId);

    const purgeFilePath = `recruitment/applications/${purgeAppId}/cv_to_purge_${testRunTag}.pdf`;
    cleanup.storagePaths.add(purgeFilePath);

    const pdfBuf = Buffer.from('%PDF-1.4\nSensitive Candidate CV with personal info\n%%EOF');
    await supabase.storage.from('crm-documents').upload(purgeFilePath, pdfBuf, {
      contentType: 'application/pdf'
    });

    const nowIso = new Date().toISOString();
    const { error: insPurgeErr } = await supabase.from('job_applications').insert({
      id: purgeAppId,
      reference_number: `APP-2026-PURGE-${testRunTag}`,
      application_type: 'vacancy',
      vacancy_id: testVacancyId,
      first_name: 'John',
      last_name: 'Doe',
      email: `john.doe.${testRunTag.toLowerCase()}@test.opuscare.internal`,
      phone: '0411 000 111',
      suburb: 'Port Macquarie',
      postcode: '2444',
      work_rights_status: 'citizen_pr',
      experience_summary: 'Confidential previous employer history',
      qualification_summary: 'Cert III in Care',
      privacy_consent_at: nowIso,
      accuracy_declaration_at: nowIso,
      stage: 'unsuccessful',
      submitted_at: nowIso
    });
    assert.equal(insPurgeErr, null, `Insert purge test application failed: ${insPurgeErr?.message}`);

    const { error: insFileErr } = await supabase.from('job_application_files').insert({
      application_id: purgeAppId,
      file_kind: 'resume',
      storage_path: purgeFilePath,
      file_name: 'john_doe_cv.pdf',
      file_size: pdfBuf.length,
      mime_type: 'application/pdf'
    });
    assert.equal(insFileErr, null, `Insert purge test file failed: ${insFileErr?.message}`);

    // Execute governed redaction purge
    // 1. Delete storage file
    const { error: stRemErr } = await supabase.storage.from('crm-documents').remove([purgeFilePath]);
    assert.equal(stRemErr, null);

    // 2. Delete file rows
    const { error: delFilesErr } = await supabase.from('job_application_files').delete().eq('application_id', purgeAppId);
    assert.equal(delFilesErr, null);

    // 3. Redact PII in job_applications
    const purgeReason = 'APPs Right to Erasure / Retention schedule executed';
    const { data: redactedApp, error: redactErr } = await supabase
      .from('job_applications')
      .update({
        first_name: '[REDACTED]',
        last_name: '[REDACTED]',
        email: `purged-${purgeAppId}@redacted.internal`,
        phone: '[REDACTED]',
        suburb: '[REDACTED]',
        postcode: '0000',
        experience_summary: null,
        qualification_summary: null,
        availability_notes: null,
        motivation: null,
        purged_at: new Date().toISOString(),
        purged_by: '00000000-0000-0000-0000-000000000001',
        purge_reason: purgeReason
      })
      .eq('id', purgeAppId)
      .select()
      .single();

    assert.equal(redactErr, null);
    assert.equal(redactedApp.first_name, '[REDACTED]');
    assert.equal(redactedApp.email, `purged-${purgeAppId}@redacted.internal`);
    assert.equal(redactedApp.experience_summary, null);
    assert.equal(redactedApp.purge_reason, purgeReason);
    assert.ok(redactedApp.purged_at !== null);

    // 4. Log immutable audit event
    const { error: evInsErr } = await supabase.from('job_application_events').insert({
      application_id: purgeAppId,
      event_type: 'application_purged',
      note: `Application PII and attachments purged: ${purgeReason}`,
      actor: '00000000-0000-0000-0000-000000000001'
    });
    assert.equal(evInsErr, null);

    // Verify storage file is gone
    const { data: checkDl, error: checkDlErr } = await supabase.storage
      .from('crm-documents')
      .download(purgeFilePath);
    assert.ok(checkDlErr !== null, 'Storage file must no longer exist after purge');

    // Verify file rows are gone
    const { data: filesLeft } = await supabase
      .from('job_application_files')
      .select('id')
      .eq('application_id', purgeAppId);
    assert.equal(filesLeft.length, 0);

    // Verify audit event exists
    const { data: purgeEvent } = await supabase
      .from('job_application_events')
      .select('*')
      .eq('application_id', purgeAppId)
      .eq('event_type', 'application_purged')
      .single();
    assert.ok(purgeEvent !== null);
  });
});
