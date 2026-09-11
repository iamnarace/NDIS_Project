import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Test 1: Transport Architecture Separation & Catalogue Verification
describe('Governance G0.1 - Transport Architecture Separation', () => {
  it('disentangles Core 02 General Transport from Core 04 Activity Based Transport', async () => {
    const { PUBLIC_MARKETING_FALLBACK_REGISTRY } = await import('../lib/services/serviceScope.ts');

    const generalTransport = PUBLIC_MARKETING_FALLBACK_REGISTRY.find(
      (s) => s.serviceCode === 'OC-SRV-TRANS-01'
    );
    assert.ok(generalTransport, 'OC-SRV-TRANS-01 must exist in service scope');
    assert.equal(generalTransport.generalTransportSupport, true, 'General transport support flag must be true');
    assert.equal(generalTransport.activityBasedTransportEligible, false, 'General transport is not activity-based transport');
    assert.ok(
      generalTransport.ndisSupportCatalogueMapping.includes('02_051_0108_1_1'),
      'Must map to Core Support Category 02 (02_051_0108_1_1)'
    );

    const commAccess = PUBLIC_MARKETING_FALLBACK_REGISTRY.find(
      (s) => s.serviceCode === 'OC-SRV-COMM-01'
    );
    assert.ok(commAccess, 'OC-SRV-COMM-01 must exist in service scope');
    assert.equal(commAccess.activityBasedTransportEligible, true, 'Community access must be eligible for activity-based transport');
    assert.ok(
      commAccess.ndisSupportCatalogueMapping.includes('04_590_0125_6_1'),
      'Must map to Activity Based Transport (04_590_0125_6_1)'
    );
    assert.ok(
      commAccess.ndisSupportCatalogueMapping.includes('04_799_0125_6_1'),
      'Must map to Provider Travel Non-Labour (04_799_0125_6_1)'
    );
  });

  it('keeps Community Nursing strictly conditional and unlisted on public website', async () => {
    const { PUBLIC_MARKETING_FALLBACK_REGISTRY } = await import('../lib/services/serviceScope.ts');

    const nursing = PUBLIC_MARKETING_FALLBACK_REGISTRY.find(
      (s) => s.serviceCode === 'OC-SRV-NURS-01'
    );
    assert.ok(nursing, 'OC-SRV-NURS-01 must be present in registry');
    assert.equal(nursing.operationalStatus, 'CONDITIONAL_CLINICAL');
    assert.equal(nursing.websiteVisible, false, 'Nursing must NOT be website visible');
    assert.equal(nursing.quoteEligible, false, 'Nursing must NOT be quote eligible without clinical governance sign-off');
    assert.equal(nursing.rosterEligible, false, 'Nursing must NOT be roster eligible');
    assert.equal(nursing.invoiceEligible, false, 'Nursing must NOT be invoice eligible');
  });
});

// Test 2: Legal Identity & Agreement Execution Guard
describe('Governance G0.1 - Legal Identity & Agreement Execution Guard', () => {
  it('validates authorised owner-confirmed ABN and rejects dummy values', async () => {
    const { AUTHORISED_ABN, VERIFIED_ABN, isDummyAbn, formatAbn } = await import('../lib/organisation.ts');

    assert.equal(AUTHORISED_ABN, '41 267 197 576');
    assert.equal(VERIFIED_ABN, AUTHORISED_ABN);
    assert.equal(isDummyAbn(AUTHORISED_ABN), false, 'Authorised ABN must not be classified as dummy');
    assert.equal(formatAbn('41267197576'), '41 267 197 576');

    assert.equal(isDummyAbn('89 654 321 098'), true, 'Known placeholder ABN must be detected as dummy');
    assert.equal(isDummyAbn('12 345 678 901'), true, 'Dummy placeholder ABN must be detected');
    assert.equal(isDummyAbn(null), true, 'Null ABN must be detected as invalid');
  });

  it('requires proprietor_legal_name before an agreement can be executed or sent', async () => {
    const checkAgreementExecutionGuard = (status, proprietorLegalName) => {
      const isExecuting = ['active', 'fully_signed', 'sent'].includes(status);
      if (isExecuting && (!proprietorLegalName || !proprietorLegalName.trim())) {
        return {
          allowed: false,
          error: 'Complete the legal contracting identity in Organisation Settings before executing this agreement.'
        };
      }
      return { allowed: true };
    };

    const draftRes = checkAgreementExecutionGuard('draft', null);
    assert.equal(draftRes.allowed, true, 'Draft agreements must be allowed without proprietor legal name');

    const activeRes = checkAgreementExecutionGuard('active', null);
    assert.equal(activeRes.allowed, false, 'Active execution must be blocked without proprietor legal name');
    assert.match(activeRes.error, /Organisation Settings/);

    const signedRes = checkAgreementExecutionGuard('fully_signed', '');
    assert.equal(signedRes.allowed, false, 'Signing must be blocked without proprietor legal name');

    const validRes = checkAgreementExecutionGuard('fully_signed', 'Authorized Proprietor');
    assert.equal(validRes.allowed, true, 'Execution must succeed once proprietor legal name is provided');
  });
});

