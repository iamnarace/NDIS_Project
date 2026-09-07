-- ============================================================================
-- OPUS CARE SUPPORT SERVICES — NDIS OPERATIONS CRM SCHEMA
-- Database: PostgreSQL (Supabase Sydney Region: ap-southeast-2)
-- Architecture: UUID Internal Keys + Human Reference Numbers + Strict Staff RLS
-- ============================================================================

-- Enable pgcrypto for UUID generation
create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. PROFILES & ROLES (Admin, Operations Manager, Support Coordinator, Staff)
-- ============================================================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text not null,
  role text not null default 'staff' check (role in ('admin', 'manager', 'coordinator', 'staff')),
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Helper security function: Check if current caller is active Opus Care staff
create or replace function public.is_opus_staff()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and is_active = true
      and role in ('admin', 'manager', 'coordinator', 'staff')
  );
$$;

-- Helper security function: Check if current caller is Opus Care admin/manager
create or replace function public.is_opus_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and is_active = true
      and role in ('admin', 'manager')
  );
$$;

-- ============================================================================
-- 2. SEQUENCES FOR HUMAN-FRIENDLY DISPLAY IDENTIFIERS
-- ============================================================================
create sequence if not exists public.referral_seq start 101;
create sequence if not exists public.participant_seq start 21;

