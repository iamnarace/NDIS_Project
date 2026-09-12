-- ============================================================================
-- GOVERNANCE G6: CLINICAL / HIGH-INTENSITY GOVERNANCE
-- ============================================================================

-- 1. Add Ahpra verification columns to staff
alter table public.staff
  add column if not exists ahpra_registration_number text,
  add column if not exists ahpra_profession text,
  add column if not exists ahpra_status text default 'Unverified',
  add column if not exists ahpra_verified_at timestamptz,
  add column if not exists ahpra_verified_by text,
  add column if not exists ahpra_expiry_date date,
  add column if not exists is_clinical_lead boolean default false;

-- 2. Create clinical_service_readiness table
create table if not exists public.clinical_service_readiness (
  id uuid primary key default gen_random_uuid(),
  service_id text unique not null,
  service_name text not null,
  governance_status text not null default 'GOVERNANCE_INCOMPLETE',
  clinical_lead_staff_id uuid references public.staff(id) on delete set null,
  clinical_lead_name text,
  clinical_lead_ahpra_number text,
  insurance_policy_reference text,
  insurance_verified boolean default false,
  clinical_governance_framework_doc_code text,
  activation_notes text,
  activated_at timestamptz,
  activated_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Create participant_clinical_plans table
create table if not exists public.participant_clinical_plans (
  id uuid primary key default gen_random_uuid(),
  plan_reference text unique not null,
  participant_id uuid not null references public.participants(id) on delete cascade,
  service_id text not null,
  plan_title text not null,
  treating_practitioner_name text not null,
  treating_practitioner_discipline text not null,
  treating_practitioner_contact text,
  plan_document_url text,
  issue_date date not null,
  review_date date not null,
  emergency_escalation_instructions text not null,
  contraindications_and_risks text not null,
  clinical_reviewer_name text,
  approval_status text not null default 'Pending Review',
  approved_at timestamptz,
  approved_by text,
  required_worker_competencies jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. Create participant_specific_competencies table
create table if not exists public.participant_specific_competencies (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.staff(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  clinical_plan_id uuid references public.participant_clinical_plans(id) on delete set null,
  task_type text not null,
  trainer_name text not null,
  trainer_qualification text not null,
  competency_status text not null default 'TRAINED_COMPETENT',
  achieved_date date not null default current_date,
  expiry_date date not null,
  evidence_reference text,
  emergency_protocols_assessed boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (worker_id, participant_id, task_type)
);

-- Seed initial fail-closed status for 3 conditional clinical services
insert into public.clinical_service_readiness (service_id, service_name, governance_status, activation_notes)
values 
  ('community_nursing', 'Community Nursing', 'GOVERNANCE_INCOMPLETE', 'Requires Clinical Lead RN verification and clinical insurance extension before activation.'),
  ('complex_bowel_care', 'Complex Bowel Care', 'GOVERNANCE_INCOMPLETE', 'Requires participant-specific care plan, treating practitioner oversight, and worker competency.'),
  ('urinary_catheter_management', 'Urinary Catheter Management', 'GOVERNANCE_INCOMPLETE', 'Requires participant-specific catheter plan, infection escalation protocol, and worker competency.')
on conflict (service_id) do nothing;

-- Enable RLS
alter table public.clinical_service_readiness enable row level security;
alter table public.participant_clinical_plans enable row level security;
alter table public.participant_specific_competencies enable row level security;

-- Policies for clinical_service_readiness
drop policy if exists "Staff full access on clinical_service_readiness" on public.clinical_service_readiness;
create policy "Staff full access on clinical_service_readiness" on public.clinical_service_readiness
  for all using (public.is_opus_staff()) with check (public.is_opus_staff());

-- Policies for participant_clinical_plans
drop policy if exists "Staff full access on participant_clinical_plans" on public.participant_clinical_plans;
create policy "Staff full access on participant_clinical_plans" on public.participant_clinical_plans
  for all using (public.is_opus_staff()) with check (public.is_opus_staff());

drop policy if exists "Workers read operational clinical plans for assigned participants" on public.participant_clinical_plans;
create policy "Workers read operational clinical plans for assigned participants" on public.participant_clinical_plans
  for select using (
    public.is_portal_worker() and (
      approval_status = 'Clinical Approved' and
      participant_id in (
        select s.participant_id from public.shifts s
        join public.shift_assignments sa on sa.shift_id = s.id
        join public.profiles p on p.portal_staff_id = sa.staff_id
        where p.id = auth.uid()
      )
    )
  );

-- Policies for participant_specific_competencies
drop policy if exists "Staff full access on participant_specific_competencies" on public.participant_specific_competencies;
create policy "Staff full access on participant_specific_competencies" on public.participant_specific_competencies
  for all using (public.is_opus_staff()) with check (public.is_opus_staff());

drop policy if exists "Workers read own participant competencies" on public.participant_specific_competencies;
create policy "Workers read own participant competencies" on public.participant_specific_competencies
  for select using (
    public.is_portal_worker() and (
      worker_id in (select portal_staff_id from public.profiles where id = auth.uid())
    )
  );
