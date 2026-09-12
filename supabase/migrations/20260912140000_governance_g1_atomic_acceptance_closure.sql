-- Governance G1 final software acceptance closure.
-- Backwards-compatible with the currently deployed application while adding
-- duplicate conversion protection and server-owned checklist item mutation.

ALTER TABLE public.participants DROP CONSTRAINT IF EXISTS participants_funding_type_check;
ALTER TABLE public.participants ADD CONSTRAINT participants_funding_type_check
  CHECK (funding_type IN ('Plan-Managed', 'Self-Managed', 'NDIA-Managed', 'Unsure')) NOT VALID;

ALTER TABLE public.participants VALIDATE CONSTRAINT participants_funding_type_check;
ALTER TABLE public.participants VALIDATE CONSTRAINT participants_lifecycle_stage_check;
ALTER TABLE public.service_suitability_assessments VALIDATE CONSTRAINT suitability_outcome_check;
ALTER TABLE public.service_suitability_assessments VALIDATE CONSTRAINT suitability_billing_relationship_status_check;

CREATE UNIQUE INDEX IF NOT EXISTS participants_one_per_referral_idx
  ON public.participants(referral_id)
  WHERE referral_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.governance_g1_convert_referral(
  p_referral_id uuid, p_assessment_id uuid, p_participant_reference text, p_ndis_number text,
  p_allocated_hours numeric, p_requirements jsonb, p_actor_id text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_ref public.referrals%ROWTYPE;
  v_assessment public.service_suitability_assessments%ROWTYPE;
  v_part public.participants%ROWTYPE;
  v_check public.participant_onboarding_checklists%ROWTYPE;
BEGIN
  IF nullif(trim(p_actor_id), '') IS NULL THEN RAISE EXCEPTION 'trusted actor required'; END IF;
  SELECT * INTO v_ref FROM public.referrals WHERE id = p_referral_id FOR UPDATE;
  IF v_ref.id IS NULL THEN RAISE EXCEPTION 'referral not found'; END IF;

  SELECT * INTO v_part FROM public.participants WHERE referral_id = p_referral_id;
  IF v_part.id IS NOT NULL THEN
    IF v_part.suitability_assessment_id IS DISTINCT FROM p_assessment_id THEN
      RAISE EXCEPTION 'referral already converted under a different assessment';
    END IF;
    SELECT * INTO v_check FROM public.participant_onboarding_checklists WHERE participant_id = v_part.id;
    IF v_check.id IS NULL THEN RAISE EXCEPTION 'existing conversion is missing its onboarding checklist'; END IF;
    RETURN jsonb_build_object('participant', to_jsonb(v_part), 'checklist', to_jsonb(v_check), 'already_existed', true);
  END IF;

  SELECT * INTO v_assessment
    FROM public.service_suitability_assessments
    WHERE id = p_assessment_id AND referral_id = p_referral_id
    FOR UPDATE;
  IF v_assessment.id IS NULL THEN RAISE EXCEPTION 'linked assessment not found'; END IF;
  IF v_assessment.id IS DISTINCT FROM (
    SELECT id FROM public.service_suitability_assessments
    WHERE referral_id = p_referral_id ORDER BY created_at DESC, id DESC LIMIT 1
  ) THEN RAISE EXCEPTION 'only the latest suitability assessment may authorize onboarding'; END IF;
  IF v_assessment.outcome NOT IN ('Suitable', 'Suitable With Conditions') THEN
    RAISE EXCEPTION 'assessment outcome does not permit onboarding';
  END IF;
  IF v_assessment.is_adult IS DISTINCT FROM true THEN RAISE EXCEPTION 'adult scope is not verified'; END IF;
  IF v_assessment.billing_relationship_status NOT IN ('verified_self_managed', 'verified_plan_managed', 'verified_registered_provider_contract') THEN
    RAISE EXCEPTION 'billing relationship is not verified';
  END IF;
  IF jsonb_typeof(v_assessment.service_scope_validation) <> 'array'
    OR jsonb_array_length(v_assessment.service_scope_validation) = 0
    OR EXISTS (SELECT 1 FROM jsonb_array_elements(v_assessment.service_scope_validation) item WHERE (item->>'allowed')::boolean IS DISTINCT FROM true)
  THEN RAISE EXCEPTION 'service scope is not operationally approved'; END IF;
  IF jsonb_typeof(p_requirements) <> 'object' OR NOT (p_requirements ?& ARRAY[
    'identity_verified', 'adult_age_confirmed', 'funding_payer_confirmed',
    'privacy_notice_acknowledged', 'participant_consent_obtained',
    'suitability_assessment_approved', 'service_agreement_executed',
    'participant_risk_assessment_completed', 'participant_support_plan_completed',
    'first_shift_readiness_approved'
  ]) THEN RAISE EXCEPTION 'canonical onboarding requirements are missing'; END IF;

  INSERT INTO public.participants(reference_number, referral_id, suitability_assessment_id, full_name, ndis_number,
    phone, email, suburb, funding_type, allocated_weekly_hours, status, lifecycle_stage, is_rosterable, readiness_notes)
  VALUES (p_participant_reference, v_ref.id, v_assessment.id, v_ref.participant_name, nullif(p_ndis_number, ''),
    v_ref.phone, v_ref.email, v_assessment.suburb, v_assessment.funding_type, coalesce(p_allocated_hours, 0),
    'pending_intake', 'onboarding', false, format('Converted from referral %s following assessment %s.', coalesce(v_ref.reference_number, v_ref.id::text), v_assessment.reference_number))
  RETURNING * INTO v_part;
  INSERT INTO public.participant_onboarding_checklists(participant_id, requirements, is_ready_for_rostering)
    VALUES(v_part.id, p_requirements, false) RETURNING * INTO v_check;
  UPDATE public.service_suitability_assessments SET participant_id = v_part.id, updated_at = now() WHERE id = v_assessment.id;
  IF NOT FOUND THEN RAISE EXCEPTION 'assessment link update failed'; END IF;
  UPDATE public.referrals SET status = 'accepted', updated_at = now() WHERE id = v_ref.id;
  IF NOT FOUND THEN RAISE EXCEPTION 'referral update failed'; END IF;
  INSERT INTO public.audit_events(entity_type, entity_id, actor_type, actor_id, action, changes, metadata)
  VALUES('participant', v_part.id, 'admin_session', p_actor_id, 'converted_to_onboarding',
    jsonb_build_object('lifecycle_stage', 'onboarding', 'is_rosterable', false, 'suitability_assessment_id', v_assessment.id),
    jsonb_build_object('referralId', v_ref.id, 'assessmentReference', v_assessment.reference_number, 'outcome', v_assessment.outcome));
  RETURN jsonb_build_object('participant', to_jsonb(v_part), 'checklist', to_jsonb(v_check), 'already_existed', false);
END $$;

CREATE OR REPLACE FUNCTION public.governance_g1_update_checklist_item(
  p_participant_id uuid, p_actor_id text, p_item_code text, p_item_status text,
  p_waiver_reason text DEFAULT NULL, p_notes text DEFAULT NULL, p_document_id text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_check public.participant_onboarding_checklists%ROWTYPE;
  v_item jsonb;
  v_requirements jsonb;
  v_ready boolean;
BEGIN
  IF nullif(trim(p_actor_id), '') IS NULL THEN RAISE EXCEPTION 'trusted actor required'; END IF;
  IF p_item_status NOT IN ('pending', 'completed', 'waived') THEN RAISE EXCEPTION 'invalid checklist status'; END IF;
  SELECT * INTO v_check FROM public.participant_onboarding_checklists WHERE participant_id = p_participant_id FOR UPDATE;
  IF v_check.id IS NULL THEN RAISE EXCEPTION 'checklist not found'; END IF;
  v_item := v_check.requirements -> p_item_code;
  IF v_item IS NULL OR jsonb_typeof(v_item) <> 'object' THEN RAISE EXCEPTION 'checklist item not found'; END IF;
  IF v_item->>'code' IS DISTINCT FROM p_item_code THEN RAISE EXCEPTION 'checklist item code mismatch'; END IF;

  v_item := v_item - 'completedAt' - 'completedBy' - 'waivedAt' - 'waivedBy' - 'waiverReason';
  IF p_item_status = 'waived' THEN
    IF coalesce((v_item->>'waivable')::boolean, false) IS NOT true THEN RAISE EXCEPTION 'checklist item is non-waivable'; END IF;
    IF nullif(trim(p_waiver_reason), '') IS NULL THEN RAISE EXCEPTION 'waiver rationale is required'; END IF;
    v_item := v_item || jsonb_build_object('status', 'waived', 'waivedAt', now(), 'waivedBy', p_actor_id, 'waiverReason', trim(p_waiver_reason));
  ELSIF p_item_status = 'completed' THEN
    v_item := v_item || jsonb_build_object('status', 'completed', 'completedAt', now(), 'completedBy', p_actor_id);
  ELSE
    v_item := v_item || jsonb_build_object('status', 'pending');
  END IF;
  IF p_notes IS NOT NULL THEN v_item := v_item || jsonb_build_object('notes', p_notes); END IF;
  IF p_document_id IS NOT NULL THEN v_item := v_item || jsonb_build_object('documentId', p_document_id); END IF;
  v_requirements := jsonb_set(v_check.requirements, ARRAY[p_item_code], v_item, false);

  SELECT NOT EXISTS (
    SELECT 1 FROM jsonb_each(v_requirements) x
    WHERE coalesce((x.value->>'required')::boolean, false)
      AND NOT (
        x.value->>'status' = 'completed'
        OR (x.value->>'status' = 'waived' AND coalesce((x.value->>'waivable')::boolean, false) AND nullif(trim(x.value->>'waiverReason'), '') IS NOT NULL)
      )
  ) INTO v_ready;
  UPDATE public.participant_onboarding_checklists
    SET requirements = v_requirements, is_ready_for_rostering = v_ready, updated_at = now()
    WHERE id = v_check.id;
  IF NOT v_ready THEN
    UPDATE public.participants SET is_rosterable = false,
      lifecycle_stage = CASE WHEN lifecycle_stage = 'active_rosterable' THEN 'onboarding' ELSE lifecycle_stage END,
      status = CASE WHEN status = 'active' THEN 'pending_intake' ELSE status END,
      updated_at = now() WHERE id = p_participant_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'participant readiness revocation failed'; END IF;
  END IF;
  INSERT INTO public.audit_events(entity_type, entity_id, actor_type, actor_id, action, changes, metadata)
  VALUES('participant_onboarding_checklist', v_check.id, 'admin_session', p_actor_id, 'checklist_item_updated',
    jsonb_build_object('code', p_item_code, 'status', p_item_status),
    jsonb_build_object('participantId', p_participant_id, 'isReady', v_ready));
  RETURN jsonb_build_object('requirements', v_requirements, 'is_ready_for_rostering', v_ready);
END $$;

-- Retain the deployed signature, but reject stale whole-document writes rather
-- than overwriting a concurrent checklist update.
CREATE OR REPLACE FUNCTION public.governance_g1_update_checklist(
  p_participant_id uuid, p_requirements jsonb, p_actor_id text, p_item_code text, p_item_status text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_current jsonb; v_incoming jsonb;
BEGIN
  SELECT requirements INTO v_current FROM public.participant_onboarding_checklists WHERE participant_id = p_participant_id FOR UPDATE;
  IF v_current IS NULL THEN RAISE EXCEPTION 'checklist not found'; END IF;
  v_incoming := p_requirements -> p_item_code;
  IF (p_requirements - p_item_code) IS DISTINCT FROM (v_current - p_item_code)
    OR (v_incoming -> 'code') IS DISTINCT FROM (v_current -> p_item_code -> 'code')
    OR (v_incoming -> 'title') IS DISTINCT FROM (v_current -> p_item_code -> 'title')
    OR (v_incoming -> 'category') IS DISTINCT FROM (v_current -> p_item_code -> 'category')
    OR (v_incoming -> 'required') IS DISTINCT FROM (v_current -> p_item_code -> 'required')
    OR (v_incoming -> 'waivable') IS DISTINCT FROM (v_current -> p_item_code -> 'waivable')
  THEN RAISE EXCEPTION 'stale or non-canonical checklist update rejected'; END IF;
  PERFORM public.governance_g1_update_checklist_item(
    p_participant_id, p_actor_id, p_item_code, p_item_status,
    v_incoming->>'waiverReason', v_incoming->>'notes', v_incoming->>'documentId'
  );
END $$;

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

REVOKE EXECUTE ON FUNCTION public.governance_g1_convert_referral(uuid,uuid,text,text,numeric,jsonb,text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.governance_g1_update_checklist_item(uuid,text,text,text,text,text,text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.governance_g1_update_checklist(uuid,jsonb,text,text,text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.governance_g1_signoff_onboarding(uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.governance_g1_convert_referral(uuid,uuid,text,text,numeric,jsonb,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.governance_g1_update_checklist_item(uuid,text,text,text,text,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.governance_g1_update_checklist(uuid,jsonb,text,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.governance_g1_signoff_onboarding(uuid,text) TO service_role;
