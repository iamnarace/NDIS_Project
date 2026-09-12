import { NextResponse } from 'next/server';
import { getAuthenticatedAdminActor } from '@/lib/adminAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import { userFacingError } from '@/lib/userFacingError';
import { nextReferenceNumber } from '@/lib/referenceNumber';
import { computeOnboardingRequirements } from '@/lib/services/participantIntake';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const actorId = await getAuthenticatedAdminActor(req);
  if (!actorId) {
    return NextResponse.json({ message: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { referralId, suitabilityAssessmentId, ndisNumber, allocatedHours } = body;

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
      assessmentQuery = assessmentQuery.eq('id', suitabilityAssessmentId).eq('referral_id', ref.id);
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

    if (!['verified_self_managed', 'verified_plan_managed', 'verified_registered_provider_contract'].includes(assessment.billing_relationship_status)) {
      return NextResponse.json({ ok: false, message: 'Cannot start onboarding: billing relationship is not verified.' }, { status: 400 });
    }

    const participantReference = await nextReferenceNumber(supabase, 'participants', 'PAR');
    // Generate dynamic requirements from the accepted governed assessment.
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
      assessment.funding_type
    );

    // Auto-complete the suitability assessment requirement since it just passed
    if (dynamicReqs['suitability_assessment_approved']) {
      dynamicReqs['suitability_assessment_approved'].status = 'completed';
      dynamicReqs['suitability_assessment_approved'].completedAt = new Date().toISOString();
      dynamicReqs['suitability_assessment_approved'].completedBy = actorId;
      dynamicReqs['suitability_assessment_approved'].notes = `Approved under ${assessment.reference_number}`;
    }

    const { data: conversion, error: conversionError } = await supabase.rpc('governance_g1_convert_referral', {
      p_referral_id: ref.id,
      p_assessment_id: assessment.id,
      p_participant_reference: participantReference,
      p_ndis_number: ndisNumber || null,
      p_allocated_hours: Number(allocatedHours) || 0,
      p_requirements: dynamicReqs,
      p_actor_id: actorId,
    });
    if (conversionError || !conversion) {
      return NextResponse.json({ message: userFacingError(conversionError?.message || 'Atomic onboarding conversion failed.') }, { status: 500 });
    }
    const part = conversion.participant;
    const checklist = conversion.checklist;

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
