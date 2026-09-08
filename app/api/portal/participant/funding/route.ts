import { userFacingError } from '@/lib/userFacingError';
import { NextRequest, NextResponse } from 'next/server';
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

    if (!participantId) return NextResponse.json({ periods: [] });

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

    const processed = (periods || []).map((p: any) => {
      let totalBudget = 0;
      let totalDelivered = 0;
      let totalInvoiced = 0;

      const processedBudgets = (p.budgets || []).map((b: any) => {
        const bAmt = Number(b.budget_amount) || 0;
        const dAmt = Number(b.delivered_amount) || 0;
        const iAmt = Number(b.invoiced_amount) || 0;
        const remaining = Math.max(0, Number((bAmt - dAmt).toFixed(2)));
        const utilPct = bAmt > 0 ? Math.min(100, Math.round((dAmt / bAmt) * 100)) : 0;

        totalBudget += bAmt;
        totalDelivered += dAmt;
        totalInvoiced += iAmt;

        return {
          ...b,
          remaining_amount: remaining,
          utilisation_pct: utilPct,
        };
      });

      const totalRem = Math.max(0, Number((totalBudget - totalDelivered).toFixed(2)));
      const utilPct = totalBudget > 0 ? Math.min(100, Math.round((totalDelivered / totalBudget) * 100)) : 0;

      return {
        ...p,
        budgets: processedBudgets,
        total_budget: Number(totalBudget.toFixed(2)),
        total_delivered: Number(totalDelivered.toFixed(2)),
        total_invoiced: Number(totalInvoiced.toFixed(2)),
        total_remaining: totalRem,
        overall_utilisation_pct: utilPct,
        tracked_label: 'Opus Care tracked budget utilisation',
      };
    });

    return NextResponse.json({ periods: processed });
  } catch (err: any) {
    console.error('GET /api/portal/participant/funding error:', err);
    return NextResponse.json({ error: "We couldn't complete this action. Please refresh and try again." }, { status: 500 });
  }
}
