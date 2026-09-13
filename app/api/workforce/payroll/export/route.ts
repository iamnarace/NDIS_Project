import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { userFacingError } from '@/lib/userFacingError';

/**
 * GET /api/workforce/payroll/export
 * Exports approved source data for import/reconciliation with an external payroll system.
 * External payroll software remains responsible for award interpretation, PAYG,
 * superannuation, STP reporting and statutory payslips.
 *
 * Architecture:
 * OPUS = factual approved payroll INPUT export
 * EXTERNAL STP/PAYROLL = award interpretation + PAYG + super + STP + statutory payslip
 */

// Effective-dated SCHADS vehicle allowance rate:
// Base: $1.01/km. Temporary rate: $1.05/km for 1 Sep 2026 – 28 Feb 2027; $1.01/km from 1 Mar 2027.
function getEffectiveVehicleRate(dateStr?: string): number {
  const d = dateStr ? new Date(dateStr) : new Date();
  const sep1_2026 = new Date('2026-09-01T00:00:00+10:00');
  const mar1_2027 = new Date('2027-03-01T00:00:00+10:00');
  if (d >= sep1_2026 && d < mar1_2027) {
    return 1.05;
  }
  return 1.01;
}

// Format timestamp in Australia/Sydney IANA timezone
function formatSydneyDateTime(isoDateStr?: string | null): string {
  if (!isoDateStr) return 'N/A';
  try {
    const d = new Date(isoDateStr);
    if (isNaN(d.getTime())) return 'N/A';
    return new Intl.DateTimeFormat('en-AU', {
      timeZone: 'Australia/Sydney',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(d);
  } catch {
    return 'N/A';
  }
}

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Manager authorisation required for payroll export.' }, { status: 401 });
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const weekStart = searchParams.get('week_start');
    const markExported = searchParams.get('mark_exported') === 'true';

    // Fetch approved or submitted timesheets with worker and shift entries
    let query = supabase
      .from('timesheets')
      .select(`
        id,
        week_start,
        week_end,
        status,
        notes,
        staff:staff(id, reference_number, full_name, role, email, engagement_type, hourly_rate),
        entries:timesheet_entries(
          id,
          actual_hours,
          break_minutes,
          travel_minutes,
          kilometres,
          variance_minutes,
          status,
          scheduled_start,
          scheduled_end,
          actual_start,
          actual_end,
          shift:shifts(id, shift_reference, service_type, start_time, end_time)
        )
      `)
      .in('status', ['Approved', 'Exported']);

    if (weekStart) {
      query = query.eq('week_start', weekStart);
    }

    const { data: timesheets, error } = await query;
    if (error) {
      return NextResponse.json({ error: userFacingError(error.message) }, { status: 500 });
    }

    if (!timesheets || timesheets.length === 0) {
      return NextResponse.json({ error: 'No approved timesheets available for export in the selected period.' }, { status: 404 });
    }

    // Build Approved Payroll Input Export CSV
    // Factual source data only — no partial award interpretation engine
    const headers = [
      'WorkerReference',
      'WorkerName',
      'EngagementRelationship',
      'ShiftReference',
      'ActualStartAustraliaSydney',
      'ActualEndAustraliaSydney',
      'ActualHours',
      'BreakMinutes',
      'TravelMinutes',
      'Kilometres',
      'VehicleRatePerKm',
      'VehicleReimbursementAmount',
      'TimesheetID',
      'TimesheetStatus',
      'PayPeriodStart',
      'PayPeriodEnd',
    ];

    const commentHeader = [
      '# OPUS CARE SUPPORT SERVICES - APPROVED PAYROLL INPUT EXPORT',
      '# Exports approved source data for import/reconciliation with an external payroll system. External payroll software remains responsible for award interpretation, PAYG, superannuation, STP reporting and statutory payslips.',
      '# Timezone: Australia/Sydney | Base vehicle allowance: $1.01/km ($1.05/km 1 Sep 2026 - 28 Feb 2027)',
    ].join('\r\n');

    const rows: string[] = [headers.join(',')];

    for (const ts of timesheets) {
      const workerRef = (ts.staff as any)?.reference_number || (ts.staff as any)?.id || 'UNKNOWN';
      const workerName = `"${((ts.staff as any)?.full_name || 'Worker').replace(/"/g, '""')}"`;
      const engagement = `"${((ts.staff as any)?.engagement_type || 'Unspecified').replace(/"/g, '""')}"`;

      const entries = (ts.entries as any[]) || [];

      if (entries.length === 0) {
        // Output timesheet-level row if no detailed entries
        const vehicleRate = getEffectiveVehicleRate(ts.week_start).toFixed(2);
        rows.push([
          workerRef,
          workerName,
          engagement,
          'NONE',
          'N/A',
          'N/A',
          '0.00',
          '0',
          '0',
          '0.0',
          vehicleRate,
          '0.00',
          ts.id,
          ts.status,
          ts.week_start,
          ts.week_end,
        ].join(','));
      } else {
        for (const entry of entries) {
          const shiftRef = entry.shift?.shift_reference || entry.id || 'SHIFT';
          const shiftStartStr = entry.actual_start || entry.scheduled_start || entry.shift?.start_time;
          const shiftEndStr = entry.actual_end || entry.scheduled_end || entry.shift?.end_time;

          const startSydney = `"${formatSydneyDateTime(shiftStartStr)}"`;
          const endSydney = `"${formatSydneyDateTime(shiftEndStr)}"`;

          const actualHours = (Number(entry.actual_hours) || 0).toFixed(2);
          const breakMin = (Number(entry.break_minutes) || 0).toString();
          const travelMin = (Number(entry.travel_minutes) || 0).toString();
          const km = Number(entry.kilometres) || 0;

          const rateDate = shiftStartStr || ts.week_start;
          const vehicleRate = getEffectiveVehicleRate(rateDate);
          const reimbursement = (km * vehicleRate).toFixed(2);

          rows.push([
            workerRef,
            workerName,
            engagement,
            `"${shiftRef}"`,
            startSydney,
            endSydney,
            actualHours,
            breakMin,
            travelMin,
            km.toFixed(1),
            vehicleRate.toFixed(2),
            reimbursement,
            ts.id,
            ts.status,
            ts.week_start,
            ts.week_end,
          ].join(','));
        }
      }
    }

    // If mark_exported requested, update status to 'Exported'
    if (markExported) {
      const approvedIds = timesheets.filter((t) => t.status === 'Approved').map((t) => t.id);
      if (approvedIds.length > 0) {
        await supabase
          .from('timesheets')
          .update({ status: 'Exported', updated_at: new Date().toISOString() })
          .in('id', approvedIds);
      }
    }

    const csvContent = `${commentHeader}\r\n${rows.join('\r\n')}`;
    const filename = `OpusCare_Approved_Payroll_Input_Export_${weekStart || new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: userFacingError(err.message) }, { status: 500 });
  }
}
