import { userFacingError } from '@/lib/userFacingError';
import { NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import { isValidUuid } from '@/lib/uuid';
import { getOrganisationProfile } from '@/lib/organisation';
import { executeProviderSigning, validateSignatureImageData } from '@/lib/services/agreementExecution';
import {
  generateAuthoritativeExecutedBytes,
  uploadExecutedDocument,
  cleanupUploadedExecutedDocument,
} from '@/lib/services/agreementPdf';

async function supersedePriorAgreement(supabase: any, agreement: any, agreementId: string) {
  const priorAgreementId = agreement?.compiled_clauses?.variation_of_agreement_id;
  if (!priorAgreementId || !isValidUuid(priorAgreementId)) return null;
  const { error } = await supabase
    .from('agreement_records')
    .update({
      status: 'superseded',
      superseded_by_id: agreementId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', priorAgreementId)
    .in('status', ['active', 'fully_signed']);
  return error;
}

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

    // Route provider rep signature through shared provider execution service
    if (party_role === 'provider_rep') {
      const result = await executeProviderSigning(supabase, {
        agreementId: agreement_id,
        signerName: signer_name,
        signerTitle: signer_title || 'Managing Director, Opus Care Support Services',
        signerEmail: signer_email || org.supportEmail || 'support@opuscare.com.au',
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

    // Recipient signature (internal / in-person mode)
    const { data: existingSignature, error: existingSignatureError } = await supabase
      .from('agreement_signatures')
      .select('*')
      .eq('agreement_id', agreement_id)
      .eq('party_role', party_role)
      .limit(1)
      .maybeSingle();
    if (existingSignatureError) {
      return NextResponse.json({ message: userFacingError(existingSignatureError.message) }, { status: 500 });
    }

    let sig = existingSignature;
    if (!sig) {
      const { data: insertedSignature, error: sigErr } = await supabase
        .from('agreement_signatures')
        .insert({
          agreement_id,
          party_role,
          signer_name,
          signer_title,
          signer_email,
          signing_method,
          signature_image_data,
          ip_address: ipAddress,
          user_agent: userAgent,
          signed_at: new Date().toISOString(),
          is_verified: true, // In-person admin recorded signature
        })
        .select()
        .single();

      if (sigErr) return NextResponse.json({ message: userFacingError(sigErr.message) }, { status: 500 });
      sig = insertedSignature;
    }

    // Check all signatures on this agreement
    const { data: allSigs } = await supabase
      .from('agreement_signatures')
      .select('*')
      .eq('agreement_id', agreement_id);

    const hasParticipantOrWorker = (allSigs || []).some((s: any) =>
      ['participant', 'guardian', 'worker', 'contractor'].includes(s.party_role)
    );
    const hasProvider = (allSigs || []).some((s: any) => s.party_role === 'provider_rep');

    const { data: currentAgreement, error: currentAgreementError } = await supabase
      .from('agreement_records')
      .select('*, template:document_templates(*), signatures:agreement_signatures(*)')
      .eq('id', agreement_id)
      .single();

    if (currentAgreementError || !currentAgreement) {
      return NextResponse.json({ message: userFacingError(currentAgreementError?.message || 'Agreement not found.') }, { status: 500 });
    }

    if (hasParticipantOrWorker && hasProvider && ['active', 'fully_signed'].includes(currentAgreement.status)) {
      await supersedePriorAgreement(supabase, currentAgreement, agreement_id);
      return NextResponse.json({ ok: true, signature: sig, agreement: currentAgreement, is_fully_signed: true });
    }

    let newStatus = 'partially_signed';
    let executedAt: string | null = null;
    let executedPdfPath: string | null = null;
    let executedHash: string | null = null;

    if (hasParticipantOrWorker && hasProvider) {
      newStatus = 'active';
      executedAt = new Date().toISOString();

      // Generate authoritative executed document bytes & hash
      const pdfBytes = generateAuthoritativeExecutedBytes({
        agreement: currentAgreement,
        signatures: allSigs || [],
        org,
      });
      const uploadRes = await uploadExecutedDocument(supabase, currentAgreement.agreement_reference, pdfBytes);
      executedPdfPath = uploadRes.path;
      executedHash = uploadRes.hash;
    }

    const updatePayload: Record<string, any> = {
      status: newStatus,
      updated_at: new Date().toISOString()
    };
    if (executedAt) updatePayload.executed_at = executedAt;
    if (executedHash) updatePayload.executed_hash_sha256 = executedHash;
    if (executedPdfPath) updatePayload.executed_pdf_path = executedPdfPath;

    try {
      const { data: updatedAgreement, error: updateErr } = await supabase
        .from('agreement_records')
        .update(updatePayload)
        .eq('id', agreement_id)
        .select('*, template:document_templates(*), signatures:agreement_signatures(*)')
        .single();

      if (updateErr) {
        if (executedPdfPath) {
          await cleanupUploadedExecutedDocument(supabase, executedPdfPath);
        }
        return NextResponse.json({ message: userFacingError(updateErr.message) }, { status: 500 });
      }

      if (newStatus === 'active') {
        await supersedePriorAgreement(supabase, updatedAgreement, agreement_id);
      }

      return NextResponse.json({
        ok: true,
        signature: sig,
        agreement: updatedAgreement,
        is_fully_signed: newStatus === 'active'
      });
    } catch (err: any) {
      if (executedPdfPath) {
        await cleanupUploadedExecutedDocument(supabase, executedPdfPath);
      }
      throw err;
    }

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
