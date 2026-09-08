import { userFacingError } from '@/lib/userFacingError';
﻿import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { isValidUuid, resolveParticipantUuid } from '@/lib/uuid';

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

    if (!supabase) return NextResponse.json({ periods: [] });

    const { searchParams } = new URL(request.url);
    const pParam = searchParams.get('participant_id');

    if (!isAdmin) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

      const { data: profile } = await supabase
        .from('profiles')
        .select('portal_participant_id')
        .eq('id', user.id)
        .single();
      participantId = profile?.portal_participant_id || null;
    } else {
      participantId = pParam;
    }

    if (!participantId) {
      return NextResponse.json({ error: 'Participant ID is required.' }, { status: 400 });
    }

    const pUuid = isValidUuid(participantId) ? participantId : await resolveParticipantUuid(supabase, participantId);
    if (!pUuid) return NextResponse.json({ periods: [] });

    const { data: periods, error } = await supabase
      .from('participant_funding_periods')
      .select(`
        *,
        budgets:participant_funding_budgets(*)
      `)
      .eq('participant_id', pUuid)
      .order('plan_start', { ascending: false });

    if (error) return NextResponse.json({ error: userFacingError(error.message) }, { status: 500 });

    // Calculate aggregated metrics across budgets
    const processedPeriods = (periods || []).map((p: any) => {
      let totalBudget = 0;
      let totalCommitted = 0;
      let totalDelivered = 0;
      let totalInvoiced = 0;

      const processedBudgets = (p.budgets || []).map((b: any) => {
        const bAmount = Number(b.budget_amount) || 0;
        const dAmount = Number(b.delivered_amount) || 0;
        const iAmount = Number(b.invoiced_amount) || 0;
        const cAmount = Number(b.committed_amount) || 0;
        const remaining = Math.max(0, Number((bAmount - dAmount).toFixed(2)));
        const utilPct = bAmount > 0 ? Math.min(100, Math.round((dAmount / bAmount) * 100)) : 0;

        totalBudget += bAmount;
        totalCommitted += cAmount;
        totalDelivered += dAmount;
        totalInvoiced += iAmount;

        return {
          ...b,
          remaining_amount: remaining,
          utilisation_pct: utilPct,
        };
      });

      const totalRemaining = Math.max(0, Number((totalBudget - totalDelivered).toFixed(2)));
      const overallUtilPct = totalBudget > 0 ? Math.min(100, Math.round((totalDelivered / totalBudget) * 100)) : 0;

      return {
        ...p,
        budgets: processedBudgets,
        total_budget: Number(totalBudget.toFixed(2)),
        total_committed: Number(totalCommitted.toFixed(2)),
        total_delivered: Number(totalDelivered.toFixed(2)),
        total_invoiced: Number(totalInvoiced.toFixed(2)),
        total_remaining: totalRemaining,
        overall_utilisation_pct: overallUtilPct,
        tracked_label: 'Opus Care tracked budget utilisation',
      };
    });

    return NextResponse.json({ periods: processedPeriods });
  } catch (err: any) {
    console.error('GET /api/billing/funding error:', err);
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
      plan_start,
      plan_end,
      funding_type = 'Plan Managed',
      notes,
      budgets = [], // Array of { category: 'Core'|'Capacity Building'|'Capital', budget_amount, committed_amount }
    } = body;

    if (!participant_id || !plan_start || !plan_end) {
      return NextResponse.json({ error: 'Participant ID, plan start, and plan end are required.' }, { status: 400 });
    }

    const pUuid = isValidUuid(participant_id) ? participant_id : await resolveParticipantUuid(supabase, participant_id);
    if (!pUuid) return NextResponse.json({ error: 'Participant not found.' }, { status: 404 });

    const { data: period, error: pErr } = await supabase
      .from('participant_funding_periods')
      .insert({
        participant_id: pUuid,
        plan_start,
        plan_end,
        funding_type,
        notes: notes || null,
      })
      .select()
      .single();

    if (pErr) return NextResponse.json({ error: userFacingError(pErr.message) }, { status: 500 });

    const defaultBudgetCategories = budgets.length > 0 ? budgets : [
      { category: 'Core Supports', budget_amount: 35000, committed_amount: 0 },
      { category: 'Capacity Building', budget_amount: 15000, committed_amount: 0 },
    ];

    const budgetInserts = defaultBudgetCategories.map((b: any) => ({
      funding_period_id: period.id,
      category: b.category,
      budget_amount: Number(b.budget_amount) || 0,
      committed_amount: Number(b.committed_amount) || 0,
      delivered_amount: 0,
      invoiced_amount: 0,
    }));

    await supabase.from('participant_funding_budgets').insert(budgetInserts);

    return NextResponse.json({ period }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/billing/funding error:', err);
    return NextResponse.json({ error: "We couldn't complete this action. Please refresh and try again." }, { status: 500 });
  }
}
