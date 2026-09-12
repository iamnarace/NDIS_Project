-- Migration: Add bank_account_name to provider_config
ALTER TABLE public.provider_config
  ADD COLUMN IF NOT EXISTS bank_account_name text;
