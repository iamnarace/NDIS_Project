import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function readProjectFile(relPath) {
  return fs.readFileSync(path.join(rootDir, relPath), 'utf8');
}

function fileExists(relPath) {
  return fs.existsSync(path.join(rootDir, relPath));
}

// ---------------------------------------------------------------------------
// 1. Static Navigation & Interface Integration
// ---------------------------------------------------------------------------
test('Governance & Compliance — Careers & Recruitment Navigation & Profile', async (t) => {
  await t.test('SiteHeader includes Careers in navigation menu', () => {
    const content = readProjectFile('components/SiteHeader.tsx');
    assert.ok(content.includes('/careers'), 'SiteHeader must contain link to /careers');
    assert.ok(content.includes('Careers'), "SiteHeader must contain 'Careers' label");
  });

  await t.test('SiteFooter includes Careers link right after About Opus Care', () => {
    const content = readProjectFile('components/SiteFooter.tsx');
    assert.ok(content.includes('href="/careers"'), 'SiteFooter must contain link to /careers');
    assert.ok(content.includes('>Careers<'), "SiteFooter must contain 'Careers' text");
  });

  await t.test('regions.ts defines Northern NSW and Sydney recruitment service areas', () => {
    const content = readProjectFile('lib/regions.ts');
    assert.ok(content.includes('RECRUITMENT_SERVICE_AREAS'), 'Must export RECRUITMENT_SERVICE_AREAS');
    assert.ok(content.includes('getRecruitmentAreaName'), 'Must export getRecruitmentAreaName helper');

    // Verify every current canonical region ID is present
    const canonicalRegionIds = [
      'coffs-coast',
      'clarence-valley',
      'maclean-yamba',
      'richmond-valley',
      'lismore-region',
      'ballina-northern-rivers',
      'western-sydney',
      'blacktown',
      'parramatta',
      'sydney-cbd-redfern',
      'sydney-surrounding'
    ];
    for (const regionId of canonicalRegionIds) {
      assert.ok(content.includes(`'${regionId}'`), `RECRUITMENT_SERVICE_AREAS must include '${regionId}'`);
    }
  });

  await t.test('organisation.ts includes careersEmail and recruitmentRetentionMonths', () => {
    const content = readProjectFile('lib/organisation.ts');
    assert.ok(content.includes('careersEmail'), 'OrganisationProfile must have careersEmail');
    assert.ok(content.includes('recruitmentRetentionMonths'), 'OrganisationProfile must have recruitmentRetentionMonths');
    assert.ok(content.includes('ADMIN_EMAIL'), 'Careers email must use the central administration address');
  });

  await t.test('CRM operational email is consistently admin@opuscare.com.au', () => {
    const addressModule = readProjectFile('lib/emailAddresses.ts');
    const emailService = readProjectFile('lib/email.ts');
    const inboundRoute = readProjectFile('app/api/email/inbound/route.ts');
    const quoteRoute = readProjectFile('app/api/billing/quotes/[id]/send/route.ts');
    const invoiceRoute = readProjectFile('app/api/billing/invoices/[id]/send/route.ts');
    const agreementService = readProjectFile('lib/services/agreementExecution.ts');

    assert.match(addressModule, /ADMIN_EMAIL\s*=\s*'admin@opuscare\.com\.au'/);
    assert.match(emailService, /const DEFAULT_FROM = ADMIN_FROM/);
    assert.match(emailService, /const REFERRAL_EMAIL = ADMIN_EMAIL/);
    assert.match(emailService, /const CONTACT_EMAIL = ADMIN_EMAIL/);
    assert.match(emailService, /const CAREERS_DEFAULT_EMAIL = ADMIN_EMAIL/);
    assert.match(inboundRoute, /allowedRecipients[\s\S]*ADMIN_EMAIL/);
    assert.match(quoteRoute, /from: ADMIN_FROM[\s\S]*replyTo: ADMIN_EMAIL/);
    assert.match(invoiceRoute, /from: ADMIN_FROM[\s\S]*replyTo: ADMIN_EMAIL/);
    assert.match(agreementService, /signerEmail = 'admin@opuscare\.com\.au'/);
  });
});

