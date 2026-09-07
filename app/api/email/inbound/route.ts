import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { Resend, type ListAttachmentsResponseSuccess } from 'resend';

export const runtime = 'nodejs';

const resendApiKey = process.env.RESEND_API_KEY;
const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
const forwardTo = process.env.INBOUND_FORWARD_TO || 'ausplaitv@gmail.com';
const forwardFrom =
  process.env.INBOUND_FORWARD_FROM || 'Opus Care Mail <support@opuscare.com.au>';

const resend = resendApiKey ? new Resend(resendApiKey) : null;

const allowedRecipients = new Set([
  'support@opuscare.com.au',
  'hello@opuscare.com.au',
  'referrals@opuscare.com.au',
  'contact@opuscare.com.au',
]);

function normaliseAddress(address: string) {
  const match = address.match(/<([^>]+)>/);
  return (match?.[1] || address).trim().toLowerCase();
}

export async function POST(req: NextRequest) {
  if (!resend || !webhookSecret) {
    console.error('Inbound email webhook is not configured.');
    return new NextResponse('Inbound email webhook is not configured.', {
      status: 503,
    });
  }

  try {
    // Resend webhook verification must use the raw request body.
    const payload = await req.text();
    const id = req.headers.get('svix-id');
    const timestamp = req.headers.get('svix-timestamp');
    const signature = req.headers.get('svix-signature');

    if (!id || !timestamp || !signature) {
      return new NextResponse('Missing webhook signature headers.', {
        status: 400,
      });
    }

    const event = resend.webhooks.verify({
      payload,
      headers: {
        id,
        timestamp,
        signature,
      },
      webhookSecret,
    });

    if (event.type !== 'email.received') {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const inboundRecipients = event.data.to.map(normaliseAddress);
    const acceptedRecipient = inboundRecipients.find((recipient) =>
      allowedRecipients.has(recipient),
    );

    // Do not forward messages sent to unexpected aliases.
    if (!acceptedRecipient) {
      console.warn('Inbound email ignored for unexpected recipient.', {
        recipients: inboundRecipients,
      });
      return NextResponse.json({ ok: true, ignored: true });
    }

    const { data: email, error: emailError } =
      await resend.emails.receiving.get(event.data.email_id);

    if (emailError || !email) {
      throw new Error(
        `Failed to retrieve inbound email: ${emailError?.message || 'Unknown error'}`,
      );
    }

    const { data: attachmentsData, error: attachmentsError } =
      await resend.emails.receiving.attachments.list({
        emailId: event.data.email_id,
      });

    if (attachmentsError) {
      throw new Error(
        `Failed to retrieve inbound attachments: ${attachmentsError.message}`,
      );
    }

    const attachmentMetadata =
      attachmentsData?.data as
        | (ListAttachmentsResponseSuccess['data'] & { content?: string }[])
        | undefined;

    const attachments = [] as Array<{
      filename: string;
      content: string;
      contentType?: string;
      contentId?: string;
    }>;

    if (attachmentMetadata?.length) {
      for (const attachment of attachmentMetadata) {
        const response = await fetch(attachment.download_url);

        if (!response.ok) {
          throw new Error(
            `Failed to download attachment ${attachment.filename || 'attachment'}: ${response.status}`,
          );
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        attachments.push({
          filename: attachment.filename || 'attachment',
          content: buffer.toString('base64'),
          contentType: attachment.content_type,
          contentId: attachment.content_id || undefined,
        });
      }
    }

    const originalSubject = event.data.subject?.trim() || '(no subject)';
    const subject = originalSubject.toLowerCase().startsWith('fwd:')
      ? originalSubject
      : `Fwd: ${originalSubject}`;

    const { data: forwarded, error: sendError } = await resend.emails.send({
      from: forwardFrom,
      to: [forwardTo],
      replyTo: email.from,
      subject,
      html: email.html || undefined,
      text: email.text || undefined,
      attachments: attachments.length ? attachments : undefined,
      headers: {
        'X-OpusCare-Original-To': acceptedRecipient,
        'X-OpusCare-Inbound-Email-Id': event.data.email_id,
      },
    });

    if (sendError) {
      throw new Error(`Failed to forward inbound email: ${sendError.message}`);
    }

    return NextResponse.json({
      ok: true,
      forwarded: true,
      id: forwarded?.id,
    });
  } catch (error) {
    console.error('Inbound email webhook failed.', error);
    return new NextResponse('Invalid webhook or forwarding failure.', {
      status: 400,
    });
  }
}
