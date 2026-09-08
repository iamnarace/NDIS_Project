import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isValidUuid } from '@/lib/uuid';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id || !isValidUuid(id)) {
      return new NextResponse('Invalid Quote ID', { status: 400 });
    }

    const supabase = createAdminClient();
    if (!supabase) return new NextResponse('Database unavailable', { status: 503 });

    const { data: quote, error } = await supabase
      .from('quotes')
      .select(`
        *,
        participant:participants(*),
        items:quote_line_items(
          *,
          support_item:ndis_support_items(*)
        )
      `)
      .eq('id', id)
      .single();

    if (error || !quote) return new NextResponse('Quote not found', { status: 404 });

    const p = quote.participant || {};
    const items = quote.items || [];

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Quote ${quote.quote_reference} - Opus Care Support Services</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1E293B; margin: 0; padding: 40px; background: #FFF; line-height: 1.5; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0284C7; padding-bottom: 20px; margin-bottom: 30px; }
    .logo-title { font-size: 24px; font-weight: 800; color: #0369A1; }
    .provider-info { font-size: 13px; color: #64748B; text-align: right; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 30px; }
    .meta-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; }
    .meta-box h4 { margin: 0 0 8px; font-size: 12px; text-transform: uppercase; color: #64748B; letter-spacing: 0.05em; }
    .meta-box p { margin: 4px 0; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { background: #F1F5F9; color: #334155; font-size: 12px; text-align: left; padding: 10px 12px; border-bottom: 2px solid #CBD5E1; }
    td { padding: 12px; border-bottom: 1px solid #E2E8F0; font-size: 13px; vertical-align: top; }
    .total-box { margin-left: auto; width: 280px; background: #F0F9FF; border: 1px solid #BAE6FD; border-radius: 8px; padding: 16px; margin-bottom: 30px; }
    .total-row { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 6px; }
    .total-row.grand { font-size: 18px; font-weight: 800; color: #0369A1; border-top: 1px solid #BAE6FD; padding-top: 8px; margin-top: 8px; }
    .footer { font-size: 12px; color: #94A3B8; text-align: center; border-top: 1px solid #E2E8F0; padding-top: 20px; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px; text-align: right;">
    <button onclick="window.print()" style="background: #0284C7; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; cursor: pointer;">
      Print / Save as PDF
    </button>
  </div>

  <div class="header">
    <div>
      <div class="logo-title">OPUS CARE</div>
      <div style="font-size: 14px; color: #64748B;">Support Services Pty Ltd</div>
      <div style="margin-top: 8px; display: inline-block; background: #E0F2FE; color: #0369A1; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 4px;">
        NDIS SERVICE ESTIMATE / QUOTE
      </div>
    </div>
    <div class="provider-info">
      <strong>Opus Care Support Services</strong><br>
      ABN: 54 678 912 345<br>
      Clarence Valley & Northern Rivers NSW<br>
      contact@opuscare.com.au | 1300 00 OPUS
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-box">
      <h4>Participant Details</h4>
      <p><strong>${p.full_name || 'Participant'}</strong></p>
      <p>NDIS No: ${p.ndis_number || 'Not recorded'}</p>
      <p>Funding: ${p.funding_type || 'Plan Managed'}</p>
      <p>Email: ${p.email || 'Not recorded'} | Phone: ${p.phone || 'Not recorded'}</p>
    </div>
    <div class="meta-box">
      <h4>Quote Overview</h4>
      <p>Quote Ref: <strong>${quote.quote_reference}</strong></p>
      <p>Date: ${new Date(quote.created_at).toLocaleDateString('en-AU')}</p>
      <p>Valid Until: ${quote.valid_until ? new Date(quote.valid_until).toLocaleDateString('en-AU') : '30 days'}</p>
      <p>Status: <span style="font-weight: 600; color: #0284C7;">${quote.status}</span></p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Support Item & Description</th>
        <th>Code</th>
        <th>Unit Rate</th>
        <th>Qty / Wk</th>
        <th>Weeks</th>
        <th style="text-align: right;">Line Total</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((it: any) => `
        <tr>
          <td>
            <strong>${it.description}</strong>
            ${it.support_item?.support_item_name ? `<div style="font-size: 11px; color: #64748B;">${it.support_item.support_item_name}</div>` : ''}
          </td>
          <td style="font-family: monospace; font-size: 12px;">${it.support_item?.support_item_code || 'NDIS-CORE'}</td>
          <td>$${Number(it.unit_rate).toFixed(2)} / ${it.unit || 'hr'}</td>
          <td>${it.quantity}</td>
          <td>${it.estimated_weeks || 52}</td>
          <td style="text-align: right; font-weight: 600;">$${Number(it.line_total).toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="total-box">
    <div class="total-row"><span>Weekly Estimate:</span><strong>$${(Number(quote.total) / 52).toFixed(2)} / wk</strong></div>
    <div class="total-row"><span>Monthly Estimate:</span><strong>$${((Number(quote.total) / 52) * 4.33).toFixed(2)} / mo</strong></div>
    <div class="total-row"><span>GST (NDIS exempt):</span><strong>$0.00</strong></div>
    <div class="total-row grand"><span>Total Estimate:</span><span>$${Number(quote.total).toFixed(2)}</span></div>
  </div>

  ${quote.notes ? `
    <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px; margin-bottom: 30px; font-size: 13px;">
      <strong>Notes & Schedule Conditions:</strong>
      <div style="margin-top: 4px; color: #475569;">${quote.notes}</div>
    </div>
  ` : ''}

  <div class="footer">
    This estimate is subject to participant NDIS funding availability and execution of an Opus Care Service Agreement.<br>
    Opus Care Support Services Pty Ltd &bull; Person-Centred Disability Support &bull; NSW Northern Rivers
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (err: any) {
    return new NextResponse('Internal Error: ' + err.message, { status: 500 });
  }
}
