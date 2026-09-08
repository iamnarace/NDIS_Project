begin;
drop policy if exists "Allow all on shift_assignments" on public.shift_assignments;
drop policy if exists "Admin manages assignments" on public.shift_assignments;
create policy "Admin manages assignments" on public.shift_assignments for all to authenticated using (public.is_opus_admin()) with check (public.is_opus_admin());
drop policy if exists "Worker reads assignments" on public.shift_assignments;
create policy "Worker reads assignments" on public.shift_assignments for select to authenticated using (staff_id=(select public.my_staff_id()));
commit;
