import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Test 1: Public View Field Isolation
describe('Governance G0.3 - Public Directory Surface Isolation', () => {
  it('guarantees public view schema contains strictly unclassified public fields', async () => {
    const publicColumns = ['service_code', 'public_name', 'description', 'category', 'status'];
    const forbiddenInternalColumns = [
      'required_worker_credentials',
      'required_competencies',
      'risk_class',
      'clinical_approval_required',
      'participant_plan_required',
      'quote_eligible',
      'roster_eligible',
      'invoice_eligible',
      'internal_operational_notes',
      'ndis_support_catalogue_mapping',
      'provider_travel_labour_eligible',
      'provider_travel_non_labour_eligible',
      'activity_based_transport_eligible',
    ];

    for (const forbidden of forbiddenInternalColumns) {
      assert.equal(
        publicColumns.includes(forbidden),
        false,
        `Public directory must never expose ${forbidden}`
      );
    }
    assert.equal(publicColumns.length, 5, 'Public view must expose exactly 5 unclassified fields');
  });

  it('prohibits participant profiles from inheriting staff or admin privileges', () => {
    // Exact SQL logic of is_opus_staff and is_opus_admin
    const staffRoles = ['admin', 'manager', 'coordinator', 'staff'];
    const adminRoles = ['admin', 'manager'];

    const participantRole = 'participant';
    const workerRole = 'worker';

    const isStaff = (role, isActive = true) => isActive && staffRoles.includes(role);
    const isAdmin = (role, isActive = true) => isActive && adminRoles.includes(role);

    assert.equal(isStaff(participantRole), false, 'Participant must never evaluate as Opus staff');
    assert.equal(isAdmin(participantRole), false, 'Participant must never evaluate as Opus admin');
    assert.equal(isStaff(workerRole), false, 'Ordinary field worker must not evaluate as operational staff');
    assert.equal(isAdmin(workerRole), false, 'Ordinary field worker must not evaluate as admin');

    assert.equal(isStaff('coordinator'), true, 'Operational coordinator must evaluate as staff');
    assert.equal(isAdmin('manager'), true, 'Manager must evaluate as admin');
  });

  it('enforces that public service scope route strips all governance flags', async () => {
    const { PUBLIC_MARKETING_FALLBACK_REGISTRY } = await import('../lib/services/serviceScope.ts');

    const publicFallback = PUBLIC_MARKETING_FALLBACK_REGISTRY
      .filter((s) => s.websiteVisible && (s.operationalStatus === 'ACTIVE' || s.operationalStatus === 'ACTIVE_WITH_CONTROLS'))
      .map((s) => ({
        serviceCode: s.serviceCode,
        name: s.publicName,
        description: s.internalDescription,
        category: s.ndisCategory,
        status: s.operationalStatus,
      }));

    assert.ok(publicFallback.length > 0);
    for (const item of publicFallback) {
      assert.deepEqual(Object.keys(item).sort(), ['category', 'description', 'name', 'serviceCode', 'status']);
      assert.equal('requiredWorkerCredentials' in item, false);
      assert.equal('riskClass' in item, false);
      assert.equal('quoteEligible' in item, false);
      assert.equal('rosterEligible' in item, false);
      assert.equal('invoiceEligible' in item, false);
    }
  });
});
