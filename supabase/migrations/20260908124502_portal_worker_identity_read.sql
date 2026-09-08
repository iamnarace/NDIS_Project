begin;
create or replace function public.my_staff_id() returns uuid language sql stable security definer set search_path = '' as $$ select portal_staff_id from public.profiles where id=auth.uid() and is_active and role='worker'; $$;
revoke all on function public.my_staff_id() from public, anon;
grant execute on function public.my_staff_id() to authenticated, service_role;
drop policy if exists "Worker reads own staff record" on public.staff;
create policy "Worker reads own staff record" on public.staff for select to authenticated using (id=(select public.my_staff_id()));
commit;
