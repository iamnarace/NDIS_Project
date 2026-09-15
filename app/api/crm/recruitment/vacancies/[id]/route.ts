import { NextResponse } from 'next/server';
import { getAuthenticatedAdminActor, isAuthenticatedAdmin } from '@/lib/adminAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateVacancyForPublication } from '@/lib/recruitmentValidation';
import { userFacingError } from '@/lib/userFacingError';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) {
    return NextResponse.json({ ok: false, error: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Database service unavailable.' }, { status: 503 });
  }

  const { data: vacancy, error } = await supabase
    .from('job_vacancies')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !vacancy) {
    return NextResponse.json({ ok: false, error: 'Vacancy not found.' }, { status: 404 });
  }

  // Also get application count
  const { count } = await supabase
    .from('job_applications')
    .select('*', { count: 'exact', head: true })
    .eq('vacancy_id', id);

  return NextResponse.json({ ok: true, vacancy: { ...vacancy, applications_count: count || 0 } });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actorId = await getAuthenticatedAdminActor(req);
  if (!actorId) {
    return NextResponse.json({ ok: false, error: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Database service unavailable.' }, { status: 503 });
  }

  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('job_vacancies')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) {
      return NextResponse.json({ ok: false, error: 'Vacancy not found.' }, { status: 404 });
    }

    const body = await req.json();
    const now = new Date().toISOString();

    const updates: Record<string, any> = {
      updated_by: actorId,
      updated_at: now
    };

    // Allowed updatable fields
    const directFields = [
      'title', 'slug', 'category', 'short_summary', 'about_role',
      'responsibilities', 'essential_criteria', 'desirable_criteria',
      'service_area_ids', 'location_notes', 'employment_basis',
      'engagement_relationship', 'positions_count', 'driver_licence_required',
      'vehicle_required', 'ndiswc_required', 'police_check_required',
      'first_aid_required', 'cpr_required', 'child_related_role',
      'qualification_required', 'other_requirements', 'pay_display_mode',
      'pay_public_text', 'featured', 'opens_at', 'closes_at'
    ];

    for (const f of directFields) {
      if (body[f] !== undefined) {
        updates[f] = body[f];
      }
    }

    // Status transition tracking
    if (body.status !== undefined) {
      const newStatus = body.status;
      updates.status = newStatus;

      if (newStatus === 'published') {
        updates.published_at = body.published_at || existing.published_at || now;
      } else if (newStatus === 'closed') {
        updates.closed_at = now;
      } else if (newStatus === 'archived') {
        updates.archived_at = now;
      }
    }

    const merged = { ...existing, ...updates };

    if (merged.status === 'published') {
      const validation = validateVacancyForPublication(merged);
      if (!validation.valid) {
        return NextResponse.json({
          ok: false,
          error: 'Cannot publish incomplete vacancy: ' + validation.errors.join(' '),
          errors: validation.errors
        }, { status: 400 });
      }
    }

    const { data: updated, error } = await supabase
      .from('job_vacancies')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Failed to update vacancy:', error.message);
      return NextResponse.json({ ok: false, error: userFacingError(error.message) }, { status: 500 });
    }

    return NextResponse.json({ ok: true, vacancy: updated });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Invalid update payload.' }, { status: 400 });
  }
}