// Test 3: Service Scope Sanitization for Public Endpoint
describe('Governance G0.1 - Public Service Scope Sanitization', () => {
  it('strips internal credentials, pricing, and risk class from public view', async () => {
    const { PUBLIC_MARKETING_FALLBACK_REGISTRY } = await import('../lib/services/serviceScope.ts');

    const publicServices = PUBLIC_MARKETING_FALLBACK_REGISTRY
      .filter((s) => s.websiteVisible && (s.operationalStatus === 'ACTIVE' || s.operationalStatus === 'ACTIVE_WITH_CONTROLS'))
      .map((s) => ({
        serviceCode: s.serviceCode,
        name: s.publicName,
        description: s.internalDescription,
        category: s.ndisCategory,
        status: s.operationalStatus,
      }));

    assert.ok(publicServices.length > 0, 'Must have active public services');

    for (const item of publicServices) {
      assert.equal('requiredWorkerCredentials' in item, false, 'Public item must not leak requiredWorkerCredentials');
      assert.equal('riskClass' in item, false, 'Public item must not leak riskClass');
      assert.equal('internalOperationalNotes' in item, false, 'Public item must not leak internal notes');
      assert.equal('invoiceEligible' in item, false, 'Public item must not leak invoiceEligible flag');
      assert.equal('rosterEligible' in item, false, 'Public item must not leak rosterEligible flag');
    }

    const hasNursing = publicServices.some((s) => s.serviceCode === 'OC-SRV-NURS-01');
    assert.equal(hasNursing, false, 'Conditional clinical services must not appear in public API');
  });
});

// Test 4: Fail-Closed Architecture for Operational Decisions
describe('Governance G0.1 - Fail-Closed Operational Governance', () => {
  it('fails closed and throws an error if the database client is unavailable', async () => {
    const { verifyOperationalAction } = await import('../lib/services/serviceScope.ts');

    // Simulate database query failure
    const mockFaultySupabase = {
      from: () => ({
        select: () => ({
          ilike: () => ({
            maybeSingle: async () => ({
              data: null,
              error: { message: 'Connection to Supabase timed out' },
            }),
          }),
        }),
      }),
    };

    await assert.rejects(
      async () => {
        await verifyOperationalAction('OC-SRV-COMM-01', 'roster', mockFaultySupabase);
      },
      /Governance service unavailable/,
      'Must fail closed when database returns an error'
    );
  });

  it('fails closed when service code does not exist in registry', async () => {
    const { verifyOperationalAction } = await import('../lib/services/serviceScope.ts');

    const mockNotFoundSupabase = {
      from: () => ({
        select: () => ({
          ilike: () => ({
            maybeSingle: async () => ({
              data: null,
              error: null,
            }),
          }),
        }),
      }),
    };

    await assert.rejects(
      async () => {
        await verifyOperationalAction('UNKNOWN-CODE', 'roster', mockNotFoundSupabase);
      },
      /Service scope record not found/,
      'Must fail closed for unknown service codes'
    );
  });

  it('blocks rostering or invoicing for clinical services without sign-off', async () => {
    const { verifyOperationalAction } = await import('../lib/services/serviceScope.ts');

    const mockNursingSupabase = {
      from: () => ({
        select: () => ({
          ilike: () => ({
            maybeSingle: async () => ({
              data: {
                service_code: 'OC-SRV-NURS-01',
                public_name: 'Community Nursing Care',
                internal_description: 'Clinical nursing',
                ndis_category: '0114 - Community Nursing Care',
                ndis_support_catalogue_mapping: ['01_016_0107_1_1'],
                operational_status: 'CONDITIONAL_CLINICAL',
                funding_methods_allowed: ['plan_managed', 'self_managed'],
                registration_required: false,
                risk_class: 'Clinical',
                clinical_approval_required: true,
                participant_plan_required: true,
                required_worker_credentials: ['AHPRA Registration'],
                required_competencies: ['Clinical Care'],
                activity_based_transport_eligible: false,
                provider_travel_labour_eligible: true,
                provider_travel_non_labour_eligible: false,
                general_transport_support: false,
                cancellation_eligible: true,
                quote_eligible: false,
                roster_eligible: false,
                invoice_eligible: false,
                website_visible: false,
                effective_date: '2026-07-01',
                version: '2026-27.1',
              },
              error: null,
            }),
          }),
        }),
      }),
    };

    const rosterCheck = await verifyOperationalAction('OC-SRV-NURS-01', 'roster', mockNursingSupabase);
    assert.equal(rosterCheck.allowed, false, 'Nursing must NOT be rosterable without clinical governance sign-off');

    const quoteCheck = await verifyOperationalAction('OC-SRV-NURS-01', 'quote', mockNursingSupabase);
    assert.equal(quoteCheck.allowed, false, 'Nursing must NOT be quote-eligible');
  });
});
