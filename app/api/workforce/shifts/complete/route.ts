import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { isValidUuid } from '@/lib/uuid';

const completionErrors: Record<string, { status: number; message: string }> = {
  worker_identity_unavailable: { status: 403, message: 'Your account does not have worker portal access.' },
  shift_not_found: { status: 404, message: 'This shift could not be found.' },
  shift_not_assigned: { status: 403, message: 'This shift is not assigned to you.' },
  shift_not_completable: { status: 409, message: 'This shift can no longer be completed.' },
  worker_inactive: { status: 403, message: 'Your worker record is not active.' },
  participant_inactive: { status: 409, message: 'This participant record is not active.' },
  invalid_shift_times: { status: 400, message: 'Please check the actual start, finish and break times.' },
  progress_note_required: { status: 400, message: 'Add your support notes and confirm the worker declaration.' },
  follow_up_notes_required: { status: 400, message: 'Describe the follow-up that is required.' },
  invalid_goals: { status: 400, message: 'Please refresh and select valid goals for this participant.' },
  invalid_goal: { status: 400, message: 'Please refresh and select valid goals for this participant.' },
  incident_required: { status: 400, message: 'Submit the incident report before completing this shift, then select its reference.' },
  invalid_incident: { status: 400, message: 'Select an incident you reported for this shift.' },
  invalid_travel: { status: 400, message: 'Please check the travel time and kilometres.' },
  billing_rate_unavailable: { status: 409, message: 'This shift needs a current service rate before it can be completed. Please contact Opus Care.' },
  timesheet_closed: { status: 409, message: 'This timesheet period is already closed. Please contact Opus Care.' },
};

function completionFailure(message: string) {
  const match = Object.entries(completionErrors).find(([key]) => message.includes(key));
  return match?.[1] ?? {
    status: 500,
    message: "We couldn't complete this shift. Please try again. If the problem continues, contact Opus Care.",
  };
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);
    const supabase = isAdmin ? createAdminClient() : await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "We couldn't complete this shift right now." }, { status: 503 });
    }

    if (!isAdmin) {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const body = await request.json();
    const actualEnd = body.actual_finish || body.actual_end;
    if (!isValidUuid(body.shift_id) || !body.actual_start || !actualEnd || !String(body.support_delivered || body.note_text || '').trim()) {
      return NextResponse.json(
        { error: 'Shift, actual start and finish, and support notes are required.' },
        { status: 400 }
      );
    }
    if (isAdmin && !isValidUuid(body.staff_id)) {
      return NextResponse.json({ error: 'Select a valid assigned worker.' }, { status: 400 });
    }

    const travel = body.travel && typeof body.travel === 'object' ? body.travel : body;
    const { data, error } = await supabase.rpc('complete_assigned_shift', {
      p_shift_id: body.shift_id,
      p_actual_start: body.actual_start,
      p_actual_end: actualEnd,
      p_support_delivered: String(body.support_delivered || body.note_text).trim(),
      p_break_minutes: Number(body.break_minutes) || 0,
      p_participant_response: body.participant_response || null,
      p_outcomes_observed: body.outcomes_observed || null,
      p_concerns: body.concerns || null,
      p_follow_up_required: Boolean(body.follow_up_required),
      p_follow_up_notes: body.follow_up_notes || null,
      p_goals: Array.isArray(body.goals) ? body.goals : [],
      p_travel_minutes: Number(travel.travel_minutes) || 0,
      p_kilometres: Number(travel.kilometres) || 0,
      p_travel_type: travel.travel_type || 'provider travel',
      p_travel_notes: travel.travel_notes || null,
      p_origin: travel.origin || null,
      p_destination: travel.destination || null,
      p_incident_occurred: Boolean(body.incident_occurred),
      p_incident_id: body.incident_id || null,
      p_worker_declaration: body.worker_declaration !== false,
      p_admin_staff_id: isAdmin ? body.staff_id : null,
    });

    if (error) {
      console.error('Shift completion transaction failed:', error);
      const failure = completionFailure(error.message);
      return NextResponse.json({ error: failure.message }, { status: failure.status });
    }

    return NextResponse.json({
      success: true,
      already_completed: Boolean(data?.already_completed),
      message: data?.already_completed
        ? 'This shift was already completed. No duplicate records were created.'
        : 'Shift completed. Your progress note and timesheet entry were submitted for review.',
      actual_hours: data?.actual_hours,
      progress_note_id: data?.progress_note_id,
      timesheet_entry_id: data?.timesheet_entry_id,
      travel_record_id: data?.travel_record_id,
      ...(isAdmin ? { service_record_id: data?.service_record_id } : {}),
    }, { status: data?.already_completed ? 200 : 201 });
  } catch (error) {
    console.error('Shift completion request failed:', error);
    return NextResponse.json(
      { error: "We couldn't complete this shift. Please try again. If the problem continues, contact Opus Care." },
      { status: 500 }
    );
  }
}
