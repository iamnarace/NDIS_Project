-- ============================================================================
-- PHASE B: QUALITY & SAFEGUARDING SCHEMA & RLS
-- ============================================================================

-- 1. Incidents Table
create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  incident_reference text unique not null,
  participant_id uuid not null references public.participants(id) on delete cascade,
  worker_id uuid references public.staff(id) on delete set null,
  shift_id uuid references public.shifts(id) on delete set null,
  reported_by uuid references auth.users(id) on delete set null,
  incident_at timestamptz not null default now(),
  location text,
  category text not null default 'other',
  severity text not null check (severity in ('Low', 'Medium', 'High', 'Critical')),
  description text not null,
  immediate_actions_taken text,
  injury_or_harm_details text,
  emergency_services_contacted boolean default false,
  emergency_services_details text,
  witnesses text,
  attachment_urls jsonb default '[]'::jsonb,
  status text not null check (status in ('Reported', 'Immediate Action', 'Under Review', 'Investigation', 'Corrective Action', 'Monitoring', 'Closed')) default 'Reported',
  manager_review text,
  investigation_notes text,
  participant_family_follow_up text,
  reportable_assessment text default 'Pending Review',
  reportable_rationale text,
  external_notification_status text default 'Not Required',
  external_reference_number text,
  closed_at timestamptz,
  closed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Complaints Table
create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  complaint_reference text unique not null,
  participant_id uuid references public.participants(id) on delete set null,
  complainant_name text not null,
  complainant_role text not null default 'Participant',
  contact_details text,
  source text not null default 'Portal',
  received_date date not null default current_date,
  summary text not null,
  details text not null,
  immediate_safety_issue boolean default false,
  linked_incident_id uuid references public.incidents(id) on delete set null,
  assigned_manager text,
  acknowledgement_date date,
  investigation_notes text,
  actions_taken text,
  outcome text,
  resolution_summary text,
  status text not null check (status in ('Received', 'Acknowledged', 'Under Review', 'Action Required', 'Resolved', 'Closed')) default 'Received',
  closed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Corrective Actions Table
create table if not exists public.corrective_actions (
  id uuid primary key default gen_random_uuid(),
  action_reference text unique not null,
  source_type text not null check (source_type in ('incident', 'complaint', 'risk_assessment', 'audit')),
  source_id uuid not null,
  action_description text not null,
  owner text not null,
  due_date date not null,
  priority text not null check (priority in ('Low', 'Medium', 'High', 'Urgent')) default 'Medium',
  status text not null check (status in ('Open', 'In Progress', 'Completed', 'Overdue', 'Cancelled')) default 'Open',
  completed_at timestamptz,
  evidence_reference text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. Audit Events Table (Minimal Reusable System)
create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  actor_type text not null,
  actor_id text not null,
  action text not null,
  changes jsonb default '{}'::jsonb,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- 5. Alter shift_progress_notes to add incident_id
alter table public.shift_progress_notes
  add column if not exists incident_id uuid references public.incidents(id) on delete set null;

-- 6. Enable RLS
alter table public.incidents enable row level security;
alter table public.complaints enable row level security;
alter table public.corrective_actions enable row level security;
alter table public.audit_events enable row level security;

-- 7. RLS Policies
drop policy if exists "Staff full access on incidents" on public.incidents;
create policy "Staff full access on incidents" on public.incidents
  for all using (public.is_opus_staff()) with check (public.is_opus_staff());

drop policy if exists "Worker view own reported incidents" on public.incidents;
create policy "Worker view own reported incidents" on public.incidents
  for select using (
    public.is_portal_worker() and (
      reported_by = auth.uid() or
      worker_id in (select portal_staff_id from public.profiles where id = auth.uid())
    )
  );

drop policy if exists "Worker insert incident" on public.incidents;
create policy "Worker insert incident" on public.incidents
  for insert with check (
    public.is_portal_worker() or public.is_opus_staff()
  );

drop policy if exists "Staff full access on complaints" on public.complaints;
create policy "Staff full access on complaints" on public.complaints
  for all using (public.is_opus_staff()) with check (public.is_opus_staff());

drop policy if exists "Allow authenticated insert on complaints" on public.complaints;
create policy "Allow authenticated insert on complaints" on public.complaints
  for insert with check (auth.role() = 'authenticated');

drop policy if exists "Staff full access on corrective_actions" on public.corrective_actions;
create policy "Staff full access on corrective_actions" on public.corrective_actions
  for all using (public.is_opus_staff()) with check (public.is_opus_staff());

drop policy if exists "Worker view corrective_actions" on public.corrective_actions;
create policy "Worker view corrective_actions" on public.corrective_actions
  for select using (public.is_portal_worker() or public.is_opus_staff());

drop policy if exists "Staff view audit_events" on public.audit_events;
create policy "Staff view audit_events" on public.audit_events
  for select using (public.is_opus_staff());

drop policy if exists "Allow insert audit_events" on public.audit_events;
create policy "Allow insert audit_events" on public.audit_events
  for insert with check (true);

-- 8. Indexes for performance
create index if not exists idx_incidents_participant on public.incidents(participant_id);
create index if not exists idx_incidents_worker on public.incidents(worker_id);
create index if not exists idx_incidents_status on public.incidents(status);
create index if not exists idx_incidents_severity on public.incidents(severity);
create index if not exists idx_complaints_participant on public.complaints(participant_id);
create index if not exists idx_complaints_status on public.complaints(status);
create index if not exists idx_corrective_actions_source on public.corrective_actions(source_type, source_id);
create index if not exists idx_audit_events_entity on public.audit_events(entity_type, entity_id);