-- ============================================================================
-- 3. REFERRALS (Inbound pipeline from website & coordinators)
-- ============================================================================
create table if not exists public.referrals (
  id uuid default gen_random_uuid() primary key,
  reference_number text unique not null default ('REF-' || lpad(nextval('public.referral_seq'::regclass)::text, 5, '0')),
  referrer_name text not null,
  referrer_role text not null default 'Participant',
  phone text not null,
  email text not null,
  participant_name text not null,
  suburb text not null,
  funding_type text not null default 'Plan-Managed',
  services text not null,
  schedule_preference text default 'Flexible',
  notes text,
  status text not null default 'new' 
    check (status in ('new', 'contacted', 'assessment', 'agreement_sent', 'accepted', 'closed')),
  assigned_to uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- 4. PARTICIPANTS (Active NDIS Clients)
-- ============================================================================
create table if not exists public.participants (
  id uuid default gen_random_uuid() primary key,
  reference_number text unique not null default ('PAR-' || lpad(nextval('public.participant_seq'::regclass)::text, 5, '0')),
  referral_id uuid references public.referrals(id),
  full_name text not null,
  ndis_number text,
  date_of_birth date,
  phone text,
  email text,
  street_address text,
  suburb text not null,
  postcode text,
  funding_type text not null default 'Plan-Managed' check (funding_type in ('Plan-Managed', 'Self-Managed', 'NDIA-Managed')),
  plan_manager_name text,
  plan_manager_email text,
  support_coordinator_name text,
  support_coordinator_phone text,
  allocated_weekly_hours numeric(5,2) default 0.0,
  emergency_contact_name text,
  emergency_contact_phone text,
  status text not null default 'active' check (status in ('active', 'on_hold', 'discharged')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- 5. STAKEHOLDER CONTACTS (Plan Managers, Coordinators, Nominees)
-- ============================================================================
create table if not exists public.contacts (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  role text not null check (role in ('Support Coordinator', 'Plan Manager', 'Family / Nominee', 'Allied Health', 'Other')),
  organization_name text,
  email text,
  phone text,
  notes text,
  created_at timestamptz default now()
);

-- Junction table linking contacts to participants
create table if not exists public.participant_contacts (
  id uuid default gen_random_uuid() primary key,
  participant_id uuid references public.participants(id) on delete cascade not null,
  contact_id uuid references public.contacts(id) on delete cascade not null,
  relationship_label text, -- e.g. 'Primary Support Coordinator', 'Mother / Nominee'
  unique(participant_id, contact_id)
);

-- ============================================================================
-- 6. ACTIVITIES & CASE NOTES (Timeline Audit Trail)
-- ============================================================================
create table if not exists public.activities (
  id uuid default gen_random_uuid() primary key,
  participant_id uuid references public.participants(id) on delete cascade,
  referral_id uuid references public.referrals(id) on delete cascade,
  author_id uuid references public.profiles(id),
  author_name text not null default 'Opus Staff',
  activity_type text not null check (activity_type in ('note', 'call', 'email', 'meeting', 'status_change')),
  title text not null,
  description text,
  created_at timestamptz default now()
);

-- ============================================================================
-- 7. TASKS & COMPLIANCE REMINDERS
-- ============================================================================
create table if not exists public.tasks (
  id uuid default gen_random_uuid() primary key,
  participant_id uuid references public.participants(id) on delete cascade,
  referral_id uuid references public.referrals(id) on delete cascade,
  title text not null,
  due_date date,
  is_completed boolean not null default false,
  assigned_to uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- ============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.referrals enable row level security;
alter table public.participants enable row level security;
alter table public.contacts enable row level security;
alter table public.participant_contacts enable row level security;
alter table public.activities enable row level security;
alter table public.tasks enable row level security;

-- Drop existing policies if re-running script cleanly
drop policy if exists "Staff view profiles" on public.profiles;
drop policy if exists "Admin manage profiles" on public.profiles;
drop policy if exists "Public insert referral" on public.referrals;
drop policy if exists "Staff view referrals" on public.referrals;
drop policy if exists "Staff update referrals" on public.referrals;
drop policy if exists "Staff manage participants" on public.participants;
drop policy if exists "Staff manage contacts" on public.contacts;
drop policy if exists "Staff manage participant_contacts" on public.participant_contacts;
drop policy if exists "Staff manage activities" on public.activities;
drop policy if exists "Staff manage tasks" on public.tasks;

-- Profiles: Staff can view; Admins can manage
create policy "Staff view profiles" on public.profiles
  for select using (public.is_opus_staff());

create policy "Admin manage profiles" on public.profiles
  for all using (public.is_opus_admin());

-- Referrals: Public can INSERT only (intake); verified staff can view & update
create policy "Public insert referral" on public.referrals
  for insert with check (true);

create policy "Staff view referrals" on public.referrals
  for select using (public.is_opus_staff());

create policy "Staff update referrals" on public.referrals
  for update using (public.is_opus_staff());

-- Participants & Contacts: Verified Opus Care Staff only
create policy "Staff manage participants" on public.participants
  for all using (public.is_opus_staff());

create policy "Staff manage contacts" on public.contacts
  for all using (public.is_opus_staff());

create policy "Staff manage participant_contacts" on public.participant_contacts
  for all using (public.is_opus_staff());

create policy "Staff manage activities" on public.activities
  for all using (public.is_opus_staff());

create policy "Staff manage tasks" on public.tasks
  for all using (public.is_opus_staff());

-- ============================================================================
-- 9. TRAINING COURSES (Admin-created course library)
-- ============================================================================
create table if not exists public.training_courses (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  course_type text not null default 'read_acknowledge'
    check (course_type in ('read_acknowledge', 'read_quiz', 'external_cert')),
  material_type text not null default 'none'
    check (material_type in ('pdf', 'ppt', 'link', 'none')),
  material_url text,
  quiz_questions jsonb,       -- [{question, options:[...], correct_index}, ...]
  pass_mark_pct integer not null default 80
    check (pass_mark_pct between 1 and 100),
  validity_months integer,    -- null = no expiry
  is_mandatory boolean not null default false,
  certificate_enabled boolean not null default true,
  max_attempts integer,       -- null = unlimited
  is_active boolean not null default true,
  created_by text not null default 'Admin',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- 10. TRAINING ASSIGNMENTS (Admin assigns courses to staff)
-- ============================================================================
create table if not exists public.training_assignments (
  id uuid default gen_random_uuid() primary key,
  course_id uuid references public.training_courses(id) on delete cascade not null,
  staff_id text not null,     -- references staff.id (UUID or STF-xxx fallback)
  staff_name text,
  assigned_by text not null default 'Admin',
  due_date date,
  assigned_at timestamptz default now(),
  unique(course_id, staff_id)
);

-- ============================================================================
-- 11. TRAINING COMPLETIONS (Successful completion records with certificates)
-- ============================================================================
create table if not exists public.training_completions (
  id uuid default gen_random_uuid() primary key,
  course_id uuid references public.training_courses(id) on delete cascade not null,
  assignment_id uuid references public.training_assignments(id) on delete set null,
  staff_id text not null,
  staff_name text,
  completed_at timestamptz default now(),
  quiz_score_pct integer,
  passed boolean not null default true,
  expires_at timestamptz,     -- null if no validity period
  -- Internal certificate fields
  certificate_id text unique, -- e.g. OC-TRN-2026-00142
  certificate_issue_date date,
  -- External certificate fields (for accredited/NDIS Commission courses)
  external_issuer text,
  external_expiry_date date,
  cert_file_name text,
  cert_storage_path text,
  notes text,
  created_at timestamptz default now(),
  unique(course_id, staff_id)
);

-- Sequence for human-readable certificate IDs
create sequence if not exists public.training_cert_seq start 1001;

-- ============================================================================
-- 12. TRAINING ATTEMPTS (Every quiz attempt, pass or fail)
-- ============================================================================
create table if not exists public.training_attempts (
  id uuid default gen_random_uuid() primary key,
  assignment_id uuid references public.training_assignments(id) on delete cascade,
  course_id uuid references public.training_courses(id) on delete cascade not null,
  staff_id text not null,
  answers jsonb not null default '{}', -- {q_index: chosen_option_index}
  score_pct integer not null default 0,
  passed boolean not null default false,
  attempted_at timestamptz default now()
);

-- ============================================================================
-- 13. RLS POLICIES FOR TRAINING TABLES
-- ============================================================================
alter table public.training_courses enable row level security;
alter table public.training_assignments enable row level security;
alter table public.training_completions enable row level security;
alter table public.training_attempts enable row level security;

-- Courses: any authenticated staff can read active courses; only admin can manage
drop policy if exists "Staff read active courses" on public.training_courses;
drop policy if exists "Admin manage courses" on public.training_courses;

create policy "Staff read active courses" on public.training_courses
  for select using (is_active = true and public.is_opus_staff());

create policy "Admin manage courses" on public.training_courses
  for all using (public.is_opus_admin());

-- Assignments: staff can read own; admin can manage all
drop policy if exists "Staff read own assignments" on public.training_assignments;
drop policy if exists "Admin manage assignments" on public.training_assignments;

create policy "Staff read own assignments" on public.training_assignments
  for select using (staff_id = current_setting('request.jwt.claims', true)::json->>'sub' or public.is_opus_admin());

create policy "Admin manage assignments" on public.training_assignments
  for all using (public.is_opus_admin());

-- Completions: staff can read own; admin can read all; insertions controlled server-side
drop policy if exists "Staff read own completions" on public.training_completions;
drop policy if exists "Admin manage completions" on public.training_completions;

create policy "Staff read own completions" on public.training_completions
  for select using (staff_id = current_setting('request.jwt.claims', true)::json->>'sub' or public.is_opus_admin());

create policy "Admin manage completions" on public.training_completions
  for all using (public.is_opus_admin());

-- Attempts: staff can read own; admin can read all
drop policy if exists "Staff read own attempts" on public.training_attempts;
drop policy if exists "Admin manage attempts" on public.training_attempts;

create policy "Staff read own attempts" on public.training_attempts
  for select using (staff_id = current_setting('request.jwt.claims', true)::json->>'sub' or public.is_opus_admin());

create policy "Admin manage attempts" on public.training_attempts
  for all using (public.is_opus_admin());

-- ============================================================================
-- 14. CURATED FREE EXTERNAL TRAINING LIBRARY
-- ============================================================================
create table if not exists public.external_courses (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  provider text not null,
  category text not null,
  description text not null,
  cost text not null default 'Free',
  certificate_type text not null default 'Official Certificate',
  target_audience text not null default 'All Workers',
  duration_text text,
  url text not null,
  last_verified date default current_date,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

alter table public.external_courses enable row level security;

create policy "Anyone can read active external courses" on public.external_courses
  for select using (is_active = true);

create policy "Admin manage external courses" on public.external_courses
  for all using (public.is_opus_admin());