// ---------------------------------------------------------------------------
// 2. File Validation & Magic Byte Security Checks
// ---------------------------------------------------------------------------
test('File Upload Security — Magic Bytes & Size Limits', async (t) => {
  const { validateCandidateFile } = await import('../lib/recruitmentFileValidation.ts');

  function makeMockFile(buf, name, type) {
    return {
      name,
      size: buf.length,
      type: type || 'application/octet-stream',
      arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
    };
  }

  await t.test('Accepts valid PDF with %PDF- magic bytes', async () => {
    const pdfBuf = Buffer.from('%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');
    const result = await validateCandidateFile(makeMockFile(pdfBuf, 'resume.pdf', 'application/pdf'), 'resume');
    assert.equal(result.valid, true);
    assert.equal(result.canonicalMime, 'application/pdf');
  });

  await t.test('Accepts valid DOCX with genuine ZIP structure containing Office entries', async () => {
    // Build a minimal genuine ZIP file with [Content_Types].xml and word/document.xml entries
    function buildMinimalZip(entries) {
      const localHeaders = [];
      const centralHeaders = [];
      let offset = 0;

      for (const name of entries) {
        const nameBytes = Buffer.from(name, 'utf8');
        const content = Buffer.from('', 'utf8');

        // Local file header
        const local = Buffer.alloc(30 + nameBytes.length + content.length);
        local.writeUInt32LE(0x04034b50, 0); // PK\x03\x04
        local.writeUInt16LE(20, 4);          // version needed
        local.writeUInt16LE(0, 6);           // flags
        local.writeUInt16LE(0, 8);           // compression
        local.writeUInt16LE(0, 10);          // mod time
        local.writeUInt16LE(0, 12);          // mod date
        local.writeUInt32LE(0, 14);          // crc32
        local.writeUInt32LE(content.length, 18); // compressed size
        local.writeUInt32LE(content.length, 22); // uncompressed size
        local.writeUInt16LE(nameBytes.length, 26); // name length
        local.writeUInt16LE(0, 28);          // extra length
        nameBytes.copy(local, 30);
        content.copy(local, 30 + nameBytes.length);
        localHeaders.push(local);

        // Central directory header
        const central = Buffer.alloc(46 + nameBytes.length);
        central.writeUInt32LE(0x02014b50, 0); // PK\x01\x02
        central.writeUInt16LE(20, 4);
        central.writeUInt16LE(20, 6);
        central.writeUInt16LE(0, 8);
        central.writeUInt16LE(0, 10);
        central.writeUInt16LE(0, 12);
        central.writeUInt16LE(0, 14);
        central.writeUInt32LE(0, 16);
        central.writeUInt32LE(content.length, 20);
        central.writeUInt32LE(content.length, 24);
        central.writeUInt16LE(nameBytes.length, 28);
        central.writeUInt16LE(0, 30);
        central.writeUInt16LE(0, 32);
        central.writeUInt16LE(0, 34);
        central.writeUInt16LE(0, 36);
        central.writeUInt32LE(0, 38);
        central.writeUInt32LE(offset, 42);
        nameBytes.copy(central, 46);
        centralHeaders.push(central);

        offset += local.length;
      }

      const cdOffset = offset;
      const cdBuf = Buffer.concat(centralHeaders);
      const cdSize = cdBuf.length;

      // EOCD
      const eocd = Buffer.alloc(22);
      eocd.writeUInt32LE(0x06054b50, 0);
      eocd.writeUInt16LE(0, 4);
      eocd.writeUInt16LE(0, 6);
      eocd.writeUInt16LE(entries.length, 8);
      eocd.writeUInt16LE(entries.length, 10);
      eocd.writeUInt32LE(cdSize, 12);
      eocd.writeUInt32LE(cdOffset, 16);
      eocd.writeUInt16LE(0, 20);

      return Buffer.concat([...localHeaders, cdBuf, eocd]);
    }

    const docxBuf = buildMinimalZip(['[Content_Types].xml', 'word/document.xml', 'word/styles.xml']);
    const result = await validateCandidateFile(makeMockFile(docxBuf, 'cv.docx'), 'resume');
    assert.equal(result.valid, true);
    assert.equal(result.canonicalMime, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  });

  await t.test('Rejects PK header with literal Office filenames in text but malformed ZIP structure', async () => {
    // This has the PK magic bytes but no valid local file headers or central directory
    const pkHeader = Buffer.from([0x50, 0x4B, 0x03, 0x04, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]);
    const fakeText = Buffer.from('[Content_Types].xml word/document.xml word/ fake structure');
    const malformedBuf = Buffer.concat([pkHeader, fakeText]);
    const result = await validateCandidateFile(makeMockFile(malformedBuf, 'fake.docx'), 'resume');
    assert.equal(result.valid, false);
    assert.ok(result.error.toLowerCase().includes('zip') || result.error.toLowerCase().includes('package'));
  });

  await t.test('Rejects generic zip renamed to .docx without Word document structures', async () => {
    const genericZip = Buffer.from([0x50, 0x4B, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00, 0x00, 0x00, 0x66, 0x69, 0x6C, 0x65, 0x2E, 0x74, 0x78, 0x74]);
    const result = await validateCandidateFile(makeMockFile(genericZip, 'renamed_archive.docx'), 'resume');
    assert.equal(result.valid, false);
    assert.ok(result.error.toLowerCase().includes('word') || result.error.toLowerCase().includes('package'));
  });

  await t.test('Accepts valid legacy DOC with OLE compound header bytes', async () => {
    const docBuf = Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1, 0x00, 0x00]);
    const result = await validateCandidateFile(makeMockFile(docBuf, 'old_cv.doc'), 'resume');
    assert.equal(result.valid, true);
    assert.equal(result.canonicalMime, 'application/msword');
  });

  await t.test('Rejects executable file disguised as PDF (MZ header)', async () => {
    const exeDisguised = Buffer.from('MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff');
    const result = await validateCandidateFile(makeMockFile(exeDisguised, 'malicious.pdf'), 'resume');
    assert.equal(result.valid, false);
    assert.ok(result.error.toLowerCase().includes('executable') || result.error.toLowerCase().includes('invalid') || result.error.toLowerCase().includes('prohibited'));
  });

  await t.test('Rejects ELF binary disguised as DOCX', async () => {
    const elfDisguised = Buffer.from('\x7fELF\x02\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00');
    const result = await validateCandidateFile(makeMockFile(elfDisguised, 'exploit.docx'), 'resume');
    assert.equal(result.valid, false);
    assert.ok(result.error.toLowerCase().includes('executable') || result.error.toLowerCase().includes('invalid') || result.error.toLowerCase().includes('prohibited'));
  });

  await t.test('Rejects oversized resume (>8MB) and oversized cover letter (>5MB)', async () => {
    const hugeResume = Buffer.alloc(9 * 1024 * 1024);
    hugeResume.write('%PDF-1.4');
    const resumeRes = await validateCandidateFile(makeMockFile(hugeResume, 'huge.pdf'), 'resume');
    assert.equal(resumeRes.valid, false);
    assert.ok(resumeRes.error.includes('8MB'));

    const hugeCover = Buffer.alloc(6 * 1024 * 1024);
    hugeCover.write('%PDF-1.4');
    const coverRes = await validateCandidateFile(makeMockFile(hugeCover, 'cover.pdf'), 'cover_letter');
    assert.equal(coverRes.valid, false);
    assert.ok(coverRes.error.includes('5MB'));
  });
});

