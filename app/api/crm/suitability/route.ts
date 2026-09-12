import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedAdminActor } from '@/lib/adminAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import { userFacingError } from '@/lib/userFacingError';
import { validateSuitability, SuitabilityInput } from '@/lib/services/participantIntake';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const actorId = await getAuthenticatedAdminActor(req);
  if (!actorId) {
    return NextResponse.json({ ok: false, error: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Governance service unavailable.' }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const referralId = searchParams.get('referral_id');
  const participantId = searchParams.get('participant_id');
  const id = searchParams.get('id');

  let query = supabase
    .from('service_suitability_assessments')
    .select('*')
    .order('created_at', { ascending: false });

  if (id) query = query.eq('id', id);
  if (referralId) query = query.eq('referral_id', referralId);
  if (participantId) query = query.eq('participant_id', participantId);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ ok: false, error: userFacingError(error.message) }, { status: 500 });
  }

  return NextResponse.json({ ok: true, assessments: data || [] });
}

export async function POST(req: NextRequest) {
  const actorId = await getAuthenticatedAdminActor(req);
  if (!actorId) {
    return NextResponse.json({ ok: false, error: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      referralId,
      participantId,
      participantName,
      dateOfBirth,
      isAdult,
      fundingType,
      payerDetails = {},
      suburb,
      postcode = '',
      requestedServices = [],
      riskTriage = {},
      assessorNotes = '',
    } = body;

    if (!participantName || !participantName.trim()) {
      return NextResponse.json({ ok: false, error: 'Participant name is required for assessment.' }, { status: 400 });
    }

    if (!suburb || !suburb.trim()) {
      return NextResponse.json({ ok: false, error: 'Suburb / location is required for serviceability check.' }, { status: 400 });
    }
    if (!fundingType || !['Self-Managed', 'Plan-Managed', 'NDIA-Managed', 'Unsure'].includes(fundingType)) {
      return NextResponse.json({ ok: false, error: 'Funding type must be explicitly selected.' }, { status: 400 });
    }
    if (!Array.isArray(requestedServices) || requestedServices.length === 0) {
      return NextResponse.json({ ok: false, error: 'At least one requested service must be explicitly selected.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: 'Governance service unavailable.' }, { status: 503 });
    }

    let verifiedContractingRelationshipId: string | undefined;
    if (fundingType === 'NDIA-Managed' && payerDetails?.contractingProviderRelationshipId) {
      const { data: relationship, error: relationshipError } = await supabase
        .from('contracting_provider_relationships')
        .select('id, effective_from, effective_to')
        .eq('id', payerDetails.contractingProviderRelationshipId)
        .eq('verification_status', 'verified')
        .not('verified_by', 'is', null)
        .not('verified_at', 'is', null)
        .maybeSingle();
      if (relationshipError) {
        return NextResponse.json({ ok: false, error: userFacingError(relationshipError.message) }, { status: 500 });
      }
      const today = new Date().toISOString().slice(0, 10);
      const isEffective = relationship
        && (!relationship.effective_from || relationship.effective_from <= today)
        && (!relationship.effective_to || relationship.effective_to >= today);
      verifiedContractingRelationshipId = isEffective ? relationship.id : undefined;
    }

    const suitabilityInput: SuitabilityInput = {
      referralId,
      participantId,
      participantName: participantName.trim(),
      dateOfBirth,
      isAdult,
      fundingType,
      payerDetails: { ...payerDetails, verifiedContractingRelationshipId },
      suburb: suburb.trim(),
      postcode: postcode.trim(),
      requestedServices,
      riskTriage,
      assessorNotes,
    };

    const evalResult = await validateSuitability(suitabilityInput, supabase);

    // Persist assessment record to live database
    const billingRelationshipStatus = fundingType === 'Self-Managed'
      ? 'verified_self_managed'
      : fundingType === 'Plan-Managed'
        ? 'verified_plan_managed'
        : verifiedContractingRelationshipId
          ? 'verified_registered_provider_contract'
          : fundingType === 'NDIA-Managed'
            ? 'billing_configuration_required'
            : 'pending_verification';
    const insertPayload = {
      referral_id: referralId || null,
      participant_id: participantId || null,
      assessed_by: actorId,
      funding_type: fundingType,
      payer_details: { ...payerDetails, verifiedContractingRelationshipId },
      billing_relationship_status: billingRelationshipStatus,
      region: evalResult.region,
      suburb: suburb.trim(),
      postcode: postcode.trim() || null,
      requested_services: requestedServices,
      service_scope_validation: evalResult.serviceValidation,
      risk_triage: riskTriage,
      is_adult: evalResult.isAdult,
      outcome: evalResult.outcome,
      outcome_reasons: evalResult.outcomeReasons,
      conditions: evalResult.conditions.join('; '),
      assessor_notes: assessorNotes,
    };

    const { data: assessment, error: insErr } = await supabase.rpc('governance_g1_record_suitability', {
      p_assessment: insertPayload,
      p_actor_id: actorId,
    });

    if (insErr || !assessment) {
      return NextResponse.json(
        { ok: false, error: userFacingError(insErr?.message || 'Could not save suitability assessment.') },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      assessment,
      evaluation: evalResult,
    });
  } catch (err: any) {
    console.error('Suitability assessment error:', err);
    return NextResponse.json(
      { ok: false, error: err.message || 'Governance service error processing suitability.' },
      { status: 500 }
    );
  }
}
