-- Governance G2 closure: make worker replacement and roster eligibility one transaction.

ALTER TABLE public.staff DROP CONSTRAINT IF EXISTS staff_status_check;
ALTER TABLE public.staff ADD CONSTRAINT staff_status_check CHECK (status IN ('pending','active','inactive','on_leave'));

CREATE OR REPLACE FUNCTION public.governance_g2_assign_worker(
  p_shift_id uuid,
  p_staff_id uuid,
  p_actor_id text,
  p_notes text DEFAULT NULL,
  p_force_overlap boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shift public.shifts%rowtype;
  v_eligibility jsonb;
  v_assignment public.shift_assignments%rowtype;
  v_conflict public.shifts%rowtype;
BEGIN
  IF nullif(trim(p_actor_id), '') IS NULL THEN
    RAISE EXCEPTION 'trusted actor required';
  END IF;

  -- Serialize all assignments for one worker so concurrent overlap checks cannot race.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_staff_id::text, 0));

  SELECT * INTO v_shift FROM public.shifts WHERE id = p_shift_id FOR UPDATE;
  IF v_shift.id IS NULL THEN RAISE EXCEPTION 'shift not found'; END IF;
  IF v_shift.service_code IS NULL THEN RAISE EXCEPTION 'shift service governance code is missing'; END IF;

  v_eligibility := public.governance_g2_worker_eligibility(v_shift.participant_id, p_staff_id, v_shift.service_code);
  IF v_eligibility->>'decision' <> 'ELIGIBLE' THEN
    RAISE EXCEPTION 'worker eligibility blocked: %', v_eligibility->>'decision';
  END IF;

  SELECT other_shift.* INTO v_conflict
  FROM public.shift_assignments assignment
  JOIN public.shifts other_shift ON other_shift.id = assignment.shift_id
  WHERE assignment.staff_id = p_staff_id
    AND assignment.status <> 'cancelled'
    AND other_shift.id <> p_shift_id
    AND v_shift.start_time < other_shift.end_time
    AND v_shift.end_time > other_shift.start_time
  ORDER BY other_shift.start_time
  LIMIT 1;

  IF v_conflict.id IS NOT NULL AND NOT p_force_overlap THEN
    RAISE EXCEPTION 'worker schedule conflict';
  END IF;

  DELETE FROM public.shift_assignments WHERE shift_id = p_shift_id;
  INSERT INTO public.shift_assignments(shift_id, staff_id, assigned_by, status, confirmed_by_worker, worker_notes)
  VALUES(p_shift_id, p_staff_id, p_actor_id, 'rostered', false, nullif(trim(p_notes), ''))
  RETURNING * INTO v_assignment;

  UPDATE public.shifts SET status = 'assigned', updated_at = now() WHERE id = p_shift_id;
  INSERT INTO public.audit_events(entity_type, entity_id, actor_type, actor_id, action, changes, metadata)
  VALUES(
    'shift', p_shift_id, 'admin_session', p_actor_id, 'worker_assigned_after_g2_eligibility',
    jsonb_build_object('staff_id', p_staff_id, 'assignment_id', v_assignment.id),
    jsonb_build_object('eligibility', v_eligibility, 'overlap_override', p_force_overlap AND v_conflict.id IS NOT NULL)
  );

  RETURN jsonb_build_object(
    'assignmentId', v_assignment.id,
    'decision', 'ELIGIBLE',
    'overlapOverride', p_force_overlap AND v_conflict.id IS NOT NULL
  );
END
$$;

REVOKE EXECUTE ON FUNCTION public.governance_g2_assign_worker(uuid,uuid,text,text,boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.governance_g2_assign_worker(uuid,uuid,text,text,boolean) TO service_role;
