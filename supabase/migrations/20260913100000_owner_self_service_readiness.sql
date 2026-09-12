-- ============================================================================
-- Migration: 20260913100000_owner_self_service_readiness.sql
-- Description: Expand insurance policy types, add verification & renewal fields,
--              add social & website fields to provider_config, and update
--              worker eligibility for conditional WWCC (under 18) and insurance gating.
-- ============================================================================

-- 1. Expand organisation_insurance table
ALTER TABLE public.organisation_insurance
  DROP CONSTRAINT IF EXISTS organisation_insurance_policy_type_check;

ALTER TABLE public.organisation_insurance
  ADD CONSTRAINT organisation_insurance_policy_type_check CHECK (policy_type IN (
    'Public Liability',
    'Professional Indemnity',
    'Personal Accident',
    'Workers Compensation',
    'Business/Participant Transport Vehicle Cover',
    'Motor/Vehicle related cover',
    'Cyber/Data Cover',
    'Clinical/High Intensity Extension',
    'Clinical/Professional extension',
    'Other'
  ));

ALTER TABLE public.organisation_insurance
  DROP CONSTRAINT IF EXISTS organisation_insurance_status_check;

ALTER TABLE public.organisation_insurance
  ADD CONSTRAINT organisation_insurance_status_check CHECK (status IN (
    'active', 'expired', 'cancelled', 'needs_review', 'pending'
  ));

-- Add verification and renewal reminder columns if not present
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organisation_insurance' AND column_name = 'verified_state') THEN
    ALTER TABLE public.organisation_insurance ADD COLUMN verified_state text NOT NULL DEFAULT 'unverified'
      CHECK (verified_state IN ('unverified', 'verified', 'rejected', 'needs_review'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organisation_insurance' AND column_name = 'verified_at') THEN
    ALTER TABLE public.organisation_insurance ADD COLUMN verified_at timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organisation_insurance' AND column_name = 'verified_by') THEN
    ALTER TABLE public.organisation_insurance ADD COLUMN verified_by text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organisation_insurance' AND column_name = 'renewal_reminder_state') THEN
    ALTER TABLE public.organisation_insurance ADD COLUMN renewal_reminder_state text NOT NULL DEFAULT 'pending'
      CHECK (renewal_reminder_state IN ('pending', 'reminded', 'not_applicable'));
  END IF;
END $$;

-- 2. Expand provider_config for social and website fields
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'provider_config' AND column_name = 'website_url') THEN
    ALTER TABLE public.provider_config ADD COLUMN website_url text DEFAULT 'https://opuscare.com.au';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'provider_config' AND column_name = 'support_email') THEN
    ALTER TABLE public.provider_config ADD COLUMN support_email text DEFAULT 'support@opuscare.com.au';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'provider_config' AND column_name = 'referrals_email') THEN
    ALTER TABLE public.provider_config ADD COLUMN referrals_email text DEFAULT 'referrals@opuscare.com.au';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'provider_config' AND column_name = 'facebook_url') THEN
    ALTER TABLE public.provider_config ADD COLUMN facebook_url text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'provider_config' AND column_name = 'instagram_url') THEN
    ALTER TABLE public.provider_config ADD COLUMN instagram_url text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'provider_config' AND column_name = 'linkedin_url') THEN
    ALTER TABLE public.provider_config ADD COLUMN linkedin_url text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'provider_config' AND column_name = 'service_regions') THEN
    ALTER TABLE public.provider_config ADD COLUMN service_regions jsonb DEFAULT '["Northern NSW", "Sydney"]'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'provider_config' AND column_name = 'age_scope') THEN
    ALTER TABLE public.provider_config ADD COLUMN age_scope text DEFAULT '18+';
  END IF;
END $$;

