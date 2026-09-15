import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Service temporarily unavailable.' }, { status: 503 });
  }

  const now = new Date().toISOString();

  // Query only published vacancies where opens_at is past/null and closes_at is future/null
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
      published_at,
      closes_at
    `)
    .eq('status', 'published')
    .or(`opens_at.is.null,opens_at.lte.${now}`)
    .or(`closes_at.is.null,closes_at.gte.${now}`)
    .order('featured', { ascending: false })
    .order('published_at', { ascending: false, nullsFirst: false });

  if (error) {
    console.error('Failed to fetch public vacancies:', error.message);
    return NextResponse.json({ ok: false, error: 'Could not load current opportunities.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, vacancies: data || [] }, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
    }
  });
}
