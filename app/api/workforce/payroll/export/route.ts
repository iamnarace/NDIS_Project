import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { userFacingError } from '@/lib/userFacingError';

/**
 * GET /api/workforce/payroll/export
 * Exports approved timesheets into a SCHADS-mapped, external STP payroll-ready CSV.
 * Boundary: Timesheet/Hours -> SCHADS Classification -> STP CSV Export.
 * Real payroll engine (tax withholding, superannuation calculation, STP phase 2 lodging)
 * is processed externally (Xero, MYOB, Employment Hero, etc.).
 */
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

    // Fetch approved or submitted timesheets
    let query = supabase
      .from('timesheets')
      .select(`
        id,
        week_start,
        week_end,
        status,
        notes,
        staff:staff(id, reference_number, full_name, role, email),
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

    // Build SCHADS Payroll CSV
    // Columns: EmployeeID, EmployeeName, PayPeriodStart, PayPeriodEnd, SCHADS_Award_Level, OrdinaryHours, SaturdayHours, SundayHours, PublicHolidayHours, EveningHours, NightHours, TravelKmAllowance, TravelTimeHours, TotalHours, TimesheetRef
    const headers = [
      'EmployeeID',
      'EmployeeName',
      'PayPeriodStart',
      'PayPeriodEnd',
      'SCHADS_Award_Level',
      'OrdinaryHours',
      'SaturdayHours',
      'SundayHours',
      'PublicHolidayHours',
      'EveningShiftHours',
      'NightShiftHours',
      'TravelKmAllowance',
      'TravelTimeHours',
      'TotalPayableHours',
      'TimesheetID',
      'Status',
    ];

    const rows: string[] = [headers.join(',')];

    for (const ts of timesheets) {
      const staffRef = (ts.staff as any)?.reference_number || (ts.staff as any)?.id || 'UNKNOWN';
      const staffName = `"${((ts.staff as any)?.full_name || 'Worker').replace(/"/g, '""')}"`;
      const awardLevel = 'SCHADS Level 2.1 (Disability Support Worker)';

      let ordinaryHours = 0;
      let saturdayHours = 0;
      let sundayHours = 0;
      let eveningHours = 0;
      let nightHours = 0;
      let totalKm = 0;
      let totalTravelMin = 0;

      const entries = (ts.entries as any[]) || [];
      for (const entry of entries) {
        const hours = Number(entry.actual_hours) || 0;
        const km = Number(entry.kilometres) || 0;
        const travelMin = Number(entry.travel_minutes) || 0;

        totalKm += km;
        totalTravelMin += travelMin;

        // Detect day of week and time of day from shift or entry
        const shiftStartStr = entry.actual_start || entry.scheduled_start || entry.shift?.start_time;
        if (shiftStartStr) {
          const startDate = new Date(shiftStartStr);
          const day = startDate.getUTCDay(); // 0 = Sun, 6 = Sat
          const hour = startDate.getUTCHours() + 10; // Approx AEST (UTC+10)

          if (day === 0) {
            sundayHours += hours;
          } else if (day === 6) {
            saturdayHours += hours;
          } else if (hour >= 20 || hour < 6) {
            nightHours += hours;
          } else if (hour >= 18) {
            eveningHours += hours;
          } else {
            ordinaryHours += hours;
          }
        } else {
          ordinaryHours += hours;
        }
      }

      const totalPayableHours = (ordinaryHours + saturdayHours + sundayHours + eveningHours + nightHours).toFixed(2);
      const travelTimeHours = (totalTravelMin / 60).toFixed(2);

      rows.push([
        staffRef,
        staffName,
        ts.week_start,
        ts.week_end,
        `"${awardLevel}"`,
        ordinaryHours.toFixed(2),
        saturdayHours.toFixed(2),
        sundayHours.toFixed(2),
        '0.00', // Public holiday default
        eveningHours.toFixed(2),
        nightHours.toFixed(2),
        totalKm.toFixed(1),
        travelTimeHours,
        totalPayableHours,
        ts.id,
        ts.status,
      ].join(','));
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

    const csvContent = rows.join('\r\n');
    const filename = `OpusCare_SCHADS_Payroll_Export_${weekStart || new Date().toISOString().slice(0, 10)}.csv`;

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
