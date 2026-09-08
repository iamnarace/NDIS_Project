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
    if (!supabase) return NextResponse.json({ quotes: [] });

    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get('participant_id');
    const status = searchParams.get('status');

    let query = supabase
      .from('quotes')
      .select(`
        *,
        participant:participants(id, full_name, reference_number, email, phone, funding_type, plan_manager_name, plan_manager_email),
        items:quote_line_items(
          *,
          support_item:ndis_support_items(*)
        )
      `)
      .order('created_at', { ascending: false });

    if (participantId) {
      const pUuid = isValidUuid(participantId) ? participantId : await resolveParticipantUuid(supabase, participantId);
      if (pUuid) query = query.eq('participant_id', pUuid);
    }
    if (status && status !== 'all') query = query.eq('status', status);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: userFacingError(error.message) }, { status: 500 });

    return NextResponse.json({ quotes: data || [] });
  } catch (err: any) {
    console.error('GET /api/billing/quotes error:', err);
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
      valid_until,
      notes,
      items = [], // Array of { support_item_id, description, quantity, frequency, unit_rate, estimated_weeks }
    } = body;

    if (!participant_id) {
      return NextResponse.json({ error: 'Participant ID is required.' }, { status: 400 });
    }

    const pUuid = isValidUuid(participant_id) ? participant_id : await resolveParticipantUuid(supabase, participant_id);
    if (!pUuid) return NextResponse.json({ error: 'Participant not found.' }, { status: 404 });

    // Calculate totals
    let total = 0;
    const computedItems = items.map((item: any) => {
      const qty = Number(item.quantity) || 0;
      const rate = Number(item.unit_rate) || 0;
      const weeks = Number(item.estimated_weeks) || 52;
      const lineTotal = Number((qty * rate * weeks).toFixed(2));
      total += lineTotal;
      return {
        support_item_id: item.support_item_id || null,
        description: item.description || 'Support Service',
        unit: item.unit || 'Hour',
        quantity: qty,
        frequency: item.frequency || 'Weekly',
        unit_rate: rate,
        estimated_weeks: weeks,
        line_total: lineTotal,
      };
    });

    const quoteRef = 'QTE-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);

    const { data: quote, error: qErr } = await supabase
      .from('quotes')
      .insert({
        quote_reference: quoteRef,
        participant_id: pUuid,
        status: 'Draft',
        valid_until: valid_until || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        notes: notes || null,
        subtotal: Number(total.toFixed(2)),
        total: Number(total.toFixed(2)),
        created_by: 'Admin',
      })
      .select()
      .single();

    if (qErr) return NextResponse.json({ error: userFacingError(qErr.message) }, { status: 500 });

    // Insert line items
    if (computedItems.length > 0) {
      const itemsPayload = computedItems.map((ci: any) => ({
        ...ci,
        quote_id: quote.id,
      }));
      await supabase.from('quote_line_items').insert(itemsPayload);
    }

    await logAuditEvent({
      entity_type: 'quotes',
      entity_id: quote.id,
      actor_type: 'admin',
      actor_id: 'admin',
      action: 'quote_created',
      metadata: { quote_reference: quoteRef, total },
    });

    // Return full quote with items
    const { data: fullQuote } = await supabase
      .from('quotes')
      .select(`
        *,
        participant:participants(id, full_name, reference_number, email, phone),
        items:quote_line_items(*)
      `)
      .eq('id', quote.id)
      .single();

    return NextResponse.json({ quote: fullQuote }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/billing/quotes error:', err);
    return NextResponse.json({ error: userFacingError(err.message || 'Internal server error') }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

    const supabase = createAdminClient();
    if (!supabase) return NextResponse.json({ error: "We couldn't complete this action. Please refresh and try again." }, { status: 503 });

    const body = await request.json();
    const { id, action, status, notes } = body;

    if (!id || !isValidUuid(id)) {
      return NextResponse.json({ error: 'Valid quote ID is required.' }, { status: 400 });
    }

    const { data: quote, error: fetchErr } = await supabase
      .from('quotes')
      .select('*, items:quote_line_items(*)')
      .eq('id', id)
      .single();

    if (fetchErr || !quote) return NextResponse.json({ error: 'Quote not found.' }, { status: 404 });

    // Action 1: Status Change
    if (status && !action) {
      const { data: updated, error: updateErr } = await supabase
        .from('quotes')
        .update({
          status,
          notes: notes !== undefined ? notes : quote.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (updateErr) return NextResponse.json({ error: userFacingError(updateErr.message) }, { status: 500 });

      await logAuditEvent({
        entity_type: 'quotes',
        entity_id: id,
        actor_type: 'admin',
        actor_id: 'admin',
        action: 'quote_status_changed',
        metadata: { status },
      });

      return NextResponse.json({ quote: updated });
    }

    // Action 2: Convert Quote to Schedule of Supports
    if (action === 'convert_to_schedule') {
      const schedRef = 'SCH-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);

      const { data: schedule, error: schErr } = await supabase
        .from('support_schedules')
        .insert({
          schedule_reference: schedRef,
          participant_id: quote.participant_id,
          quote_id: quote.id,
          version_number: 1,
          effective_from: new Date().toISOString().slice(0, 10),
          status: 'Active',
        })
        .select()
        .single();

      if (schErr) return NextResponse.json({ error: userFacingError(schErr.message) }, { status: 500 });

      if (quote.items && quote.items.length > 0) {
        const schedItems = quote.items.map((qi: any) => ({
          schedule_id: schedule.id,
          support_item_id: qi.support_item_id,
          agreed_rate: qi.unit_rate,
          unit: qi.unit,
          hours_per_week: qi.quantity,
          estimated_weeks: qi.estimated_weeks || 52,
          estimated_total: qi.line_total,
          notes: qi.description,
        }));
        await supabase.from('support_schedule_items').insert(schedItems);
      }

      // Mark quote converted
      await supabase
        .from('quotes')
        .update({ status: 'Converted', updated_at: new Date().toISOString() })
        .eq('id', id);

      await logAuditEvent({
        entity_type: 'quotes',
        entity_id: id,
        actor_type: 'admin',
        actor_id: 'admin',
        action: 'quote_converted_to_schedule',
        metadata: { schedule_id: schedule.id, schedule_reference: schedRef },
      });

      return NextResponse.json({ success: true, schedule, message: `Successfully converted to Support Schedule ${schedRef}` });
    }

    // Action 3: Convert Quote to Agreement
    if (action === 'convert_to_agreement') {
      const agrRef = 'AGR-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);

      const { data: agreement, error: agrErr } = await supabase
        .from('agreement_records')
        .insert({
          agreement_reference: agrRef,
          owner_type: 'participant',
          owner_id: quote.participant_id,
          title: `NDIS Service Agreement (${quote.quote_reference})`,
          estimated_budget: quote.total,
          commencement_date: new Date().toISOString().slice(0, 10),
          status: 'draft',
          questionnaire_data: {
            quote_id: quote.id,
            quote_reference: quote.quote_reference,
            budget: quote.total,
            items: quote.items,
          },
          created_by: 'Admin',
        })
        .select()
        .single();

      if (agrErr) return NextResponse.json({ error: userFacingError(agrErr.message) }, { status: 500 });

      await supabase
        .from('quotes')
        .update({ status: 'Converted', updated_at: new Date().toISOString() })
        .eq('id', id);

      await logAuditEvent({
        entity_type: 'quotes',
        entity_id: id,
        actor_type: 'admin',
        actor_id: 'admin',
        action: 'quote_converted_to_agreement',
        metadata: { agreement_id: agreement.id, agreement_reference: agrRef },
      });

      return NextResponse.json({ success: true, agreement, message: `Successfully converted to Service Agreement ${agrRef}` });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (err: any) {
    console.error('PATCH /api/billing/quotes error:', err);
    return NextResponse.json({ error: userFacingError(err.message || 'Internal server error') }, { status: 500 });
  }
}
