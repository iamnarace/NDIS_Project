-- Remove legacy portal-wide access from operational records while preserving
-- service-role access for the server-side admin application.

-- Normalise legacy training identity values once, then enforce the real staff FK.
do $$
begin
  if exists (
    select 1
    from public.training_assignments t
    where (select count(*) from public.staff s
      where s.id::text = t.staff_id
         or lower(trim(s.full_name)) = lower(trim(t.staff_name))) <> 1
  ) or exists (
    select 1
    from public.training_attempts t
    left join public.training_assignments a on a.id = t.assignment_id
    where (select count(*) from public.staff s
      where s.id::text = t.staff_id
         or lower(trim(s.full_name)) = lower(trim(a.staff_name))) <> 1
  ) or exists (
    select 1
    from public.training_completions t
    where (select count(*) from public.staff s
      where s.id::text = t.staff_id
         or lower(trim(s.full_name)) = lower(trim(t.staff_name))) <> 1
  ) then
    raise exception 'Training rows contain staff identifiers that cannot be resolved';
  end if;
end
$$;

update public.training_assignments t
set staff_id = s.id::text
from public.staff s
where lower(trim(s.full_name)) = lower(trim(t.staff_name))
  and t.staff_id <> s.id::text;

update public.training_attempts t
set staff_id = s.id::text
from public.training_assignments a, public.staff s
where a.id = t.assignment_id
  and lower(trim(s.full_name)) = lower(trim(a.staff_name))
  and t.staff_id <> s.id::text;

update public.training_completions t
set staff_id = s.id::text
from public.staff s
where lower(trim(s.full_name)) = lower(trim(t.staff_name))
  and t.staff_id <> s.id::text;

alter table public.training_assignments alter column staff_id type uuid using staff_id::uuid;
alter table public.training_attempts alter column staff_id type uuid using staff_id::uuid;
alter table public.training_completions alter column staff_id type uuid using staff_id::uuid;

alter table public.training_assignments
  add constraint training_assignments_staff_id_fkey foreign key (staff_id) references public.staff(id) on delete cascade;
alter table public.training_attempts
  add constraint training_attempts_staff_id_fkey foreign key (staff_id) references public.staff(id) on delete cascade;
alter table public.training_completions
  add constraint training_completions_staff_id_fkey foreign key (staff_id) references public.staff(id) on delete cascade;

-- Helpers used by policies must not inherit a caller-controlled search path.
create or replace function public.is_opus_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and is_active = true
      and role in ('admin', 'manager', 'coordinator', 'staff')
  );
$$;

create or replace function public.is_portal_worker()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_active = true and role = 'worker'
  );
$$;

revoke all on function public.is_opus_admin() from public, anon;
revoke all on function public.is_opus_staff() from public, anon;
revoke all on function public.is_portal_worker() from public, anon;
revoke all on function public.is_portal_participant() from public, anon;
revoke all on function public.my_staff_id() from public, anon;
revoke all on function public.my_participant_id() from public, anon;
grant execute on function public.is_opus_admin() to authenticated, service_role;
grant execute on function public.is_opus_staff() to authenticated, service_role;
grant execute on function public.is_portal_worker() to authenticated, service_role;
grant execute on function public.is_portal_participant() to authenticated, service_role;
grant execute on function public.my_staff_id() to authenticated, service_role;
grant execute on function public.my_participant_id() to authenticated, service_role;

-- Training: workers read only their own records and active catalog entries.
drop policy if exists "Admin manage courses" on public.training_courses;
drop policy if exists "Staff read active courses" on public.training_courses;
create policy "Admin manages training courses" on public.training_courses
  for all to authenticated using (public.is_opus_admin()) with check (public.is_opus_admin());
create policy "Workers read active training courses" on public.training_courses
  for select to authenticated using (public.is_portal_worker() and is_active = true);

drop policy if exists "Admin manage assignments" on public.training_assignments;
drop policy if exists "Staff read own assignments" on public.training_assignments;
create policy "Admin manages training assignments" on public.training_assignments
  for all to authenticated using (public.is_opus_admin()) with check (public.is_opus_admin());
create policy "Workers read own training assignments" on public.training_assignments
  for select to authenticated using (staff_id = public.my_staff_id());

drop policy if exists "Admin manage attempts" on public.training_attempts;
drop policy if exists "Staff read own attempts" on public.training_attempts;
create policy "Admin manages training attempts" on public.training_attempts
  for all to authenticated using (public.is_opus_admin()) with check (public.is_opus_admin());
create policy "Workers read own training attempts" on public.training_attempts
  for select to authenticated using (staff_id = public.my_staff_id());

drop policy if exists "Admin manage completions" on public.training_completions;
drop policy if exists "Staff read own completions" on public.training_completions;
create policy "Admin manages training completions" on public.training_completions
  for all to authenticated using (public.is_opus_admin()) with check (public.is_opus_admin());
create policy "Workers read own training completions" on public.training_completions
  for select to authenticated using (staff_id = public.my_staff_id());

drop policy if exists "Admin manage external courses" on public.external_courses;
drop policy if exists "Anyone can read active external courses" on public.external_courses;
create policy "Admin manages external courses" on public.external_courses
  for all to authenticated using (public.is_opus_admin()) with check (public.is_opus_admin());
create policy "Workers read active external courses" on public.external_courses
  for select to authenticated using (public.is_portal_worker() and is_active = true);

