import { userFacingError } from '@/lib/userFacingError';
import { NextResponse } from 'next/server';
import { getAuthenticatedAdminActor, isAuthenticatedAdmin } from '@/lib/adminAuth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  const actorId = await getAuthenticatedAdminActor(req);
  if (!actorId) return NextResponse.json({ ok: false, error: 'Unauthorized: Admin access required.', message: 'Unauthorized: Admin access required.' }, { status: 401 });

  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "Database service unavailable. Please refresh and try again.", message: "Database service unavailable. Please refresh and try again." }, { status: 503 });

  try {
    const body = await req.json();
    const { shift_id, staff_id, force = false, notes = '' } = body;

    if (!shift_id || !staff_id) {
      return NextResponse.json({ ok: false, error: 'shift_id and staff_id are required', message: 'shift_id and staff_id are required' }, { status: 400 });
    }

    const { data: decision, error: assignmentError } = await supabase.rpc('governance_g2_assign_worker', {
      p_shift_id: shift_id,
      p_staff_id: staff_id,
      p_actor_id: actorId,
      p_notes: notes || null,
      p_force_overlap: Boolean(force),
    });
    if (assignmentError) {
      const conflict = assignmentError.message.includes('schedule conflict');
      const blocked = assignmentError.message.includes('eligibility blocked');
      const message = conflict
        ? 'Worker already has a rostered shift during this time window.'
        : blocked ? 'Worker is not eligible for this participant and service.' : userFacingError(assignmentError.message);
      return NextResponse.json({ ok: false, error: message, message, conflict, requiresConfirmation: conflict }, { status: conflict ? 409 : 400 });
    }

    const { data: assignment, error: loadError } = await supabase
      .from('shift_assignments').select('*, staff:staff(*)').eq('id', decision.assignmentId).single();
    if (loadError) throw loadError;

    return NextResponse.json({
      ok: true,
      assignment,
      eligibility: { decision: decision.decision, reasons: [] },
      warning: decision.overlapOverride ? 'Assigned despite schedule overlap (forced).' : undefined
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ ok: false, error: msg, message: msg }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) return NextResponse.json({ ok: false, error: 'Unauthorized: Admin access required.', message: 'Unauthorized: Admin access required.' }, { status: 401 });

  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "Database service unavailable. Please refresh and try again.", message: "Database service unavailable. Please refresh and try again." }, { status: 503 });

  try {
    const body = await req.json();
    const { id, status, clock_in_at, clock_out_at, actual_hours, worker_notes } = body;

    if (!id) return NextResponse.json({ ok: false, error: 'Assignment id is required', message: 'Assignment id is required' }, { status: 400 });

    const updates: Record<string, any> = {};
    if (status) updates.status = status;
    if (clock_in_at !== undefined) updates.clock_in_at = clock_in_at;
    if (clock_out_at !== undefined) updates.clock_out_at = clock_out_at;
    if (actual_hours !== undefined) updates.actual_hours = actual_hours;
    if (worker_notes !== undefined) updates.worker_notes = worker_notes;

    const { data, error } = await supabase
      .from('shift_assignments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      const msg = error.message || 'Failed to update assignment.';
      return NextResponse.json({ ok: false, error: msg, message: msg }, { status: 500 });
    }

    // Sync shift status if completed
    if (status === 'completed' && data?.shift_id) {
      await supabase
        .from('shifts')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', data.shift_id);
    }

    return NextResponse.json({ ok: true, assignment: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ ok: false, error: msg, message: msg }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) return NextResponse.json({ ok: false, error: 'Unauthorized: Admin access required.', message: 'Unauthorized: Admin access required.' }, { status: 401 });

  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "Database service unavailable. Please refresh and try again.", message: "Database service unavailable. Please refresh and try again." }, { status: 503 });

  const { searchParams } = new URL(req.url);
  const shiftId = searchParams.get('shift_id');

  if (!shiftId) return NextResponse.json({ ok: false, error: 'shift_id is required', message: 'shift_id is required' }, { status: 400 });

  const { error: delErr } = await supabase
    .from('shift_assignments')
    .delete()
    .eq('shift_id', shiftId);

  if (delErr) {
    return NextResponse.json({ ok: false, error: delErr.message, message: delErr.message }, { status: 500 });
  }

  const { error: shiftErr } = await supabase
    .from('shifts')
    .update({ status: 'unassigned', updated_at: new Date().toISOString() })
    .eq('id', shiftId);

  if (shiftErr) {
    return NextResponse.json({ ok: false, error: shiftErr.message, message: shiftErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, unassigned_shift_id: shiftId });
}