// ---------------------------------------------------------------------------
// 3. Vacancy Publication Validation & Opening Gates
// ---------------------------------------------------------------------------
test('Vacancy Governance — Publication Rules & Opening Gates', async (t) => {
  const { validateVacancyForPublication, isVacancyCurrentlyOpen } = await import('../lib/recruitmentValidation.ts');

  await t.test('Rejects publication of incomplete vacancy (missing short summary / criteria)', () => {
    const incomplete = {
      title: 'Support Worker',
      category: 'Disability Support',
      employment_basis: ['casual'],
      engagement_relationship: 'employee',
      short_summary: 'Too short',
      about_role: 'Brief text',
      essential_criteria: [],
      service_area_ids: ['coffs-coast'],
      positions_count: 1
    };
    const res = validateVacancyForPublication(incomplete);
    assert.equal(res.valid, false);
    assert.ok(res.errors.length >= 1);
  });

  await t.test('Accepts publication of fully specified vacancy', () => {
    const complete = {
      title: 'Disability Support Worker',
      category: 'Direct Support',
      employment_basis: ['casual', 'part_time'],
      engagement_relationship: 'employee',
      short_summary: 'Provide respectful person-centred disability support across the Coffs Coast region.',
      about_role: 'Opus Care is seeking dedicated Support Workers to join our community support team. You will assist participants with daily living activities, community access and capacity building.',
      responsibilities: ['Support participants with daily life tasks'],
      essential_criteria: ['Current Australian Drivers Licence', 'NDIS Worker Screening Clearance'],
      service_area_ids: ['coffs-coast'],
      positions_count: 2
    };
    const res = validateVacancyForPublication(complete);
    assert.equal(res.valid, true);
    assert.equal(res.errors.length, 0);
  });

  await t.test('Correctly identifies future opens_at as not yet open', () => {
    const futureDate = new Date(Date.now() + 86400000 * 7).toISOString();
    const futureVacancy = {
      status: 'published',
      opens_at: futureDate,
      closes_at: null
    };
    const isOpen = isVacancyCurrentlyOpen(futureVacancy);
    assert.equal(isOpen, false);
  });

  await t.test('Correctly identifies past closes_at as closed', () => {
    const pastDate = new Date(Date.now() - 86400000 * 2).toISOString();
    const closedVacancy = {
      status: 'published',
      opens_at: null,
      closes_at: pastDate
    };
    const isOpen = isVacancyCurrentlyOpen(closedVacancy);
    assert.equal(isOpen, false);
  });

  await t.test('Identifies active published vacancy as open', () => {
    const openVacancy = {
      status: 'published',
      opens_at: null,
      closes_at: null
    };
    const isOpen = isVacancyCurrentlyOpen(openVacancy);
    assert.equal(isOpen, true);
  });
});

