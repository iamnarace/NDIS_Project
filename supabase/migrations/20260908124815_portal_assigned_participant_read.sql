begin;
create or replace function public.portal_has_participant(target uuid) returns boolean language sql stable security definer set search_path = '' as $$ select exists(select 1 from public.shifts s join public.shift_assignments a on a.shift_id=s.id where s.participant_id=target and a.staff_id=public.my_staff_id() and a.status<>'cancelled' and s.status<>'cancelled'); $$;
revoke all on function public.portal_has_participant(uuid) from public, anon;
grant execute on function public.portal_has_participant(uuid) to authenticated, service_role;
drop policy if exists "Worker reads assigned participant" on public.participants;
create policy "Worker reads assigned participant" on public.participants for select to authenticated using (public.portal_has_participant(id));
commit;
