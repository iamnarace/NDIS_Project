-- Migration: 20260916210000_agreement_signing_invitations.sql
-- Description: External contract signing invitations, token hashing, audit trail, and atomic execution RPCs.

-- 1. Create table for tokenized external signing invitations
create table if not exists public.agreement_signing_invitations (
  id uuid primary key default gen_random_uuid(),
  agreement_id uuid not null references public.agreement_records(id) on delete cascade,
  -- Store ONLY SHA-256 hash of raw token (64-char hex); never the plaintext token
  token_hash text not null unique,
  party_role text not null check (party_role in ('worker', 'participant', 'guardian', 'contractor')),
  recipient_name text not null,
  recipient_email text not null,
  
  -- Frozen document state at time of invitation issue
  document_snapshot jsonb not null,
  document_hash_sha256 text not null,
  
  -- Lifecycle & Delivery
  status text not null default 'pending' check (status in ('pending', 'viewed', 'signed', 'expired', 'revoked')),
  delivery_status text not null default 'pending' check (delivery_status in ('pending', 'sent', 'simulated', 'failed')),
  delivery_error text,
  resend_message_id text,
  
  -- Timestamps & Actor Audit
  created_by text not null default 'Admin',
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  viewed_at timestamptz,
  signed_at timestamptz,
  expires_at timestamptz not null default (now() + interval '14 days'),
  expired_at timestamptz,
  revoked_at timestamptz,
  revoked_by text,
  revoked_reason text,
  
  -- Supporting technical audit evidence (not sole legal basis)
  signing_ip text,
  signing_user_agent text,
  human_view_ip text,
  human_view_user_agent text,
  
  updated_at timestamptz not null default now()
);

-- 2. Partial UNIQUE index: Strictly enforce at most ONE active invitation per (agreement_id, party_role)
create unique index if not exists uq_agreement_active_invitation
  on public.agreement_signing_invitations (agreement_id, party_role)
  where status in ('pending', 'viewed');

-- 3. Additional query indexes
create index if not exists idx_agreement_invitations_token_hash on public.agreement_signing_invitations(token_hash);
create index if not exists idx_agreement_invitations_agreement_id on public.agreement_signing_invitations(agreement_id);

-- 4. RLS & Permissions: Complete lockdown from public/authenticated direct access
alter table public.agreement_signing_invitations enable row level security;

-- Revoke all direct privileges from public and anon
revoke all on public.agreement_signing_invitations from anon, public;

-- Authorised staff can view invitations via CRM admin client
create policy "Opus staff read signing invitations"
  on public.agreement_signing_invitations
  for select to authenticated
  using (public.is_opus_staff());

-- Only server service-role / admin client can insert or update
create policy "Server service-role manages signing invitations"
  on public.agreement_signing_invitations
  for all to service_role
  using (true)
  with check (true);

