import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

// Route Handlers
import { POST as uploadSessionHandler } from '../app/api/careers/upload-session/route.ts';
import { POST as applicationsHandler } from '../app/api/careers/applications/route.ts';
import { GET as getVacanciesHandler, POST as postVacancyHandler } from '../app/api/crm/recruitment/vacancies/route.ts';
import { GET as getApplicationsHandler } from '../app/api/crm/recruitment/applications/route.ts';
import { GET as getApplicationByIdHandler, DELETE as deleteApplicationHandler } from '../app/api/crm/recruitment/applications/[id]/route.ts';
import { PATCH as patchApplicationStageHandler } from '../app/api/crm/recruitment/applications/[id]/stage/route.ts';
import { POST as postApplicationHireHandler } from '../app/api/crm/recruitment/applications/[id]/hire/route.ts';
import { GET as getProviderConfigHandler, POST as postProviderConfigHandler } from '../app/api/crm/provider-config/route.ts';
import { generateSessionToken, ADMIN_COOKIE_NAME } from '../lib/adminAuth.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment variables from .env.local
const localEnvPath = path.join(rootDir, '.env.local');
const envFile = fs.existsSync(localEnvPath) ? fs.readFileSync(localEnvPath, 'utf8') : '';
for (const line of envFile.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const idx = trimmed.indexOf('=');
  if (idx !== -1) {
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    process.env[key] = val;
  }
}

