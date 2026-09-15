import { NextResponse } from 'next/server';
import { getAuthenticatedAdminActor, isAuthenticatedAdmin } from '@/lib/adminAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import { nextYearlyReferenceNumber } from '@/lib/referenceNumber';
import { validateVacancyForPublication } from '@/lib/recruitmentValidation';
import { userFacingError } from '@/lib/userFacingError';

function generateSlug(title: string, ref: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const refSuffix = ref.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `${base || 'vacancy'}-${refSuffix}`;
}

export async function GET(req: Request) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) {
    return NextResponse.json({ ok: false, error: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Database service unavailable.' }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get('status');

  let query = supabase
    .from('job_vacancies')
    .select('*')
    .order('created_at', { ascending: false });

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data: vacancies, error } = await query;
  if (error) {
    return NextResponse.json({ ok: false, error: userFacingError(error.message) }, { status: 500 });
  }

  // Fetch application counts per vacancy
  const { data: appCounts } = await supabase
    .from('job_applications')
    .select('vacancy_id')
    .not('vacancy_id', 'is', null);

  const countMap: Record<string, number> = {};
  for (const row of appCounts || []) {
    if (row.vacancy_id) {
      countMap[row.vacancy_id] = (countMap[row.vacancy_id] || 0) + 1;
    }
  }

  const vacanciesWithCounts = (vacancies || []).map(v => ({
    ...v,
    applications_count: countMap[v.id] || 0
  }));

  return NextResponse.json({ ok: true, vacancies: vacanciesWithCounts });
}

export async function POST(req: Request) {
  const actorId = await getAuthenticatedAdminActor(req);
  if (!actorId) {
    return NextResponse.json({ ok: false, error: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Database service unavailable.' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const title = String(body.title || '').trim();
    const shortSummary = String(body.short_summary || '').trim();
    const aboutRole = String(body.about_role || '').trim();

    if (!title) {
      return NextResponse.json({ ok: false, error: 'Job title is required.' }, { status: 400 });
    }
    if (!shortSummary) {
      return NextResponse.json({ ok: false, error: 'Short summary is required.' }, { status: 400 });
    }
    if (!aboutRole) {
      return NextResponse.json({ ok: false, error: 'Role overview / about role is required.' }, { status: 400 });
    }

    const referenceNumber = await nextYearlyReferenceNumber(supabase, 'job_vacancies', 'JOB');
    const slug = body.slug ? String(body.slug).trim().toLowerCase() : generateSlug(title, referenceNumber);

    const now = new Date().toISOString();
    const requestedStatus = body.status === 'published' ? 'published' : 'draft';

    const newVacancy = {
      reference_number: referenceNumber,
      slug: slug,
      title: title,
      category: body.category || 'Disability Support',
      short_summary: shortSummary,
      about_role: aboutRole,
      responsibilities: Array.isArray(body.responsibilities) ? body.responsibilities : [],
      essential_criteria: Array.isArray(body.essential_criteria) ? body.essential_criteria : [],
      desirable_criteria: Array.isArray(body.desirable_criteria) ? body.desirable_criteria : [],
      service_area_ids: Array.isArray(body.service_area_ids) ? body.service_area_ids : [],
      location_notes: body.location_notes ? String(body.location_notes).trim() : null,
      employment_basis: Array.isArray(body.employment_basis) ? body.employment_basis : [],
      engagement_relationship: body.engagement_relationship || 'employee',
      positions_count: body.positions_count ? Number(body.positions_count) : null,
      driver_licence_required: Boolean(body.driver_licence_required),
      vehicle_required: Boolean(body.vehicle_required),
      ndiswc_required: Boolean(body.ndiswc_required),
      police_check_required: Boolean(body.police_check_required),
      first_aid_required: Boolean(body.first_aid_required),
      cpr_required: Boolean(body.cpr_required),
      child_related_role: Boolean(body.child_related_role),
      qualification_required: Boolean(body.qualification_required),
      other_requirements: Array.isArray(body.other_requirements) ? body.other_requirements : [],
      pay_display_mode: body.pay_display_mode || 'award_text',
      pay_public_text: body.pay_public_text ? String(body.pay_public_text).trim() : null,
      status: requestedStatus,
      featured: Boolean(body.featured),
      opens_at: body.opens_at || null,
      closes_at: body.closes_at || null,
      published_at: requestedStatus === 'published' ? now : null,
      created_by: actorId,
      updated_by: actorId
    };

    if (requestedStatus === 'published') {
      const validation = validateVacancyForPublication(newVacancy);
      if (!validation.valid) {
        return NextResponse.json({
          ok: false,
          error: 'Cannot publish incomplete vacancy: ' + validation.errors.join(' '),
          errors: validation.errors
        }, { status: 400 });
      }
    }

    const { data: created, error } = await supabase
      .from('job_vacancies')
      .insert(newVacancy)
      .select('*')
      .single();

    if (error) {
      console.error('Failed to create vacancy:', error.message);
      return NextResponse.json({ ok: false, error: userFacingError(error.message) }, { status: 500 });
    }

    return NextResponse.json({ ok: true, vacancy: created });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to create vacancy.' }, { status: 500 });
  }
}
