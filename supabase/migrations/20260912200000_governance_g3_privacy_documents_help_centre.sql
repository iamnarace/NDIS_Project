-- Governance G3: Privacy, Participant Documents & Help Centre
-- 1. participant_consents
create table if not exists public.participant_consents (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  privacy_notice_acknowledged boolean not null default false,
  privacy_notice_version text not null default '2026.1',
  privacy_acknowledged_at timestamptz,
  privacy_acknowledged_by text,
  privacy_acknowledged_role text default 'participant' check (privacy_acknowledged_role in ('participant', 'guardian', 'nominee', 'authorised_rep')),
  privacy_acknowledgement_method text default 'digital_portal' check (privacy_acknowledgement_method in ('digital_portal', 'written_form', 'verbal_recorded')),
  service_consent_granted boolean not null default false,
  service_consent_at timestamptz,
  service_consent_by text,
  marketing_consent_granted boolean not null default false,
  marketing_consent_at timestamptz,
  nominee_name text,
  nominee_relationship text,
  nominee_authority_basis text check (nominee_authority_basis is null or nominee_authority_basis in ('parent_guardian', 'plan_nominee', 'correspondence_nominee', 'enduring_power_of_attorney', 'court_tribunal_appointed')),
  nominee_verified_at timestamptz,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint uq_participant_consents unique (participant_id)
);

