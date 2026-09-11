-- ==============================================================================
-- OPUS CARE GOVERNANCE PHASE G1: PARTICIPANT INTAKE & ONBOARDING GOVERNANCE
-- Migration: 20260912090000_governance_phase_g1_intake_onboarding.sql
-- Applied to: live Supabase project wqykzdodzcfwpgitnisx
-- Purpose:
--   1. Decommission silent referral-to-active conversion.
--   2. Extend participants table with lifecycle_stage, is_rosterable, and readiness tracking.
--   3. Safely backfill existing participants to 'legacy_review_required' (is_rosterable = false).
--   4. Create service_suitability_assessments table for auditable suitability reviews.
--   5. Create participant_onboarding_checklists table for dynamic readiness verification.
--   6. Enforce strict RLS (anon revoked, staff read, admin all, participant own checklist).
-- ==============================================================================

-- 1. Extend participants table with governance lifecycle fields
ALTER TABLE public.participants
  ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT NOT NULL DEFAULT 'intake_assessment',
  ADD COLUMN IF NOT EXISTS is_rosterable BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS suitability_assessment_id UUID,
  ADD COLUMN IF NOT EXISTS readiness_notes TEXT;

-- 2. Safely backfill existing participants to 'legacy_review_required'
-- Preserves existing rostered shifts while ensuring any new shifts require readiness review
UPDATE public.participants
SET
  lifecycle_stage = 'legacy_review_required',
  is_rosterable = false,
  readiness_notes = 'Legacy participant record created prior to Governance G1. Requires formal onboarding review before new shift rostering.'
WHERE lifecycle_stage = 'intake_assessment';

-- 3. Create service_suitability_assessments table
CREATE SEQUENCE IF NOT EXISTS public.ssa_seq START 1;

CREATE TABLE IF NOT EXISTS public.service_suitability_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number TEXT NOT NULL UNIQUE DEFAULT ('SSA-' || lpad(nextval('public.ssa_seq'::regclass)::text, 5, '0')),
  referral_id UUID REFERENCES public.referrals(id) ON DELETE SET NULL,
  participant_id UUID REFERENCES public.participants(id) ON DELETE SET NULL,
  assessed_by TEXT NOT NULL,
  funding_type TEXT NOT NULL,
  payer_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  billing_relationship_status TEXT NOT NULL DEFAULT 'standard',
  region TEXT NOT NULL,
  suburb TEXT NOT NULL,
  postcode TEXT,
  requested_services TEXT[] NOT NULL DEFAULT '{}',
  service_scope_validation JSONB NOT NULL DEFAULT '[]'::jsonb,
  risk_triage JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_adult BOOLEAN NOT NULL DEFAULT true,
  outcome TEXT NOT NULL,
  outcome_reasons TEXT[] NOT NULL DEFAULT '{}',
  conditions TEXT,
  assessor_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Foreign key link back from participants
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'participants_suitability_assessment_id_fkey'
  ) THEN
    ALTER TABLE public.participants
      ADD CONSTRAINT participants_suitability_assessment_id_fkey
      FOREIGN KEY (suitability_assessment_id)
      REFERENCES public.service_suitability_assessments(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- 4. Create participant_onboarding_checklists table
CREATE TABLE IF NOT EXISTS public.participant_onboarding_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE UNIQUE,
  requirements JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_ready_for_rostering BOOLEAN NOT NULL DEFAULT false,
  signoff_by TEXT,
  signoff_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Enable RLS on both tables
ALTER TABLE public.service_suitability_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_onboarding_checklists ENABLE ROW LEVEL SECURITY;

-- Revoke all permissions from anon and public
REVOKE ALL ON TABLE public.service_suitability_assessments FROM anon, public;
REVOKE ALL ON TABLE public.participant_onboarding_checklists FROM anon, public;

-- Grant authenticated and service_role
GRANT SELECT ON public.service_suitability_assessments TO authenticated;
GRANT SELECT ON public.participant_onboarding_checklists TO authenticated;
GRANT ALL ON public.service_suitability_assessments TO service_role;
GRANT ALL ON public.participant_onboarding_checklists TO service_role;

-- 6. RLS Policies on service_suitability_assessments
DROP POLICY IF EXISTS "Staff read suitability assessments" ON public.service_suitability_assessments;
CREATE POLICY "Staff read suitability assessments" ON public.service_suitability_assessments
  FOR SELECT TO authenticated USING (public.is_opus_staff());

DROP POLICY IF EXISTS "Admin manage suitability assessments" ON public.service_suitability_assessments;
CREATE POLICY "Admin manage suitability assessments" ON public.service_suitability_assessments
  FOR ALL TO authenticated USING (public.is_opus_admin()) WITH CHECK (public.is_opus_admin());

-- 7. RLS Policies on participant_onboarding_checklists
DROP POLICY IF EXISTS "Staff read onboarding checklists" ON public.participant_onboarding_checklists;
CREATE POLICY "Staff read onboarding checklists" ON public.participant_onboarding_checklists
  FOR SELECT TO authenticated USING (public.is_opus_staff());

DROP POLICY IF EXISTS "Admin manage onboarding checklists" ON public.participant_onboarding_checklists;
CREATE POLICY "Admin manage onboarding checklists" ON public.participant_onboarding_checklists
  FOR ALL TO authenticated USING (public.is_opus_admin()) WITH CHECK (public.is_opus_admin());

DROP POLICY IF EXISTS "Participant read own onboarding checklist" ON public.participant_onboarding_checklists;
CREATE POLICY "Participant read own onboarding checklist" ON public.participant_onboarding_checklists
  FOR SELECT TO authenticated USING (
    public.is_portal_participant() AND participant_id = public.my_participant_id()
  );

COMMENT ON TABLE public.service_suitability_assessments IS 'Governance G1: Formal suitability reviews enforcing funding boundaries, regional serviceability, live service scope, and risk triage.';
COMMENT ON TABLE public.participant_onboarding_checklists IS 'Governance G1: Dynamic onboarding checklist tracking mandatory governance requirements before roster readiness.';
