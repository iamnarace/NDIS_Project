import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isValidUuid } from '@/lib/uuid';
import { getOrganisationProfile } from '@/lib/organisation';
import { renderDocumentShell, DocumentRecipient } from '@/lib/documents/documentTemplate';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id || !isValidUuid(id)) return new NextResponse('Invalid Invoice ID', { status: 400 });

    const supabase = createAdminClient();
    if (!supabase) return new NextResponse('Database unavailable', { status: 503 });

    const [org, invoiceResult] = await Promise.all([
      getOrganisationProfile(supabase),
      supabase
        .from('invoices')
        .select(`
          *,
          participant:participants(*),
          items:invoice_line_items(*)
        `)
        .eq('id', id)
        .single(),
    ]);

    const { data: invoice, error } = invoiceResult;
    if (error || !invoice) return new NextResponse('Invoice not found', { status: 404 });

    const p = invoice.participant || {};
    const items = invoice.items || [];
    const fundingType = (invoice.funding_type || p.funding_type || '').trim();
    const fundingLower = fundingType.toLowerCase();

    // Determine recipient according to funding/billing relationship
    let recipient: DocumentRecipient;
    if (fundingLower.includes('plan')) {
      recipient = {
        heading: 'Bill To (Plan Manager)',
        name: invoice.plan_manager_name || 'Registered NDIS Plan Manager',
        email: invoice.plan_manager_email || null,
        additionalInfo: 'Payment remittance on behalf of NDIS participant.',
      };
    } else if (fundingLower.includes('agency') || fundingLower.includes('ndia')) {
      recipient = {
        heading: 'Bill To (Subcontracting Payer / Nominee)',
        name: invoice.plan_manager_name || p.contact_person || p.support_coordinator_name || p.full_name || 'NDIS Plan Nominee',
        email: invoice.plan_manager_email || p.email || null,
        additionalInfo: 'NDIA-Managed participant. Opus Care delivers supports as an unregistered provider under authorized subcontracting or nominee arrangement.',
      };
    } else {
      // Self-managed or direct
      recipient = {
        heading: 'Bill To (Participant / Self-Managed)',
        name: p.full_name || 'Participant',
        email: p.email || null,
        phone: p.phone || null,
        address: p.street_address ? `${p.street_address}, ${p.suburb || ''}` : p.suburb || null,
      };
    }

    const statusTones: Record<string, 'neutral' | 'success' | 'warning' | 'info'> = {
      Draft: 'neutral',
      Ready: 'warning',
      Sent: 'info',
      Paid: 'success',
      'Partially Paid': 'warning',
      Cancelled: 'neutral',
    };

    const bodyHtml = `
      <table class="doc-table">
        <thead>
          <tr>
            <th style="width: 90px;">Date</th>
            <th style="width: 130px;">Item Code</th>
            <th>Support Description</th>
            <th style="width: 80px;">Qty / Hrs</th>
            <th style="width: 90px;">Rate</th>
            <th style="width: 100px; text-align: right;">Line Total</th>
          </tr>
        </thead>
        <tbody>
          ${items.length === 0 ? `
            <tr>
              <td colspan="6" style="text-align: center; color: #64748B; padding: 24px;">
                No line items recorded for this invoice.
              </td>
            </tr>
          ` : items.map((it: any) => `
            <tr>
              <td style="color: #64748B; white-space: nowrap;">
                ${it.service_date ? new Date(it.service_date).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
              </td>
              <td>
                <span class="item-code">${it.support_item_code || 'NDIS-CORE'}</span>
              </td>
              <td>
                <strong>${it.description}</strong>
              </td>
              <td>
                ${Number(it.quantity || 0).toFixed(2)} ${it.unit || 'hr'}
              </td>
              <td>
                $${Number(it.unit_rate || 0).toFixed(2)}
              </td>
              <td style="text-align: right; font-weight: 700; color: #0F172A;">
                $${Number(it.line_total || 0).toFixed(2)}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    const totalsHtml = `
      <div class="totals-wrapper">
        <div class="totals-card">
          <div class="totals-row">
            <span>Subtotal:</span>
            <strong>$${Number(invoice.subtotal || 0).toFixed(2)}</strong>
          </div>
          <div class="totals-row">
            <span>GST (s 38-38 GST Act - GST-Free):</span>
            <span>$0.00</span>
          </div>
          <div class="totals-row grand">
            <span>Total Amount Due:</span>
            <span>$${Number(invoice.total || 0).toFixed(2)} AUD</span>
          </div>
        </div>
      </div>
    `;

    const html = renderDocumentShell({
      pageTitle: `Tax Invoice ${invoice.invoice_reference} - ${org.tradingName}`,
      docTypeBadge: 'TAX INVOICE',
      docReference: invoice.invoice_reference,
      statusBadge: {
        label: invoice.status || 'Draft',
        tone: statusTones[invoice.status] || 'neutral',
      },
      org,
      dates: [
        {
          label: 'Invoice Date',
          value: invoice.invoice_date
            ? new Date(invoice.invoice_date).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })
            : new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }),
        },
        {
          label: 'Payment Due',
          value: invoice.due_date
            ? new Date(invoice.due_date).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })
            : '14 Days',
        },
      ],
      recipient,
      participant: {
        name: p.full_name || 'Participant',
        ndisNumber: p.ndis_number || null,
        fundingType: invoice.funding_type || p.funding_type || 'Plan Managed',
        suburb: p.suburb || null,
      },
      bodyHtml,
      totalsHtml,
      remittanceHtml: 'true',
      notesHtml: invoice.notes ? invoice.notes : undefined,
    });

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (err: any) {
    console.error('Invoice PDF error:', err);
    return new NextResponse('Internal Error: ' + err.message, { status: 500 });
  }
}
