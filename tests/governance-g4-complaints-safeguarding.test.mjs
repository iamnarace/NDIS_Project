import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  SAFEGUARDING_INDICATORS,
  CRITICAL_SAFEGUARDING_INDICATORS,
  evaluateRestrictivePracticeBoundary,
  assessExternalReportingDuty,
  canCloseIncident,
  processComplaintLodgement,
} from '../lib/services/safeguardingGovernance.ts';

test('Governance G4 - Safeguarding Indicators & Critical Escalation Matrix', async (t) => {
  await t.test('covers all mandatory safeguarding indicators with critical classification', () => {
    assert.strictEqual(SAFEGUARDING_INDICATORS.length, 12);

    const ids = SAFEGUARDING_INDICATORS.map((i) => i.id);
    assert.ok(ids.includes('abuse'), 'Includes abuse');
    assert.ok(ids.includes('neglect'), 'Includes neglect');
    assert.ok(ids.includes('exploitation'), 'Includes exploitation');
    assert.ok(ids.includes('violence'), 'Includes violence');
    assert.ok(ids.includes('sexual_misconduct'), 'Includes sexual misconduct');
    assert.ok(ids.includes('financial_abuse'), 'Includes financial abuse');
    assert.ok(ids.includes('coercion'), 'Includes coercion');
    assert.ok(ids.includes('unsafe_environment'), 'Includes unsafe environment');
    assert.ok(ids.includes('missing_participant'), 'Includes missing participant');
    assert.ok(ids.includes('unexplained_injury'), 'Includes unexplained injury');
    assert.ok(ids.includes('worker_conduct_concern'), 'Includes worker conduct concern');
    assert.ok(ids.includes('restrictive_practice_concern'), 'Includes restrictive practice concern');

    for (const crit of CRITICAL_SAFEGUARDING_INDICATORS) {
      assert.ok(ids.includes(crit), `Critical list includes ${crit}`);
      const item = SAFEGUARDING_INDICATORS.find((i) => i.id === crit);
      assert.strictEqual(item?.isCritical, true, `${crit} is marked isCritical=true`);
    }
  });
});

test('Governance G4 - Restrictive Practice Boundary (Fail-Closed)', async (t) => {
  await t.test('triggers management regulatory review stop and prohibits staff authorisation', () => {
    const result = evaluateRestrictivePracticeBoundary({
      hasRestrictivePracticeIndicator: true,
      bspReference: 'BSP-2026-991',
      isRegisteredProvider: false,
    });

    assert.strictEqual(result.hasConcern, true);
    assert.strictEqual(result.managementRegulatoryReviewStop, true);
    assert.strictEqual(result.canStaffAuthorise, false);
    assert.ok(result.regulatoryNotice.includes('unregistered NDIS provider'));
    assert.ok(result.regulatoryNotice.includes('cannot authorise, approve, or implement regulated restrictive practices'));
  });

  await t.test('passes cleanly when no restrictive practice indicator is present', () => {
    const result = evaluateRestrictivePracticeBoundary({
      hasRestrictivePracticeIndicator: false,
    });

    assert.strictEqual(result.hasConcern, false);
    assert.strictEqual(result.managementRegulatoryReviewStop, false);
    assert.strictEqual(result.canStaffAuthorise, false);
  });
});

test('Governance G4 - Accurate External Reporting Duty Triage', async (t) => {
  await t.test('guarantees unregistered Opus does not falsely claim direct NDIS Commission reporting duty', () => {
    const standardIncident = assessExternalReportingDuty({
      severity: 'Low',
      indicators: [],
    });
    assert.strictEqual(standardIncident.reportableToCommissionDirectly, false);
    assert.strictEqual(standardIncident.duty, 'internal_only');

    const highIncident = assessExternalReportingDuty({
      severity: 'High',
      indicators: ['unexplained_injury'],
    });
    assert.strictEqual(highIncident.reportableToCommissionDirectly, false);
    assert.strictEqual(highIncident.duty, 'management_assessment_required');
  });

  await t.test('identifies SafeWork NSW notification for workplace injuries', () => {
    const whsIncident = assessExternalReportingDuty({
      severity: 'High',
      workerWorkplaceInjury: true,
    });
    assert.strictEqual(whsIncident.duty, 'safework_nsw_whs');
    assert.ok(whsIncident.statutoryAgency.includes('SafeWork NSW'));
    assert.strictEqual(whsIncident.reportableToCommissionDirectly, false);
  });

  await t.test('identifies Police / 000 emergency reporting for violence or critical danger', () => {
    const policeIncident = assessExternalReportingDuty({
      severity: 'Critical',
      emergencyServicesContacted: true,
      indicators: ['violence'],
    });
    assert.strictEqual(policeIncident.duty, 'police_emergency');
    assert.ok(policeIncident.statutoryAgency.includes('NSW Police'));
    assert.strictEqual(policeIncident.reportableToCommissionDirectly, false);
  });

  await t.test('identifies subcontracted registered provider intermediary notification duty', () => {
    const subIncident = assessExternalReportingDuty({
      severity: 'Medium',
      isSubcontractedUnderRegisteredProvider: true,
    });
    assert.strictEqual(subIncident.duty, 'registered_provider_intermediary');
    assert.ok(subIncident.statutoryAgency.includes('Lead Registered NDIS Provider'));
    assert.strictEqual(subIncident.reportableToCommissionDirectly, false);
  });
});