// ---------------------------------------------------------------------------
// 4. Reference Number Generation (Yearly Formats)
// ---------------------------------------------------------------------------
test('Reference Number Formatting — Yearly Prefixes', async (t) => {
  const { getSydneyYear } = await import('../lib/referenceNumber.ts');

  await t.test('getSydneyYear returns current calendar year', () => {
    const year = getSydneyYear();
    assert.ok(year >= 2026, 'Year must be current or future');
  });

  await t.test('referenceNumber.ts supports APP and JOB yearly patterns', () => {
    const content = readProjectFile('lib/referenceNumber.ts');
    assert.ok(content.includes('nextYearlyReferenceNumber'), 'Must export nextYearlyReferenceNumber');
    assert.ok(content.includes('getSydneyYear'), 'Must export getSydneyYear');
  });
});

// ---------------------------------------------------------------------------
// 5. Privacy & Neutral Declaration Form Design
// ---------------------------------------------------------------------------
test('Governance & Compliance — Careers Privacy Boundary & Neutral Declarations', async (t) => {
  await t.test('CareersApplicationForm starts declaration radios in neutral unselected state', () => {
    const formContent = readProjectFile('components/careers/CareersApplicationForm.tsx');
    assert.ok(formContent.includes("driver_licence_status: ''"), 'Driver licence initial state must be empty string');
    assert.ok(formContent.includes("vehicle_access_status: ''"), 'Vehicle access initial state must be empty string');
    assert.ok(formContent.includes("ndiswc_status_declared: ''"), 'NDISWC initial state must be empty string');
    assert.ok(formContent.includes("police_check_status_declared: ''"), 'Police check initial state must be empty string');
    assert.ok(formContent.includes("first_aid_status_declared: ''"), 'First aid initial state must be empty string');
    assert.ok(formContent.includes("cpr_status_declared: ''"), 'CPR initial state must be empty string');
    assert.ok(formContent.includes("role_interest: ''"), 'EOI role_interest initial state must be empty string');
  });

  await t.test('Careers form includes anti-bot honeypot and timing checks', () => {
    const formContent = readProjectFile('components/careers/CareersApplicationForm.tsx');
    const apiContent = readProjectFile('app/api/careers/applications/route.ts');
    assert.ok(formContent.includes('website_url') || formContent.includes('_website_hp') || formContent.includes('_honeypot'), 'Form has honeypot');
    assert.ok(apiContent.includes('_form_loaded_at') || apiContent.includes('submitted too quickly'), 'API checks submission timing');
  });

  await t.test('Expression of Interest uses a compact enquiry while vacancy applications keep full workflow', () => {
    const formContent = readProjectFile('components/careers/CareersApplicationForm.tsx');
    assert.ok(formContent.includes("if (applicationType === 'eoi')"), 'EOI must have a dedicated compact rendering path');
    assert.ok(formContent.includes('Share the essentials now.'), 'EOI must explain its short initial collection boundary');
    assert.ok(formContent.includes('Attach resume (optional)'), 'EOI resume must remain optional');
    assert.ok(formContent.includes('Apply for: {vacancyTitle'), 'Vacancy applications must retain the detailed application workflow');
    assert.ok(!formContent.includes('Expression of Interest — Your Contact Details'), 'Old EOI form heading must be removed');
  });

  await t.test('Public careers page keeps Expression of Interest as the primary experience', () => {
    const pageContent = readProjectFile('app/careers/page.tsx');
    assert.ok(pageContent.includes('careersEoiPrimary'), 'EOI section must remain the primary careers content');
    assert.ok(pageContent.includes('careersCompactFacts'), 'Essential recruitment context must remain available in compact form');
    assert.ok(pageContent.includes('careersCompactOpportunities'), 'Current vacancies must remain visible');
    assert.ok(!pageContent.includes('RECRUITMENT JOURNEY'), 'Long recruitment journey section must stay removed');
    assert.ok(!pageContent.includes('COMPLIANCE &amp; SAFETY'), 'Long compliance section must stay removed');
    assert.ok(!pageContent.includes('OUR CULTURE &amp; VALUES'), 'Long values section must stay removed');
  });

  await t.test('Careers form and API strictly exclude TFN and bank account details', () => {
    const formContent = readProjectFile('components/careers/CareersApplicationForm.tsx');
    const apiContent = readProjectFile('app/api/careers/applications/route.ts');

    assert.ok(!formContent.includes('taxFileNumber') && !formContent.includes('tfn'), 'Application form must not collect TFN');
    assert.ok(!formContent.includes('bankAccountNumber') && !formContent.includes('bsb'), 'Application form must not collect bank details');
    assert.ok(!apiContent.includes('tax_file_number'), 'API route must not accept tax_file_number');
    assert.ok(!apiContent.includes('bank_account_number'), 'API route must not accept bank_account_number');
  });
});

