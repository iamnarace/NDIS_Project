import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import {
  PUBLIC_MARKETING_FALLBACK_REGISTRY,
  ServiceScopeItem,
} from '@/lib/services/serviceScope';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);
    const { searchParams } = new URL(request.url);

    // 1. Authenticated Admin View: Full internal governance registry
    if (isAdmin) {
      const supabase = createAdminClient();
      if (!supabase) {
        return NextResponse.json(
          { ok: false, error: 'Governance service unavailable — database client unavailable.' },
          { status: 503 }
        );
      }

      const statusFilter = searchParams.get('status');
      let query = supabase
        .from('service_scope_registry')
        .select('*')
        .order('service_code', { ascending: true });

      if (statusFilter) {
        query = query.eq('operational_status', statusFilter);
      }

      const { data, error } = await query;
      if (error) {
        return NextResponse.json(
          { ok: false, error: `Governance service unavailable — service eligibility cannot be verified: ${error.message}` },
          { status: 503 }
        );
      }

      const mapped: ServiceScopeItem[] = (data || []).map((d: any) => ({
        serviceCode: d.service_code,
        publicName: d.public_name,
        internalDescription: d.internal_description,
        ndisCategory: d.ndis_category,
        ndisSupportCatalogueMapping: Array.isArray(d.ndis_support_catalogue_mapping)
          ? d.ndis_support_catalogue_mapping
          : [],
        operationalStatus: d.operational_status,
        fundingMethodsAllowed: Array.isArray(d.funding_methods_allowed)
          ? d.funding_methods_allowed
          : [],
        registrationRequired: Boolean(d.registration_required),
        riskClass: d.risk_class || 'Standard',
        clinicalApprovalRequired: Boolean(d.clinical_approval_required),
        participantPlanRequired: Boolean(d.participant_plan_required),
        requiredWorkerCredentials: Array.isArray(d.required_worker_credentials)
          ? d.required_worker_credentials
          : [],
        requiredCompetencies: Array.isArray(d.required_competencies)
          ? d.required_competencies
          : [],
        activityBasedTransportEligible: Boolean(d.activity_based_transport_eligible),
        providerTravelLabourEligible: Boolean(d.provider_travel_labour_eligible),
        providerTravelNonLabourEligible: Boolean(d.provider_travel_non_labour_eligible),
        generalTransportSupport: Boolean(d.general_transport_support),
        travelBillingEligible:
          Boolean(d.provider_travel_labour_eligible) || Boolean(d.provider_travel_non_labour_eligible),
        cancellationEligible: Boolean(d.cancellation_eligible),
        quoteEligible: Boolean(d.quote_eligible),
        rosterEligible: Boolean(d.roster_eligible),
        invoiceEligible: Boolean(d.invoice_eligible),
        websiteVisible: Boolean(d.website_visible),
        effectiveDate: d.effective_date,
        version: d.version,
      }));

      return NextResponse.json({ ok: true, services: mapped, source: 'database_admin' });
    }

    // 2. Unauthenticated / Public View: ONLY active, website_visible services with safe public fields
    const supabase = createAdminClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('service_scope_registry')
        .select('service_code, public_name, internal_description, ndis_category, operational_status')
        .eq('website_visible', true)
        .in('operational_status', ['ACTIVE', 'ACTIVE_WITH_CONTROLS'])
        .order('service_code', { ascending: true });

      if (!error && data && data.length > 0) {
        const publicServices = data.map((d: any) => ({
          serviceCode: d.service_code,
          name: d.public_name,
          description: d.internal_description,
          category: d.ndis_category,
          status: d.operational_status,
        }));
        return NextResponse.json({ ok: true, services: publicServices, source: 'database_public' });
      }
    }

    // Public fallback (safe marketing items only)
    const publicFallback = PUBLIC_MARKETING_FALLBACK_REGISTRY
      .filter((s) => s.websiteVisible && (s.operationalStatus === 'ACTIVE' || s.operationalStatus === 'ACTIVE_WITH_CONTROLS'))
      .map((s) => ({
        serviceCode: s.serviceCode,
        name: s.publicName,
        description: s.internalDescription,
        category: s.ndisCategory,
        status: s.operationalStatus,
      }));

    return NextResponse.json({ ok: true, services: publicFallback, source: 'fallback_public' });
  } catch (err: any) {
    console.error('GET /api/governance/service-scope error:', err);
    return NextResponse.json(
      { ok: false, error: 'Governance service unavailable.' },
      { status: 500 }
    );
  }
}
