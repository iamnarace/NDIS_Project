import crypto from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  generateAuthoritativeExecutedPdf,
  calculateAuthoritativeHash,
  uploadExecutedDocument,
  cleanupUploadedExecutedDocument,
} from '@/lib/services/agreementPdf';
import { resolveAgreementClauseSchema } from '@/lib/agreements/canonicalClauses';

export const MAX_SIGNATURE_PAYLOAD_BYTES = 512 * 1024; // 512 KB

export function hashSigningToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

export function sortKeys(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sortKeys);
  return Object.keys(obj)
    .sort()
    .reduce((result: Record<string, any>, key) => {
      result[key] = sortKeys(obj[key]);
      return result;
    }, {});
}

export function createDocumentSnapshot(agreement: any, org?: any): { snapshot: Record<string, any>; hash: string } {
  const templateCode = agreement.template?.template_code || 'CONTROLLED AGREEMENT';
  const resolvedTemplateClauses = resolveAgreementClauseSchema(
    templateCode,
    agreement.template?.clause_schema,
    agreement.owner_type
  );
  const snapshot = {
    agreement_reference: agreement.agreement_reference,
    template_id: agreement.template_id,
    template_version: agreement.template_version,
    template_code: templateCode,
    source_basis:
      agreement.template?.source_basis ||
      (agreement.owner_type === 'participant'
        ? 'NDIS service agreement operational template'
        : agreement.owner_type === 'contractor'
        ? 'Independent contractor operational template'
        : 'SCHADS Industry Award 2010'),
    template_clause_schema: sortKeys(resolvedTemplateClauses),
    owner_type: agreement.owner_type,
    owner_id: agreement.owner_id,
    title: agreement.title,
    version_number: agreement.version_number,
    questionnaire_data: sortKeys(agreement.questionnaire_data || {}),
    compiled_clauses: sortKeys(agreement.compiled_clauses || {}),
    commencement_date: agreement.commencement_date,
    review_date: agreement.review_date || null,
    expiry_date: agreement.expiry_date || null,
    estimated_budget: agreement.estimated_budget || null,
    provider_legal_name:
      org?.proprietorLegalName || org?.legalName || org?.tradingName || 'Opus Care Support Services',
    provider_trading_name: org?.tradingName || 'Opus Care Support Services',
    provider_abn: org?.abn || '41 267 197 576',
    provider_proprietor: org?.proprietorLegalName || null,
  };

  const canonicalString = JSON.stringify(sortKeys(snapshot));
  const hash = crypto.createHash('sha256').update(canonicalString).digest('hex');
  return { snapshot, hash };
}

export function validateSignatureImageData(dataUrl?: string | null): { ok: boolean; error?: string } {
  if (!dataUrl) {
    return { ok: false, error: 'Signature image data is required.' };
  }
  if (typeof dataUrl !== 'string') {
    return { ok: false, error: 'Invalid signature payload format.' };
  }
  if (dataUrl.length > MAX_SIGNATURE_PAYLOAD_BYTES) {
    return { ok: false, error: 'Signature image payload exceeds 512 KB size limit.' };
  }
  const match = dataUrl.match(/^data:image\/(png|jpeg|jpg);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) {
    return { ok: false, error: 'Signature must be a valid base64 PNG or JPEG data URL.' };
  }
  try {
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length === 0) {
      return { ok: false, error: 'Signature image data is empty.' };
    }
  } catch {
    return { ok: false, error: 'Malformed base64 signature image.' };
  }
  return { ok: true };
}

