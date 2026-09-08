import { userFacingError } from '@/lib/userFacingError';
import { NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: Request) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ message: "We couldn't complete this action. Please refresh and try again." }, { status: 503 });

  const { searchParams } = new URL(req.url);
  const staffId = searchParams.get('staff_id');

  let availQuery = supabase
    .from('staff_availability')
    .select('*, staff:staff(id, full_name, reference_number)')
    .order('day_of_week', { ascending: true });

  let leaveQuery = supabase
    .from('staff_leave')
    .select('*, staff:staff(id, full_name, reference_number)')
    .order('start_date', { ascending: true });

  if (staffId) {
    availQuery = availQuery.eq('staff_id', staffId);
    leaveQuery = leaveQuery.eq('staff_id', staffId);
  }

  const [availRes, leaveRes] = await Promise.all([availQuery, leaveQuery]);

  if (availRes.error) return NextResponse.json({ message: userFacingError(availRes.error.message) }, { status: 500 });

  return NextResponse.json({
    availability: availRes.data ?? [],
    leave: leaveRes.data ?? []
  });
}

export async function POST(req: Request) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ message: "We couldn't complete this action. Please refresh and try again." }, { status: 503 });

  try {
    const body = await req.json();
    const { type = 'availability', staff_id, day_of_week, start_time, end_time, start_date, end_date, leave_type, reason } = body;

    if (!staff_id) return NextResponse.json({ message: 'staff_id is required' }, { status: 400 });

    if (type === 'leave') {
      const { data, error } = await supabase
        .from('staff_leave')
        .insert({
          staff_id,
          start_date,
          end_date,
          leave_type: leave_type || 'annual',
          reason: reason || null,
          status: 'approved'
        })
        .select()
        .single();

      if (error) return NextResponse.json({ message: userFacingError(error.message) }, { status: 500 });
      return NextResponse.json({ ok: true, leave: data });
    } else {
      const { data, error } = await supabase
        .from('staff_availability')
        .insert({
          staff_id,
          day_of_week: Number(day_of_week),
          start_time: start_time || '07:00',
          end_time: end_time || '19:00',
          is_active: true
        })
        .select()
        .single();

      if (error) return NextResponse.json({ message: userFacingError(error.message) }, { status: 500 });
      return NextResponse.json({ ok: true, availability: data });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
