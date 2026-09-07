import { NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: Request) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ message: 'Database unavailable' }, { status: 503 });

  const { searchParams } = new URL(req.url);
  const activeOnly = searchParams.get('active') !== 'false';

  let query = supabase.from('training_courses').select('*').order('created_at', { ascending: false });
  if (activeOnly) query = query.eq('is_active', true);

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
    const { title, description, course_type, material_type, material_url, quiz_questions,
            pass_mark_pct, validity_months, is_mandatory, certificate_enabled, max_attempts } = body;

    if (!title || !course_type) return NextResponse.json({ message: 'title and course_type are required' }, { status: 400 });
    if (!['read_acknowledge','read_quiz','external_cert'].includes(course_type))
      return NextResponse.json({ message: 'Invalid course_type' }, { status: 400 });

    const { data, error } = await supabase.from('training_courses').insert({
      title: title.trim(), description: description?.trim() ?? null,
      course_type, material_type: material_type ?? 'none',
      material_url: material_url?.trim() ?? null,
      quiz_questions: quiz_questions ?? null,
      pass_mark_pct: pass_mark_pct ?? 80,
      validity_months: validity_months ?? null,
      is_mandatory: is_mandatory ?? false,
      certificate_enabled: certificate_enabled ?? true,
      max_attempts: max_attempts ?? null,
      is_active: true, created_by: 'Admin',
    }).select().single();

    if (error) return NextResponse.json({ message: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, course: data });
  } catch (err) {
    console.error('Create course error:', err);
    return NextResponse.json({ message: 'Failed to create course' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) return NextResponse.json({ message: 'Unauthorized: Admin access required.' }, { status: 401 });

  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ message: 'Database unavailable' }, { status: 503 });

  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ message: 'id required' }, { status: 400 });

    const { data, error } = await supabase.from('training_courses')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id).select().single();
    if (error) return NextResponse.json({ message: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, course: data });
  } catch {
    return NextResponse.json({ message: 'Failed to update course' }, { status: 500 });
  }
}
