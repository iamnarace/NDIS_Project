-- ============================================================================
-- GOVERNANCE G5: WHS, HOME SAFETY, TRANSPORT & CONTINUITY
-- ============================================================================

-- 1. Enhance risk_assessments with Home & Community WHS fields
alter table public.risk_assessments
  add column if not exists whs_type text default 'home_and_community',
  add column if not exists service_location_type text default 'participant_home',
  add column if not exists access_parking_hazards text,
  add column if not exists slips_trips_hazards text,
  add column if not exists manual_handling_hazards text,
  add column if not exists mobility_transfer_hazards text,
  add column if not exists smoking_smoke_exposure text,
  add column if not exists pets_animals text,
  add column if not exists aggression_security_concerns text,
  add column if not exists sharps_infection_risks text,
  add column if not exists electrical_fire_hazards text,
  add column if not exists bathroom_toileting_access text,
  add column if not exists communication_network_coverage text,
  add column if not exists lone_worker_controls text,
  add column if not exists emergency_evacuation_plan text,
  add column if not exists participant_specific_whs_controls jsonb default '[]'::jsonb,
  add column if not exists worker_safety_instructions text,
  add column if not exists whs_signed_off_at timestamptz,
  add column if not exists whs_signed_off_by text;

-- 2. Enhance shifts with Lone-Worker and Transport Accounting
alter table public.shifts
  add column if not exists lone_worker_checkin_required boolean default false,
  add column if not exists checkin_at timestamptz,
  add column if not exists checkout_at timestamptz,
  add column if not exists expected_finish_at timestamptz,
  add column if not exists welfare_status text default 'pending',
  add column if not exists welfare_notes text,
  add column if not exists escalation_timestamp timestamptz,
  add column if not exists escalation_contacted text,
  add column if not exists welfare_resolved_by text,
  add column if not exists transport_included boolean default false,
  add column if not exists transport_distance_km numeric(6,2) default 0,
  add column if not exists activity_based_transport_billed boolean default false,
  add column if not exists activity_based_transport_amount numeric(10,2) default 0,
  add column if not exists provider_travel_labour_billed boolean default false,
  add column if not exists provider_travel_labour_minutes integer default 0,
  add column if not exists provider_travel_labour_amount numeric(10,2) default 0,
  add column if not exists provider_travel_non_labour_amount numeric(10,2) default 0,
  add column if not exists employee_mileage_reimbursement_km numeric(6,2) default 0,
  add column if not exists employee_mileage_reimbursement_amount numeric(10,2) default 0,
  add column if not exists transport_vehicle_registration text,
  add column if not exists transport_driver_licence_verified boolean default false;

-- 3. Create Participant Money Transactions Table
create table if not exists public.participant_money_transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_reference text unique not null,
  participant_id uuid not null references public.participants(id) on delete cascade,
  worker_id uuid references public.staff(id) on delete set null,
  shift_id uuid references public.shifts(id) on delete set null,
  transaction_date date not null default current_date,
  purpose text not null,
  amount numeric(10,2) not null check (amount > 0),
  payment_method text not null default 'cash',
  receipt_obtained boolean default false,
  receipt_number text,
  receipt_url text,
  participant_authority_confirmed boolean default false,
  reconciled boolean default false,
  reconciled_at timestamptz,
  reconciled_by text,
  discrepancy_notes text,
  prohibited_conduct_acknowledged boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. Create Emergency & Business Continuity Plans Table
create table if not exists public.emergency_continuity_plans (
  id uuid primary key default gen_random_uuid(),
  plan_reference text unique not null,
  scope_type text not null default 'participant_specific',
  participant_id uuid references public.participants(id) on delete cascade,
  region text default 'All',
  title text not null,
  service_priority text default 'P2_essential_support',
  emergency_contacts jsonb default '[]'::jsonb,
  critical_dependencies text,
  evacuation_safe_location text,
  alternate_worker_plan text,
  disruption_scenarios jsonb default '[]'::jsonb,
  continuity_checklists jsonb default '[]'::jsonb,
  status text default 'active',
  last_reviewed_at timestamptz default now(),
  next_review_due date,
  reviewed_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.participant_money_transactions enable row level security;
alter table public.emergency_continuity_plans enable row level security;

-- Policies for participant_money_transactions
drop policy if exists "Staff full access on participant_money_transactions" on public.participant_money_transactions;
create policy "Staff full access on participant_money_transactions" on public.participant_money_transactions
  for all using (public.is_opus_staff()) with check (public.is_opus_staff());

drop policy if exists "Workers read own shift money transactions" on public.participant_money_transactions;
create policy "Workers read own shift money transactions" on public.participant_money_transactions
  for select using (
    public.is_portal_worker() and (
      worker_id in (select portal_staff_id from public.profiles where id = auth.uid())
    )
  );

drop policy if exists "Workers insert own shift money transactions" on public.participant_money_transactions;
create policy "Workers insert own shift money transactions" on public.participant_money_transactions
  for insert with check (
    public.is_portal_worker() or public.is_opus_staff()
  );

-- Policies for emergency_continuity_plans
drop policy if exists "Staff full access on emergency_continuity_plans" on public.emergency_continuity_plans;
create policy "Staff full access on emergency_continuity_plans" on public.emergency_continuity_plans
  for all using (public.is_opus_staff()) with check (public.is_opus_staff());

drop policy if exists "Workers read assigned participant emergency plans" on public.emergency_continuity_plans;
create policy "Workers read assigned participant emergency plans" on public.emergency_continuity_plans
  for select using (
    public.is_portal_worker() and (
      scope_type = 'participant_specific' and
      participant_id in (
        select s.participant_id from public.shifts s
        join public.shift_assignments sa on sa.shift_id = s.id
        join public.profiles p on p.portal_staff_id = sa.staff_id
        where p.id = auth.uid()
      )
    )
  );
