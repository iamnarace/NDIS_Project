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

-- ============================================================================
-- WORKFORCE ROSTERING & SHIFT SCHEDULING (PHASE 1)
-- ============================================================================

create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  shift_reference text unique not null,
  participant_id uuid not null references public.participants(id) on delete cascade,
  service_type text not null,
  ndis_support_item_code text default '01_011_0107_1_1',
  start_time timestamptz not null,
  end_time timestamptz not null,
  hours numeric(4,2) not null,
  location_suburb text not null,
  location_address text,
  special_instructions text,
  status text not null default 'unassigned' check (status in ('unassigned', 'assigned', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.shift_assignments (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.shifts(id) on delete cascade,
  staff_id uuid not null references public.staff(id) on delete cascade,
  assigned_by text default 'Admin',
  assigned_at timestamptz default now(),
  confirmed_by_worker boolean default false,
  confirmed_at timestamptz,
  status text not null default 'rostered' check (status in ('rostered', 'confirmed', 'declined', 'clocked_in', 'clocked_out', 'completed', 'cancelled')),
  clock_in_at timestamptz,
  clock_out_at timestamptz,
  actual_hours numeric(4,2),
  worker_notes text,
  constraint unique_active_shift_assignment unique (shift_id, staff_id)
);

create table if not exists public.staff_availability (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  start_time time not null default '07:00',
  end_time time not null default '19:00',
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.staff_leave (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  leave_type text not null check (leave_type in ('annual', 'sick', 'unpaid', 'other')),
  status text not null default 'approved' check (status in ('pending', 'approved', 'rejected')),
  reason text,
  created_at timestamptz default now()
);

create table if not exists public.shift_progress_notes (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.shifts(id) on delete cascade,
  staff_id uuid not null references public.staff(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  note_text text not null,
  goals_supported text,
  incident_occurred boolean default false,
  created_at timestamptz default now()
);

alter table public.shifts enable row level security;
alter table public.shift_assignments enable row level security;
alter table public.staff_availability enable row level security;
alter table public.staff_leave enable row level security;
alter table public.shift_progress_notes enable row level security;

create policy "Allow all on shifts" on public.shifts for all using (true) with check (true);
create policy "Allow all on shift_assignments" on public.shift_assignments for all using (true) with check (true);
create policy "Allow all on staff_availability" on public.staff_availability for all using (true) with check (true);
create policy "Allow all on staff_leave" on public.staff_leave for all using (true) with check (true);
create policy "Allow all on shift_progress_notes" on public.shift_progress_notes for all using (true) with check (true);

-- ============================================================================
-- AGREEMENT ENGINE, DOCUMENT PACKS & GOVERNANCE (PHASE 1)
-- ============================================================================

create table if not exists public.provider_config (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  trading_name text not null default 'Opus Care Support Services',
  abn text not null,
  acn text,
  registered_address text not null,
  phone text not null,
  email text not null,
  ndis_registration_status text not null default 'unregistered',
  ndis_provider_number text,
  designated_signatory_name text not null,
  designated_signatory_title text not null,
  bank_name text,
  bank_bsb text,
  bank_account_number text,
  min_public_liability_limit numeric(12,2) default 10000000.00,
  min_professional_indemnity_limit numeric(12,2) default 2000000.00,
  default_super_rate_pct numeric(4,2) default 11.50,
  cancellation_policy_version text default '2026.1',
  cancellation_clause_text text not null,
  updated_at timestamptz default now()
);

create table if not exists public.document_templates (
  id uuid primary key default gen_random_uuid(),
  template_code text not null unique,
  title text not null,
  category text not null,
  template_version text not null,
  effective_date date not null,
  source_basis text not null,
  legal_review_date date,
  last_reviewed_by text,
  next_review_due date not null,
  clause_schema jsonb not null,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.agreement_records (
  id uuid primary key default gen_random_uuid(),
  agreement_reference text not null unique,
  template_id uuid not null references public.document_templates(id),
  template_version text not null,
  document_pack_id uuid,
  owner_type text not null,
  owner_id uuid not null,
  title text not null,
  version_number integer not null default 1,
  superseded_by_id uuid references public.agreement_records(id),
  questionnaire_data jsonb not null,
  compiled_clauses jsonb not null,
  commencement_date date not null,
  review_date date,
  expiry_date date,
  estimated_budget numeric(10,2),
  status text not null default 'draft' check (status in (
    'draft', 'ready_for_review', 'sent_for_signature', 'partially_signed', 'fully_signed', 'active', 'superseded', 'expired', 'terminated'
  )),
  draft_pdf_path text,
  executed_pdf_path text,
  executed_hash_sha256 text,
  executed_at timestamptz,
  created_by text not null default 'Admin',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.agreement_signatures (
  id uuid primary key default gen_random_uuid(),
  agreement_id uuid not null references public.agreement_records(id) on delete cascade,
  party_role text not null,
  signer_name text not null,
  signer_title text,
  signer_email text,
  signer_phone text,
  signing_method text not null,
  signature_image_data text,
  ip_address text,
  user_agent text,
  signed_at timestamptz default now(),
  is_verified boolean default true
);

alter table public.provider_config enable row level security;
alter table public.document_templates enable row level security;
alter table public.agreement_records enable row level security;
alter table public.agreement_signatures enable row level security;

create policy "Allow all on provider_config" on public.provider_config for all using (true) with check (true);
create policy "Allow all on document_templates" on public.document_templates for all using (true) with check (true);
create policy "Allow all on agreement_records" on public.agreement_records for all using (true) with check (true);
create policy "Allow all on agreement_signatures" on public.agreement_signatures for all using (true) with check (true);




