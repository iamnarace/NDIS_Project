-- ============================================================================
-- OPUS CARE — PHASE A: PARTICIPANT PORTAL AUTH + CARE FOUNDATION
-- Migration: Phase A - Portal Auth, Goals, Support Plans, Risk Assessments
-- Applied: Supabase project wqykzdodzcfwpgitnisx (ap-southeast-2 Sydney)
-- ============================================================================

-- ============================================================================
-- A1. EXTEND PROFILES ROLE TO INCLUDE PARTICIPANT & WORKER PORTAL ROLES
-- ============================================================================

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('admin', 'manager', 'coordinator', 'staff', 'participant', 'worker'));

-- Link portal user → participant record
alter table public.profiles
  add column if not exists portal_participant_id uuid references public.participants(id) on delete set null;

-- Link portal user → staff record
alter table public.profiles
  add column if not exists portal_staff_id uuid references public.staff(id) on delete set null;

-- ============================================================================
-- A2. PARTICIPANT PORTAL RLS HELPER FUNCTIONS
-- ============================================================================

create or replace function public.is_portal_participant()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and is_active = true
      and role = 'participant'
  );
$$;

create or replace function public.my_participant_id()
returns uuid
language sql
security definer
stable
as $$
  select portal_participant_id from public.profiles
  where id = auth.uid()
  limit 1;
$$;

create or replace function public.is_portal_worker()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and is_active = true
      and role = 'worker'
  );
$$;

-- ============================================================================
-- A3. PARTICIPANT GOALS
-- ============================================================================

create table if not exists public.participant_goals (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  goal_title text not null,
  goal_description text,
  category text not null default 'General'
    check (category in ('Daily Living', 'Community Participation', 'Employment', 'Health & Wellbeing', 'Social', 'Capacity Building', 'General')),
  status text not null default 'active'
    check (status in ('active', 'achieved', 'paused', 'discontinued')),
  target_date date,
  achieved_date date,
  review_date date,
  priority integer not null default 3 check (priority between 1 and 5),
  ndis_domain text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.goal_progress_notes (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.participant_goals(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  progress_text text not null,
  rating integer check (rating between 1 and 5),
  shift_id uuid references public.shifts(id) on delete set null,
  progress_note_id uuid,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- ============================================================================
-- A4. VERSIONED SUPPORT PLANS
-- ============================================================================

create table if not exists public.participant_support_plans (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  plan_title text not null default 'Support Plan',
  version integer not null default 1,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'superseded', 'archived')),
  primary_disability text,
  secondary_conditions text,
  communication_method text,
  preferred_name text,
  cultural_background text,
  language_preference text default 'English',
  morning_routine text,
  personal_care_needs text,
  mobility_aids text,
  medication_details text,
  dietary_requirements text,
  behaviour_support_required boolean default false,
  behaviour_support_plan_ref text,
  triggers_and_responses text,
  de_escalation_strategies text,
  linked_goal_ids jsonb default '[]',
  plan_start_date date,
  plan_end_date date,
  review_date date,
  created_by uuid references public.profiles(id),
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- A5. RISK ASSESSMENTS
-- ============================================================================

create table if not exists public.risk_assessments (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  assessment_title text not null default 'Risk Assessment',
  version integer not null default 1,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'superseded', 'archived')),
  falls_and_mobility jsonb,
  medication_risks jsonb,
  behaviour_and_mental_health jsonb,
  environmental_hazards jsonb,
  community_access_risks jsonb,
  fire_and_emergency jsonb,
  financial_exploitation jsonb,
  other_risks jsonb default '[]',
  overall_risk_rating text check (overall_risk_rating in ('Low', 'Medium', 'High', 'Extreme')),
  review_date date,
  created_by uuid references public.profiles(id),
  reviewed_by uuid references public.profiles(id),
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- A6. EMERGENCY & WORKER INSTRUCTIONS — extend participants
-- ============================================================================

alter table public.participants
  add column if not exists emergency_contact_relation text,
  add column if not exists emergency_contact_email text,
  add column if not exists secondary_emergency_name text,
  add column if not exists secondary_emergency_phone text,
  add column if not exists secondary_emergency_relation text,
  add column if not exists medical_alert text,
  add column if not exists allergies text,
  add column if not exists worker_instructions text,
  add column if not exists communication_preferences text,
  add column if not exists safe_messaging_flag boolean default false,
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null;

-- ============================================================================
-- A7. PORTAL SESSION TRACKING
-- ============================================================================

create table if not exists public.portal_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  participant_id uuid references public.participants(id) on delete cascade,
  role text not null,
  ip_address inet,
  user_agent text,
  created_at timestamptz default now(),
  last_active_at timestamptz default now()
);

-- ============================================================================
-- A8. ENABLE RLS
-- ============================================================================

alter table public.participant_goals enable row level security;
alter table public.goal_progress_notes enable row level security;
alter table public.participant_support_plans enable row level security;
alter table public.risk_assessments enable row level security;
alter table public.portal_sessions enable row level security;

-- ============================================================================
-- A9–A15. RLS POLICIES
-- ============================================================================

-- Goals: Staff full access
drop policy if exists "Staff manage goals" on public.participant_goals;
create policy "Staff manage goals" on public.participant_goals
  for all using (public.is_opus_staff());

