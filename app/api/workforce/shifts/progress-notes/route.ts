import { userFacingError } from '@/lib/userFacingError';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { isValidUuid, resolveStaffUuid, resolveParticipantUuid } from '@/lib/uuid';
import { logAuditEvent } from '@/lib/audit';

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
    const staffId = searchParams.get('staff_id');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const incidentFlag = searchParams.get('incident_flag');
    const followUpRequired = searchParams.get('follow_up_required');
    const goalId = searchParams.get('goal_id');

    let query = supabase
      .from('shift_progress_notes')
      .select(`
        *,
        staff:staff(id, full_name, role, reference_number),
        participant:participants(id, full_name, reference_number),
        incident:incidents(id, incident_reference, severity, status),
        shift:shifts(id, shift_reference, service_type, start_time, end_time),
        goals:progress_note_goals(
          id,
          goal_id,
          progress_rating,
          worker_comment,
          created_at,
          goal:participant_goals(id, goal_title, category)
        )
      `)
      .order('created_at', { ascending: false });

    if (shiftId) {
      if (isValidUuid(shiftId)) query = query.eq('shift_id', shiftId);
    }
    if (participantId) {
      const pUuid = isValidUuid(participantId) ? participantId : await resolveParticipantUuid(supabase, participantId);
      if (pUuid) query = query.eq('participant_id', pUuid);
    }
    if (staffId) {
      const sUuid = isValidUuid(staffId) ? staffId : await resolveStaffUuid(supabase, staffId);
      if (sUuid) query = query.eq('staff_id', sUuid);
    }
    if (dateFrom) query = query.gte('service_date', dateFrom);
    if (dateTo) query = query.lte('service_date', dateTo);
    if (incidentFlag === 'true') query = query.eq('incident_occurred', true);
    if (incidentFlag === 'false') query = query.eq('incident_occurred', false);
    if (followUpRequired === 'true') query = query.eq('follow_up_required', true);
    if (followUpRequired === 'false') query = query.eq('follow_up_required', false);

    const { data, error } = await query;
    if (error) {
      console.error('Progress notes query error:', error);
      return NextResponse.json({ notes: [] });
    }

    let results = data || [];
    // If goalId filter is requested, filter notes that contain that goal
    if (goalId) {
      results = results.filter((n: any) =>
        Array.isArray(n.goals) && n.goals.some((g: any) => g.goal_id === goalId)
      );
    }

    return NextResponse.json({ notes: results });
  } catch (err) {
    console.error('GET /api/workforce/shifts/progress-notes error:', err);
    return NextResponse.json({ error: "We couldn't complete this action. Please refresh and try again." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);
    let supabase: any = null;
    let staffId: string | null = null;
    let actorId: string = 'admin';

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
      staff_id: inputStaffId,
      note_text,
      support_delivered,
      participant_response,
      outcomes_observed,
      concerns,
      follow_up_required,
      follow_up_notes,
      service_date,
      goals_supported,
      incident_occurred,
      incident_id,
      signed_by_worker,
      signed_at,
      goals, // Array of { goal_id, progress_rating, worker_comment }
    } = body;

    const rawStaffId = inputStaffId || staffId;
    const resolvedStaffId = isValidUuid(rawStaffId) ? rawStaffId : await resolveStaffUuid(supabase, rawStaffId);
    const resolvedParticipantId = isValidUuid(participant_id) ? participant_id : await resolveParticipantUuid(supabase, participant_id);

    const primaryText = (note_text || support_delivered || '').trim();
    if (!shift_id || !resolvedParticipantId || !resolvedStaffId || !primaryText) {
      return NextResponse.json(
        { error: 'shift_id, participant_id, staff_id, and support notes are required.' },
        { status: 400 }
      );
    }

    const effectiveDate = service_date || new Date().toISOString().slice(0, 10);

    const { data: note, error: insertError } = await supabase
      .from('shift_progress_notes')
      .insert({
        shift_id,
        participant_id: resolvedParticipantId,
        staff_id: resolvedStaffId,
        service_date: effectiveDate,
        note_text: primaryText,
        support_delivered: support_delivered || primaryText,
        participant_response: participant_response || null,
        outcomes_observed: outcomes_observed || null,
        concerns: concerns || null,
        follow_up_required: Boolean(follow_up_required),
        follow_up_notes: follow_up_notes || null,
        goals_supported: goals_supported || null,
        incident_occurred: Boolean(incident_occurred),
        incident_id: incident_id || null,
        signed_by_worker: signed_by_worker !== false,
        signed_at: signed_at || new Date().toISOString(),
      })
      .select(`
        *,
        staff:staff(id, full_name, role, reference_number),
        participant:participants(id, full_name, reference_number),
        incident:incidents(id, incident_reference, severity, status)
      `)
      .single();

    if (insertError) {
      console.error('Progress note insert error:', insertError);
      return NextResponse.json({ error: userFacingError(insertError.message) }, { status: 500 });
    }

    // Insert progress_note_goals if provided
    if (Array.isArray(goals) && goals.length > 0) {
      const goalInserts = goals
        .filter((g: any) => g && g.goal_id && isValidUuid(g.goal_id))
        .map((g: any) => ({
          progress_note_id: note.id,
          goal_id: g.goal_id,
          progress_rating: g.progress_rating || 'Maintained',
          worker_comment: g.worker_comment || null,
        }));

      if (goalInserts.length > 0) {
        const { error: goalErr } = await supabase
          .from('progress_note_goals')
          .insert(goalInserts);
        if (goalErr) {
          console.error('Error inserting progress note goals:', goalErr);
        }
      }
    }

    // Audit Event
    await logAuditEvent({
      entity_type: 'shift_progress_notes',
      entity_id: note.id,
      actor_type: isAdmin ? 'admin' : 'worker',
      actor_id: actorId,
      action: 'progress_note_submitted',
      metadata: {
        shift_id,
        participant_id: resolvedParticipantId,
        staff_id: resolvedStaffId,
        incident_occurred: Boolean(incident_occurred),
        follow_up_required: Boolean(follow_up_required),
      },
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch (err) {
    console.error('POST /api/workforce/shifts/progress-notes error:', err);
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
    const { id, reason, ...updates } = body;

    if (!id || !isValidUuid(id)) {
      return NextResponse.json({ error: 'Valid Progress Note UUID id is required.' }, { status: 400 });
    }

    // Fetch before values for audit history
    const { data: beforeNote, error: fetchErr } = await supabase
      .from('shift_progress_notes')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !beforeNote) {
      return NextResponse.json({ error: 'Progress note not found.' }, { status: 404 });
    }

    const safeUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.note_text !== undefined) safeUpdates.note_text = updates.note_text;
    if (updates.support_delivered !== undefined) safeUpdates.support_delivered = updates.support_delivered;
    if (updates.participant_response !== undefined) safeUpdates.participant_response = updates.participant_response;
    if (updates.outcomes_observed !== undefined) safeUpdates.outcomes_observed = updates.outcomes_observed;
    if (updates.concerns !== undefined) safeUpdates.concerns = updates.concerns;
    if (updates.follow_up_required !== undefined) safeUpdates.follow_up_required = Boolean(updates.follow_up_required);
    if (updates.follow_up_notes !== undefined) safeUpdates.follow_up_notes = updates.follow_up_notes;
    if (updates.incident_occurred !== undefined) safeUpdates.incident_occurred = Boolean(updates.incident_occurred);
    if (updates.incident_id !== undefined) safeUpdates.incident_id = updates.incident_id;

    const { data: updatedNote, error: updateErr } = await supabase
      .from('shift_progress_notes')
      .update(safeUpdates)
      .eq('id', id)
      .select(`
        *,
        staff:staff(id, full_name, role, reference_number),
        participant:participants(id, full_name, reference_number),
        incident:incidents(id, incident_reference, severity, status)
      `)
      .single();

    if (updateErr) {
      return NextResponse.json({ error: userFacingError(updateErr.message) }, { status: 500 });
    }

    // Record audit event with before and after values (preventing silent destructive edits)
    await logAuditEvent({
      entity_type: 'shift_progress_notes',
      entity_id: id,
      actor_type: isAdmin ? 'admin' : 'worker',
      actor_id: actorId,
      action: 'progress_note_edited',
      changes: {
        before: beforeNote,
        after: updatedNote,
      },
      metadata: {
        reason: reason || 'Routine record update',
      },
    });

    return NextResponse.json({ note: updatedNote });
  } catch (err) {
    console.error('PATCH /api/workforce/shifts/progress-notes error:', err);
    return NextResponse.json({ error: "We couldn't complete this action. Please refresh and try again." }, { status: 500 });
  }
}

