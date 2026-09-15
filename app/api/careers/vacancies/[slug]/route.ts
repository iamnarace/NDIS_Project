import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!slug) {
    return NextResponse.json({ ok: false, error: 'Vacancy slug is required.' }, { status: 400 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Service temporarily unavailable.' }, { status: 503 });
  }

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('job_vacancies')
    .select(`
      id,
      reference_number,
      slug,
      title,
      category,
      short_summary,
      about_role,
      responsibilities,
      essential_criteria,
      desirable_criteria,
      service_area_ids,
      location_notes,
      employment_basis,
      engagement_relationship,
      positions_count,
      driver_licence_required,
      vehicle_required,
      ndiswc_required,
      police_check_required,
      first_aid_required,
      cpr_required,
      child_related_role,
      qualification_required,
      other_requirements,
      pay_display_mode,
      pay_public_text,
      featured,
      opens_at,
      published_at,
      closes_at
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .or(`opens_at.is.null,opens_at.lte.${now}`)
    .or(`closes_at.is.null,closes_at.gte.${now}`)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch vacancy by slug:', error.message);
    return NextResponse.json({ ok: false, error: 'Could not load vacancy details.' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ ok: false, error: 'This opportunity is not currently available or has closed.' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, vacancy: data }, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
    }
  });
}
