import { NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: Request) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ message: 'Database unavailable' }, { status: 503 });

  const { searchParams } = new URL(req.url);
  const staffId = searchParams.get('staff_id');

  let query = supabase
    .from('training_assignments')
    .select('*, training_courses(*)')
    .order('assigned_at', { ascending: false });

  if (staffId) query = query.eq('staff_id', staffId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) return NextResponse.json({ message: 'Unauthorized: Admin access required.' }, { status: 401 });

  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ message: 'Database unavailable' }, { status: 503 });

  try {
    const body = await req.json();
    const { course_id, staff_id, staff_name, due_date } = body;

    if (!course_id || !staff_id) {
      return NextResponse.json({ message: 'course_id and staff_id are required' }, { status: 400 });
    }

    // Support bulk assignment: staff_id can be an array
    const staffIds: string[] = Array.isArray(staff_id) ? staff_id : [staff_id];
    const staffNames: Record<string, string> = staff_name ?? {};

    const rows = staffIds.map((sid) => ({
      course_id,
      staff_id: sid,
      staff_name: typeof staffNames === 'string' ? staffNames : (staffNames[sid] ?? null),
      assigned_by: 'Admin',
      due_date: due_date ?? null,
    }));

    const { data, error } = await supabase
      .from('training_assignments')
      .upsert(rows, { onConflict: 'course_id,staff_id' })
      .select();

    if (error) return NextResponse.json({ message: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, assignments: data });
  } catch (err) {
    console.error('Assign error:', err);
    return NextResponse.json({ message: 'Failed to create assignment' }, { status: 500 });
  }
}
