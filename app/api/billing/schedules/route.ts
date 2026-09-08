import { userFacingError } from '@/lib/userFacingError';
﻿import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { isValidUuid, resolveParticipantUuid } from '@/lib/uuid';
import { logAuditEvent } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

    const supabase = createAdminClient();
    if (!supabase) return NextResponse.json({ schedules: [] });

    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get('participant_id');
    const agreementId = searchParams.get('agreement_id');
    const status = searchParams.get('status');

    let query = supabase
      .from('support_schedules')
      .select(`
        *,
        participant:participants(id, full_name, reference_number),
        items:support_schedule_items(
          *,
          support_item:ndis_support_items(*)
        )
      `)
      .order('created_at', { ascending: false });

    if (participantId) {
      const pUuid = isValidUuid(participantId) ? participantId : await resolveParticipantUuid(supabase, participantId);
      if (pUuid) query = query.eq('participant_id', pUuid);
    }
    if (agreementId && isValidUuid(agreementId)) query = query.eq('agreement_id', agreementId);
    if (status && status !== 'all') query = query.eq('status', status);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: userFacingError(error.message) }, { status: 500 });

    return NextResponse.json({ schedules: data || [] });
  } catch (err: any) {
    console.error('GET /api/billing/schedules error:', err);
    return NextResponse.json({ error: "We couldn't complete this action. Please refresh and try again." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

    const supabase = createAdminClient();
    if (!supabase) return NextResponse.json({ error: "We couldn't complete this action. Please refresh and try again." }, { status: 503 });

    const body = await request.json();
    const {
      participant_id,
      agreement_id,
      quote_id,
      effective_from,
      effective_to,
      items = [],
    } = body;

    if (!participant_id) {
      return NextResponse.json({ error: 'Participant ID is required.' }, { status: 400 });
    }

    const pUuid = isValidUuid(participant_id) ? participant_id : await resolveParticipantUuid(supabase, participant_id);
    if (!pUuid) return NextResponse.json({ error: 'Participant not found.' }, { status: 404 });

    const schedRef = 'SCH-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);

    const { data: schedule, error: sErr } = await supabase
      .from('support_schedules')
      .insert({
        schedule_reference: schedRef,
        participant_id: pUuid,
        agreement_id: agreement_id && isValidUuid(agreement_id) ? agreement_id : null,
        quote_id: quote_id && isValidUuid(quote_id) ? quote_id : null,
        version_number: 1,
        effective_from: effective_from || new Date().toISOString().slice(0, 10),
        effective_to: effective_to || null,
        status: 'Active',
      })
      .select()
      .single();

    if (sErr) return NextResponse.json({ error: userFacingError(sErr.message) }, { status: 500 });

    if (items.length > 0) {
      const itemsPayload = items.map((it: any) => ({
        schedule_id: schedule.id,
        support_item_id: it.support_item_id || null,
        agreed_rate: Number(it.agreed_rate) || 67.56,
        unit: it.unit || 'Hour',
        hours_per_week: Number(it.hours_per_week) || 0,
        estimated_weeks: Number(it.estimated_weeks) || 52,
        estimated_total: Number((Number(it.hours_per_week || 0) * Number(it.agreed_rate || 67.56) * Number(it.estimated_weeks || 52)).toFixed(2)),
        notes: it.notes || null,
      }));
      await supabase.from('support_schedule_items').insert(itemsPayload);
    }

    await logAuditEvent({
      entity_type: 'support_schedules',
      entity_id: schedule.id,
      actor_type: 'admin',
      actor_id: 'admin',
      action: 'schedule_activated',
      metadata: { schedule_reference: schedRef },
    });

    return NextResponse.json({ schedule }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/billing/schedules error:', err);
    return NextResponse.json({ error: userFacingError(err.message || 'Internal server error') }, { status: 500 });
  }
}
