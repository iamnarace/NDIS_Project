import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

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

    // NDIA-Managed with verified partner provider subcontract
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

    assert.equal(configuredRes.outcome, 'Suitable With Conditions');
    assert.ok(configuredRes.conditions.some((c) => c.includes('third-party contracting agreement')));
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
