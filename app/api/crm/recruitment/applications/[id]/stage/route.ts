import { NextResponse } from 'next/server';
import { getAuthenticatedAdminActor } from '@/lib/adminAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import { userFacingError } from '@/lib/userFacingError';

const VALID_STAGES = new Set([
  'new',
  'reviewing',
  'shortlisted',
  'interview',
  'reference_check',
  'offer',
  'hired',
  'unsuccessful',
  'withdrawn'
]);

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
    const toStage = String(body.stage || '').toLowerCase().trim();
    const note = body.note ? String(body.note).trim() : null;

    if (!VALID_STAGES.has(toStage)) {
      return NextResponse.json({
        ok: false,
        error: `Invalid recruitment stage. Allowed: ${Array.from(VALID_STAGES).join(', ')}`
      }, { status: 400 });
    }

    if (toStage === 'hired') {
      return NextResponse.json({
        ok: false,
        error: 'Use Hire Candidate to complete the worker handoff.'
      }, { status: 400 });
    }

    // 1. Get current stage
    const { data: currentApp, error: fetchErr } = await supabase
      .from('job_applications')
      .select('stage')
      .eq('id', id)
      .single();

    if (fetchErr || !currentApp) {
      return NextResponse.json({ ok: false, error: 'Application not found.' }, { status: 404 });
    }

    if (currentApp.stage === 'hired') {
      return NextResponse.json({
        ok: false,
        error: 'Application is already marked as hired and its stage cannot be modified directly.'
      }, { status: 400 });
    }

    const fromStage = currentApp.stage;
    const now = new Date().toISOString();

    const updates: Record<string, any> = {
      stage: toStage,
      updated_at: now
    };

    if (['unsuccessful', 'withdrawn', 'hired'].includes(toStage)) {
      updates.decision_at = now;
    }

    // 2. Update stage
    const { data: updatedApp, error: updateErr } = await supabase
      .from('job_applications')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (updateErr) {
      return NextResponse.json({ ok: false, error: userFacingError(updateErr.message) }, { status: 500 });
    }

    // 3. Record immutable timeline event
    await supabase.from('job_application_events').insert({
      application_id: id,
      event_type: 'stage_changed',
      from_stage: fromStage,
      to_stage: toStage,
      note: note || `Stage updated from ${fromStage} to ${toStage}`,
      actor: actorId
    });

    return NextResponse.json({
      ok: true,
      stage: toStage,
      application: updatedApp
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Invalid stage update request.' }, { status: 400 });
  }
}
