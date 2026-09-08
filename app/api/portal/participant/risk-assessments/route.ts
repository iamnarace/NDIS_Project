import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/portal/participant/risk-assessments?participant_id=xxx
 * POST — create new risk assessment (staff only)
 * PATCH — update risk assessment
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) return NextResponse.json({ assessments: [] });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get('participant_id');

    let query = supabase
      .from('risk_assessments')
      .select(`
        id, participant_id, assessment_title, version, status,
        falls_and_mobility, medication_risks, behaviour_and_mental_health,
        environmental_hazards, community_access_risks, fire_and_emergency,
        financial_exploitation, other_risks, overall_risk_rating,
        review_date, approved_at, created_at, updated_at
      `)
      .order('version', { ascending: false });

    if (participantId) {
      query = query.eq('participant_id', participantId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Risk assessments fetch error:', error);
      return NextResponse.json({ assessments: [] });
    }

    return NextResponse.json({ assessments: data || [] });
  } catch (err) {
    console.error('GET /api/portal/participant/risk-assessments error:', err);
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
    const { participant_id, ...assessmentData } = body;

    if (!participant_id) {
      return NextResponse.json({ error: 'participant_id is required' }, { status: 400 });
    }

    // Get next version
    const { data: existing } = await supabase
      .from('risk_assessments')
      .select('version')
      .eq('participant_id', participant_id)
      .order('version', { ascending: false })
      .limit(1);

    const nextVersion = existing && existing.length > 0 ? existing[0].version + 1 : 1;

    // Supersede previous active
    if (nextVersion > 1) {
      await supabase
        .from('risk_assessments')
        .update({ status: 'superseded', updated_at: new Date().toISOString() })
        .eq('participant_id', participant_id)
        .eq('status', 'active');
    }

    const { data, error } = await supabase
      .from('risk_assessments')
      .insert({
        participant_id,
        version: nextVersion,
        created_by: user.id,
        ...assessmentData,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ assessment: data }, { status: 201 });
  } catch (err) {
    console.error('POST /api/portal/participant/risk-assessments error:', err);
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

    if (!id) return NextResponse.json({ error: 'Assessment id is required' }, { status: 400 });

    if (updates.status === 'active' && !updates.approved_by) {
      updates.approved_by = user.id;
      updates.approved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('risk_assessments')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ assessment: data });
  } catch (err) {
    console.error('PATCH /api/portal/participant/risk-assessments error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
