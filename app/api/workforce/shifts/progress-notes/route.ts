import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);
    let supabase: any = null;

    if (isAdmin) {
      supabase = createAdminClient();
    } else {
      supabase = await createClient();
    }

    if (!supabase) return NextResponse.json({ notes: [] });

    const { searchParams } = new URL(request.url);
    const shiftId = searchParams.get('shift_id');
    const participantId = searchParams.get('participant_id');

    let query = supabase
      .from('shift_progress_notes')
      .select(`
        *,
        staff:staff(id, full_name, role),
        participant:participants(id, full_name, reference_number),
        incident:incidents(id, incident_reference, severity, status)
      `)
      .order('created_at', { ascending: false });

    if (shiftId) query = query.eq('shift_id', shiftId);
    if (participantId) query = query.eq('participant_id', participantId);

    const { data, error } = await query;
    if (error) return NextResponse.json({ notes: [] });

    return NextResponse.json({ notes: data || [] });
  } catch (err) {
    console.error('GET /api/workforce/shifts/progress-notes error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);
    let supabase: any = null;
    let staffId: string | null = null;

    if (isAdmin) {
      supabase = createAdminClient();
    } else {
      supabase = await createClient();
    }

    if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });

    if (!isAdmin) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
      
      // Get worker's staff_id from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('portal_staff_id')
        .eq('id', user.id)
        .single();
      staffId = profile?.portal_staff_id || null;
    }

    const body = await request.json();
    const {
      shift_id,
      participant_id,
      staff_id,
      note_text,
      goals_supported,
      incident_occurred,
      incident_id,
    } = body;

    const resolvedStaffId = staff_id || staffId;

    if (!shift_id || !participant_id || !resolvedStaffId || !note_text) {
      return NextResponse.json(
        { error: 'shift_id, participant_id, staff_id, and note_text are required.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('shift_progress_notes')
      .insert({
        shift_id,
        participant_id,
        staff_id: resolvedStaffId,
        note_text,
        goals_supported: goals_supported || null,
        incident_occurred: Boolean(incident_occurred),
        incident_id: incident_id || null,
      })
      .select(`
        *,
        staff:staff(id, full_name, role),
        participant:participants(id, full_name, reference_number),
        incident:incidents(id, incident_reference, severity, status)
      `)
      .single();

    if (error) {
      console.error('Progress note insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ note: data }, { status: 201 });
  } catch (err) {
    console.error('POST /api/workforce/shifts/progress-notes error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