-- 2. information_sharing_authorities
create table if not exists public.information_sharing_authorities (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  purpose text not null,
  recipient_name text not null,
  recipient_organisation text not null,
  recipient_role text not null,
  information_scope text not null check (information_scope in ('financial_invoicing_only', 'service_schedules_and_delivery', 'support_plans_and_clinical_reports', 'all_operational_records')),
  start_date date not null default current_date,
  review_date date not null,
  status text not null default 'active' check (status in ('active', 'revoked', 'expired')),
  revocation_date timestamptz,
  revocation_reason text,
  revoked_by text,
  created_by text not null default 'Admin',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. controlled_documents
create table if not exists public.controlled_documents (
  id uuid primary key default gen_random_uuid(),
  document_code text not null,
  title text not null,
  category text not null,
  version text not null default '1.0',
  effective_date date not null default current_date,
  review_date date not null,
  status text not null default 'current' check (status in ('draft', 'current', 'superseded', 'archived')),
  owner_approver text not null default 'Operations & Governance Lead',
  acknowledgement_required boolean not null default false,
  is_public boolean not null default false,
  target_audience text not null default 'participant' check (target_audience in ('public', 'participant', 'worker', 'all')),
  change_summary text not null default 'Initial governed publication',
  source_template_url text,
  content_markdown text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint uq_controlled_documents_code_version unique (document_code, version)
);

-- 4. document_acknowledgements
create table if not exists public.document_acknowledgements (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.controlled_documents(id) on delete cascade,
  document_code text not null,
  document_version text not null,
  acknowledger_type text not null check (acknowledger_type in ('participant', 'worker', 'nominee')),
  acknowledger_id uuid not null,
  acknowledger_name text not null,
  acknowledged_at timestamptz default now(),
  method text not null default 'digital_portal' check (method in ('digital_portal', 'written_form', 'verbal_recorded')),
  notes text
);

-- Enable RLS
alter table public.participant_consents enable row level security;
alter table public.information_sharing_authorities enable row level security;
alter table public.controlled_documents enable row level security;
alter table public.document_acknowledgements enable row level security;

-- Policies for participant_consents
drop policy if exists "Admin manages participant consents" on public.participant_consents;
create policy "Admin manages participant consents" on public.participant_consents
  for all to authenticated
  using (public.is_opus_admin())
  with check (public.is_opus_admin());

drop policy if exists "Participants read own consents" on public.participant_consents;
create policy "Participants read own consents" on public.participant_consents
  for select to authenticated
  using (public.is_portal_participant() and participant_id = public.my_participant_id());

-- Policies for information_sharing_authorities
drop policy if exists "Admin manages information sharing authorities" on public.information_sharing_authorities;
create policy "Admin manages information sharing authorities" on public.information_sharing_authorities
  for all to authenticated
  using (public.is_opus_admin())
  with check (public.is_opus_admin());

drop policy if exists "Participants read own information sharing authorities" on public.information_sharing_authorities;
create policy "Participants read own information sharing authorities" on public.information_sharing_authorities
  for select to authenticated
  using (public.is_portal_participant() and participant_id = public.my_participant_id());

-- Policies for controlled_documents
drop policy if exists "Public reads current public controlled documents" on public.controlled_documents;
create policy "Public reads current public controlled documents" on public.controlled_documents
  for select to anon
  using (is_public = true and status = 'current');

drop policy if exists "Authenticated read current controlled documents" on public.controlled_documents;
create policy "Authenticated read current controlled documents" on public.controlled_documents
  for select to authenticated
  using (status = 'current' or public.is_opus_admin());

drop policy if exists "Admin manages controlled documents" on public.controlled_documents;
create policy "Admin manages controlled documents" on public.controlled_documents
  for all to authenticated
  using (public.is_opus_admin())
  with check (public.is_opus_admin());

-- Policies for document_acknowledgements
drop policy if exists "Admin manages document acknowledgements" on public.document_acknowledgements;
create policy "Admin manages document acknowledgements" on public.document_acknowledgements
  for all to authenticated
  using (public.is_opus_admin())
  with check (public.is_opus_admin());

drop policy if exists "Users read own document acknowledgements" on public.document_acknowledgements;
create policy "Users read own document acknowledgements" on public.document_acknowledgements
  for select to authenticated
  using (
    (public.is_portal_participant() and acknowledger_id = public.my_participant_id())
    or (public.is_portal_worker() and acknowledger_id = public.my_staff_id())
  );

-- Seed Canonical Participant Document Pack
insert into public.controlled_documents (document_code, title, category, version, effective_date, review_date, status, owner_approver, acknowledgement_required, is_public, target_audience, change_summary, source_template_url)
values
  ('DOC-AGR-01', 'NDIS Service Agreement', 'Legal & Contract', '2026.1', '2026-07-01', '2027-06-30', 'current', 'Operations & Governance Lead', true, true, 'participant', 'Aligned with NDIS 2026-27 Pricing Arrangements and Opus sole trader unregistered governance.', '/documents/service-agreement'),
  ('DOC-SCH-01', 'Schedule of Supports', 'Operations & Billing', '2026.1', '2026-07-01', '2027-06-30', 'current', 'Operations & Governance Lead', true, true, 'participant', 'Tailored support item allocations and price limits.', '/documents/schedule-of-supports'),
  ('DOC-PRC-01', 'Pricing, Travel & Cancellation Policy', 'Finance & Pricing', '2026.1', '2026-07-01', '2027-06-30', 'current', 'Finance & Governance Lead', false, true, 'all', 'Transparent pricing under NDIS price limits; strict 2-clear-business-days cancellation rules.', '/documents/pricing-travel-cancellation'),
  ('DOC-PRV-01', 'Privacy Collection Notice & Information Handling', 'Privacy & Compliance', '2026.1', '2026-07-01', '2027-06-30', 'current', 'Privacy Officer', true, true, 'all', 'Australian Privacy Principles compliance, purpose of collection, secure retention and access rights.', '/privacy'),
  ('DOC-RGT-01', 'Participant Charter of Rights & Responsibilities', 'Quality & Safeguarding', '2026.1', '2026-07-01', '2027-06-30', 'current', 'Safeguarding Lead', true, true, 'participant', 'Dignity, choice & control, advocacy rights, and participant responsibilities.', '/documents/rights-and-responsibilities'),
  ('DOC-CMP-01', 'Complaints, Feedback & Dispute Resolution Guide', 'Quality & Safeguarding', '2026.1', '2026-07-01', '2027-06-30', 'current', 'Safeguarding Lead', false, true, 'all', 'Fair complaints process, external escalation to NDIS Commission, no fear of retribution.', '/complaints'),
  ('DOC-INC-01', 'Incident Management & Safeguarding Guide', 'Quality & Safeguarding', '2026.1', '2026-07-01', '2027-06-30', 'current', 'Safeguarding Lead', false, true, 'all', 'Participant safety, incident response, zero tolerance for abuse, open disclosure.', '/incident-management'),
  ('DOC-HBK-01', 'Participant Welcome & Onboarding Handbook', 'Client Experience', '2026.1', '2026-07-01', '2027-06-30', 'current', 'Operations Lead', false, true, 'participant', 'Complete client handbook covering service delivery, worker matching, and portal access.', '/documents/welcome-pack'),
  ('DOC-EMG-01', 'Emergency & After-Hours Support Protocol', 'Safety & Emergency', '2026.1', '2026-07-01', '2027-06-30', 'current', 'Operations Lead', false, true, 'all', 'Critical incident triage, 000 protocols, and after-hours operational contact.', '/documents/emergency-support'),
  ('DOC-EXT-01', 'Service Exit & Transition Policy', 'Client Experience', '2026.1', '2026-07-01', '2027-06-30', 'current', 'Operations Lead', false, true, 'participant', 'Fair 14-day notice, orderly transition of support records, and unhindered exit rights.', '/documents/exit-transition'),
  ('DOC-ISA-01', 'Information Sharing Authority Template & Policy', 'Privacy & Compliance', '2026.1', '2026-07-01', '2027-06-30', 'current', 'Privacy Officer', true, true, 'participant', 'Specific consent for sharing information with Plan Managers, Support Coordinators, and Allied Health.', '/documents/information-sharing')
on conflict (document_code, version) do update
set
  title = excluded.title,
  category = excluded.category,
  effective_date = excluded.effective_date,
  review_date = excluded.review_date,
  status = excluded.status,
  is_public = excluded.is_public,
  source_template_url = excluded.source_template_url,
  change_summary = excluded.change_summary,
  updated_at = now();
