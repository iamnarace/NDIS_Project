import { userFacingError } from '@/lib/userFacingError';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { isValidUuid, resolveParticipantUuid } from '@/lib/uuid';

/**
 * GET /api/portal/participant/goals?participant_id=xxx
 * POST /api/portal/participant/goals - create a new goal
 * PATCH /api/portal/participant/goals - update goal status or details
 * DELETE /api/portal/participant/goals?id=xxx - delete goal
 */
export async function GET(request: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);
    let supabase: any = null;

    if (isAdmin) {
      supabase = createAdminClient();
    } else {
      supabase = await createClient();
    }

    if (!supabase) {
      return NextResponse.json({ goals: [] }, { status: 200 });
    }

    if (!isAdmin) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
      }
    }

    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get('participant_id');

    let resolvedParticipantId = participantId;
    if (resolvedParticipantId && !isValidUuid(resolvedParticipantId)) {
      resolvedParticipantId = (await resolveParticipantUuid(supabase, resolvedParticipantId)) || resolvedParticipantId;
    }

    let query = supabase
      .from('participant_goals')
      .select(`
        id, participant_id, goal_title, goal_description, category,
        status, target_date, review_date, priority,
        ndis_domain, created_at, updated_at
      `)
      .order('created_at', { ascending: false });

    if (resolvedParticipantId && isValidUuid(resolvedParticipantId)) {
      query = query.eq('participant_id', resolvedParticipantId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Goals fetch error:', error);
      return NextResponse.json({ goals: [] });
    }

    return NextResponse.json({ goals: data || [] });
  } catch (err) {
    console.error('GET /api/portal/participant/goals error:', err);
    return NextResponse.json({ error: "We couldn't complete this action. Please refresh and try again." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);
    let supabase: any = null;
    let userId: string | null = null;

    if (isAdmin) {
      supabase = createAdminClient();
    } else {
      supabase = await createClient();
    }

    if (!supabase) {
      return NextResponse.json({ error: "We couldn't complete this action. Please refresh and try again." }, { status: 503 });
    }

    if (!isAdmin) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
      }
      userId = user.id;
    }

    const body = await request.json();
    const {
      participant_id, goal_title, goal_description, category,
      status, target_date, review_date, priority, ndis_domain,
    } = body;

    if (!participant_id || !goal_title) {
      return NextResponse.json({ error: 'participant_id and goal_title are required' }, { status: 400 });
    }

    let resolvedParticipantId = participant_id;
    if (!isValidUuid(participant_id)) {
      resolvedParticipantId = await resolveParticipantUuid(supabase, participant_id);
    }
    if (!resolvedParticipantId || !isValidUuid(resolvedParticipantId)) {
      return NextResponse.json({ error: "We couldn't complete this action. Please refresh and try again." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('participant_goals')
      .insert({
        participant_id: resolvedParticipantId,
        goal_title,
        goal_description: goal_description || null,
        category: category || 'General',
        status: status || 'active',
        target_date: target_date || null,
        review_date: review_date || null,
        priority: priority || 3,
        ndis_domain: ndis_domain || null,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Goal create error:', error);
      return NextResponse.json({ error: userFacingError(error.message) }, { status: 500 });
    }

    return NextResponse.json({ goal: data }, { status: 201 });
  } catch (err) {
    console.error('POST /api/portal/participant/goals error:', err);
    return NextResponse.json({ error: "We couldn't complete this action. Please refresh and try again." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);
    let supabase: any = null;

    if (isAdmin) {
      supabase = createAdminClient();
    } else {
      supabase = await createClient();
    }

    if (!supabase) {
      return NextResponse.json({ error: "We couldn't complete this action. Please refresh and try again." }, { status: 503 });
    }

    if (!isAdmin) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
      }
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Goal id is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('participant_goals')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: userFacingError(error.message) }, { status: 500 });
    }

    return NextResponse.json({ goal: data });
  } catch (err) {
    console.error('PATCH /api/portal/participant/goals error:', err);
    return NextResponse.json({ error: "We couldn't complete this action. Please refresh and try again." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);
    let supabase: any = null;

    if (isAdmin) {
      supabase = createAdminClient();
    } else {
      supabase = await createClient();
    }

    if (!supabase) {
      return NextResponse.json({ error: "We couldn't complete this action. Please refresh and try again." }, { status: 503 });
    }

    if (!isAdmin) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
      }
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Goal id is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('participant_goals')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: userFacingError(error.message) }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/portal/participant/goals error:', err);
    return NextResponse.json({ error: "We couldn't complete this action. Please refresh and try again." }, { status: 500 });
  }
}
