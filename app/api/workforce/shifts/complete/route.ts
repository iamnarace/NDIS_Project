import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { isValidUuid, resolveStaffUuid, resolveParticipantUuid } from '@/lib/uuid';
import { logAuditEvent } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);
    let supabase: any = null;
    let workerStaffId: string | null = null;
    let actorId = 'admin';

    if (isAdmin) {
      supabase = createAdminClient();
    } else {
      supabase = await createClient();
    }

    if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });

    if (!isAdmin) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
      actorId = user.id;

      const { data: profile } = await supabase
        .from('profiles')
        .select('portal_staff_id')
        .eq('id', user.id)
        .single();
      workerStaffId = profile?.portal_staff_id || null;
    }

    const body = await request.json();
    const {
      shift_id,
      actual_start,
      actual_finish,
      actual_end,
      break_minutes = 0,
      support_delivered,
      participant_response,
      outcomes_observed,
      concerns,
      goals, // Array of { goal_id, progress_rating, worker_comment }
      travel_minutes = 0,
      kilometres = 0,
      travel_type = 'provider travel',
      travel_notes,
      origin,
      destination,
      incident_occurred = false,
      incident_id,
      follow_up_required = false,
      follow_up_notes,
      worker_declaration = true,
      staff_id: inputStaffId,
    } = body;

    const finalActualFinish = actual_finish || actual_end;

    if (!shift_id) {
      return NextResponse.json({ error: 'Shift ID is required.' }, { status: 400 });
    }
    if (!actual_start || !finalActualFinish) {
      return NextResponse.json({ error: 'Actual start and finish times are required.' }, { status: 400 });
    }

    // 1. Fetch Shift details
    const { data: shift, error: shiftErr } = await supabase
      .from('shifts')
      .select('*, participant:participants(*)')
      .eq('id', shift_id)
      .single();

    if (shiftErr || !shift) {
      return NextResponse.json({ error: 'Shift not found.' }, { status: 404 });
    }

    const rawStaffId = inputStaffId || workerStaffId;
    const resolvedStaffId = isValidUuid(rawStaffId)
      ? rawStaffId
      : await resolveStaffUuid(supabase, rawStaffId);

    if (!resolvedStaffId) {
      return NextResponse.json({ error: 'Worker staff identity could not be verified.' }, { status: 400 });
    }

    // 2. Compute actual hours
    const startMs = new Date(actual_start).getTime();
    const finishMs = new Date(finalActualFinish).getTime();
    const breakMs = (Number(break_minutes) || 0) * 60000;
    const diffMs = finishMs - startMs - breakMs;
    const actualHours = Math.max(0.1, Number((diffMs / 3600000).toFixed(2)));

    // 3. Mark Shift & Assignment Completed
    const { error: assignErr } = await supabase
      .from('shift_assignments')
      .update({
        status: 'completed',
        clock_in_at: actual_start,
        clock_out_at: finalActualFinish,
        actual_hours: actualHours,
        worker_notes: support_delivered || 'Shift completed by support worker',
      })
      .eq('shift_id', shift_id)
      .eq('staff_id', resolvedStaffId);

    if (assignErr) {
      console.warn('Assignment update warning:', assignErr.message);
    }

    await supabase
      .from('shifts')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', shift_id);

    // 4. Create / Save Progress Note
    const serviceDate = actual_start.slice(0, 10);
    const noteText = support_delivered || 'Shift support delivered';

    const { data: progressNote, error: noteErr } = await supabase
      .from('shift_progress_notes')
      .insert({
        shift_id,
        participant_id: shift.participant_id,
        staff_id: resolvedStaffId,
        service_date: serviceDate,
        note_text: noteText,
        support_delivered: support_delivered || noteText,
        participant_response: participant_response || null,
        outcomes_observed: outcomes_observed || null,
        concerns: concerns || null,
        follow_up_required: Boolean(follow_up_required),
        follow_up_notes: follow_up_notes || null,
        incident_occurred: Boolean(incident_occurred),
        incident_id: incident_id || null,
        signed_by_worker: Boolean(worker_declaration),
        signed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (noteErr) {
      console.error('Failed to create progress note in completion:', noteErr);
      return NextResponse.json({ error: 'Failed to save progress note: ' + noteErr.message }, { status: 500 });
    }

    // 5. Link Progress Note Goals
    if (Array.isArray(goals) && goals.length > 0) {
      const goalInserts = goals
        .filter((g: any) => g && g.goal_id && isValidUuid(g.goal_id))
        .map((g: any) => ({
          progress_note_id: progressNote.id,
          goal_id: g.goal_id,
          progress_rating: g.progress_rating || 'Maintained',
          worker_comment: g.worker_comment || null,
        }));

      if (goalInserts.length > 0) {
        await supabase.from('progress_note_goals').insert(goalInserts);
      }
    }

    // 6. Record Travel if applicable
    let travelRecord = null;
    const numTravelMin = Number(travel_minutes) || 0;
    const numKm = Number(kilometres) || 0;
    if (numTravelMin > 0 || numKm > 0) {
      const { data: trData } = await supabase
        .from('travel_records')
        .insert({
          shift_id,
          participant_id: shift.participant_id,
          staff_id: resolvedStaffId,
          travel_type: travel_type || 'provider travel',
          travel_minutes: numTravelMin,
          kilometres: numKm,
          origin: origin || null,
          destination: destination || null,
          notes: travel_notes || null,
          approval_status: 'Recorded',
        })
        .select()
        .single();
      travelRecord = trData;
    }

    // 7. Find or create weekly Timesheet
    const d = new Date(actual_start);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(d.setDate(diff));
    mon.setHours(0, 0, 0, 0);
    const weekStart = mon.toISOString().slice(0, 10);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    const weekEnd = sun.toISOString().slice(0, 10);

    let timesheetId: string | null = null;
    const { data: existingTs } = await supabase
      .from('timesheets')
      .select('id, status')
      .eq('staff_id', resolvedStaffId)
      .eq('week_start', weekStart)
      .maybeSingle();

    if (existingTs) {
      timesheetId = existingTs.id;
    } else {
      const { data: newTs } = await supabase
        .from('timesheets')
        .insert({
          staff_id: resolvedStaffId,
          week_start: weekStart,
          week_end: weekEnd,
          status: 'Submitted',
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (newTs) timesheetId = newTs.id;
    }

    // 8. Create Timesheet Entry
    const varianceMinutes = Math.round((actualHours - (shift.hours || 0)) * 60);
    let timesheetEntry = null;

    if (timesheetId) {
      const { data: tsEntry } = await supabase
        .from('timesheet_entries')
        .insert({
          timesheet_id: timesheetId,
          shift_id,
          staff_id: resolvedStaffId,
          participant_id: shift.participant_id,
          scheduled_start: shift.start_time,
          scheduled_end: shift.end_time,
          actual_start,
          actual_end: finalActualFinish,
          break_minutes: Number(break_minutes) || 0,
          actual_hours: actualHours,
          travel_minutes: numTravelMin,
          kilometres: numKm,
          variance_minutes: varianceMinutes,
          status: 'Submitted',
        })
        .select()
        .single();
      timesheetEntry = tsEntry;
    }

    // 9. Determine Pricing Rate & Create Service Record
    let unitRate = 67.56;
    let supportItemName = shift.service_type || 'Assistance With Self-Care Activities';
    let supportItemCode = shift.ndis_support_item_code || '01_011_0107_1_1';

    // Check custom participant agreed rate first
    const { data: customRate } = await supabase
      .from('participant_service_rates')
      .select('agreed_rate, support_item:ndis_support_items(*)')
      .eq('participant_id', shift.participant_id)
      .eq('active', true)
      .maybeSingle();

    if (customRate && customRate.agreed_rate) {
      unitRate = Number(customRate.agreed_rate);
    } else if (shift.ndis_support_item_code) {
      const { data: item } = await supabase
        .from('ndis_support_items')
        .select('reference_rate, support_item_name, support_item_code')
        .eq('support_item_code', shift.ndis_support_item_code)
        .maybeSingle();
      if (item) {
        unitRate = Number(item.reference_rate);
        supportItemName = item.support_item_name;
        supportItemCode = item.support_item_code;
      }
    }

    const subtotal = Number((actualHours * unitRate).toFixed(2));
    const travelAmount = numKm > 0 ? Number((numKm * 1.00).toFixed(2)) : 0;
    const serviceRef = 'SR-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);

    const { data: serviceRecord, error: srErr } = await supabase
      .from('service_records')
      .insert({
        service_reference: serviceRef,
        participant_id: shift.participant_id,
        staff_id: resolvedStaffId,
        shift_id,
        timesheet_entry_id: timesheetEntry?.id || null,
        service_date: serviceDate,
        support_item_code: supportItemCode,
        support_item_name: supportItemName,
        unit_type: 'Hour',
        quantity: actualHours,
        unit_rate: unitRate,
        subtotal,
        travel_amount: travelAmount,
        cancellation_amount: 0,
        billable_status: 'Not Ready', // Becomes 'Ready' upon Timesheet / Manager Approval
        approval_status: 'Pending',
        source: 'Shift Completion',
      })
      .select()
      .single();

    if (srErr) {
      console.warn('Service record creation warning:', srErr.message);
    }

    // 10. Update Participant Funding Budget (Delivered Amount Tracking)
    try {
      const { data: periods } = await supabase
        .from('participant_funding_periods')
        .select('id, participant_funding_budgets(*)')
        .eq('participant_id', shift.participant_id)
        .lte('plan_start', serviceDate)
        .gte('plan_end', serviceDate);

      if (periods && periods.length > 0) {
        const period = periods[0];
        const coreBudget = period.participant_funding_budgets?.find(
          (b: any) => b.category.toLowerCase().includes('core')
        );
        if (coreBudget) {
          const newDelivered = Number(coreBudget.delivered_amount || 0) + subtotal + travelAmount;
          await supabase
            .from('participant_funding_budgets')
            .update({
              delivered_amount: newDelivered,
              updated_at: new Date().toISOString(),
            })
            .eq('id', coreBudget.id);
        }
      }
    } catch (fErr) {
      console.warn('Funding budget update notice:', fErr);
    }

    // 11. Audit Events Logging
    await logAuditEvent({
      entity_type: 'shifts',
      entity_id: shift_id,
      actor_type: isAdmin ? 'admin' : 'worker',
      actor_id: actorId,
      action: 'shift_completed',
      metadata: {
        actual_hours: actualHours,
        service_record_id: serviceRecord?.id,
        progress_note_id: progressNote.id,
        timesheet_entry_id: timesheetEntry?.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Shift completed successfully. Progress note, timesheet entry, and service record recorded.',
      actual_hours: actualHours,
      progress_note: progressNote,
      timesheet_entry: timesheetEntry,
      service_record: serviceRecord,
      travel_record: travelRecord,
    }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/workforce/shifts/complete error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