test('Governance G4 - Incident Closure Safety Gate & Access Controls', async (t) => {
  await t.test('blocks closure if high-severity incident lacks documented manager review', () => {
    const check = canCloseIncident(
      {
        severity: 'High',
        safeguarding_indicators: [],
        manager_review: '',
        safeguarding_lead_reviewed_at: null,
      },
      'admin'
    );
    assert.strictEqual(check.allowed, false);
    assert.ok(check.reason?.includes('Documented manager review is required'));
  });

  await t.test('blocks closure if critical safeguarding incident lacks Safeguarding Lead sign-off', () => {
    const check = canCloseIncident(
      {
        severity: 'High',
        safeguarding_indicators: ['abuse'],
        manager_review: 'Reviewed and participant is safe with family.',
        safeguarding_lead_reviewed_at: null,
      },
      'admin'
    );
    assert.strictEqual(check.allowed, false);
    assert.ok(check.reason?.includes('Safeguarding Lead review sign-off is required'));
  });

  await t.test('prohibits ordinary staff/worker from closing critical safeguarding incidents', () => {
    const check = canCloseIncident(
      {
        severity: 'Critical',
        safeguarding_indicators: ['violence'],
        manager_review: 'Reviewed by manager.',
        safeguarding_lead_reviewed_at: new Date().toISOString(),
      },
      'staff'
    );
    assert.strictEqual(check.allowed, false);
    assert.ok(check.reason?.includes('Only an authorized Safeguarding Lead or Admin'));
  });

  await t.test('allows closure when all required manager reviews and safeguarding lead sign-offs are present', () => {
    const check = canCloseIncident(
      {
        severity: 'High',
        safeguarding_indicators: ['abuse'],
        manager_review: 'Full root cause review completed, corrective actions assigned and verified.',
        safeguarding_lead_reviewed_at: new Date().toISOString(),
      },
      'admin'
    );
    assert.strictEqual(check.allowed, true);
  });
});

test('Governance G4 - Complaint Lodgement, Anonymous Handling & Advocate Support', async (t) => {
  await t.test('properly sanitizes anonymous complaints and isolates complainant identity', () => {
    const result = processComplaintLodgement({
      is_anonymous: true,
      complainant_name: 'Jane Doe',
      contact_details: '0400 111 222',
      summary: 'Concern regarding worker punctuality',
      details: 'Worker was 45 minutes late without prior notice.',
      participant_id: 'part-12345',
    });

    assert.strictEqual(result.is_anonymous, true);
    assert.strictEqual(result.complainant_name, 'Anonymous Complainant');
    assert.strictEqual(result.participant_id, null, 'Participant ID stripped on anonymous complaint');
    assert.strictEqual(result.contact_details, '[Confidential / Anonymous Contact Supplied]');
    assert.strictEqual(result.status, 'Received');
    assert.ok(result.response_target_date);
  });

  await t.test('records advocate details, communication needs, and computes urgent SLA', () => {
    const result = processComplaintLodgement({
      is_anonymous: false,
      complainant_name: 'John Smith',
      complainant_role: 'Participant',
      advocate_name: 'Sarah Connor',
      advocate_relationship: 'Disability Rights Advocate',
      advocate_contact: 'sarah@advocacy.org.au',
      accessibility_communication_needs: 'Requires written communication only via email',
      immediate_safety_issue: true,
      summary: 'Physical hazard at drop-off location',
      details: 'Ramp was blocked and inaccessible.',
    });

    assert.strictEqual(result.advocate_name, 'Sarah Connor');
    assert.strictEqual(result.advocate_relationship, 'Disability Rights Advocate');
    assert.strictEqual(result.accessibility_communication_needs, 'Requires written communication only via email');
    assert.strictEqual(result.urgency, 'Urgent');
    assert.strictEqual(result.immediate_safety_issue, true);
  });
});

test('Governance G4 - Public Pages and Anti-Retaliation Policy', async (t) => {
  await t.test('complaints page contains interactive anonymous form, advocate section and NDIS Commission contacts', () => {
    const complaintsPage = readFileSync('app/complaints/page.tsx', 'utf8');
    assert.ok(complaintsPage.includes('Submit Anonymously'));
    assert.ok(complaintsPage.includes('advocateToggle'));
    assert.ok(complaintsPage.includes('1800 035 544'));
    assert.ok(complaintsPage.includes('ndiscommission.gov.au'));
    assert.ok(complaintsPage.includes('/api/safeguarding/complaints'));
    assert.ok(complaintsPage.includes('without fear of negative consequences or retribution'));
  });

  await t.test('incident management page explicitly details unregistered provider restrictive practice prohibition', () => {
    const incPage = readFileSync('app/incident-management/page.tsx', 'utf8');
    assert.ok(incPage.includes('unregistered providers cannot authorise, approve, or implement regulated restrictive practices'));
    assert.ok(incPage.includes('Zero-Tolerance'));
    assert.ok(incPage.includes('Open Disclosure'));
    assert.ok(incPage.includes('SafeWork NSW'));
    assert.ok(incPage.includes('000'));
  });
});

test('Governance G4 - Immutability and RLS Schema Security', async (t) => {
  await t.test('migration verifies anti-deletion triggers and public complaint insert policy', () => {
    const migration = readFileSync('supabase/migrations/20260912210000_governance_g4_complaints_incidents_safeguarding.sql', 'utf8');
    assert.ok(migration.includes('trg_prevent_incident_deletion'));
    assert.ok(migration.includes('trg_prevent_complaint_deletion'));
    assert.ok(migration.includes('guard_incident_safeguarding_closure'));
    assert.ok(migration.includes('Allow complaints insert'));
    assert.ok(migration.includes('Worker insert incident'));
    assert.ok(migration.includes('restrictive_practice_concern'));
  });
});
