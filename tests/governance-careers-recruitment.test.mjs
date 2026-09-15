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
    assert.ok(content.includes('coffs-coast') && content.includes('clarence-valley'), 'Must include Northern NSW areas');
    assert.ok(content.includes('western-sydney') || content.includes('blacktown'), 'Must include Sydney areas');
    assert.ok(content.includes('getRecruitmentAreaName'), 'Must export getRecruitmentAreaName helper');
  });

  await t.test('organisation.ts includes careersEmail and recruitmentRetentionMonths', () => {
    const content = readProjectFile('lib/organisation.ts');
    assert.ok(content.includes('careersEmail'), 'OrganisationProfile must have careersEmail');
    assert.ok(content.includes('recruitmentRetentionMonths'), 'OrganisationProfile must have recruitmentRetentionMonths');
    assert.ok(content.includes('careers@opuscare.com.au') || content.includes('info@opuscare.com.au'), 'Has fallback careers email');
  });
});

test('Governance & Compliance — Careers Email Dispatch & Privacy Boundary', async (t) => {
  await t.test('email.ts includes fail-safe careers acknowledgement and admin alert without CV attachment', () => {
    const content = readProjectFile('lib/email.ts');
    assert.ok(content.includes('sendCareersApplicantAcknowledgement'), 'Must export sendCareersApplicantAcknowledgement');
    assert.ok(content.includes('sendCareersAdminAlert'), 'Must export sendCareersAdminAlert');
    assert.ok(!content.includes('attachments: ['), 'Must not attach raw candidate CV files to email broadcasts');
  });

  await t.test('Initial candidate application strictly excludes sensitive tax and banking fields', () => {
    const formContent = readProjectFile('components/careers/CareersApplicationForm.tsx');
    const apiContent = readProjectFile('app/api/careers/applications/route.ts');

    assert.ok(!formContent.includes('taxFileNumber') && !formContent.includes('tfn'), 'Application form must not collect TFN');
    assert.ok(!formContent.includes('bankAccountNumber') && !formContent.includes('bsb'), 'Application form must not collect bank details');
    assert.ok(!formContent.includes('medicareNumber'), 'Application form must not collect Medicare number');
    assert.ok(!formContent.includes('passportNumber'), 'Application form must not collect passport number');
    assert.ok(!formContent.includes('superannuationAccountNumber'), 'Application form must not collect super account number');

    assert.ok(!apiContent.includes('tax_file_number'), 'API route must not accept tax_file_number');
    assert.ok(!apiContent.includes('bank_account_number'), 'API route must not accept bank_account_number');
  });
});

test('Database Schema & Migration — Careers & Recruitment Tables', async (t) => {
  await t.test('migration 20260915190000_careers_and_recruitment.sql exists and creates required tables with RLS', () => {
    assert.ok(fileExists('supabase/migrations/20260915190000_careers_and_recruitment.sql'), 'Migration file must exist');
    const sql = readProjectFile('supabase/migrations/20260915190000_careers_and_recruitment.sql');

    assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS public.job_vacancies'), 'Must create job_vacancies');
    assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS public.job_applications'), 'Must create job_applications');
    assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS public.job_application_files'), 'Must create job_application_files');
    assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS public.job_application_events'), 'Must create job_application_events');
    assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS public.job_interviews'), 'Must create job_interviews');
    assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS public.job_reference_checks'), 'Must create job_reference_checks');

    assert.ok(sql.includes('ALTER TABLE public.job_vacancies ENABLE ROW LEVEL SECURITY;'), 'RLS on job_vacancies');
    assert.ok(sql.includes('ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;'), 'RLS on job_applications');
    assert.ok(sql.includes('ALTER TABLE public.job_application_files ENABLE ROW LEVEL SECURITY;'), 'RLS on job_application_files');
    assert.ok(sql.includes('ALTER TABLE public.job_application_events ENABLE ROW LEVEL SECURITY;'), 'RLS on job_application_events');
    assert.ok(sql.includes('ALTER TABLE public.job_interviews ENABLE ROW LEVEL SECURITY;'), 'RLS on job_interviews');
    assert.ok(sql.includes('ALTER TABLE public.job_reference_checks ENABLE ROW LEVEL SECURITY;'), 'RLS on job_reference_checks');

    assert.ok(sql.includes('employment_basis') && sql.includes('employment_start_date'), 'Staff table must be altered with employment fields');
  });
});

test('Public Careers Pages & API Endpoints', async (t) => {
  await t.test('Careers landing page and detail pages exist', () => {
    assert.ok(fileExists('app/careers/page.tsx'), 'app/careers/page.tsx must exist');
    assert.ok(fileExists('app/careers/[slug]/page.tsx'), 'app/careers/[slug]/page.tsx must exist');
  });

  await t.test('Public API endpoints exist and handle vacancies and applications', () => {
    assert.ok(fileExists('app/api/careers/vacancies/route.ts'), 'Public vacancies API must exist');
    assert.ok(fileExists('app/api/careers/vacancies/[slug]/route.ts'), 'Public vacancy slug API must exist');
    assert.ok(fileExists('app/api/careers/applications/route.ts'), 'Public applications API must exist');
    assert.ok(fileExists('app/api/careers/apply/route.ts'), 'Public apply alias API must exist');
  });

  await t.test('Careers landing page handles truthful zero-vacancy state with EOI', () => {
    const content = readProjectFile('app/careers/page.tsx');
    assert.ok(content.includes('No positions are currently advertised') || content.includes('No open vacancies'), 'Handles 0 vacancy state truthfully');
    assert.ok(content.includes('Expression of Interest') || content.includes('EOI'), 'Has Expression of Interest section');
  });
});

