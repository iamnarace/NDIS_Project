-- ============================================================================
-- GOVERNANCE G4: COMPLAINTS, INCIDENTS & SAFEGUARDING
-- ============================================================================

-- 1. Add G4 columns to complaints
alter table public.complaints
  add column if not exists is_anonymous boolean default false,
  add column if not exists advocate_name text,
  add column if not exists advocate_relationship text,
  add column if not exists advocate_contact text,
  add column if not exists accessibility_communication_needs text,
  add column if not exists urgency text default 'Medium',
  add column if not exists category text default 'service_delivery',
  add column if not exists response_target_date date,
  add column if not exists safeguarding_lead_notes text;

-- 2. Add G4 columns to incidents
alter table public.incidents
  add column if not exists safeguarding_indicators jsonb default '[]'::jsonb,
  add column if not exists management_regulatory_review_stop boolean default false,
  add column if not exists external_reporting_duty text default 'management_assessment_required',
  add column if not exists external_reporting_rationale text,
  add column if not exists bsp_reference text,
  add column if not exists bsp_practitioner text,
  add column if not exists open_disclosure_provided boolean default false,
  add column if not exists open_disclosure_notes text,
  add column if not exists safeguarding_lead_reviewed_at timestamptz,
  add column if not exists safeguarding_lead_reviewed_by text;

-- 3. Add G4 columns to corrective_actions
alter table public.corrective_actions
  add column if not exists verified_by text,
  add column if not exists verification_date date,
  add column if not exists review_result text;

-- 4. Restrictive Practice and Closure Safety Trigger Function
create or replace function public.guard_incident_safeguarding_closure()
returns trigger as $$
declare
  indicators jsonb;
  has_critical_indicator boolean;
begin
  indicators := coalesce(NEW.safeguarding_indicators, '[]'::jsonb);

  -- Restrictive practice boundary enforcement
  if (indicators ? 'restrictive_practice_concern') then
    NEW.management_regulatory_review_stop := true;
  end if;

  -- Closure guards
  if NEW.status = 'Closed' and (OLD.status is null or OLD.status != 'Closed') then
    -- Check high-risk safeguarding flags
    has_critical_indicator := (
      indicators ? 'abuse' or
      indicators ? 'neglect' or
      indicators ? 'exploitation' or
      indicators ? 'violence' or
      indicators ? 'sexual_misconduct' or
      indicators ? 'restrictive_practice_concern'
    );

    if (NEW.severity in ('High', 'Critical') or coalesce(NEW.management_regulatory_review_stop, false) = true or has_critical_indicator) then
      if NEW.manager_review is null or length(trim(NEW.manager_review)) < 5 then
        raise exception 'Governance guard: High/Critical severity and safeguarding incidents require documented manager review before closure.';
      end if;
      if NEW.safeguarding_lead_reviewed_at is null then
        raise exception 'Governance guard: Critical safeguarding incident requires Safeguarding Lead review sign-off before closure.';
      end if;
    end if;

    if NEW.closed_at is null then
      NEW.closed_at := now();
    end if;
  end if;

  return NEW;
end;
$$ language plpgsql;

drop trigger if exists trg_guard_incident_closure on public.incidents;
create trigger trg_guard_incident_closure
  before insert or update on public.incidents
  for each row execute function public.guard_incident_safeguarding_closure();

-- 5. Immutability: Prevent silent deletion of active or closed safeguarding governance records
create or replace function public.guard_safeguarding_record_immutability()
returns trigger as $$
begin
  if OLD.status in ('Under Review', 'Investigation', 'Corrective Action', 'Monitoring', 'Resolved', 'Closed') then
    raise exception 'Governance guard: Active or closed safeguarding records cannot be deleted. Use archival or redaction workflows.';
  end if;
  return OLD;
end;
$$ language plpgsql;

drop trigger if exists trg_prevent_incident_deletion on public.incidents;
create trigger trg_prevent_incident_deletion
  before delete on public.incidents
  for each row execute function public.guard_safeguarding_record_immutability();

drop trigger if exists trg_prevent_complaint_deletion on public.complaints;
create trigger trg_prevent_complaint_deletion
  before delete on public.complaints
  for each row execute function public.guard_safeguarding_record_immutability();

-- 6. RLS: Allow public/anonymous and participant complaint lodgement
drop policy if exists "Allow complaints insert" on public.complaints;
create policy "Allow complaints insert" on public.complaints
  for insert with check (true);

-- 7. Worker insert on incidents
drop policy if exists "Worker insert incident" on public.incidents;
create policy "Worker insert incident" on public.incidents
  for insert with check (
    public.is_opus_staff() or public.is_portal_worker()
  );
