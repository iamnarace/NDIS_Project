import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { logAuditEvent } from '@/lib/audit';
import { REGIONAL_DISRUPTION_PROFILES } from '@/lib/services/whsContinuityGovernance';

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);
    let supabase: any = null;

    if (isAdmin) {
      supabase = createAdminClient();
    } else {
      supabase = await createClient();
    }

    if (!supabase) return NextResponse.json({ plans: [], regional_profiles: REGIONAL_DISRUPTION_PROFILES });

    if (!isAdmin) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, portal_participant_id, portal_staff_id, is_active')
        .eq('id', user.id)
        .single();
      if (!profile?.is_active) return NextResponse.json({ error: 'Unauthorised' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get('participant_id');
    const scopeType = searchParams.get('scope_type');

    let query = supabase
      .from('emergency_continuity_plans')
      .select('*, participant:participants(id, full_name, reference_number, suburb)')
      .order('created_at', { ascending: false });

    if (participantId) query = query.eq('participant_id', participantId);
    if (scopeType) query = query.eq('scope_type', scopeType);

    const { data, error } = await query;
    if (error) {
      console.error('Continuity plans query error:', error);
      return NextResponse.json({ plans: [], regional_profiles: REGIONAL_DISRUPTION_PROFILES });
    }

    return NextResponse.json({
      plans: data || [],
      regional_profiles: REGIONAL_DISRUPTION_PROFILES,
    });
  } catch (err) {
    console.error('GET /api/governance/continuity error:', err);
    return NextResponse.json({ error: 'Failed to retrieve continuity plans.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Only administrative staff can record continuity plans.' }, { status: 403 });
    }

    const supabase = createAdminClient();
    if (!supabase) return NextResponse.json({ error: 'Service unavailable.' }, { status: 503 });

    const body = await request.json();
    const {
      scope_type,
      participant_id,
      region,
      title,
      service_priority,
      emergency_contacts,
      critical_dependencies,
      evacuation_safe_location,
      alternate_worker_plan,
      disruption_scenarios,
      continuity_checklists,
    } = body;

    if (!title) {
      return NextResponse.json({ error: 'Plan title is required.' }, { status: 400 });
    }

    const year = new Date().getFullYear();
    const { count } = await supabase
      .from('emergency_continuity_plans')
      .select('*', { count: 'exact', head: true });
    const ref = `ECP-${year}-${String((count ?? 0) + 1).padStart(4, '0')}`;

    const { data, error } = await supabase
      .from('emergency_continuity_plans')
      .insert({
        plan_reference: ref,
        scope_type: scope_type || 'participant_specific',
        participant_id: participant_id || null,
        region: region || 'All',
        title,
        service_priority: service_priority || 'P2_essential_support',
        emergency_contacts: emergency_contacts || [],
        critical_dependencies: critical_dependencies || null,
        evacuation_safe_location: evacuation_safe_location || null,
        alternate_worker_plan: alternate_worker_plan || null,
        disruption_scenarios: disruption_scenarios || [],
        continuity_checklists: continuity_checklists || [],
        status: 'active',
        last_reviewed_at: new Date().toISOString(),
        next_review_due: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
        reviewed_by: 'Operations Lead',
      })
      .select('*, participant:participants(id, full_name, reference_number)')
      .single();

    if (error) {
      console.error('Continuity plan insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAuditEvent({
      entity_type: 'emergency_continuity_plan',
      entity_id: data.id,
      actor_type: 'admin',
      actor_id: 'admin',
      action: 'created',
      changes: { plan_reference: ref, scope_type: data.scope_type },
      metadata: { participant_id },
    });

    return NextResponse.json({ plan: data }, { status: 201 });
  } catch (err) {
    console.error('POST /api/governance/continuity error:', err);
    return NextResponse.json({ error: 'Failed to record continuity plan.' }, { status: 500 });
  }
}
