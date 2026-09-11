-- ==============================================================================
-- OPUS CARE GOVERNANCE PHASE G0.1 HARDENING MIGRATION
-- Migration: 20260911223000_governance_phase_g0_1_hardening.sql
-- Applied to: live Supabase project wqykzdodzcfwpgitnisx
-- Purpose:
--   1. Refactor transport architecture with explicit capability flags.
--   2. Correct NDIS Support Catalogue items and names (separate General Transport
--      02_051_0108_1_1 from Activity Based Transport 04_590_0125_6_1).
--   3. Add missing time/day items (evening, night, public holiday).
--   4. Tighten RLS on service_scope_registry and organisation_insurance to
--      restrict write/full access to is_opus_admin().
-- ==============================================================================

-- 1. Add explicit transport architecture columns to service_scope_registry
ALTER TABLE public.service_scope_registry
  ADD COLUMN IF NOT EXISTS activity_based_transport_eligible BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS provider_travel_labour_eligible BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS provider_travel_non_labour_eligible BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS general_transport_support BOOLEAN NOT NULL DEFAULT false;

-- 2. Update service_scope_registry with explicit transport and catalogue mappings
-- OC-SRV-COMM-01 (Community Access)
UPDATE public.service_scope_registry
SET
  activity_based_transport_eligible = true,
  provider_travel_labour_eligible = true,
  provider_travel_non_labour_eligible = true,
  general_transport_support = false,
  ndis_support_catalogue_mapping = '["04_104_0125_6_1", "04_105_0125_6_1", "04_103_0125_6_1", "04_102_0125_6_1", "04_101_0125_6_1", "04_106_0125_6_1", "04_590_0125_6_1", "04_799_0125_6_1"]'::jsonb,
  updated_at = NOW()
WHERE service_code = 'OC-SRV-COMM-01';

-- OC-SRV-DAILY-01 (Daily Living)
UPDATE public.service_scope_registry
SET
  activity_based_transport_eligible = true,
  provider_travel_labour_eligible = true,
  provider_travel_non_labour_eligible = true,
  general_transport_support = false,
  ndis_support_catalogue_mapping = '["01_011_0107_1_1", "01_015_0107_1_1", "01_013_0107_1_1", "01_014_0107_1_1", "01_012_0107_1_1", "01_016_0107_1_1", "01_799_0107_1_1"]'::jsonb,
  updated_at = NOW()
WHERE service_code = 'OC-SRV-DAILY-01';

-- OC-SRV-HOUSE-01 (Household Tasks)
UPDATE public.service_scope_registry
SET
  activity_based_transport_eligible = false,
  provider_travel_labour_eligible = true,
  provider_travel_non_labour_eligible = true,
  general_transport_support = false,
  ndis_support_catalogue_mapping = '["01_019_0120_1_1", "01_020_0120_1_1"]'::jsonb,
  updated_at = NOW()
WHERE service_code = 'OC-SRV-HOUSE-01';

-- OC-SRV-SKILL-01 (Life Skills)
UPDATE public.service_scope_registry
SET
  activity_based_transport_eligible = false,
  provider_travel_labour_eligible = true,
  provider_travel_non_labour_eligible = true,
  general_transport_support = false,
  ndis_support_catalogue_mapping = '["15_037_0117_1_3"]'::jsonb,
  updated_at = NOW()
WHERE service_code = 'OC-SRV-SKILL-01';

-- OC-SRV-SOC-01 (Social Support)
UPDATE public.service_scope_registry
SET
  activity_based_transport_eligible = true,
  provider_travel_labour_eligible = true,
  provider_travel_non_labour_eligible = true,
  general_transport_support = false,
  ndis_support_catalogue_mapping = '["04_104_0125_6_1", "04_105_0125_6_1", "04_590_0125_6_1"]'::jsonb,
  updated_at = NOW()
WHERE service_code = 'OC-SRV-SOC-01';

-- OC-SRV-APPT-01 (Appointment Support)
UPDATE public.service_scope_registry
SET
  activity_based_transport_eligible = true,
  provider_travel_labour_eligible = true,
  provider_travel_non_labour_eligible = true,
  general_transport_support = false,
  ndis_support_catalogue_mapping = '["01_011_0107_1_1", "04_104_0125_6_1", "04_590_0125_6_1"]'::jsonb,
  updated_at = NOW()
WHERE service_code = 'OC-SRV-APPT-01';

-- OC-SRV-SHOP-01 (Shopping Assistance)
UPDATE public.service_scope_registry
SET
  activity_based_transport_eligible = true,
  provider_travel_labour_eligible = true,
  provider_travel_non_labour_eligible = true,
  general_transport_support = false,
  ndis_support_catalogue_mapping = '["01_011_0107_1_1", "01_019_0120_1_1", "04_590_0125_6_1"]'::jsonb,
  updated_at = NOW()
WHERE service_code = 'OC-SRV-SHOP-01';

