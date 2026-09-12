import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedAdminActor } from '@/lib/adminAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import { userFacingError } from '@/lib/userFacingError';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!(await getAuthenticatedAdminActor(req))) {
    return NextResponse.json({ ok: false, error: 'Unauthorized: Admin access required.' }, { status: 401 });
  }
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: 'Governance service unavailable.' }, { status: 503 });
  const { data, error } = await supabase
    .from('contracting_provider_relationships')
    .select('id, provider_name, provider_registration_reference, contract_reference, verification_status, verified_at, effective_from, effective_to')
    .order('provider_name');
  if (error) return NextResponse.json({ ok: false, error: userFacingError(error.message) }, { status: 500 });
  return NextResponse.json({ ok: true, relationships: data || [] });
}

export async function POST(req: NextRequest) {
  const actorId = await getAuthenticatedAdminActor(req);
  if (!actorId) return NextResponse.json({ ok: false, error: 'Unauthorized: Admin access required.' }, { status: 401 });
  const body = await req.json();
  const providerName = body.providerName?.trim();
  const registrationReference = body.providerRegistrationReference?.trim();
  const contractReference = body.contractReference?.trim();
  if (!providerName || !registrationReference || !contractReference) {
    return NextResponse.json({ ok: false, error: 'Provider name, registration reference and contract reference are required.' }, { status: 400 });
  }
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: 'Governance service unavailable.' }, { status: 503 });
  const { data, error } = await supabase.from('contracting_provider_relationships').insert({
    provider_name: providerName,
    provider_registration_reference: registrationReference,
    contract_reference: contractReference,
    verification_status: 'pending_verification',
  }).select('id, provider_name, provider_registration_reference, contract_reference, verification_status').single();
  if (error) return NextResponse.json({ ok: false, error: userFacingError(error.message) }, { status: 500 });
  return NextResponse.json({ ok: true, relationship: data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const actorId = await getAuthenticatedAdminActor(req);
  if (!actorId) return NextResponse.json({ ok: false, error: 'Unauthorized: Admin access required.' }, { status: 401 });
  const body = await req.json();
  if (!body.id || !['verify', 'revoke'].includes(body.action)) {
    return NextResponse.json({ ok: false, error: 'Relationship id and a valid action are required.' }, { status: 400 });
  }
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: 'Governance service unavailable.' }, { status: 503 });
  const update = body.action === 'verify'
    ? { verification_status: 'verified', verified_by: actorId, verified_at: new Date().toISOString() }
    : { verification_status: 'revoked' };
  const { data, error } = await supabase.from('contracting_provider_relationships')
    .update(update).eq('id', body.id)
    .select('id, provider_name, provider_registration_reference, contract_reference, verification_status, verified_at')
    .single();
  if (error) return NextResponse.json({ ok: false, error: userFacingError(error.message) }, { status: 500 });
  return NextResponse.json({ ok: true, relationship: data });
}
