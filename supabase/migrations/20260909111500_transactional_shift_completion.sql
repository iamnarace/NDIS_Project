-- Complete a worker's assigned shift as one atomic, identity-derived operation.

create unique index if not exists timesheet_entries_one_per_shift_worker
  on public.timesheet_entries (shift_id, staff_id) where shift_id is not null;
create unique index if not exists travel_records_one_per_shift_worker
  on public.travel_records (shift_id, staff_id) where shift_id is not null;
create unique index if not exists service_records_one_per_shift_worker
  on public.service_records (shift_id, staff_id) where shift_id is not null;
create unique index if not exists progress_note_goals_one_per_note_goal
  on public.progress_note_goals (progress_note_id, goal_id);

create or replace function public.complete_assigned_shift(
  p_shift_id uuid,
  p_actual_start timestamptz,
  p_actual_end timestamptz,
  p_support_delivered text,
  p_break_minutes integer default 0,
  p_participant_response text default null,
  p_outcomes_observed text default null,
  p_concerns text default null,
  p_follow_up_required boolean default false,
  p_follow_up_notes text default null,
  p_goals jsonb default '[]'::jsonb,
  p_travel_minutes integer default 0,
  p_kilometres numeric default 0,
  p_travel_type text default 'provider travel',
  p_travel_notes text default null,
  p_origin text default null,
  p_destination text default null,
  p_incident_occurred boolean default false,
  p_incident_id uuid default null,
  p_worker_declaration boolean default true,
  p_admin_staff_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_staff_id uuid;
  v_actor_id text;
  v_actor_type text;
  v_is_privileged boolean;
  v_shift public.shifts%rowtype;
  v_assignment public.shift_assignments%rowtype;
  v_participant_status text;
  v_staff_status text;
  v_duration_minutes numeric;
  v_actual_hours numeric;
  v_week_start date;
  v_timesheet_id uuid;
  v_timesheet_status text;
  v_timesheet_entry_id uuid;
  v_progress_note_id uuid;
  v_travel_id uuid;
  v_service_record_id uuid;
  v_incident public.incidents%rowtype;
  v_goal jsonb;
  v_goal_id uuid;
  v_rating text;
  v_support_item_id uuid;
  v_support_item_code text;
  v_support_item_name text;
  v_unit_rate numeric;
  v_subtotal numeric;
  v_travel_amount numeric;
  v_agreement_id uuid;
  v_budget_id uuid;
  v_travel_type text;
begin
  v_is_privileged := auth.role() = 'service_role' or public.is_opus_admin();

  if v_is_privileged then
    v_staff_id := p_admin_staff_id;
    v_actor_id := coalesce(auth.uid()::text, 'server');
    v_actor_type := 'admin';
  else
    v_staff_id := public.my_staff_id();
    v_actor_id := auth.uid()::text;
    v_actor_type := 'worker';
  end if;

  if v_staff_id is null then
    raise exception 'worker_identity_unavailable';
  end if;

  select * into v_shift
  from public.shifts
  where id = p_shift_id
  for update;
  if not found then
    raise exception 'shift_not_found';
  end if;

  select * into v_assignment
  from public.shift_assignments
  where shift_id = p_shift_id and staff_id = v_staff_id
  for update;
  if not found or v_assignment.status = 'cancelled' then
    raise exception 'shift_not_assigned';
  end if;

  if v_assignment.status = 'completed' then
    select id into v_progress_note_id
      from public.shift_progress_notes
      where shift_id = p_shift_id and staff_id = v_staff_id
      order by created_at desc limit 1;
    select id into v_timesheet_entry_id
      from public.timesheet_entries
      where shift_id = p_shift_id and staff_id = v_staff_id
      order by created_at desc limit 1;
    select id into v_travel_id
      from public.travel_records
      where shift_id = p_shift_id and staff_id = v_staff_id
      order by created_at desc limit 1;
    select id into v_service_record_id
      from public.service_records
      where shift_id = p_shift_id and staff_id = v_staff_id
      order by created_at desc limit 1;

    return jsonb_build_object(
      'success', true,
      'already_completed', true,
      'actual_hours', v_assignment.actual_hours,
      'progress_note_id', v_progress_note_id,
      'timesheet_entry_id', v_timesheet_entry_id,
      'travel_record_id', v_travel_id,
      'service_record_id', v_service_record_id
    );
  end if;

  if v_shift.status in ('cancelled', 'completed') then
    raise exception 'shift_not_completable';
  end if;

  select status into v_staff_status from public.staff where id = v_staff_id;
  select status into v_participant_status from public.participants where id = v_shift.participant_id;
  if v_staff_status is distinct from 'active' then
    raise exception 'worker_inactive';
  end if;
  if v_participant_status is distinct from 'active' then
    raise exception 'participant_inactive';
  end if;

  if p_actual_start is null or p_actual_end is null
     or p_actual_end <= p_actual_start
     or p_break_minutes < 0 then
    raise exception 'invalid_shift_times';
  end if;

  v_duration_minutes := extract(epoch from (p_actual_end - p_actual_start)) / 60 - p_break_minutes;
  if v_duration_minutes <= 0 or v_duration_minutes > 1440
     or p_break_minutes >= extract(epoch from (p_actual_end - p_actual_start)) / 60
     or abs(extract(epoch from (p_actual_start - v_shift.start_time))) > 86400 then
    raise exception 'invalid_shift_times';
  end if;
  v_actual_hours := round(v_duration_minutes / 60, 2);

  if nullif(trim(p_support_delivered), '') is null or not p_worker_declaration then
    raise exception 'progress_note_required';
  end if;
  if p_follow_up_required and nullif(trim(coalesce(p_follow_up_notes, '')), '') is null then
    raise exception 'follow_up_notes_required';
  end if;

  if jsonb_typeof(coalesce(p_goals, '[]'::jsonb)) <> 'array' then
    raise exception 'invalid_goals';
  end if;
  for v_goal in select value from jsonb_array_elements(coalesce(p_goals, '[]'::jsonb))
  loop
    begin
      v_goal_id := (v_goal ->> 'goal_id')::uuid;
    exception when others then
      raise exception 'invalid_goal';
    end;
    v_rating := coalesce(nullif(v_goal ->> 'progress_rating', ''), 'Maintained');
    if v_rating not in ('Not Addressed','Maintained','Some Progress','Significant Progress','Goal Achieved')
       or not exists (
         select 1 from public.participant_goals
         where id = v_goal_id and participant_id = v_shift.participant_id and status = 'active'
       ) then
      raise exception 'invalid_goal';
    end if;
  end loop;

  if p_incident_occurred then
    if p_incident_id is null then
      raise exception 'incident_required';
    end if;
    select * into v_incident from public.incidents where id = p_incident_id;
    if not found
       or v_incident.shift_id is distinct from p_shift_id
       or v_incident.participant_id is distinct from v_shift.participant_id
       or v_incident.worker_id is distinct from v_staff_id
       or (not v_is_privileged and v_incident.reported_by is distinct from auth.uid()) then
      raise exception 'invalid_incident';
    end if;
  elsif p_incident_id is not null then
    raise exception 'invalid_incident';
  end if;

  if p_travel_minutes < 0 or p_travel_minutes > 1440 or p_kilometres < 0 or p_kilometres > 1000 then
    raise exception 'invalid_travel';
  end if;
  v_travel_type := case p_travel_type
    when 'provider_travel_to' then 'provider travel'
    when 'travel_with_participant' then 'participant transport'
    when 'participant_transport' then 'participant transport'
    when 'between_services' then 'between services'
    when 'provider travel' then 'provider travel'
    when 'participant transport' then 'participant transport'
    when 'between services' then 'between services'
    when 'other' then 'other'
    else 'provider travel'
  end;

  select i.id, i.support_item_code, i.support_item_name,
         coalesce((
           select r.agreed_rate
           from public.participant_service_rates r
           where r.participant_id = v_shift.participant_id
             and r.support_item_id = i.id and r.active = true
             and r.effective_from <= p_actual_start::date
             and (r.effective_to is null or r.effective_to >= p_actual_start::date)
           order by r.effective_from desc limit 1
         ), i.reference_rate)
    into v_support_item_id, v_support_item_code, v_support_item_name, v_unit_rate
  from public.ndis_support_items i
  where i.support_item_code = v_shift.ndis_support_item_code
    and i.active = true
    and i.effective_from <= p_actual_start::date
    and (i.effective_to is null or i.effective_to >= p_actual_start::date)
  order by i.effective_from desc
  limit 1;
  if v_support_item_id is null or v_unit_rate is null then
    raise exception 'billing_rate_unavailable';
  end if;

  select id into v_agreement_id
  from public.agreement_records
  where owner_type = 'participant' and owner_id = v_shift.participant_id and status = 'active'
  order by commencement_date desc limit 1;

  v_subtotal := round(v_actual_hours * v_unit_rate, 2);
  v_travel_amount := round(p_kilometres * 1.00, 2);
  v_week_start := date_trunc('week', p_actual_start at time zone 'Australia/Sydney')::date;

  perform pg_advisory_xact_lock(hashtextextended(v_staff_id::text || ':' || v_week_start::text, 0));
  select id, status into v_timesheet_id, v_timesheet_status
  from public.timesheets
  where staff_id = v_staff_id and week_start = v_week_start
  for update;

  if v_timesheet_id is null then
    insert into public.timesheets (staff_id, week_start, week_end, status, submitted_at)
    values (v_staff_id, v_week_start, v_week_start + 6, 'Submitted', now())
    returning id, status into v_timesheet_id, v_timesheet_status;
  elsif v_timesheet_status in ('Approved', 'Exported') then
    raise exception 'timesheet_closed';
  else
    update public.timesheets
    set status = 'Submitted', submitted_at = now(), approved_by = null, approved_at = null, updated_at = now()
    where id = v_timesheet_id;
  end if;

  update public.shift_assignments
  set status = 'completed', clock_in_at = p_actual_start, clock_out_at = p_actual_end,
      actual_hours = v_actual_hours, worker_notes = trim(p_support_delivered)
  where id = v_assignment.id;

  update public.shifts set status = 'completed', updated_at = now() where id = p_shift_id;

  insert into public.shift_progress_notes (
    shift_id, staff_id, participant_id, service_date, note_text, support_delivered,
    participant_response, outcomes_observed, concerns, follow_up_required,
    follow_up_notes, incident_occurred, incident_id, signed_by_worker, signed_at
  ) values (
    p_shift_id, v_staff_id, v_shift.participant_id, p_actual_start::date,
    trim(p_support_delivered), trim(p_support_delivered), nullif(trim(p_participant_response), ''),
    nullif(trim(p_outcomes_observed), ''), nullif(trim(p_concerns), ''),
    p_follow_up_required, nullif(trim(p_follow_up_notes), ''), p_incident_occurred,
    p_incident_id, true, now()
  ) returning id into v_progress_note_id;

  for v_goal in select value from jsonb_array_elements(coalesce(p_goals, '[]'::jsonb))
  loop
    insert into public.progress_note_goals (progress_note_id, goal_id, progress_rating, worker_comment)
    values (
      v_progress_note_id,
      (v_goal ->> 'goal_id')::uuid,
      coalesce(nullif(v_goal ->> 'progress_rating', ''), 'Maintained'),
      nullif(trim(v_goal ->> 'worker_comment'), '')
    );
  end loop;

  if p_travel_minutes > 0 or p_kilometres > 0 then
    insert into public.travel_records (
      shift_id, participant_id, staff_id, travel_type, travel_minutes,
      kilometres, origin, destination, notes, approval_status
    ) values (
      p_shift_id, v_shift.participant_id, v_staff_id, v_travel_type,
      p_travel_minutes, p_kilometres, nullif(trim(p_origin), ''),
      nullif(trim(p_destination), ''), nullif(trim(p_travel_notes), ''), 'Recorded'
    ) returning id into v_travel_id;
  end if;

  insert into public.timesheet_entries (
    timesheet_id, shift_id, staff_id, participant_id, scheduled_start, scheduled_end,
    actual_start, actual_end, break_minutes, actual_hours, travel_minutes,
    kilometres, variance_minutes, status
  ) values (
    v_timesheet_id, p_shift_id, v_staff_id, v_shift.participant_id,
    v_shift.start_time, v_shift.end_time, p_actual_start, p_actual_end,
    p_break_minutes, v_actual_hours, p_travel_minutes, p_kilometres,
    round(extract(epoch from ((p_actual_end - p_actual_start) - (v_shift.end_time - v_shift.start_time))) / 60)::integer,
    'Submitted'
  ) returning id into v_timesheet_entry_id;

  insert into public.service_records (
    service_reference, participant_id, staff_id, shift_id, timesheet_entry_id,
    agreement_id, service_date, support_item_code, support_item_name, unit_type,
    quantity, unit_rate, subtotal, travel_amount, cancellation_amount,
    billable_status, approval_status, source
  ) values (
    'SR-' || extract(year from p_actual_start at time zone 'Australia/Sydney')::integer
      || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
    v_shift.participant_id, v_staff_id, p_shift_id, v_timesheet_entry_id,
    v_agreement_id, p_actual_start::date, v_support_item_code, v_support_item_name,
    'Hour', v_actual_hours, v_unit_rate, v_subtotal, v_travel_amount, 0,
    'Not Ready', 'Pending', 'Shift Completion'
  ) returning id into v_service_record_id;

  select b.id into v_budget_id
  from public.participant_funding_periods f
  join public.participant_funding_budgets b on b.funding_period_id = f.id
  where f.participant_id = v_shift.participant_id
    and p_actual_start::date between f.plan_start and f.plan_end
    and lower(b.category) like '%core%'
  order by f.plan_start desc limit 1
  for update of b;
  if v_budget_id is not null then
    update public.participant_funding_budgets
    set delivered_amount = delivered_amount + v_subtotal + v_travel_amount, updated_at = now()
    where id = v_budget_id;
  end if;

  insert into public.audit_events (
    entity_type, entity_id, actor_type, actor_id, action, changes, metadata
  ) values (
    'shifts', p_shift_id, v_actor_type, v_actor_id, 'shift_completed',
    jsonb_build_object('status', jsonb_build_array(v_assignment.status, 'completed')),
    jsonb_build_object(
      'actual_hours', v_actual_hours,
      'progress_note_id', v_progress_note_id,
      'timesheet_entry_id', v_timesheet_entry_id,
      'service_record_id', v_service_record_id,
      'travel_record_id', v_travel_id
    )
  );

  return jsonb_build_object(
    'success', true,
    'already_completed', false,
    'actual_hours', v_actual_hours,
    'progress_note_id', v_progress_note_id,
    'timesheet_entry_id', v_timesheet_entry_id,
    'travel_record_id', v_travel_id,
    'service_record_id', v_service_record_id
  );
end;
$$;

revoke all on function public.complete_assigned_shift(
  uuid,timestamptz,timestamptz,text,integer,text,text,text,boolean,text,jsonb,
  integer,numeric,text,text,text,text,boolean,uuid,boolean,uuid
) from public, anon;
grant execute on function public.complete_assigned_shift(
  uuid,timestamptz,timestamptz,text,integer,text,text,text,boolean,text,jsonb,
  integer,numeric,text,text,text,text,boolean,uuid,boolean,uuid
) to authenticated, service_role;
