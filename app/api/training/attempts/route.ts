import { NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/training/attempts
 * Submit a quiz attempt. Scores it server-side. Creates a completion ONLY on pass.
 * Returns: { ok, passed, score_pct, attempt_id, completion? }
 */
export async function POST(req: Request) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ message: 'Database unavailable' }, { status: 503 });

  try {
    const body = await req.json();
    const { course_id, assignment_id, staff_id, staff_name, answers } = body;

    if (!course_id || !staff_id || !answers) {
      return NextResponse.json({ message: 'course_id, staff_id, and answers are required' }, { status: 400 });
    }

    // 1. Load course for scoring
    const { data: course, error: cErr } = await supabase
      .from('training_courses')
      .select('quiz_questions, pass_mark_pct, validity_months, certificate_enabled, max_attempts, title')
      .eq('id', course_id)
      .single();

    if (cErr || !course) return NextResponse.json({ message: 'Course not found' }, { status: 404 });

    // 2. Check max_attempts limit (count previous attempts for this staff+course)
    if (course.max_attempts !== null) {
      const { count } = await supabase
        .from('training_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', course_id)
        .eq('staff_id', staff_id);
      if ((count ?? 0) >= course.max_attempts) {
        return NextResponse.json({ message: 'Maximum attempts reached for this course', ok: false }, { status: 409 });
      }
    }

    // 3. Score the quiz server-side
    const questions: Array<{ question: string; options: string[]; correct_index: number }> =
      course.quiz_questions ?? [];
    let correct = 0;
    for (let i = 0; i < questions.length; i++) {
      const givenIdx = answers[i];
      if (givenIdx !== undefined && Number(givenIdx) === questions[i].correct_index) {
        correct++;
      }
    }
    const total = questions.length;
    const score_pct = total > 0 ? Math.round((correct / total) * 100) : 100;
    const passed = score_pct >= (course.pass_mark_pct ?? 80);

    // 4. Record the attempt (always, pass or fail)
    const { data: attemptData, error: aErr } = await supabase
      .from('training_attempts')
      .insert({ course_id, assignment_id: assignment_id ?? null, staff_id, answers, score_pct, passed })
      .select()
      .single();

    if (aErr) return NextResponse.json({ message: aErr.message }, { status: 500 });

    // 5. If failed — do NOT create a completion. Return result.
    if (!passed) {
      return NextResponse.json({ ok: true, passed: false, score_pct, attempt: attemptData });
    }

    // 6. If passed — create completion + optional certificate
    let certificateId: string | null = null;
    let expiresAt: string | null = null;

    if (course.certificate_enabled) {
      const { data: seqRow } = await supabase
        .rpc('nextval', { seq: 'training_cert_seq' }).single();
      const seqNum = seqRow ?? Date.now();
      const year = new Date().getFullYear();
      certificateId = `OC-TRN-${year}-${String(seqNum).padStart(5, '0')}`;
    }

    if (course.validity_months) {
      const exp = new Date();
      exp.setMonth(exp.getMonth() + course.validity_months);
      expiresAt = exp.toISOString();
    }

    const { data: completion, error: compErr } = await supabase
      .from('training_completions')
      .insert({
        course_id,
        assignment_id: assignment_id ?? null,
        staff_id,
        staff_name: staff_name ?? null,
        quiz_score_pct: score_pct,
        passed: true,
        expires_at: expiresAt,
        certificate_id: certificateId,
        certificate_issue_date: new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (compErr) return NextResponse.json({ message: compErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, passed: true, score_pct, attempt: attemptData, completion });
  } catch (err) {
    console.error('Attempt submit error:', err);
    return NextResponse.json({ message: 'Failed to submit attempt' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ message: 'Database unavailable' }, { status: 503 });

  const { searchParams } = new URL(req.url);
  const staffId = searchParams.get('staff_id');
  const courseId = searchParams.get('course_id');

  let query = supabase.from('training_attempts').select('*').order('attempted_at', { ascending: false });
  if (staffId) query = query.eq('staff_id', staffId);
  if (courseId) query = query.eq('course_id', courseId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
