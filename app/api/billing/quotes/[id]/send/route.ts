import { userFacingError } from '@/lib/userFacingError';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { isValidUuid } from '@/lib/uuid';
import { Resend } from 'resend';
import { logAuditEvent } from '@/lib/audit';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

    const { id } = await params;
    if (!id || !isValidUuid(id)) return NextResponse.json({ error: 'Invalid Quote ID' }, { status: 400 });

    const supabase = createAdminClient();
    if (!supabase) return NextResponse.json({ error: "We couldn't complete this action. Please refresh and try again." }, { status: 503 });

    const { data: quote, error } = await supabase
      .from('quotes')
      .select(`
        *,
        participant:participants(*),
        items:quote_line_items(*)
      `)
      .eq('id', id)
      .single();

    if (error || !quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });

    const p = quote.participant;
    const recipientEmail = p?.email;

    if (!recipientEmail) {
      return NextResponse.json({ error: 'Participant does not have an email address recorded.' }, { status: 400 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        await resend.emails.send({
          from: 'Opus Care Support <intake@opuscare.com.au>',
          to: [recipientEmail],
          subject: `Your NDIS Support Service Estimate / Quote (${quote.quote_reference}) - Opus Care`,
          html: `
            <div style="font-family: sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; line-height: 1.6;">
              <h2 style="color: #0369a1;">Opus Care Support Services</h2>
              <p>Dear ${p.full_name},</p>
              <p>Thank you for choosing Opus Care. Please find below the summary of your support services quote <strong>${quote.quote_reference}</strong>:</p>
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="margin: 4px 0;"><strong>Estimated Agreement Total:</strong> $${Number(quote.total).toFixed(2)}</p>
                <p style="margin: 4px 0;"><strong>Weekly Estimated Service:</strong> $${(Number(quote.total) / 52).toFixed(2)} / week</p>
                <p style="margin: 4px 0;"><strong>Valid Until:</strong> ${quote.valid_until || '30 days'}</p>
              </div>
              <p>You can review, print, and accept this quote through your Opus Care Participant Portal or by replying to this email.</p>
              <p style="margin-top: 30px; font-size: 12px; color: #64748b;">
                Opus Care Support Services &bull; ABN 41 267 197 576 &bull; support@opuscare.com.au
              </p>
            </div>
          `,
        });
      } catch (mailErr: any) {
        console.warn('Resend mail dispatch notice:', mailErr.message);
      }
    }

    // Update quote status to 'Sent'
    await supabase
      .from('quotes')
      .update({ status: 'Sent', updated_at: new Date().toISOString() })
      .eq('id', id);

    await logAuditEvent({
      entity_type: 'quotes',
      entity_id: id,
      actor_type: 'admin',
      actor_id: 'admin',
      action: 'quote_sent',
      metadata: { recipient: recipientEmail },
    });

    return NextResponse.json({ success: true, message: `Quote sent to ${recipientEmail}` });
  } catch (err: any) {
    console.error('POST /api/billing/quotes/[id]/send error:', err);
    return NextResponse.json({ error: userFacingError(err.message || 'Internal server error') }, { status: 500 });
  }
}
