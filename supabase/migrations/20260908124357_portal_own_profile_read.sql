begin;
alter function public.is_opus_admin() set search_path = '';
drop policy if exists "Staff view profiles" on public.profiles;
drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile" on public.profiles for select to authenticated using (id = (select auth.uid()));
commit;
