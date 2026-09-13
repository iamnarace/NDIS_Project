import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { userFacingError } from '@/lib/userFacingError';

/**
 * GET /api/workforce/payroll/export
 * Exports approved timesheets as "Approved Payroll Input Export" for external STP payroll engines.
 * Boundary: Timesheet/Hours -> Validated Hours & Mileage Inputs -> External STP Engine (Xero/MYOB/Employment Hero).
 * Real payroll engine (PAYG tax withholding, 12.00% Superannuation Guarantee, STP phase 2 lodging)
 * is processed externally.
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

// Parse timestamp in Australia/Sydney IANA timezone
function getSydneyDateTime(isoDateStr: string): { weekday: string; hour: number } {
  try {
    const date = new Date(isoDateStr);
    const formatter = new Intl.DateTimeFormat('en-AU', {
      timeZone: 'Australia/Sydney',
      weekday: 'short',
      hour: 'numeric',
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const weekday = parts.find((p) => p.type === 'weekday')?.value || '';
    const hourStr = parts.find((p) => p.type === 'hour')?.value || '0';
    return { weekday, hour: parseInt(hourStr, 10) };
  } catch {
    return { weekday: '', hour: 12 };
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

    // Fetch approved or submitted timesheets
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
    // Columns provide clean inputs for external STP payroll engine with full audit traceability
    const headers = [
      'EmployeeID',
      'EmployeeName',
      'EngagementType',
      'ClassificationRole',
      'SCHADS_Award_Level',
      'BaseHourlyRate',
      'PayPeriodStart',
      'PayPeriodEnd',
      'OrdinaryHours',
      'SaturdayHours',
      'SundayHours',
      'PublicHolidayHours',
      'EveningShiftHours',
      'NightShiftHours',
      'TravelKmAllowance',
      'VehicleRatePerKm',
      'VehicleReimbursementAmount',
      'TravelTimeHours',
      'TotalPayableHours',
      'TimesheetID',
      'Status',
      'ExportType',
    ];

    const rows: string[] = [headers.join(',')];

    for (const ts of timesheets) {
      const staffRef = (ts.staff as any)?.reference_number || (ts.staff as any)?.id || 'UNKNOWN';
      const staffName = `"${((ts.staff as any)?.full_name || 'Worker').replace(/"/g, '""')}"`;
      const role = (ts.staff as any)?.role || 'Disability Support Worker';
      const engagementType = (ts.staff as any)?.engagement_type || 'Casual';
      const hourlyRate = (ts.staff as any)?.hourly_rate ? Number((ts.staff as any).hourly_rate).toFixed(2) : '0.00';
      const awardLevel = `"${role} (${engagementType})"`;

      let ordinaryHours = 0;
      let saturdayHours = 0;
      let sundayHours = 0;
      let eveningHours = 0;
      let nightHours = 0;
      let totalKm = 0;
      let totalTravelMin = 0;
      let totalReimbursement = 0;

      const entries = (ts.entries as any[]) || [];
      for (const entry of entries) {
        const hours = Number(entry.actual_hours) || 0;
        const km = Number(entry.kilometres) || 0;
        const travelMin = Number(entry.travel_minutes) || 0;

        totalKm += km;
        totalTravelMin += travelMin;

        // Effective-dated vehicle allowance calculation
        const shiftDateStr = entry.actual_start || entry.scheduled_start || entry.shift?.start_time || ts.week_start;
        const vehicleRate = getEffectiveVehicleRate(shiftDateStr);
        totalReimbursement += km * vehicleRate;

        // Detect day of week and time of day in Australia/Sydney IANA timezone
        if (shiftDateStr) {
          const { weekday, hour } = getSydneyDateTime(shiftDateStr);

          if (weekday === 'Sun') {
            sundayHours += hours;
          } else if (weekday === 'Sat') {
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
      const defaultVehicleRate = getEffectiveVehicleRate(ts.week_start).toFixed(2);

      rows.push([
        staffRef,
        staffName,
        `"${engagementType}"`,
        `"${role}"`,
        awardLevel,
        hourlyRate,
        ts.week_start,
        ts.week_end,
        ordinaryHours.toFixed(2),
        saturdayHours.toFixed(2),
        sundayHours.toFixed(2),
        '0.00', // Public holiday default
        eveningHours.toFixed(2),
        nightHours.toFixed(2),
        totalKm.toFixed(1),
        defaultVehicleRate,
        totalReimbursement.toFixed(2),
        travelTimeHours,
        totalPayableHours,
        ts.id,
        ts.status,
        '"Approved Payroll Input Export"',
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
