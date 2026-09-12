import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { logAuditEvent } from '@/lib/audit';
import { evaluateClinicalServiceReadiness } from '@/lib/services/clinicalGovernance';

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);
    let supabase: any = null;

    if (isAdmin) {
      supabase = createAdminClient();
    } else {
      supabase = await createClient();
    }

    if (!supabase) return NextResponse.json({ services: [] });

    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('service_id');

    let query = supabase
      .from('clinical_service_readiness')
      .select('*, clinical_lead:staff(id, full_name, role, ahpra_registration_number)')
      .order('service_name', { ascending: true });

    if (serviceId) query = query.eq('service_id', serviceId);

    const { data, error } = await query;
    if (error) {
      console.error('Clinical service query error:', error);
      return NextResponse.json({ services: [] });
    }

    const servicesWithReadiness = (data || []).map((s: any) => {
      const evaluation = evaluateClinicalServiceReadiness(s);
      return {
        ...s,
        clinical_readiness: evaluation,
      };
    });

    return NextResponse.json({ services: servicesWithReadiness });
  } catch (err) {
    console.error('GET /api/governance/clinical-service error:', err);
    return NextResponse.json({ error: 'Failed to retrieve clinical service status.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Only administrative management can update clinical governance.' }, { status: 403 });
    }

    const supabase = createAdminClient();
    if (!supabase) return NextResponse.json({ error: 'Service unavailable.' }, { status: 503 });

    const body = await request.json();
    const { service_id, ...updates } = body;

    if (!service_id) {
      return NextResponse.json({ error: 'service_id is required.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('clinical_service_readiness')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('service_id', service_id)
      .select('*, clinical_lead:staff(id, full_name, role, ahpra_registration_number)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAuditEvent({
      entity_type: 'clinical_service_readiness',
      entity_id: data.id,
      actor_type: 'admin',
      actor_id: 'admin',
      action: 'updated',
      changes: updates,
      metadata: { service_id },
    });

    const evaluation = evaluateClinicalServiceReadiness(data);

    return NextResponse.json({ service: data, clinical_readiness: evaluation });
  } catch (err) {
    console.error('PATCH /api/governance/clinical-service error:', err);
    return NextResponse.json({ error: 'Failed to update clinical service.' }, { status: 500 });
  }
}
