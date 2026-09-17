import { userFacingError } from '@/lib/userFacingError';
import { NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import { isValidUuid } from '@/lib/uuid';
import { getOrganisationProfile } from '@/lib/organisation';
import { ADMIN_EMAIL } from '@/lib/emailAddresses';
import {
  executeProviderSigning,
  executeInternalRecipientSigning,
  validateSignatureImageData,
} from '@/lib/services/agreementExecution';

export async function POST(req: Request) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ message: "We couldn't complete this action. Please refresh and try again." }, { status: 503 });

  try {
    const body = await req.json();
    let {
      agreement_id,
      party_role,
      signer_name,
      signer_title = '',
      signer_email = '',
      signing_method = 'digital_canvas',
      signature_image_data = null,
    } = body;

    if (!agreement_id || !party_role || !signer_name) {
      return NextResponse.json({ message: 'agreement_id, party_role, and signer_name are required' }, { status: 400 });
    }
    if (!['participant', 'guardian', 'worker', 'contractor', 'provider_rep'].includes(party_role)) {
      return NextResponse.json({ message: 'The selected signing role is invalid.' }, { status: 400 });
    }

    if (signature_image_data) {
      const val = validateSignatureImageData(signature_image_data);
      if (!val.ok) {
        return NextResponse.json({ message: val.error }, { status: 400 });
      }
    }

    // Governance G0.1 Hard Guard: Cannot sign or execute binding legal agreements without configured proprietor legal name
    const org = await getOrganisationProfile(supabase);
    if (!org.proprietorLegalName || !org.proprietorLegalName.trim()) {
      return NextResponse.json({
        message: 'Complete the legal contracting identity in Organisation Settings before executing this agreement.'
      }, { status: 400 });
    }

    // Defensive resolution if agreement_reference passed
    if (!isValidUuid(agreement_id)) {
      const { data: byRef } = await supabase
        .from('agreement_records')
        .select('id')
        .eq('agreement_reference', String(agreement_id).trim())
        .maybeSingle();

      if (byRef?.id) {
        agreement_id = byRef.id;
      } else {
        return NextResponse.json({ message: "We couldn't complete this action. Please refresh and try again." }, { status: 400 });
      }
    }

    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null;
    const userAgent = req.headers.get('user-agent') || null;

    // Route provider rep signature through shared provider execution service (idempotent)
    if (party_role === 'provider_rep') {
      const result = await executeProviderSigning(supabase, {
        agreementId: agreement_id,
        signerName: signer_name,
        signerTitle: signer_title || 'Managing Director, Opus Care Support Services',
        signerEmail: signer_email || ADMIN_EMAIL,
        signatureImageData: signature_image_data,
        signingMethod: signing_method,
        ipAddress,
        userAgent,
        org,
      });

      if (!result.ok) {
        return NextResponse.json({ message: result.error || 'Provider execution failed.' }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        agreement: result.agreement,
        is_fully_signed: result.is_fully_signed,
      });
    }

    // Route internal recipient signature through shared atomic execution service
    const result = await executeInternalRecipientSigning(supabase, {
      agreementId: agreement_id,
      partyRole: party_role,
      signerName: signer_name,
      signerTitle: signer_title || (party_role === 'worker' ? 'Support Worker' : 'Participant'),
      signerEmail: signer_email,
      signatureImageData: signature_image_data,
      signingMethod: signing_method,
      ipAddress,
      userAgent,
      org,
    });

    if (!result.ok) {
      return NextResponse.json({ message: result.error || 'Internal recipient signing failed.' }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      agreement: result.agreement,
      is_fully_signed: result.is_fully_signed,
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ message: userFacingError(msg) }, { status: 500 });
  }
}
