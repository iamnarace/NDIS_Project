-- Governance G1 review closure: fail-closed identity, atomic transitions and least privilege.

ALTER TABLE public.service_suitability_assessments
  ALTER COLUMN is_adult DROP DEFAULT,
  ALTER COLUMN is_adult DROP NOT NULL;

CREATE TABLE IF NOT EXISTS public.contracting_provider_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name text NOT NULL,
  provider_registration_reference text NOT NULL,
  contract_reference text NOT NULL,
  verification_status text NOT NULL DEFAULT 'pending_verification'
    CHECK (verification_status IN ('pending_verification', 'verified', 'expired', 'revoked')),
  verified_by text,
  verified_at timestamptz,
  effective_from date,
  effective_to date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (verification_status <> 'verified' OR (verified_by IS NOT NULL AND verified_at IS NOT NULL))
);

ALTER TABLE public.contracting_provider_relationships ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.contracting_provider_relationships FROM anon, public, authenticated;
GRANT ALL ON TABLE public.contracting_provider_relationships TO service_role;

DROP POLICY IF EXISTS "Admin manage contracting provider relationships" ON public.contracting_provider_relationships;
CREATE POLICY "Admin manage contracting provider relationships" ON public.contracting_provider_relationships
  FOR ALL TO authenticated USING (public.is_opus_admin()) WITH CHECK (public.is_opus_admin());

DROP POLICY IF EXISTS "Staff read suitability assessments" ON public.service_suitability_assessments;
DROP POLICY IF EXISTS "Staff read onboarding checklists" ON public.participant_onboarding_checklists;
DROP POLICY IF EXISTS "Participant read own onboarding checklist" ON public.participant_onboarding_checklists;

ALTER TABLE public.participants DROP CONSTRAINT IF EXISTS participants_lifecycle_stage_check;
ALTER TABLE public.participants ADD CONSTRAINT participants_lifecycle_stage_check
  CHECK (lifecycle_stage IN ('intake_assessment', 'legacy_review_required', 'onboarding', 'active_rosterable', 'on_hold', 'exited')) NOT VALID;

ALTER TABLE public.service_suitability_assessments DROP CONSTRAINT IF EXISTS suitability_outcome_check;
ALTER TABLE public.service_suitability_assessments ADD CONSTRAINT suitability_outcome_check CHECK (outcome IN (
  'Suitable', 'Suitable With Conditions', 'Clinical Review Required',
  'Further Information Required', 'Registered Provider Requirement',
  'Capacity Waitlist', 'Management / Regulatory Review Required', 'Declined / Outside Scope'
)) NOT VALID;

ALTER TABLE public.service_suitability_assessments DROP CONSTRAINT IF EXISTS suitability_billing_relationship_status_check;
ALTER TABLE public.service_suitability_assessments ADD CONSTRAINT suitability_billing_relationship_status_check CHECK (billing_relationship_status IN (
  'not_applicable', 'pending_verification', 'verified_self_managed',
  'verified_plan_managed', 'verified_registered_provider_contract', 'billing_configuration_required'
)) NOT VALID;

