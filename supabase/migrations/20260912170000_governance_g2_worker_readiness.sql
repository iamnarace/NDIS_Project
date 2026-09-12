-- Governance G2: authoritative worker readiness and roster eligibility.

ALTER TABLE public.staff
  ADD COLUMN IF NOT EXISTS lifecycle_stage text,
  ADD COLUMN IF NOT EXISTS is_rosterable boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS readiness_notes text;

ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS service_code text REFERENCES public.service_scope_registry(service_code);
CREATE INDEX IF NOT EXISTS shifts_service_code_idx ON public.shifts(service_code);

UPDATE public.staff SET lifecycle_stage = 'legacy_review_required', is_rosterable = false,
  readiness_notes = coalesce(readiness_notes, 'Legacy worker requires verified G2 evidence before new independent support.')
WHERE lifecycle_stage IS NULL;

ALTER TABLE public.staff ALTER COLUMN lifecycle_stage SET DEFAULT 'applicant';
ALTER TABLE public.staff ALTER COLUMN lifecycle_stage SET NOT NULL;
ALTER TABLE public.staff DROP CONSTRAINT IF EXISTS staff_lifecycle_stage_check;
ALTER TABLE public.staff ADD CONSTRAINT staff_lifecycle_stage_check CHECK (lifecycle_stage IN (
  'applicant','onboarding','pending_verification','ready_restricted','ready','suspended','inactive','terminated','legacy_review_required'
));

CREATE TABLE IF NOT EXISTS public.worker_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  requirement_code text NOT NULL,
  requirement_type text NOT NULL DEFAULT 'credential' CHECK (requirement_type IN ('identity','work_eligibility','screening','credential','licence','insurance','registration','agreement','acknowledgement')),
  applicability text NOT NULL DEFAULT 'required' CHECK (applicability IN ('required','conditional','not_applicable')),
  credential_number text,
  issuer text,
  issue_date date,
  expiry_date date,
  screening_status text CHECK (screening_status IS NULL OR screening_status IN ('Clearance','Pending','Interim Bar','Exclusion','Suspension','No Valid Clearance','Unknown / Needs Verification')),
  verification_status text NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending','verified','expired','revoked','rejected')),
  verified_by text,
  verified_at timestamptz,
  evidence_document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(staff_id, requirement_code)
);

