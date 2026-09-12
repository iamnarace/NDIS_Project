-- Governance G1: missing funding/billing facts must fail closed.

ALTER TABLE public.referrals ALTER COLUMN funding_type DROP DEFAULT;
ALTER TABLE public.participants ALTER COLUMN funding_type DROP DEFAULT;
ALTER TABLE public.service_suitability_assessments ALTER COLUMN billing_relationship_status DROP DEFAULT;

ALTER TABLE public.referrals DROP CONSTRAINT IF EXISTS referrals_funding_type_check;
ALTER TABLE public.referrals ADD CONSTRAINT referrals_funding_type_check
  CHECK (funding_type IN ('Plan-Managed', 'Self-Managed')) NOT VALID;
ALTER TABLE public.referrals VALIDATE CONSTRAINT referrals_funding_type_check;
