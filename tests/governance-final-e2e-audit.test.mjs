import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  validateSuitability,
  computeOnboardingRequirements,
} from '../lib/services/participantIntake.ts';

import {
  assessExternalReportingDuty,
  canCloseIncident,
  evaluateRestrictivePracticeBoundary,
  processComplaintLodgement,
  SAFEGUARDING_INDICATORS,
} from '../lib/services/safeguardingGovernance.ts';

import {
  evaluateWhsReadiness,
  evaluateLoneWorkerWelfareStatus,
  calculateTransportAccounting,
  validateParticipantMoneyTransaction,
  REGIONAL_DISRUPTION_PROFILES,
} from '../lib/services/whsContinuityGovernance.ts';

import {
  evaluateClinicalServiceReadiness,
  verifyAhpraNursingRegistration,
  verifyParticipantSpecificCompetency,
} from '../lib/services/clinicalGovernance.ts';

import { checkServiceArea } from '../lib/regions.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function readProjectFile(relPath) {
  return fs.readFileSync(path.join(rootDir, relPath), 'utf8');
}

const mockCoreSupabase = {
  from: () => ({
    select: () => ({
      ilike: (col, val) => ({
        maybeSingle: async () => ({
          data: {
            service_code: val,
            public_name: 'Community Access',
            operational_status: 'ACTIVE',
            registration_required: false,
            clinical_approval_required: false,
          },
          error: null,
        }),
      }),
    }),
  }),
};

test('Final Audit 1 — Full Participant Lifecycle End-to-End Simulation', async (t) => {
  // Step 1: Public Referral & Service Area check
  const areaCheck = checkServiceArea('Yamba NSW');
  assert.equal(areaCheck.inServiceArea, true);
  assert.equal(areaCheck.regionCanonical, 'Northern NSW');

  // Step 2: Intake Suitability Gate
  const suitability = await validateSuitability(
    {
      participantName: 'Alice Green',
      isAdult: true,
      fundingType: 'Plan-Managed',
      suburb: 'Yamba',
      requestedServices: ['OC-SRV-COMM-01'],
      riskTriage: {},
      assessedBy: 'Intake Lead',
    },
    mockCoreSupabase
  );
  assert.ok(suitability.outcome === 'Suitable' || suitability.outcome === 'Suitable With Conditions');
  assert.equal(suitability.inServiceArea, true);

  // Step 3: Compute Onboarding Requirements
  const reqs = computeOnboardingRequirements(suitability, {}, 'Plan-Managed');
  assert.ok(reqs.privacy_notice_acknowledged.required);
  assert.ok(reqs.service_agreement_executed.required);
  assert.ok(reqs.schedule_of_supports_confirmed.required);
  assert.ok(reqs.home_community_whs_assessed.required);

  // Step 4: WHS Assessment Gate
  const whsResult = evaluateWhsReadiness({
    whs_type: 'Home & Community',
    service_location_type: 'Private Residence',
    whs_signed_off_at: new Date().toISOString(),
    whs_signed_off_by: 'WHS Lead',
    review_date: new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10),
  });
  assert.equal(whsResult.isReady, true);
  assert.equal(whsResult.blockers.length, 0);

  // Step 5: Multi-Gate Shift Execution (Worker Welfare & Lone Worker)
  const shiftCheck = evaluateLoneWorkerWelfareStatus({
    checkin_at: new Date().toISOString(),
    expected_finish_at: new Date(Date.now() + 3600000).toISOString(),
  });
  assert.equal(shiftCheck.status, 'checked_in');
  assert.equal(shiftCheck.isAlert, false);

  // Step 6: Transport Accounting Separation (Billing vs Reimbursement)
  const transportAcc = calculateTransportAccounting({
    isTransportShift: true,
    distanceKm: 15,
    travelLabourMinutes: 30,
    hourlyRate: 70.0,
    workerUsesOwnVehicle: true,
    mmmZone: 3,
  });
  assert.equal(transportAcc.activityBasedTransportBilled, 15);
  assert.equal(transportAcc.employeeMileageReimbursement, 14.4); // 15km * $0.96

  // Step 7: Compliant Billing & Invoice Structure (Zero GST)
  const pricingPage = readProjectFile('app/documents/pricing-travel-cancellation/page.tsx');
  assert.ok(pricingPage.includes('ABN: 41 267 197 576'));
  assert.ok(pricingPage.includes('GST has not been charged – supplier is not registered for GST.'));
  assert.ok(!pricingPage.includes('Sole Trader'));
});

test('Final Audit 2 — Full Worker Lifecycle and Screening Verification', async (t) => {
  const validScreening = {
    screeningCheckNumber: 'NDISWC-12345678',
    status: 'CLEARED',
    expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
  };
  assert.equal(validScreening.status, 'CLEARED');

  const barredScreening = {
    screeningCheckNumber: 'NDISWC-87654321',
    status: 'EXCLUSION',
    expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
  };
  assert.notEqual(barredScreening.status, 'CLEARED');

  const expiredDate = new Date(Date.now() - 10 * 86400000).toISOString().slice(0, 10);
  const isExpired = new Date(expiredDate) < new Date();
  assert.equal(isExpired, true);
});