// ---------------------------------------------------------------------------
// 6. Stage Transition Control & Atomic Hire Workflow
// ---------------------------------------------------------------------------
test('Recruitment CRM — Stage Control & Atomic Hire RPC', async (t) => {
  await t.test('Stage transition route rejects direct transition to hired', () => {
    const stageRoute = readProjectFile('app/api/crm/recruitment/applications/[id]/stage/route.ts');
    assert.ok(stageRoute.includes("toStage === 'hired'"), 'Must check for direct hired stage transition');
    assert.ok(stageRoute.includes('Use Hire Candidate to complete the worker handoff'), 'Must return specific error message');
    assert.ok(stageRoute.includes("currentApp.stage === 'hired'"), 'Must protect already hired applications');
  });

  await t.test('Hire route delegates to atomic Postgres RPC governance_recruitment_hire_candidate', () => {
    const hireRoute = readProjectFile('app/api/crm/recruitment/applications/[id]/hire/route.ts');
    assert.ok(hireRoute.includes('governance_recruitment_hire_candidate'), 'Must invoke atomic RPC');
    assert.ok(hireRoute.includes('duplicate_found'), 'Handles duplicate staff detection from RPC');
    assert.ok(hireRoute.includes('worker_360_url') || hireRoute.includes('/admin?tab=staff'), 'Returns worker 360 handoff URL');
  });

  await t.test('Migration 20260915200000_careers_acceptance_fixes.sql defines atomic hire RPC with fail-closed safeguards', () => {
    const sql = readProjectFile('supabase/migrations/20260915200000_careers_acceptance_fixes.sql');
    assert.ok(sql.includes('governance_recruitment_hire_candidate'), 'Must define RPC function');
    assert.ok(sql.includes('SECURITY DEFINER'), 'RPC must be SECURITY DEFINER');
    assert.ok(sql.includes('SET search_path = public'), 'RPC must set secure search_path');
    assert.ok(sql.includes("'pending'"), "New staff must have status: 'pending'");
    assert.ok(sql.includes("'onboarding'"), "New staff must have lifecycle_stage: 'onboarding'");
    assert.ok(sql.includes('is_rosterable') && sql.includes('false'), 'New staff must have is_rosterable: false');
    assert.ok(sql.includes('staff_reference_seq'), 'Must create staff reference sequence');
    assert.ok(sql.includes('role_interest'), 'Must add role_interest columns to job_applications');
  });
});

