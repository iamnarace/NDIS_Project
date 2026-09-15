-- OPUS CARE SUPPORT SERVICES
-- CAREERS & RECRUITMENT — SCHEMA CONTRACT & REAL E2E MIGRATION
-- Prepared 2026-09-15
--
-- Follow-up migration for:
-- 1. Redaction & Purge tracking columns on job_applications
-- 2. Direct-to-Supabase upload session storage & tokens
-- 3. Database-atomic reference numbering (next_recruitment_reference)
-- 4. Corrected Hire RPC (governance_recruitment_hire_candidate) aligned with real staff table

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Redaction & Purge columns on job_applications
-- ---------------------------------------------------------------------------

ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS purged_at timestamptz,
  ADD COLUMN IF NOT EXISTS purged_by text,
  ADD COLUMN IF NOT EXISTS purge_reason text;

-- ---------------------------------------------------------------------------
-- 2. Direct-to-Supabase Upload Sessions Table
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.job_application_upload_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_secret_hash text NOT NULL,
  application_type text NOT NULL,
  vacancy_id uuid REFERENCES public.job_vacancies(id) ON DELETE SET NULL,
  resume_storage_path text,
  cover_storage_path text,
  resume_file_name text,
  cover_file_name text,
  resume_file_size integer,
  cover_file_size integer,
  resume_mime_type text,
  cover_mime_type text,
  expires_at timestamptz NOT NULL,
  finalized_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.job_application_upload_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.job_application_upload_sessions FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.job_application_upload_sessions TO service_role;

-- ---------------------------------------------------------------------------
-- 3. Atomic Database Reference Number Generator
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.recruitment_reference_counters (
  prefix text NOT NULL,
  calendar_year integer NOT NULL,
  last_value bigint NOT NULL DEFAULT 0,
  PRIMARY KEY (prefix, calendar_year)
);

ALTER TABLE public.recruitment_reference_counters ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.recruitment_reference_counters FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.recruitment_reference_counters TO service_role;