-- 5. Atomic PostgreSQL RPC for external recipient signing
create or replace function public.execute_external_agreement_signature(
  p_token_hash text,
  p_signer_name text,
  p_signer_title text,
  p_signing_method text,
  p_signature_image_data text,
  p_ip_address text,
  p_user_agent text,
  p_executed_pdf_path text default null,
  p_executed_hash_sha256 text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invitation record;
  v_agreement record;
  v_has_provider boolean;
  v_new_status text;
  v_sig_id uuid;
  v_prior_agreement_id uuid;
begin
  -- 1. Row-lock the invitation FOR UPDATE to prevent concurrent double-submission
  select * into v_invitation
  from public.agreement_signing_invitations
  where token_hash = p_token_hash
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Invalid signing invitation.', 'code', 'INVALID_INVITATION');
  end if;

  if v_invitation.status = 'signed' then
    return jsonb_build_object('ok', false, 'error', 'This agreement has already been signed.', 'code', 'ALREADY_SIGNED');
  end if;

  if v_invitation.status in ('revoked', 'expired') or now() > v_invitation.expires_at then
    return jsonb_build_object('ok', false, 'error', 'This signing link has expired or been revoked.', 'code', 'EXPIRED');
  end if;

  -- 2. Row-lock agreement record
  select * into v_agreement
  from public.agreement_records
  where id = v_invitation.agreement_id
  for update;

  if not found or v_agreement.status in ('superseded', 'terminated', 'expired') then
    return jsonb_build_object('ok', false, 'error', 'Agreement is no longer active for signing.', 'code', 'AGREEMENT_INACTIVE');
  end if;

  -- 3. Verify server-recorded email is used (not client-supplied email)
  -- Insert immutable signature into agreement_signatures
  insert into public.agreement_signatures (
    agreement_id,
    party_role,
    signer_name,
    signer_title,
    signer_email,
    signing_method,
    signature_image_data,
    ip_address,
    user_agent,
    signed_at,
    is_verified
  ) values (
    v_invitation.agreement_id,
    v_invitation.party_role,
    p_signer_name,
    p_signer_title,
    v_invitation.recipient_email,
    p_signing_method,
    p_signature_image_data,
    p_ip_address,
    p_user_agent,
    now(),
    false -- External email links are verified by token delivery, not independent identity verification
  ) returning id into v_sig_id;

  -- 4. Mark invitation as signed
  update public.agreement_signing_invitations
  set status = 'signed',
      signed_at = now(),
      signing_ip = p_ip_address,
      signing_user_agent = p_user_agent,
      updated_at = now()
  where id = v_invitation.id;

  -- 5. Determine if provider representative has already signed
  select exists (
    select 1 from public.agreement_signatures
    where agreement_id = v_agreement.id and party_role = 'provider_rep'
  ) into v_has_provider;

  if v_has_provider then
    -- Hard Guard: Transition to active REQUIRES valid executed_pdf_path and 64-char SHA-256 hash
    if p_executed_pdf_path is null or p_executed_pdf_path = '' or p_executed_hash_sha256 is null or p_executed_hash_sha256 !~ '^[0-9a-f]{64}$' then
      raise exception 'active_status_requires_valid_executed_evidence';
    end if;

    v_new_status := 'active';
    update public.agreement_records
    set status = v_new_status,
        executed_at = now(),
        executed_hash_sha256 = p_executed_hash_sha256,
        executed_pdf_path = p_executed_pdf_path,
        updated_at = now()
    where id = v_agreement.id;

    -- Handle variation superseding if this was a variation
    v_prior_agreement_id := (v_agreement.compiled_clauses->>'variation_of_agreement_id')::uuid;
    if v_prior_agreement_id is not null then
      update public.agreement_records
      set status = 'superseded',
          superseded_by_id = v_agreement.id,
          updated_at = now()
      where id = v_prior_agreement_id
        and status in ('active', 'fully_signed');
    end if;
  else
    v_new_status := 'partially_signed';
    update public.agreement_records
    set status = v_new_status,
        updated_at = now()
    where id = v_agreement.id;
  end if;

  return jsonb_build_object(
    'ok', true,
    'signature_id', v_sig_id,
    'agreement_status', v_new_status,
    'is_fully_signed', (v_new_status = 'active')
  );
end;
$$;

-- 6. Atomic PostgreSQL RPC for provider counter-signing / internal execution finalization
create or replace function public.execute_provider_agreement_signature(
  p_agreement_id uuid,
  p_signer_name text,
  p_signer_title text,
  p_signer_email text,
  p_signing_method text,
  p_signature_image_data text,
  p_ip_address text,
  p_user_agent text,
  p_executed_pdf_path text,
  p_executed_hash_sha256 text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_agreement record;
  v_has_recipient boolean;
  v_sig_id uuid;
  v_prior_agreement_id uuid;
begin
  -- 1. Lock agreement record
  select * into v_agreement
  from public.agreement_records
  where id = p_agreement_id
  for update;

  if not found or v_agreement.status in ('superseded', 'terminated', 'expired') then
    return jsonb_build_object('ok', false, 'error', 'Agreement not found or cannot be signed.');
  end if;

  -- 2. Insert provider signature
  insert into public.agreement_signatures (
    agreement_id,
    party_role,
    signer_name,
    signer_title,
    signer_email,
    signing_method,
    signature_image_data,
    ip_address,
    user_agent,
    signed_at,
    is_verified
  ) values (
    p_agreement_id,
    'provider_rep',
    p_signer_name,
    p_signer_title,
    p_signer_email,
    p_signing_method,
    p_signature_image_data,
    p_ip_address,
    p_user_agent,
    now(),
    true
  ) returning id into v_sig_id;

  -- 3. Check if recipient (worker or participant) has signed
  select exists (
    select 1 from public.agreement_signatures
    where agreement_id = p_agreement_id
      and party_role in ('participant', 'guardian', 'worker', 'contractor')
  ) into v_has_recipient;

  if v_has_recipient then
    -- Hard Guard: Active status requires authoritative executed evidence
    if p_executed_pdf_path is null or p_executed_pdf_path = '' or p_executed_hash_sha256 is null or p_executed_hash_sha256 !~ '^[0-9a-f]{64}$' then
      raise exception 'active_status_requires_valid_executed_evidence';
    end if;

    update public.agreement_records
    set status = 'active',
        executed_at = now(),
        executed_hash_sha256 = p_executed_hash_sha256,
        executed_pdf_path = p_executed_pdf_path,
        updated_at = now()
    where id = p_agreement_id;

    -- Supersede prior if variation
    v_prior_agreement_id := (v_agreement.compiled_clauses->>'variation_of_agreement_id')::uuid;
    if v_prior_agreement_id is not null then
      update public.agreement_records
      set status = 'superseded',
          superseded_by_id = p_agreement_id,
          updated_at = now()
      where id = v_prior_agreement_id
        and status in ('active', 'fully_signed');
    end if;

    return jsonb_build_object('ok', true, 'signature_id', v_sig_id, 'agreement_status', 'active', 'is_fully_signed', true);
  else
    update public.agreement_records
    set status = 'partially_signed',
        updated_at = now()
    where id = p_agreement_id;

    return jsonb_build_object('ok', true, 'signature_id', v_sig_id, 'agreement_status', 'partially_signed', 'is_fully_signed', false);
  end if;
end;
$$;

-- 7. Hard Security Definer Lockdown: Explicitly revoke execute from PUBLIC, anon, and authenticated
revoke all on function public.execute_external_agreement_signature(text, text, text, text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.execute_external_agreement_signature(text, text, text, text, text, text, text, text, text) to service_role;

revoke all on function public.execute_provider_agreement_signature(uuid, text, text, text, text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.execute_provider_agreement_signature(uuid, text, text, text, text, text, text, text, text, text) to service_role;
