import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  CANONICAL_PARTICIPANT_DOCUMENTS,
  getControlledDocuments,
} from '../lib/services/governanceDocuments.ts';
import {
  OPERATIONS_GUIDE_WORKFLOWS,
  getOperationsGuideWorkflows,
  getOperationsGuideWorkflow,
} from '../lib/services/operationsGuide.ts';

test('Governance G3 - Participant Document Pack & Controlled Documents', async (t) => {
  await t.test('seeds all 11 canonical participant documents with correct 2026.1 metadata', () => {
    assert.strictEqual(CANONICAL_PARTICIPANT_DOCUMENTS.length, 11);

    const codes = CANONICAL_PARTICIPANT_DOCUMENTS.map((d) => d.document_code);
    assert.ok(codes.includes('DOC-AGR-01'), 'Includes Service Agreement');
    assert.ok(codes.includes('DOC-SCH-01'), 'Includes Schedule of Supports');
    assert.ok(codes.includes('DOC-PRC-01'), 'Includes Pricing, Travel & Cancellation Policy');
    assert.ok(codes.includes('DOC-PRV-01'), 'Includes Privacy Collection Notice');
    assert.ok(codes.includes('DOC-RGT-01'), 'Includes Participant Charter of Rights');
    assert.ok(codes.includes('DOC-CMP-01'), 'Includes Complaints & Dispute Resolution Guide');
    assert.ok(codes.includes('DOC-INC-01'), 'Includes Incident Management & Safeguarding Guide');
    assert.ok(codes.includes('DOC-HBK-01'), 'Includes Participant Handbook');
    assert.ok(codes.includes('DOC-EMG-01'), 'Includes Emergency Support Protocol');
    assert.ok(codes.includes('DOC-EXT-01'), 'Includes Service Exit & Transition Policy');
    assert.ok(codes.includes('DOC-ISA-01'), 'Includes Information Sharing Authority');

    for (const doc of CANONICAL_PARTICIPANT_DOCUMENTS) {
      assert.strictEqual(doc.version, '2026.1');
      assert.strictEqual(doc.status, 'current');
      assert.ok(doc.title.length > 3);
      assert.ok(doc.change_summary.length > 5);
      assert.ok(doc.review_date > doc.effective_date);
    }
  });

  await t.test('documents hub page exposes all 11 participant document pack resources', () => {
    const hubContent = readFileSync('app/documents/page.tsx', 'utf8');
    assert.ok(hubContent.includes('service-agreement'));
    assert.ok(hubContent.includes('schedule-of-supports'));
    assert.ok(hubContent.includes('pricing-travel-cancellation'));
    assert.ok(hubContent.includes('/privacy'));
    assert.ok(hubContent.includes('rights-and-responsibilities'));
    assert.ok(hubContent.includes('/complaints'));
    assert.ok(hubContent.includes('/incident-management'));
    assert.ok(hubContent.includes('welcome-pack'));
    assert.ok(hubContent.includes('emergency-support'));
    assert.ok(hubContent.includes('exit-transition'));
    assert.ok(hubContent.includes('information-sharing'));
  });
});

test('Governance G3 - Privacy and Consent Controls', async (t) => {
  await t.test('guarantees no pre-ticked consents and strictly isolates marketing consent', () => {
    const drawerContent = readFileSync('components/admin/ParticipantConsentDrawer.tsx', 'utf8');

    // Consent state initializations must be false
    assert.ok(drawerContent.includes('const [privacyAck, setPrivacyAck] = useState(false)'));
    assert.ok(drawerContent.includes('const [serviceConsent, setServiceConsent] = useState(false)'));
    assert.ok(drawerContent.includes('const [marketingConsent, setMarketingConsent] = useState(false)'));

    // Marketing consent must be described as optional and separate
    assert.ok(drawerContent.includes('Separate Optional Marketing'));
  });

  await t.test('enforces documented reason for information sharing authority revocation', () => {
    const drawerContent = readFileSync('components/admin/ParticipantConsentDrawer.tsx', 'utf8');
    assert.ok(drawerContent.includes('A documented reason is required to revoke'));

    const routeContent = readFileSync('app/api/crm/consents/route.ts', 'utf8');
    assert.ok(routeContent.includes('authority_id and reason are required'));
  });
});

