import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/portal/participant/support-plans?participant_id=xxx
 * POST — create new versioned support plan (staff only)
 * PATCH — update plan
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) return NextResponse.json({ plans: [] });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get('participant_id');

    let query = supabase
      .from('participant_support_plans')
      .select(`
        id, participant_id, plan_title, version, status,
        primary_disability, secondary_conditions, communication_method,
        preferred_name, cultural_background, language_preference,
        morning_routine, personal_care_needs, mobility_aids,
        medication_details, dietary_requirements,
        behaviour_support_required, triggers_and_responses, de_escalation_strategies,
        linked_goal_ids, plan_start_date, plan_end_date, review_date,
        approved_at, created_at, updated_at
      `)
      .order('version', { ascending: false });

    if (participantId) {
      query = query.eq('participant_id', participantId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Support plans fetch error:', error);
      return NextResponse.json({ plans: [] });
    }

    return NextResponse.json({ plans: data || [] });
  } catch (err) {
    console.error('GET /api/portal/participant/support-plans error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

    const body = await request.json();
    const { participant_id, ...planData } = body;

    if (!participant_id) {
      return NextResponse.json({ error: 'participant_id is required' }, { status: 400 });
    }

    // Get next version number
    const { data: existing } = await supabase
      .from('participant_support_plans')
      .select('version')
      .eq('participant_id', participant_id)
      .order('version', { ascending: false })
      .limit(1);

    const nextVersion = existing && existing.length > 0 ? existing[0].version + 1 : 1;

    // Supersede any currently active plan
    if (nextVersion > 1) {
      await supabase
        .from('participant_support_plans')
        .update({ status: 'superseded', updated_at: new Date().toISOString() })
        .eq('participant_id', participant_id)
        .eq('status', 'active');
    }

    const { data, error } = await supabase
      .from('participant_support_plans')
      .insert({
        participant_id,
        version: nextVersion,
        created_by: user.id,
        ...planData,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ plan: data }, { status: 201 });
  } catch (err) {
    console.error('POST /api/portal/participant/support-plans error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) return NextResponse.json({ error: 'Plan id is required' }, { status: 400 });

    // If activating, check for approved_by
    if (updates.status === 'active' && !updates.approved_by) {
      updates.approved_by = user.id;
      updates.approved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('participant_support_plans')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ plan: data });
  } catch (err) {
    console.error('PATCH /api/portal/participant/support-plans error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
