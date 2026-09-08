import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

    const supabase = createAdminClient();
    if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });

    // 1. Service records metrics
    const { data: serviceRecords } = await supabase
      .from('service_records')
      .select('subtotal, travel_amount, billable_status, approval_status');

    let deliveredServiceValue = 0;
    let approvedUnbilledValue = 0;
    let pendingApprovalValue = 0;

    (serviceRecords || []).forEach((sr: any) => {
      const val = Number(sr.subtotal || 0) + Number(sr.travel_amount || 0);
      deliveredServiceValue += val;

      if (sr.approval_status === 'Approved' && sr.billable_status === 'Ready') {
        approvedUnbilledValue += val;
      }
      if (sr.approval_status === 'Pending') {
        pendingApprovalValue += val;
      }
    });

    // 2. Invoice metrics
    const { data: invoices } = await supabase
      .from('invoices')
      .select('total, status');

    let draftInvoicesValue = 0;
    let sentInvoicesValue = 0;
    let paidInvoicesValue = 0;
    let outstandingValue = 0;
    let countDraft = 0;
    let countSent = 0;
    let countPaid = 0;
    let countRejected = 0;

    (invoices || []).forEach((inv: any) => {
      const val = Number(inv.total || 0);
      const st = inv.status?.toLowerCase();

      if (st === 'draft') {
        draftInvoicesValue += val;
        countDraft++;
      } else if (st === 'sent') {
        sentInvoicesValue += val;
        outstandingValue += val;
        countSent++;
      } else if (st === 'paid') {
        paidInvoicesValue += val;
        countPaid++;
      } else if (st === 'rejected' || st === 'cancelled') {
        countRejected++;
      } else if (st === 'ready' || st === 'partially paid') {
        outstandingValue += val;
      }
    });

    // 3. Funding utilisation metrics
    const { data: budgets } = await supabase
      .from('participant_funding_budgets')
      .select('budget_amount, delivered_amount, invoiced_amount');

    let totalBudget = 0;
    let totalDeliveredFunding = 0;
    let totalInvoicedFunding = 0;

    (budgets || []).forEach((b: any) => {
      totalBudget += Number(b.budget_amount || 0);
      totalDeliveredFunding += Number(b.delivered_amount || 0);
      totalInvoicedFunding += Number(b.invoiced_amount || 0);
    });

    const fundingUtilisationPct = totalBudget > 0
      ? Math.min(100, Math.round((totalDeliveredFunding / totalBudget) * 100))
      : 0;

    return NextResponse.json({
      delivered_service_value: Number(deliveredServiceValue.toFixed(2)),
      approved_unbilled_value: Number(approvedUnbilledValue.toFixed(2)),
      pending_approval_value: Number(pendingApprovalValue.toFixed(2)),
      draft_invoices_value: Number(draftInvoicesValue.toFixed(2)),
      sent_invoices_value: Number(sentInvoicesValue.toFixed(2)),
      outstanding_value: Number(outstandingValue.toFixed(2)),
      paid_value: Number(paidInvoicesValue.toFixed(2)),
      invoice_counts: {
        draft: countDraft,
        sent: countSent,
        paid: countPaid,
        rejected: countRejected,
        total: (invoices || []).length,
      },
      funding: {
        total_budget: Number(totalBudget.toFixed(2)),
        total_delivered: Number(totalDeliveredFunding.toFixed(2)),
        total_invoiced: Number(totalInvoicedFunding.toFixed(2)),
        utilisation_pct: fundingUtilisationPct,
      },
    });
  } catch (err: any) {
    console.error('GET /api/billing/finance-metrics error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