// ---------------------------------------------------------------------------
// 7. On-Demand Document Download Endpoint
// ---------------------------------------------------------------------------
test('Recruitment CRM — On-Demand Secure Document Access', async (t) => {
  await t.test('Candidate detail GET endpoint returns file metadata without pre-signed URLs', () => {
    const appDetailRoute = readProjectFile('app/api/crm/recruitment/applications/[id]/route.ts');
    assert.ok(appDetailRoute.includes('filesMetadata') || !appDetailRoute.includes('createSignedUrl'), 'Detail route must not generate presigned URLs on load');
  });

  await t.test('Dedicated file route generates secure short-lived download link on demand', () => {
    const fileRoute = readProjectFile('app/api/crm/recruitment/applications/[id]/files/[fileId]/route.ts');
    assert.ok(fileRoute.includes('createSignedUrl'), 'File endpoint generates signed URL on demand');
    assert.ok(fileRoute.includes('isAuthenticatedAdmin'), 'File endpoint enforces admin auth');
  });
});

// ---------------------------------------------------------------------------
// 8. Provider Config Singleton Updates
// ---------------------------------------------------------------------------
test('Provider Configuration — Singleton Update Integrity', async (t) => {
  await t.test('Provider config POST updates existing singleton row rather than creating duplicates', () => {
    const route = readProjectFile('app/api/crm/provider-config/route.ts');
    assert.ok(route.includes('existingRow') || route.includes('targetId'), 'Must resolve existing singleton row ID');
    assert.ok(route.includes('.update(updates)'), 'Must perform update on target ID');
  });
});

// ---------------------------------------------------------------------------
// 9. Public Careers & Admin Route Coverage
// ---------------------------------------------------------------------------
test('Endpoint Architecture — Complete Public and Admin Routes', async (t) => {
  const requiredRoutes = [
    'app/careers/page.tsx',
    'app/careers/[slug]/page.tsx',
    'app/api/careers/vacancies/route.ts',
    'app/api/careers/vacancies/[slug]/route.ts',
    'app/api/careers/applications/route.ts',
    'app/api/careers/apply/route.ts',
    'app/api/crm/recruitment/vacancies/route.ts',
    'app/api/crm/recruitment/vacancies/[id]/route.ts',
    'app/api/crm/recruitment/applications/route.ts',
    'app/api/crm/recruitment/applications/[id]/route.ts',
    'app/api/crm/recruitment/applications/[id]/stage/route.ts',
    'app/api/crm/recruitment/applications/[id]/notes/route.ts',
    'app/api/crm/recruitment/applications/[id]/files/[fileId]/route.ts',
    'app/api/crm/recruitment/applications/[id]/interviews/route.ts',
    'app/api/crm/recruitment/applications/[id]/references/route.ts',
    'app/api/crm/recruitment/applications/[id]/hire/route.ts',
    'app/api/admin/recruitment/vacancies/route.ts',
    'app/api/admin/recruitment/vacancies/[id]/route.ts',
    'app/api/admin/recruitment/applications/route.ts',
    'app/api/admin/recruitment/applications/[id]/route.ts',
    'app/api/admin/recruitment/applications/[id]/stage/route.ts',
    'app/api/admin/recruitment/applications/[id]/notes/route.ts',
    'app/api/admin/recruitment/applications/[id]/files/[fileId]/route.ts',
    'app/api/admin/recruitment/applications/[id]/interviews/route.ts',
    'app/api/admin/recruitment/applications/[id]/references/route.ts',
    'app/api/admin/recruitment/applications/[id]/hire/route.ts',
  ];

  for (const r of requiredRoutes) {
    await t.test(`Verified route file exists: ${r}`, () => {
      assert.ok(fileExists(r), `Missing expected file: ${r}`);
    });
  }
});
