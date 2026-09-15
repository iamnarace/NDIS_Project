-- OPUS CARE SUPPORT SERVICES
-- CAREERS & RECRUITMENT — IMPLEMENTATION MIGRATION DRAFT
-- Prepared 2026-09-15
--
-- CANONICAL PRODUCT SPEC:
-- Opus_Care_Careers_Recruitment_FINAL_SPEC.md
--
-- IMPORTANT:
-- This is a repository-verified implementation draft, not permission to apply
-- directly to Production without the implementation agent first reconciling it
-- against the latest remote main and existing migrations.
--
-- Security architecture:
-- Public Careers access is API-mediated.
-- RLS is enabled on recruitment tables.
-- No anon/authenticated direct table access is intentionally granted.
-- Server-side public/application and Admin APIs use controlled server access.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Owner self-service configuration
-- ---------------------------------------------------------------------------

ALTER TABLE public.provider_config
  ADD COLUMN IF NOT EXISTS careers_email text;

ALTER TABLE public.provider_config
  ADD COLUMN IF NOT EXISTS recruitment_retention_months integer NOT NULL DEFAULT 12
  CHECK (recruitment_retention_months BETWEEN 1 AND 84);

-- ---------------------------------------------------------------------------
-- 2. Canonical workforce employment basis
-- Current live schema separates employee/contractor via engagement_type but
-- does not have casual/part-time/full-time/fixed-term.
-- ---------------------------------------------------------------------------

ALTER TABLE public.staff
  ADD COLUMN IF NOT EXISTS employment_basis text;

ALTER TABLE public.staff
  ADD COLUMN IF NOT EXISTS employment_start_date date;

-- Add/repair constraint idempotently.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.staff'::regclass
      AND conname = 'staff_employment_basis_check'
  ) THEN
    ALTER TABLE public.staff DROP CONSTRAINT staff_employment_basis_check;
  END IF;

  ALTER TABLE public.staff
    ADD CONSTRAINT staff_employment_basis_check
    CHECK (
      employment_basis IS NULL
      OR employment_basis = ANY (
        ARRAY['casual','part_time','full_time','fixed_term','not_applicable']::text[]
      )
    );
END $$;

-- ---------------------------------------------------------------------------
-- 3. Vacancies
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.job_vacancies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  category text,
  short_summary text NOT NULL,
  about_role text NOT NULL,
  responsibilities jsonb NOT NULL DEFAULT '[]'::jsonb,
  essential_criteria jsonb NOT NULL DEFAULT '[]'::jsonb,
  desirable_criteria jsonb NOT NULL DEFAULT '[]'::jsonb,
  service_area_ids text[] NOT NULL DEFAULT '{}'::text[],
  location_notes text,
  employment_basis text[] NOT NULL DEFAULT '{}'::text[],
  engagement_relationship text NOT NULL DEFAULT 'employee',
  positions_count integer,
  driver_licence_required boolean NOT NULL DEFAULT false,
  vehicle_required boolean NOT NULL DEFAULT false,
  ndiswc_required boolean NOT NULL DEFAULT false,
  police_check_required boolean NOT NULL DEFAULT false,
  first_aid_required boolean NOT NULL DEFAULT false,
  cpr_required boolean NOT NULL DEFAULT false,
  child_related_role boolean NOT NULL DEFAULT false,
  qualification_required boolean NOT NULL DEFAULT false,
  other_requirements jsonb NOT NULL DEFAULT '[]'::jsonb,
  pay_display_mode text NOT NULL DEFAULT 'award_text',
  pay_public_text text,
  status text NOT NULL DEFAULT 'draft',
  featured boolean NOT NULL DEFAULT false,
  opens_at timestamptz,
  closes_at timestamptz,
  published_at timestamptz,
  closed_at timestamptz,
  archived_at timestamptz,
  created_by text,
  updated_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT job_vacancies_status_check
    CHECK (status = ANY (ARRAY['draft','published','closed','archived']::text[])),

  CONSTRAINT job_vacancies_engagement_relationship_check
    CHECK (engagement_relationship = ANY (ARRAY['employee','contractor']::text[])),

  CONSTRAINT job_vacancies_pay_display_mode_check
    CHECK (pay_display_mode = ANY (ARRAY['hidden','award_text','custom_text']::text[])),

  CONSTRAINT job_vacancies_positions_count_check
    CHECK (positions_count IS NULL OR positions_count > 0),

  CONSTRAINT job_vacancies_employment_basis_check
    CHECK (
      employment_basis <@ ARRAY['casual','part_time','full_time','fixed_term']::text[]
    ),

  CONSTRAINT job_vacancies_closing_window_check
    CHECK (closes_at IS NULL OR opens_at IS NULL OR closes_at > opens_at),

  CONSTRAINT job_vacancies_custom_pay_text_check
    CHECK (
      pay_display_mode <> 'custom_text'
      OR NULLIF(btrim(pay_public_text), '') IS NOT NULL
    )
);