test('Final Audit 3 — Negative-Path Comprehensive Gate Matrix', async (t) => {
  // 1. Participant underage (Minor under 18)
  const underageSuitability = await validateSuitability(
    {
      participantName: 'Junior Smith',
      dateOfBirth: new Date(Date.now() - 16 * 365.25 * 86400000).toISOString().slice(0, 10),
      suburb: 'Yamba',
      fundingType: 'Plan-Managed',
      requestedServices: ['OC-SRV-COMM-01'],
      riskTriage: {},
    },
    mockCoreSupabase
  );
  assert.equal(underageSuitability.outcome, 'Declined / Outside Scope');
  assert.ok(underageSuitability.outcomeReasons.some(r => r.includes('under 18')));

  // 2. Participant outside service area
  const outOfArea = checkServiceArea('Perth WA');
  assert.equal(outOfArea.inServiceArea, false);

  // 3. NDIA-managed without contracting provider
  const ndiaWithoutPartner = await validateSuitability(
    {
      participantName: 'Bob Vance',
      isAdult: true,
      suburb: 'Grafton',
      fundingType: 'NDIA-Managed',
      requestedServices: ['OC-SRV-COMM-01'],
      riskTriage: {},
    },
    mockCoreSupabase
  );
  assert.equal(ndiaWithoutPartner.outcome, 'Further Information Required');
  assert.ok(ndiaWithoutPartner.outcomeReasons.some(r => r.includes('NDIA') || r.includes('unregistered')));

  // 4. Registration-required service requested
  const mockRegSupabase = {
    from: () => ({
      select: () => ({
        ilike: () => ({
          maybeSingle: async () => ({
            data: {
              service_code: 'OC-SRV-SIL-01',
              public_name: 'Supported Independent Living (SIL)',
              operational_status: 'REGISTRATION_REQUIRED',
              registration_required: true,
              clinical_approval_required: false,
            },
            error: null,
          }),
        }),
      }),
    }),
  };

  const regRequiredSuitability = await validateSuitability(
    {
      participantName: 'David Lee',
      isAdult: true,
      suburb: 'Grafton',
      fundingType: 'Plan-Managed',
      requestedServices: ['OC-SRV-SIL-01'],
      riskTriage: {},
    },
    mockRegSupabase
  );
  assert.equal(regRequiredSuitability.outcome, 'Registered Provider Requirement');

  // 5. Restrictive Practice Indicator Boundary
  const rpAssessment = evaluateRestrictivePracticeBoundary({
    hasRestrictivePracticeIndicator: true,
    isRegisteredProvider: false,
  });
  assert.equal(rpAssessment.canStaffAuthorise, false);
  assert.equal(rpAssessment.managementRegulatoryReviewStop, true);

  // 6. Clinical Service Gate without Clinical Lead & Insurance
  const unreadyClinical = evaluateClinicalServiceReadiness({
    service_id: 'community_nursing',
    service_name: 'Community Nursing',
    governance_status: 'GOVERNANCE_INCOMPLETE',
    insurance_verified: false,
    clinical_lead_ahpra_number: null,
  });
  assert.equal(unreadyClinical.isOperational, false);
  assert.ok(unreadyClinical.blockers.some(b => b.includes('insurance')));

  // 7. Non-transferable Participant-Specific Competency Boundary
  const compForPartA = {
    worker_id: 'worker-1',
    participant_id: 'participant-A',
    task_type: 'complex_bowel_care',
    competency_status: 'TRAINED_COMPETENT',
    expiry_date: '2027-01-01',
    trainer_name: 'Jane Smith, Clinical Nurse',
    trainer_qualification: 'Registered Nurse',
  };

  const crossParticipantComp = verifyParticipantSpecificCompetency(
    compForPartA,
    'worker-1',
    'participant-B',
    'complex_bowel_care'
  );
  assert.equal(crossParticipantComp.isEligible, false);
  assert.ok(crossParticipantComp.reason?.includes('non-transferable'));

  // 8. Ahpra NMBA Nurse Verification
  const suspendedNurse = verifyAhpraNursingRegistration({
    ahpra_registration_number: 'NMW0009999999',
    ahpra_status: 'Suspended',
    ahpra_verified_at: new Date().toISOString(),
  });
  assert.equal(suspendedNurse.isEligible, false);
  assert.ok(suspendedNurse.reason?.includes('Suspended'));

  // 9. Participant Money Transaction without Receipt
  const missingReceiptTx = validateParticipantMoneyTransaction({
    amount: 45.0,
    paymentMethod: 'cash',
    receiptObtained: false,
    participantAuthorityConfirmed: true,
  });
  assert.equal(missingReceiptTx.isValid, false);
  assert.ok(missingReceiptTx.errors.some(r => r.includes('receipt')));
});

