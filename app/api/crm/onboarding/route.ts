import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import { userFacingError } from '@/lib/userFacingError';
import { checkParticipantReadiness, ChecklistRequirement } from '@/lib/services/participantIntake';

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
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) {
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
      actorId = 'Admin / Coordinator',
      documentId,
    } = body;

    if (!participantId || !code || !status) {
      return NextResponse.json({ ok: false, error: 'participantId, code, and status are required.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: 'Governance service unavailable.' }, { status: 503 });
    }

    const { data: checklist, error: chkErr } = await supabase
      .from('participant_onboarding_checklists')
      .select('*')
      .eq('participant_id', participantId)
      .maybeSingle();

    if (chkErr || !checklist) {
      return NextResponse.json({ ok: false, error: 'Onboarding checklist not found for participant.' }, { status: 404 });
    }

    const reqs: Record<string, ChecklistRequirement> = checklist.requirements || {};
    const item = reqs[code];
    if (!item) {
      return NextResponse.json({ ok: false, error: `Requirement code "${code}" does not exist on checklist.` }, { status: 400 });
    }

    // Waiver validation
    if (status === 'waived') {
      if (!item.waivable) {
        return NextResponse.json(
          { ok: false, error: `Critical requirement "${item.title}" is non-waivable and cannot be bypassed.` },
          { status: 400 }
        );
      }
      if (!waiverReason || !waiverReason.trim()) {
        return NextResponse.json(
          { ok: false, error: `Mandatory waiver rationale must be provided to waive "${item.title}".` },
          { status: 400 }
        );
      }
      item.status = 'waived';
      item.waivedAt = new Date().toISOString();
      item.waivedBy = actorId;
      item.waiverReason = waiverReason.trim();
    } else if (status === 'completed') {
      item.status = 'completed';
      item.completedAt = new Date().toISOString();
      item.completedBy = actorId;
    } else {
      item.status = 'pending';
      delete item.completedAt;
      delete item.completedBy;
      delete item.waivedAt;
      delete item.waivedBy;
      delete item.waiverReason;
    }

    if (notes) item.notes = notes;
    if (documentId) item.documentId = documentId;

    reqs[code] = item;

    // Update checklist in database
    const { error: updErr } = await supabase
      .from('participant_onboarding_checklists')
      .update({
        requirements: reqs,
        updated_at: new Date().toISOString(),
      })
      .eq('participant_id', participantId);

    if (updErr) {
      return NextResponse.json({ ok: false, error: userFacingError(updErr.message) }, { status: 500 });
    }

    // Recalculate readiness
    const readiness = await checkParticipantReadiness(participantId, supabase);

    // If previously ready but now broken, revoke roster eligibility
    if (!readiness.isReady) {
      await supabase
        .from('participants')
        .update({ is_rosterable: false, updated_at: new Date().toISOString() })
        .eq('id', participantId);

      await supabase
        .from('participant_onboarding_checklists')
        .update({ is_ready_for_rostering: false, updated_at: new Date().toISOString() })
        .eq('participant_id', participantId);
    }

    // Emit audit event
    await supabase.from('audit_events').insert({
      entity_type: 'participant_onboarding_checklist',
      entity_id: checklist.id,
      actor_type: 'admin',
      actor_id: actorId,
      action: 'checklist_item_updated',
      changes: {
        code,
        status,
        waiverReason: item.waiverReason,
      },
      metadata: {
        participantId,
        readinessPercentage: readiness.percentage,
        isReady: readiness.isReady,
      },
    });

    return NextResponse.json({
      ok: true,
      readiness,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: userFacingError(err.message) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) {
    return NextResponse.json({ ok: false, error: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { participantId, actorId = 'Director / Admin', action } = body;

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

      // Update participant to active / rosterable
      const { error: partErr } = await supabase
        .from('participants')
        .update({
          is_rosterable: true,
          lifecycle_stage: 'active_rosterable',
          status: 'active',
          readiness_notes: `Onboarding verified and approved by ${actorId} on ${new Date().toISOString()}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', participantId);

      if (partErr) {
        return NextResponse.json({ ok: false, error: userFacingError(partErr.message) }, { status: 500 });
      }

      // Update checklist record
      await supabase
        .from('participant_onboarding_checklists')
        .update({
          is_ready_for_rostering: true,
          signoff_by: actorId,
          signoff_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('participant_id', participantId);

      // Emit audit log
      await supabase.from('audit_events').insert({
        entity_type: 'participant',
        entity_id: participantId,
        actor_type: 'admin',
        actor_id: actorId,
        action: 'readiness_approved',
        changes: {
          is_rosterable: true,
          lifecycle_stage: 'active_rosterable',
        },
        metadata: {
          participantId,
          approvedAt: new Date().toISOString(),
        },
      });

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
