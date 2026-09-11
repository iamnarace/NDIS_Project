-- ============================================================================
-- GOVERNANCE PHASE G0.2: NDIS CATALOGUE INTEGRITY & 2026-27 PRICING CORRECTIVE MIGRATION
-- ============================================================================
-- Authoritative Source:
-- NDIA NDIS Pricing Arrangements and Price Limits 2026-27 (v1.0, effective 1 July 2026)
-- NDIA NDIS Support Catalogue 2026-27 (XLSX, official release)
--
-- Corrections Applied:
-- 1. Expands public.ndis_support_items with versioning and full catalogue metadata
--    (support_item_number, remote_price, very_remote_price, notional_unit_price,
--     quote_required, claim_type_flags, imported_at).
-- 2. Corrects DSW standard self-care rates to official 2026-27 national price limits:
--    - 01_011_0107_1_1: Weekday Daytime ($73.58/hr)
--    - 01_015_0107_1_1: Weekday Evening ($81.07/hr)
--    - 01_013_0107_1_1: Saturday ($103.54/hr)
--    - 01_014_0107_1_1: Sunday ($133.50/hr)
--    - 01_012_0107_1_1: Public Holiday ($163.46/hr)
--    - 01_002_0107_1_1: Weekday Night (Standard DSW Night Shift)
--    (Deactivates obsolete/mistyped 01_016_0107_1_1 as standard weekday night).
-- 3. Corrects Community Participation items (04_10...):
--    - 04_104_0125_6_1: Weekday Daytime ($73.58/hr)
--    - 04_103_0125_6_1: Weekday Evening ($81.07/hr)
--    - 04_105_0125_6_1: Saturday ($103.54/hr)
--    - 04_106_0125_6_1: Sunday ($133.50/hr)
--    - 04_102_0125_6_1: Public Holiday ($163.46/hr)
-- 4. Corrects Household Task items (un-swaps descriptions and corrects rates):
--    - 01_019_0120_1_1: House or Yard Maintenance ($59.01/hr)
--    - 01_020_0120_1_1: House Cleaning and Other Household Activities ($60.10/hr)
-- 5. Corrects Transport metadata:
--    - 02_051_0108_1_1: Transport (Unit: Year, no specified price limit / $0.00 placeholder)
--    - 04_590_0125_6_1: Activity Based Transport (Unit: Each, notional unit: $1.00)
--    - 01_799_0107_1_1 & 04_799_0125_6_1: Provider Travel Non-Labour (Unit: Each, notional unit: $1.00)
-- 6. Maps official Registration Group 0114 Community Nursing items
--    (15_406_0114_1_3 RN Weekday Daytime, etc.) while preserving strict clinical lock.
-- ============================================================================

-- Step 1: Expand schema of public.ndis_support_items for versioned catalogue sync
ALTER TABLE public.ndis_support_items
  ADD COLUMN IF NOT EXISTS support_item_number TEXT,
  ADD COLUMN IF NOT EXISTS remote_price NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS very_remote_price NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS notional_unit_price NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS quote_required BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS claim_type_flags JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS imported_at TIMESTAMPTZ DEFAULT now();

-- Synchronize support_item_number with support_item_code
UPDATE public.ndis_support_items
SET support_item_number = support_item_code
WHERE support_item_number IS NULL OR support_item_number = '';

