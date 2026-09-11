import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { INITIAL_SERVICE_SCOPE_REGISTRY, ServiceScopeItem } from '@/lib/services/serviceScope';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');
    const visibleOnly = searchParams.get('visible') === 'true';

    const supabase = createAdminClient();
    if (!supabase) {
      // Return static fallback if database is unreachable
      let list = [...INITIAL_SERVICE_SCOPE_REGISTRY];
      if (statusFilter) {
        list = list.filter((s) => s.operationalStatus === statusFilter);
      }
      if (visibleOnly) {
        list = list.filter((s) => s.websiteVisible);
      }
      return NextResponse.json({ ok: true, services: list, source: 'static_fallback' });
    }

    let query = supabase
      .from('service_scope_registry')
      .select('*')
      .order('service_code', { ascending: true });

    if (statusFilter) {
      query = query.eq('operational_status', statusFilter);
    }
    if (visibleOnly) {
      query = query.eq('website_visible', true);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      let list = [...INITIAL_SERVICE_SCOPE_REGISTRY];
      if (statusFilter) {
        list = list.filter((s) => s.operationalStatus === statusFilter);
      }
      if (visibleOnly) {
        list = list.filter((s) => s.websiteVisible);
      }
      return NextResponse.json({ ok: true, services: list, source: 'static_registry' });
    }

    const mapped: ServiceScopeItem[] = data.map((d: any) => ({
      serviceCode: d.service_code,
      publicName: d.public_name,
      internalDescription: d.internal_description,
      ndisCategory: d.ndis_category,
      ndisSupportCatalogueMapping: Array.isArray(d.ndis_support_catalogue_mapping) ? d.ndis_support_catalogue_mapping : [],
      operationalStatus: d.operational_status,
      fundingMethodsAllowed: Array.isArray(d.funding_methods_allowed) ? d.funding_methods_allowed : [],
      registrationRequired: Boolean(d.registration_required),
      riskClass: d.risk_class,
      clinicalApprovalRequired: Boolean(d.clinical_approval_required),
      participantPlanRequired: Boolean(d.participant_plan_required),
      requiredWorkerCredentials: Array.isArray(d.required_worker_credentials) ? d.required_worker_credentials : [],
      requiredCompetencies: Array.isArray(d.required_competencies) ? d.required_competencies : [],
      transportEligible: Boolean(d.transport_eligible),
      travelBillingEligible: Boolean(d.travel_billing_eligible),
      cancellationEligible: Boolean(d.cancellation_eligible),
      quoteEligible: Boolean(d.quote_eligible),
      rosterEligible: Boolean(d.roster_eligible),
      invoiceEligible: Boolean(d.invoice_eligible),
      websiteVisible: Boolean(d.website_visible),
      effectiveDate: d.effective_date,
      version: d.version,
    }));

    return NextResponse.json({ ok: true, services: mapped, source: 'database' });
  } catch (err: any) {
    console.error('GET /api/governance/service-scope error:', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to load service scope registry' }, { status: 500 });
  }
}
