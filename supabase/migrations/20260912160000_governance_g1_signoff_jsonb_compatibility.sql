-- Governance G1 browser acceptance repair: use the portable JSONB key
-- iterator rather than the unavailable jsonb_object_length helper.
CREATE OR REPLACE FUNCTION public.governance_g1_signoff_onboarding(p_participant_id uuid, p_actor_id text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_check_id uuid; v_requirements jsonb; v_ready boolean;
BEGIN
  IF nullif(trim(p_actor_id), '') IS NULL THEN RAISE EXCEPTION 'trusted actor required'; END IF;
  SELECT id, requirements INTO v_check_id, v_requirements FROM public.participant_onboarding_checklists WHERE participant_id = p_participant_id FOR UPDATE;
  IF v_check_id IS NULL THEN RAISE EXCEPTION 'checklist not found'; END IF;
  IF jsonb_typeof(v_requirements) <> 'object' OR NOT EXISTS (SELECT 1 FROM jsonb_object_keys(v_requirements))
    OR NOT (v_requirements ?& ARRAY[
      'identity_verified', 'adult_age_confirmed', 'funding_payer_confirmed',
      'privacy_notice_acknowledged', 'participant_consent_obtained',
      'suitability_assessment_approved', 'service_agreement_executed',
      'participant_risk_assessment_completed', 'participant_support_plan_completed',
      'first_shift_readiness_approved'
    ])
    OR EXISTS (
      SELECT 1 FROM jsonb_each(v_requirements) x
      WHERE jsonb_typeof(x.value) <> 'object'
        OR x.value->>'code' IS DISTINCT FROM x.key
        OR x.value->>'status' IS NULL
        OR x.value->>'status' NOT IN ('pending', 'completed', 'waived', 'not_applicable')
        OR jsonb_typeof(x.value->'required') IS DISTINCT FROM 'boolean'
        OR jsonb_typeof(x.value->'waivable') IS DISTINCT FROM 'boolean'
    )
  THEN RAISE EXCEPTION 'onboarding checklist is non-canonical'; END IF;
  SELECT NOT EXISTS (
    SELECT 1 FROM jsonb_each(v_requirements) x WHERE (x.value->>'required')::boolean
      AND NOT (x.value->>'status' = 'completed'
        OR (x.value->>'status' = 'waived' AND (x.value->>'waivable')::boolean AND nullif(trim(x.value->>'waiverReason'), '') IS NOT NULL))
  ) INTO v_ready;
  IF NOT v_ready THEN RAISE EXCEPTION 'onboarding checklist is incomplete'; END IF;
  UPDATE public.participants SET is_rosterable = true, lifecycle_stage = 'active_rosterable', status = 'active',
    readiness_notes = 'Onboarding verified through governed readiness sign-off.', updated_at = now()
    WHERE id = p_participant_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'participant not found'; END IF;
  UPDATE public.participant_onboarding_checklists SET is_ready_for_rostering = true,
    signoff_by = p_actor_id, signoff_at = now(), updated_at = now() WHERE id = v_check_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'checklist sign-off update failed'; END IF;
  INSERT INTO public.audit_events(entity_type, entity_id, actor_type, actor_id, action, changes)
  VALUES('participant', p_participant_id, 'admin_session', p_actor_id, 'readiness_approved',
    jsonb_build_object('is_rosterable', true, 'lifecycle_stage', 'active_rosterable'));
END $$;

REVOKE EXECUTE ON FUNCTION public.governance_g1_signoff_onboarding(uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.governance_g1_signoff_onboarding(uuid,text) TO service_role;
