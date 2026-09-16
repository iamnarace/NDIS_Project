-- Close the recipient-first signing integrity gap.
-- Material agreement terms remain editable only before an invitation or signature
-- exists. Lifecycle and execution-evidence fields continue to be controlled by the
-- existing signing RPCs and executed-agreement immutability trigger.

create or replace function public.protect_agreement_signing_snapshot()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_has_signing_evidence boolean;
begin
  if not (
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
  ) then
    return new;
  end if;

  select
    exists (
      select 1
      from public.agreement_signatures s
      where s.agreement_id = old.id
    )
    or exists (
      select 1
      from public.agreement_signing_invitations i
      where i.agreement_id = old.id
        and i.status in ('pending', 'viewed', 'signed')
    )
  into v_has_signing_evidence;

  if v_has_signing_evidence then
    raise exception 'agreement_material_terms_locked_after_signing_started';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_agreement_signing_snapshot on public.agreement_records;
create trigger protect_agreement_signing_snapshot
before update on public.agreement_records
for each row execute function public.protect_agreement_signing_snapshot();

revoke all on function public.protect_agreement_signing_snapshot() from public, anon, authenticated;
grant execute on function public.protect_agreement_signing_snapshot() to service_role;

