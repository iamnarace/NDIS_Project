-- Keep private document objects behind authorised staff/server access and make
-- executed agreement evidence immutable.

drop policy if exists "Staff manage crm-documents storage" on storage.objects;
create policy "Authorised staff manage crm-documents storage"
  on storage.objects for all to authenticated
  using (bucket_id = 'crm-documents' and public.is_opus_staff())
  with check (bucket_id = 'crm-documents' and public.is_opus_staff());

create or replace function public.protect_executed_agreement()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    if old.status in ('fully_signed','active','superseded','expired','terminated') then
      raise exception 'executed_agreement_is_immutable';
    end if;
    return old;
  end if;

  if old.status in ('fully_signed','active','superseded','expired','terminated')
     and (
       new.template_id is distinct from old.template_id
       or new.template_version is distinct from old.template_version
       or new.document_pack_id is distinct from old.document_pack_id
       or new.owner_type is distinct from old.owner_type
       or new.owner_id is distinct from old.owner_id
       or new.title is distinct from old.title
       or new.version_number is distinct from old.version_number
       or new.questionnaire_data is distinct from old.questionnaire_data
       or new.compiled_clauses is distinct from old.compiled_clauses
       or new.commencement_date is distinct from old.commencement_date
       or new.review_date is distinct from old.review_date
       or new.expiry_date is distinct from old.expiry_date
       or new.estimated_budget is distinct from old.estimated_budget
       or new.draft_pdf_path is distinct from old.draft_pdf_path
       or new.executed_pdf_path is distinct from old.executed_pdf_path
       or new.executed_hash_sha256 is distinct from old.executed_hash_sha256
       or new.executed_at is distinct from old.executed_at
       or new.created_by is distinct from old.created_by
       or new.created_at is distinct from old.created_at
     ) then
    raise exception 'executed_agreement_is_immutable';
  end if;
  return new;
end
$$;

drop trigger if exists protect_executed_agreement on public.agreement_records;
create trigger protect_executed_agreement
before update or delete on public.agreement_records
for each row execute function public.protect_executed_agreement();

create or replace function public.protect_agreement_signature()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'agreement_signature_is_immutable';
end
$$;

drop trigger if exists protect_agreement_signature on public.agreement_signatures;
create trigger protect_agreement_signature
before update or delete on public.agreement_signatures
for each row execute function public.protect_agreement_signature();

revoke all on function public.protect_executed_agreement() from public, anon, authenticated;
revoke all on function public.protect_agreement_signature() from public, anon, authenticated;
