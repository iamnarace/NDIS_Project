import { userFacingError } from '@/lib/userFacingError';
﻿import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { isValidUuid, resolveStaffUuid } from '@/lib/uuid';
import { logAuditEvent } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);
    let supabase: any = null;
    let workerStaffId: string | null = null;

    if (isAdmin) {
      supabase = createAdminClient();
    } else {
      supabase = await createClient();
    }

    if (!supabase) return NextResponse.json({ timesheets: [] });

    if (!isAdmin) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

      const { data: profile } = await supabase
        .from('profiles')
        .select('portal_staff_id')
        .eq('id', user.id)
        .single();
      workerStaffId = profile?.portal_staff_id || null;
      if (!workerStaffId) return NextResponse.json({ timesheets: [] });
    }

    const { searchParams } = new URL(request.url);
    const staffIdParam = searchParams.get('staff_id');
    const weekStart = searchParams.get('week_start');
    const status = searchParams.get('status');

    let query = supabase
      .from('timesheets')
      .select(`
        *,
        staff:staff(id, full_name, role, reference_number, email, phone),
        entries:timesheet_entries(
          *,
          shift:shifts(id, shift_reference, service_type, start_time, end_time, location_suburb),
          participant:participants(id, full_name, reference_number)
        )
      `)
      .order('week_start', { ascending: false });

    if (!isAdmin && workerStaffId) {
      query = query.eq('staff_id', workerStaffId);
    } else if (staffIdParam) {
      const resolved = isValidUuid(staffIdParam) ? staffIdParam : await resolveStaffUuid(supabase, staffIdParam);
      if (resolved) query = query.eq('staff_id', resolved);
    }

    if (weekStart) query = query.eq('week_start', weekStart);
    if (status && status !== 'all') query = query.eq('status', status);

    const { data, error } = await query;
    if (error) {
      console.error('Timesheets query error:', error);
      return NextResponse.json({ timesheets: [] });
    }

    return NextResponse.json({ timesheets: data || [] });
  } catch (err) {
    console.error('GET /api/workforce/timesheets error:', err);
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
      return NextResponse.json({ error: 'Manager authorisation required to approve/adjust timesheets.' }, { status: 403 });
    }

    const body = await request.json();
    const { action, timesheet_id, timesheet_ids, entry_id, reason, manager_note, updates } = body;

    // 1. Single Timesheet Approval
    if (action === 'approve') {
      if (!timesheet_id || !isValidUuid(timesheet_id)) {
        return NextResponse.json({ error: 'Valid timesheet_id is required.' }, { status: 400 });
      }

      // Update Timesheet
      const { data: updatedTs, error: tsErr } = await supabase
        .from('timesheets')
        .update({
          status: 'Approved',
          approved_at: new Date().toISOString(),
          notes: manager_note || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', timesheet_id)
        .select()
        .single();

      if (tsErr) return NextResponse.json({ error: userFacingError(tsErr.message) }, { status: 500 });

      // Update Entries
      await supabase
        .from('timesheet_entries')
        .update({
          status: 'Approved',
          manager_note: manager_note || null,
          updated_at: new Date().toISOString(),
        })
        .eq('timesheet_id', timesheet_id);

      // Transition linked service_records to 'Ready' (Billing Source of Truth)
      const { data: entries } = await supabase
        .from('timesheet_entries')
        .select('id, shift_id')
        .eq('timesheet_id', timesheet_id);

      if (entries && entries.length > 0) {
        const entryIds = entries.map((e: any) => e.id);
        await supabase
          .from('service_records')
          .update({
            approval_status: 'Approved',
            billable_status: 'Ready',
            updated_at: new Date().toISOString(),
          })
          .in('timesheet_entry_id', entryIds);
      }

      // Audit Event
      await logAuditEvent({
        entity_type: 'timesheets',
        entity_id: timesheet_id,
        actor_type: 'admin',
        actor_id: actorId,
        action: 'timesheet_approved',
        metadata: {
          manager_note,
        },
      });

      return NextResponse.json({ success: true, timesheet: updatedTs });
    }

    // 2. Timesheet Rejection
    if (action === 'reject') {
      if (!timesheet_id || !isValidUuid(timesheet_id)) {
        return NextResponse.json({ error: 'Valid timesheet_id is required.' }, { status: 400 });
      }

      const { data: updatedTs, error: tsErr } = await supabase
        .from('timesheets')
        .update({
          status: 'Rejected',
          notes: manager_note || 'Timesheet rejected by manager',
          updated_at: new Date().toISOString(),
        })
        .eq('id', timesheet_id)
        .select()
        .single();

      if (tsErr) return NextResponse.json({ error: userFacingError(tsErr.message) }, { status: 500 });

      await supabase
        .from('timesheet_entries')
        .update({
          status: 'Rejected',
          manager_note: manager_note || null,
          updated_at: new Date().toISOString(),
        })
        .eq('timesheet_id', timesheet_id);

      // Transition linked service records to 'Excluded'
      const { data: entries } = await supabase
        .from('timesheet_entries')
        .select('id')
        .eq('timesheet_id', timesheet_id);

      if (entries && entries.length > 0) {
        const entryIds = entries.map((e: any) => e.id);
        await supabase
          .from('service_records')
          .update({
            approval_status: 'Rejected',
            billable_status: 'Excluded',
            updated_at: new Date().toISOString(),
          })
          .in('timesheet_entry_id', entryIds);
      }

      await logAuditEvent({
        entity_type: 'timesheets',
        entity_id: timesheet_id,
        actor_type: 'admin',
        actor_id: actorId,
        action: 'timesheet_rejected',
        metadata: {
          reason: manager_note || 'Rejected by manager',
        },
      });

      return NextResponse.json({ success: true, timesheet: updatedTs });
    }

    // 3. Batch Approval of Clean Timesheets
    if (action === 'batch_approve') {
      if (!Array.isArray(timesheet_ids) || timesheet_ids.length === 0) {
        return NextResponse.json({ error: 'timesheet_ids array is required.' }, { status: 400 });
      }

      for (const tId of timesheet_ids) {
        if (!isValidUuid(tId)) continue;
        await supabase
          .from('timesheets')
          .update({
            status: 'Approved',
            approved_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', tId);

        await supabase
          .from('timesheet_entries')
          .update({
            status: 'Approved',
            updated_at: new Date().toISOString(),
          })
          .eq('timesheet_id', tId);

        const { data: entries } = await supabase
          .from('timesheet_entries')
          .select('id')
          .eq('timesheet_id', tId);

        if (entries && entries.length > 0) {
          const entryIds = entries.map((e: any) => e.id);
          await supabase
            .from('service_records')
            .update({
              approval_status: 'Approved',
              billable_status: 'Ready',
              updated_at: new Date().toISOString(),
            })
            .in('timesheet_entry_id', entryIds);
        }

        await logAuditEvent({
          entity_type: 'timesheets',
          entity_id: tId,
          actor_type: 'admin',
          actor_id: actorId,
          action: 'timesheet_batch_approved',
        });
      }

      return NextResponse.json({ success: true, count: timesheet_ids.length });
    }

    // 4. Adjust Individual Timesheet Entry (Requires Reason & Logs Audit Event)
    if (action === 'adjust_entry') {
      if (!entry_id || !isValidUuid(entry_id)) {
        return NextResponse.json({ error: 'Valid entry_id is required.' }, { status: 400 });
      }
      if (!reason || !reason.trim()) {
        return NextResponse.json({ error: 'Mandatory reason is required for manual hours adjustment.' }, { status: 400 });
      }

      // Fetch Before
      const { data: beforeEntry, error: fetchErr } = await supabase
        .from('timesheet_entries')
        .select('*')
        .eq('id', entry_id)
        .single();

      if (fetchErr || !beforeEntry) {
        return NextResponse.json({ error: 'Timesheet entry not found.' }, { status: 404 });
      }

      const newActualHours = updates.actual_hours !== undefined ? Number(updates.actual_hours) : beforeEntry.actual_hours;
      const newBreakMinutes = updates.break_minutes !== undefined ? Number(updates.break_minutes) : beforeEntry.break_minutes;
      const newVariance = Math.round((newActualHours - (beforeEntry.actual_hours || 0)) * 60);

      const safeUpdates = {
        actual_hours: newActualHours,
        break_minutes: newBreakMinutes,
        variance_minutes: newVariance,
        status: 'Adjusted',
        manager_note: (beforeEntry.manager_note ? beforeEntry.manager_note + ' | ' : '') + reason,
        updated_at: new Date().toISOString(),
      };

      const { data: updatedEntry, error: updateErr } = await supabase
        .from('timesheet_entries')
        .update(safeUpdates)
        .eq('id', entry_id)
        .select()
        .single();

      if (updateErr) return NextResponse.json({ error: userFacingError(updateErr.message) }, { status: 500 });

      // Synchronize linked service_records quantity and subtotal!
      const { data: linkedSr } = await supabase
        .from('service_records')
        .select('*')
        .eq('timesheet_entry_id', entry_id)
        .maybeSingle();

      if (linkedSr) {
        const newSubtotal = Number((newActualHours * Number(linkedSr.unit_rate)).toFixed(2));
        await supabase
          .from('service_records')
          .update({
            quantity: newActualHours,
            subtotal: newSubtotal,
            updated_at: new Date().toISOString(),
          })
          .eq('id', linkedSr.id);
      }

      // Record Audit Event with before and after values and reason
      await logAuditEvent({
        entity_type: 'timesheet_entries',
        entity_id: entry_id,
        actor_type: 'admin',
        actor_id: actorId,
        action: 'manual_hours_adjustment',
        changes: {
          before: beforeEntry,
          after: updatedEntry,
        },
        metadata: {
          reason,
          manager_note,
        },
      });

      return NextResponse.json({ success: true, entry: updatedEntry });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (err: any) {
    console.error('PATCH /api/workforce/timesheets error:', err);
    return NextResponse.json({ error: userFacingError(err.message || 'Internal server error') }, { status: 500 });
  }
}
