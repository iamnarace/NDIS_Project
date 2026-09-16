import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getOrganisationProfile } from '@/lib/organisation';
import {
  hashSigningToken,
  executeExternalSigning,
  checkAndExpireInvitations,
} from '@/lib/services/agreementExecution';
import { sendAgreementExecutionCompletedEmail } from '@/lib/email';

const PRIVACY_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token: rawToken } = await params;
  if (!rawToken || rawToken.length < 32) {
    return NextResponse.json({ message: 'Invalid token' }, { status: 400, headers: PRIVACY_HEADERS });
  }

  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ message: 'Database unavailable' }, { status: 503, headers: PRIVACY_HEADERS });

  const tokenHash = hashSigningToken(rawToken);

  const { data: inv, error: invErr } = await supabase
    .from('agreement_signing_invitations')
    .select('*, agreement:agreement_records(*, template:document_templates(*), signatures:agreement_signatures(*))')
    .eq('token_hash', tokenHash)
    .single();

  if (invErr || !inv) {
    return NextResponse.json({ message: 'Agreement invitation not found or link has expired.' }, { status: 404, headers: PRIVACY_HEADERS });
  }

  if (inv.status === 'signed') {
    return NextResponse.json({
      message: 'This agreement has already been executed.',
      code: 'ALREADY_SIGNED',
      signed_at: inv.signed_at,
    }, { status: 410, headers: PRIVACY_HEADERS });
  }

  if (inv.status === 'revoked') {
    return NextResponse.json({
      message: 'This signing invitation has been revoked by the administrator. Please request a new link.',
      code: 'REVOKED',
    }, { status: 410, headers: PRIVACY_HEADERS });
  }

  if (inv.status === 'expired' || new Date() > new Date(inv.expires_at)) {
    await checkAndExpireInvitations(supabase, inv.agreement_id);
    return NextResponse.json({
      message: 'This signing invitation has expired. Please contact support@opuscare.com.au for an updated agreement.',
      code: 'EXPIRED',
    }, { status: 410, headers: PRIVACY_HEADERS });
  }

  const agreement = inv.agreement;
  if (!agreement || ['superseded', 'terminated', 'expired'].includes(agreement.status)) {
    return NextResponse.json({
      message: 'This agreement record is no longer active.',
      code: 'AGREEMENT_INACTIVE',
    }, { status: 410, headers: PRIVACY_HEADERS });
  }

  // Pure read: DO NOT mutate viewed_at here to avoid email scanner bots triggering false view events.
  const snapshot = inv.document_snapshot || {};
  const org = await getOrganisationProfile(supabase);

  return NextResponse.json({
    ok: true,
    invitation: {
      id: inv.id,
      recipient_name: inv.recipient_name,
      recipient_email: inv.recipient_email,
      party_role: inv.party_role,
      status: inv.status,
      expires_at: inv.expires_at,
    },
    agreement: {
      id: agreement.id,
      agreement_reference: agreement.agreement_reference,
      title: agreement.title,
      owner_type: agreement.owner_type,
      commencement_date: agreement.commencement_date,
      review_date: agreement.review_date,
      expiry_date: agreement.expiry_date,
      questionnaire_data: snapshot.questionnaire_data || agreement.questionnaire_data,
      compiled_clauses: snapshot.compiled_clauses || agreement.compiled_clauses,
      template: agreement.template,
    },
    provider_signed: (agreement.signatures || []).some((s: any) => s.party_role === 'provider_rep'),
    org: {
      tradingName: org.tradingName,
      abn: org.abn,
      supportEmail: org.supportEmail,
    },
  }, { headers: PRIVACY_HEADERS });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token: rawToken } = await params;
  if (!rawToken || rawToken.length < 32) {
    return NextResponse.json({ message: 'Invalid token' }, { status: 400, headers: PRIVACY_HEADERS });
  }

  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ message: 'Database unavailable' }, { status: 503, headers: PRIVACY_HEADERS });

  try {
    const body = await req.json();
    const { signer_name, signer_title, signature_image_data, legal_intent_accepted } = body;

    // Neutral legal intent checkbox is mandatory
    if (!legal_intent_accepted) {
      return NextResponse.json({
        message: 'You must confirm your identity and consent to signing this agreement electronically.',
      }, { status: 400, headers: PRIVACY_HEADERS });
    }

    if (!signer_name || !signer_name.trim()) {
      return NextResponse.json({ message: 'Full legal name is required.' }, { status: 400, headers: PRIVACY_HEADERS });
    }

    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null;
    const userAgent = req.headers.get('user-agent') || null;
    const org = await getOrganisationProfile(supabase);

    const result = await executeExternalSigning(supabase, {
      rawToken,
      signerName: signer_name.trim(),
      signerTitle: signer_title || 'Recipient',
      signatureImageData: signature_image_data,
      ipAddress,
      userAgent,
      org,
    });

    if (!result.ok) {
      return NextResponse.json({
        message: result.error || 'Agreement execution could not be finalized.',
        code: result.code,
      }, { status: 400, headers: PRIVACY_HEADERS });
    }

    // If fully signed, send execution confirmation email asynchronously
    if (result.is_fully_signed) {
      // Fetch recipient email from invitation
      const tokenHash = hashSigningToken(rawToken);
      const { data: inv } = await supabase
        .from('agreement_signing_invitations')
        .select('recipient_email, recipient_name, agreement:agreement_records(title, agreement_reference)')
        .eq('token_hash', tokenHash)
        .single();

      if (inv) {
        sendAgreementExecutionCompletedEmail({
          recipientName: inv.recipient_name,
          recipientEmail: inv.recipient_email,
          agreementTitle: (inv.agreement as any)?.title || 'Support Agreement',
          agreementReference: (inv.agreement as any)?.agreement_reference || 'AGR',
          executedAt: new Date().toISOString(),
        }).catch((err) => console.warn('Execution notification notice:', err?.message));
      }
    }

    return NextResponse.json({
      ok: true,
      is_fully_signed: result.is_fully_signed,
      agreement_reference: result.agreement_reference,
    }, { headers: PRIVACY_HEADERS });

  } catch (err: any) {
    return NextResponse.json({ message: err?.message || 'Server error' }, { status: 500, headers: PRIVACY_HEADERS });
  }
}
