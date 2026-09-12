import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  evaluateClinicalServiceReadiness,
  verifyAhpraNursingRegistration,
  evaluateParticipantClinicalReadiness,
  verifyParticipantSpecificCompetency,
  canScheduleClinicalShift,
} from '../lib/services/clinicalGovernance.ts';

test('Governance G6 - Conditional Clinical Service Readiness & Fail-Closed Gates', async (t) => {
  await t.test('conditional services fail closed when governance is incomplete', () => {
    const unconfigured = evaluateClinicalServiceReadiness(null);
    assert.strictEqual(unconfigured.isOperational, false);
    assert.strictEqual(unconfigured.status, 'NOT_CONFIGURED');

    const incomplete = evaluateClinicalServiceReadiness({
      service_id: 'community_nursing',
      service_name: 'Community Nursing',
      governance_status: 'GOVERNANCE_INCOMPLETE',
      insurance_verified: false,
      clinical_lead_ahpra_number: null,
    });
    assert.strictEqual(incomplete.isOperational, false);
    assert.ok(incomplete.blockers.some((b) => b.includes('insurance extension')));
    assert.ok(incomplete.blockers.some((b) => b.includes('Clinical Lead')));
  });

  await t.test('blocks clinical activation if insurance is missing even if Clinical Lead is present', () => {
    const noInsurance = evaluateClinicalServiceReadiness({
      service_id: 'community_nursing',
      service_name: 'Community Nursing',
      governance_status: 'ACTIVE_CONDITIONAL',
      insurance_verified: false,
      insurance_policy_reference: null,
      clinical_lead_name: 'Sarah Jenkins, RN',
      clinical_lead_ahpra_number: 'NMW0001234567',
    });
    assert.strictEqual(noInsurance.isOperational, false);
    assert.strictEqual(noInsurance.status, 'INSURANCE_REQUIRED');
  });

  await t.test('passes service readiness only when both insurance and Clinical Lead are verified', () => {
    const ready = evaluateClinicalServiceReadiness({
      service_id: 'community_nursing',
      service_name: 'Community Nursing',
      governance_status: 'ACTIVE_CONDITIONAL',
      insurance_verified: true,
      insurance_policy_reference: 'POL-CLINICAL-2026-99',
      clinical_lead_name: 'Sarah Jenkins, RN',
      clinical_lead_ahpra_number: 'NMW0001234567',
    });
    assert.strictEqual(ready.isOperational, true);
    assert.strictEqual(ready.blockers.length, 0);
  });
});

test('Governance G6 - Ahpra / NMBA Registered Nurse Verification', async (t) => {
  await t.test('rejects unverified, suspended, or missing Ahpra registration', () => {
    const missing = verifyAhpraNursingRegistration({});
    assert.strictEqual(missing.isEligible, false);

    const suspended = verifyAhpraNursingRegistration({
      ahpra_registration_number: 'NMW0009999999',
      ahpra_status: 'Suspended',
      ahpra_verified_at: new Date().toISOString(),
    });
    assert.strictEqual(suspended.isEligible, false);
    assert.ok(suspended.reason?.includes('Suspended'));

    const unverified = verifyAhpraNursingRegistration({
      ahpra_registration_number: 'NMW0009999999',
      ahpra_status: 'Registered',
      ahpra_verified_at: null,
    });
    assert.strictEqual(unverified.isEligible, false);
    assert.ok(unverified.reason?.includes('not been verified'));
  });

  await t.test('rejects expired Ahpra registration', () => {
    const expired = verifyAhpraNursingRegistration({
      ahpra_registration_number: 'NMW0008888888',
      ahpra_status: 'Registered',
      ahpra_verified_at: '2025-06-01T00:00:00Z',
      ahpra_expiry_date: '2025-05-31',
    });
    assert.strictEqual(expired.isEligible, false);
    assert.ok(expired.reason?.includes('expired'));
  });

  await t.test('approves current verified Ahpra Registered Nurse', () => {
    const futureDate = new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0];
    const valid = verifyAhpraNursingRegistration({
      ahpra_registration_number: 'NMW0001234567',
      ahpra_status: 'Registered',
      ahpra_verified_at: new Date().toISOString(),
      ahpra_expiry_date: futureDate,
    });
    assert.strictEqual(valid.isEligible, true);
  });
});

