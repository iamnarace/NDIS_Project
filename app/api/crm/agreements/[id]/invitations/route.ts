import { NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import { getOrganisationProfile } from '@/lib/organisation';
import {
  createSigningInvitation,
  revokeSigningInvitation,
  executeProviderSigning,
  checkAndExpireInvitations,
} from '@/lib/services/agreementExecution';
import { sendAgreementSigningInvitationEmail } from '@/lib/email';
import { ADMIN_EMAIL } from '@/lib/emailAddresses';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ message: 'Database unavailable' }, { status: 503 });

  const { id: agreementId } = await params;
  if (!agreementId) return NextResponse.json({ message: 'Agreement ID is required' }, { status: 400 });

  // Run expiry sweep on invitations past expires_at
  await checkAndExpireInvitations(supabase, agreementId);

  const { data: invitations, error } = await supabase
    .from('agreement_signing_invitations')
    .select('*')
    .eq('agreement_id', agreementId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, invitations: invitations || [] });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ message: 'Database unavailable' }, { status: 503 });

  const { id: agreementId } = await params;
  if (!agreementId) return NextResponse.json({ message: 'Agreement ID is required' }, { status: 400 });

  try {
    const body = await req.json();
    const {
      party_role = 'worker',
      recipient_name,
      recipient_email,
      sign_as_provider = false,
      provider_signer_name,
      provider_signature_data,
    } = body;

    if (!recipient_name || !recipient_email) {
      return NextResponse.json({ message: 'Recipient name and email are required.' }, { status: 400 });
    }

    const org = await getOrganisationProfile(supabase);
    if (!org.proprietorLegalName || !org.proprietorLegalName.trim()) {
      return NextResponse.json({
        message: 'Complete the legal contracting identity in Organisation Settings before issuing an agreement invitation.'
      }, { status: 400 });
    }

    // 1. Provider Pre-Signing (Idempotent: Reuse existing provider signature if already on file)
    if (sign_as_provider) {
      const { data: existingProvSig } = await supabase
        .from('agreement_signatures')
        .select('id')
        .eq('agreement_id', agreementId)
        .eq('party_role', 'provider_rep')
        .maybeSingle();

      if (!existingProvSig) {
        if (!provider_signature_data) {
          return NextResponse.json({
            message: 'Provider signature is required when selecting "Sign as Provider & Send".'
          }, { status: 400 });
        }

        const provResult = await executeProviderSigning(supabase, {
          agreementId,
          signerName: provider_signer_name || 'Naresh Admin',
          signerTitle: 'Managing Director, Opus Care Support Services',
          signerEmail: ADMIN_EMAIL,
          signatureImageData: provider_signature_data,
          signingMethod: 'digital_canvas',
          org,
        });

        if (!provResult.ok) {
          return NextResponse.json({ message: provResult.error || 'Failed to record provider signature.' }, { status: 500 });
        }
      }
    }

    // 2. Create signing invitation with expanded frozen snapshot
    const invResult = await createSigningInvitation(supabase, {
      agreementId,
      partyRole: party_role,
      recipientName: recipient_name,
      recipientEmail: recipient_email,
      createdBy: 'Admin',
      org,
    });

    if (!invResult.ok || !invResult.rawToken || !invResult.invitation) {
      return NextResponse.json({ message: invResult.error || 'Could not create invitation.' }, { status: 500 });
    }

    const { rawToken, invitation } = invResult;

    // 3. Determine baseUrl for email signing link
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://opuscare.com.au';
    const signingUrl = `${origin}/contracts/sign/${rawToken}`;

    // 4. Fetch agreement reference and title
    const { data: agr } = await supabase
      .from('agreement_records')
      .select('agreement_reference, title')
      .eq('id', agreementId)
      .single();

    // 5. Send email via Resend
    const mailResult = await sendAgreementSigningInvitationEmail({
      recipientName: recipient_name,
      recipientEmail: recipient_email,
      agreementTitle: agr?.title || 'Support Agreement',
      agreementReference: agr?.agreement_reference || 'AGR',
      signingUrl,
      expiresAt: invitation.expires_at,
      providerTradingName: org.tradingName,
    });

    if (!mailResult.ok) {
      // Record delivery failure strictly
      await supabase
        .from('agreement_signing_invitations')
        .update({
          delivery_status: 'failed',
          delivery_error: mailResult.error || 'Email dispatch failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', invitation.id);

      return NextResponse.json({
        ok: false,
        delivery_failed: true,
        message: `Invitation generated, but email delivery failed: ${mailResult.error}. Use 'Retry Send' to attempt dispatch again.`,
        invitation_id: invitation.id,
      }, { status: 502 });
    }

    // 6. Record successful delivery
    const deliveryStatus = (mailResult as any).simulated ? 'simulated' : 'sent';
    await supabase
      .from('agreement_signing_invitations')
      .update({
        delivery_status: deliveryStatus,
        sent_at: new Date().toISOString(),
        resend_message_id: (mailResult as any).messageId || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invitation.id);

    const isDev = process.env.NODE_ENV !== 'production' || Boolean((mailResult as any).simulated);

    return NextResponse.json({
      ok: true,
      invitation_id: invitation.id,
      delivery_status: deliveryStatus,
      signing_url_preview: isDev ? signingUrl : undefined,
    });

  } catch (err: any) {
    return NextResponse.json({ message: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ message: 'Database unavailable' }, { status: 503 });

  try {
    const { searchParams } = new URL(req.url);
    const invitationId = searchParams.get('invitation_id');
    if (!invitationId) return NextResponse.json({ message: 'invitation_id is required' }, { status: 400 });

    const result = await revokeSigningInvitation(supabase, invitationId, 'Admin', 'Revoked by administrator');
    if (!result.ok) {
      return NextResponse.json({ message: result.error || 'Failed to revoke invitation' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, revoked_id: invitationId });
  } catch (err: any) {
    return NextResponse.json({ message: err?.message || 'Server error' }, { status: 500 });
  }
}