-- OC-SRV-TRANS-01 (General Transport Support - Disentangled from Activity Based Transport)
UPDATE public.service_scope_registry
SET
  public_name = 'General Transport Assistance',
  internal_description = 'Direct specialized transport support under NDIS Category 02 (Assist-Travel/Transport) to access work, education, or community destinations. Distinct from Activity Based Transport provided during social participation shifts.',
  general_transport_support = true,
  activity_based_transport_eligible = false,
  provider_travel_labour_eligible = false,
  provider_travel_non_labour_eligible = false,
  ndis_support_catalogue_mapping = '["02_051_0108_1_1"]'::jsonb,
  updated_at = NOW()
WHERE service_code = 'OC-SRV-TRANS-01';

-- OC-SRV-PERS-01 (Standard Personal Support)
UPDATE public.service_scope_registry
SET
  activity_based_transport_eligible = true,
  provider_travel_labour_eligible = true,
  provider_travel_non_labour_eligible = true,
  general_transport_support = false,
  ndis_support_catalogue_mapping = '["01_011_0107_1_1", "01_015_0107_1_1", "01_013_0107_1_1", "01_014_0107_1_1", "01_012_0107_1_1"]'::jsonb,
  updated_at = NOW()
WHERE service_code = 'OC-SRV-PERS-01';

-- OC-SRV-NURS-01 (Community Nursing - Clarified metadata)
UPDATE public.service_scope_registry
SET
  internal_description = 'Clinical nursing care under Registration Group 0114 (Community Nursing Care) spanning EN, RN, CN, and NP classifications across applicable day/time variants. Strictly conditional upon clinical governance and supervision.',
  updated_at = NOW()
WHERE service_code = 'OC-SRV-NURS-01';

-- 3. Correct ndis_support_items in Supabase
-- Correct name of 02_051_0108_1_1
UPDATE public.ndis_support_items
SET support_item_name = 'Transport'
WHERE support_item_code = '02_051_0108_1_1';

-- Upsert complete 2026-27 catalogue items
INSERT INTO public.ndis_support_items (
  support_item_code, support_item_name, category, registration_group, unit, reference_rate, effective_from, effective_to, region, source_version, active
) VALUES
  ('04_105_0125_6_1', 'Access Community Social and Rec Activities - Standard - Weekday Evening', 'Core', 'Community Participation', 'Hour', 74.44, '2026-07-01', '2027-06-30', 'National Non-Remote', '2026-27.1', true),
  ('04_101_0125_6_1', 'Access Community Social and Rec Activities - Standard - Public Holiday', 'Core', 'Community Participation', 'Hour', 150.10, '2026-07-01', '2027-06-30', 'National Non-Remote', '2026-27.1', true),
  ('04_106_0125_6_1', 'Access Community Social and Rec Activities - Standard - Weekday Night', 'Core', 'Community Participation', 'Hour', 75.82, '2026-07-01', '2027-06-30', 'National Non-Remote', '2026-27.1', true),
  ('01_016_0107_1_1', 'Assistance With Self-Care Activities - Standard - Weekday Night', 'Core', 'Daily Personal Activities', 'Hour', 75.82, '2026-07-01', '2027-06-30', 'National Non-Remote', '2026-27.1', true),
  ('04_590_0125_6_1', 'Activity Based Transport', 'Core', 'Community Participation', 'Kilometre', 1.00, '2026-07-01', '2027-06-30', 'National Non-Remote', '2026-27.1', true),
  ('04_799_0125_6_1', 'Provider Travel - Non-Labour Costs', 'Core', 'Community Participation', 'Each', 1.00, '2026-07-01', '2027-06-30', 'National Non-Remote', '2026-27.1', true),
  ('01_799_0107_1_1', 'Provider Travel - Non-Labour Costs', 'Core', 'Daily Personal Activities', 'Each', 1.00, '2026-07-01', '2027-06-30', 'National Non-Remote', '2026-27.1', true)
ON CONFLICT (support_item_code) DO UPDATE SET
  support_item_name = EXCLUDED.support_item_name,
  category = EXCLUDED.category,
  registration_group = EXCLUDED.registration_group,
  unit = EXCLUDED.unit,
  reference_rate = EXCLUDED.reference_rate,
  active = true;

-- 4. Tighten RLS policies on service_scope_registry and organisation_insurance
-- Drop over-permissive staff write and generic authenticated read policies on service_scope_registry
DROP POLICY IF EXISTS "Staff full access on service_scope_registry" ON public.service_scope_registry;
DROP POLICY IF EXISTS "Authenticated read service_scope_registry" ON public.service_scope_registry;

-- Staff/Worker read-only on service_scope_registry
CREATE POLICY "Staff read service_scope_registry"
  ON public.service_scope_registry
  FOR SELECT
  TO authenticated
  USING (public.is_opus_staff());

-- Admin-only write on service_scope_registry
CREATE POLICY "Admin write service_scope_registry"
  ON public.service_scope_registry
  FOR ALL
  TO authenticated
  USING (public.is_opus_admin())
  WITH CHECK (public.is_opus_admin());

-- Tighten organisation_insurance RLS
DROP POLICY IF EXISTS "Staff full access on organisation_insurance" ON public.organisation_insurance;

-- Admin-only full access on organisation_insurance (Staff/Public have no read/write access)
CREATE POLICY "Admin full access on organisation_insurance"
  ON public.organisation_insurance
  FOR ALL
  TO authenticated
  USING (public.is_opus_admin())
  WITH CHECK (public.is_opus_admin());
