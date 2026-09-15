-- OPUS CARE SUPPORT SERVICES
-- CAREERS & RECRUITMENT — ACCEPTANCE FIXES MIGRATION
-- Prepared 2026-09-15
--
-- Follow-up migration for:
-- 1. EOI role-interest persistence
-- 2. Atomic Hire Postgres RPC (governance_recruitment_hire_candidate)
-- 3. Future-safe sequence/atomic reference generator support

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. EOI Role Interest fields
-- ---------------------------------------------------------------------------

ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS role_interest text;

ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS role_interest_other text;

-- ---------------------------------------------------------------------------
-- 2. Staff Reference Sequence (Safe helper for atomic STF- numbering)
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  v_max_stf bigint;
BEGIN
  SELECT COALESCE(MAX(NULLIF(regexp_replace(reference_number, '\D', '', 'g'), '')::bigint), 1000)
  INTO v_max_stf
  FROM public.staff
  WHERE reference_number LIKE 'STF-%';

  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'staff_reference_seq') THEN
    EXECUTE format('CREATE SEQUENCE public.staff_reference_seq START WITH %s', v_max_stf + 1);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. Atomic Hire Candidate RPC
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
  v_new_staff public.staff%ROWTYPE;
  v_next_num bigint;
  v_now timestamptz := now();
BEGIN
  IF nullif(trim(p_actor_id), '') IS NULL THEN
    RAISE EXCEPTION 'Trusted actor required for hiring decision.';
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
    SELECT * INTO v_new_staff
    FROM public.staff
    WHERE id = p_link_existing_staff_id
    FOR UPDATE;

    IF v_new_staff.id IS NULL THEN
      RAISE EXCEPTION 'Target staff record for linking not found (ID: %).', p_link_existing_staff_id;
    END IF;

    v_staff_id := v_new_staff.id;
    v_staff_ref := v_new_staff.reference_number;

    -- Update linked staff with confirmed employment attributes if missing/updated
    UPDATE public.staff
    SET
      role_title = coalesce(nullif(trim(p_role_title), ''), v_new_staff.role_title),
      employment_basis = coalesce(p_employment_basis, v_new_staff.employment_basis),
      engagement_type = coalesce(p_engagement_relationship, v_new_staff.engagement_type),
      employment_start_date = coalesce(p_employment_start_date, v_new_staff.employment_start_date),
      service_areas = CASE WHEN p_approved_service_areas IS NOT NULL AND array_length(p_approved_service_areas, 1) > 0 THEN p_approved_service_areas ELSE v_new_staff.service_areas END,
      updated_at = v_now
    WHERE id = v_staff_id;

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

    -- Fail-closed canonical staff creation
    INSERT INTO public.staff (
      reference_number,
      full_name,
      email,
      phone,
      suburb,
      postcode,
      role_title,
      engagement_type,
      employment_basis,
      employment_start_date,
      service_areas,
      status,
      lifecycle_stage,
      is_rosterable,
      ndis_screening,
      ndis_orientation_completed,
      police_check_expiry,
      wwcc_expiry,
      first_aid_expiry,
      cpr_expiry,
      notes,
      created_at,
      updated_at
    ) VALUES (
      v_staff_ref,
      v_candidate_name,
      nullif(v_candidate_email, ''),
      nullif(v_candidate_phone, ''),
      v_app.suburb,
      v_app.postcode,
      coalesce(nullif(trim(p_role_title), ''), 'Support Worker'),
      coalesce(p_engagement_relationship, 'employee'),
      p_employment_basis,
      p_employment_start_date,
      coalesce(p_approved_service_areas, '{}'::text[]),
      'pending',
      'onboarding',
      false,
      'Unknown / Needs Verification',
      false,
      NULL,
      NULL,
      NULL,
      NULL,
      format('Hired candidate from application %s (%s). Direct recruit onboarding required before rostering.', v_app.reference_number, v_app.application_type),
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
        format('Candidate hired and linked to existing staff record %s (%s)', v_staff_ref, coalesce(p_role_title, 'Staff'))
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

-- Security: server service-role only
REVOKE ALL ON FUNCTION public.governance_recruitment_hire_candidate FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.governance_recruitment_hire_candidate TO service_role;

COMMIT;
