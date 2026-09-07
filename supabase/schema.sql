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
