import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import { userFacingError } from '@/lib/userFacingError';
import { validateSuitability, SuitabilityInput } from '@/lib/services/participantIntake';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) {
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
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) {
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
      assessedBy = 'Coordinator / Admin',
      assessorNotes = '',
    } = body;

    if (!participantName || !participantName.trim()) {
      return NextResponse.json({ ok: false, error: 'Participant name is required for assessment.' }, { status: 400 });
    }

    if (!suburb || !suburb.trim()) {
      return NextResponse.json({ ok: false, error: 'Suburb / location is required for serviceability check.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: 'Governance service unavailable.' }, { status: 503 });
    }

    // Run deterministic suitability engine
    const suitabilityInput: SuitabilityInput = {
      referralId,
      participantId,
      participantName: participantName.trim(),
      dateOfBirth,
      isAdult,
      fundingType: fundingType || 'Plan-Managed',
      payerDetails,
      suburb: suburb.trim(),
      postcode: postcode.trim(),
      requestedServices,
      riskTriage,
      assessedBy,
      assessorNotes,
    };

    const evalResult = await validateSuitability(suitabilityInput, supabase);

    // Persist assessment record to live database
    const insertPayload = {
      referral_id: referralId || null,
      participant_id: participantId || null,
      assessed_by: assessedBy,
      funding_type: fundingType || 'Plan-Managed',
      payer_details: payerDetails,
      billing_relationship_status: evalResult.outcome === 'Registered Provider Requirement' ? 'requires_registered_provider' : 'verified',
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

    const { data: assessment, error: insErr } = await supabase
      .from('service_suitability_assessments')
      .insert(insertPayload)
      .select()
      .single();

    if (insErr || !assessment) {
      return NextResponse.json(
        { ok: false, error: userFacingError(insErr?.message || 'Could not save suitability assessment.') },
        { status: 500 }
      );
    }

    // Update referral stage if referralId is present
    if (referralId) {
      await supabase
        .from('referrals')
        .update({
          status: evalResult.outcome === 'Declined / Outside Scope' ? 'declined' : 'assessment',
          updated_at: new Date().toISOString(),
        })
        .eq('id', referralId);
    }

    // Emit immutable audit event
    await supabase.from('audit_events').insert({
      entity_type: 'service_suitability_assessment',
      entity_id: assessment.id,
      actor_type: 'admin',
      actor_id: assessedBy,
      action: 'suitability_assessed',
      changes: {
        outcome: evalResult.outcome,
        reasons: evalResult.outcomeReasons,
        conditions: evalResult.conditions,
      },
      metadata: {
        referralId,
        participantId,
        fundingType,
        region: evalResult.region,
      },
    });

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
