import { userFacingError } from '@/lib/userFacingError';
import { NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) return NextResponse.json({ message: 'Unauthorized: Admin access required.' }, { status: 401 });

  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ message: "We couldn't complete this action. Please refresh and try again." }, { status: 503 });

  try {
    const body = await req.json();
    const { shift_id, staff_id, force = false, notes = '' } = body;

    if (!shift_id || !staff_id) {
      return NextResponse.json({ message: 'shift_id and staff_id are required' }, { status: 400 });
    }

    // 1. Fetch shift details to check timing
    const { data: shift, error: shiftErr } = await supabase
      .from('shifts')
      .select('*')
      .eq('id', shift_id)
      .single();

    if (shiftErr || !shift) {
      return NextResponse.json({ message: 'Shift not found' }, { status: 404 });
    }

    const shiftStart = new Date(shift.start_time);
    const shiftEnd = new Date(shift.end_time);

    // 2. Double-booking conflict check
    const { data: existingAssignments } = await supabase
      .from('shift_assignments')
      .select('id, shift:shifts(id, shift_reference, start_time, end_time, service_type)')
      .eq('staff_id', staff_id)
      .neq('status', 'cancelled');

    const conflict = (existingAssignments || []).find((item: any) => {
      if (!item.shift || item.shift.id === shift_id) return false;
      const oStart = new Date(item.shift.start_time);
      const oEnd = new Date(item.shift.end_time);
      return shiftStart < oEnd && shiftEnd > oStart;
    });

    if (conflict && !force) {
      return NextResponse.json({
        message: `Conflict detected: Worker is already rostered on shift ${(conflict as any).shift?.shift_reference || ''} during this time window.`,
        conflict: true,
        conflicting_shift: (conflict as any).shift,
        requiresConfirmation: true
      }, { status: 409 });
    }

    // 3. Worker Compliance Check (Check screening, first aid, training)
    const { data: worker } = await supabase
      .from('staff')
      .select('id, full_name, ndis_screening_expiry, first_aid_expiry, cpr_expiry')
      .eq('id', staff_id)
      .single();

    const complianceAlerts: string[] = [];
    const today = new Date().toISOString().split('T')[0];

    if (worker) {
      if (worker.ndis_screening_expiry && worker.ndis_screening_expiry < today) {
        complianceAlerts.push('NDIS Worker Screening has expired');
      }
      if (worker.first_aid_expiry && worker.first_aid_expiry < today) {
        complianceAlerts.push('First Aid certification has expired');
      }
      if (worker.cpr_expiry && worker.cpr_expiry < today) {
        complianceAlerts.push('CPR certification has expired');
      }
    }

    // 4. Remove any existing assignment for this shift and assign new worker
    await supabase
      .from('shift_assignments')
      .delete()
      .eq('shift_id', shift_id);

    const { data: assignment, error: assignErr } = await supabase
      .from('shift_assignments')
      .insert({
        shift_id,
        staff_id,
        assigned_by: 'Admin',
        status: 'rostered',
        confirmed_by_worker: false,
        worker_notes: notes || null
      })
      .select('*, staff:staff(*)')
      .single();

    if (assignErr) return NextResponse.json({ message: userFacingError(assignErr.message) }, { status: 500 });

    // Update shift status to 'assigned'
    await supabase
      .from('shifts')
      .update({ status: 'assigned', updated_at: new Date().toISOString() })
      .eq('id', shift_id);

    return NextResponse.json({
      ok: true,
      assignment,
      complianceAlerts,
      warning: conflict ? 'Assigned despite schedule overlap (forced).' : undefined
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ message: "We couldn't complete this action. Please refresh and try again." }, { status: 503 });

  try {
    const body = await req.json();
    const { id, status, clock_in_at, clock_out_at, actual_hours, worker_notes } = body;

    if (!id) return NextResponse.json({ message: 'Assignment id is required' }, { status: 400 });

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

    if (error) return NextResponse.json({ message: userFacingError(error.message) }, { status: 500 });

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
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ message: "We couldn't complete this action. Please refresh and try again." }, { status: 503 });

  const { searchParams } = new URL(req.url);
  const shiftId = searchParams.get('shift_id');

  if (!shiftId) return NextResponse.json({ message: 'shift_id is required' }, { status: 400 });

  await supabase
    .from('shift_assignments')
    .delete()
    .eq('shift_id', shiftId);

  await supabase
    .from('shifts')
    .update({ status: 'unassigned', updated_at: new Date().toISOString() })
    .eq('id', shiftId);

  return NextResponse.json({ ok: true, unassigned_shift_id: shiftId });
}
