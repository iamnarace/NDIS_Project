import { NextResponse } from 'next/server';
import { getAuthenticatedAdminActor } from '@/lib/adminAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import { userFacingError } from '@/lib/userFacingError';

export async function POST(
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
    const body = await req.json().catch(() => ({}));

    const roleTitle = body.role_title || body.role || 'Support Worker';
    const engagementRelationship = body.engagement_relationship || body.engagement_type || 'employee';
    const employmentBasis = engagementRelationship === 'contractor' ? 'not_applicable' : (body.employment_basis || 'casual');
    const startDate = body.employment_start_date ? String(body.employment_start_date).slice(0, 10) : null;
    const approvedServiceAreas = Array.isArray(body.approved_service_areas)
      ? body.approved_service_areas
      : (Array.isArray(body.suburbs) ? body.suburbs : []);
    const linkExistingStaffId = body.link_existing_staff_id || null;
    const confirmDuplicate = Boolean(body.confirm_duplicate);

    const { data: rpcRes, error: rpcErr } = await supabase.rpc('governance_recruitment_hire_candidate', {
      p_application_id: id,
      p_actor_id: actorId,
      p_role_title: roleTitle,
      p_employment_basis: employmentBasis,
      p_engagement_relationship: engagementRelationship,
      p_employment_start_date: startDate,
      p_approved_service_areas: approvedServiceAreas,
      p_link_existing_staff_id: linkExistingStaffId,
      p_confirm_duplicate: confirmDuplicate
    });

    if (rpcErr) {
      console.error('Error in governance_recruitment_hire_candidate RPC:', rpcErr.message);
      return NextResponse.json({ ok: false, error: userFacingError(rpcErr.message) }, { status: 400 });
    }

    if (rpcRes && !rpcRes.ok && rpcRes.duplicate_found) {
      return NextResponse.json({
        ok: false,
        duplicate_found: true,
        error: rpcRes.error,
        existing_staff: rpcRes.existing_staff
      }, { status: 409 });
    }

    if (!rpcRes || !rpcRes.ok) {
      return NextResponse.json({
        ok: false,
        error: rpcRes?.error || 'Failed to complete candidate hire.'
      }, { status: 400 });
    }

    const staffId = rpcRes.staff_id;
    const staffReference = rpcRes.staff_reference;

    return NextResponse.json({
      ok: true,
      staff_id: staffId,
      staff_reference: staffReference,
      worker_360_url: `/admin?tab=staff&staffId=${staffId}`,
      agreement_generator_url: `/admin?tab=agreements&staffId=${staffId}`,
      compliance_url: `/admin?tab=compliance&staffId=${staffId}`
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to complete candidate hire.' }, { status: 500 });
  }
}