CREATE OR REPLACE FUNCTION public.next_recruitment_reference(p_prefix text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year integer;
  v_next_val bigint;
BEGIN
  IF p_prefix IS NULL OR trim(p_prefix) = '' THEN
    RAISE EXCEPTION 'Prefix required for recruitment reference.';
  END IF;

  -- Australia/Sydney calendar year
  v_year := EXTRACT(YEAR FROM (now() AT TIME ZONE 'Australia/Sydney'))::integer;

  INSERT INTO public.recruitment_reference_counters (prefix, calendar_year, last_value)
  VALUES (p_prefix, v_year, 1)
  ON CONFLICT (prefix, calendar_year)
  DO UPDATE SET last_value = public.recruitment_reference_counters.last_value + 1
  RETURNING last_value INTO v_next_val;

  RETURN format('%s-%s-%s', p_prefix, v_year, lpad(v_next_val::text, 5, '0'));
END;
$$;

REVOKE ALL ON FUNCTION public.next_recruitment_reference(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.next_recruitment_reference(text) TO service_role;

-- ---------------------------------------------------------------------------
-- 4. Corrected Atomic Hire Candidate RPC
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.governance_recruitment_hire_candidate(
  p_application_id uuid,
  p_actor_id text,
  p_role_title text,
  p_employment_basis text,
  p_engagement_relationship text,
  p_employment_start_date date,
  p_approved_service_areas text[],
  p_link_existing_staff_id uuid DEFAULT NULL,
  p_confirm_duplicate boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_app public.job_applications%ROWTYPE;
  v_from_stage text;
  v_staff_id uuid;
  v_staff_ref text;
  v_existing_dup public.staff%ROWTYPE;
  v_candidate_email text;
  v_candidate_phone text;
  v_candidate_name text;
  v_target_staff public.staff%ROWTYPE;
  v_next_num bigint;
  v_now timestamptz := now();
BEGIN
  IF nullif(trim(p_actor_id), '') IS NULL THEN
    RAISE EXCEPTION 'Trusted actor required for hiring decision.';
  END IF;

  IF nullif(trim(p_role_title), '') IS NULL THEN
    RAISE EXCEPTION 'Role title is required for hiring decision.';
  END IF;

  IF p_engagement_relationship NOT IN ('employee', 'contractor') THEN
    RAISE EXCEPTION 'Engagement relationship must be employee or contractor.';
  END IF;

  IF p_engagement_relationship = 'employee' AND p_employment_basis NOT IN ('casual', 'part_time', 'full_time', 'fixed_term') THEN
    RAISE EXCEPTION 'Valid employment basis is required for employee hires.';
  END IF;

  -- 1. Lock and fetch application record
  SELECT * INTO v_app
  FROM public.job_applications
  WHERE id = p_application_id
  FOR UPDATE;

  IF v_app.id IS NULL THEN
    RAISE EXCEPTION 'Application record not found.';
  END IF;

  IF v_app.stage = 'hired' OR v_app.converted_staff_id IS NOT NULL THEN
    RAISE EXCEPTION 'This candidate has already been hired (Staff ID: %).', v_app.converted_staff_id;
  END IF;

  v_from_stage := v_app.stage;
  v_candidate_email := lower(trim(coalesce(v_app.email, '')));
  v_candidate_phone := trim(coalesce(v_app.phone, ''));
  v_candidate_name := trim(coalesce(v_app.first_name, '') || ' ' || coalesce(v_app.last_name, ''));

  -- 2. Link existing or Create new Staff
  IF p_link_existing_staff_id IS NOT NULL THEN
    SELECT * INTO v_target_staff
    FROM public.staff
    WHERE id = p_link_existing_staff_id
    FOR UPDATE;

    IF v_target_staff.id IS NULL THEN
      RAISE EXCEPTION 'Target staff record for linking not found (ID: %).', p_link_existing_staff_id;
    END IF;

    v_staff_id := v_target_staff.id;
    v_staff_ref := v_target_staff.reference_number;

  ELSE
    -- Duplicate Staff Check
    IF v_candidate_email <> '' OR v_candidate_phone <> '' THEN
      SELECT * INTO v_existing_dup
      FROM public.staff
      WHERE (v_candidate_email <> '' AND lower(trim(email)) = v_candidate_email)
         OR (v_candidate_phone <> '' AND trim(phone) = v_candidate_phone)
      LIMIT 1;

      IF v_existing_dup.id IS NOT NULL AND NOT p_confirm_duplicate THEN
        RETURN jsonb_build_object(
          'ok', false,
          'duplicate_found', true,
          'error', format('DUPLICATE_STAFF_DETECTED: A staff record with email %s or phone %s already exists (%s: %s).', v_existing_dup.email, v_existing_dup.phone, v_existing_dup.reference_number, v_existing_dup.full_name),
          'existing_staff', jsonb_build_object(
            'id', v_existing_dup.id,
            'reference_number', v_existing_dup.reference_number,
            'full_name', v_existing_dup.full_name,
            'email', v_existing_dup.email,
            'phone', v_existing_dup.phone,
            'status', v_existing_dup.status,
            'lifecycle_stage', v_existing_dup.lifecycle_stage
          )
        );
      END IF;
    END IF;

    -- Generate canonical STF-XXXXX reference
    v_next_num := nextval('public.staff_reference_seq');
    v_staff_ref := format('STF-%s', lpad(v_next_num::text, 5, '0'));

    -- Fail-closed canonical staff creation using EXACT real staff columns
    INSERT INTO public.staff (
      reference_number,
      full_name,
      email,
      phone,
      role,
      suburbs,
      engagement_type,
      employment_basis,
      employment_start_date,
      status,
      lifecycle_stage,
      is_rosterable,
      ndis_screening,
      ndis_screening_expiry,
      wwcc_number,
      wwcc_expiry,
      police_check_date,
      first_aid_expiry,
      cpr_expiry,
      ndis_orientation_completed,
      hourly_rate,
      readiness_notes,
      created_at,
      updated_at
    ) VALUES (
      v_staff_ref,
      v_candidate_name,
      nullif(v_candidate_email, ''),
      nullif(v_candidate_phone, ''),
      p_role_title,
      coalesce(p_approved_service_areas, '{}'::text[]),
      p_engagement_relationship,
      CASE WHEN p_engagement_relationship = 'contractor' THEN 'not_applicable' ELSE p_employment_basis END,
      p_employment_start_date,
      'pending',
      'onboarding',
      false,
      'Unknown / Needs Verification',
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      false,
      NULL,
      format('Hired from recruitment application %s (%s). Direct recruit onboarding required before rostering.', v_app.reference_number, v_app.application_type),
      v_now,
      v_now
    ) RETURNING id INTO v_staff_id;

  END IF;

  -- 3. Update application record atomically
  UPDATE public.job_applications
  SET
    converted_staff_id = v_staff_id,
    stage = 'hired',
    hired_at = v_now,
    decision_at = v_now,
    updated_at = v_now
  WHERE id = p_application_id;

  -- 4. Insert immutable timeline event
  INSERT INTO public.job_application_events (
    application_id,
    event_type,
    from_stage,
    to_stage,
    note,
    actor,
    created_at
  ) VALUES (
    p_application_id,
    'hired',
    v_from_stage,
    'hired',
    CASE
      WHEN p_link_existing_staff_id IS NOT NULL THEN
        format('Candidate hired and linked to existing staff record %s (%s)', v_staff_ref, p_role_title)
      ELSE
        format('Candidate hired. Created canonical staff record %s (status: pending, lifecycle: onboarding, rosterable: false)', v_staff_ref)
    END,
    p_actor_id,
    v_now
  );

  RETURN jsonb_build_object(
    'ok', true,
    'staff_id', v_staff_id,
    'staff_reference', v_staff_ref,
    'application_id', p_application_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.governance_recruitment_hire_candidate FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.governance_recruitment_hire_candidate TO service_role;

COMMIT;