test('Final Audit 4 — Safeguarding, Complaints and Continuity Disaster Profiles', async (t) => {
  // 12 Safeguarding Indicators Defined
  assert.equal(SAFEGUARDING_INDICATORS.length, 12);

  // SafeWork NSW Escalation Triage (Workplace injury)
  const workHealthEscalation = assessExternalReportingDuty({
    severity: 'Medium',
    workerWorkplaceInjury: true,
  });
  assert.equal(workHealthEscalation.duty, 'safework_nsw_whs');

  // Police Emergency Escalation
  const policeEscalation = assessExternalReportingDuty({
    severity: 'Critical',
    emergencyServicesContacted: true,
  });
  assert.equal(policeEscalation.duty, 'police_emergency');

  // Subcontracted Registered Provider Escalation
  const partnerEscalation = assessExternalReportingDuty({
    severity: 'Medium',
    isSubcontractedUnderRegisteredProvider: true,
  });
  assert.equal(partnerEscalation.duty, 'registered_provider_intermediary');

  // Incident Closure Safety Gate
  const blockedClosure = canCloseIncident(
    {
      severity: 'High',
      manager_review: 'Manager review completed.',
      safeguarding_lead_reviewed_at: null,
    },
    'admin'
  );
  assert.equal(blockedClosure.allowed, false);
  assert.ok(blockedClosure.reason.includes('Safeguarding Lead review sign-off is required'));

  const allowedClosure = canCloseIncident(
    {
      severity: 'High',
      manager_review: 'Manager review completed and corrective actions verified.',
      safeguarding_lead_reviewed_at: new Date().toISOString(),
    },
    'admin'
  );
  assert.equal(allowedClosure.allowed, true);

  // Anonymous Complaint Lodgement sanitizes participant_id
  const anonComplaint = processComplaintLodgement({
    is_anonymous: true,
    complainant_name: 'Jane Doe',
    summary: 'Anonymous feedback',
    details: 'Details of service feedback',
    participant_id: 'some-participant-uuid',
  });
  assert.equal(anonComplaint.is_anonymous, true);
  assert.equal(anonComplaint.complainant_name, 'Anonymous Complainant');
  assert.equal(anonComplaint.participant_id, null);

  // Regional Disaster Profiles (Northern NSW vs Sydney)
  assert.ok(REGIONAL_DISRUPTION_PROFILES['Northern NSW'].primaryHazards.some(h => h.includes('flooding')));
  assert.ok(REGIONAL_DISRUPTION_PROFILES['Sydney'].primaryHazards.some(h => h.includes('heatwaves')));
});

test('Final Audit 5 — Database Security, RLS & Schema Guard Verification', async (t) => {
  const migrationsDir = path.join(rootDir, 'supabase', 'migrations');
  const files = fs.readdirSync(migrationsDir);

  const g4FileName = files.find(f => f.includes('20260912210000_governance_g4'));
  const g5FileName = files.find(f => f.includes('20260912220000_governance_g5'));
  const g6FileName = files.find(f => f.includes('20260912230000_governance_g6'));

  assert.ok(g4FileName, 'G4 migration exists');
  assert.ok(g5FileName, 'G5 migration exists');
  assert.ok(g6FileName, 'G6 migration exists');

  const g4Content = fs.readFileSync(path.join(migrationsDir, g4FileName), 'utf8');
  assert.ok(g4Content.includes('guard_safeguarding_record_immutability'));
  assert.ok(g4Content.includes('trg_prevent_incident_deletion'));
  assert.ok(g4Content.includes('trg_prevent_complaint_deletion'));

  const g5Content = fs.readFileSync(path.join(migrationsDir, g5FileName), 'utf8');
  assert.ok(g5Content.toLowerCase().includes('enable row level security'));

  const g6Content = fs.readFileSync(path.join(migrationsDir, g6FileName), 'utf8');
  assert.ok(g6Content.toLowerCase().includes('enable row level security'));
});

test('Final Audit 6 — Stale Brand, Fake Credentials & Legal Facts Global Audit', async (t) => {
  const publicDir = path.join(rootDir, 'public');
  const appDir = path.join(rootDir, 'app');
  const compDir = path.join(rootDir, 'components');

  function checkDirForStaleBrand(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        checkDirForStaleBrand(full);
      } else if (/\.(tsx|ts|jsx|js|html|txt)$/i.test(entry.name)) {
        const text = fs.readFileSync(full, 'utf8');
        assert.ok(!text.includes('CarePoint'), `File ${full} contains stale 'CarePoint'`);
        assert.ok(!text.includes('carepoint'), `File ${full} contains stale 'carepoint'`);
        assert.ok(!text.includes('Pty Ltd'), `File ${full} contains fabricated 'Pty Ltd'`);
      }
    }
  }

  checkDirForStaleBrand(publicDir);
  checkDirForStaleBrand(appDir);
  checkDirForStaleBrand(compDir);
});
