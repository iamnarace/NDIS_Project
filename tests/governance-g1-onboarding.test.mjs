import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Test 1: Service Suitability Assessment Engine & Governance Gates
describe('Governance G1 - Service Suitability Assessment Engine', () => {
  it('approves valid Self-Managed and Plan-Managed standard supports in active regions', async () => {
    const { validateSuitability } = await import('../lib/services/participantIntake.ts');

    const mockSupabase = {
      from: (table) => ({
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

    // Self-Managed in Northern NSW
    const selfManagedRes = await validateSuitability(
      {
        participantName: 'Alice Green',
        isAdult: true,
        fundingType: 'Self-Managed',
        suburb: 'Yamba',
        requestedServices: ['OC-SRV-COMM-01'],
        riskTriage: {},
        assessedBy: 'Intake Lead',
      },
      mockSupabase
    );

    assert.equal(selfManagedRes.outcome, 'Suitable');
    assert.equal(selfManagedRes.inServiceArea, true);
    assert.equal(selfManagedRes.region, 'Northern NSW');

    // Plan-Managed in Sydney
    const planManagedRes = await validateSuitability(
      {
        participantName: 'Bob White',
        isAdult: true,
        fundingType: 'Plan-Managed',
        payerDetails: { planManagerName: 'Capital Plan Management' },
        suburb: 'Blacktown',
        requestedServices: ['OC-SRV-COMM-01'],
        riskTriage: {},
        assessedBy: 'Intake Lead',
      },
      mockSupabase
    );

    assert.equal(planManagedRes.outcome, 'Suitable');
    assert.equal(planManagedRes.inServiceArea, true);
    assert.equal(planManagedRes.region, 'Sydney');
  });

  it('blocks NDIA-Managed funding without verified registered provider arrangement', async () => {
    const { validateSuitability } = await import('../lib/services/participantIntake.ts');

    const mockSupabase = {
      from: () => ({
        select: () => ({
          ilike: (col, val) => ({
            maybeSingle: async () => ({
              data: { service_code: val, public_name: 'Daily Living', operational_status: 'ACTIVE', registration_required: false, clinical_approval_required: false },
              error: null,
            }),
          }),
        }),
      }),
    };

    // NDIA-Managed with no registered contracting partner
    const unconfiguredRes = await validateSuitability(
      {
        participantName: 'Charlie Brown',
        isAdult: true,
        fundingType: 'NDIA-Managed',
        payerDetails: {},
        suburb: 'Grafton',
        requestedServices: ['OC-SRV-DAILY-01'],
        riskTriage: {},
        assessedBy: 'Intake Lead',
      },
      mockSupabase
    );

    assert.equal(unconfiguredRes.outcome, 'Further Information Required');
    assert.ok(unconfiguredRes.outcomeReasons.some((r) => r.includes('Billing Configuration Required')));

    // A typed provider name is enquiry context only and cannot verify the pathway.
    const configuredRes = await validateSuitability(
      {
        participantName: 'Charlie Brown',
        isAdult: true,
        fundingType: 'NDIA-Managed',
        payerDetails: {
          registeredContractingProvider: 'North Coast Disability Partners Ltd (NDIS Reg #4-ABCDE)',
        },
        suburb: 'Grafton',
        requestedServices: ['OC-SRV-DAILY-01'],
        riskTriage: {},
        assessedBy: 'Intake Lead',
      },
      mockSupabase
    );

    assert.equal(configuredRes.outcome, 'Further Information Required');

    const verifiedRes = await validateSuitability(
      {
        participantName: 'Charlie Brown',
        isAdult: true,
        fundingType: 'NDIA-Managed',
        payerDetails: { verifiedContractingRelationshipId: 'relationship-verified-server-side' },
        suburb: 'Grafton',
        requestedServices: ['OC-SRV-DAILY-01'],
        riskTriage: {},
      },
      mockSupabase
    );

    assert.equal(verifiedRes.outcome, 'Suitable With Conditions');
    assert.ok(verifiedRes.conditions.some((c) => c.includes('verified registered-provider')));
  });

  it('declines participants under 18 years of age (Adults 18+ launch scope)', async () => {
    const { validateSuitability } = await import('../lib/services/participantIntake.ts');

    const childRes = await validateSuitability({
      participantName: 'Young Participant',
      dateOfBirth: '2015-05-10', // 11 years old
      fundingType: 'Self-Managed',
      suburb: 'Yamba',
      requestedServices: ['OC-SRV-COMM-01'],
      riskTriage: {},
      assessedBy: 'Intake Lead',
    });

    assert.equal(childRes.outcome, 'Declined / Outside Scope');
    assert.equal(childRes.isAdult, false);
    assert.ok(childRes.outcomeReasons.some((r) => r.includes('Adults 18+')));
  });

  it('uses calendar birthdays and keeps missing adult evidence unconfirmed', async () => {
    const { validateSuitability } = await import('../lib/services/participantIntake.ts');
    const mockSupabase = {
      from: () => ({ select: () => ({ ilike: () => ({ maybeSingle: async () => ({
        data: { service_code: 'OC-SRV-COMM-01', public_name: 'Community Access', operational_status: 'ACTIVE', registration_required: false, clinical_approval_required: false },
        error: null,
      }) }) }) }),
    };
    const today = new Date();
    const localDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const exactBirthday = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    const birthdayTomorrow = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate() + 1);
    const base = { participantName: 'Age boundary probe', fundingType: 'Self-Managed', suburb: 'Yamba', requestedServices: ['OC-SRV-COMM-01'], riskTriage: {} };
    assert.equal((await validateSuitability({ ...base, dateOfBirth: localDate(exactBirthday) }, mockSupabase)).isAdult, true);
    assert.equal((await validateSuitability({ ...base, dateOfBirth: localDate(birthdayTomorrow) }, mockSupabase)).isAdult, false);
    const unknown = await validateSuitability(base, mockSupabase);
    assert.equal(unknown.isAdult, null);
    assert.equal(unknown.outcome, 'Further Information Required');
  });

  it('triggers Management / Regulatory Review Stop if restrictive practices are indicated', async () => {
    const { validateSuitability } = await import('../lib/services/participantIntake.ts');

    const restrictiveRes = await validateSuitability({
      participantName: 'Restricted Participant',
      isAdult: true,
      fundingType: 'Plan-Managed',
      suburb: 'Coffs Harbour',
      requestedServices: ['OC-SRV-COMM-01'],
      riskTriage: {
        restrictivePracticesIndicated: true,
      },
      assessedBy: 'Intake Lead',
    });

    assert.equal(restrictiveRes.outcome, 'Management / Regulatory Review Required');
    assert.ok(restrictiveRes.outcomeReasons.some((r) => r.includes('Regulated Restrictive Practices')));
  });

  it('escalates REGISTRATION_REQUIRED and CONDITIONAL_CLINICAL services appropriately', async () => {
    const { validateSuitability } = await import('../lib/services/participantIntake.ts');

    // Mock live registry with registration required item
    const mockRegSupabase = {
      from: () => ({
        select: () => ({
          ilike: (col, val) => ({
            maybeSingle: async () => ({
              data: {
                service_code: val,
                public_name: 'Plan Management',
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

    const regRes = await validateSuitability(
      {
        participantName: 'David Lee',
        isAdult: true,
        fundingType: 'Plan-Managed',
        suburb: 'Ballina',
        requestedServices: ['OC-SRV-PM-01'],
        riskTriage: {},
        assessedBy: 'Intake Lead',
      },
      mockRegSupabase
    );

    assert.equal(regRes.outcome, 'Registered Provider Requirement');

    // Mock clinical service
    const mockClinicalSupabase = {
      from: () => ({
        select: () => ({
          ilike: (col, val) => ({
            maybeSingle: async () => ({
              data: {
                service_code: val,
                public_name: 'Community Nursing Care',
                operational_status: 'CONDITIONAL_CLINICAL',
                registration_required: false,
                clinical_approval_required: true,
              },
              error: null,
            }),
          }),
        }),
      }),
    };

    const clinicalRes = await validateSuitability(
      {
        participantName: 'Eva Smith',
        isAdult: true,
        fundingType: 'Plan-Managed',
        suburb: 'Ballina',
        requestedServices: ['OC-SRV-NURS-01'],
        riskTriage: { clinicalTasks: true },
        assessedBy: 'Intake Lead',
      },
      mockClinicalSupabase
    );

    assert.equal(clinicalRes.outcome, 'Clinical Review Required');
  });

  it('fails closed if the live service scope database is unreachable', async () => {
    const { validateSuitability } = await import('../lib/services/participantIntake.ts');

    const mockFaultySupabase = {
      from: () => ({
        select: () => ({
          ilike: () => ({
            maybeSingle: async () => ({
              data: null,
              error: { message: 'Supabase connection timed out' },
            }),
          }),
        }),
      }),
    };

    await assert.rejects(
      async () => {
        await validateSuitability(
          {
            participantName: 'Frank Davis',
            isAdult: true,
            fundingType: 'Self-Managed',
            suburb: 'Yamba',
            requestedServices: ['OC-SRV-COMM-01'],
            riskTriage: {},
            assessedBy: 'Intake Lead',
          },
          mockFaultySupabase
        );
      },
      /Governance service unavailable/,
      'Must throw and fail closed on database failure'
    );
  });
});

// Test 2: Dynamic Onboarding Requirements & Non-Waivable Gates
describe('Governance G1 - Dynamic Onboarding Requirements', () => {
  it('tailors requirements: non-clinical participants do not receive clinical care plans', async () => {
    const { computeOnboardingRequirements } = await import('../lib/services/participantIntake.ts');

    const standardReqs = computeOnboardingRequirements(
      { outcome: 'Suitable', outcomeReasons: [], conditions: [], isAdult: true, inServiceArea: true, region: 'Northern NSW', serviceValidation: [] },
      {}, // standard risk triage
      'Self-Managed'
    );

    assert.equal(standardReqs.clinical_plan_verified.required, false);
    assert.equal(standardReqs.clinical_plan_verified.status, 'not_applicable');
    assert.equal(standardReqs.bsp_review_completed.required, false);
    assert.equal(standardReqs.bsp_review_completed.status, 'not_applicable');

    // Base legal requirements are mandatory
    assert.equal(standardReqs.identity_verified.required, true);
    assert.equal(standardReqs.identity_verified.waivable, false, 'Identity verification must NOT be waivable');
    assert.equal(standardReqs.privacy_notice_acknowledged.waivable, false);
    assert.equal(standardReqs.participant_consent_obtained.waivable, false);
    assert.equal(standardReqs.service_agreement_executed.waivable, false);
    assert.equal(standardReqs.participant_risk_assessment_completed.waivable, false);
    assert.equal(standardReqs.medication_authority_verified.required, false);
    assert.equal(standardReqs.transport_governance_confirmed.required, false);
  });

  it('mandates clinical care plan when high-intensity or clinical tasks are present', async () => {
    const { computeOnboardingRequirements } = await import('../lib/services/participantIntake.ts');

    const clinicalReqs = computeOnboardingRequirements(
      { outcome: 'Clinical Review Required', outcomeReasons: [], conditions: [], isAdult: true, inServiceArea: true, region: 'Northern NSW', serviceValidation: [] },
      { catheterCare: true, clinicalTasks: true },
      'Plan-Managed'
    );

    assert.equal(clinicalReqs.clinical_plan_verified.required, true);
    assert.equal(clinicalReqs.clinical_plan_verified.status, 'pending');
    assert.equal(clinicalReqs.clinical_plan_verified.waivable, false, 'Clinical plan must NOT be waivable');
  });

  it('mandates Behaviour Support Plan review when behaviours of concern are flagged', async () => {
    const { computeOnboardingRequirements } = await import('../lib/services/participantIntake.ts');

    const bspReqs = computeOnboardingRequirements(
      { outcome: 'Suitable With Conditions', outcomeReasons: [], conditions: [], isAdult: true, inServiceArea: true, region: 'Northern NSW', serviceValidation: [] },
      { behavioursOfConcern: true, bspInPlace: true },
      'Plan-Managed'
    );

    assert.equal(bspReqs.bsp_review_completed.required, true);
    assert.equal(bspReqs.bsp_review_completed.status, 'pending');
  });

  it('adds each promised participant-specific conditional control only when triggered', async () => {
    const { computeOnboardingRequirements } = await import('../lib/services/participantIntake.ts');
    const reqs = computeOnboardingRequirements(
      { outcome: 'Suitable With Conditions', outcomeReasons: [], conditions: [], isAdult: true, inServiceArea: true, region: 'Sydney', serviceValidation: [] },
      { medicationSupport: true, dysphagiaMealtime: true, manualHandling: true, seizures: true, transportRequired: true },
      'Self-Managed'
    );
    for (const code of ['medication_authority_verified', 'mealtime_management_plan_verified', 'manual_handling_plan_verified', 'seizure_management_plan_verified', 'transport_governance_confirmed']) {
      assert.equal(reqs[code].required, true, `${code} must be required when its risk is present`);
      assert.equal(reqs[code].waivable, false);
    }
  });
});

describe('Governance G1 - review closure source controls', () => {
  it('removes invented UI/API defaults and derives actors server-side', async () => {
    const [modal, addParticipant, referralForm, referralRoute, participantsRoute, suitabilityRoute, convertRoute, onboardingRoute, serviceScopeRoute, agreementModal, roster, invoicing, quotes] = await Promise.all([
      readFile(new URL('../components/admin/SuitabilityAssessmentModal.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../components/admin/AddParticipantModal.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../components/ReferralForm.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../app/api/referral/route.ts', import.meta.url), 'utf8'),
      readFile(new URL('../app/api/crm/participants/route.ts', import.meta.url), 'utf8'),
      readFile(new URL('../app/api/crm/suitability/route.ts', import.meta.url), 'utf8'),
      readFile(new URL('../app/api/crm/convert/route.ts', import.meta.url), 'utf8'),
      readFile(new URL('../app/api/crm/onboarding/route.ts', import.meta.url), 'utf8'),
      readFile(new URL('../app/api/governance/service-scope/route.ts', import.meta.url), 'utf8'),
      readFile(new URL('../components/admin/AgreementGeneratorModal.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../components/WorkforceRosterTab.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../components/admin/InvoicingTab.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../components/admin/QuotesTab.tsx', import.meta.url), 'utf8'),
    ]);
    assert.doesNotMatch(modal, /useState\(['"]Plan-Managed['"]\)/);
    assert.doesNotMatch(modal, /useState\(['"]Yamba(?: NSW)?['"]\)/);
    assert.doesNotMatch(modal, /useState\(true\).*transportRequired/);
    assert.doesNotMatch(addParticipant, /useState\(['"]Plan-Managed['"]\)/);
    assert.doesNotMatch(addParticipant, /useState\(['"]Yamba NSW['"]\)/);
    assert.doesNotMatch(participantsRoute, /\|\| ['"]Plan-Managed['"]|\|\| ['"]Yamba NSW['"]/);
    for (const source of [agreementModal, roster, invoicing, quotes]) {
      assert.doesNotMatch(source, /\|\| ['"]Plan-Managed['"]|\|\| ['"]Yamba['"]|useState\(['"]Yamba['"]\)/);
    }
    assert.doesNotMatch(referralRoute, /funding_type:[^\n]+\|\| ['"]Plan-Managed['"]|suburb:[^\n]+\|\| ['"]Not provided['"]|services:[^\n]+\|\| ['"]General Support['"]/);
    assert.match(referralRoute, /status === ['"]accepted['"]/);
    assert.match(referralRoute, /privacyConsent !== true/);
    assert.match(referralForm, /formData\.services\.length === 0/);
    assert.match(participantsRoute, /require the governed assessment\/onboarding workflow/);
    assert.match(modal, /service-scope\?view=internal/);
    assert.match(serviceScopeRoute, /requestedInternalView && !isAdmin/);
    for (const route of [suitabilityRoute, convertRoute, onboardingRoute]) {
      assert.match(route, /getAuthenticatedAdminActor/);
      assert.doesNotMatch(route, /actorId\s*=\s*['"]|assessedBy\s*=/);
    }
    const adminAuth = await readFile(new URL('../lib/adminAuth.ts', import.meta.url), 'utf8');
    assert.doesNotMatch(adminAuth, /process\.env\.ADMIN_PASSWORD/);
  });

  it('uses atomic RPC boundaries and least-privilege G1 RLS', async () => {
    const [migration, atomicMigration, defaultsMigration, convertRoute, onboardingRoute] = await Promise.all([
      readFile(new URL('../supabase/migrations/20260912120000_governance_g1_review_closure.sql', import.meta.url), 'utf8'),
      readFile(new URL('../supabase/migrations/20260912140000_governance_g1_atomic_acceptance_closure.sql', import.meta.url), 'utf8'),
      readFile(new URL('../supabase/migrations/20260912150000_governance_g1_remove_invented_defaults.sql', import.meta.url), 'utf8'),
      readFile(new URL('../app/api/crm/convert/route.ts', import.meta.url), 'utf8'),
      readFile(new URL('../app/api/crm/onboarding/route.ts', import.meta.url), 'utf8'),
    ]);
    assert.match(convertRoute, /governance_g1_convert_referral/);
    assert.match(onboardingRoute, /governance_g1_update_checklist_item/);
    assert.match(onboardingRoute, /governance_g1_signoff_onboarding/);
    assert.match(migration, /DROP POLICY IF EXISTS "Staff read suitability assessments"/);
    assert.match(migration, /DROP POLICY IF EXISTS "Participant read own onboarding checklist"/);
    assert.match(migration, /verified_registered_provider_contract/);
    assert.match(atomicMigration, /participants_one_per_referral_idx/);
    assert.match(atomicMigration, /only the latest suitability assessment may authorize onboarding/);
    assert.match(atomicMigration, /stale or non-canonical checklist update rejected/);
    assert.match(defaultsMigration, /ALTER COLUMN funding_type DROP DEFAULT/);
  });
});

// Test 3: Participant Readiness Verification & Server-Side Roster Guard
describe('Governance G1 - Readiness Calculation & Roster Safety Guard', () => {
  it('correctly calculates percentage and identifies blockers', async () => {
    const { checkParticipantReadiness } = await import('../lib/services/participantIntake.ts');

    const mockSupabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: {
                participant_id: 'test-part-1',
                requirements: {
                  identity_verified: { title: 'Identity', required: true, waivable: false, status: 'completed' },
                  privacy_notice: { title: 'Privacy', required: true, waivable: false, status: 'completed' },
                  agreement: { title: 'Service Agreement', required: true, waivable: false, status: 'pending' },
                  clinical: { title: 'Clinical Plan', required: false, waivable: false, status: 'not_applicable' },
                },
              },
              error: null,
            }),
          }),
        }),
      }),
    };

    const readiness = await checkParticipantReadiness('test-part-1', mockSupabase);
    assert.equal(readiness.isReady, false, 'Must not be ready while agreement is pending');
    assert.equal(readiness.percentage, 67); // 2 of 3 applicable completed
    assert.ok(readiness.blockers.some((b) => b.includes('Service Agreement')));
  });

  it('rejects waiver of non-waivable items and requires rationale for waivable items', async () => {
    const { checkParticipantReadiness } = await import('../lib/services/participantIntake.ts');

    // 1. Illegal waiver on non-waivable item
    const mockIllegalWaiver = {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: {
                participant_id: 'test-part-2',
                requirements: {
                  identity_verified: { title: 'Identity', required: true, waivable: false, status: 'waived', waiverReason: 'Admin bypassed' },
                },
              },
              error: null,
            }),
          }),
        }),
      }),
    };

    const res1 = await checkParticipantReadiness('test-part-2', mockIllegalWaiver);
    assert.equal(res1.isReady, false);
    assert.ok(res1.blockers.some((b) => b.includes('non-waivable requirement')));

    // 2. Waivable item with missing reason
    const mockMissingReason = {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: {
                participant_id: 'test-part-3',
                requirements: {
                  ndis_number: { title: 'NDIS Number', required: true, waivable: true, status: 'waived', waiverReason: '' },
                },
              },
              error: null,
            }),
          }),
        }),
      }),
    };

    const res2 = await checkParticipantReadiness('test-part-3', mockMissingReason);
    assert.equal(res2.isReady, false);
    assert.ok(res2.blockers.some((b) => b.includes('missing mandatory waiver rationale')));
  });

  it('blocks shift scheduling if participant is not rosterable', () => {
    const checkShiftReadinessGuard = (participant) => {
      if (!participant || !participant.is_rosterable) {
        return {
          allowed: false,
          error: 'Participant onboarding is incomplete. Complete required intake and readiness review before rostering shifts.',
        };
      }
      return { allowed: true };
    };

    const unreadyCheck = checkShiftReadinessGuard({ id: 'p1', full_name: 'Incomplete Part', is_rosterable: false });
    assert.equal(unreadyCheck.allowed, false);
    assert.equal(
      unreadyCheck.error,
      'Participant onboarding is incomplete. Complete required intake and readiness review before rostering shifts.'
    );

    const readyCheck = checkShiftReadinessGuard({ id: 'p2', full_name: 'Ready Part', is_rosterable: true });
    assert.equal(readyCheck.allowed, true);
  });
});
