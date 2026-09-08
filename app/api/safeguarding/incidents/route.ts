import { userFacingError } from '@/lib/userFacingError';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { logAuditEvent } from '@/lib/audit';
import { isValidUuid, resolveParticipantUuid, resolveStaffUuid, resolveShiftUuid } from '@/lib/uuid';

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);
    let supabase: any = null;
    let currentUser: any = null;

    if (isAdmin) {
      supabase = createAdminClient();
    } else {
      supabase = await createClient();
    }

    if (!supabase) return NextResponse.json({ incidents: [] });

    if (!isAdmin) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
      currentUser = user;
    }

    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get('participant_id');
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    const workerId = searchParams.get('worker_id');

    let query = supabase
      .from('incidents')
      .select(`
        *,
        participant:participants(id, full_name, reference_number, funding_type, suburb),
        worker:staff(id, full_name, reference_number, role)
      `)
      .order('incident_at', { ascending: false });

    if (participantId) query = query.eq('participant_id', participantId);
    if (status && status !== 'all') query = query.eq('status', status);
    if (severity && severity !== 'all') query = query.eq('severity', severity);
    if (workerId) query = query.eq('worker_id', workerId);

    // If worker portal, only return incidents they submitted or were involved in
    if (!isAdmin && currentUser) {
      query = query.or(`reported_by.eq.${currentUser.id}`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Incidents query error:', error);
      return NextResponse.json({ incidents: [] });
    }

    return NextResponse.json({ incidents: data || [] });
  } catch (err) {
    console.error('GET /api/safeguarding/incidents error:', err);
    return NextResponse.json({ error: "We couldn't complete this action. Please refresh and try again." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);
    let supabase: any = null;
    let actorId = 'admin';
    let actorType = 'admin';

    if (isAdmin) {
      supabase = createAdminClient();
    } else {
      supabase = await createClient();
    }

    if (!supabase) return NextResponse.json({ error: "We couldn't complete this action. Please refresh and try again." }, { status: 503 });

    if (!isAdmin) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
      actorId = user.id;
      actorType = 'worker';
    }

    const body = await request.json();
    const {
      participant_id,
      worker_id,
      shift_id,
      incident_at,
      location,
      category,
      severity,
      description,
      immediate_actions_taken,
      injury_or_harm_details,
      emergency_services_contacted,
      emergency_services_details,
      witnesses,
      attachment_urls,
    } = body;

    if (!participant_id || !description || !severity) {
      return NextResponse.json(
        { error: 'participant_id, severity, and description are required.' },
        { status: 400 }
      );
    }

    // Defensive resolution of UUIDs
    let resolvedParticipantId = participant_id;
    if (!isValidUuid(participant_id)) {
      resolvedParticipantId = await resolveParticipantUuid(supabase, participant_id);
    }
    if (!resolvedParticipantId || !isValidUuid(resolvedParticipantId)) {
      return NextResponse.json({ error: "We couldn't complete this action. Please refresh and try again." }, { status: 400 });
    }

    let resolvedWorkerId = worker_id || null;
    if (resolvedWorkerId && !isValidUuid(resolvedWorkerId)) {
      resolvedWorkerId = await resolveStaffUuid(supabase, resolvedWorkerId);
    }

    let resolvedShiftId = shift_id || null;
    if (resolvedShiftId && !isValidUuid(resolvedShiftId)) {
      resolvedShiftId = await resolveShiftUuid(supabase, resolvedShiftId);
    }

    // Generate unique reference INC-YYYY-XXXX
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from('incidents')
      .select('*', { count: 'exact', head: true });
    const ref = `INC-${year}-${String((count ?? 0) + 1).padStart(4, '0')}`;

    const { data, error } = await supabase
      .from('incidents')
      .insert({
        incident_reference: ref,
        participant_id: resolvedParticipantId,
        worker_id: resolvedWorkerId,
        shift_id: resolvedShiftId,
        reported_by: actorType === 'worker' ? actorId : null,
        incident_at: incident_at || new Date().toISOString(),
        location: location || null,
        category: category || 'other',
        severity,
        description,
        immediate_actions_taken: immediate_actions_taken || null,
        injury_or_harm_details: injury_or_harm_details || null,
        emergency_services_contacted: Boolean(emergency_services_contacted),
        emergency_services_details: emergency_services_details || null,
        witnesses: witnesses || null,
        attachment_urls: attachment_urls || [],
        status: 'Reported',
        reportable_assessment: 'Pending Review',
        external_notification_status: 'Not Required',
      })
      .select(`
        *,
        participant:participants(id, full_name, reference_number),
        worker:staff(id, full_name, role)
      `)
      .single();

    if (error) {
      console.error('Incident insert error:', error);
      return NextResponse.json({ error: userFacingError(error.message) }, { status: 500 });
    }

    // Link back to shift_progress_notes if shift_id or progress_note_id provided
    if (body.progress_note_id) {
      await supabase
        .from('shift_progress_notes')
        .update({ incident_id: data.id, incident_occurred: true })
        .eq('id', body.progress_note_id);
    } else if (shift_id) {
      await supabase
        .from('shift_progress_notes')
        .update({ incident_id: data.id, incident_occurred: true })
        .eq('shift_id', shift_id);
    }

    // Record audit event
    await logAuditEvent({
      entity_type: 'incident',
      entity_id: data.id,
      actor_type: actorType,
      actor_id: actorId,
      action: 'created',
      changes: { status: 'Reported', severity, category },
      metadata: { incident_reference: ref, participant_id },
    });

    return NextResponse.json({ incident: data }, { status: 201 });
  } catch (err) {
    console.error('POST /api/safeguarding/incidents error:', err);
    return NextResponse.json({ error: "We couldn't complete this action. Please refresh and try again." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);
    let supabase: any = null;
    let actorId = 'admin';

    if (isAdmin) {
      supabase = createAdminClient();
    } else {
      supabase = await createClient();
    }

    if (!supabase) return NextResponse.json({ error: "We couldn't complete this action. Please refresh and try again." }, { status: 503 });

    if (!isAdmin) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
      actorId = user.id;
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Incident ID is required' }, { status: 400 });
    }

    if ('participant_family_followup' in updates) {
      updates.participant_family_follow_up = updates.participant_family_followup;
      delete updates.participant_family_followup;
    }

    // If closing, record closed_at and closed_by
    if (updates.status === 'Closed' && !updates.closed_at) {
      updates.closed_at = new Date().toISOString();
      updates.closed_by = actorId !== 'admin' ? actorId : null;
    }

    const { data, error } = await supabase
      .from('incidents')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`
        *,
        participant:participants(id, full_name, reference_number),
        worker:staff(id, full_name, role)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: userFacingError(error.message) }, { status: 500 });
    }

    // Record audit event
    await logAuditEvent({
      entity_type: 'incident',
      entity_id: id,
      actor_type: isAdmin ? 'admin' : 'staff',
      actor_id: actorId,
      action: updates.status ? 'status_changed' : 'updated',
      changes: updates,
      metadata: { incident_reference: data.incident_reference },
    });

    return NextResponse.json({ incident: data });
  } catch (err) {
    console.error('PATCH /api/safeguarding/incidents error:', err);
    return NextResponse.json({ error: "We couldn't complete this action. Please refresh and try again." }, { status: 500 });
  }
}