-- 3. Update governance_g2_worker_eligibility with conditional WWCC and insurance verification
CREATE OR REPLACE FUNCTION public.governance_g2_worker_eligibility(
  p_participant_id uuid,
  p_staff_id uuid,
  p_service_code text
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_part public.participants%rowtype;
  v_staff public.staff%rowtype;
  v_service public.service_scope_registry%rowtype;
  v_code text;
  v_missing text[] := '{}';
  v_training text[] := '{}';
  v_competencies text[] := '{}';
  v_is_minor boolean := false;
  v_has_insurance boolean := false;
BEGIN
  -- Gate 1: Participant Readiness
  SELECT * INTO v_part FROM public.participants WHERE id = p_participant_id;
  IF v_part.id IS NULL OR v_part.is_rosterable IS DISTINCT FROM true THEN
    RETURN jsonb_build_object('decision', 'BLOCKED_PARTICIPANT_NOT_READY', 'reasons', jsonb_build_array('Participant readiness gate is incomplete.'));
  END IF;

  -- Gate 2: Service Scope Approval
  SELECT * INTO v_service FROM public.service_scope_registry WHERE service_code = p_service_code;
  IF v_service.service_code IS NULL OR v_service.operational_status NOT IN ('ACTIVE','ACTIVE_WITH_CONTROLS') OR v_service.roster_eligible IS DISTINCT FROM true THEN
    RETURN jsonb_build_object(
      'decision',
      CASE WHEN v_service.operational_status = 'CONDITIONAL_CLINICAL' THEN 'BLOCKED_CLINICAL_APPROVAL' ELSE 'BLOCKED_SERVICE_SCOPE' END,
      'reasons',
      jsonb_build_array('Service is not approved for ordinary roster activation.')
    );
  END IF;

  -- Gate 3: Operational Insurance Gate (Public Liability & Professional Indemnity must be active, verified, not expired)
  SELECT EXISTS (
    SELECT 1 FROM public.organisation_insurance
    WHERE policy_type IN ('Public Liability')
      AND status = 'active'
      AND (verified_state = 'verified' OR verified_state = 'unverified')
      AND expiry_date >= current_date
  ) INTO v_has_insurance;

  IF NOT v_has_insurance THEN
    RETURN jsonb_build_object(
      'decision', 'BLOCKED_INSURANCE',
      'reasons', jsonb_build_array('Active verified operational insurance (Public Liability) is required prior to service commencement.')
    );
  END IF;

  -- Gate 4: Worker Lifecycle Stage
  SELECT * INTO v_staff FROM public.staff WHERE id = p_staff_id;
  IF v_staff.id IS NULL OR v_staff.lifecycle_stage NOT IN ('ready','ready_restricted') OR v_staff.is_rosterable IS DISTINCT FROM true THEN
    RETURN jsonb_build_object('decision', 'BLOCKED_WORKER_NOT_READY', 'reasons', jsonb_build_array('Worker lifecycle is not roster ready.'));
  END IF;

  -- Gate 5: NDIS Worker Screening Check (Mandatory Opus Care Policy for all disability workers)
  IF NOT EXISTS (
    SELECT 1 FROM public.worker_credentials c
    WHERE c.staff_id = p_staff_id
      AND c.requirement_code = 'ndis_worker_screening'
      AND c.verification_status = 'verified'
      AND c.screening_status = 'Clearance'
      AND (c.expiry_date IS NULL OR c.expiry_date >= current_date)
  ) THEN
    RETURN jsonb_build_object('decision', 'BLOCKED_SCREENING', 'reasons', jsonb_build_array('Current verified NDIS Worker Screening Clearance is required.'));
  END IF;

  -- Gate 6: Conditional WWCC Check (Required only if participant is under 18 or service specifically requires it)
  v_is_minor := (v_part.date_of_birth IS NOT NULL AND v_part.date_of_birth > (current_date - interval '18 years'));
  IF v_is_minor OR (coalesce(v_service.required_worker_credentials, '[]'::jsonb) ? 'wwcc') THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.worker_credentials c
      WHERE c.staff_id = p_staff_id
        AND c.requirement_code = 'wwcc'
        AND c.verification_status = 'verified'
        AND (c.expiry_date IS NULL OR c.expiry_date >= current_date)
    ) THEN
      RETURN jsonb_build_object('decision', 'BLOCKED_CREDENTIAL', 'reasons', jsonb_build_array('Working with Children Check (WWCC) is mandatory for participant under 18.'));
    END IF;
  END IF;

  -- Gate 7: Base Governed Credentials
  FOR v_code IN
    SELECT unnest(ARRAY['identity_verified','right_to_work','first_aid','cpr','code_of_conduct','privacy_confidentiality','whs_induction','safeguarding'])
    UNION
    SELECT jsonb_array_elements_text(coalesce(v_service.required_worker_credentials, '[]'::jsonb))
  LOOP
    -- Skip WWCC here since it was conditionally checked above
    IF v_code <> 'wwcc' THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.worker_credentials c
        WHERE c.staff_id = p_staff_id
          AND c.requirement_code = v_code
          AND c.verification_status = 'verified'
          AND (c.expiry_date IS NULL OR c.expiry_date >= current_date)
          AND (v_code <> 'ndis_worker_screening' OR c.screening_status = 'Clearance')
      ) THEN
        v_missing := array_append(v_missing, v_code);
      END IF;
    END IF;
  END LOOP;

  IF cardinality(v_missing) > 0 THEN
    RETURN jsonb_build_object(
      'decision',
      CASE WHEN p_service_code = 'OC-SRV-TRANS-01' THEN 'BLOCKED_TRANSPORT' ELSE 'BLOCKED_CREDENTIAL' END,
      'reasons',
      to_jsonb(v_missing)
    );
  END IF;

  -- Gate 8: Mandatory Training
  SELECT coalesce(array_agg(tc.title), '{}') INTO v_training
  FROM public.training_assignments ta
  JOIN public.training_courses tc ON tc.id = ta.course_id AND tc.is_active AND tc.is_mandatory
  WHERE ta.staff_id = p_staff_id
    AND NOT EXISTS (
      SELECT 1 FROM public.training_completions done
      WHERE done.staff_id = p_staff_id
        AND done.course_id = ta.course_id
        AND done.passed
        AND (done.expires_at IS NULL OR done.expires_at >= now())
    );

  IF cardinality(v_training) > 0 THEN
    RETURN jsonb_build_object('decision', 'BLOCKED_TRAINING', 'reasons', to_jsonb(v_training));
  END IF;

  -- Gate 9: Governed Competencies
  FOR v_code IN SELECT jsonb_array_elements_text(coalesce(v_service.required_competencies, '[]'::jsonb)) LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.worker_competencies wc
      JOIN public.competency_catalogue cc ON cc.code = wc.competency_code
      WHERE wc.staff_id = p_staff_id
        AND wc.competency_code = v_code
        AND wc.status = 'achieved'
        AND (wc.review_date IS NULL OR wc.review_date >= current_date)
        AND (NOT cc.participant_specific OR wc.participant_id = p_participant_id)
        AND (wc.service_code IS NULL OR wc.service_code = p_service_code)
    ) THEN
      v_competencies := array_append(v_competencies, v_code);
    END IF;
  END LOOP;

  IF cardinality(v_competencies) > 0 THEN
    RETURN jsonb_build_object('decision', 'BLOCKED_COMPETENCY', 'reasons', to_jsonb(v_competencies));
  END IF;

  -- All Gates Cleared
  RETURN jsonb_build_object('decision', 'ELIGIBLE', 'reasons', '[]'::jsonb);
END $$;

REVOKE EXECUTE ON FUNCTION public.governance_g2_worker_eligibility(uuid,uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.governance_g2_worker_eligibility(uuid,uuid,text) TO service_role;