test('Governance G3 - Agreement & Legal Baseline Alignment', async (t) => {
  await t.test('enforces proprietor legal name guard before agreement execution or sending', () => {
    const agreementRoute = readFileSync('app/api/crm/agreements/route.ts', 'utf8');
    assert.ok(agreementRoute.includes('Complete the legal contracting identity in Organisation Settings'));
    assert.ok(agreementRoute.includes('proprietor_legal_name'));

    const signRoute = readFileSync('app/api/crm/agreements/sign/route.ts', 'utf8');
    assert.ok(signRoute.includes('Complete the legal contracting identity in Organisation Settings'));
  });

  await t.test('reflects authorised sole trader, ABN 41 267 197 576, and not registered for GST', () => {
    const pricingContent = readFileSync('app/documents/pricing-travel-cancellation/page.tsx', 'utf8');
    assert.ok(pricingContent.includes('41 267 197 576'));
    assert.ok(pricingContent.includes('Not Registered for GST'));
    assert.ok(!pricingContent.includes('Pty Ltd'));

    const rightsContent = readFileSync('app/documents/rights-and-responsibilities/page.tsx', 'utf8');
    assert.ok(rightsContent.includes('41 267 197 576'));
    assert.ok(!rightsContent.includes('Pty Ltd'));

    const agreementViewer = readFileSync('components/admin/AgreementViewerModal.tsx', 'utf8');
    assert.ok(!agreementViewer.includes('Pty Ltd'));
  });
});

test('Governance G3 - Help Centre & Operations Guide', async (t) => {
  await t.test('covers all 9 mandatory operational workflows with structured prerequisites and blockers', () => {
    assert.strictEqual(OPERATIONS_GUIDE_WORKFLOWS.length, 9);

    const requiredWorkflows = [
      'referral_onboarding',
      'worker_readiness',
      'agreements_documents',
      'roster_shifts',
      'notes_timesheets',
      'incidents_complaints',
      'privacy_consent',
      'invoicing_billing',
      'scope_boundaries',
    ];

    for (const id of requiredWorkflows) {
      const item = getOperationsGuideWorkflow(id);
      assert.ok(item, `Workflow ${id} must exist in operations guide`);
      assert.ok(item.prerequisites.length >= 2, `${id} must have prerequisites`);
      assert.ok(item.requiredData.length >= 2, `${id} must have required data`);
      assert.ok(item.downstreamEffect.length >= 2, `${id} must have downstream effect`);
      assert.ok(item.recordLocation.length > 5, `${id} must have record location`);
      assert.ok(item.escalationPath.length > 5, `${id} must have escalation path`);
      assert.ok(item.commonBlockers.length >= 2, `${id} must have common blockers`);
    }
  });

  await t.test('Help Centre component is integrated into CRM navigation', () => {
    const containerContent = readFileSync('components/admin/ui/CrmContainer.tsx', 'utf8');
    assert.ok(containerContent.includes("isTabActive('help')"));
    assert.ok(containerContent.includes('Help Centre &amp; Guide'));

    const adminContent = readFileSync('app/admin/page.tsx', 'utf8');
    assert.ok(adminContent.includes("tab === 'help'"));
    assert.ok(adminContent.includes('<HelpCentrePanel'));
  });
});

test('Governance G3 - Portal Security & Stale Branding Check', async (t) => {
  await t.test('participant documents portal endpoint strips internal fields', () => {
    const portalRoute = readFileSync('app/api/portal/participant/documents/route.ts', 'utf8');
    assert.ok(portalRoute.includes("status: 'current'"));
    assert.ok(portalRoute.includes("audience: 'participant'"));
  });

  await t.test('verifies no stale CarePoint brand in active document pack and help centre', () => {
    const filesToCheck = [
      'app/documents/page.tsx',
      'app/documents/pricing-travel-cancellation/page.tsx',
      'app/documents/rights-and-responsibilities/page.tsx',
      'app/documents/emergency-support/page.tsx',
      'app/documents/exit-transition/page.tsx',
      'app/documents/information-sharing/page.tsx',
      'app/documents/schedule-of-supports/page.tsx',
      'lib/services/governanceDocuments.ts',
      'lib/services/privacyConsent.ts',
      'lib/services/operationsGuide.ts',
      'components/admin/HelpCentrePanel.tsx',
      'components/admin/ParticipantConsentDrawer.tsx',
    ];

    for (const relPath of filesToCheck) {
      const content = readFileSync(relPath, 'utf8');
      assert.ok(
        !content.includes('CarePoint'),
        `File ${relPath} must not contain stale CarePoint branding`
      );
    }
  });
});