test('Governance G6 - Participant-Specific High-Intensity Competency Boundary', async (t) => {
  await t.test('strictly blocks transfer of competency between participants', () => {
    const compForPartA = {
      worker_id: 'worker-1',
      participant_id: 'participant-A',
      task_type: 'complex_bowel_care',
      competency_status: 'TRAINED_COMPETENT',
      expiry_date: '2027-01-01',
      trainer_name: 'Jane Smith, Clinical Nurse',
      trainer_qualification: 'Registered Nurse',
    };

    // Attempting to use Participant A's competency for Participant B
    const result = verifyParticipantSpecificCompetency(
      compForPartA,
      'worker-1',
      'participant-B',
      'complex_bowel_care'
    );
    assert.strictEqual(result.isEligible, false);
    assert.ok(result.reason?.includes('non-transferable'));
  });

  await t.test('rejects expired or non-competent status', () => {
    const expired = {
      worker_id: 'worker-1',
      participant_id: 'participant-A',
      task_type: 'urinary_catheter_management',
      competency_status: 'TRAINED_COMPETENT',
      expiry_date: '2025-01-01',
      trainer_name: 'Jane Smith, Clinical Nurse',
      trainer_qualification: 'Registered Nurse',
    };
    const check = verifyParticipantSpecificCompetency(
      expired,
      'worker-1',
      'participant-A',
      'urinary_catheter_management'
    );
    assert.strictEqual(check.isEligible, false);
    assert.ok(check.reason?.includes('expired'));
  });

  await t.test('accepts valid participant-specific competency for matching worker and participant', () => {
    const futureDate = new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0];
    const valid = {
      worker_id: 'worker-1',
      participant_id: 'participant-A',
      task_type: 'complex_bowel_care',
      competency_status: 'TRAINED_COMPETENT',
      expiry_date: futureDate,
      trainer_name: 'Dr. John Roberts',
      trainer_qualification: 'Clinical Nurse Specialist',
    };
    const check = verifyParticipantSpecificCompetency(
      valid,
      'worker-1',
      'participant-A',
      'complex_bowel_care'
    );
    assert.strictEqual(check.isEligible, true);
  });
});

test('Governance G6 - Multi-Gate Clinical Shift Scheduling Evaluation', async (t) => {
  const futureDate = new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0];

  const operationalService = {
    service_id: 'community_nursing',
    service_name: 'Community Nursing',
    governance_status: 'ACTIVE_CONDITIONAL',
    insurance_verified: true,
    insurance_policy_reference: 'POL-CLINICAL-2026-99',
    clinical_lead_name: 'Sarah Jenkins, RN',
    clinical_lead_ahpra_number: 'NMW0001234567',
  };

  const validPlan = {
    plan_reference: 'CCP-2026-0001',
    participant_id: 'part-1',
    service_id: 'community_nursing',
    plan_title: 'Medication Administration & Wound Care Plan',
    treating_practitioner_name: 'Dr. Alan Vance',
    treating_practitioner_discipline: 'General Practitioner',
    issue_date: '2026-07-01',
    review_date: futureDate,
    emergency_escalation_instructions: 'Call 000 in acute distress or anaphylaxis.',
    contraindications_and_risks: 'Known allergy to penicillin.',
    approval_status: 'Clinical Approved',
  };

  const validNurse = {
    ahpra_registration_number: 'NMW0001234567',
    ahpra_status: 'Registered',
    ahpra_verified_at: new Date().toISOString(),
    ahpra_expiry_date: futureDate,
  };

  await t.test('blocks scheduling when participant is not G1 rosterable', () => {
    const result = canScheduleClinicalShift({
      serviceId: 'community_nursing',
      serviceConfig: operationalService,
      participantPlan: validPlan,
      isParticipantG1Rosterable: false, // blocked by G1
      workerAhpra: validNurse,
      workerId: 'worker-nurse-1',
      participantId: 'part-1',
    });
    assert.strictEqual(result.allowed, false);
    assert.ok(result.reason?.includes('not fully onboarded'));
  });

  await t.test('blocks scheduling when nurse is unverified even if plan is approved', () => {
    const result = canScheduleClinicalShift({
      serviceId: 'community_nursing',
      serviceConfig: operationalService,
      participantPlan: validPlan,
      isParticipantG1Rosterable: true,
      workerAhpra: { ahpra_registration_number: null }, // unverified nurse
      workerId: 'worker-nurse-1',
      participantId: 'part-1',
    });
    assert.strictEqual(result.allowed, false);
    assert.ok(result.reason?.includes('Community Nursing requires a verified Registered Nurse'));
  });

  await t.test('allows scheduling when all 4 gates pass simultaneously', () => {
    const result = canScheduleClinicalShift({
      serviceId: 'community_nursing',
      serviceConfig: operationalService,
      participantPlan: validPlan,
      isParticipantG1Rosterable: true,
      workerAhpra: validNurse,
      workerId: 'worker-nurse-1',
      participantId: 'part-1',
    });
    assert.strictEqual(result.allowed, true);
  });
});

test('Governance G6 - Migration and Database Security', async (t) => {
  await t.test('migration verifies clinical_service_readiness, participant_clinical_plans and competencies tables', () => {
    const migration = readFileSync('supabase/migrations/20260912230000_governance_g6_clinical_high_intensity.sql', 'utf8');
    assert.ok(migration.includes('clinical_service_readiness'));
    assert.ok(migration.includes('participant_clinical_plans'));
    assert.ok(migration.includes('participant_specific_competencies'));
    assert.ok(migration.includes('ahpra_registration_number'));
    assert.ok(migration.includes('GOVERNANCE_INCOMPLETE'));
  });
});
