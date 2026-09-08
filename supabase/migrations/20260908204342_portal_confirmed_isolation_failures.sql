begin;
-- Directly observed portal isolation failures; admin server service-role access is unchanged.
drop policy if exists "Allow all on provider_config" on public.provider_config;
drop policy if exists "Admin manages provider configuration" on public.provider_config;
create policy "Admin manages provider configuration" on public.provider_config for all to authenticated using (public.is_opus_admin()) with check (public.is_opus_admin());
drop policy if exists "Allow all on agreement_records" on public.agreement_records;
drop policy if exists "Admin manages agreements" on public.agreement_records;
create policy "Admin manages agreements" on public.agreement_records for all to authenticated using (public.is_opus_admin()) with check (public.is_opus_admin());
drop policy if exists "Allow all on shift_progress_notes" on public.shift_progress_notes;
drop policy if exists "Admin manages progress notes" on public.shift_progress_notes;
create policy "Admin manages progress notes" on public.shift_progress_notes for all to authenticated using (public.is_opus_admin()) with check (public.is_opus_admin());
drop policy if exists "Worker reads own progress notes" on public.shift_progress_notes;
create policy "Worker reads own progress notes" on public.shift_progress_notes for select to authenticated using (staff_id=public.my_staff_id() and public.portal_has_shift(shift_id));
commit;