export async function checkAndExpireInvitations(supabase: SupabaseClient, agreementId?: string): Promise<void> {
  const now = new Date().toISOString();
  let query = supabase
    .from('agreement_signing_invitations')
    .select('id, agreement_id')
    .in('status', ['pending', 'viewed'])
    .lt('expires_at', now);

  if (agreementId) {
    query = query.eq('agreement_id', agreementId);
  }

  const { data: expiredList } = await query;
  if (!expiredList || expiredList.length === 0) return;

  const expiredIds = expiredList.map((i: any) => i.id);
  await supabase
    .from('agreement_signing_invitations')
    .update({
      status: 'expired',
      expired_at: now,
      updated_at: now,
    })
    .in('id', expiredIds);

  // Group by agreement_id and evaluate lifecycle transition
  const agreementIds = Array.from(new Set(expiredList.map((i: any) => i.agreement_id)));
  for (const agrId of agreementIds) {
    const { data: remaining } = await supabase
      .from('agreement_signing_invitations')
      .select('id')
      .eq('agreement_id', agrId)
      .in('status', ['pending', 'viewed']);

    if (!remaining || remaining.length === 0) {
      const { data: agr } = await supabase
        .from('agreement_records')
        .select('status')
        .eq('id', agrId)
        .single();

      if (agr && agr.status === 'sent_for_signature') {
        const { data: providerSig } = await supabase
          .from('agreement_signatures')
          .select('id')
          .eq('agreement_id', agrId)
          .eq('party_role', 'provider_rep')
          .maybeSingle();

        const fallback = providerSig ? 'partially_signed' : 'draft';
        await supabase
          .from('agreement_records')
          .update({
            status: fallback,
            updated_at: now,
          })
          .eq('id', agrId);
      }
    }
  }
}

