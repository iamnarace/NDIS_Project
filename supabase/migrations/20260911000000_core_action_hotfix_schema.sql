-- Core Action Hotfix Schema Migration
-- 1. Participants: expand status constraint to include 'pending_intake', add primary_service and contact_person
ALTER TABLE public.participants DROP CONSTRAINT IF EXISTS participants_status_check;
ALTER TABLE public.participants ADD CONSTRAINT participants_status_check CHECK (status IN ('active', 'pending_intake', 'on_hold', 'discharged'));

ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS primary_service text;
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS contact_person text;

-- 2. Staff: add engagement_type, abn, emergency_contact, ndis_orientation_completed
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS engagement_type text NOT NULL DEFAULT 'employee';
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'staff_engagement_type_check'
  ) THEN
    ALTER TABLE public.staff ADD CONSTRAINT staff_engagement_type_check CHECK (engagement_type IN ('employee', 'contractor'));
  END IF;
END $$;

ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS abn text;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS emergency_contact text;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS ndis_orientation_completed boolean NOT NULL DEFAULT false;

-- 3. Activities: add staff_id for worker-specific notes
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS staff_id uuid REFERENCES public.staff(id) ON DELETE CASCADE;

-- 4. Contacts: align contacts_role_check constraint
ALTER TABLE public.contacts DROP CONSTRAINT IF EXISTS contacts_role_check;
ALTER TABLE public.contacts ADD CONSTRAINT contacts_role_check CHECK (role IN (
  'Support Coordinator',
  'Plan Manager',
  'Family / Nominee',
  'Nominee / Representative',
  'Emergency Contact',
  'Allied Health',
  'Other'
));
