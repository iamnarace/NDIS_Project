import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { isValidUuid } from '@/lib/uuid';
import { getOrganisationProfile } from '@/lib/organisation';
import { renderDocumentShell, DocumentRecipient } from '@/lib/documents/documentTemplate';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id || !isValidUuid(id)) return new NextResponse('Invalid Invoice ID', { status: 400 });

    const isAdmin = await isAuthenticatedAdmin(request);
    let supabase: any = null;
    let portalParticipantId: string | null = null;

    if (isAdmin) {
      supabase = createAdminClient();
    } else {
      supabase = await createClient();
      if (!supabase) return new NextResponse('Unauthorized: Authentication required', { status: 401 });
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return new NextResponse('Unauthorized: Authentication required', { status: 401 });
      const { data: profile } = await supabase
        .from('profiles')
        .select('portal_participant_id')
        .eq('id', user.id)
        .single();
      portalParticipantId = profile?.portal_participant_id || null;
      if (!portalParticipantId) return new NextResponse('Unauthorized', { status: 401 });
    }

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

    if (!isAdmin && portalParticipantId && invoice.participant_id !== portalParticipantId) {
      return new NextResponse('Forbidden: Access denied', { status: 403 });
    }

    const p = invoice.participant || {};
    const items = invoice.items || [];
    const fundingType = (invoice.funding_type || p.funding_type || '').trim();
    const fundingLower = fundingType.toLowerCase();

    // Determine recipient according to actual CRM billing relationship
    let recipient: DocumentRecipient;
    if (fundingLower.includes('plan')) {
      recipient = {
        heading: 'Bill To (Plan Manager)',
        name: invoice.plan_manager_name || 'Registered NDIS Plan Manager',
        email: invoice.plan_manager_email || null,
        additionalInfo: 'Payment remittance on behalf of NDIS participant.',
      };
    } else if (fundingLower.includes('agency') || fundingLower.includes('ndia')) {
      const contractingName = invoice.plan_manager_name?.trim() || null;
      const contractingEmail = invoice.plan_manager_email?.trim() || null;

      if (contractingName) {
        recipient = {
          heading: 'Bill To (Designated Contracting Payer)',
          name: contractingName,
          email: contractingEmail || null,
          additionalInfo: 'Participant has NDIA-managed funding. Invoiced to designated contracting party recorded in billing profile.',
        };
      } else {
        recipient = {
          heading: 'Bill To (Billing Configuration Required)',
          name: '[Registered Contracting Provider Required]',
          email: null,
          additionalInfo: 'Participant has NDIA-managed funding. Opus Care operates as an unregistered NDIS provider and cannot claim directly from the NDIA. A registered contracting provider or authorized payer must be configured before issuing this invoice.',
        };
      }
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

    // Accurate GST representation based on actual invoice data and supplier registration
    const gstAmount = Number(invoice.gst || 0);
    let gstLabel = 'GST:';
    let gstValueDisplay = `$${gstAmount.toFixed(2)}`;
    let gstNoticeHtml = '';

    if (gstAmount === 0) {
      if (org.gstStatus === 'not_registered') {
        gstLabel = 'GST:';
        gstValueDisplay = '$0.00';
        gstNoticeHtml = '<div style="font-size: 11px; color: #64748B; margin-top: 4px; line-height: 1.35;">GST has not been charged – supplier is not registered for GST.</div>';
      } else if (org.gstStatus === 'registered') {
        gstLabel = 'GST:';
        gstValueDisplay = '$0.00 (GST-Free)';
      } else {
        gstLabel = 'GST:';
        gstValueDisplay = '$0.00 (Tax status unconfigured)';
      }
    } else {
      gstLabel = 'GST:';
      gstValueDisplay = `$${gstAmount.toFixed(2)}`;
    }

    const totalsHtml = `
      <div class="totals-wrapper">
        <div class="totals-card">
          <div class="totals-row">
            <span>Subtotal:</span>
            <strong>$${Number(invoice.subtotal || 0).toFixed(2)}</strong>
          </div>
          <div class="totals-row">
            <span>${gstLabel}</span>
            <span>${gstValueDisplay}</span>
          </div>
          ${gstNoticeHtml}
          <div class="totals-row grand">
            <span>Total Amount Due:</span>
            <span>$${Number(invoice.total || 0).toFixed(2)} AUD</span>
          </div>
        </div>
      </div>
    `;

    const docTypeBadge = org.canIssueTaxInvoice ? 'TAX INVOICE' : 'INVOICE';
    const pageTitle = `${org.canIssueTaxInvoice ? 'Tax Invoice' : 'Invoice'} ${invoice.invoice_reference} - ${org.tradingName}`;

    const html = renderDocumentShell({
      pageTitle,
      docTypeBadge,
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
