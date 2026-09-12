-- Correct G1 function grants inherited from Supabase default privileges.
-- The original applied migration is preserved. These RPCs are server-only.
REVOKE EXECUTE ON FUNCTION public.governance_g1_record_suitability(jsonb,text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.governance_g1_create_manual_participant(jsonb,text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.governance_g1_convert_referral(uuid,uuid,text,text,numeric,jsonb,text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.governance_g1_update_checklist(uuid,jsonb,text,text,text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.governance_g1_signoff_onboarding(uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.governance_g1_record_suitability(jsonb,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.governance_g1_create_manual_participant(jsonb,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.governance_g1_convert_referral(uuid,uuid,text,text,numeric,jsonb,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.governance_g1_update_checklist(uuid,jsonb,text,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.governance_g1_signoff_onboarding(uuid,text) TO service_role;
