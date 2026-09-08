import { userFacingError } from '@/lib/userFacingError';
﻿import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { isValidUuid, resolveParticipantUuid } from '@/lib/uuid';
import { logAuditEvent } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);
    let supabase: any = null;
    let participantId: string | null = null;

    if (isAdmin) {
      supabase = createAdminClient();
    } else {
      supabase = await createClient();
    }

    if (!supabase) return NextResponse.json({ invoices: [] });

    if (!isAdmin) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

      const { data: profile } = await supabase
        .from('profiles')
        .select('portal_participant_id')
        .eq('id', user.id)
        .single();
      participantId = profile?.portal_participant_id || null;
      if (!participantId) return NextResponse.json({ invoices: [] });
    }

    const { searchParams } = new URL(request.url);
    const pParam = searchParams.get('participant_id');
    const status = searchParams.get('status');

    let query = supabase
      .from('invoices')
      .select(`
        *,
        participant:participants(id, full_name, reference_number, funding_type, plan_manager_name, plan_manager_email, email, phone, street_address, suburb, postcode),
        items:invoice_line_items(
          *,
          service_record:service_records(*)
        )
      `)
      .order('created_at', { ascending: false });

    if (!isAdmin && participantId) {
      query = query.eq('participant_id', participantId);
    } else if (pParam) {
      const pUuid = isValidUuid(pParam) ? pParam : await resolveParticipantUuid(supabase, pParam);
      if (pUuid) query = query.eq('participant_id', pUuid);
    }

    if (status && status !== 'all') query = query.eq('status', status);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: userFacingError(error.message) }, { status: 500 });

    return NextResponse.json({ invoices: data || [] });
  } catch (err: any) {
    console.error('GET /api/billing/invoices error:', err);
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
      service_record_ids = [], // Array of service_records to invoice
      due_days = 14,
      notes,
    } = body;

    if (!participant_id) {
      return NextResponse.json({ error: 'Participant ID is required.' }, { status: 400 });
    }

    const pUuid = isValidUuid(participant_id) ? participant_id : await resolveParticipantUuid(supabase, participant_id);
    if (!pUuid) return NextResponse.json({ error: 'Participant not found.' }, { status: 404 });

    // 1. Fetch Participant Billing Details
    const { data: participant, error: partErr } = await supabase
      .from('participants')
      .select('*')
      .eq('id', pUuid)
      .single();

    if (partErr || !participant) return NextResponse.json({ error: 'Participant not found.' }, { status: 404 });

    // 2. Fetch APPROVED service records that are READY to bill
    let srQuery = supabase
      .from('service_records')
      .select('*')
      .eq('participant_id', pUuid)
      .eq('approval_status', 'Approved')
      .eq('billable_status', 'Ready');

    if (service_record_ids.length > 0) {
      srQuery = srQuery.in('id', service_record_ids);
    }

    const { data: serviceRecords, error: srErr } = await srQuery;
    if (srErr) return NextResponse.json({ error: userFacingError(srErr.message) }, { status: 500 });

    if (!serviceRecords || serviceRecords.length === 0) {
      return NextResponse.json({
        error: 'No approved service records ready for billing were found for this participant.',
      }, { status: 400 });
    }

    // 3. Compute Invoice Totals
    let subtotal = 0;
    const lineItems = serviceRecords.map((sr: any) => {
      const lineTotal = Number(sr.subtotal) + Number(sr.travel_amount || 0);
      subtotal += lineTotal;
      return {
        service_record_id: sr.id,
        support_item_code: sr.support_item_code || '01_011_0107_1_1',
        description: `${sr.support_item_name} (${sr.quantity} hrs @ $${Number(sr.unit_rate).toFixed(2)})${Number(sr.travel_amount || 0) > 0 ? ` + Travel $${Number(sr.travel_amount).toFixed(2)}` : ''}`,
        service_date: sr.service_date,
        quantity: sr.quantity,
        unit: sr.unit_type || 'Hour',
        unit_rate: sr.unit_rate,
        line_total: lineTotal,
      };
    });

    const gst = 0; // NDIS eligible support services are GST-free (s 38-38 GST Act)
    const total = Number(subtotal.toFixed(2));
    const invRef = 'INV-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);

    const now = new Date();
    const invoiceDate = now.toISOString().slice(0, 10);
    const dueDate = new Date(now.getTime() + (Number(due_days) || 14) * 86400000).toISOString().slice(0, 10);

    // 4. Insert Invoice
    const { data: invoice, error: invErr } = await supabase
      .from('invoices')
      .insert({
        invoice_reference: invRef,
        participant_id: pUuid,
        funding_type: participant.funding_type || 'Plan Managed',
        plan_manager_name: participant.plan_manager_name || null,
        plan_manager_email: participant.plan_manager_email || null,
        invoice_date: invoiceDate,
        due_date: dueDate,
        status: 'Draft',
        subtotal: total,
        gst: 0,
        total: total,
        notes: notes || null,
      })
      .select()
      .single();

    if (invErr) return NextResponse.json({ error: userFacingError(invErr.message) }, { status: 500 });

    // 5. Insert Invoice Line Items
    const lineItemsPayload = lineItems.map((li: any) => ({
      ...li,
      invoice_id: invoice.id,
    }));
    await supabase.from('invoice_line_items').insert(lineItemsPayload);

    // 6. Transition Service Records to 'Invoiced'
    const billedSrIds = serviceRecords.map((sr: any) => sr.id);
    await supabase
      .from('service_records')
      .update({
        billable_status: 'Invoiced',
        updated_at: new Date().toISOString(),
      })
      .in('id', billedSrIds);

    // 7. Update Participant Funding Budget (Invoiced Amount Tracking)
    try {
      const { data: periods } = await supabase
        .from('participant_funding_periods')
        .select('id, participant_funding_budgets(*)')
        .eq('participant_id', pUuid)
        .lte('plan_start', invoiceDate)
        .gte('plan_end', invoiceDate);

      if (periods && periods.length > 0) {
        const period = periods[0];
        const coreBudget = period.participant_funding_budgets?.find(
          (b: any) => b.category.toLowerCase().includes('core')
        );
        if (coreBudget) {
          const newInvoiced = Number(coreBudget.invoiced_amount || 0) + total;
          await supabase
            .from('participant_funding_budgets')
            .update({
              invoiced_amount: newInvoiced,
              updated_at: new Date().toISOString(),
            })
            .eq('id', coreBudget.id);
        }
      }
    } catch (fErr) {
      console.warn('Funding invoiced amount update notice:', fErr);
    }

    // 8. Log Audit Event
    await logAuditEvent({
      entity_type: 'invoices',
      entity_id: invoice.id,
      actor_type: 'admin',
      actor_id: 'admin',
      action: 'invoice_created',
      metadata: {
        invoice_reference: invRef,
        total,
        service_record_count: billedSrIds.length,
      },
    });

    const { data: fullInvoice } = await supabase
      .from('invoices')
      .select(`
        *,
        participant:participants(*),
        items:invoice_line_items(*)
      `)
      .eq('id', invoice.id)
      .single();

    return NextResponse.json({ invoice: fullInvoice }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/billing/invoices error:', err);
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
    const { id, status, notes, due_date } = body;

    if (!id || !isValidUuid(id)) {
      return NextResponse.json({ error: 'Valid invoice ID is required.' }, { status: 400 });
    }

    const { data: before } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single();

    if (!before) return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 });

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (status) updates.status = status;
    if (notes !== undefined) updates.notes = notes;
    if (due_date) updates.due_date = due_date;

    const { data: updated, error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        participant:participants(*),
        items:invoice_line_items(*)
      `)
      .single();

    if (error) return NextResponse.json({ error: userFacingError(error.message) }, { status: 500 });

    await logAuditEvent({
      entity_type: 'invoices',
      entity_id: id,
      actor_type: 'admin',
      actor_id: 'admin',
      action: 'invoice_status_changed',
      changes: { before, after: updated },
      metadata: { status },
    });

    return NextResponse.json({ invoice: updated });
  } catch (err: any) {
    console.error('PATCH /api/billing/invoices error:', err);
    return NextResponse.json({ error: userFacingError(err.message || 'Internal server error') }, { status: 500 });
  }
}