-- Step 2: Seed & Correct Disability Support Worker & Community Participation Catalogue Items
INSERT INTO public.ndis_support_items (
  support_item_code,
  support_item_number,
  support_item_name,
  category,
  registration_group,
  unit,
  reference_rate,
  notional_unit_price,
  quote_required,
  effective_from,
  effective_to,
  region,
  source_version,
  active,
  notes,
  imported_at
) VALUES
  -- 1. Assistance With Self-Care Activities (Core 01 - Group 0107)
  (
    '01_011_0107_1_1',
    '01_011_0107_1_1',
    'Assistance With Self-Care Activities - Standard - Weekday Daytime',
    'Core',
    '0107 - Daily Personal Activities',
    'Hour',
    73.58,
    NULL,
    false,
    '2026-07-01',
    '2027-06-30',
    'National Non-Remote',
    '2026-27 NDIS Pricing Arrangements and Price Limits v1.0',
    true,
    'Authoritative 2026-27 DSW Standard Weekday Daytime rate',
    now()
  ),
  (
    '01_015_0107_1_1',
    '01_015_0107_1_1',
    'Assistance With Self-Care Activities - Standard - Weekday Evening',
    'Core',
    '0107 - Daily Personal Activities',
    'Hour',
    81.07,
    NULL,
    false,
    '2026-07-01',
    '2027-06-30',
    'National Non-Remote',
    '2026-27 NDIS Pricing Arrangements and Price Limits v1.0',
    true,
    'Authoritative 2026-27 DSW Standard Weekday Evening rate',
    now()
  ),
  (
    '01_013_0107_1_1',
    '01_013_0107_1_1',
    'Assistance With Self-Care Activities - Standard - Saturday',
    'Core',
    '0107 - Daily Personal Activities',
    'Hour',
    103.54,
    NULL,
    false,
    '2026-07-01',
    '2027-06-30',
    'National Non-Remote',
    '2026-27 NDIS Pricing Arrangements and Price Limits v1.0',
    true,
    'Authoritative 2026-27 DSW Standard Saturday rate',
    now()
  ),
  (
    '01_014_0107_1_1',
    '01_014_0107_1_1',
    'Assistance With Self-Care Activities - Standard - Sunday',
    'Core',
    '0107 - Daily Personal Activities',
    'Hour',
    133.50,
    NULL,
    false,
    '2026-07-01',
    '2027-06-30',
    'National Non-Remote',
    '2026-27 NDIS Pricing Arrangements and Price Limits v1.0',
    true,
    'Authoritative 2026-27 DSW Standard Sunday rate',
    now()
  ),
  (
    '01_012_0107_1_1',
    '01_012_0107_1_1',
    'Assistance With Self-Care Activities - Standard - Public Holiday',
    'Core',
    '0107 - Daily Personal Activities',
    'Hour',
    163.46,
    NULL,
    false,
    '2026-07-01',
    '2027-06-30',
    'National Non-Remote',
    '2026-27 NDIS Pricing Arrangements and Price Limits v1.0',
    true,
    'Authoritative 2026-27 DSW Standard Public Holiday rate',
    now()
  ),
  (
    '01_002_0107_1_1',
    '01_002_0107_1_1',
    'Assistance With Self-Care Activities - Standard - Weekday Night',
    'Core',
    '0107 - Daily Personal Activities',
    'Hour',
    82.57,
    NULL,
    false,
    '2026-07-01',
    '2027-06-30',
    'National Non-Remote',
    '2026-27 NDIS Pricing Arrangements and Price Limits v1.0',
    true,
    'Official NDIS 2026-27 Standard Weekday Night Self-Care item',
    now()
  ),

  -- 2. Household Tasks (Core 01 - Group 0120)
  (
    '01_019_0120_1_1',
    '01_019_0120_1_1',
    'House or Yard Maintenance',
    'Core',
    '0120 - Household Tasks',
    'Hour',
    59.01,
    NULL,
    false,
    '2026-07-01',
    '2027-06-30',
    'National Non-Remote',
    '2026-27 NDIS Pricing Arrangements and Price Limits v1.0',
    true,
    'Official NDIA description: House or Yard Maintenance ($59.01/hr)',
    now()
  ),
  (
    '01_020_0120_1_1',
    '01_020_0120_1_1',
    'House Cleaning and Other Household Activities',
    'Core',
    '0120 - Household Tasks',
    'Hour',
    60.10,
    NULL,
    false,
    '2026-07-01',
    '2027-06-30',
    'National Non-Remote',
    '2026-27 NDIS Pricing Arrangements and Price Limits v1.0',
    true,
    'Official NDIA description: House Cleaning and Other Household Activities ($60.10/hr)',
    now()
  ),

  -- 3. Provider Travel Non-Labour Costs (Core 01)
  (
    '01_799_0107_1_1',
    '01_799_0107_1_1',
    'Provider Travel - Non-Labour Costs',
    'Core',
    '0107 - Daily Personal Activities',
    'Each',
    1.00,
    1.00,
    false,
    '2026-07-01',
    '2027-06-30',
    'National Non-Remote',
    '2026-27 NDIS Pricing Arrangements and Price Limits v1.0',
    true,
    'Notional-unit claim item ($1.00 unit). Covers agreed tolls and parking fees per participant agreement.',
    now()
  ),

  -- 4. Direct General Transport (Core 02 - Group 0108)
  (
    '02_051_0108_1_1',
    '02_051_0108_1_1',
    'Transport',
    'Core',
    '0108 - Assistance with Travel/Transport Arrangements',
    'Year',
    0.00,
    NULL,
    false,
    '2026-07-01',
    '2027-06-30',
    'National Non-Remote',
    '2026-27 NDIS Pricing Arrangements and Price Limits v1.0',
    true,
    'Direct specialised transport item under Core Cat 02. Unit: Year, no specified price limit. Negotiated per plan.',
    now()
  ),

  -- 5. Access Community, Social and Rec Activities (Core 04 - Group 0125)
  (
    '04_104_0125_6_1',
    '04_104_0125_6_1',
    'Access Community Social and Rec Activities - Standard - Weekday Daytime',
    'Core',
    '0125 - Participation in Community, Social and Civic Activities',
    'Hour',
    73.58,
    NULL,
    false,
    '2026-07-01',
    '2027-06-30',
    'National Non-Remote',
    '2026-27 NDIS Pricing Arrangements and Price Limits v1.0',
    true,
    'Authoritative 2026-27 Community Access Weekday Daytime rate',
    now()
  ),
  (
    '04_103_0125_6_1',
    '04_103_0125_6_1',
    'Access Community Social and Rec Activities - Standard - Weekday Evening',
    'Core',
    '0125 - Participation in Community, Social and Civic Activities',
    'Hour',
    81.07,
    NULL,
    false,
    '2026-07-01',
    '2027-06-30',
    'National Non-Remote',
    '2026-27 NDIS Pricing Arrangements and Price Limits v1.0',
    true,
    'Authoritative 2026-27 Community Access Weekday Evening rate',
    now()
  ),
  (
    '04_105_0125_6_1',
    '04_105_0125_6_1',
    'Access Community Social and Rec Activities - Standard - Saturday',
    'Core',
    '0125 - Participation in Community, Social and Civic Activities',
    'Hour',
    103.54,
    NULL,
    false,
    '2026-07-01',
    '2027-06-30',
    'National Non-Remote',
    '2026-27 NDIS Pricing Arrangements and Price Limits v1.0',
    true,
    'Authoritative 2026-27 Community Access Saturday rate',
    now()
  ),
  (
    '04_106_0125_6_1',
    '04_106_0125_6_1',
    'Access Community Social and Rec Activities - Standard - Sunday',
    'Core',
    '0125 - Participation in Community, Social and Civic Activities',
    'Hour',
    133.50,
    NULL,
    false,
    '2026-07-01',
    '2027-06-30',
    'National Non-Remote',
    '2026-27 NDIS Pricing Arrangements and Price Limits v1.0',
    true,
    'Authoritative 2026-27 Community Access Sunday rate',
    now()
  ),
  (
    '04_102_0125_6_1',
    '04_102_0125_6_1',
    'Access Community Social and Rec Activities - Standard - Public Holiday',
    'Core',
    '0125 - Participation in Community, Social and Civic Activities',
    'Hour',
    163.46,
    NULL,
    false,
    '2026-07-01',
    '2027-06-30',
    'National Non-Remote',
    '2026-27 NDIS Pricing Arrangements and Price Limits v1.0',
    true,
    'Authoritative 2026-27 Community Access Public Holiday rate',
    now()
  ),

  -- 6. Activity Based Transport & Travel Non-Labour (Core 04)
  (
    '04_590_0125_6_1',
    '04_590_0125_6_1',
    'Activity Based Transport',
    'Core',
    '0125 - Participation in Community, Social and Civic Activities',
    'Each',
    1.00,
    1.00,
    false,
    '2026-07-01',
    '2027-06-30',
    'National Non-Remote',
    '2026-27 NDIS Pricing Arrangements and Price Limits v1.0',
    true,
    'Notional-unit claim item ($1.00 unit). Claimed based on agreed charging method and NDIS Pricing Arrangements.',
    now()
  ),
  (
    '04_799_0125_6_1',
    '04_799_0125_6_1',
    'Provider Travel - Non-Labour Costs',
    'Core',
    '0125 - Participation in Community, Social and Civic Activities',
    'Each',
    1.00,
    1.00,
    false,
    '2026-07-01',
    '2027-06-30',
    'National Non-Remote',
    '2026-27 NDIS Pricing Arrangements and Price Limits v1.0',
    true,
    'Notional-unit claim item ($1.00 unit). Covers agreed tolls, parking, and transit fares for community journey.',
    now()
  ),

  -- 7. Community Nursing Care (Registration Group 0114 - Category 15)
  (
    '15_406_0114_1_3',
    '15_406_0114_1_3',
    'Delivery of Health Supports by a Registered Nurse - Weekday Daytime',
    'Capacity Building',
    '0114 - Community Nursing Care',
    'Hour',
    124.62,
    NULL,
    false,
    '2026-07-01',
    '2027-06-30',
    'National Non-Remote',
    '2026-27 NDIS Pricing Arrangements and Price Limits v1.0',
    true,
    'Official Registration Group 0114 item. Strictly CONDITIONAL_CLINICAL.',
    now()
  ),
  (
    '15_407_0114_1_3',
    '15_407_0114_1_3',
    'Delivery of Health Supports by a Registered Nurse - Weekday Evening',
    'Capacity Building',
    '0114 - Community Nursing Care',
    'Hour',
    137.33,
    NULL,
    false,
    '2026-07-01',
    '2027-06-30',
    'National Non-Remote',
    '2026-27 NDIS Pricing Arrangements and Price Limits v1.0',
    true,
    'Official Registration Group 0114 item. Strictly CONDITIONAL_CLINICAL.',
    now()
  ),
  (
    '15_408_0114_1_3',
    '15_408_0114_1_3',
    'Delivery of Health Supports by a Registered Nurse - Saturday',
    'Capacity Building',
    '0114 - Community Nursing Care',
    'Hour',
    175.47,
    NULL,
    false,
    '2026-07-01',
    '2027-06-30',
    'National Non-Remote',
    '2026-27 NDIS Pricing Arrangements and Price Limits v1.0',
    true,
    'Official Registration Group 0114 item. Strictly CONDITIONAL_CLINICAL.',
    now()
  ),
  (
    '15_409_0114_1_3',
    '15_409_0114_1_3',
    'Delivery of Health Supports by a Registered Nurse - Sunday',
    'Capacity Building',
    '0114 - Community Nursing Care',
    'Hour',
    200.89,
    NULL,
    false,
    '2026-07-01',
    '2027-06-30',
    'National Non-Remote',
    '2026-27 NDIS Pricing Arrangements and Price Limits v1.0',
    true,
    'Official Registration Group 0114 item. Strictly CONDITIONAL_CLINICAL.',
    now()
  ),
  (
    '15_410_0114_1_3',
    '15_410_0114_1_3',
    'Delivery of Health Supports by a Registered Nurse - Public Holiday',
    'Capacity Building',
    '0114 - Community Nursing Care',
    'Hour',
    226.32,
    NULL,
    false,
    '2026-07-01',
    '2027-06-30',
    'National Non-Remote',
    '2026-27 NDIS Pricing Arrangements and Price Limits v1.0',
    true,
    'Official Registration Group 0114 item. Strictly CONDITIONAL_CLINICAL.',
    now()
  ),
  (
    '15_411_0114_1_3',
    '15_411_0114_1_3',
    'Delivery of Health Supports by an Enrolled Nurse - Weekday Daytime',
    'Capacity Building',
    '0114 - Community Nursing Care',
    'Hour',
    99.70,
    NULL,
    false,
    '2026-07-01',
    '2027-06-30',
    'National Non-Remote',
    '2026-27 NDIS Pricing Arrangements and Price Limits v1.0',
    true,
    'Official Registration Group 0114 EN item. Strictly CONDITIONAL_CLINICAL.',
    now()
  ),
  (
    '15_414_0114_1_3',
    '15_414_0114_1_3',
    'Delivery of Health Supports by a Clinical Nurse - Weekday Daytime',
    'Capacity Building',
    '0114 - Community Nursing Care',
    'Hour',
    139.87,
    NULL,
    false,
    '2026-07-01',
    '2027-06-30',
    'National Non-Remote',
    '2026-27 NDIS Pricing Arrangements and Price Limits v1.0',
    true,
    'Official Registration Group 0114 Clinical Nurse item. Strictly CONDITIONAL_CLINICAL.',
    now()
  )
