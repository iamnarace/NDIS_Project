import { NextResponse } from 'next/server';
import { getAuthenticatedAdminActor, isAuthenticatedAdmin } from '@/lib/adminAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import { userFacingError } from '@/lib/userFacingError';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) {
    return NextResponse.json({ ok: false, error: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Database service unavailable.' }, { status: 503 });
  }

  const { data: interviews, error } = await supabase
    .from('job_interviews')
    .select('*')
    .eq('application_id', id)
    .order('scheduled_at', { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: userFacingError(error.message) }, { status: 500 });
  }

  return NextResponse.json({ ok: true, interviews: interviews || [] });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actorId = await getAuthenticatedAdminActor(req);
  if (!actorId) {
    return NextResponse.json({ ok: false, error: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Database service unavailable.' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const interviewType = body.interview_type || 'phone';
    const scheduledAt = body.scheduled_at;

    if (!scheduledAt) {
      return NextResponse.json({ ok: false, error: 'Scheduled date/time is required.' }, { status: 400 });
    }

    if (!['phone', 'video', 'in_person'].includes(interviewType)) {
      return NextResponse.json({ ok: false, error: 'Interview type must be phone, video, or in_person.' }, { status: 400 });
    }

    const { data: interview, error: insertErr } = await supabase
      .from('job_interviews')
      .insert({
        application_id: id,
        interview_type: interviewType,
        scheduled_at: scheduledAt,
        timezone: body.timezone || 'Australia/Sydney',
        interviewer: body.interviewer || actorId,
        location_or_link: body.location_or_link || null,
        status: body.status || 'scheduled',
        notes: body.notes || null,
        outcome: body.outcome || null
      })
      .select('*')
      .single();

    if (insertErr) {
      return NextResponse.json({ ok: false, error: userFacingError(insertErr.message) }, { status: 500 });
    }

    // Record event
    await supabase.from('job_application_events').insert({
      application_id: id,
      event_type: 'interview_scheduled',
      note: `Interview scheduled (${interviewType.toUpperCase()}) for ${scheduledAt}`,
      actor: actorId
    });

    // Optionally progress stage to 'interview' if requested or if in earlier stage
    if (body.update_stage_to_interview) {
      await supabase
        .from('job_applications')
        .update({ stage: 'interview', updated_at: new Date().toISOString() })
        .eq('id', id);

      await supabase.from('job_application_events').insert({
        application_id: id,
        event_type: 'stage_changed',
        from_stage: body.current_stage || null,
        to_stage: 'interview',
        note: 'Progressed stage to Interview',
        actor: actorId
      });
    }

    return NextResponse.json({ ok: true, interview });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Invalid interview request.' }, { status: 400 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actorId = await getAuthenticatedAdminActor(req);
  if (!actorId) {
    return NextResponse.json({ ok: false, error: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Database service unavailable.' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const interviewId = body.interview_id;
    if (!interviewId) {
      return NextResponse.json({ ok: false, error: 'Interview ID is required.' }, { status: 400 });
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString()
    };
    if (body.status !== undefined) updates.status = body.status;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.outcome !== undefined) updates.outcome = body.outcome;

    const { data: updated, error } = await supabase
      .from('job_interviews')
      .update(updates)
      .eq('id', interviewId)
      .eq('application_id', id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: userFacingError(error.message) }, { status: 500 });
    }

    await supabase.from('job_application_events').insert({
      application_id: id,
      event_type: 'interview_updated',
      note: `Interview updated: status=${updated.status}, outcome=${updated.outcome || 'pending'}`,
      actor: actorId
    });

    return NextResponse.json({ ok: true, interview: updated });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Invalid interview update.' }, { status: 400 });
  }
}
