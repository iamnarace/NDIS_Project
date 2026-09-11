import { NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import { userFacingError } from '@/lib/userFacingError';
import { nextReferenceNumber } from '@/lib/referenceNumber';
import { computeOnboardingRequirements } from '@/lib/services/participantIntake';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) {
    return NextResponse.json({ message: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { referralId, suitabilityAssessmentId, ndisNumber, allocatedHours, actorId = 'Coordinator / Admin' } = body;

    if (!referralId) {
      return NextResponse.json({ message: 'Missing referral ID.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    if (!supabase) return NextResponse.json({ message: 'Referral conversion is currently unavailable.' }, { status: 503 });

    // 1. Fetch Referral
    const { data: ref, error: refErr } = await supabase
      .from('referrals')
      .select('*')
      .or(`id.eq.${referralId},reference_number.eq.${referralId}`)
      .single();

    if (refErr || !ref) {
      if (refErr?.code === 'PGRST116') return NextResponse.json({ message: 'Referral not found.' }, { status: 404 });
      return NextResponse.json({ message: userFacingError(refErr?.message || 'Referral query returned no record.') }, { status: 500 });
    }

    // 2. Governance G1 Guard: Require an approved Service Suitability Assessment
    let assessmentQuery = supabase
      .from('service_suitability_assessments')
      .select('*');

    if (suitabilityAssessmentId) {
      assessmentQuery = assessmentQuery.eq('id', suitabilityAssessmentId);
    } else {
      assessmentQuery = assessmentQuery.eq('referral_id', ref.id).order('created_at', { ascending: false }).limit(1);
    }

    const { data: assessments, error: ssaErr } = await assessmentQuery;
    const assessment = assessments && assessments.length > 0 ? assessments[0] : null;

    if (ssaErr || !assessment) {
      return NextResponse.json({
        ok: false,
        message: 'Cannot convert referral: a completed Service Suitability Assessment is required before onboarding.'
      }, { status: 400 });
    }

    // Check suitability outcome
    if (assessment.outcome !== 'Suitable' && assessment.outcome !== 'Suitable With Conditions') {
      return NextResponse.json({
        ok: false,
        message: `Cannot convert referral to onboarding: Suitability outcome is "${assessment.outcome}". Required action: ${assessment.outcome_reasons?.join(' ') || 'Review conditions'}.`
      }, { status: 400 });
    }

    // 3. Create Participant in 'onboarding' lifecycle stage (NOT active / NOT rosterable)
    const participantReference = await nextReferenceNumber(supabase, 'participants', 'PAR');
    const { data: part, error: partErr } = await supabase
      .from('participants')
      .insert({
        reference_number: participantReference,
        referral_id: ref.id,
        suitability_assessment_id: assessment.id,
        full_name: ref.participant_name,
        ndis_number: ndisNumber || null,
        phone: ref.phone,
        email: ref.email,
        suburb: ref.suburb,
        funding_type: ref.funding_type || 'Plan-Managed',
        allocated_weekly_hours: Number(allocatedHours) || 0.0,
        status: 'pending_intake', // Governed: pending onboarding review
        lifecycle_stage: 'onboarding', // Governance G1: in onboarding gate
        is_rosterable: false, // Governance G1: NOT rosterable until onboarding signoff
        readiness_notes: `Converted from referral ${ref.reference_number || ref.id} following suitability assessment ${assessment.reference_number} (${assessment.outcome}).`,
      })
      .select()
      .single();

    if (partErr || !part) {
      return NextResponse.json({ message: userFacingError(partErr?.message || 'Participant insert failed.') }, { status: 500 });
    }

    // 4. Generate dynamic onboarding requirements
    const dynamicReqs = computeOnboardingRequirements(
      {
        outcome: assessment.outcome,
        outcomeReasons: assessment.outcome_reasons || [],
        conditions: assessment.conditions ? assessment.conditions.split('; ') : [],
        isAdult: assessment.is_adult,
        inServiceArea: true,
        region: assessment.region,
        serviceValidation: assessment.service_scope_validation || [],
      },
      assessment.risk_triage || {},
      part.funding_type
    );

    // Auto-complete the suitability assessment requirement since it just passed
    if (dynamicReqs['suitability_assessment_approved']) {
      dynamicReqs['suitability_assessment_approved'].status = 'completed';
      dynamicReqs['suitability_assessment_approved'].completedAt = new Date().toISOString();
      dynamicReqs['suitability_assessment_approved'].completedBy = actorId;
      dynamicReqs['suitability_assessment_approved'].notes = `Approved under ${assessment.reference_number}`;
    }

    // 5. Initialize participant onboarding checklist
    const { data: checklist, error: chkErr } = await supabase
      .from('participant_onboarding_checklists')
      .insert({
        participant_id: part.id,
        requirements: dynamicReqs,
        is_ready_for_rostering: false,
      })
      .select()
      .single();

    if (chkErr) {
      console.error('Checklist creation error:', chkErr);
    }

    // 6. Link participant back to assessment and referral
    await supabase
      .from('service_suitability_assessments')
      .update({ participant_id: part.id, updated_at: new Date().toISOString() })
      .eq('id', assessment.id);

    await supabase
      .from('referrals')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', ref.id);

    // 7. Emit immutable audit log
    await supabase.from('audit_events').insert({
      entity_type: 'participant',
      entity_id: part.id,
      actor_type: 'admin',
      actor_id: actorId,
      action: 'converted_to_onboarding',
      changes: {
        lifecycle_stage: 'onboarding',
        is_rosterable: false,
        suitability_assessment_id: assessment.id,
      },
      metadata: {
        referralId: ref.id,
        assessmentReference: assessment.reference_number,
        outcome: assessment.outcome,
      },
    });

    return NextResponse.json({
      ok: true,
      participant: part,
      checklist,
      message: `Referral successfully initiated into Onboarding (${part.full_name}). Roster scheduling remains locked until onboarding readiness sign-off.`
    });
  } catch (err: unknown) {
    return NextResponse.json({ message: userFacingError(err) }, { status: 500 });
  }
}
