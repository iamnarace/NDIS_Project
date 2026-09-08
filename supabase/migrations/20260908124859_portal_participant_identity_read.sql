begin;
create or replace function public.my_participant_id() returns uuid language sql stable security definer set search_path = '' as $$ select portal_participant_id from public.profiles where id=auth.uid() and is_active and role='participant'; $$;
alter function public.is_portal_participant() set search_path = '';
drop policy if exists "Participant view own record" on public.participants;
drop policy if exists "Participant reads linked record" on public.participants;
create policy "Participant reads linked record" on public.participants for select to authenticated using (id=(select public.my_participant_id()));
drop policy if exists "Participant reads own shifts" on public.shifts;
create policy "Participant reads own shifts" on public.shifts for select to authenticated using (participant_id=(select public.my_participant_id()));
commit;
