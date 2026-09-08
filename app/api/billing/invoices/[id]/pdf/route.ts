import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isValidUuid } from '@/lib/uuid';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id || !isValidUuid(id)) return new NextResponse('Invalid Invoice ID', { status: 400 });

    const supabase = createAdminClient();
    if (!supabase) return new NextResponse('Database unavailable', { status: 503 });

    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        participant:participants(*),
        items:invoice_line_items(*)
      `)
      .eq('id', id)
      .single();

    if (error || !invoice) return new NextResponse('Invoice not found', { status: 404 });

    const p = invoice.participant || {};
    const items = invoice.items || [];

    const isPlanManaged = (invoice.funding_type || p.funding_type || '').toLowerCase().includes('plan');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tax Invoice ${invoice.invoice_reference} - Opus Care Support Services</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1E293B; margin: 0; padding: 40px; background: #FFF; line-height: 1.5; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0F766E; padding-bottom: 20px; margin-bottom: 28px; }
    .logo-title { font-size: 26px; font-weight: 800; color: #0F766E; }
    .provider-info { font-size: 13px; color: #64748B; text-align: right; }
    .invoice-title-tag { display: inline-block; background: #CCFBF1; color: #0F766E; font-size: 13px; font-weight: 800; padding: 4px 12px; border-radius: 4px; margin-top: 8px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
    .meta-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; font-size: 13px; }
    .meta-box h4 { margin: 0 0 8px; font-size: 12px; text-transform: uppercase; color: #64748B; letter-spacing: 0.05em; }
    .meta-box p { margin: 3px 0; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
    th { background: #F1F5F9; color: #334155; font-size: 12px; text-align: left; padding: 10px 12px; border-bottom: 2px solid #CBD5E1; }
    td { padding: 11px 12px; border-bottom: 1px solid #E2E8F0; font-size: 13px; vertical-align: top; }
    .total-box { margin-left: auto; width: 300px; background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 16px; margin-bottom: 28px; }
    .total-row { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 6px; }
    .total-row.grand { font-size: 18px; font-weight: 800; color: #15803D; border-top: 1px solid #BBF7D0; padding-top: 8px; margin-top: 8px; }
    .bank-box { background: #F8FAFC; border: 1px dashed #CBD5E1; border-radius: 8px; padding: 16px; font-size: 13px; margin-bottom: 24px; }
    .footer { font-size: 12px; color: #94A3B8; text-align: center; border-top: 1px solid #E2E8F0; padding-top: 18px; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px; text-align: right;">
    <button onclick="window.print()" style="background: #0F766E; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; cursor: pointer;">
      Print / Save as PDF
    </button>
  </div>

  <div class="header">
    <div>
      <div class="logo-title">OPUS CARE</div>
      <div style="font-size: 14px; color: #64748B;">Support Services Pty Ltd</div>
      <div class="invoice-title-tag">TAX INVOICE</div>
    </div>
    <div class="provider-info">
      <strong>Opus Care Support Services Pty Ltd</strong><br>
      ABN: 54 678 912 345<br>
      Clarence Valley & Northern Rivers NSW<br>
      accounts@opuscare.com.au | 1300 00 OPUS
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-box">
      <h4>Bill To:</h4>
      <p><strong>${p.full_name || 'Participant'}</strong></p>
      <p>NDIS No: ${p.ndis_number || 'Not recorded'}</p>
      <p>Funding Management: <strong>${invoice.funding_type || p.funding_type || 'Plan Managed'}</strong></p>
      ${isPlanManaged && (invoice.plan_manager_name || p.plan_manager_name) ? `
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #CBD5E1;">
          <p><strong>Plan Manager:</strong> ${invoice.plan_manager_name || p.plan_manager_name}</p>
          <p>Email: ${invoice.plan_manager_email || p.plan_manager_email || 'Not recorded'}</p>
        </div>
      ` : ''}
    </div>
    <div class="meta-box">
      <h4>Invoice Details</h4>
      <p>Invoice Ref: <strong style="font-family: monospace; font-size: 14px;">${invoice.invoice_reference}</strong></p>
      <p>Invoice Date: ${new Date(invoice.invoice_date).toLocaleDateString('en-AU')}</p>
      <p>Payment Due Date: <strong style="color: #DC2626;">${new Date(invoice.due_date).toLocaleDateString('en-AU')}</strong></p>
      <p>Status: <span style="font-weight: 700; color: #0F766E;">${invoice.status}</span></p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Service Date</th>
        <th>NDIS Item Code</th>
        <th>Description / Service Details</th>
        <th>Qty (hrs/km)</th>
        <th>Unit Rate</th>
        <th style="text-align: right;">Amount (AUD)</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((it: any) => `
        <tr>
          <td>${it.service_date ? new Date(it.service_date).toLocaleDateString('en-AU') : '-'}</td>
          <td style="font-family: monospace; font-size: 12px; font-weight: 600;">${it.support_item_code || 'NDIS-CORE'}</td>
          <td>${it.description}</td>
          <td>${it.quantity} ${it.unit || ''}</td>
          <td>$${Number(it.unit_rate).toFixed(2)}</td>
          <td style="text-align: right; font-weight: 600;">$${Number(it.line_total).toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="total-box">
    <div class="total-row"><span>Subtotal:</span><span>$${Number(invoice.subtotal).toFixed(2)}</span></div>
    <div class="total-row"><span>GST (GST-Free NDIS Supply):</span><span>$0.00</span></div>
    <div class="total-row grand"><span>Total Due:</span><span>$${Number(invoice.total).toFixed(2)}</span></div>
  </div>

  <div class="bank-box">
    <h4 style="margin: 0 0 8px; color: #0F766E; font-size: 13px;">Payment Options & Remittance Advice</h4>
    <p><strong>Direct Electronic Funds Transfer (EFT):</strong></p>
    <p>Bank: <strong>National Australia Bank (NAB)</strong></p>
    <p>Account Name: <strong>Opus Care Support Services Pty Ltd</strong></p>
    <p>BSB: <strong>082-057</strong> | Account Number: <strong>89-214-5561</strong></p>
    <p>Payment Reference: <strong style="color: #0F766E;">${invoice.invoice_reference}</strong></p>
    <p style="font-size: 11px; color: #64748B; margin-top: 6px;">Please email remittance advice to: accounts@opuscare.com.au</p>
  </div>

  <div class="footer">
    Opus Care Support Services Pty Ltd &bull; Person-Centred Disability Support &bull; NSW Northern Rivers<br>
    All supports delivered in accordance with NDIS Code of Conduct & Quality Guidelines.
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
