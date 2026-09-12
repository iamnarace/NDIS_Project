import type { SupabaseClient } from '@supabase/supabase-js';

export type WorkerEligibilityDecision =
  | 'ELIGIBLE'
  | 'BLOCKED_PARTICIPANT_NOT_READY'
  | 'BLOCKED_WORKER_NOT_READY'
  | 'BLOCKED_SCREENING'
  | 'BLOCKED_CREDENTIAL'
  | 'BLOCKED_TRAINING'
  | 'BLOCKED_COMPETENCY'
  | 'BLOCKED_TRANSPORT'
  | 'BLOCKED_CLINICAL_APPROVAL'
  | 'BLOCKED_SERVICE_SCOPE'
  | 'MANAGEMENT_REVIEW_REQUIRED';

export interface WorkerEligibilityResult {
  decision: WorkerEligibilityDecision;
  reasons: string[];
}

export async function evaluateWorkerEligibility(
  supabase: SupabaseClient,
  participantId: string,
  staffId: string,
  serviceCode: string,
): Promise<WorkerEligibilityResult> {
  const { data, error } = await supabase.rpc('governance_g2_worker_eligibility', {
    p_participant_id: participantId,
    p_staff_id: staffId,
    p_service_code: serviceCode,
  });
  if (error || !data) throw new Error(error?.message || 'Worker eligibility service returned no decision.');
  const result = data as WorkerEligibilityResult;
  if (!result.decision || !Array.isArray(result.reasons)) throw new Error('Worker eligibility response is invalid.');
  return result;
}
