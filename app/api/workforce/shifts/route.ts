import { userFacingError } from '@/lib/userFacingError';
import { NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { isValidUuid, resolveParticipantUuid, resolveStaffUuid } from '@/lib/uuid';

async function generateShiftReference(supabase: ReturnType<typeof createAdminClient>): Promise<string> {
  const year = new Date().getFullYear();
  if (!supabase) return `SHF-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
  
  const { count } = await supabase
    .from('shifts')
    .select('*', { count: 'exact', head: true });
    
  const nextNum = ((count ?? 0) + 1).toString().padStart(4, '0');
  return `SHF-${year}-${nextNum}`;
}

export async function GET(req: Request) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) {
    const client = await createClient();
    if (!client) return NextResponse.json({ message: "We couldn't load your supports. Please try again." }, { status: 503 });
    const { data: { user } } = await client.auth.getUser();
    if (!user) return NextResponse.json({ message: 'Please sign in to continue.' }, { status: 401 });
    const { data: profile } = await client.from('profiles').select('role,is_active,portal_staff_id,portal_participant_id').eq('id', user.id).single();
    if (!profile?.is_active || !['worker', 'participant'].includes(profile.role)) {
      return NextResponse.json({ message: "Your account doesn't currently have portal access. Please contact Opus Care." }, { status: 403 });
    }
    // RLS derives the caller's assignment/participant relationship. Browser IDs never grant access.
    let query = client.from('shifts').select(`id,shift_reference,participant_id,service_type,start_time,end_time,hours,location_suburb,location_address,special_instructions,status,participant:participants(id,reference_number,full_name)`).order('start_time');
    if (profile.role === 'participant') {
      if (!profile.portal_participant_id) return NextResponse.json({ message: 'Please contact Opus Care about portal access.' }, { status: 403 });
      query = query.eq('participant_id', profile.portal_participant_id).gte('end_time', new Date().toISOString()).neq('status', 'cancelled');
    } else if (!profile.portal_staff_id) {
      return NextResponse.json({ message: 'Please contact Opus Care about portal access.' }, { status: 403 });
    }
    const { data, error } = await query;
    if (error) {
      console.error('Portal shifts load failed', error);
      return NextResponse.json({ message: "We couldn't load your supports. Please try again." }, { status: 500 });
    }
    return NextResponse.json(data || []);
  }

  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ message: "We couldn't complete this action. Please refresh and try again." }, { status: 503 });

  const { searchParams } = new URL(req.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const participantId = searchParams.get('participant_id');
  const staffId = searchParams.get('staff_id');
  const status = searchParams.get('status');

  let resolvedPart = participantId;
  if (resolvedPart && !isValidUuid(resolvedPart)) {
    resolvedPart = (await resolveParticipantUuid(supabase, resolvedPart)) || resolvedPart;
  }

  let resolvedStaff = staffId;
  if (resolvedStaff && !isValidUuid(resolvedStaff)) {
    resolvedStaff = (await resolveStaffUuid(supabase, resolvedStaff)) || resolvedStaff;
  }

  let query = supabase
    .from('shifts')
    .select(`
      *,
      participant:participants(id, reference_number, full_name, suburb, street_address, funding_type, allocated_weekly_hours, phone),
      assignments:shift_assignments(
        id,
        staff_id,
        assigned_by,
        assigned_at,
        confirmed_by_worker,
        confirmed_at,
        status,
        clock_in_at,
        clock_out_at,
        actual_hours,
        worker_notes,
        staff:staff(id, reference_number, full_name, role, phone, email, suburbs, ndis_screening, ndis_screening_expiry, first_aid_expiry, cpr_expiry, hourly_rate)
      ),
      progress_notes:shift_progress_notes(*, incident:incidents(id, incident_reference, severity, status))
    `)
    .order('start_time', { ascending: true });

  if (start) query = query.gte('start_time', start);
  if (end) query = query.lte('end_time', end);
  if (resolvedPart && isValidUuid(resolvedPart)) query = query.eq('participant_id', resolvedPart);
  if (status && status !== 'all') query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ message: userFacingError(error.message) }, { status: 500 });

  let results = data ?? [];
  if (staffId) {
    results = results.filter((s: { assignments?: Array<{ staff_id: string }> }) => 
      s.assignments?.some((a) => a.staff_id === staffId)
    );
  }

  return NextResponse.json(results);
}

export async function POST(req: Request) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) return NextResponse.json({ message: 'Unauthorized: Admin access required.' }, { status: 401 });

  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ message: "We couldn't complete this action. Please refresh and try again." }, { status: 503 });

  try {
    const body = await req.json();
    const {
      participant_id,
      service_type,
      ndis_support_item_code = '01_011_0107_1_1',
      start_time,
      end_time,
      location_suburb,
      location_address = '',
      special_instructions = '',
      staff_id = null,
      repeat_weeks = 1,
      force = false,
    } = body;

    if (!participant_id || !service_type || !start_time || !end_time || !location_suburb) {
      return NextResponse.json({ message: 'Missing required shift fields.' }, { status: 400 });
    }

    let resolvedParticipantId = participant_id;
    if (!isValidUuid(participant_id)) {
      resolvedParticipantId = await resolveParticipantUuid(supabase, participant_id);
    }
    if (!resolvedParticipantId || !isValidUuid(resolvedParticipantId)) {
      return NextResponse.json({ message: "We couldn't complete this action. Please refresh and try again." }, { status: 400 });
    }

    let resolvedStaffId = staff_id;
    if (resolvedStaffId && !isValidUuid(resolvedStaffId)) {
      resolvedStaffId = await resolveStaffUuid(supabase, resolvedStaffId);
    }

    const startDate = new Date(start_time);
    const endDate = new Date(end_time);
    if (endDate <= startDate) {
      return NextResponse.json({ message: 'Shift end time must be after start time.' }, { status: 400 });
    }

    const durationHours = Math.round(((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)) * 100) / 100;

    // Double booking detection if staff_id is provided
    let conflictWarning = null;
    if (resolvedStaffId) {
      const { data: overlapping } = await supabase
        .from('shift_assignments')
        .select('id, shift:shifts(id, shift_reference, start_time, end_time, service_type)')
        .eq('staff_id', resolvedStaffId)
        .neq('status', 'cancelled');

      const hasOverlap = (overlapping || []).some((item: any) => {
        if (!item.shift) return false;
        const oStart = new Date(item.shift.start_time);
        const oEnd = new Date(item.shift.end_time);
        return startDate < oEnd && endDate > oStart;
      });

      if (hasOverlap && !force) {
        return NextResponse.json({ 
          message: 'Worker already has a rostered shift during this time window.',
          conflict: true,
          requiresConfirmation: true 
        }, { status: 409 });
      }
    }

    const createdShifts = [];
    const numRepeats = Math.max(1, Math.min(Number(repeat_weeks) || 1, 12));

    for (let i = 0; i < numRepeats; i++) {
      const shiftStart = new Date(startDate.getTime() + i * 7 * 24 * 60 * 60 * 1000);
      const shiftEnd = new Date(endDate.getTime() + i * 7 * 24 * 60 * 60 * 1000);
      const ref = await generateShiftReference(supabase);

      const { data: newShift, error: shiftError } = await supabase
        .from('shifts')
        .insert({
          shift_reference: ref,
          participant_id: resolvedParticipantId,
          service_type,
          ndis_support_item_code,
          start_time: shiftStart.toISOString(),
          end_time: shiftEnd.toISOString(),
          hours: durationHours,
          location_suburb,
          location_address,
          special_instructions,
          status: resolvedStaffId ? 'assigned' : 'unassigned',
        })
        .select()
        .single();

      if (shiftError) {
        return NextResponse.json({ message: userFacingError(shiftError.message) }, { status: 500 });
      }

      if (resolvedStaffId && newShift) {
        await supabase
          .from('shift_assignments')
          .insert({
            shift_id: newShift.id,
            staff_id: resolvedStaffId,
            assigned_by: 'Admin',
            status: 'rostered',
            confirmed_by_worker: false,
          });
      }

      createdShifts.push(newShift);
    }

    return NextResponse.json({ 
      ok: true, 
      count: createdShifts.length, 
      shifts: createdShifts,
      warning: conflictWarning 
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
    const { id, ...updates } = body;

    if (!id) return NextResponse.json({ message: 'Shift id is required.' }, { status: 400 });

    if (updates.start_time && updates.end_time) {
      const s = new Date(updates.start_time);
      const e = new Date(updates.end_time);
      updates.hours = Math.round(((e.getTime() - s.getTime()) / (1000 * 60 * 60)) * 100) / 100;
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('shifts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ message: userFacingError(error.message) }, { status: 500 });
    return NextResponse.json({ ok: true, shift: data });
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
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ message: 'Shift id is required.' }, { status: 400 });

  const { error } = await supabase
    .from('shifts')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ message: userFacingError(error.message) }, { status: 500 });
  return NextResponse.json({ ok: true, deleted_id: id });
}
