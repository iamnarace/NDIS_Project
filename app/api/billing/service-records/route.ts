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
    if (!supabase) return NextResponse.json({ records: [] });

    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get('participant_id');
    const billableStatus = searchParams.get('billable_status');
    const approvalStatus = searchParams.get('approval_status');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    let query = supabase
      .from('service_records')
      .select(`
        *,
        participant:participants(id, full_name, reference_number, funding_type, plan_manager_name, plan_manager_email),
        staff:staff(id, full_name, role, reference_number),
        shift:shifts(id, shift_reference, service_type)
      `)
      .order('service_date', { ascending: false });

    if (participantId) {
      const pUuid = isValidUuid(participantId) ? participantId : await resolveParticipantUuid(supabase, participantId);
      if (pUuid) query = query.eq('participant_id', pUuid);
    }
    if (billableStatus && billableStatus !== 'all') query = query.eq('billable_status', billableStatus);
    if (approvalStatus && approvalStatus !== 'all') query = query.eq('approval_status', approvalStatus);
    if (from) query = query.gte('service_date', from);
    if (to) query = query.lte('service_date', to);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: userFacingError(error.message) }, { status: 500 });

    return NextResponse.json({ records: data || [] });
  } catch (err: any) {
    console.error('GET /api/billing/service-records error:', err);
    return NextResponse.json({ error: "We couldn't complete this action. Please refresh and try again." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

    const supabase = createAdminClient();
    if (!supabase) return NextResponse.json({ error: "We couldn't complete this action. Please refresh and try again." }, { status: 503 });

    const body = await request.json();
    const { id, billable_status, approval_status, unit_rate, quantity, notes } = body;

    if (!id || !isValidUuid(id)) {
      return NextResponse.json({ error: 'Valid service record ID is required.' }, { status: 400 });
    }

    const { data: before } = await supabase
      .from('service_records')
      .select('*')
      .eq('id', id)
      .single();

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (billable_status) updates.billable_status = billable_status;
    if (approval_status) updates.approval_status = approval_status;
    if (unit_rate !== undefined) updates.unit_rate = Number(unit_rate);
    if (quantity !== undefined) updates.quantity = Number(quantity);
    if (unit_rate !== undefined || quantity !== undefined) {
      const rate = unit_rate !== undefined ? Number(unit_rate) : Number(before?.unit_rate || 0);
      const qty = quantity !== undefined ? Number(quantity) : Number(before?.quantity || 0);
      updates.subtotal = Number((rate * qty).toFixed(2));
    }

    const { data: updated, error } = await supabase
      .from('service_records')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: userFacingError(error.message) }, { status: 500 });

    await logAuditEvent({
      entity_type: 'service_records',
      entity_id: id,
      actor_type: 'admin',
      actor_id: 'admin',
      action: 'service_record_updated',
      changes: { before, after: updated },
      metadata: { notes },
    });

    return NextResponse.json({ record: updated });
  } catch (err: any) {
    console.error('PATCH /api/billing/service-records error:', err);
    return NextResponse.json({ error: userFacingError(err.message || 'Internal server error') }, { status: 500 });
  }
}