-- Goals: Participant self-view
drop policy if exists "Participant view own goals" on public.participant_goals;
create policy "Participant view own goals" on public.participant_goals
  for select using (
    participant_id = public.my_participant_id()
    and public.is_portal_participant()
  );

-- Goals: Worker view assigned
drop policy if exists "Worker view assigned participant goals" on public.participant_goals;
create policy "Worker view assigned participant goals" on public.participant_goals
  for select using (
    public.is_portal_worker()
    and exists (
      select 1 from public.shift_assignments sa
      join public.shifts s on s.id = sa.shift_id
      join public.staff st on st.id = sa.staff_id
      join public.profiles p on p.portal_staff_id = st.id
      where s.participant_id = participant_goals.participant_id
        and p.id = auth.uid()
    )
  );

-- Goal progress notes
drop policy if exists "Staff manage goal progress" on public.goal_progress_notes;
create policy "Staff manage goal progress" on public.goal_progress_notes
  for all using (public.is_opus_staff());

drop policy if exists "Participant view own goal progress" on public.goal_progress_notes;
create policy "Participant view own goal progress" on public.goal_progress_notes
  for select using (
    participant_id = public.my_participant_id()
    and public.is_portal_participant()
  );

-- Support plans
drop policy if exists "Staff manage support plans" on public.participant_support_plans;
create policy "Staff manage support plans" on public.participant_support_plans
  for all using (public.is_opus_staff());

drop policy if exists "Participant view own support plan" on public.participant_support_plans;
create policy "Participant view own support plan" on public.participant_support_plans
  for select using (
    participant_id = public.my_participant_id()
    and public.is_portal_participant()
    and status = 'active'
  );

drop policy if exists "Worker view assigned support plans" on public.participant_support_plans;
create policy "Worker view assigned support plans" on public.participant_support_plans
  for select using (
    public.is_portal_worker()
    and status = 'active'
    and exists (
      select 1 from public.shift_assignments sa
      join public.shifts s on s.id = sa.shift_id
      join public.staff st on st.id = sa.staff_id
      join public.profiles p on p.portal_staff_id = st.id
      where s.participant_id = participant_support_plans.participant_id
        and p.id = auth.uid()
    )
  );

-- Risk assessments
drop policy if exists "Staff manage risk assessments" on public.risk_assessments;
create policy "Staff manage risk assessments" on public.risk_assessments
  for all using (public.is_opus_staff());

drop policy if exists "Worker view assigned risk assessments" on public.risk_assessments;
create policy "Worker view assigned risk assessments" on public.risk_assessments
  for select using (
    public.is_portal_worker()
    and status = 'active'
    and exists (
      select 1 from public.shift_assignments sa
      join public.shifts s on s.id = sa.shift_id
      join public.staff st on st.id = sa.staff_id
      join public.profiles p on p.portal_staff_id = st.id
      where s.participant_id = risk_assessments.participant_id
        and p.id = auth.uid()
    )
  );

-- Participants: self-view for portal user
drop policy if exists "Participant view own record" on public.participants;
create policy "Participant view own record" on public.participants
  for select using (
    auth_user_id = auth.uid()
    and public.is_portal_participant()
  );

drop policy if exists "Worker view assigned participants" on public.participants;
create policy "Worker view assigned participants" on public.participants
  for select using (
    public.is_portal_worker()
    and exists (
      select 1 from public.shift_assignments sa
      join public.shifts s on s.id = sa.shift_id
      join public.staff st on st.id = sa.staff_id
      join public.profiles p on p.portal_staff_id = st.id
      where s.participant_id = participants.id
        and p.id = auth.uid()
    )
  );

-- Portal sessions
drop policy if exists "User view own sessions" on public.portal_sessions;
create policy "User view own sessions" on public.portal_sessions
  for select using (user_id = auth.uid());

drop policy if exists "Staff manage sessions" on public.portal_sessions;
create policy "Staff manage sessions" on public.portal_sessions
  for all using (public.is_opus_staff());

-- Workers view own assigned shifts
drop policy if exists "Worker view own shifts" on public.shift_assignments;
create policy "Worker view own shifts" on public.shift_assignments
  for select using (
    public.is_portal_worker()
    and exists (
      select 1 from public.staff st
      join public.profiles p on p.portal_staff_id = st.id
      where st.id = shift_assignments.staff_id
        and p.id = auth.uid()
    )
  );

-- ============================================================================
-- A16. PERFORMANCE INDEXES
-- ============================================================================

create index if not exists idx_participant_goals_participant_id on public.participant_goals(participant_id);
create index if not exists idx_goal_progress_goal_id on public.goal_progress_notes(goal_id);
create index if not exists idx_support_plans_participant_id on public.participant_support_plans(participant_id);
create index if not exists idx_risk_assessments_participant_id on public.risk_assessments(participant_id);
create index if not exists idx_participants_auth_user_id on public.participants(auth_user_id);
create index if not exists idx_profiles_portal_participant_id on public.profiles(portal_participant_id);
create index if not exists idx_profiles_portal_staff_id on public.profiles(portal_staff_id);
create index if not exists idx_portal_sessions_user_id on public.portal_sessions(user_id);
