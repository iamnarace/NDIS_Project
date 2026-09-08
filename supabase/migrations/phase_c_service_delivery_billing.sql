-- ============================================================================
-- PHASE C: SERVICE DELIVERY -> TIMESHEETS -> BILLING FOUNDATION
-- ============================================================================

-- 1. Extend shift_progress_notes with full clinical/support fields
alter table public.shift_progress_notes
  add column if not exists service_date date,
  add column if not exists support_delivered text,
  add column if not exists participant_response text,
  add column if not exists outcomes_observed text,
  add column if not exists concerns text,
  add column if not exists follow_up_required boolean default false,
  add column if not exists follow_up_notes text,
  add column if not exists signed_by_worker boolean default true,
  add column if not exists signed_at timestamptz,
  add column if not exists updated_at timestamptz default now();

-- 2. Progress Note Goals Junction Table
create table if not exists public.progress_note_goals (
  id uuid primary key default gen_random_uuid(),
  progress_note_id uuid not null references public.shift_progress_notes(id) on delete cascade,
  goal_id uuid not null references public.participant_goals(id) on delete cascade,
  progress_rating text not null check (progress_rating in ('Not Addressed', 'Maintained', 'Some Progress', 'Significant Progress', 'Goal Achieved')),
  worker_comment text,
  created_at timestamptz default now()
);

-- 3. Timesheets Table (Weekly worker submission)
create table if not exists public.timesheets (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  week_start date not null,
  week_end date not null,
  status text not null check (status in ('Draft', 'Submitted', 'Approved', 'Rejected', 'Adjusted', 'Exported')) default 'Draft',
  submitted_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(staff_id, week_start)
);