export async function createSigningInvitation(
  supabase: SupabaseClient,
  params: {
    agreementId: string;
    partyRole: 'worker' | 'participant' | 'guardian' | 'contractor';
    recipientName: string;
    recipientEmail: string;
    createdBy?: string;
    org?: any;
  }
): Promise<{ ok: boolean; rawToken?: string; invitation?: any; error?: string }> {
  const { agreementId, partyRole, recipientName, recipientEmail, createdBy = 'Admin', org } = params;

  if (!recipientEmail || !recipientEmail.includes('@')) {
    return { ok: false, error: 'A valid recipient email address is required.' };
  }

  const { data: agreement, error: fetchErr } = await supabase
    .from('agreement_records')
    .select('*, template:document_templates(*)')
    .eq('id', agreementId)
    .single();

  if (fetchErr || !agreement) {
    return { ok: false, error: 'Agreement record not found.' };
  }

  if (['active', 'fully_signed', 'superseded', 'terminated', 'expired'].includes(agreement.status)) {
    return { ok: false, error: 'Cannot issue a signing invitation for an executed or inactive agreement.' };
  }

  // Revoke any existing active invitation for this (agreementId, partyRole)
  await supabase
    .from('agreement_signing_invitations')
    .update({
      status: 'revoked',
      revoked_at: new Date().toISOString(),
      revoked_by: createdBy,
      revoked_reason: 'Superseded by new invitation issuance',
      updated_at: new Date().toISOString(),
    })
    .eq('agreement_id', agreementId)
    .eq('party_role', partyRole)
    .in('status', ['pending', 'viewed']);

  // Freeze document snapshot with all contractual terms and provider details
  const { snapshot, hash: docHash } = createDocumentSnapshot(agreement, org);

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashSigningToken(rawToken);

  const { data: invitation, error: insertErr } = await supabase
    .from('agreement_signing_invitations')
    .insert({
      agreement_id: agreementId,
      token_hash: tokenHash,
      party_role: partyRole,
      recipient_name: recipientName.trim(),
      recipient_email: recipientEmail.trim().toLowerCase(),
      document_snapshot: snapshot,
      document_hash_sha256: docHash,
      status: 'pending',
      delivery_status: 'pending',
      created_by: createdBy,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (insertErr || !invitation) {
    return { ok: false, error: insertErr?.message || 'Failed to create signing invitation.' };
  }

  await supabase
    .from('agreement_records')
    .update({
      status: 'sent_for_signature',
      updated_at: new Date().toISOString(),
    })
    .eq('id', agreementId);

  return { ok: true, rawToken, invitation };
}

export async function revokeSigningInvitation(
  supabase: SupabaseClient,
  invitationId: string,
  revokedBy = 'Admin',
  reason = 'Revoked by administrator'
): Promise<{ ok: boolean; error?: string }> {
  const { data: inv, error: invErr } = await supabase
    .from('agreement_signing_invitations')
    .select('*, agreement:agreement_records(*)')
    .eq('id', invitationId)
    .single();

  if (invErr || !inv) {
    return { ok: false, error: 'Invitation not found.' };
  }

  if (inv.status === 'signed') {
    return { ok: false, error: 'Cannot revoke an invitation that has already been signed.' };
  }

  await supabase
    .from('agreement_signing_invitations')
    .update({
      status: 'revoked',
      revoked_at: new Date().toISOString(),
      revoked_by: revokedBy,
      revoked_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', invitationId);

  // Check if any other active invitations exist
  const { data: remaining } = await supabase
    .from('agreement_signing_invitations')
    .select('id')
    .eq('agreement_id', inv.agreement_id)
    .in('status', ['pending', 'viewed']);

  if (!remaining || remaining.length === 0) {
    const { data: providerSig } = await supabase
      .from('agreement_signatures')
      .select('id')
      .eq('agreement_id', inv.agreement_id)
      .eq('party_role', 'provider_rep')
      .maybeSingle();

    const fallbackStatus = providerSig ? 'partially_signed' : 'draft';
    await supabase
      .from('agreement_records')
      .update({
        status: fallbackStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', inv.agreement_id);
  }

  return { ok: true };
}

export async function executeExternalSigning(
  supabase: SupabaseClient,
  params: {
    rawToken: string;
    signerName: string;
    signerTitle?: string;
    signatureImageData: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    org?: any;
  }
): Promise<{ ok: boolean; error?: string; is_fully_signed?: boolean; agreement_reference?: string; code?: string }> {
  const { rawToken, signerName, signerTitle = 'Recipient', signatureImageData, ipAddress, userAgent, org } = params;

  const sigVal = validateSignatureImageData(signatureImageData);
  if (!sigVal.ok) {
    return { ok: false, error: sigVal.error, code: 'INVALID_SIGNATURE' };
  }

  const tokenHash = hashSigningToken(rawToken);

  const { data: invitation, error: invErr } = await supabase
    .from('agreement_signing_invitations')
    .select('*, agreement:agreement_records(*, template:document_templates(*))')
    .eq('token_hash', tokenHash)
    .single();

  if (invErr || !invitation) {
    return { ok: false, error: 'Invalid or missing signing invitation.', code: 'INVALID_INVITATION' };
  }

  if (invitation.status === 'signed') {
    return { ok: false, error: 'This agreement has already been signed.', code: 'ALREADY_SIGNED' };
  }

  if (invitation.status === 'revoked' || invitation.status === 'expired' || new Date() > new Date(invitation.expires_at)) {
    // Run expiry handler
    await checkAndExpireInvitations(supabase, invitation.agreement_id);
    return { ok: false, error: 'This signing link has expired or been revoked.', code: 'EXPIRED' };
  }

  const agreement = invitation.agreement;
  if (!agreement || ['superseded', 'terminated', 'expired'].includes(agreement.status)) {
    return { ok: false, error: 'Agreement is no longer active for signing.', code: 'AGREEMENT_INACTIVE' };
  }

  // Snapshot Integrity Check
  const currentSnapshot = createDocumentSnapshot(agreement, org);
  if (currentSnapshot.hash !== invitation.document_hash_sha256) {
    return {
      ok: false,
      error: 'The agreement terms have changed since this invitation was issued. Please contact the administrator for a fresh link.',
      code: 'SNAPSHOT_MISMATCH',
    };
  }

  const { data: existingSigs } = await supabase
    .from('agreement_signatures')
    .select('*')
    .eq('agreement_id', agreement.id);

  const providerSig = (existingSigs || []).find((s: any) => s.party_role === 'provider_rep');
  const willBeFullySigned = Boolean(providerSig);

  let executedPdfPath: string | null = null;
  let executedHash: string | null = null;

  if (willBeFullySigned) {
    const candidateRecipientSig = {
      party_role: invitation.party_role,
      signer_name: signerName.trim(),
      signer_title: signerTitle,
      signer_email: invitation.recipient_email,
      signed_at: new Date().toISOString(),
      signing_method: 'email_link',
      signature_image_data: signatureImageData,
      is_verified: false,
      ip_address: ipAddress || null,
    };

    const combinedSignatures = [...(existingSigs || []), candidateRecipientSig];

    // Generate real PDF strictly from frozen snapshot + immutable signatures
    const pdfBytes = await generateAuthoritativeExecutedPdf({
      agreement: {
        ...agreement,
        frozen_snapshot: invitation.document_snapshot,
      },
      signatures: combinedSignatures,
      org,
    });

    // Hard Storage Requirement: Upload must succeed or abort!
    try {
      const uploadRes = await uploadExecutedDocument(supabase, agreement.agreement_reference, pdfBytes);
      executedPdfPath = uploadRes.path;
      executedHash = uploadRes.hash;
    } catch (storageErr: any) {
      return {
        ok: false,
        error: `Execution aborted: Failed to securely store executed PDF document (${storageErr.message}).`,
        code: 'STORAGE_FAILURE',
      };
    }
  }

  // Execute atomic DB transaction
  try {
    const { data: rpcResult, error: rpcError } = await supabase.rpc('execute_external_agreement_signature', {
      p_token_hash: tokenHash,
      p_signer_name: signerName.trim(),
      p_signer_title: signerTitle,
      p_signing_method: 'email_link',
      p_signature_image_data: signatureImageData,
      p_ip_address: ipAddress || null,
      p_user_agent: userAgent || null,
      p_executed_pdf_path: executedPdfPath,
      p_executed_hash_sha256: executedHash,
    });

    if (rpcError) {
      if (executedPdfPath) {
        await cleanupUploadedExecutedDocument(supabase, executedPdfPath);
      }
      return { ok: false, error: rpcError.message };
    }

    if (!rpcResult?.ok) {
      if (executedPdfPath) {
        await cleanupUploadedExecutedDocument(supabase, executedPdfPath);
      }
      return { ok: false, error: rpcResult?.error || 'Signing could not be completed.', code: rpcResult?.code };
    }

    return {
      ok: true,
      is_fully_signed: rpcResult.is_fully_signed,
      agreement_reference: agreement.agreement_reference,
    };
  } catch (err: any) {
    if (executedPdfPath) {
      await cleanupUploadedExecutedDocument(supabase, executedPdfPath);
    }
    return { ok: false, error: err?.message || 'Server error during agreement execution.' };
  }
}

export async function executeProviderSigning(
  supabase: SupabaseClient,
  params: {
    agreementId: string;
    signerName: string;
    signerTitle?: string;
    signerEmail?: string;
    signatureImageData?: string | null;
    signingMethod?: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    org?: any;
  }
): Promise<{ ok: boolean; error?: string; is_fully_signed?: boolean; agreement?: any }> {
  const {
    agreementId,
    signerName,
    signerTitle = 'Managing Director, Opus Care Support Services',
    signerEmail = 'admin@opuscare.com.au',
    signatureImageData = null,
    signingMethod = 'digital_canvas',
    ipAddress,
    userAgent,
    org,
  } = params;

  if (signatureImageData) {
    const val = validateSignatureImageData(signatureImageData);
    if (!val.ok) return { ok: false, error: val.error };
  }

  const { data: agreement, error: fetchErr } = await supabase
    .from('agreement_records')
    .select('*, template:document_templates(*), signatures:agreement_signatures(*)')
    .eq('id', agreementId)
    .single();

  if (fetchErr || !agreement) {
    return { ok: false, error: 'Agreement record not found.' };
  }

  const existingSigs = agreement.signatures || [];
  const recipientSig = existingSigs.find((s: any) =>
    ['worker', 'participant', 'guardian', 'contractor'].includes(s.party_role)
  );

  let frozenRecipientSnapshot: Record<string, any> | null = null;
  if (recipientSig?.signing_method === 'email_link') {
    const { data: signedInvitation, error: invitationError } = await supabase
      .from('agreement_signing_invitations')
      .select('document_snapshot, document_hash_sha256')
      .eq('agreement_id', agreementId)
      .eq('party_role', recipientSig.party_role)
      .eq('status', 'signed')
      .order('signed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (invitationError || !signedInvitation) {
      return {
        ok: false,
        error: 'The recipient signing snapshot could not be verified. Issue a controlled variation instead of countersigning this agreement.',
      };
    }

    const currentSnapshot = createDocumentSnapshot(agreement, org);
    if (currentSnapshot.hash !== signedInvitation.document_hash_sha256) {
      return {
        ok: false,
        error: 'The agreement terms differ from the document signed by the recipient. Create a controlled variation and obtain fresh signatures.',
      };
    }

    frozenRecipientSnapshot = signedInvitation.document_snapshot;
  }

  let executedPdfPath = '';
  let executedHash = '';

  if (recipientSig) {
    const providerCandidateSig = {
      party_role: 'provider_rep',
      signer_name: signerName.trim(),
      signer_title: signerTitle,
      signer_email: signerEmail,
      signed_at: new Date().toISOString(),
      signing_method: signingMethod,
      signature_image_data: signatureImageData,
      is_verified: true,
      ip_address: ipAddress || null,
    };

    const combinedSignatures = [...existingSigs, providerCandidateSig];
    const pdfBytes = await generateAuthoritativeExecutedPdf({
      agreement: frozenRecipientSnapshot
        ? { ...agreement, frozen_snapshot: frozenRecipientSnapshot }
        : agreement,
      signatures: combinedSignatures,
      org,
    });

    try {
      const uploadRes = await uploadExecutedDocument(supabase, agreement.agreement_reference, pdfBytes);
      executedPdfPath = uploadRes.path;
      executedHash = uploadRes.hash;
    } catch (storageErr: any) {
      return {
        ok: false,
        error: `Execution aborted: Failed to securely store executed PDF document (${storageErr.message}).`,
      };
    }
  }

  try {
    const { data: rpcResult, error: rpcError } = await supabase.rpc('execute_provider_agreement_signature', {
      p_agreement_id: agreementId,
      p_signer_name: signerName.trim(),
      p_signer_title: signerTitle,
      p_signer_email: signerEmail,
      p_signing_method: signingMethod,
      p_signature_image_data: signatureImageData,
      p_ip_address: ipAddress || null,
      p_user_agent: userAgent || null,
      p_executed_pdf_path: executedPdfPath || null,
      p_executed_hash_sha256: executedHash || null,
    });

    if (rpcError) {
      if (executedPdfPath) {
        await cleanupUploadedExecutedDocument(supabase, executedPdfPath);
      }
      return { ok: false, error: rpcError.message };
    }

    if (!rpcResult?.ok) {
      if (executedPdfPath) {
        await cleanupUploadedExecutedDocument(supabase, executedPdfPath);
      }
      return { ok: false, error: rpcResult?.error || 'Provider execution could not be finalized.' };
    }

    const { data: updatedAgreement } = await supabase
      .from('agreement_records')
      .select('*, template:document_templates(*), signatures:agreement_signatures(*)')
      .eq('id', agreementId)
      .single();

    return {
      ok: true,
      is_fully_signed: rpcResult.is_fully_signed,
      agreement: updatedAgreement,
    };
  } catch (err: any) {
    if (executedPdfPath) {
      await cleanupUploadedExecutedDocument(supabase, executedPdfPath);
    }
    return { ok: false, error: err?.message || 'Server error during provider agreement execution.' };
  }
}

export async function executeInternalRecipientSigning(
  supabase: SupabaseClient,
  params: {
    agreementId: string;
    partyRole: string;
    signerName: string;
    signerTitle?: string;
    signerEmail?: string;
    signatureImageData?: string | null;
    signingMethod?: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    org?: any;
  }
): Promise<{ ok: boolean; error?: string; is_fully_signed?: boolean; agreement?: any }> {
  const {
    agreementId,
    partyRole,
    signerName,
    signerTitle = 'Recipient',
    signerEmail = '',
    signatureImageData = null,
    signingMethod = 'digital_canvas',
    ipAddress,
    userAgent,
    org,
  } = params;

  if (signatureImageData) {
    const val = validateSignatureImageData(signatureImageData);
    if (!val.ok) return { ok: false, error: val.error };
  }

  const { data: agreement, error: fetchErr } = await supabase
    .from('agreement_records')
    .select('*, template:document_templates(*), signatures:agreement_signatures(*)')
    .eq('id', agreementId)
    .single();

  if (fetchErr || !agreement) {
    return { ok: false, error: 'Agreement record not found.' };
  }

  const existingSigs = agreement.signatures || [];
  const providerSig = existingSigs.find((s: any) => s.party_role === 'provider_rep');

  let executedPdfPath = '';
  let executedHash = '';

  if (providerSig) {
    const recipientCandidateSig = {
      party_role: partyRole,
      signer_name: signerName.trim(),
      signer_title: signerTitle,
      signer_email: signerEmail,
      signed_at: new Date().toISOString(),
      signing_method: signingMethod,
      signature_image_data: signatureImageData,
      is_verified: true,
      ip_address: ipAddress || null,
    };

    const combinedSignatures = [...existingSigs, recipientCandidateSig];
    const pdfBytes = await generateAuthoritativeExecutedPdf({
      agreement,
      signatures: combinedSignatures,
      org,
    });

    try {
      const uploadRes = await uploadExecutedDocument(supabase, agreement.agreement_reference, pdfBytes);
      executedPdfPath = uploadRes.path;
      executedHash = uploadRes.hash;
    } catch (storageErr: any) {
      return {
        ok: false,
        error: `Execution aborted: Failed to securely store executed PDF document (${storageErr.message}).`,
      };
    }
  }

  try {
    const { data: rpcResult, error: rpcError } = await supabase.rpc('execute_internal_recipient_signature', {
      p_agreement_id: agreementId,
      p_party_role: partyRole,
      p_signer_name: signerName.trim(),
      p_signer_title: signerTitle,
      p_signer_email: signerEmail,
      p_signing_method: signingMethod,
      p_signature_image_data: signatureImageData,
      p_ip_address: ipAddress || null,
      p_user_agent: userAgent || null,
      p_executed_pdf_path: executedPdfPath || null,
      p_executed_hash_sha256: executedHash || null,
    });

    if (rpcError) {
      if (executedPdfPath) {
        await cleanupUploadedExecutedDocument(supabase, executedPdfPath);
      }
      return { ok: false, error: rpcError.message };
    }

    if (!rpcResult?.ok) {
      if (executedPdfPath) {
        await cleanupUploadedExecutedDocument(supabase, executedPdfPath);
      }
      return { ok: false, error: rpcResult?.error || 'Internal recipient signing failed.' };
    }

    const { data: updatedAgreement } = await supabase
      .from('agreement_records')
      .select('*, template:document_templates(*), signatures:agreement_signatures(*)')
      .eq('id', agreementId)
      .single();

    return {
      ok: true,
      is_fully_signed: rpcResult.is_fully_signed,
      agreement: updatedAgreement,
    };
  } catch (err: any) {
    if (executedPdfPath) {
      await cleanupUploadedExecutedDocument(supabase, executedPdfPath);
    }
    return { ok: false, error: err?.message || 'Server error during internal recipient signing.' };
  }
}
