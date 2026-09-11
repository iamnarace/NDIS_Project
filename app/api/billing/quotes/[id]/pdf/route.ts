import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isValidUuid } from '@/lib/uuid';
import { getOrganisationProfile } from '@/lib/organisation';
import { renderDocumentShell } from '@/lib/documents/documentTemplate';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id || !isValidUuid(id)) {
      return new NextResponse('Invalid Quote ID', { status: 400 });
    }

    const supabase = createAdminClient();
    if (!supabase) return new NextResponse('Database unavailable', { status: 503 });

    const [org, quoteResult] = await Promise.all([
      getOrganisationProfile(supabase),
      supabase
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
        .single(),
    ]);

    const { data: quote, error } = quoteResult;
    if (error || !quote) return new NextResponse('Quote not found', { status: 404 });

    const p = quote.participant || {};
    const items = quote.items || [];

    const statusTones: Record<string, 'neutral' | 'success' | 'warning' | 'info'> = {
      Draft: 'neutral',
      Sent: 'info',
      Accepted: 'success',
      Declined: 'warning',
      Expired: 'neutral',
      Converted: 'success',
    };

    const totalWeeks = items.reduce((max: number, it: any) => Math.max(max, Number(it.estimated_weeks || 52)), 52);
    const weeklyTotal = totalWeeks > 0 ? Number(quote.total || 0) / totalWeeks : 0;
    const monthlyTotal = weeklyTotal * 4.33;

    const bodyHtml = `
      <table class="doc-table">
        <thead>
          <tr>
            <th>Support Description &amp; NDIS Classification</th>
            <th style="width: 140px;">Item Code</th>
            <th style="width: 100px;">Agreed Rate</th>
            <th style="width: 80px;">Hrs / Wk</th>
            <th style="width: 70px;">Weeks</th>
            <th style="width: 100px; text-align: right;">Total Budget</th>
          </tr>
        </thead>
        <tbody>
          ${items.length === 0 ? `
            <tr>
              <td colspan="6" style="text-align: center; color: #64748B; padding: 24px;">
                No support items configured for this quote.
              </td>
            </tr>
          ` : items.map((it: any) => `
            <tr>
              <td>
                <strong>${it.description}</strong>
                ${it.support_item?.support_item_name ? `<div style="font-size: 11.5px; color: #64748B; margin-top: 2px;">${it.support_item.support_item_name}</div>` : ''}
              </td>
              <td>
                <span class="item-code">${it.support_item?.support_item_code || 'NDIS-ITEM'}</span>
              </td>
              <td>
                $${Number(it.unit_rate || 0).toFixed(2)} / ${it.unit || 'hr'}
              </td>
              <td>
                ${Number(it.quantity || 0).toFixed(1)} ${it.unit || 'hr'}
              </td>
              <td>
                ${it.estimated_weeks || 52}
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
        <div class="totals-card" style="background: #F0FDFA; border-color: #99F6E4;">
          <div class="totals-row">
            <span>Weekly Allocation:</span>
            <strong>$${weeklyTotal.toFixed(2)} / wk</strong>
          </div>
          <div class="totals-row">
            <span>Monthly Estimate:</span>
            <strong>$${monthlyTotal.toFixed(2)} / mo</strong>
          </div>
          <div class="totals-row">
            <span>GST (Eligible NDIS Supports):</span>
            <span>$0.00</span>
          </div>
          <div class="totals-row grand" style="border-top-color: #5EEAD4; color: #0F766E;">
            <span>Total Quote Value:</span>
            <span>$${Number(quote.total || 0).toFixed(2)} AUD</span>
          </div>
        </div>
      </div>
    `;

    const html = renderDocumentShell({
      pageTitle: `Service Quote ${quote.quote_reference} - ${org.tradingName}`,
      docTypeBadge: 'SERVICE ESTIMATE & QUOTE',
      docReference: quote.quote_reference,
      statusBadge: {
        label: quote.status || 'Draft',
        tone: statusTones[quote.status] || 'neutral',
      },
      org,
      dates: [
        {
          label: 'Quote Date',
          value: quote.created_at
            ? new Date(quote.created_at).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })
            : new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }),
        },
        {
          label: 'Valid Until',
          value: quote.valid_until
            ? new Date(quote.valid_until).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })
            : '30 Days from issue',
        },
      ],
      recipient: {
        heading: 'Quote Prepared For',
        name: p.full_name || 'Participant / Representative',
        email: p.email || null,
        phone: p.phone || null,
        address: p.street_address ? `${p.street_address}, ${p.suburb || ''}` : p.suburb || null,
        additionalInfo: 'Rates based on current NDIS Price Limits. Valid for 30 days.',
      },
      participant: {
        name: p.full_name || 'Participant',
        ndisNumber: p.ndis_number || null,
        fundingType: p.funding_type || 'Plan Managed',
        suburb: p.suburb || null,
      },
      bodyHtml,
      totalsHtml,
      notesHtml: quote.notes ? quote.notes : undefined,
      footerNote: 'This estimate is prepared based on current NDIS Pricing Arrangements and Price Limits. Acceptance converts this quote directly into an active Schedule of Supports or Service Agreement.',
    });

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (err: any) {
    console.error('Quote PDF error:', err);
    return new NextResponse('Internal Error: ' + err.message, { status: 500 });
  }
}
