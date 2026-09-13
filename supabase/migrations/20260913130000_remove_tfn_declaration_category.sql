-- ==============================================================================
-- OPUS CARE GOVERNANCE MIGRATION: REMOVE TFN DECLARATION CATEGORY & SCRUB POLICY
-- Migration: 20260913130000_remove_tfn_declaration_category.sql
-- Applied to: live Supabase project wqykzdodzcfwpgitnisx
-- ==============================================================================

-- 1. Remove tfn_declaration from public.documents.category check constraint
ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_category_check;
ALTER TABLE public.documents ADD CONSTRAINT documents_category_check
  CHECK (category = ANY (ARRAY[
    'service_agreement'::text,
    'ndis_plan'::text,
    'risk_assessment'::text,
    'care_plan'::text,
    'police_check'::text,
    'wwcc'::text,
    'first_aid'::text,
    'cpr'::text,
    'driver_license'::text,
    'car_insurance'::text,
    'payslip'::text,
    'employment_contract'::text,
    'super_choice'::text,
    'worker_screening'::text,
    'contractor_insurance'::text,
    'vehicle_insurance'::text,
    'vehicle_safety_check'::text,
    'training_cert'::text,
    'qualification'::text,
    'identity'::text,
    'consent'::text,
    'other'::text
  ]));

-- 2. Update DOC-AGR-01 markdown to use Non-GST Registration Disclosure
UPDATE public.controlled_documents
SET content_markdown = REPLACE(content_markdown, '**GST Exemption Disclosure:**', '**Non-GST Registration Disclosure:**')
WHERE document_code = 'DOC-AGR-01';

-- 3. Update DOC-PRC-01 markdown to scrub parenthetical 2 clear business days
UPDATE public.controlled_documents
SET content_markdown = REPLACE(content_markdown, '(e.g. by 2:00 PM of the preceding business day, or 2 clear business days where agreed for scheduled group or rostered services)', '(in accordance with the applicable NDIS Pricing Arrangements and agreed notice periods)')
WHERE document_code = 'DOC-PRC-01';