CREATE INDEX IF NOT EXISTS job_vacancies_public_status_idx
  ON public.job_vacancies (status, published_at, opens_at, closes_at);

CREATE INDEX IF NOT EXISTS job_vacancies_slug_idx
  ON public.job_vacancies (slug);

-- ---------------------------------------------------------------------------
-- 4. Applications / Expressions of Interest
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number text NOT NULL UNIQUE,
  application_type text NOT NULL,
  vacancy_id uuid REFERENCES public.job_vacancies(id) ON DELETE RESTRICT,

  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  suburb text NOT NULL,
  postcode text NOT NULL,

  preferred_service_area_ids text[] NOT NULL DEFAULT '{}'::text[],
  employment_preferences text[] NOT NULL DEFAULT '{}'::text[],
  work_rights_status text NOT NULL,
  earliest_start_date date,

  experience_summary text,
  qualification_summary text,

  driver_licence_status text,
  vehicle_access_status text,
  ndiswc_status_declared text,
  police_check_status_declared text,
  first_aid_status_declared text,
  cpr_status_declared text,
  wwcc_status_declared text,

  availability jsonb NOT NULL DEFAULT '{}'::jsonb,
  availability_notes text,
  motivation text,

  privacy_consent_at timestamptz NOT NULL,
  accuracy_declaration_at timestamptz NOT NULL,

  stage text NOT NULL DEFAULT 'new',
  source text NOT NULL DEFAULT 'website',
  submitted_at timestamptz NOT NULL DEFAULT now(),

  retention_until date,
  converted_staff_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  hired_at timestamptz,
  decision_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT job_applications_type_check
    CHECK (application_type = ANY (ARRAY['vacancy','eoi']::text[])),

  CONSTRAINT job_applications_vacancy_link_check
    CHECK (
      (application_type = 'vacancy' AND vacancy_id IS NOT NULL)
      OR
      (application_type = 'eoi' AND vacancy_id IS NULL)
    ),

  CONSTRAINT job_applications_stage_check
    CHECK (
      stage = ANY (
        ARRAY[
          'new',
          'reviewing',
          'shortlisted',
          'interview',
          'reference_check',
          'offer',
          'hired',
          'unsuccessful',
          'withdrawn'
        ]::text[]
      )
    ),

  CONSTRAINT job_applications_employment_preference_check
    CHECK (
      employment_preferences <@
      ARRAY['casual','part_time','full_time','fixed_term','flexible']::text[]
    )
);

CREATE INDEX IF NOT EXISTS job_applications_stage_idx
  ON public.job_applications (stage, submitted_at DESC);

CREATE INDEX IF NOT EXISTS job_applications_vacancy_idx
  ON public.job_applications (vacancy_id, submitted_at DESC);

CREATE INDEX IF NOT EXISTS job_applications_email_idx
  ON public.job_applications (lower(email));

CREATE INDEX IF NOT EXISTS job_applications_retention_idx
  ON public.job_applications (retention_until)
  WHERE stage IN ('unsuccessful', 'withdrawn');

-- ---------------------------------------------------------------------------
-- 5. Private applicant file metadata
-- Uses existing private `crm-documents` bucket.
-- CVs do NOT become public.documents rows.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.job_application_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL
    REFERENCES public.job_applications(id) ON DELETE CASCADE,
  file_kind text NOT NULL,
  file_name text NOT NULL,
  file_size integer NOT NULL,
  mime_type text NOT NULL,
  storage_path text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT job_application_files_kind_check
    CHECK (file_kind = ANY (ARRAY['resume','cover_letter']::text[])),

  CONSTRAINT job_application_files_size_check
    CHECK (file_size > 0 AND file_size <= 8388608)
);