CREATE OR REPLACE FUNCTION public.governance_g1_record_suitability(p_assessment jsonb, p_actor_id text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_row public.service_suitability_assessments%ROWTYPE;
BEGIN
  IF nullif(trim(p_actor_id), '') IS NULL THEN RAISE EXCEPTION 'trusted actor required'; END IF;
  INSERT INTO public.service_suitability_assessments (
    referral_id, participant_id, assessed_by, funding_type, payer_details,
    billing_relationship_status, region, suburb, postcode, requested_services,
    service_scope_validation, risk_triage, is_adult, outcome, outcome_reasons,
    conditions, assessor_notes
  ) VALUES (
    nullif(p_assessment->>'referral_id','')::uuid,
    nullif(p_assessment->>'participant_id','')::uuid,
    p_actor_id, p_assessment->>'funding_type', coalesce(p_assessment->'payer_details','{}'::jsonb),
    p_assessment->>'billing_relationship_status', p_assessment->>'region', p_assessment->>'suburb',
    nullif(p_assessment->>'postcode',''),
    ARRAY(SELECT jsonb_array_elements_text(coalesce(p_assessment->'requested_services','[]'::jsonb))),
    coalesce(p_assessment->'service_scope_validation','[]'::jsonb),
    coalesce(p_assessment->'risk_triage','{}'::jsonb),
    CASE WHEN p_assessment->'is_adult' = 'null'::jsonb THEN NULL ELSE (p_assessment->>'is_adult')::boolean END,
    p_assessment->>'outcome',
    ARRAY(SELECT jsonb_array_elements_text(coalesce(p_assessment->'outcome_reasons','[]'::jsonb))),
    nullif(p_assessment->>'conditions',''), nullif(p_assessment->>'assessor_notes','')
  ) RETURNING * INTO v_row;

  IF v_row.referral_id IS NOT NULL THEN
    UPDATE public.referrals SET status = CASE WHEN v_row.outcome = 'Declined / Outside Scope' THEN 'declined' ELSE 'assessment' END,
      updated_at = now() WHERE id = v_row.referral_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'referral update failed'; END IF;
  END IF;

  INSERT INTO public.audit_events(entity_type, entity_id, actor_type, actor_id, action, changes, metadata)
  VALUES ('service_suitability_assessment', v_row.id, 'admin_session', p_actor_id, 'suitability_assessed',
    jsonb_build_object('outcome', v_row.outcome, 'reasons', v_row.outcome_reasons, 'conditions', v_row.conditions),
    jsonb_build_object('referralId', v_row.referral_id, 'participantId', v_row.participant_id, 'fundingType', v_row.funding_type, 'region', v_row.region));
  RETURN to_jsonb(v_row);
END $$;

CREATE OR REPLACE FUNCTION public.governance_g1_create_manual_participant(p_participant jsonb, p_actor_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_row public.participants%ROWTYPE;
BEGIN
  IF nullif(trim(p_actor_id), '') IS NULL THEN RAISE EXCEPTION 'trusted actor required'; END IF;
  INSERT INTO public.participants(reference_number, full_name, ndis_number, date_of_birth, suburb, street_address,
    funding_type, plan_manager_name, plan_manager_email, allocated_weekly_hours, phone, email, status,
    lifecycle_stage, is_rosterable, readiness_notes, primary_service, contact_person,
    emergency_contact_name, emergency_contact_phone, emergency_contact_relation)
  VALUES (p_participant->>'reference_number', p_participant->>'full_name', nullif(p_participant->>'ndis_number',''),
    nullif(p_participant->>'date_of_birth','')::date, p_participant->>'suburb', nullif(p_participant->>'street_address',''),
    p_participant->>'funding_type', nullif(p_participant->>'plan_manager_name',''), nullif(p_participant->>'plan_manager_email',''),
    coalesce((p_participant->>'allocated_weekly_hours')::numeric,0), nullif(p_participant->>'phone',''), nullif(p_participant->>'email',''),
    'pending_intake', 'intake_assessment', false, 'Manual intake record. A formal service suitability assessment is required before onboarding can begin.',
    nullif(p_participant->>'primary_service',''), nullif(p_participant->>'contact_person',''),
    nullif(p_participant->>'emergency_contact_name',''), nullif(p_participant->>'emergency_contact_phone',''), nullif(p_participant->>'emergency_contact_relation',''))
  RETURNING * INTO v_row;
  INSERT INTO public.audit_events(entity_type, entity_id, actor_type, actor_id, action, changes)
  VALUES ('participant', v_row.id, 'admin_session', p_actor_id, 'manual_intake_created',
    jsonb_build_object('lifecycle_stage','intake_assessment','is_rosterable',false));
  RETURN to_jsonb(v_row);
END $$;

CREATE OR REPLACE FUNCTION public.governance_g1_convert_referral(
  p_referral_id uuid, p_assessment_id uuid, p_participant_reference text, p_ndis_number text,
  p_allocated_hours numeric, p_requirements jsonb, p_actor_id text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_ref public.referrals%ROWTYPE; v_assessment public.service_suitability_assessments%ROWTYPE;
  v_part public.participants%ROWTYPE; v_check public.participant_onboarding_checklists%ROWTYPE;
BEGIN
  SELECT * INTO v_ref FROM public.referrals WHERE id=p_referral_id FOR UPDATE;
  SELECT * INTO v_assessment FROM public.service_suitability_assessments WHERE id=p_assessment_id AND referral_id=p_referral_id FOR UPDATE;
  IF v_ref.id IS NULL OR v_assessment.id IS NULL THEN RAISE EXCEPTION 'referral or linked assessment not found'; END IF;
  IF v_assessment.outcome NOT IN ('Suitable','Suitable With Conditions') THEN RAISE EXCEPTION 'assessment outcome does not permit onboarding'; END IF;
  IF v_assessment.billing_relationship_status NOT IN ('verified_self_managed','verified_plan_managed','verified_registered_provider_contract') THEN RAISE EXCEPTION 'billing relationship is not verified'; END IF;
  INSERT INTO public.participants(reference_number, referral_id, suitability_assessment_id, full_name, ndis_number,
    phone, email, suburb, funding_type, allocated_weekly_hours, status, lifecycle_stage, is_rosterable, readiness_notes)
  VALUES (p_participant_reference, v_ref.id, v_assessment.id, v_ref.participant_name, nullif(p_ndis_number,''),
    v_ref.phone, v_ref.email, v_assessment.suburb, v_assessment.funding_type, coalesce(p_allocated_hours,0),
    'pending_intake','onboarding',false,format('Converted from referral %s following assessment %s.',coalesce(v_ref.reference_number,v_ref.id::text),v_assessment.reference_number))
  RETURNING * INTO v_part;
  INSERT INTO public.participant_onboarding_checklists(participant_id,requirements,is_ready_for_rostering)
  VALUES(v_part.id,p_requirements,false) RETURNING * INTO v_check;
  UPDATE public.service_suitability_assessments SET participant_id=v_part.id,updated_at=now() WHERE id=v_assessment.id;
  UPDATE public.referrals SET status='accepted',updated_at=now() WHERE id=v_ref.id;
  INSERT INTO public.audit_events(entity_type,entity_id,actor_type,actor_id,action,changes,metadata)
  VALUES('participant',v_part.id,'admin_session',p_actor_id,'converted_to_onboarding',
    jsonb_build_object('lifecycle_stage','onboarding','is_rosterable',false,'suitability_assessment_id',v_assessment.id),
    jsonb_build_object('referralId',v_ref.id,'assessmentReference',v_assessment.reference_number,'outcome',v_assessment.outcome));
  RETURN jsonb_build_object('participant',to_jsonb(v_part),'checklist',to_jsonb(v_check));
END $$;

CREATE OR REPLACE FUNCTION public.governance_g1_update_checklist(p_participant_id uuid, p_requirements jsonb,
  p_actor_id text, p_item_code text, p_item_status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_check_id uuid; v_ready boolean;
BEGIN
  SELECT NOT EXISTS (SELECT 1 FROM jsonb_each(p_requirements) x WHERE (x.value->>'required')::boolean
    AND NOT ((x.value->>'status')='completed' OR ((x.value->>'status')='waived' AND (x.value->>'waivable')::boolean AND nullif(trim(x.value->>'waiverReason'),'') IS NOT NULL))) INTO v_ready;
  UPDATE public.participant_onboarding_checklists SET requirements=p_requirements,is_ready_for_rostering=v_ready,updated_at=now()
    WHERE participant_id=p_participant_id RETURNING id INTO v_check_id;
  IF v_check_id IS NULL THEN RAISE EXCEPTION 'checklist not found'; END IF;
  IF NOT v_ready THEN UPDATE public.participants SET is_rosterable=false,lifecycle_stage=CASE WHEN lifecycle_stage='active_rosterable' THEN 'onboarding' ELSE lifecycle_stage END,updated_at=now() WHERE id=p_participant_id; END IF;
  INSERT INTO public.audit_events(entity_type,entity_id,actor_type,actor_id,action,changes,metadata)
  VALUES('participant_onboarding_checklist',v_check_id,'admin_session',p_actor_id,'checklist_item_updated',jsonb_build_object('code',p_item_code,'status',p_item_status),jsonb_build_object('participantId',p_participant_id,'isReady',v_ready));
END $$;

CREATE OR REPLACE FUNCTION public.governance_g1_signoff_onboarding(p_participant_id uuid,p_actor_id text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_check_id uuid; v_requirements jsonb; v_ready boolean;
BEGIN
  SELECT id,requirements INTO v_check_id,v_requirements FROM public.participant_onboarding_checklists WHERE participant_id=p_participant_id FOR UPDATE;
  IF v_check_id IS NULL THEN RAISE EXCEPTION 'checklist not found'; END IF;
  SELECT NOT EXISTS (SELECT 1 FROM jsonb_each(v_requirements) x WHERE (x.value->>'required')::boolean
    AND NOT ((x.value->>'status')='completed' OR ((x.value->>'status')='waived' AND (x.value->>'waivable')::boolean AND nullif(trim(x.value->>'waiverReason'),'') IS NOT NULL))) INTO v_ready;
  IF NOT v_ready THEN RAISE EXCEPTION 'onboarding checklist is incomplete'; END IF;
  UPDATE public.participants SET is_rosterable=true,lifecycle_stage='active_rosterable',status='active',readiness_notes='Onboarding verified through governed readiness sign-off.',updated_at=now() WHERE id=p_participant_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'participant not found'; END IF;
  UPDATE public.participant_onboarding_checklists SET is_ready_for_rostering=true,signoff_by=p_actor_id,signoff_at=now(),updated_at=now() WHERE id=v_check_id;
  INSERT INTO public.audit_events(entity_type,entity_id,actor_type,actor_id,action,changes)
  VALUES('participant',p_participant_id,'admin_session',p_actor_id,'readiness_approved',jsonb_build_object('is_rosterable',true,'lifecycle_stage','active_rosterable'));
END $$;

REVOKE ALL ON FUNCTION public.governance_g1_record_suitability(jsonb,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.governance_g1_create_manual_participant(jsonb,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.governance_g1_convert_referral(uuid,uuid,text,text,numeric,jsonb,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.governance_g1_update_checklist(uuid,jsonb,text,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.governance_g1_signoff_onboarding(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.governance_g1_record_suitability(jsonb,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.governance_g1_create_manual_participant(jsonb,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.governance_g1_convert_referral(uuid,uuid,text,text,numeric,jsonb,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.governance_g1_update_checklist(uuid,jsonb,text,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.governance_g1_signoff_onboarding(uuid,text) TO service_role;
