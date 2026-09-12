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

test('Governance G7 — Brand and Legal Entity Integrity', async (t) => {
  await t.test('verifies zero occurrences of CarePoint in public app, components, and public assets', () => {
    const scanDirs = ['app', 'components', 'public'];
    const forbidden = ['CarePoint', 'carepoint'];

    function scanFolder(folder) {
      const full = path.join(rootDir, folder);
      if (!fs.existsSync(full)) return;
      const entries = fs.readdirSync(full, { withFileTypes: true });
      for (const entry of entries) {
        const entryPath = path.join(full, entry.name);
        if (entry.isDirectory()) {
          scanFolder(path.join(folder, entry.name));
        } else if (/\.(tsx|ts|jsx|js|html|txt|json|md)$/i.test(entry.name)) {
          const fileContent = fs.readFileSync(entryPath, 'utf8');
          for (const word of forbidden) {
            assert.ok(
              !fileContent.includes(word),
              `File ${path.join(folder, entry.name)} contains stale brand ${word}`
            );
          }
        }
      }
    }

    scanDirs.forEach(scanFolder);
  });

  await t.test('verifies zero occurrences of Pty Ltd fabrication across public pages', () => {
    const pages = [
      'app/page.tsx',
      'app/about/page.tsx',
      'app/services/page.tsx',
      'app/service-areas/page.tsx',
      'app/faq/page.tsx',
      'app/contact/page.tsx',
      'app/referral/page.tsx',
      'components/SiteHeader.tsx',
      'components/SiteFooter.tsx',
    ];

    for (const rel of pages) {
      const pageContent = readProjectFile(rel);
      assert.ok(!pageContent.includes('Pty Ltd'), `${rel} must not contain fabricated Pty Ltd`);
    }
  });

  await t.test('verifies accurate unregistered provider statement and funding scope', () => {
    const homeContent = readProjectFile('app/page.tsx');
    assert.ok(homeContent.includes('UNREGISTERED NDIS PROVIDER'), 'Home page must state unregistered provider status');
    assert.ok(homeContent.includes('SUPPORTING SELF & PLAN-MANAGED PARTICIPANTS'), 'Home page must specify self & plan managed support');

    const faqContent = readProjectFile('app/faq/page.tsx');
    assert.ok(faqContent.includes('unregistered provider'), 'FAQ must state unregistered status');
    assert.ok(faqContent.includes('self-managed and plan-managed'), 'FAQ must clarify supported funding types');
  });
});

test('Governance G7 — Service Catalogue and Clinical Exclusion', async (t) => {
  await t.test('public services page advertises only standard core supports and excludes prohibited/unready items', () => {
    const servicesContent = readProjectFile('app/services/page.tsx');

    assert.ok(servicesContent.includes('Daily Living Support'));
    assert.ok(servicesContent.includes('Social & Community Participation'));
    assert.ok(servicesContent.includes('Transport & Outings Support'));
    assert.ok(servicesContent.includes('Life Skills & Capacity Building'));

    assert.ok(!servicesContent.includes('Specialist Behaviour Support'));
    assert.ok(!servicesContent.includes('Supported Independent Living'));
    assert.ok(!servicesContent.includes('Specialist Disability Accommodation'));
    assert.ok(!servicesContent.includes('Plan Management'));
    assert.ok(!servicesContent.includes('Regulated Restrictive Practices'));
    assert.ok(!servicesContent.includes('Complex Bowel Care'));
    assert.ok(!servicesContent.includes('Urinary Catheter Management'));
  });
});

test('Governance G7 — Service Coverage & Availability Qualifier', async (t) => {
  await t.test('canonical availability qualifier is displayed on coverage components and directory pages', () => {
    const expectedQualifier = 'Service availability depends on location, participant requirements and current worker capacity.';

    const coverageChecker = readProjectFile('components/RegionalCoverageChecker.tsx');
    assert.ok(coverageChecker.includes(expectedQualifier), 'RegionalCoverageChecker must display canonical qualifier');

    const serviceAreasPage = readProjectFile('app/service-areas/page.tsx');
    assert.ok(serviceAreasPage.includes(expectedQualifier), 'ServiceAreasPage must display canonical qualifier');

    const regionsLib = readProjectFile('lib/regions.ts');
    assert.ok(regionsLib.includes(expectedQualifier), 'lib/regions.ts must configure canonical qualifier');
  });

  await t.test('coverage directory covers both Northern NSW and Sydney corridors', () => {
    const serviceAreasPage = readProjectFile('app/service-areas/page.tsx');
    assert.ok(serviceAreasPage.includes('NSW NORTH COAST & NORTHERN RIVERS'));
    assert.ok(serviceAreasPage.includes('Sydney Metropolitan') && serviceAreasPage.includes('Western Sydney'));
  });
});

test('Governance G7 — Referral Journey & G1 Gate Linkage', async (t) => {
  await t.test('referral form has no pre-ticked consents and no silent defaults', () => {
    const formContent = readProjectFile('components/ReferralForm.tsx');

    assert.ok(formContent.includes('privacyConsent: false'), 'privacyConsent must default to false');
    assert.ok(formContent.includes('participantConsent: false'), 'participantConsent must default to false');
    assert.ok(formContent.includes('marketingConsent: false'), 'marketingConsent must default to false');
    assert.ok(formContent.includes("funding: ''"), 'funding must not have silent default');
    assert.ok(formContent.includes('services: []'), 'services must not be preselected');
  });

  await t.test('contact form has no preselected services', () => {
    const contactContent = readProjectFile('components/ContactForm.tsx');
    assert.ok(contactContent.includes('selectedServices: []'), 'ContactForm services must default to empty');
  });

  await t.test('referral API requires explicit consent and valid funding before persisting', () => {
    const routeContent = readProjectFile('app/api/referral/route.ts');
    assert.ok(routeContent.includes('body.privacyConsent !== true || body.participantConsent !== true'));
    assert.ok(routeContent.includes("['Plan-Managed', 'Self-Managed'].includes(funding)"));
    assert.ok(routeContent.includes("status: 'new'"), 'Referral must be stored with new status in CRM');
  });
});

test('Governance G7 — Pricing, Travel & GST Integrity', async (t) => {
  await t.test('pricing document states sole trader, not registered for GST, and NDIS price limits', () => {
    const pricingDoc = readProjectFile('app/documents/pricing-travel-cancellation/page.tsx');
    assert.ok(pricingDoc.includes('Sole Trader (Not Registered for GST)'));
    assert.ok(pricingDoc.includes('As Opus Care is not registered for GST, invoices do not include GST.'));
    assert.ok(pricingDoc.includes('NDIS Pricing Arrangements'));
  });

  await t.test('complaints page displays external escalation avenue (NDIS Commission 1800 035 544)', () => {
    const complaintsPage = readProjectFile('app/complaints/page.tsx');
    assert.ok(complaintsPage.includes('1800 035 544'));
  });
});