CREATE INDEX IF NOT EXISTS job_application_files_application_idx
  ON public.job_application_files (application_id);

-- ---------------------------------------------------------------------------
-- 6. Immutable recruitment timeline / internal notes
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.job_application_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL
    REFERENCES public.job_applications(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  from_stage text,
  to_stage text,
  note text,
  actor text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS job_application_events_application_idx
  ON public.job_application_events (application_id, created_at ASC);

-- ---------------------------------------------------------------------------
-- 7. Interviews
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.job_interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL
    REFERENCES public.job_applications(id) ON DELETE CASCADE,
  interview_type text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  timezone text NOT NULL DEFAULT 'Australia/Sydney',
  interviewer text,
  location_or_link text,
  status text NOT NULL DEFAULT 'scheduled',
  notes text,
  outcome text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT job_interviews_type_check
    CHECK (interview_type = ANY (ARRAY['phone','video','in_person']::text[])),

  CONSTRAINT job_interviews_status_check
    CHECK (status = ANY (ARRAY['scheduled','completed','cancelled','no_show']::text[])),

  CONSTRAINT job_interviews_outcome_check
    CHECK (
      outcome IS NULL
      OR outcome = ANY (ARRAY['progress','hold','decline']::text[])
    )
);

CREATE INDEX IF NOT EXISTS job_interviews_application_idx
  ON public.job_interviews (application_id, scheduled_at DESC);

-- ---------------------------------------------------------------------------
-- 8. Reference checks
-- Collected only for progressed candidates, not initial public application.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.job_reference_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL
    REFERENCES public.job_applications(id) ON DELETE CASCADE,
  referee_name text NOT NULL,
  relationship text NOT NULL,
  organisation text,
  phone text,
  email text,
  applicant_consent_confirmed boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending',
  checked_at timestamptz,
  checked_by text,
  notes text,
  outcome text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT job_reference_checks_status_check
    CHECK (
      status = ANY (
        ARRAY['pending','contacted','completed','unable_to_contact']::text[]
      )
    )
);

CREATE INDEX IF NOT EXISTS job_reference_checks_application_idx
  ON public.job_reference_checks (application_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- 9. Row-Level Security
-- Deliberately API-mediated: no anon/authenticated direct access.
-- service_role / server code bypasses RLS where required.
-- ---------------------------------------------------------------------------

ALTER TABLE public.job_vacancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_application_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_application_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_reference_checks ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.job_vacancies FROM anon, authenticated;
REVOKE ALL ON public.job_applications FROM anon, authenticated;
REVOKE ALL ON public.job_application_files FROM anon, authenticated;
REVOKE ALL ON public.job_application_events FROM anon, authenticated;
REVOKE ALL ON public.job_interviews FROM anon, authenticated;
REVOKE ALL ON public.job_reference_checks FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- 10. Guardrail comments for future maintainers
-- ---------------------------------------------------------------------------

COMMENT ON TABLE public.job_applications IS
'Recruitment candidates only. Do not store TFN, bank, super account, unnecessary DOB/health data or verified worker credentials here.';

COMMENT ON COLUMN public.job_applications.ndiswc_status_declared IS
'Applicant self-declaration only. Never treat as verified worker-screening evidence.';

COMMENT ON COLUMN public.job_applications.wwcc_status_declared IS
'Applicant self-declaration only and applicable only for child-related roles.';

COMMENT ON TABLE public.job_application_files IS
'Private CV/cover-letter metadata. Objects live in private crm-documents storage under recruitment/applications paths.';

COMMIT;

-- ---------------------------------------------------------------------------
-- IMPLEMENTATION NOTES — DO NOT EXECUTE AS SQL
-- ---------------------------------------------------------------------------
--
-- 1. Before applying, inspect latest main for existing equivalent tables/columns.
-- 2. The agent should create the actual timestamped migration in the repo.
-- 3. Do not seed a published vacancy.
-- 4. If a draft sample is seeded, it must remain DRAFT and clearly marked non-public.
-- 5. Application API calculates retention_until from provider_config.recruitment_retention_months.
-- 6. Candidate -> Staff conversion should be transaction-safe and explicitly write fail-closed Staff values.
-- 7. Do not expose any recruitment table through public Supabase clients.
