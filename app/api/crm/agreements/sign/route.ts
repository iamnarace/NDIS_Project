import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import { isValidUuid } from '@/lib/uuid';

export async function POST(req: Request) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ message: 'Database unavailable' }, { status: 503 });

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
        return NextResponse.json({ message: `Invalid agreement_id: '${agreement_id}' is not a valid UUID.` }, { status: 400 });
      }
    }

    // Insert signature
    const { data: sig, error: sigErr } = await supabase
      .from('agreement_signatures')
      .insert({
        agreement_id,
        party_role,
        signer_name,
        signer_title,
        signer_email,
        signing_method,
        signature_image_data,
        signed_at: new Date().toISOString(),
        is_verified: true,
      })
      .select()
      .single();

    if (sigErr) return NextResponse.json({ message: sigErr.message }, { status: 500 });

    // Check all signatures on this agreement
    const { data: allSigs } = await supabase
      .from('agreement_signatures')
      .select('*')
      .eq('agreement_id', agreement_id);

    // If signed by both party and provider (or marked fully executed)
    const hasParticipantOrWorker = (allSigs || []).some(s => ['participant', 'guardian', 'worker', 'contractor'].includes(s.party_role));
    const hasProvider = (allSigs || []).some(s => s.party_role === 'provider_rep');

    let newStatus = 'partially_signed';
    let executedAt = null;
    let sha256Hash = null;

    if (hasParticipantOrWorker && hasProvider) {
      newStatus = 'active';
      executedAt = new Date().toISOString();
      // Generate immutable hash
      sha256Hash = crypto.createHash('sha256').update(`${agreement_id}-${executedAt}-${signer_name}`).digest('hex');
    }

    const updatePayload: Record<string, any> = {
      status: newStatus,
      updated_at: new Date().toISOString()
    };
    if (executedAt) updatePayload.executed_at = executedAt;
    if (sha256Hash) updatePayload.executed_hash_sha256 = sha256Hash;

    const { data: updatedAgreement, error: updateErr } = await supabase
      .from('agreement_records')
      .update(updatePayload)
      .eq('id', agreement_id)
      .select('*, template:document_templates(*), signatures:agreement_signatures(*)')
      .single();

    if (updateErr) return NextResponse.json({ message: updateErr.message }, { status: 500 });

    return NextResponse.json({
      ok: true,
      signature: sig,
      agreement: updatedAgreement,
      is_fully_signed: newStatus === 'active'
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
