import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { logAuditEvent } from '@/lib/audit';
import { validateParticipantMoneyTransaction } from '@/lib/services/whsContinuityGovernance';

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);
    let supabase: any = null;

    if (isAdmin) {
      supabase = createAdminClient();
    } else {
      supabase = await createClient();
    }

    if (!supabase) return NextResponse.json({ transactions: [] });

    if (!isAdmin) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, portal_participant_id, portal_staff_id, is_active')
        .eq('id', user.id)
        .single();
      if (!profile?.is_active) return NextResponse.json({ error: 'Unauthorised' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get('participant_id');
    const workerId = searchParams.get('worker_id');

    let query = supabase
      .from('participant_money_transactions')
      .select('*, participant:participants(id, full_name, reference_number), worker:staff(id, full_name, reference_number)')
      .order('transaction_date', { ascending: false });

    if (participantId) query = query.eq('participant_id', participantId);
    if (workerId) query = query.eq('worker_id', workerId);

    const { data, error } = await query;
    if (error) {
      console.error('Money transactions query error:', error);
      return NextResponse.json({ transactions: [] });
    }

    return NextResponse.json({ transactions: data || [] });
  } catch (err) {
    console.error('GET /api/governance/money-transactions error:', err);
    return NextResponse.json({ error: 'Failed to retrieve money transactions.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);
    let supabase: any = null;
    let actorId = 'admin';
    let actorType = 'admin';
    let workerStaffId: string | null = null;

    if (isAdmin) {
      supabase = createAdminClient();
    } else {
      supabase = await createClient();
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
        actorId = user.id;
        actorType = 'worker';
        const { data: profile } = await supabase
          .from('profiles')
          .select('portal_staff_id, role, is_active')
          .eq('id', user.id)
          .single();
        if (!profile?.is_active || profile.role !== 'worker' || !profile.portal_staff_id) {
          return NextResponse.json({ error: 'Portal worker access required.' }, { status: 403 });
        }
        workerStaffId = profile.portal_staff_id;
      }
    }

    const insertClient = createAdminClient() || supabase;
    if (!insertClient) return NextResponse.json({ error: 'Service unavailable.' }, { status: 503 });

    const body = await request.json();
    const {
      participant_id,
      worker_id,
      shift_id,
      transaction_date,
      purpose,
      amount,
      payment_method,
      receipt_obtained,
      receipt_number,
      receipt_url,
      participant_authority_confirmed,
      discrepancy_notes,
    } = body;

    if (!participant_id || !purpose || amount === undefined) {
      return NextResponse.json({ error: 'participant_id, purpose, and amount are required.' }, { status: 400 });
    }

    // Validate through governance rules
    const validation = validateParticipantMoneyTransaction({
      amount: Number(amount),
      paymentMethod: payment_method || 'cash',
      receiptObtained: Boolean(receipt_obtained),
      receiptNumber: receipt_number,
      participantAuthorityConfirmed: Boolean(participant_authority_confirmed),
    });

    if (!validation.isValid) {
      return NextResponse.json({ error: validation.errors.join(' ') }, { status: 400 });
    }

    const year = new Date().getFullYear();
    const { count } = await insertClient
      .from('participant_money_transactions')
      .select('*', { count: 'exact', head: true });
    const ref = `PMT-${year}-${String((count ?? 0) + 1).padStart(4, '0')}`;

    const resolvedWorkerId = isAdmin ? (worker_id || null) : workerStaffId;

    const { data, error } = await insertClient
      .from('participant_money_transactions')
      .insert({
        transaction_reference: ref,
        participant_id,
        worker_id: resolvedWorkerId,
        shift_id: shift_id || null,
        transaction_date: transaction_date || new Date().toISOString().split('T')[0],
        purpose,
        amount: Number(amount),
        payment_method: payment_method || 'cash',
        receipt_obtained: Boolean(receipt_obtained),
        receipt_number: receipt_number || null,
        receipt_url: receipt_url || null,
        participant_authority_confirmed: Boolean(participant_authority_confirmed),
        reconciled: false,
        discrepancy_notes: discrepancy_notes || null,
        prohibited_conduct_acknowledged: true,
      })
      .select('*, participant:participants(id, full_name, reference_number)')
      .single();

    if (error) {
      console.error('Participant money transaction insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAuditEvent({
      entity_type: 'participant_money_transaction',
      entity_id: data.id,
      actor_type: actorType,
      actor_id: actorId,
      action: 'created',
      changes: { transaction_reference: ref, amount: data.amount, purpose },
      metadata: { participant_id },
    });

    return NextResponse.json({ transaction: data }, { status: 201 });
  } catch (err) {
    console.error('POST /api/governance/money-transactions error:', err);
    return NextResponse.json({ error: 'Failed to record money transaction.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Only administrative staff can reconcile money transactions.' }, { status: 403 });
    }

    const supabase = createAdminClient();
    if (!supabase) return NextResponse.json({ error: 'Service unavailable.' }, { status: 503 });

    const body = await request.json();
    const { id, reconcile, discrepancy_notes, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Transaction ID is required.' }, { status: 400 });
    }

    if (reconcile) {
      updates.reconciled = true;
      updates.reconciled_at = new Date().toISOString();
      updates.reconciled_by = 'Finance & Operations Lead';
    }
    if (discrepancy_notes !== undefined) {
      updates.discrepancy_notes = discrepancy_notes;
    }

    const { data, error } = await supabase
      .from('participant_money_transactions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, participant:participants(id, full_name, reference_number)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAuditEvent({
      entity_type: 'participant_money_transaction',
      entity_id: id,
      actor_type: 'admin',
      actor_id: 'admin',
      action: reconcile ? 'reconciled' : 'updated',
      changes: updates,
    });

    return NextResponse.json({ transaction: data });
  } catch (err) {
    console.error('PATCH /api/governance/money-transactions error:', err);
    return NextResponse.json({ error: 'Failed to update money transaction.' }, { status: 500 });
  }
}
