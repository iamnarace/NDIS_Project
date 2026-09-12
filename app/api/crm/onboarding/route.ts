import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedAdminActor, isAuthenticatedAdmin } from '@/lib/adminAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import { userFacingError } from '@/lib/userFacingError';
import { checkParticipantReadiness } from '@/lib/services/participantIntake';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) {
    return NextResponse.json({ ok: false, error: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const participantId = searchParams.get('participant_id');

  if (!participantId) {
    return NextResponse.json({ ok: false, error: 'participant_id is required.' }, { status: 400 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Governance service unavailable.' }, { status: 503 });
  }

  try {
    const readiness = await checkParticipantReadiness(participantId, supabase);

    const { data: part } = await supabase
      .from('participants')
      .select('id, reference_number, full_name, lifecycle_stage, is_rosterable, readiness_notes')
      .eq('id', participantId)
      .maybeSingle();

    return NextResponse.json({
      ok: true,
      participant: part,
      isReady: readiness.isReady,
      percentage: readiness.percentage,
      blockers: readiness.blockers,
      requirements: readiness.requirements,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: userFacingError(err.message) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const actorId = await getAuthenticatedAdminActor(req);
  if (!actorId) {
    return NextResponse.json({ ok: false, error: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      participantId,
      code,
      status,
      waiverReason,
      notes,
      documentId,
    } = body;

    if (!participantId || !code || !status) {
      return NextResponse.json({ ok: false, error: 'participantId, code, and status are required.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: 'Governance service unavailable.' }, { status: 503 });
    }

    if (!['pending', 'completed', 'waived'].includes(status)) {
      return NextResponse.json({ ok: false, error: 'Checklist status is invalid.' }, { status: 400 });
    }

    const { error: updErr } = await supabase.rpc('governance_g1_update_checklist_item', {
      p_participant_id: participantId,
      p_actor_id: actorId,
      p_item_code: code,
      p_item_status: status,
      p_waiver_reason: waiverReason?.trim() || null,
      p_notes: notes?.trim() || null,
      p_document_id: documentId || null,
    });

    if (updErr) {
      return NextResponse.json({ ok: false, error: userFacingError(updErr.message) }, { status: 500 });
    }

    // Recalculate readiness
    const readiness = await checkParticipantReadiness(participantId, supabase);

    return NextResponse.json({
      ok: true,
      readiness,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: userFacingError(err.message) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const actorId = await getAuthenticatedAdminActor(req);
  if (!actorId) {
    return NextResponse.json({ ok: false, error: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { participantId, action } = body;

    if (!participantId) {
      return NextResponse.json({ ok: false, error: 'participantId is required.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: 'Governance service unavailable.' }, { status: 503 });
    }

    if (action === 'signoff') {
      // Final readiness review sign-off
      const readiness = await checkParticipantReadiness(participantId, supabase);

      if (!readiness.isReady) {
        return NextResponse.json({
          ok: false,
          error: 'Cannot approve roster readiness: participant onboarding is incomplete.',
          blockers: readiness.blockers,
        }, { status: 400 });
      }

      const { error: partErr } = await supabase.rpc('governance_g1_signoff_onboarding', {
        p_participant_id: participantId,
        p_actor_id: actorId,
      });

      if (partErr) {
        return NextResponse.json({ ok: false, error: userFacingError(partErr.message) }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        message: 'Participant onboarding complete. Participant is now active and roster eligible.',
        isRosterable: true,
        lifecycleStage: 'active_rosterable',
      });
    }

    return NextResponse.json({ ok: false, error: `Unrecognized action: ${action}` }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: userFacingError(err.message) }, { status: 500 });
  }
}