-- 4. Timesheet Entries Table (Individual shift shifts/entries within a timesheet)
create table if not exists public.timesheet_entries (
  id uuid primary key default gen_random_uuid(),
  timesheet_id uuid references public.timesheets(id) on delete cascade,
  shift_id uuid references public.shifts(id) on delete set null,
  staff_id uuid not null references public.staff(id) on delete cascade,
  participant_id uuid references public.participants(id) on delete set null,
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  actual_start timestamptz,
  actual_end timestamptz,
  break_minutes integer default 0,
  actual_hours numeric(6, 2) not null default 0,
  travel_minutes integer default 0,
  kilometres numeric(6, 2) default 0,
  variance_minutes integer default 0,
  status text not null check (status in ('Draft', 'Submitted', 'Approved', 'Rejected', 'Adjusted', 'Exported')) default 'Draft',
  manager_note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. Travel Records Table
create table if not exists public.travel_records (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid references public.shifts(id) on delete set null,
  participant_id uuid references public.participants(id) on delete set null,
  staff_id uuid not null references public.staff(id) on delete cascade,
  travel_type text not null check (travel_type in ('provider travel', 'participant transport', 'between services', 'other')) default 'provider travel',
  travel_minutes integer default 0,
  kilometres numeric(6, 2) default 0,
  origin text,
  destination text,
  notes text,
  approval_status text not null check (approval_status in ('Recorded', 'Approved', 'Rejected', 'Billing Eligible')) default 'Recorded',
  approved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

-- 6. NDIS Support Items Configuration Table
create table if not exists public.ndis_support_items (
  id uuid primary key default gen_random_uuid(),
  support_item_code text unique not null,
  support_item_name text not null,
  category text not null,
  registration_group text,
  unit text not null default 'Hour',
  reference_rate numeric(10, 2) not null,
  effective_from date not null default current_date,
  effective_to date,
  region text default 'National',
  source_version text default '2025-2026 NDIS Pricing Arrangements',
  active boolean default true,
  notes text
);

-- 7. Participant Service Rates (Agreed overrides)
create table if not exists public.participant_service_rates (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  support_item_id uuid not null references public.ndis_support_items(id) on delete cascade,
  agreed_rate numeric(10, 2) not null,
  effective_from date not null default current_date,
  effective_to date,
  agreement_id uuid references public.agreement_records(id) on delete set null,
  active boolean default true,
  created_at timestamptz default now()
);

-- 8. Service Records — Billing Source of Truth
create table if not exists public.service_records (
  id uuid primary key default gen_random_uuid(),
  service_reference text unique not null,
  participant_id uuid not null references public.participants(id) on delete cascade,
  staff_id uuid references public.staff(id) on delete set null,
  shift_id uuid references public.shifts(id) on delete set null,
  timesheet_entry_id uuid references public.timesheet_entries(id) on delete set null,
  agreement_id uuid references public.agreement_records(id) on delete set null,
  service_date date not null,
  support_item_code text,
  support_item_name text not null,
  unit_type text not null default 'Hour',
  quantity numeric(6, 2) not null default 0,
  unit_rate numeric(10, 2) not null default 0,
  subtotal numeric(10, 2) not null default 0,
  travel_amount numeric(10, 2) default 0,
  cancellation_amount numeric(10, 2) default 0,
  billable_status text not null check (billable_status in ('Not Ready', 'Ready', 'Excluded', 'Invoiced')) default 'Not Ready',
  approval_status text not null check (approval_status in ('Pending', 'Approved', 'Rejected')) default 'Pending',
  source text not null default 'Shift Completion',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 9. Quotes Table
create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  quote_reference text unique not null,
  participant_id uuid not null references public.participants(id) on delete cascade,
  status text not null check (status in ('Draft', 'Sent', 'Accepted', 'Declined', 'Expired', 'Converted')) default 'Draft',
  valid_until date,
  notes text,
  subtotal numeric(10, 2) not null default 0,
  total numeric(10, 2) not null default 0,
  created_by text default 'Admin',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 10. Quote Line Items Table
create table if not exists public.quote_line_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  support_item_id uuid references public.ndis_support_items(id) on delete set null,
  description text not null,
  unit text not null default 'Hour',
  quantity numeric(6, 2) not null default 0,
  frequency text default 'Weekly',
  unit_rate numeric(10, 2) not null default 0,
  estimated_weeks integer default 52,
  line_total numeric(10, 2) not null default 0,
  created_at timestamptz default now()
);

-- 11. Support Schedules Table
create table if not exists public.support_schedules (
  id uuid primary key default gen_random_uuid(),
  schedule_reference text unique not null,
  participant_id uuid not null references public.participants(id) on delete cascade,
  agreement_id uuid references public.agreement_records(id) on delete set null,
  quote_id uuid references public.quotes(id) on delete set null,
  version_number integer not null default 1,
  effective_from date not null default current_date,
  effective_to date,
  status text not null check (status in ('Draft', 'Active', 'Superseded', 'Expired')) default 'Draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 12. Support Schedule Items Table
create table if not exists public.support_schedule_items (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.support_schedules(id) on delete cascade,
  support_item_id uuid references public.ndis_support_items(id) on delete set null,
  agreed_rate numeric(10, 2) not null,
  unit text not null default 'Hour',
  hours_per_week numeric(6, 2) not null default 0,
  estimated_weeks integer not null default 52,
  estimated_total numeric(10, 2) not null default 0,
  notes text,
  created_at timestamptz default now()
);

-- 13. Participant Funding Periods Table
create table if not exists public.participant_funding_periods (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  plan_start date not null,
  plan_end date not null,
  funding_type text not null default 'Plan Managed',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 14. Participant Funding Budgets Table
create table if not exists public.participant_funding_budgets (
  id uuid primary key default gen_random_uuid(),
  funding_period_id uuid not null references public.participant_funding_periods(id) on delete cascade,
  category text not null,
  budget_amount numeric(10, 2) not null default 0,
  committed_amount numeric(10, 2) not null default 0,
  delivered_amount numeric(10, 2) not null default 0,
  invoiced_amount numeric(10, 2) not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 15. Invoices Table
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_reference text unique not null,
  participant_id uuid not null references public.participants(id) on delete cascade,
  funding_type text not null default 'Plan Managed',
  plan_manager_name text,
  plan_manager_email text,
  invoice_date date not null default current_date,
  due_date date not null,
  status text not null check (status in ('Draft', 'Ready', 'Sent', 'Paid', 'Partially Paid', 'Rejected', 'Cancelled', 'Adjusted')) default 'Draft',
  subtotal numeric(10, 2) not null default 0,
  gst numeric(10, 2) not null default 0,
  total numeric(10, 2) not null default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 16. Invoice Line Items Table
create table if not exists public.invoice_line_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  service_record_id uuid references public.service_records(id) on delete set null,
  support_item_code text,
  description text not null,
  service_date date not null,
  quantity numeric(6, 2) not null default 0,
  unit text not null default 'Hour',
  unit_rate numeric(10, 2) not null default 0,
  line_total numeric(10, 2) not null default 0,
  created_at timestamptz default now()
);

-- 17. Enable Row Level Security (RLS)
alter table public.progress_note_goals enable row level security;
alter table public.timesheets enable row level security;
alter table public.timesheet_entries enable row level security;
alter table public.travel_records enable row level security;
alter table public.ndis_support_items enable row level security;
alter table public.participant_service_rates enable row level security;
alter table public.service_records enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_line_items enable row level security;
alter table public.support_schedules enable row level security;
alter table public.support_schedule_items enable row level security;
alter table public.participant_funding_periods enable row level security;
alter table public.participant_funding_budgets enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_line_items enable row level security;

-- 18. RLS Policies

-- Staff full access across all operational tables
drop policy if exists "Staff full access on progress_note_goals" on public.progress_note_goals;
create policy "Staff full access on progress_note_goals" on public.progress_note_goals for all using (public.is_opus_staff()) with check (public.is_opus_staff());

drop policy if exists "Staff full access on timesheets" on public.timesheets;
create policy "Staff full access on timesheets" on public.timesheets for all using (public.is_opus_staff()) with check (public.is_opus_staff());

drop policy if exists "Staff full access on timesheet_entries" on public.timesheet_entries;
create policy "Staff full access on timesheet_entries" on public.timesheet_entries for all using (public.is_opus_staff()) with check (public.is_opus_staff());

drop policy if exists "Staff full access on travel_records" on public.travel_records;
create policy "Staff full access on travel_records" on public.travel_records for all using (public.is_opus_staff()) with check (public.is_opus_staff());

drop policy if exists "Staff full access on ndis_support_items" on public.ndis_support_items;
create policy "Staff full access on ndis_support_items" on public.ndis_support_items for all using (public.is_opus_staff()) with check (public.is_opus_staff());

drop policy if exists "Staff full access on participant_service_rates" on public.participant_service_rates;
create policy "Staff full access on participant_service_rates" on public.participant_service_rates for all using (public.is_opus_staff()) with check (public.is_opus_staff());

drop policy if exists "Staff full access on service_records" on public.service_records;
create policy "Staff full access on service_records" on public.service_records for all using (public.is_opus_staff()) with check (public.is_opus_staff());

drop policy if exists "Staff full access on quotes" on public.quotes;
create policy "Staff full access on quotes" on public.quotes for all using (public.is_opus_staff()) with check (public.is_opus_staff());

drop policy if exists "Staff full access on quote_line_items" on public.quote_line_items;
create policy "Staff full access on quote_line_items" on public.quote_line_items for all using (public.is_opus_staff()) with check (public.is_opus_staff());

drop policy if exists "Staff full access on support_schedules" on public.support_schedules;
create policy "Staff full access on support_schedules" on public.support_schedules for all using (public.is_opus_staff()) with check (public.is_opus_staff());

drop policy if exists "Staff full access on support_schedule_items" on public.support_schedule_items;
create policy "Staff full access on support_schedule_items" on public.support_schedule_items for all using (public.is_opus_staff()) with check (public.is_opus_staff());

drop policy if exists "Staff full access on participant_funding_periods" on public.participant_funding_periods;
create policy "Staff full access on participant_funding_periods" on public.participant_funding_periods for all using (public.is_opus_staff()) with check (public.is_opus_staff());

drop policy if exists "Staff full access on participant_funding_budgets" on public.participant_funding_budgets;
create policy "Staff full access on participant_funding_budgets" on public.participant_funding_budgets for all using (public.is_opus_staff()) with check (public.is_opus_staff());

drop policy if exists "Staff full access on invoices" on public.invoices;
create policy "Staff full access on invoices" on public.invoices for all using (public.is_opus_staff()) with check (public.is_opus_staff());

drop policy if exists "Staff full access on invoice_line_items" on public.invoice_line_items;
create policy "Staff full access on invoice_line_items" on public.invoice_line_items for all using (public.is_opus_staff()) with check (public.is_opus_staff());

-- Read-only reference data for authenticated users
drop policy if exists "Authenticated read ndis_support_items" on public.ndis_support_items;
create policy "Authenticated read ndis_support_items" on public.ndis_support_items for select using (auth.role() = 'authenticated');

-- Worker access policies
drop policy if exists "Worker view own timesheets" on public.timesheets;
create policy "Worker view own timesheets" on public.timesheets for select using (
  public.is_portal_worker() and staff_id in (select portal_staff_id from public.profiles where id = auth.uid())
);

drop policy if exists "Worker insert own timesheets" on public.timesheets;
create policy "Worker insert own timesheets" on public.timesheets for insert with check (
  public.is_portal_worker() and staff_id in (select portal_staff_id from public.profiles where id = auth.uid())
);

drop policy if exists "Worker view own timesheet_entries" on public.timesheet_entries;
create policy "Worker view own timesheet_entries" on public.timesheet_entries for select using (
  public.is_portal_worker() and staff_id in (select portal_staff_id from public.profiles where id = auth.uid())
);

drop policy if exists "Worker insert own timesheet_entries" on public.timesheet_entries;
create policy "Worker insert own timesheet_entries" on public.timesheet_entries for insert with check (
  public.is_portal_worker() and staff_id in (select portal_staff_id from public.profiles where id = auth.uid())
);

drop policy if exists "Worker view and insert own travel" on public.travel_records;
create policy "Worker view and insert own travel" on public.travel_records for all using (
  public.is_portal_worker() and staff_id in (select portal_staff_id from public.profiles where id = auth.uid())
) with check (
  public.is_portal_worker() and staff_id in (select portal_staff_id from public.profiles where id = auth.uid())
);

drop policy if exists "Worker insert progress_note_goals" on public.progress_note_goals;
create policy "Worker insert progress_note_goals" on public.progress_note_goals for insert with check (
  public.is_portal_worker() or public.is_opus_staff()
);

drop policy if exists "Worker view progress_note_goals" on public.progress_note_goals;
create policy "Worker view progress_note_goals" on public.progress_note_goals for select using (
  public.is_portal_worker() or public.is_opus_staff()
);

-- Participant access policies
drop policy if exists "Participant view own funding periods" on public.participant_funding_periods;
create policy "Participant view own funding periods" on public.participant_funding_periods for select using (
  public.is_portal_participant() and participant_id in (select portal_participant_id from public.profiles where id = auth.uid())
);

drop policy if exists "Participant view own funding budgets" on public.participant_funding_budgets;
create policy "Participant view own funding budgets" on public.participant_funding_budgets for select using (
  public.is_portal_participant() and funding_period_id in (
    select id from public.participant_funding_periods
    where participant_id in (select portal_participant_id from public.profiles where id = auth.uid())
  )
);

drop policy if exists "Participant view own invoices" on public.invoices;
create policy "Participant view own invoices" on public.invoices for select using (
  public.is_portal_participant() and participant_id in (select portal_participant_id from public.profiles where id = auth.uid())
);

drop policy if exists "Participant view own quotes" on public.quotes;
create policy "Participant view own quotes" on public.quotes for select using (
  public.is_portal_participant() and participant_id in (select portal_participant_id from public.profiles where id = auth.uid())
);

-- 19. Seed Standard NDIS Support Catalog
insert into public.ndis_support_items (support_item_code, support_item_name, category, registration_group, unit, reference_rate, notes)
values
  ('01_011_0107_1_1', 'Assistance With Self-Care Activities - Standard - Weekday Daytime', 'Core', 'Daily Personal Activities', 'Hour', 67.56, 'NDIS non-remote standard rate'),
  ('01_015_0107_1_1', 'Assistance With Self-Care Activities - Standard - Weekday Evening', 'Core', 'Daily Personal Activities', 'Hour', 74.44, 'Weekday evening rate (8pm - 12am)'),
  ('01_013_0107_1_1', 'Assistance With Self-Care Activities - Standard - Saturday', 'Core', 'Daily Personal Activities', 'Hour', 95.07, 'Saturday standard rate'),
  ('01_014_0107_1_1', 'Assistance With Self-Care Activities - Standard - Sunday', 'Core', 'Daily Personal Activities', 'Hour', 122.59, 'Sunday standard rate'),
  ('01_012_0107_1_1', 'Assistance With Self-Care Activities - Standard - Public Holiday', 'Core', 'Daily Personal Activities', 'Hour', 150.10, 'Public holiday standard rate'),
  ('01_019_0120_1_1', 'House Cleaning And Other Household Activities', 'Core', 'Household Tasks', 'Hour', 54.07, 'Domestic cleaning and household chores'),
  ('01_020_0120_1_1', 'House And/Or Yard Maintenance', 'Core', 'Household Tasks', 'Hour', 54.07, 'Lawn mowing, light gardening, maintenance'),
  ('04_104_0125_6_1', 'Access Community Social and Rec Activities - Standard - Weekday', 'Core', 'Community Participation', 'Hour', 67.56, 'Community access and social support'),
  ('04_103_0125_6_1', 'Access Community Social and Rec Activities - Standard - Saturday', 'Core', 'Community Participation', 'Hour', 95.07, 'Saturday community access'),
  ('04_102_0125_6_1', 'Access Community Social and Rec Activities - Standard - Sunday', 'Core', 'Community Participation', 'Hour', 122.59, 'Sunday community access'),
  ('02_051_0108_1_1', 'Transport - Activity Based Transport', 'Core', 'Assist-Travel/Transport', 'Kilometre', 1.00, 'Per kilometre participant transport'),
  ('15_037_0117_1_3', 'Skill Development And Training - Individual', 'Capacity Building', 'Increased Social & Community', 'Hour', 74.44, 'Life skills development and coaching')
on conflict (support_item_code) do update set
  reference_rate = excluded.reference_rate,
  support_item_name = excluded.support_item_name;

