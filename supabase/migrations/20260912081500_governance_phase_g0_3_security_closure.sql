-- ==============================================================================
-- OPUS CARE GOVERNANCE PHASE G0.3 SECURITY CLOSURE MIGRATION
-- Migration: 20260912081500_governance_phase_g0_3_security_closure.sql
-- Applied to: live Supabase project wqykzdodzcfwpgitnisx
-- Purpose:
--   1. Revoke public / anonymous base-table access to service_scope_registry.
--      RLS filters rows, not columns; dropping public base-table access guarantees
--      internal governance columns (required credentials, competencies, risk class,
--      clinical approval, quoting/rostering/invoicing eligibility) cannot be directly
--      queried by anon or participant users.
--   2. Drop public RLS policy on service_scope_registry.
--   3. Retain authenticated Staff read (is_opus_staff()) and Admin write (is_opus_admin()).
--   4. Create dedicated public-safe directory view (service_scope_public_directory)
--      exposing ONLY unclassified public marketing fields (code, name, description,
--      category, status) for website consumption.
-- ==============================================================================

-- 1. Drop public base-table policies on service_scope_registry
DROP POLICY IF EXISTS "Public read active service_scope_registry" ON public.service_scope_registry;
DROP POLICY IF EXISTS "service_scope_public_select" ON public.service_scope_registry;

-- 2. Revoke anon and public base-table privileges
REVOKE ALL ON TABLE public.service_scope_registry FROM anon;
REVOKE ALL ON TABLE public.service_scope_registry FROM public;

-- Ensure authenticated role access is restricted by RLS (Staff read, Admin write)
GRANT SELECT ON public.service_scope_registry TO authenticated;

-- 3. Create dedicated public-safe directory view exposing strictly unclassified public fields
CREATE OR REPLACE VIEW public.service_scope_public_directory WITH (security_invoker = false) AS
SELECT
  service_code,
  public_name,
  internal_description AS description,
  ndis_category AS category,
  operational_status AS status
FROM public.service_scope_registry
WHERE website_visible = true
  AND operational_status IN ('ACTIVE', 'ACTIVE_WITH_CONTROLS');

-- 4. Set explicit permissions on public-safe view
REVOKE ALL ON TABLE public.service_scope_public_directory FROM anon, authenticated, public;
GRANT SELECT ON public.service_scope_public_directory TO anon, authenticated, service_role;

COMMENT ON VIEW public.service_scope_public_directory IS 'Public-safe view exposing strictly unclassified service information (code, name, description, category, status). Zero internal governance, pricing, or credential metadata.';
