-- G2 live closure: current base requirements are checked at every roster write.
CREATE OR REPLACE FUNCTION public.governance_g2_worker_eligibility(p_participant_id uuid,p_staff_id uuid,p_service_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_part public.participants%rowtype; v_staff public.staff%rowtype; v_service public.service_scope_registry%rowtype;
  v_code text; v_missing text[] := '{}'; v_training text[] := '{}'; v_competencies text[] := '{}';
BEGIN
  SELECT * INTO v_part FROM public.participants WHERE id=p_participant_id;
  IF v_part.id IS NULL OR v_part.is_rosterable IS DISTINCT FROM true THEN RETURN jsonb_build_object('decision','BLOCKED_PARTICIPANT_NOT_READY','reasons',jsonb_build_array('Participant readiness gate is incomplete.')); END IF;
  SELECT * INTO v_service FROM public.service_scope_registry WHERE service_code=p_service_code;
  IF v_service.service_code IS NULL OR v_service.operational_status NOT IN ('ACTIVE','ACTIVE_WITH_CONTROLS') OR v_service.roster_eligible IS DISTINCT FROM true THEN
    RETURN jsonb_build_object('decision',CASE WHEN v_service.operational_status='CONDITIONAL_CLINICAL' THEN 'BLOCKED_CLINICAL_APPROVAL' ELSE 'BLOCKED_SERVICE_SCOPE' END,'reasons',jsonb_build_array('Service is not approved for ordinary roster activation.'));
  END IF;
  SELECT * INTO v_staff FROM public.staff WHERE id=p_staff_id;
  IF v_staff.id IS NULL OR v_staff.lifecycle_stage NOT IN ('ready','ready_restricted') OR v_staff.is_rosterable IS DISTINCT FROM true THEN RETURN jsonb_build_object('decision','BLOCKED_WORKER_NOT_READY','reasons',jsonb_build_array('Worker lifecycle is not roster ready.')); END IF;
  IF NOT EXISTS (SELECT 1 FROM public.worker_credentials c WHERE c.staff_id=p_staff_id AND c.requirement_code='ndis_worker_screening' AND c.verification_status='verified' AND c.screening_status='Clearance' AND (c.expiry_date IS NULL OR c.expiry_date>=current_date)) THEN
    RETURN jsonb_build_object('decision','BLOCKED_SCREENING','reasons',jsonb_build_array('Current verified NDIS Worker Screening Clearance is required.'));
  END IF;
  FOR v_code IN SELECT unnest(ARRAY['identity_verified','right_to_work','first_aid','cpr','code_of_conduct','privacy_confidentiality','whs_induction','safeguarding'])
    UNION SELECT jsonb_array_elements_text(coalesce(v_service.required_worker_credentials,'[]'::jsonb)) LOOP
    IF NOT EXISTS (SELECT 1 FROM public.worker_credentials c WHERE c.staff_id=p_staff_id AND c.requirement_code=v_code AND c.verification_status='verified' AND (c.expiry_date IS NULL OR c.expiry_date>=current_date) AND (v_code<>'ndis_worker_screening' OR c.screening_status='Clearance')) THEN v_missing:=array_append(v_missing,v_code); END IF;
  END LOOP;
  IF cardinality(v_missing)>0 THEN RETURN jsonb_build_object('decision',CASE WHEN p_service_code='OC-SRV-TRANS-01' THEN 'BLOCKED_TRANSPORT' ELSE 'BLOCKED_CREDENTIAL' END,'reasons',to_jsonb(v_missing)); END IF;
  SELECT coalesce(array_agg(tc.title), '{}') INTO v_training FROM public.training_assignments ta JOIN public.training_courses tc ON tc.id=ta.course_id AND tc.is_active AND tc.is_mandatory WHERE ta.staff_id=p_staff_id AND NOT EXISTS (SELECT 1 FROM public.training_completions done WHERE done.staff_id=p_staff_id AND done.course_id=ta.course_id AND done.passed AND (done.expires_at IS NULL OR done.expires_at>=now()));
  IF cardinality(v_training)>0 THEN RETURN jsonb_build_object('decision','BLOCKED_TRAINING','reasons',to_jsonb(v_training)); END IF;
  FOR v_code IN SELECT jsonb_array_elements_text(coalesce(v_service.required_competencies,'[]'::jsonb)) LOOP
    IF NOT EXISTS (SELECT 1 FROM public.worker_competencies wc JOIN public.competency_catalogue cc ON cc.code=wc.competency_code WHERE wc.staff_id=p_staff_id AND wc.competency_code=v_code AND wc.status='achieved' AND (wc.review_date IS NULL OR wc.review_date>=current_date) AND (NOT cc.participant_specific OR wc.participant_id=p_participant_id) AND (wc.service_code IS NULL OR wc.service_code=p_service_code)) THEN v_competencies:=array_append(v_competencies,v_code); END IF;
  END LOOP;
  IF cardinality(v_competencies)>0 THEN RETURN jsonb_build_object('decision','BLOCKED_COMPETENCY','reasons',to_jsonb(v_competencies)); END IF;
  RETURN jsonb_build_object('decision','ELIGIBLE','reasons','[]'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION public.governance_g2_guard_shift_assignment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_shift public.shifts%rowtype; v_decision jsonb;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.shift_id = OLD.shift_id AND NEW.staff_id = OLD.staff_id
    AND NEW.status NOT IN ('rostered','confirmed') THEN RETURN NEW; END IF;
  SELECT * INTO v_shift FROM public.shifts WHERE id=NEW.shift_id;
  IF v_shift.id IS NULL OR v_shift.service_code IS NULL THEN RAISE EXCEPTION 'governed shift service required'; END IF;
  v_decision := public.governance_g2_worker_eligibility(v_shift.participant_id,NEW.staff_id,v_shift.service_code);
  IF v_decision->>'decision' <> 'ELIGIBLE' THEN RAISE EXCEPTION 'worker eligibility blocked: %',v_decision->>'decision'; END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS governance_g2_assignment_guard ON public.shift_assignments;
CREATE TRIGGER governance_g2_assignment_guard BEFORE INSERT OR UPDATE OF shift_id,staff_id,status
ON public.shift_assignments FOR EACH ROW EXECUTE FUNCTION public.governance_g2_guard_shift_assignment();

CREATE OR REPLACE FUNCTION public.governance_g2_guard_shift_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_staff_id uuid; v_decision jsonb;
BEGIN
  IF NEW.status='assigned' AND NOT EXISTS
    (SELECT 1 FROM public.shift_assignments WHERE shift_id=NEW.id AND status<>'cancelled') THEN
    RAISE EXCEPTION 'assigned shift requires governed worker assignment';
  END IF;
  IF TG_OP='UPDATE' AND
    (NEW.participant_id IS DISTINCT FROM OLD.participant_id OR NEW.service_code IS DISTINCT FROM OLD.service_code) THEN
    FOR v_staff_id IN SELECT staff_id FROM public.shift_assignments
      WHERE shift_id=NEW.id AND status<>'cancelled' LOOP
      v_decision:=public.governance_g2_worker_eligibility(NEW.participant_id,v_staff_id,NEW.service_code);
      IF v_decision->>'decision'<>'ELIGIBLE' THEN RAISE EXCEPTION 'worker eligibility blocked: %',v_decision->>'decision'; END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS governance_g2_shift_guard ON public.shifts;
CREATE TRIGGER governance_g2_shift_guard BEFORE INSERT OR UPDATE OF status,participant_id,service_code
ON public.shifts FOR EACH ROW EXECUTE FUNCTION public.governance_g2_guard_shift_change();

REVOKE EXECUTE ON FUNCTION public.governance_g2_guard_shift_assignment() FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.governance_g2_guard_shift_change() FROM PUBLIC,anon,authenticated;