ON CONFLICT (support_item_code) DO UPDATE SET
  support_item_number = EXCLUDED.support_item_number,
  support_item_name = EXCLUDED.support_item_name,
  category = EXCLUDED.category,
  registration_group = EXCLUDED.registration_group,
  unit = EXCLUDED.unit,
  reference_rate = EXCLUDED.reference_rate,
  notional_unit_price = EXCLUDED.notional_unit_price,
  quote_required = EXCLUDED.quote_required,
  effective_from = EXCLUDED.effective_from,
  effective_to = EXCLUDED.effective_to,
  region = EXCLUDED.region,
  source_version = EXCLUDED.source_version,
  active = EXCLUDED.active,
  notes = EXCLUDED.notes,
  imported_at = EXCLUDED.imported_at;

-- Step 3: Deactivate obsolete or erroneous entries
UPDATE public.ndis_support_items
SET active = false,
    notes = 'Superseded by 01_002_0107_1_1; not standard weekday night'
WHERE support_item_code = '01_016_0107_1_1';

UPDATE public.ndis_support_items
SET active = false,
    notes = 'Superseded by 04_102_0125_6_1 (Standard Public Holiday)'
WHERE support_item_code = '04_101_0125_6_1';

-- Step 4: Synchronize public.service_scope_registry with Corrected Mappings
-- OC-SRV-COMM-01 (Community Access)
UPDATE public.service_scope_registry
SET ndis_support_catalogue_mapping = '[
  "04_104_0125_6_1",
  "04_103_0125_6_1",
  "04_105_0125_6_1",
  "04_106_0125_6_1",
  "04_102_0125_6_1",
  "04_590_0125_6_1",
  "04_799_0125_6_1"
]'::jsonb,
    updated_at = now()
