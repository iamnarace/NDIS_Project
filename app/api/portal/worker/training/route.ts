import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json(
      { message: "We couldn't load your training right now. Please try again." },
      { status: 503 }
    );
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ message: 'Please sign in to continue.' }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role,is_active,portal_staff_id')
    .eq('id', user.id)
    .single();

  if (profileError || !profile?.is_active || profile.role !== 'worker' || !profile.portal_staff_id) {
    return NextResponse.json(
      { message: "Your account doesn't currently have worker portal access. Please contact Opus Care." },
      { status: 403 }
    );
  }

  const [assignmentsResult, completionsResult] = await Promise.all([
    supabase
      .from('training_assignments')
      .select('id,course_id,staff_id,due_date,assigned_at,training_courses(id,title,description,course_type,material_type,material_url,is_mandatory,is_active)')
      .eq('staff_id', profile.portal_staff_id)
      .order('assigned_at', { ascending: false }),
    supabase
      .from('training_completions')
      .select('id,course_id,staff_id,completed_at,passed,expires_at,certificate_id')
      .eq('staff_id', profile.portal_staff_id)
      .order('completed_at', { ascending: false }),
  ]);

  if (assignmentsResult.error || completionsResult.error) {
    console.error('Worker training load failed', assignmentsResult.error || completionsResult.error);
    return NextResponse.json(
      { message: "We couldn't load your training right now. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    assignments: assignmentsResult.data ?? [],
    completions: completionsResult.data ?? [],
  });
}
