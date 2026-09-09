import { userFacingError } from '@/lib/userFacingError';
import { NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import { isValidUuid, resolveStaffUuid, resolveParticipantUuid } from '@/lib/uuid';

async function generateAgreementRef(supabase: ReturnType<typeof createAdminClient>): Promise<string> {
  const year = new Date().getFullYear();
  if (!supabase) return `AGR-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
  
  const { count } = await supabase
    .from('agreement_records')
    .select('*', { count: 'exact', head: true });
    
  const nextNum = ((count ?? 0) + 1).toString().padStart(4, '0');
  return `AGR-${year}-${nextNum}`;
}

export async function GET(req: Request) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ message: "We couldn't complete this action. Please refresh and try again." }, { status: 503 });

  const { searchParams } = new URL(req.url);
  const ownerId = searchParams.get('owner_id');
  const ownerType = searchParams.get('owner_type');
  const status = searchParams.get('status');

  let query = supabase
    .from('agreement_records')
    .select(`
      *,
      template:document_templates(*),
      signatures:agreement_signatures(*)
    `)
    .order('created_at', { ascending: false });

  if (ownerId) {
    let resolvedOwner = ownerId;
    if (!isValidUuid(ownerId)) {
      if (ownerType === 'staff' || ownerType === 'contractor') {
        resolvedOwner = (await resolveStaffUuid(supabase, ownerId)) || ownerId;
      } else if (ownerType === 'participant') {
        resolvedOwner = (await resolveParticipantUuid(supabase, ownerId)) || ownerId;
      }
    }
    if (isValidUuid(resolvedOwner)) {
      query = query.eq('owner_id', resolvedOwner);
    }
  }
  if (ownerType) query = query.eq('owner_type', ownerType);
  if (status && status !== 'all') query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ message: userFacingError(error.message) }, { status: 500 });

  return NextResponse.json(data || []);
}

export async function POST(req: Request) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ message: "We couldn't complete this action. Please refresh and try again." }, { status: 503 });

  try {
    const body = await req.json();
    const {
      template_id,
      owner_type,
      owner_id,
      title,
      questionnaire_data = {},
      compiled_clauses = {},
      commencement_date,
      review_date = null,
      expiry_date = null,
      estimated_budget = null,
      status = 'draft',
      is_variation = false,
      prior_agreement_id = null
    } = body;

    if (!template_id || !owner_type || !owner_id || !title || !commencement_date) {
      return NextResponse.json({ message: 'Missing required agreement fields' }, { status: 400 });
    }

    if (!isValidUuid(template_id)) {
      return NextResponse.json({ message: "We couldn't complete this action. Please refresh and try again." }, { status: 400 });
    }

    if (prior_agreement_id && !isValidUuid(prior_agreement_id)) {
      return NextResponse.json({ message: "We couldn't complete this action. Please refresh and try again." }, { status: 400 });
    }

    // Defensively resolve owner_id to actual Supabase UUID
    let resolvedOwnerId = owner_id;
    if (!isValidUuid(owner_id)) {
      if (owner_type === 'staff' || owner_type === 'contractor') {
        resolvedOwnerId = await resolveStaffUuid(supabase, owner_id);
      } else if (owner_type === 'participant') {
        resolvedOwnerId = await resolveParticipantUuid(supabase, owner_id);
      }
    }

    if (!resolvedOwnerId || !isValidUuid(resolvedOwnerId)) {
      return NextResponse.json(
        { message: "We couldn't complete this action. Please refresh and try again." },
        { status: 400 }
      );
    }

    // Fetch template to get template_version
    const { data: template, error: tmplErr } = await supabase
      .from('document_templates')
      .select('template_version')
      .eq('id', template_id)
      .single();

    if (tmplErr || !template) {
      return NextResponse.json({ message: 'Invalid template' }, { status: 400 });
    }

    const ref = await generateAgreementRef(supabase);

    let versionNumber = 1;
    if (is_variation && prior_agreement_id) {
      const { data: prior } = await supabase
        .from('agreement_records')
        .select('version_number, owner_id, owner_type, status')
        .eq('id', prior_agreement_id)
        .single();
      if (!prior || prior.owner_id !== resolvedOwnerId || prior.owner_type !== owner_type) {
        return NextResponse.json({ message: 'The original agreement could not be matched to this recipient.' }, { status: 400 });
      }
      if (!['active', 'fully_signed'].includes(prior.status)) {
        return NextResponse.json({ message: 'Only an active agreement can be varied.' }, { status: 409 });
      }
      versionNumber = (prior?.version_number || 1) + 1;
    }

    const storedClauses = is_variation && prior_agreement_id
      ? { ...compiled_clauses, variation_of_agreement_id: prior_agreement_id }
      : compiled_clauses;

    const { data: newAgreement, error: insertErr } = await supabase
      .from('agreement_records')
      .insert({
        agreement_reference: ref,
        template_id,
        template_version: template.template_version,
        owner_type,
        owner_id: resolvedOwnerId,
        title,
        version_number: versionNumber,
        questionnaire_data,
        compiled_clauses: storedClauses,
        commencement_date,
        review_date,
        expiry_date,
        estimated_budget,
        status,
        created_by: 'Admin',
      })
      .select('*, template:document_templates(*)')
      .single();

    if (insertErr) return NextResponse.json({ message: userFacingError(insertErr.message) }, { status: 500 });

    return NextResponse.json({ ok: true, agreement: newAgreement });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ message: "We couldn't complete this action. Please refresh and try again." }, { status: 503 });

  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) return NextResponse.json({ message: 'Agreement id required' }, { status: 400 });

    // Protect immutability: if active or fully_signed, cannot overwrite clauses without variation
    const { data: current } = await supabase
      .from('agreement_records')
      .select('status, executed_at')
      .eq('id', id)
      .single();

    const incomingFields = Object.keys(updates);
    if (current?.executed_at || ['active', 'fully_signed', 'superseded'].includes(current?.status || '')) {
      const allowedLifecycleFields = new Set(['status', 'superseded_by_id']);
      const allowedStatuses = new Set(['active', 'fully_signed', 'superseded', 'expired', 'terminated']);
      if (incomingFields.some((field) => !allowedLifecycleFields.has(field)) || (updates.status && !allowedStatuses.has(updates.status))) {
        return NextResponse.json({
          message: 'Executed agreements cannot be directly edited. Please create a Variation agreement to amend terms.'
        }, { status: 403 });
      }
    } else {
      const draftFields = new Set([
        'template_id', 'owner_type', 'owner_id', 'title', 'questionnaire_data',
        'compiled_clauses', 'commencement_date', 'review_date', 'expiry_date',
        'estimated_budget', 'status',
      ]);
      if (incomingFields.some((field) => !draftFields.has(field))) {
        return NextResponse.json({ message: 'One or more agreement fields cannot be changed.' }, { status: 400 });
      }
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('agreement_records')
      .update(updates)
      .eq('id', id)
      .select('*, template:document_templates(*), signatures:agreement_signatures(*)')
      .single();

    if (error) return NextResponse.json({ message: userFacingError(error.message) }, { status: 500 });
    return NextResponse.json({ ok: true, agreement: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ message: "We couldn't complete this action. Please refresh and try again." }, { status: 503 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ message: 'Agreement id required' }, { status: 400 });

  // Only allow deleting drafts
  const { data: current } = await supabase
    .from('agreement_records')
    .select('status')
    .eq('id', id)
    .single();

  if (current && current.status !== 'draft' && current.status !== 'ready_for_review') {
    return NextResponse.json({ message: 'Cannot delete signed or active agreements. Use Termination Notice instead.' }, { status: 403 });
  }

  const { error } = await supabase
    .from('agreement_records')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ message: userFacingError(error.message) }, { status: 500 });
  return NextResponse.json({ ok: true, deleted_id: id });
}
