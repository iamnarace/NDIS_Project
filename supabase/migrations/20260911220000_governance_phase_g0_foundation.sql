-- ============================================================================
-- GOVERNANCE PHASE G0-REVISED: BUSINESS, SERVICE SCOPE & INSURANCE FOUNDATION
-- Database: PostgreSQL (Supabase Sydney Region: ap-southeast-2)
-- Authoritative baseline commit: 1309be8a7add81ea51def723db04cc3ed153db4d
-- ============================================================================

-- 1. Extend provider_config with legal structure, proprietor identity, and GST status
ALTER TABLE public.provider_config
  ADD COLUMN IF NOT EXISTS gst_status text NOT NULL DEFAULT 'not_registered',
  ADD COLUMN IF NOT EXISTS business_structure text NOT NULL DEFAULT 'sole_trader',
  ADD COLUMN IF NOT EXISTS proprietor_legal_name text;

DO 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'provider_config_gst_status_check') THEN
    ALTER TABLE public.provider_config ADD CONSTRAINT provider_config_gst_status_check CHECK (gst_status IN ('registered', 'not_registered'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'provider_config_business_structure_check') THEN
    ALTER TABLE public.provider_config ADD CONSTRAINT provider_config_business_structure_check CHECK (business_structure IN ('sole_trader', 'company', 'partnership', 'trust'));
  END IF;
END ;

-- Clean existing provider_config row to ensure verified baseline values
UPDATE public.provider_config
SET
  abn = '41 267 197 576',
  acn = null,
  legal_name = 'Opus Care Support Services',
  trading_name = 'Opus Care Support Services',
  business_structure = 'sole_trader',
  gst_status = 'not_registered',
  ndis_registration_status = 'unregistered',
  bank_bsb = null,
  bank_account_number = null,
  registered_address = null
WHERE id = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' OR id IN (SELECT id FROM public.provider_config LIMIT 1);

-- 2. Central Service Scope Registry Table
CREATE TABLE IF NOT EXISTS public.service_scope_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_code text UNIQUE NOT NULL,
  public_name text NOT NULL,
  internal_description text,
  ndis_category text NOT NULL,
  ndis_support_catalogue_mapping jsonb NOT NULL DEFAULT '[]'::jsonb,
  operational_status text NOT NULL CHECK (operational_status IN (
    'ACTIVE', 'ACTIVE_WITH_CONTROLS', 'CONDITIONAL_CLINICAL', 'REGISTRATION_REQUIRED', 'FUTURE', 'DISABLED'
  )),
  funding_methods_allowed jsonb NOT NULL DEFAULT '["Self-Managed", "Plan-Managed"]'::jsonb,
  registration_required boolean NOT NULL DEFAULT false,
  risk_class text NOT NULL DEFAULT 'Standard' CHECK (risk_class IN ('Standard', 'Enhanced', 'High Intensity', 'Clinical')),
  clinical_approval_required boolean NOT NULL DEFAULT false,
  participant_plan_required boolean NOT NULL DEFAULT false,
  required_worker_credentials jsonb NOT NULL DEFAULT '["ndis_worker_screening", "first_aid", "cpr", "code_of_conduct"]'::jsonb,
  required_competencies jsonb NOT NULL DEFAULT '[]'::jsonb,
  transport_eligible boolean NOT NULL DEFAULT false,
  travel_billing_eligible boolean NOT NULL DEFAULT false,
  cancellation_eligible boolean NOT NULL DEFAULT true,
  quote_eligible boolean NOT NULL DEFAULT true,
  roster_eligible boolean NOT NULL DEFAULT true,
  invoice_eligible boolean NOT NULL DEFAULT true,
  website_visible boolean NOT NULL DEFAULT true,
  effective_date date NOT NULL DEFAULT '2026-07-01',
  version text NOT NULL DEFAULT '2026-27.1',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Seed initial Opus Care Service Scope entries
INSERT INTO public.service_scope_registry (
  service_code, public_name, internal_description, ndis_category, ndis_support_catalogue_mapping,
  operational_status, funding_methods_allowed, registration_required, risk_class,
  clinical_approval_required, participant_plan_required, required_worker_credentials, required_competencies,
  transport_eligible, travel_billing_eligible, cancellation_eligible, quote_eligible, roster_eligible,
  invoice_eligible, website_visible
) VALUES
-- ACTIVE STANDARD SERVICES
(
  'OC-SRV-COMM-01', 'Community Access & Participation',
  '1-on-1 support for social, recreational, civic, and community activities.',
  'Core - Assistance with Social, Economic and Community Participation',
  '["04_104_0125_6_1", "04_103_0125_6_1", "04_102_0125_6_1"]'::jsonb,
  'ACTIVE', '["Self-Managed", "Plan-Managed"]'::jsonb, false, 'Standard',
  false, false, '["ndis_worker_screening", "first_aid", "cpr", "code_of_conduct"]'::jsonb, '[]'::jsonb,
  false, true, true, true, true, true, true
),
(
  'OC-SRV-DAILY-01', 'Daily Living Assistance',
  'Routine daily personal and practical support in the participant home.',
  'Core - Assistance with Daily Life',
  '["01_011_0107_1_1", "01_015_0107_1_1", "01_013_0107_1_1", "01_014_0107_1_1"]'::jsonb,
  'ACTIVE', '["Self-Managed", "Plan-Managed"]'::jsonb, false, 'Standard',
  false, false, '["ndis_worker_screening", "first_aid", "cpr", "code_of_conduct"]'::jsonb, '[]'::jsonb,
  false, true, true, true, true, true, true
),
(
  'OC-SRV-HOUSE-01', 'Household Tasks / Domestic Assistance',
  'Domestic assistance, cleaning, laundry, and home maintenance associated with disability needs.',
  'Core - Assistance with Daily Life',
  '["01_019_0120_1_1", "01_020_0120_1_1"]'::jsonb,
  'ACTIVE', '["Self-Managed", "Plan-Managed"]'::jsonb, false, 'Standard',
  false, false, '["ndis_worker_screening", "code_of_conduct", "whs_induction"]'::jsonb, '[]'::jsonb,
  false, true, true, true, true, true, true
),
(
  'OC-SRV-SKILL-01', 'Life Skills & Independence',
  'Goal-oriented capacity building in daily routines, meal planning, cooking, and budgeting.',
  'Capacity Building - Increased Social and Community Participation',
  '["15_037_0117_1_3"]'::jsonb,
  'ACTIVE', '["Self-Managed", "Plan-Managed"]'::jsonb, false, 'Standard',
  false, false, '["ndis_worker_screening", "first_aid", "code_of_conduct"]'::jsonb, '[]'::jsonb,
  false, true, true, true, true, true, true
),
(
  'OC-SRV-SOC-01', 'Social Support / Companionship',
  'One-to-one mentoring, active listening, and social companionship aligned with participant goals.',
  'Core - Assistance with Social, Economic and Community Participation',
  '["04_104_0125_6_1"]'::jsonb,
  'ACTIVE', '["Self-Managed", "Plan-Managed"]'::jsonb, false, 'Standard',
  false, false, '["ndis_worker_screening", "code_of_conduct"]'::jsonb, '[]'::jsonb,
  false, true, true, true, true, true, true
),
(
  'OC-SRV-APPT-01', 'Appointment Support',
  'Accompaniment to healthcare, allied health, and specialist appointments.',
  'Core - Assistance with Daily Life',
  '["01_011_0107_1_1", "04_104_0125_6_1"]'::jsonb,
  'ACTIVE', '["Self-Managed", "Plan-Managed"]'::jsonb, false, 'Standard',
  false, false, '["ndis_worker_screening", "first_aid", "code_of_conduct"]'::jsonb, '[]'::jsonb,
  false, true, true, true, true, true, true
),
(
  'OC-SRV-SHOP-01', 'Shopping / Errand Assistance',
  'Assistance with grocery shopping, personal errands, and local community transit.',
  'Core - Assistance with Daily Life',
  '["01_011_0107_1_1", "01_019_0120_1_1"]'::jsonb,
  'ACTIVE', '["Self-Managed", "Plan-Managed"]'::jsonb, false, 'Standard',
  false, false, '["ndis_worker_screening", "first_aid", "code_of_conduct"]'::jsonb, '[]'::jsonb,
  false, true, true, true, true, true, true
),
(
  'OC-SRV-TRANS-01', 'Support-Related Transport',
  'Activity-based participant transport connecting to appointments, study, recreation, or errands.',
  'Core - Transport',
  '["02_051_0108_1_1"]'::jsonb,
  'ACTIVE', '["Self-Managed", "Plan-Managed"]'::jsonb, false, 'Standard',
  false, false, '["ndis_worker_screening", "valid_driver_licence", "vehicle_insurance_comprehensive", "code_of_conduct"]'::jsonb, '["transport_safety"]'::jsonb,
  true, false, true, true, true, true, true
),
-- ACTIVE WITH CONTROLS
(
  'OC-SRV-PERS-01', 'Standard Personal Support',
  'Dressing, grooming, routine personal care, toileting, and ordinary transfers within assessed worker competency.',
  'Core - Assistance with Daily Life',
  '["01_011_0107_1_1", "01_015_0107_1_1"]'::jsonb,
  'ACTIVE_WITH_CONTROLS', '["Self-Managed", "Plan-Managed"]'::jsonb, false, 'Enhanced',
  false, true, '["ndis_worker_screening", "first_aid", "cpr", "code_of_conduct"]'::jsonb, '["manual_handling", "personal_care"]'::jsonb,
  false, true, true, true, true, true, true
),
-- CONDITIONAL CLINICAL SERVICES (Not publicly bookable or normally rosterable)
(
  'OC-SRV-NURS-01', 'Community Nursing',
  'Clinical nursing assessment, medication administration, and specialized health support delivered by a registered nurse.',
  'Capital & Core Clinical Nursing',
  '[]'::jsonb,
  'CONDITIONAL_CLINICAL', '["Self-Managed", "Plan-Managed"]'::jsonb, false, 'Clinical',
  true, true, '["ahpra_nursing", "clinical_indemnity", "ndis_worker_screening"]'::jsonb, '["clinical_nursing_assessment"]'::jsonb,
  false, true, true, false, false, false, false
),
(
  'OC-SRV-BOWEL-01', 'Complex Bowel Care',
  'High intensity bowel care under health practitioner instruction and participant-specific clinical management plan.',
  'Core - High Intensity Daily Personal Activities',
  '[]'::jsonb,
  'CONDITIONAL_CLINICAL', '["Self-Managed", "Plan-Managed"]'::jsonb, false, 'High Intensity',
  true, true, '["ndis_worker_screening", "first_aid", "cpr"]'::jsonb, '["participant_specific_bowel_care"]'::jsonb,
  false, true, true, false, false, false, false
),
(
  'OC-SRV-CATH-01', 'Urinary Catheter Management',
  'High intensity catheter care under health practitioner instruction and participant-specific clinical management plan.',
  'Core - High Intensity Daily Personal Activities',
  '[]'::jsonb,
  'CONDITIONAL_CLINICAL', '["Self-Managed", "Plan-Managed"]'::jsonb, false, 'High Intensity',
  true, true, '["ndis_worker_screening", "first_aid", "cpr"]'::jsonb, '["participant_specific_catheter_management"]'::jsonb,
  false, true, true, false, false, false, false
),
-- REGISTRATION REQUIRED & FUTURE SERVICES (Blocked from normal quote/roster/invoice/public site)
(
  'OC-SRV-PLAN-01', 'Plan Management',
  'Financial intermediary and NDIS claims processing service.',
  'Capacity Building - Support Coordination and Financial Intermediary',
  '[]'::jsonb,
  'REGISTRATION_REQUIRED', '["Plan-Managed"]'::jsonb, true, 'Standard',
  false, false, '[]'::jsonb, '[]'::jsonb,
  false, false, false, false, false, false, false
),
(
  'OC-SRV-BEHAV-01', 'Specialist Behaviour Support',
  'Specialist behaviour intervention clinical support.',
  'Capacity Building - Improved Relationships',
  '[]'::jsonb,
  'REGISTRATION_REQUIRED', '["Self-Managed", "Plan-Managed"]'::jsonb, true, 'Clinical',
  true, true, '["ahpra_or_ndis_practitioner"]'::jsonb, '["behaviour_support_assessment"]'::jsonb,
  false, false, false, false, false, false, false
),
(
  'OC-SRV-BSP-01', 'Behaviour Support Plan Development',
  'Authoring and lodgement of comprehensive Behaviour Support Plans.',
  'Capacity Building - Improved Relationships',
  '[]'::jsonb,
  'REGISTRATION_REQUIRED', '["Self-Managed", "Plan-Managed"]'::jsonb, true, 'Clinical',
  true, true, '["authorised_behaviour_practitioner"]'::jsonb, '["bsp_authoring"]'::jsonb,
  false, false, false, false, false, false, false
),
(
  'OC-SRV-SIL-01', 'Supported Independent Living (SIL)',
  '24/7 shared living and accommodation support. Mandatory registration required from 1 July 2026 under Registration Group 0138.',
  'Core - Assistance with Daily Life in a Group or Shared Living Arrangement',
  '[]'::jsonb,
  'REGISTRATION_REQUIRED', '["Plan-Managed", "NDIA-Managed"]'::jsonb, true, 'Enhanced',
  false, true, '[]'::jsonb, '[]'::jsonb,
  false, false, false, false, false, false, false
),
(
  'OC-SRV-SDA-01', 'Specialist Disability Accommodation (SDA)',
  'Purpose-built accessible housing for participants with extreme functional impairment.',
  'Capital - Specialist Disability Accommodation',
  '[]'::jsonb,
  'REGISTRATION_REQUIRED', '["Plan-Managed", "NDIA-Managed"]'::jsonb, true, 'Standard',
  false, false, '[]'::jsonb, '[]'::jsonb,
  false, false, false, false, false, false, false
),
(
  'OC-SRV-NDIA-01', 'Direct NDIA-Managed Service Delivery',
  'Direct invoicing through NDIA PRODA/PACE portal. Prohibited for unregistered providers unless delivered under registered subcontracting arrangement.',
  'Core & Capacity Building',
  '[]'::jsonb,
  'REGISTRATION_REQUIRED', '["NDIA-Managed"]'::jsonb, true, 'Standard',
  false, false, '[]'::jsonb, '[]'::jsonb,
  false, false, false, false, false, false, false
),
(
  'OC-SRV-RESTR-01', 'Regulated Restrictive Practices',
  'Seclusion, chemical, mechanical, physical, or environmental restraints. Strictly prohibited outside lawful NDIS authorization.',
  'Regulated Safeguarding',
  '[]'::jsonb,
  'REGISTRATION_REQUIRED', '[]'::jsonb, true, 'High Intensity',
  true, true, '[]'::jsonb, '[]'::jsonb,
  false, false, false, false, false, false, false
),
(
  'OC-SRV-PLAT-01', 'NDIS Digital Platform Service',
  'Qualifying digital intermediary platform matching participants to independent providers and processing payments.',
  'Platform Intermediary',
  '[]'::jsonb,
  'FUTURE', '["Self-Managed", "Plan-Managed"]'::jsonb, true, 'Standard',
  false, false, '[]'::jsonb, '[]'::jsonb,
  false, false, false, false, false, false, false
),
(
  'OC-SRV-GRP-01', 'Group & Centre-Based Activities',
  'Centre-based group social and community activities.',
  'Core - Assistance with Social, Economic and Community Participation',
  '[]'::jsonb,
  'FUTURE', '["Self-Managed", "Plan-Managed"]'::jsonb, false, 'Standard',
  false, false, '[]'::jsonb, '[]'::jsonb,
  false, false, false, false, false, false, false
)
ON CONFLICT (service_code) DO UPDATE SET
  public_name = EXCLUDED.public_name,
  internal_description = EXCLUDED.internal_description,
  operational_status = EXCLUDED.operational_status,
  funding_methods_allowed = EXCLUDED.funding_methods_allowed,
  registration_required = EXCLUDED.registration_required,
  risk_class = EXCLUDED.risk_class,
  clinical_approval_required = EXCLUDED.clinical_approval_required,
  participant_plan_required = EXCLUDED.participant_plan_required,
  required_worker_credentials = EXCLUDED.required_worker_credentials,
  required_competencies = EXCLUDED.required_competencies,
  transport_eligible = EXCLUDED.transport_eligible,
  travel_billing_eligible = EXCLUDED.travel_billing_eligible,
  quote_eligible = EXCLUDED.quote_eligible,
  roster_eligible = EXCLUDED.roster_eligible,
  invoice_eligible = EXCLUDED.invoice_eligible,
  website_visible = EXCLUDED.website_visible,
  updated_at = now();

-- Enable RLS on service_scope_registry
ALTER TABLE public.service_scope_registry ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff full access on service_scope_registry" ON public.service_scope_registry;
CREATE POLICY "Staff full access on service_scope_registry" ON public.service_scope_registry
  FOR ALL USING (public.is_opus_staff()) WITH CHECK (public.is_opus_staff());

DROP POLICY IF EXISTS "Authenticated read service_scope_registry" ON public.service_scope_registry;
CREATE POLICY "Authenticated read service_scope_registry" ON public.service_scope_registry
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public read active service_scope_registry" ON public.service_scope_registry;
CREATE POLICY "Public read active service_scope_registry" ON public.service_scope_registry
  FOR SELECT USING (website_visible = true AND operational_status IN ('ACTIVE', 'ACTIVE_WITH_CONTROLS'));

-- 3. Organisation Insurance Register Table
CREATE TABLE IF NOT EXISTS public.organisation_insurance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_type text NOT NULL CHECK (policy_type IN (
    'Public Liability',
    'Professional Indemnity',
    'Workers Compensation',
    'Business/Participant Transport Vehicle Cover',
    'Cyber/Data Cover',
    'Clinical/High Intensity Extension'
  )),
  insurer text NOT NULL,
  policy_number text NOT NULL,
  coverage_amount numeric(12,2),
  commencement_date date NOT NULL,
  expiry_date date NOT NULL,
  certificate_storage_path text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on organisation_insurance
ALTER TABLE public.organisation_insurance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff full access on organisation_insurance" ON public.organisation_insurance;
CREATE POLICY "Staff full access on organisation_insurance" ON public.organisation_insurance
  FOR ALL USING (public.is_opus_staff()) WITH CHECK (public.is_opus_staff());
