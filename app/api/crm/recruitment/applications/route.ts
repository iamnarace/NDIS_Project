import { NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import { userFacingError } from '@/lib/userFacingError';

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
  const stageFilter = searchParams.get('stage');
  const typeFilter = searchParams.get('type');
  const vacancyFilter = searchParams.get('vacancy_id');
  const searchQuery = searchParams.get('search')?.trim().toLowerCase();

  let query = supabase
    .from('job_applications')
    .select(`
      id,
      reference_number,
      application_type,
      vacancy_id,
      first_name,
      last_name,
      email,
      phone,
      suburb,
      postcode,
      preferred_service_area_ids,
      employment_preferences,
      work_rights_status,
      earliest_start_date,
      experience_summary,
      qualification_summary,
      driver_licence_status,
      vehicle_access_status,
      ndiswc_status_declared,
      police_check_status_declared,
      first_aid_status_declared,
      cpr_status_declared,
      wwcc_status_declared,
      stage,
      source,
      submitted_at,
      retention_until,
      converted_staff_id,
      hired_at,
      decision_at,
      created_at,
      updated_at,
      job_vacancies (
        id,
        reference_number,
        title,
        status
      )
    `)
    .is('purged_at', null)
    .order('submitted_at', { ascending: false });

  if (stageFilter && stageFilter !== 'all') {
    query = query.eq('stage', stageFilter);
  }
  if (typeFilter && typeFilter !== 'all') {
    query = query.eq('application_type', typeFilter);
  }
  if (vacancyFilter && vacancyFilter !== 'all') {
    query = query.eq('vacancy_id', vacancyFilter);
  }

  const { data: applications, error } = await query;
  if (error) {
    console.error('Failed to load job applications:', error.message);
    return NextResponse.json({ ok: false, error: userFacingError(error.message) }, { status: 500 });
  }

  let filtered = applications || [];
  if (searchQuery) {
    filtered = filtered.filter((app: any) => {
      const fullName = `${app.first_name || ''} ${app.last_name || ''}`.toLowerCase();
      const email = (app.email || '').toLowerCase();
      const phone = (app.phone || '').toLowerCase();
      const ref = (app.reference_number || '').toLowerCase();
      const suburb = (app.suburb || '').toLowerCase();
      return (
        fullName.includes(searchQuery) ||
        email.includes(searchQuery) ||
        phone.includes(searchQuery) ||
        ref.includes(searchQuery) ||
        suburb.includes(searchQuery)
      );
    });
  }

  // Calculate recruitment KPIs
  const todayStr = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoIso = thirtyDaysAgo.toISOString();

  // 1. Open vacancies count
  const { count: openVacanciesCount } = await supabase
    .from('job_vacancies')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published');

  // 2. Counts from applications
  const allApps = applications || [];
  const newAppsCount = allApps.filter((a: any) => a.stage === 'new').length;
  const shortlistedCount = allApps.filter((a: any) => a.stage === 'shortlisted').length;
  const interviewCount = allApps.filter((a: any) => a.stage === 'interview').length;
  const offerCount = allApps.filter((a: any) => a.stage === 'offer').length;
  const hired30Count = allApps.filter((a: any) => a.stage === 'hired' && a.hired_at && a.hired_at >= thirtyDaysAgoIso).length;
  const retentionReviewCount = allApps.filter((a: any) =>
    ['unsuccessful', 'withdrawn'].includes(a.stage) && a.retention_until && a.retention_until <= todayStr
  ).length;

  const kpis = {
    open_vacancies: openVacanciesCount || 0,
    new_applications: newAppsCount,
    shortlisted: shortlistedCount,
    interviews: interviewCount,
    offers: offerCount,
    hired_last_30_days: hired30Count,
    retention_review_due: retentionReviewCount,
    total_applications: allApps.length
  };

  return NextResponse.json({
    ok: true,
    applications: filtered,
    kpis: kpis
  });
}