WHERE service_code = 'OC-SRV-COMM-01';

-- OC-SRV-DAILY-01 (Daily Living)
UPDATE public.service_scope_registry
SET ndis_support_catalogue_mapping = '[
  "01_011_0107_1_1",
  "01_015_0107_1_1",
  "01_013_0107_1_1",
  "01_014_0107_1_1",
  "01_012_0107_1_1",
  "01_002_0107_1_1",
  "01_799_0107_1_1"
]'::jsonb,
    updated_at = now()
WHERE service_code = 'OC-SRV-DAILY-01';

-- OC-SRV-HOUSE-01 (Household Tasks)
UPDATE public.service_scope_registry
SET ndis_support_catalogue_mapping = '[
  "01_019_0120_1_1",
  "01_020_0120_1_1"
]'::jsonb,
    updated_at = now()
WHERE service_code = 'OC-SRV-HOUSE-01';

-- OC-SRV-SOC-01 (Social Support / Companionship)
UPDATE public.service_scope_registry
SET ndis_support_catalogue_mapping = '[
  "04_104_0125_6_1",
  "04_103_0125_6_1",
  "04_590_0125_6_1"
]'::jsonb,
    updated_at = now()
WHERE service_code = 'OC-SRV-SOC-01';

-- OC-SRV-NURS-01 (Community Nursing)
-- Map Registration Group 0114 items while strictly keeping clinical lock
UPDATE public.service_scope_registry
SET ndis_support_catalogue_mapping = '[
  "15_406_0114_1_3",
  "15_407_0114_1_3",
  "15_408_0114_1_3",
  "15_409_0114_1_3",
  "15_410_0114_1_3",
  "15_411_0114_1_3",
  "15_414_0114_1_3"
]'::jsonb,
    operational_status = 'CONDITIONAL_CLINICAL',
    quote_eligible = false,
    roster_eligible = false,
    invoice_eligible = false,
    website_visible = false,
    updated_at = now()
WHERE service_code = 'OC-SRV-NURS-01';
