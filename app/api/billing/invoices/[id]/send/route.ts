import { userFacingError } from '@/lib/userFacingError';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { isValidUuid } from '@/lib/uuid';
import { Resend } from 'resend';
import { logAuditEvent } from '@/lib/audit';
import { getOrganisationProfile } from '@/lib/organisation';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

    const { id } = await params;
    if (!id || !isValidUuid(id)) return NextResponse.json({ error: 'Invalid Invoice ID' }, { status: 400 });

    const supabase = createAdminClient();
    if (!supabase) return NextResponse.json({ error: "We couldn't complete this action. Please refresh and try again." }, { status: 503 });

    // Enforce organisation configuration safety safeguards
    const org = await getOrganisationProfile(supabase);
    if (!org.isAbnConfigured || !org.isBankConfigured) {
      return NextResponse.json(
        {
          error: 'Cannot dispatch invoice: Organisation profile is incomplete (genuine ABN and banking remittance details must be configured in Settings before issuing invoices).',
        },
        { status: 422 }
      );
    }

    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        participant:participants(*)
      `)
      .eq('id', id)
      .single();

    if (error || !invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

    const p = invoice.participant;
    const isPlanManaged = (invoice.funding_type || p?.funding_type || '').toLowerCase().includes('plan');

    // Recipient email: send to plan manager if plan-managed, else participant email
    const recipientEmail = isPlanManaged && invoice.plan_manager_email
      ? invoice.plan_manager_email
      : (p?.email || invoice.plan_manager_email);

    if (!recipientEmail) {
      return NextResponse.json({ error: 'No billing email address recorded for participant or plan manager.' }, { status: 400 });
    }

    const docType = org.canIssueTaxInvoice ? 'Tax Invoice' : 'Invoice';

    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        await resend.emails.send({
          from: `${org.tradingName} Accounts <${org.billingEmail}>`,
          to: [recipientEmail],
          subject: `${docType} ${invoice.invoice_reference} - ${org.tradingName}`,
          html: `
            <div style="font-family: sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; line-height: 1.6;">
              <h2 style="color: #0f766e;">${org.tradingName}</h2>
              <p>Dear ${isPlanManaged && invoice.plan_manager_name ? invoice.plan_manager_name : (p?.full_name || 'Participant')},</p>
              <p>Please find attached details of ${docType} <strong>${invoice.invoice_reference}</strong> for support services delivered to <strong>${p?.full_name || 'Participant'}</strong> (NDIS: ${p?.ndis_number || 'N/A'}).</p>
              
              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="margin: 4px 0;"><strong>Invoice Reference:</strong> ${invoice.invoice_reference}</p>
                <p style="margin: 4px 0;"><strong>Invoice Date:</strong> ${new Date(invoice.invoice_date).toLocaleDateString('en-AU')}</p>
                <p style="margin: 4px 0;"><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString('en-AU')}</p>
                <p style="margin: 4px 0; font-size: 16px; color: #15803d;"><strong>Total Due:</strong> $${Number(invoice.total).toFixed(2)} AUD</p>
              </div>

              <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 14px; margin: 20px 0; font-size: 13px;">
                <strong>EFT Direct Deposit:</strong><br>
                Bank: ${org.bankName || 'Direct Deposit'}<br>
                Account Name: ${org.legalName}<br>
                BSB: ${org.bankBsb} | Account: ${org.bankAccountNumber}<br>
                Reference: <strong>${invoice.invoice_reference}</strong>
              </div>

              <p style="margin-top: 30px; font-size: 12px; color: #64748b;">
                ${org.tradingName}${org.abn ? ` &bull; ABN: ${org.abn}` : ''} &bull; ${org.billingEmail}${org.phone ? ` &bull; ${org.phone}` : ''}
              </p>
            </div>
          `,
        });
      } catch (mailErr: any) {
        console.warn('Resend mail dispatch notice:', mailErr.message);
      }
    }

    // Update status to 'Sent'
    await supabase
      .from('invoices')
      .update({ status: 'Sent', updated_at: new Date().toISOString() })
      .eq('id', id);

    await logAuditEvent({
      entity_type: 'invoices',
      entity_id: id,
      actor_type: 'admin',
      actor_id: 'admin',
      action: 'invoice_sent',
      metadata: { recipient: recipientEmail },
    });

    return NextResponse.json({ success: true, message: `Invoice sent to ${recipientEmail}` });
  } catch (err: any) {
    console.error('POST /api/billing/invoices/[id]/send error:', err);
    return NextResponse.json({ error: userFacingError(err.message || 'Internal server error') }, { status: 500 });
  }
}
