begin;
drop policy if exists "Worker reads assigned goals" on public.participant_goals;
create policy "Worker reads assigned goals" on public.participant_goals for select to authenticated using (public.portal_has_participant(participant_id));
commit;