CREATE TABLE IF NOT EXISTS public.competency_catalogue (
  code text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  participant_specific boolean NOT NULL DEFAULT false,
  evidence_method text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.worker_competencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  competency_code text NOT NULL REFERENCES public.competency_catalogue(code),
  participant_id uuid REFERENCES public.participants(id) ON DELETE CASCADE,
  service_code text REFERENCES public.service_scope_registry(service_code),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','achieved','expired','revoked','rejected')),
  assessed_by text,
  achieved_at timestamptz,
  review_date date,
  evidence_document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS worker_general_competency_unique
  ON public.worker_competencies(staff_id, competency_code, coalesce(service_code, '')) WHERE participant_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS worker_participant_competency_unique
  ON public.worker_competencies(staff_id, participant_id, competency_code, coalesce(service_code, '')) WHERE participant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS worker_credentials_expiry_idx ON public.worker_credentials(expiry_date) WHERE verification_status = 'verified';
CREATE INDEX IF NOT EXISTS worker_competencies_review_idx ON public.worker_competencies(review_date) WHERE status = 'achieved';

INSERT INTO public.competency_catalogue(code,name,category,participant_specific,evidence_method) VALUES
 ('transport_safety','Participant Transport Safety','Transport',false,'Observed assessment and policy acknowledgement'),
 ('manual_handling','Manual Handling','Care',false,'Practical competency assessment'),
 ('personal_care','Personal Care','Care',false,'Observed practical competency assessment'),
 ('clinical_nursing_assessment','Clinical Nursing Assessment','Clinical',false,'Registered clinical assessor evidence'),
 ('participant_specific_bowel_care','Participant-specific Complex Bowel Care','Clinical',true,'Participant plan and supervised practical assessment'),
 ('participant_specific_catheter_management','Participant-specific Catheter Management','Clinical',true,'Participant plan and supervised practical assessment'),
 ('behaviour_support_assessment','Behaviour Support Assessment','Behaviour Support',false,'Authorised practitioner assessment'),
 ('bsp_authoring','Behaviour Support Plan Authoring','Behaviour Support',false,'Authorised practitioner evidence')
ON CONFLICT (code) DO UPDATE SET name=excluded.name,category=excluded.category,participant_specific=excluded.participant_specific,evidence_method=excluded.evidence_method;

ALTER TABLE public.worker_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competency_catalogue ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.worker_credentials, public.worker_competencies, public.competency_catalogue FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.worker_credentials, public.worker_competencies, public.competency_catalogue TO service_role;
GRANT SELECT (staff_id,requirement_code,requirement_type,applicability,expiry_date,screening_status,verification_status,verified_at,updated_at) ON public.worker_credentials TO authenticated;
GRANT SELECT (staff_id,competency_code,participant_id,service_code,status,achieved_at,review_date,updated_at) ON public.worker_competencies TO authenticated;
GRANT SELECT ON public.competency_catalogue TO authenticated;

DROP POLICY IF EXISTS "Worker reads own credential status" ON public.worker_credentials;
CREATE POLICY "Worker reads own credential status" ON public.worker_credentials FOR SELECT TO authenticated USING (staff_id = public.my_staff_id() OR public.is_opus_admin());
DROP POLICY IF EXISTS "Worker reads own competency status" ON public.worker_competencies;
CREATE POLICY "Worker reads own competency status" ON public.worker_competencies FOR SELECT TO authenticated USING (staff_id = public.my_staff_id() OR public.is_opus_admin());
DROP POLICY IF EXISTS "Authenticated reads competency catalogue" ON public.competency_catalogue;
CREATE POLICY "Authenticated reads competency catalogue" ON public.competency_catalogue FOR SELECT TO authenticated USING (public.is_portal_worker() OR public.is_opus_admin());

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

REVOKE EXECUTE ON FUNCTION public.governance_g2_worker_eligibility(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.governance_g2_worker_eligibility(uuid,uuid,text) TO service_role;

CREATE OR REPLACE FUNCTION public.governance_g2_recalculate_worker_readiness(p_staff_id uuid,p_actor_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_code text; v_missing text[]:='{}'; v_training text[]:='{}'; v_ready boolean; v_stage text;
BEGIN
  IF nullif(trim(p_actor_id),'') IS NULL THEN RAISE EXCEPTION 'trusted actor required'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.staff WHERE id=p_staff_id FOR UPDATE) THEN RAISE EXCEPTION 'worker not found'; END IF;
  FOR v_code IN SELECT unnest(ARRAY['identity_verified','right_to_work','ndis_worker_screening','first_aid','cpr','code_of_conduct','privacy_confidentiality','whs_induction','safeguarding']) LOOP
    IF NOT EXISTS (SELECT 1 FROM public.worker_credentials c WHERE c.staff_id=p_staff_id AND c.requirement_code=v_code AND c.verification_status='verified' AND (c.expiry_date IS NULL OR c.expiry_date>=current_date) AND (v_code<>'ndis_worker_screening' OR c.screening_status='Clearance')) THEN v_missing:=array_append(v_missing,v_code); END IF;
  END LOOP;
  SELECT coalesce(array_agg(tc.title), '{}') INTO v_training FROM public.training_assignments ta JOIN public.training_courses tc ON tc.id=ta.course_id AND tc.is_active AND tc.is_mandatory WHERE ta.staff_id=p_staff_id AND NOT EXISTS (SELECT 1 FROM public.training_completions done WHERE done.staff_id=p_staff_id AND done.course_id=ta.course_id AND done.passed AND (done.expires_at IS NULL OR done.expires_at>=now()));
  v_ready := cardinality(v_missing)=0 AND cardinality(v_training)=0;
  SELECT lifecycle_stage INTO v_stage FROM public.staff WHERE id=p_staff_id;
  IF v_stage IN ('suspended','inactive','terminated') THEN v_ready:=false; END IF;
  UPDATE public.staff SET is_rosterable=v_ready,
    lifecycle_stage=CASE WHEN v_stage IN ('suspended','inactive','terminated') THEN v_stage WHEN v_ready THEN 'ready' ELSE 'pending_verification' END,
    readiness_notes=CASE WHEN v_ready THEN 'Mandatory G2 worker evidence is current.' ELSE 'Missing credentials: '||array_to_string(v_missing,', ')||CASE WHEN cardinality(v_training)>0 THEN '; training: '||array_to_string(v_training,', ') ELSE '' END END,
    updated_at=now() WHERE id=p_staff_id;
  INSERT INTO public.audit_events(entity_type,entity_id,actor_type,actor_id,action,changes,metadata)
  VALUES('staff',p_staff_id,'admin_session',p_actor_id,'worker_readiness_recalculated',jsonb_build_object('is_rosterable',v_ready),jsonb_build_object('missingCredentials',v_missing,'missingTraining',v_training));
  RETURN jsonb_build_object('isRosterable',v_ready,'lifecycleStage',CASE WHEN v_ready THEN 'ready' ELSE 'pending_verification' END,'missingCredentials',v_missing,'missingTraining',v_training);
END $$;

REVOKE EXECUTE ON FUNCTION public.governance_g2_recalculate_worker_readiness(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.governance_g2_recalculate_worker_readiness(uuid,text) TO service_role;