process.env.ADMIN_ACCESS_KEY = process.env.ADMIN_ACCESS_KEY || 'test-admin-access-key-recruitment';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error('Missing Supabase configuration in environment.');
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Mock helper to create synthetic Next.js Requests
function createMockRequest(url, method = 'GET', body = null, headers = {}) {
  const reqHeaders = new Headers();
  reqHeaders.set('content-type', 'application/json');
  reqHeaders.set('x-forwarded-for', '127.0.0.1');
  
  for (const [k, v] of Object.entries(headers)) {
    reqHeaders.set(k, v);
  }

  const init = {
    method,
    headers: reqHeaders,
  };

  if (body && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  return new Request(url, init);
}

// Helper to create a valid minimal DOCX zip buffer
function createValidDocxBuffer() {
  const files = {
    '[Content_Types].xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>',
    'word/document.xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Opus Care Test Resume</w:t></w:r></w:p></w:body></w:document>'
  };

  const localHeaders = [];
  const cdEntries = [];
  let offset = 0;

  for (const [name, content] of Object.entries(files)) {
    const nameBuf = Buffer.from(name, 'utf8');
    const contentBuf = Buffer.from(content, 'utf8');
    const crc = zlib.crc32(contentBuf);

    const local = Buffer.alloc(30 + nameBuf.length + contentBuf.length);
    local.writeUInt32LE(0x04034b50, 0); // Local header signature
    local.writeUInt16LE(20, 4); // Version needed
    local.writeUInt16LE(0, 6); // Flags
    local.writeUInt16LE(0, 8); // Compression: none (store)
    local.writeUInt16LE(0, 10); // Time
    local.writeUInt16LE(0, 12); // Date
    local.writeUInt32LE(crc, 14); // CRC-32
    local.writeUInt32LE(contentBuf.length, 18); // Compressed size
    local.writeUInt32LE(contentBuf.length, 22); // Uncompressed size
    local.writeUInt16LE(nameBuf.length, 26); // Filename length
    local.writeUInt16LE(0, 28); // Extra length
    nameBuf.copy(local, 30);
    contentBuf.copy(local, 30 + nameBuf.length);

    const cd = Buffer.alloc(46 + nameBuf.length);
    cd.writeUInt32LE(0x02014b50, 0); // Central directory signature
    cd.writeUInt16LE(20, 4); // Made by
    cd.writeUInt16LE(20, 6); // Version needed
    cd.writeUInt16LE(0, 8); // Flags
    cd.writeUInt16LE(0, 10); // Compression
    cd.writeUInt16LE(0, 12); // Time
    cd.writeUInt16LE(0, 14); // Date
    cd.writeUInt32LE(crc, 16); // CRC-32
    cd.writeUInt32LE(contentBuf.length, 20); // Compressed size
    cd.writeUInt32LE(contentBuf.length, 24); // Uncompressed size
    cd.writeUInt16LE(nameBuf.length, 28); // Filename length
    cd.writeUInt16LE(0, 30); // Extra length
    cd.writeUInt16LE(0, 32); // Comment length
    cd.writeUInt16LE(0, 34); // Disk number
    cd.writeUInt16LE(0, 36); // Internal attributes
    cd.writeUInt32LE(0, 38); // External attributes
    cd.writeUInt32LE(offset, 42); // Relative offset of local header
    nameBuf.copy(cd, 46);

    localHeaders.push(local);
    cdEntries.push(cd);
    offset += local.length;
  }

  const cdBuf = Buffer.concat(cdEntries);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // End of central directory signature
  eocd.writeUInt16LE(0, 4); // Disk number
  eocd.writeUInt16LE(0, 6); // Start disk
  eocd.writeUInt16LE(cdEntries.length, 8); // Entries on disk
  eocd.writeUInt16LE(cdEntries.length, 10); // Total entries
  eocd.writeUInt32LE(cdBuf.length, 12); // CD size
  eocd.writeUInt32LE(offset, 16); // CD offset
  eocd.writeUInt16LE(0, 20); // Comment length

  return Buffer.concat([...localHeaders, cdBuf, eocd]);
}

// Teardown tracking for 100% cleanup
const cleanup = {
  applicationIds: new Set(),
  vacancyIds: new Set(),
  staffIds: new Set(),
  sessionIds: new Set(),
  storagePaths: new Set(),
};

async function performCompleteTeardown() {
  console.log('\n--- Running Complete Teardown and Verifying 0 Test Artifacts ---');

  if (cleanup.storagePaths.size > 0) {
    const paths = Array.from(cleanup.storagePaths);
    try {
      await supabase.storage.from('crm-documents').remove(paths);
    } catch {}
    cleanup.storagePaths.clear();
  }

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

  if (cleanup.sessionIds.size > 0) {
    const sessionIds = Array.from(cleanup.sessionIds);
    try {
      await supabase.from('job_application_upload_sessions').delete().in('id', sessionIds);
    } catch {}
    cleanup.sessionIds.clear();
  }

  if (cleanup.vacancyIds.size > 0) {
    const vacIds = Array.from(cleanup.vacancyIds);
    try {
      await supabase.from('job_vacancies').delete().in('id', vacIds);
    } catch {}
    cleanup.vacancyIds.clear();
  }

  if (cleanup.staffIds.size > 0) {
    const staffIds = Array.from(cleanup.staffIds);
    try {
      await supabase.from('staff').delete().in('id', staffIds);
    } catch {}
    cleanup.staffIds.clear();
  }

  // Delete test counters to maintain clean state
  await supabase.from('recruitment_reference_counters').delete().neq('prefix', 'PROD_PERSIST');
}

test('Opus Care Careers & Recruitment — Full HTTP Route Handler E2E Suite', async (t) => {
  t.after(async () => {
    await performCompleteTeardown();

    // Verify 0 remaining test artifacts in Supabase tables
    const { count: vacCount } = await supabase.from('job_vacancies').select('*', { count: 'exact', head: true });
    const { count: appCount } = await supabase.from('job_applications').select('*', { count: 'exact', head: true });
    const { count: sessCount } = await supabase.from('job_application_upload_sessions').select('*', { count: 'exact', head: true });
    
    assert.equal(vacCount, 0, `Expected 0 test vacancies remaining in database, found ${vacCount}`);
    assert.equal(appCount, 0, `Expected 0 test applications remaining in database, found ${appCount}`);
    assert.equal(sessCount, 0, `Expected 0 test upload sessions remaining in database, found ${sessCount}`);
    console.log('✓ Teardown verified: 0 test vacancies, 0 test applications, 0 test sessions remaining.');
  });

  const testRunId = `TEST_${Date.now().toString(36)}`;
  let testVacancy = null;
  let adminAuthHeaders = {};

  // 1. Admin Authentication Helper Check
  await t.test('1. Setup: Admin Auth Header verification', async () => {
    const sessionToken = generateSessionToken();
    adminAuthHeaders = {
      'authorization': `Bearer ${sessionToken}`,
      'cookie': `${ADMIN_COOKIE_NAME}=${sessionToken}`
    };
    assert.ok(sessionToken, 'Admin session token generated');
  });

  // 2. Vacancies POST (Admin Route)
  await t.test('2. POST /api/crm/recruitment/vacancies — Creates published vacancy with atomic JOB reference', async () => {
    const req = createMockRequest('http://localhost:3000/api/crm/recruitment/vacancies', 'POST', {
      title: `E2E Test Support Worker (${testRunId})`,
      short_summary: 'Automated test vacancy for end-to-end recruitment route validation.',
      about_role: 'Detailed person-centred disability support duties for automated testing.',
      responsibilities: ['Assist with daily routines', 'Support social and community participation', 'Document progress notes'],
      essential_criteria: ['Valid Australian work rights', 'Clear communication and active listening'],
      desirable_criteria: ['Certificate III in Individual Support'],
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
      featured: true
    }, adminAuthHeaders);

    const res = await postVacancyHandler(req);
    const body = await res.json();

    assert.equal(res.status, 200, `POST vacancy failed with status ${res.status}: ${JSON.stringify(body)}`);
    assert.ok(body.ok, 'Expected ok: true');
    assert.ok(body.vacancy?.id, 'Expected vacancy.id');
    assert.ok(body.vacancy?.reference_number?.startsWith('JOB-2026-'), `Expected JOB-2026-XXXXX reference, got ${body.vacancy?.reference_number}`);
    assert.equal(body.vacancy?.status, 'published');

    testVacancy = body.vacancy;
    cleanup.vacancyIds.add(testVacancy.id);
  });

  // 3. Vacancies GET (Admin Route)
  await t.test('3. GET /api/crm/recruitment/vacancies — Retrieves published vacancies', async () => {
    const req = createMockRequest('http://localhost:3000/api/crm/recruitment/vacancies?status=published', 'GET', null, adminAuthHeaders);
    const res = await getVacanciesHandler(req);
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.ok(body.ok);
    assert.ok(Array.isArray(body.vacancies));
    const found = body.vacancies.find(v => v.id === testVacancy.id);
    assert.ok(found, 'Created test vacancy must be returned in GET vacancies');
  });

  // 4. Public File Upload Session Validations (POST /api/careers/upload-session)
  await t.test('4. POST /api/careers/upload-session — Strict MIME, Extension & Security Validations', async () => {
    // 4a. Reject Fake DOCX (plain text with .docx extension)
    const fakeDocxReq = createMockRequest('http://localhost:3000/api/careers/upload-session', 'POST', {
      application_type: 'vacancy',
      vacancy_id: testVacancy.id,
      file_name: 'fake_resume.docx',
      file_size: 1024,
      mime_type: 'text/plain',
      file_kind: 'resume'
    });
    const fakeDocxRes = await uploadSessionHandler(fakeDocxReq);
    assert.equal(fakeDocxRes.status, 400, 'Expected 400 for MIME mismatch with .docx');

    // 4b. Reject MIME mismatch (PDF extension with image/png MIME)
    const mimeMismatchReq = createMockRequest('http://localhost:3000/api/careers/upload-session', 'POST', {
      application_type: 'vacancy',
      vacancy_id: testVacancy.id,
      file_name: 'resume.pdf',
      file_size: 2048,
      mime_type: 'image/png',
      file_kind: 'resume'
    });
    const mimeMismatchRes = await uploadSessionHandler(mimeMismatchReq);
    assert.equal(mimeMismatchRes.status, 400, 'Expected 400 for image/png on .pdf');

    // 4c. Reject executable extension
    const exeReq = createMockRequest('http://localhost:3000/api/careers/upload-session', 'POST', {
      application_type: 'vacancy',
      vacancy_id: testVacancy.id,
      file_name: 'resume.exe',
      file_size: 1024,
      mime_type: 'application/octet-stream',
      file_kind: 'resume'
    });
    const exeRes = await uploadSessionHandler(exeReq);
    assert.equal(exeRes.status, 400, 'Expected 400 for .exe file');

    // 4d. Reject file exceeding size limit (>8MB for resume)
    const overSizeReq = createMockRequest('http://localhost:3000/api/careers/upload-session', 'POST', {
      application_type: 'vacancy',
      vacancy_id: testVacancy.id,
      file_name: 'huge_resume.pdf',
      file_size: 9 * 1024 * 1024,
      mime_type: 'application/pdf',
      file_kind: 'resume'
    });
    const overSizeRes = await uploadSessionHandler(overSizeReq);
    assert.equal(overSizeRes.status, 400, 'Expected 400 for >8MB resume');
  });

  // 5. Successful Upload Session & Binary PUT to Signed URL (>4.5MB Large File)
  let validResumeSession = null;
  let validCoverSession = null;

  await t.test('5. POST /api/careers/upload-session & Signed PUT — 5.5MB PDF upload succeeds', async () => {
    const largeSize = Math.floor(5.5 * 1024 * 1024); // 5.5MB

    const sessReq = createMockRequest('http://localhost:3000/api/careers/upload-session', 'POST', {
      application_type: 'vacancy',
      vacancy_id: testVacancy.id,
      file_name: `candidate_resume_${testRunId}.pdf`,
      file_size: largeSize,
      mime_type: 'application/pdf',
      file_kind: 'resume'
    });

    const sessRes = await uploadSessionHandler(sessReq);
    const sessBody = await sessRes.json();

    assert.equal(sessRes.status, 200, `Upload session init failed: ${JSON.stringify(sessBody)}`);
    assert.ok(sessBody.ok);
    assert.ok(sessBody.session_id, 'Expected session_id');
    assert.ok(sessBody.session_token, 'Expected session_token for authorization');
    assert.ok(sessBody.signed_url, 'Expected signed_url');

    validResumeSession = sessBody;
    cleanup.sessionIds.add(sessBody.session_id);
    if (sessBody.storage_path) cleanup.storagePaths.add(sessBody.storage_path);

    // Create minimal valid PDF buffer and pad to 5.5MB
    const pdfHeader = Buffer.from('%PDF-1.4\n%âãÏÓ\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 595 842]/Parent 2 0 R>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000015 00000 n\n0000000060 00000 n\n0000000111 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF\n');
    const padding = Buffer.alloc(largeSize - pdfHeader.length, 32);
    const largePdfBuffer = Buffer.concat([pdfHeader, padding]);

    // Perform PUT upload to signed Supabase Storage URL
    const uploadPutRes = await fetch(sessBody.signed_url, {
      method: 'PUT',
      body: largePdfBuffer,
      headers: {
        'Content-Type': 'application/pdf'
      }
    });

    assert.ok(uploadPutRes.ok, `Signed PUT upload failed with HTTP status ${uploadPutRes.status}`);
  });

  // 6. Valid DOCX Upload Session & Binary PUT
  await t.test('6. POST /api/careers/upload-session & Signed PUT — Genuine DOCX package upload succeeds', async () => {
    const docxBuf = createValidDocxBuffer();

    const sessReq = createMockRequest('http://localhost:3000/api/careers/upload-session', 'POST', {
      application_type: 'vacancy',
      vacancy_id: testVacancy.id,
      file_name: `cover_letter_${testRunId}.docx`,
      file_size: docxBuf.length,
      mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      file_kind: 'cover_letter'
    });

    const sessRes = await uploadSessionHandler(sessReq);
    const sessBody = await sessRes.json();

    assert.equal(sessRes.status, 200);
    assert.ok(sessBody.session_id);
    assert.ok(sessBody.session_token);

    validCoverSession = sessBody;
    cleanup.sessionIds.add(sessBody.session_id);
    if (sessBody.storage_path) cleanup.storagePaths.add(sessBody.storage_path);

    const putRes = await fetch(sessBody.signed_url, {
      method: 'PUT',
      body: docxBuf,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      }
    });

    assert.ok(putRes.ok, `DOCX PUT upload failed with status ${putRes.status}`);
  });

  // 7. Public Application Submission Validations (POST /api/careers/applications)
  await t.test('7. POST /api/careers/applications — Session security & binding validations', async () => {
    const basePayload = {
      application_type: 'vacancy',
      vacancy_id: testVacancy.id,
      _form_loaded_at: String(Date.now() - 5000),
      first_name: 'Jane',
      last_name: 'Candidate',
      email: `candidate.${testRunId}@example.com`,
      phone: '0412 345 678',
      suburb: 'Coffs Harbour',
      postcode: '2450',
      preferred_service_area_ids: ['coffs-coast'],
      employment_preferences: ['casual'],
      work_rights_status: 'citizen_pr',
      driver_licence_status: 'yes',
      vehicle_access_status: 'yes',
      ndiswc_status_declared: 'current',
      police_check_status_declared: 'current',
      first_aid_status_declared: 'current',
      cpr_status_declared: 'current',
      wwcc_status_declared: 'not_held',
      declaration_accurate_information: true,
      declaration_privacy_consent: true,
    };

    // 7a. Missing resume on vacancy application -> rejected (400)
    const noResumeReq = createMockRequest('http://localhost:3000/api/careers/applications', 'POST', {
      ...basePayload,
      resume_upload_session_id: null,
      resume_upload_session_token: null
    });
    const noResumeRes = await applicationsHandler(noResumeReq);
    assert.equal(noResumeRes.status, 400, 'Expected 400 when vacancy application has no resume');

    // 7b. Invalid session token -> rejected (400)
    const badTokenReq = createMockRequest('http://localhost:3000/api/careers/applications', 'POST', {
      ...basePayload,
      resume_upload_session_id: validResumeSession.session_id,
      resume_upload_session_token: 'invalid_secret_token_12345'
    });
    const badTokenRes = await applicationsHandler(badTokenReq);
    assert.equal(badTokenRes.status, 400, 'Expected 400 for invalid session token');

    // 7c. Wrong vacancy binding -> rejected (400 or 404)
    const wrongVacReq = createMockRequest('http://localhost:3000/api/careers/applications', 'POST', {
      ...basePayload,
      vacancy_id: crypto.randomUUID(),
      resume_upload_session_id: validResumeSession.session_id,
      resume_upload_session_token: validResumeSession.session_token
    });
    const wrongVacRes = await applicationsHandler(wrongVacReq);
    assert.ok([400, 404].includes(wrongVacRes.status), 'Expected 400 or 404 when upload session vacancy_id does not match application');
  });

  // 8. Successful Vacancy Application Submission
  let createdApplication = null;

  await t.test('8. POST /api/careers/applications — Submits valid vacancy application with resume & cover letter', async () => {
    const validPayload = {
      application_type: 'vacancy',
      vacancy_id: testVacancy.id,
      _form_loaded_at: String(Date.now() - 6000),
      first_name: 'Jane',
      last_name: 'Candidate',
      email: `candidate.${testRunId}@example.com`,
      phone: '0412 345 678',
      suburb: 'Coffs Harbour',
      postcode: '2450',
      preferred_service_area_ids: ['coffs-coast', 'clarence-valley'],
      employment_preferences: ['casual', 'part_time'],
      work_rights_status: 'citizen_pr',
      earliest_start_date: '2026-10-01',
      experience_summary: '5 years of experienced disability support across Northern NSW.',
      driver_licence_status: 'yes',
      vehicle_access_status: 'yes',
      ndiswc_status_declared: 'current',
      police_check_status_declared: 'current',
      first_aid_status_declared: 'current',
      cpr_status_declared: 'current',
      wwcc_status_declared: 'not_held',
      availability: {
        days: ['Monday', 'Wednesday', 'Friday'],
        periods: ['Morning', 'Daytime']
      },
      availability_notes: 'Available school hours and alternating weekends.',
      motivation: 'Dedicated to person-centred support.',
      declaration_accurate_information: true,
      declaration_privacy_consent: true,
      resume_upload_session_id: validResumeSession.session_id,
      resume_upload_session_token: validResumeSession.session_token,
      cover_letter_upload_session_id: validCoverSession.session_id,
      cover_letter_upload_session_token: validCoverSession.session_token
    };

    const req = createMockRequest('http://localhost:3000/api/careers/applications', 'POST', validPayload);
    const res = await applicationsHandler(req);
    const body = await res.json();

    assert.equal(res.status, 200, `Application submit failed with status ${res.status}: ${JSON.stringify(body)}`);
    assert.ok(body.ok, 'Expected ok: true');
    assert.ok(body.application_id, 'Expected application_id');
    assert.ok(body.reference_number?.startsWith('APP-2026-'), `Expected APP-2026-XXXXX reference, got ${body.reference_number}`);

    cleanup.applicationIds.add(body.application_id);

    // Fetch full application record from DB to verify fields & file records
    const { data: dbApp } = await supabase
      .from('job_applications')
      .select('*, job_application_files(*)')
      .eq('id', body.application_id)
      .single();

    assert.ok(dbApp, 'Application must exist in database');
    assert.equal(dbApp.stage, 'new');
    assert.equal(dbApp.first_name, 'Jane');
    assert.equal(dbApp.email, `candidate.${testRunId.toLowerCase()}@example.com`);
    assert.equal(dbApp.job_application_files?.length, 2, 'Expected 2 attached files (resume + cover letter)');

    for (const f of dbApp.job_application_files || []) {
      if (f.storage_path) cleanup.storagePaths.add(f.storage_path);
    }

    createdApplication = dbApp;
  });

  // 9. Replay Attack Prevention on Finalized Upload Session
  await t.test('9. POST /api/careers/applications — Replay attack with finalized upload session is rejected', async () => {
    const replayPayload = {
      application_type: 'vacancy',
      vacancy_id: testVacancy.id,
      _form_loaded_at: String(Date.now() - 5000),
      first_name: 'Attacker',
      last_name: 'Replay',
      email: `attacker.${testRunId}@example.com`,
      phone: '0400 000 000',
      suburb: 'Coffs Harbour',
      postcode: '2450',
      preferred_service_area_ids: ['coffs-coast'],
      employment_preferences: ['casual'],
      work_rights_status: 'citizen_pr',
      declaration_accurate_information: true,
      declaration_privacy_consent: true,
      resume_upload_session_id: validResumeSession.session_id,
      resume_upload_session_token: validResumeSession.session_token
    };

    const req = createMockRequest('http://localhost:3000/api/careers/applications', 'POST', replayPayload);
    const res = await applicationsHandler(req);
    assert.equal(res.status, 400, 'Expected 400 when replaying already finalized upload session');
  });

  // 10. EOI Submission Without Resume (POST /api/careers/applications)
  let eoiApplication = null;
  await t.test('10. POST /api/careers/applications — EOI without resume succeeds', async () => {
    const eoiPayload = {
      application_type: 'eoi',
      _form_loaded_at: String(Date.now() - 5000),
      first_name: 'Alex',
      last_name: 'EOIApplicant',
      email: `alex.eoi.${testRunId}@example.com`,
      phone: '0422 111 222',
      suburb: 'Grafton',
      postcode: '2460',
      role_interest: 'Disability Support Worker',
      preferred_service_area_ids: ['clarence-valley'],
      employment_preferences: ['casual', 'flexible'],
      work_rights_status: 'citizen_pr',
      declaration_accurate_information: true,
      declaration_privacy_consent: true,
      resume_upload_session_id: null,
      resume_upload_session_token: null
    };

    const req = createMockRequest('http://localhost:3000/api/careers/applications', 'POST', eoiPayload);
    const res = await applicationsHandler(req);
    const body = await res.json();

    assert.equal(res.status, 200, `EOI submission failed: ${JSON.stringify(body)}`);
    assert.ok(body.ok);
    assert.ok(body.application_id);
    assert.ok(body.reference_number?.startsWith('APP-2026-'));

    cleanup.applicationIds.add(body.application_id);
    eoiApplication = { id: body.application_id, reference_number: body.reference_number };
  });

  // 11. Admin CRM Routes — Retrieve, Filter, Update Stage
  await t.test('11. GET & PATCH /api/crm/recruitment/applications — Admin Pipeline Management', async () => {
    // 11a. GET applications list
    const getReq = createMockRequest('http://localhost:3000/api/crm/recruitment/applications', 'GET', null, adminAuthHeaders);
    const getRes = await getApplicationsHandler(getReq);
    const getBody = await getRes.json();

    assert.equal(getRes.status, 200);
    assert.ok(getBody.ok);
    assert.ok(Array.isArray(getBody.applications));
    assert.ok(getBody.kpis, 'Expected recruitment KPIs');

    // 11b. GET application detail [id]
    const detailReq = createMockRequest(`http://localhost:3000/api/crm/recruitment/applications/${createdApplication.id}`, 'GET', null, adminAuthHeaders);
    const detailRes = await getApplicationByIdHandler(detailReq, { params: Promise.resolve({ id: createdApplication.id }) });
    const detailBody = await detailRes.json();

    assert.equal(detailRes.status, 200);
    assert.ok(detailBody.ok);
    assert.equal(detailBody.application?.id, createdApplication.id);
    assert.ok(Array.isArray(detailBody.application?.files));
    assert.equal(detailBody.application?.files?.length, 2);

    // 11c. PATCH stage progression -> shortlisted -> interview -> offer
    for (const stage of ['shortlisted', 'interview', 'offer']) {
      const patchReq = createMockRequest(`http://localhost:3000/api/crm/recruitment/applications/${createdApplication.id}/stage`, 'PATCH', {
        stage,
        note: `Progressed candidate to ${stage} stage during automated test.`
      }, adminAuthHeaders);

      const patchRes = await patchApplicationStageHandler(patchReq, { params: Promise.resolve({ id: createdApplication.id }) });
      const patchBody = await patchRes.json();

      assert.equal(patchRes.status, 200, `PATCH stage to ${stage} failed`);
      assert.ok(patchBody.ok);
      assert.equal(patchBody.application?.stage, stage);
    }
  });

  // 12. Admin Candidate Hire Route (POST /api/crm/recruitment/applications/[id]/hire)
  let hiredStaffId = null;
  await t.test('12. POST /api/crm/recruitment/applications/[id]/hire — Requires explicit fields and creates staff', async () => {
    // 12a. Missing role_title -> rejected (400)
    const missingRoleReq = createMockRequest(`http://localhost:3000/api/crm/recruitment/applications/${createdApplication.id}/hire`, 'POST', {
      role_title: '',
      engagement_relationship: 'employee',
      employment_basis: 'casual',
      approved_service_areas: ['coffs-coast']
    }, adminAuthHeaders);
    const missingRoleRes = await postApplicationHireHandler(missingRoleReq, { params: Promise.resolve({ id: createdApplication.id }) });
    assert.equal(missingRoleRes.status, 400, 'Expected 400 when role_title is missing');

    // 12b. Missing engagement_relationship -> rejected (400)
    const missingRelReq = createMockRequest(`http://localhost:3000/api/crm/recruitment/applications/${createdApplication.id}/hire`, 'POST', {
      role_title: 'Support Worker',
      engagement_relationship: '',
      employment_basis: 'casual',
      approved_service_areas: ['coffs-coast']
    }, adminAuthHeaders);
    const missingRelRes = await postApplicationHireHandler(missingRelReq, { params: Promise.resolve({ id: createdApplication.id }) });
    assert.equal(missingRelRes.status, 400, 'Expected 400 when engagement_relationship is missing');

    // 12c. Missing service areas -> rejected (400)
    const missingAreasReq = createMockRequest(`http://localhost:3000/api/crm/recruitment/applications/${createdApplication.id}/hire`, 'POST', {
      role_title: 'Support Worker',
      engagement_relationship: 'employee',
      employment_basis: 'casual',
      approved_service_areas: []
    }, adminAuthHeaders);
    const missingAreasRes = await postApplicationHireHandler(missingAreasReq, { params: Promise.resolve({ id: createdApplication.id }) });
    assert.equal(missingAreasRes.status, 400, 'Expected 400 when approved_service_areas is empty');

    // 12d. Valid Explicit Hire
    const validHireReq = createMockRequest(`http://localhost:3000/api/crm/recruitment/applications/${createdApplication.id}/hire`, 'POST', {
      role_title: 'Disability Support Worker',
      engagement_relationship: 'employee',
      employment_basis: 'casual',
      employment_start_date: '2026-10-01',
      approved_service_areas: ['coffs-coast', 'clarence-valley']
    }, adminAuthHeaders);

    const validHireRes = await postApplicationHireHandler(validHireReq, { params: Promise.resolve({ id: createdApplication.id }) });
    const hireBody = await validHireRes.json();

    assert.equal(validHireRes.status, 200, `Hire execution failed with status ${validHireRes.status}: ${JSON.stringify(hireBody)}`);
    assert.ok(hireBody.ok);
    assert.ok(hireBody.staff_id, 'Expected staff_id');
    assert.ok(hireBody.staff_reference?.startsWith('STF-'), `Expected STF-XXXXX, got ${hireBody.staff_reference}`);

    hiredStaffId = hireBody.staff_id;
    cleanup.staffIds.add(hiredStaffId);

    // Verify staff record in database with fail-closed governance status
    const { data: staffRec } = await supabase.from('staff').select('*').eq('id', hiredStaffId).single();
    assert.ok(staffRec, 'Staff record must exist in database');
    assert.equal(staffRec.status, 'pending', 'New hire must have status: pending');
    assert.equal(staffRec.lifecycle_stage, 'onboarding', 'New hire must have lifecycle_stage: onboarding');
    assert.equal(staffRec.is_rosterable, false, 'New hire must have is_rosterable: false');
  });

  // 13. Application Purge Restricted to Unsuccessful / Withdrawn
  await t.test('13. DELETE /api/crm/recruitment/applications/[id] — Purge restrictions & privacy redaction', async () => {
    // 13a. Attempting to purge HIRED candidate -> rejected (400)
    const purgeHiredReq = createMockRequest(`http://localhost:3000/api/crm/recruitment/applications/${createdApplication.id}`, 'DELETE', {
      confirm_purge: true,
      purge_reason: 'Testing purge rejection on hired candidate'
    }, adminAuthHeaders);

    const purgeHiredRes = await deleteApplicationHandler(purgeHiredReq, { params: Promise.resolve({ id: createdApplication.id }) });
    assert.equal(purgeHiredRes.status, 400, 'Expected 400 when attempting to purge hired candidate');

    // 13b. Progress EOI application to 'unsuccessful' stage
    await patchApplicationStageHandler(
      createMockRequest(`http://localhost:3000/api/crm/recruitment/applications/${eoiApplication.id}/stage`, 'PATCH', {
        stage: 'unsuccessful',
        note: 'Candidate not suitable for current capacity.'
      }, adminAuthHeaders),
      { params: Promise.resolve({ id: eoiApplication.id }) }
    );

    // 13c. Purge unsuccessful candidate -> succeeds with governed PII redaction
    const purgeEoiReq = createMockRequest(`http://localhost:3000/api/crm/recruitment/applications/${eoiApplication.id}`, 'DELETE', {
      confirm_purge: true,
      purge_reason: 'Retention expired / applicant privacy redaction'
    }, adminAuthHeaders);

    const purgeEoiRes = await deleteApplicationHandler(purgeEoiReq, { params: Promise.resolve({ id: eoiApplication.id }) });
    const purgeBody = await purgeEoiRes.json();

    assert.equal(purgeEoiRes.status, 200, `Purge failed: ${JSON.stringify(purgeBody)}`);
    assert.ok(purgeBody.ok);

    // Verify PII redaction in database
    const { data: redactedDbApp } = await supabase
      .from('job_applications')
      .select('*')
      .eq('id', eoiApplication.id)
      .single();

    assert.ok(redactedDbApp, 'Redacted application row remains');
    assert.equal(redactedDbApp.first_name, '[REDACTED]');
    assert.equal(redactedDbApp.last_name, '[REDACTED]');
    assert.equal(redactedDbApp.phone, '[REDACTED]');
    assert.ok(redactedDbApp.purged_at, 'Expected purged_at timestamp');

    // 13d. Filter check: GET applications list excludes purged applications
    const listReq = createMockRequest('http://localhost:3000/api/crm/recruitment/applications', 'GET', null, adminAuthHeaders);
    const listRes = await getApplicationsHandler(listReq);
    const listBody = await listRes.json();

    const purgedFound = listBody.applications.find(a => a.id === eoiApplication.id);
    assert.equal(purgedFound, undefined, 'Purged application must NOT be returned in active applications list');
  });

  // 14. Provider Settings Save & Readback Verification
  await t.test('14. Provider Settings Save & Readback Verification', async () => {
    const saveReq = createMockRequest('http://localhost:3000/api/crm/provider-config', 'POST', {
      careers_email: 'careers-test@opuscare.com.au',
      recruitment_retention_months: 18
    }, adminAuthHeaders);

    const saveRes = await postProviderConfigHandler(saveReq);
    assert.equal(saveRes.status, 200);

    const readbackReq = createMockRequest('http://localhost:3000/api/crm/provider-config', 'GET', null, adminAuthHeaders);
    const readbackRes = await getProviderConfigHandler(readbackReq);
    const readbackBody = await readbackRes.json();

    assert.equal(readbackRes.status, 200);
    assert.equal(readbackBody.careers_email, 'careers-test@opuscare.com.au');
    assert.equal(readbackBody.recruitment_retention_months, 18);
  });

  // 15. Anonymous Access Rejection (401) on Admin Routes
  await t.test('15. Security: Anonymous requests to CRM recruitment routes return 401', async () => {
    const anonReq = createMockRequest('http://localhost:3000/api/crm/recruitment/vacancies', 'GET');
    const anonRes = await getVacanciesHandler(anonReq);
    assert.equal(anonRes.status, 401, 'Expected 401 for anonymous access to vacancies');

    const anonAppReq = createMockRequest('http://localhost:3000/api/crm/recruitment/applications', 'GET');
    const anonAppRes = await getApplicationsHandler(anonAppReq);
    assert.equal(anonAppRes.status, 401, 'Expected 401 for anonymous access to applications');
  });
});