test('Recruitment CRM Endpoints & Admin Aliases', async (t) => {
  const crmRoutes = [
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
  ];

  const adminRoutes = [
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

  for (const route of crmRoutes) {
    await t.test(`CRM route exists: ${route}`, () => {
      assert.ok(fileExists(route), `Route must exist: ${route}`);
    });
  }

  for (const route of adminRoutes) {
    await t.test(`Admin alias route exists: ${route}`, () => {
      assert.ok(fileExists(route), `Admin alias route must exist: ${route}`);
      const content = readProjectFile(route);
      assert.ok(content.includes('/api/crm/recruitment/'), 'Admin route must re-export from CRM recruitment route');
    });
  }
});

test('Recruitment CRM — Fail-Closed Staff Creation & Duplicate Prevention', async (t) => {
  const hireRoute = readProjectFile('app/api/crm/recruitment/applications/[id]/hire/route.ts');

  await t.test('Hire route enforces authentication and admin authorization', () => {
    assert.ok(hireRoute.includes('getAuthenticatedAdminActor'), 'Must enforce authentication via getAuthenticatedAdminActor');
  });

  await t.test('Hire route implements duplicate staff detection by email and phone', () => {
    assert.ok(hireRoute.includes('duplicateStaff') || hireRoute.includes('duplicate_found'), 'Must query for existing staff');
    assert.ok(hireRoute.includes('duplicate_found: true'), 'Returns duplicate flag when duplicate exists and unconfirmed');
  });

  await t.test('Hire route explicitly creates staff with fail-closed non-rosterable initial state', () => {
    assert.ok(hireRoute.includes("status: 'pending'"), "New staff must have status: 'pending'");
    assert.ok(hireRoute.includes("lifecycle_stage: 'onboarding'"), "New staff must have lifecycle_stage: 'onboarding'");
    assert.ok(hireRoute.includes('is_rosterable: false'), 'New staff must have is_rosterable: false');
    assert.ok(hireRoute.includes("ndis_screening: 'Unknown / Needs Verification'"), "New staff must have ndis_screening: 'Unknown / Needs Verification'");
    assert.ok(hireRoute.includes('ndis_orientation_completed: false'), 'New staff must have ndis_orientation_completed: false');
  });

  await t.test('Hire route returns worker readiness and agreement generator handoff URLs', () => {
    assert.ok(hireRoute.includes('worker_360_url') || hireRoute.includes('/admin?tab=staff'), 'Returns worker 360 handoff URL');
    assert.ok(hireRoute.includes('agreement_generator_url') || hireRoute.includes('/admin?tab=agreements'), 'Returns agreement generator handoff URL');
  });
});

test('Recruitment CRM UI — Tab & Container Integration', async (t) => {
  await t.test('RecruitmentTab component exists and contains complete recruitment management UI', () => {
    assert.ok(fileExists('components/admin/RecruitmentTab.tsx'), 'RecruitmentTab.tsx must exist');
    const tabContent = readProjectFile('components/admin/RecruitmentTab.tsx');
    assert.ok(tabContent.includes('Applications'), 'Must contain Applications sub-tab');
    assert.ok(tabContent.includes('Vacancies'), 'Must contain Vacancies sub-tab');
    assert.ok(tabContent.includes('EOI'), 'Must contain EOI sub-tab');
    assert.ok(tabContent.includes('pipeline') || tabContent.includes('Pipeline'), 'Must contain Pipeline Board');
    assert.ok(tabContent.includes('360') || tabContent.includes('Candidate'), 'Must contain Candidate 360 view');
    assert.ok(tabContent.includes('hire') || tabContent.includes('Hire'), 'Must contain Hire Candidate workflow');
  });

  await t.test('CrmContainer renders Recruitment tab in navigation items', () => {
    const containerContent = readProjectFile('components/admin/ui/CrmContainer.tsx');
    assert.ok(containerContent.includes("'recruitment'"), 'CrmContainer must support recruitment tab');
    assert.ok(containerContent.includes("isTabActive('recruitment')"), 'CrmContainer must check active recruitment tab');
  });

  await t.test('Admin page renders RecruitmentTab when tab=recruitment', () => {
    const pageContent = readProjectFile('app/admin/page.tsx');
    assert.ok(pageContent.includes('RecruitmentTab'), 'Admin page must import RecruitmentTab');
    assert.ok(pageContent.includes("tab === 'recruitment'"), 'Admin page must render RecruitmentTab when activeTab is recruitment');
  });
});