-- Availability and leave: workers can maintain only their own records.
drop policy if exists "Allow all on staff_availability" on public.staff_availability;
create policy "Admin manages staff availability" on public.staff_availability
  for all to authenticated using (public.is_opus_admin()) with check (public.is_opus_admin());
create policy "Workers read own availability" on public.staff_availability
  for select to authenticated using (staff_id = public.my_staff_id());
create policy "Workers create own availability" on public.staff_availability
  for insert to authenticated with check (staff_id = public.my_staff_id());
create policy "Workers update own availability" on public.staff_availability
  for update to authenticated using (staff_id = public.my_staff_id()) with check (staff_id = public.my_staff_id());

drop policy if exists "Allow all on staff_leave" on public.staff_leave;
create policy "Admin manages staff leave" on public.staff_leave
  for all to authenticated using (public.is_opus_admin()) with check (public.is_opus_admin());
create policy "Workers read own leave" on public.staff_leave
  for select to authenticated using (staff_id = public.my_staff_id());
create policy "Workers request own leave" on public.staff_leave
  for insert to authenticated with check (staff_id = public.my_staff_id() and status = 'pending');
create policy "Workers update own pending leave" on public.staff_leave
  for update to authenticated using (staff_id = public.my_staff_id() and status = 'pending')
  with check (staff_id = public.my_staff_id() and status = 'pending');

-- Agreements and signatures: signing remains a server/admin workflow.
create policy "Participants read own issued agreements" on public.agreement_records
  for select to authenticated using (
    owner_type = 'participant' and owner_id = public.my_participant_id()
    and status in ('sent_for_signature','partially_signed','fully_signed','active','superseded','expired','terminated')
  );
create policy "Workers read own issued agreements" on public.agreement_records
  for select to authenticated using (
    owner_type = 'staff' and owner_id = public.my_staff_id()
    and status in ('sent_for_signature','partially_signed','fully_signed','active','superseded','expired','terminated')
  );

drop policy if exists "Allow all on agreement_signatures" on public.agreement_signatures;
create policy "Admin manages agreement signatures" on public.agreement_signatures
  for all to authenticated using (public.is_opus_admin()) with check (public.is_opus_admin());
create policy "Portal users read signatures for own agreements" on public.agreement_signatures
  for select to authenticated using (
    exists (
      select 1 from public.agreement_records a
      where a.id = agreement_id
        and ((a.owner_type = 'participant' and a.owner_id = public.my_participant_id())
          or (a.owner_type = 'staff' and a.owner_id = public.my_staff_id()))
        and a.status in ('sent_for_signature','partially_signed','fully_signed','active','superseded','expired','terminated')
    )
  );

-- Safeguarding: portal users never receive investigation or manager-only fields.
drop policy if exists "Worker insert incident" on public.incidents;
drop policy if exists "Worker view own reported incidents" on public.incidents;
create policy "Workers read own reported incidents" on public.incidents
  for select to authenticated using (
    public.is_portal_worker()
    and worker_id = public.my_staff_id()
    and reported_by = auth.uid()
  );

revoke select on public.incidents from authenticated;
grant select (
  id, incident_reference, participant_id, worker_id, shift_id, reported_by,
  incident_at, location, category, severity, description, immediate_actions_taken,
  injury_or_harm_details, emergency_services_contacted, emergency_services_details,
  witnesses, attachment_urls, status, created_at, updated_at
) on public.incidents to authenticated;

drop policy if exists "Allow authenticated insert on complaints" on public.complaints;
create policy "Participants read own complaint status" on public.complaints
  for select to authenticated using (
    public.is_portal_participant() and participant_id = public.my_participant_id()
  );
revoke select on public.complaints from authenticated;
grant select (
  id, complaint_reference, participant_id, complainant_name, complainant_role,
  received_date, summary, status, acknowledgement_date, resolution_summary,
  closed_at, created_at, updated_at
) on public.complaints to authenticated;

drop policy if exists "Worker view corrective_actions" on public.corrective_actions;
drop policy if exists "Allow insert audit_events" on public.audit_events;

-- Documents expose only portal-appropriate categories owned by the caller UUID.
create policy "Participants read own portal documents" on public.documents
  for select to authenticated using (
    owner_type = 'participant'
    and owner_id = public.my_participant_id()::text
    and category in ('service_agreement','ndis_plan','care_plan','other')
  );
create policy "Workers read own credential documents" on public.documents
  for select to authenticated using (
    owner_type = 'staff'
    and owner_id = public.my_staff_id()::text
    and category in ('police_check','wwcc','first_aid','cpr','driver_license','car_insurance','other')
  );

-- Service-delivery writes are performed by the transactional server workflow.
drop policy if exists "Worker insert progress_note_goals" on public.progress_note_goals;
drop policy if exists "Worker view progress_note_goals" on public.progress_note_goals;
create policy "Workers read goals from own progress notes" on public.progress_note_goals
  for select to authenticated using (
    exists (
      select 1 from public.shift_progress_notes n
      where n.id = progress_note_id and n.staff_id = public.my_staff_id()
        and public.portal_has_shift(n.shift_id)
    )
  );

drop policy if exists "Worker insert own timesheets" on public.timesheets;
drop policy if exists "Worker insert own timesheet_entries" on public.timesheet_entries;

drop policy if exists "Worker view and insert own travel" on public.travel_records;
create policy "Workers read own travel" on public.travel_records
  for select to authenticated using (staff_id = public.my_staff_id());
