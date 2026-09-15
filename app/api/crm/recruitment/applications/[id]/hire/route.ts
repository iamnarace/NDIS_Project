import { NextResponse } from 'next/server';
import { getAuthenticatedAdminActor } from '@/lib/adminAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import { nextReferenceNumber } from '@/lib/referenceNumber';
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

    // 1. Fetch application details
    const { data: application, error: appErr } = await supabase
      .from('job_applications')
      .select('*, job_vacancies(title)')
      .eq('id', id)
      .single();

    if (appErr || !application) {
      return NextResponse.json({ ok: false, error: 'Application record not found.' }, { status: 404 });
    }

    if (application.stage === 'hired' && application.converted_staff_id) {
      return NextResponse.json({
        ok: false,
        error: `This candidate was already marked as Hired (Staff ID: ${application.converted_staff_id}).`
      }, { status: 400 });
    }

    const candidateEmail = String(application.email || '').trim().toLowerCase();
    const candidatePhone = String(application.phone || '').trim();
    const candidateName = `${application.first_name || ''} ${application.last_name || ''}`.trim();

    // 2. Duplicate Staff Check
    const linkExistingStaffId = body.link_existing_staff_id;

    if (!linkExistingStaffId) {
      // Look for duplicate staff by email or phone
      const { data: duplicateStaff } = await supabase
        .from('staff')
        .select('id, reference_number, full_name, email, phone, status, lifecycle_stage')
        .or(`email.ilike.${candidateEmail},phone.eq.${candidatePhone}`)
        .limit(1);

      if (duplicateStaff && duplicateStaff.length > 0) {
        const dup = duplicateStaff[0];
        return NextResponse.json({
          ok: false,
          duplicate_found: true,
          error: `A staff record with email ${dup.email} or phone ${dup.phone} already exists (${dup.reference_number}: ${dup.full_name}).`,
          existing_staff: {
            id: dup.id,
            reference_number: dup.reference_number,
            full_name: dup.full_name,
            email: dup.email,
            phone: dup.phone,
            status: dup.status,
            lifecycle_stage: dup.lifecycle_stage
          }
        }, { status: 409 });
      }
    }

    let staffId: string;
    let staffReference: string;
    const now = new Date().toISOString();

    if (linkExistingStaffId) {
      // Verify linked staff exists
      const { data: existingStaff, error: linkErr } = await supabase
        .from('staff')
        .select('id, reference_number, full_name')
        .eq('id', linkExistingStaffId)
        .single();

      if (linkErr || !existingStaff) {
        return NextResponse.json({ ok: false, error: 'Target staff record for linking not found.' }, { status: 404 });
      }

      staffId = existingStaff.id;
      staffReference = existingStaff.reference_number;
    } else {
      // 3. Create canonical Staff record with explicit fail-closed values
      staffReference = await nextReferenceNumber(supabase, 'staff', 'STF');

      const roleTitle = body.role ? String(body.role).trim() : (application.job_vacancies?.title || 'Disability Support Worker');
      const engagementType = body.engagement_type === 'contractor' ? 'contractor' : 'employee';
      const employmentBasis = engagementType === 'contractor' ? 'not_applicable' : (body.employment_basis || 'casual');
      const startDate = body.employment_start_date ? String(body.employment_start_date).slice(0, 10) : (application.earliest_start_date || null);
      const approvedAreas = Array.isArray(body.suburbs) && body.suburbs.length > 0
        ? body.suburbs
        : (Array.isArray(application.preferred_service_area_ids) ? application.preferred_service_area_ids : []);

      const newStaffPayload: Record<string, any> = {
        reference_number: staffReference,
        full_name: candidateName,
        phone: candidatePhone,
        email: candidateEmail,
        role: roleTitle,
        engagement_type: engagementType,
        employment_basis: employmentBasis,
        employment_start_date: startDate,
        suburbs: approvedAreas,
        // Non-negotiable fail-closed governance values
        status: 'pending',
        lifecycle_stage: 'onboarding',
        is_rosterable: false,
        ndis_screening: 'Unknown / Needs Verification',
        ndis_screening_expiry: null,
        wwcc_number: null,
        wwcc_expiry: null,
        police_check_date: null,
        first_aid_expiry: null,
        cpr_expiry: null,
        ndis_orientation_completed: false,
        hourly_rate: body.hourly_rate != null && body.hourly_rate !== '' ? Number(body.hourly_rate) : null,
        readiness_notes: `Hired from recruitment application ${application.reference_number}. Candidate self-declarations remain unverified. Compliance verification and agreement generation pending.`
      };

      const { data: createdStaff, error: createStaffErr } = await supabase
        .from('staff')
        .insert(newStaffPayload)
        .select('id, reference_number')
        .single();

      if (createStaffErr || !createdStaff) {
        console.error('Failed to create staff record during hire:', createStaffErr?.message);
        return NextResponse.json({ ok: false, error: userFacingError(createStaffErr?.message || 'Failed to create worker record.') }, { status: 500 });
      }

      staffId = createdStaff.id;
      staffReference = createdStaff.reference_number;
    }

    // 4. Update application to stage='hired' and link converted_staff_id
    const fromStage = application.stage;
    const { error: updateAppErr } = await supabase
      .from('job_applications')
      .update({
        converted_staff_id: staffId,
        stage: 'hired',
        hired_at: now,
        decision_at: now,
        updated_at: now
      })
      .eq('id', id);

    if (updateAppErr) {
      console.error('Failed to update application to hired:', updateAppErr.message);
      return NextResponse.json({ ok: false, error: userFacingError(updateAppErr.message) }, { status: 500 });
    }

    // 5. Insert immutable timeline event
    await supabase.from('job_application_events').insert({
      application_id: id,
      event_type: 'hired',
      from_stage: fromStage,
      to_stage: 'hired',
      note: linkExistingStaffId
        ? `Hired candidate and linked to existing staff record ${staffReference}`
        : `Hired candidate and created canonical staff record ${staffReference} (status: pending, lifecycle: onboarding, rosterable: false)`,
      actor: actorId
    });

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
