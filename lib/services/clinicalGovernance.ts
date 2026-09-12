/**
 * Opus Care Support Services — Governance G6 Clinical & High-Intensity Engine
 *
 * Implements:
 * 1. Fail-closed service-level readiness for conditional clinical supports
 * 2. Ahpra / NMBA Registered Nurse verification model
 * 3. Participant-specific clinical review & care plan validation
 * 4. High-intensity participant-specific competency boundary (Bowel Care & Catheter Management)
 * 5. Atomic shift / quote / invoice clinical eligibility gates
 */

export type ClinicalServiceId =
  | 'community_nursing'
  | 'complex_bowel_care'
  | 'urinary_catheter_management';

export type ClinicalGovernanceStatus =
  | 'NOT_CONFIGURED'
  | 'GOVERNANCE_INCOMPLETE'
  | 'INSURANCE_REQUIRED'
  | 'CLINICAL_LEAD_REQUIRED'
  | 'READY_FOR_CASE_REVIEW'
  | 'ACTIVE_CONDITIONAL'
  | 'SUSPENDED';

export interface ClinicalServiceRecord {
  service_id: ClinicalServiceId;
  service_name: string;
  governance_status: ClinicalGovernanceStatus;
  clinical_lead_staff_id?: string | null;
  clinical_lead_name?: string | null;
  clinical_lead_ahpra_number?: string | null;
  insurance_policy_reference?: string | null;
  insurance_verified?: boolean;
  clinical_governance_framework_doc_code?: string | null;
}

export function evaluateClinicalServiceReadiness(
  service: ClinicalServiceRecord | null | undefined
): { isOperational: boolean; status: ClinicalGovernanceStatus; blockers: string[] } {
  const blockers: string[] = [];

  if (!service) {
    return {
      isOperational: false,
      status: 'NOT_CONFIGURED',
      blockers: ['Clinical service configuration not found in registry.'],
    };
  }

  if (service.governance_status === 'SUSPENDED') {
    return {
      isOperational: false,
      status: 'SUSPENDED',
      blockers: ['Clinical service delivery is currently suspended by management.'],
    };
  }

  if (!service.insurance_verified || !service.insurance_policy_reference) {
    blockers.push('Active clinical / professional indemnity insurance extension required before service activation.');
  }

  if (!service.clinical_lead_ahpra_number || !service.clinical_lead_name) {
    blockers.push('Verified Clinical Lead (Ahpra RN) required to provide clinical oversight.');
  }

  const isOperational =
    blockers.length === 0 &&
    (service.governance_status === 'READY_FOR_CASE_REVIEW' || service.governance_status === 'ACTIVE_CONDITIONAL');

  let derivedStatus: ClinicalGovernanceStatus = service.governance_status;
  if (blockers.length > 0) {
    if (!service.insurance_verified) derivedStatus = 'INSURANCE_REQUIRED';
    else if (!service.clinical_lead_ahpra_number) derivedStatus = 'CLINICAL_LEAD_REQUIRED';
    else derivedStatus = 'GOVERNANCE_INCOMPLETE';
  }

  return {
    isOperational,
    status: derivedStatus,
    blockers,
  };
}

export function verifyAhpraNursingRegistration(nurse: {
  ahpra_registration_number?: string | null;
  ahpra_status?: string | null;
  ahpra_verified_at?: string | null;
  ahpra_expiry_date?: string | null;
}): { isEligible: boolean; reason?: string } {
  if (!nurse.ahpra_registration_number || nurse.ahpra_registration_number.trim().length < 6) {
    return { isEligible: false, reason: 'Valid Ahpra registration number required.' };
  }

  if (nurse.ahpra_status !== 'Registered') {
    return {
      isEligible: false,
      reason: `Ahpra status is "${nurse.ahpra_status || 'Unverified'}". Only current "Registered" status is permitted for clinical nursing shifts.`,
    };
  }

  if (!nurse.ahpra_verified_at) {
    return { isEligible: false, reason: 'Ahpra registration has not been verified against the NMBA public register.' };
  }

  if (nurse.ahpra_expiry_date) {
    const expiry = new Date(nurse.ahpra_expiry_date);
    const today = new Date();
    if (expiry < today) {
      return { isEligible: false, reason: `Ahpra registration expired on ${nurse.ahpra_expiry_date}.` };
    }
  }

  return { isEligible: true };
}

export interface ParticipantClinicalPlanRecord {
  id?: string;
  plan_reference: string;
  participant_id: string;
  service_id: string;
  plan_title: string;
  treating_practitioner_name: string;
  treating_practitioner_discipline: string;
  issue_date: string;
  review_date: string;
  emergency_escalation_instructions: string;
  contraindications_and_risks: string;
  approval_status: 'Pending Review' | 'Clinical Approved' | 'Requires Revision' | 'Expired' | 'Suspended';
}

export function evaluateParticipantClinicalReadiness(
  plan: ParticipantClinicalPlanRecord | null | undefined
): { isReady: boolean; blockers: string[] } {
  const blockers: string[] = [];

  if (!plan) {
    return { isReady: false, blockers: ['No participant clinical care plan on file for this service.'] };
  }

  if (plan.approval_status !== 'Clinical Approved') {
    blockers.push(`Participant clinical care plan status is "${plan.approval_status}". Requires Clinical Lead approval.`);
  }

  const reviewDate = new Date(plan.review_date);
  const today = new Date();
  if (reviewDate < today) {
    blockers.push(`Participant clinical care plan expired on ${plan.review_date} and requires specialist re-assessment.`);
  }

  if (!plan.emergency_escalation_instructions || plan.emergency_escalation_instructions.trim().length < 10) {
    blockers.push('Plan lacks mandatory emergency escalation and complication instructions.');
  }

  return {
    isReady: blockers.length === 0,
    blockers,
  };
}

export interface ParticipantSpecificCompetencyRecord {
  worker_id: string;
  participant_id: string;
  task_type: string;
  competency_status: string;
  expiry_date: string;
  trainer_name: string;
  trainer_qualification: string;
}

export function verifyParticipantSpecificCompetency(
  competency: ParticipantSpecificCompetencyRecord | null | undefined,
  targetWorkerId: string,
  targetParticipantId: string,
  targetTaskType: string
): { isEligible: boolean; reason?: string } {
  if (!competency) {
    return {
      isEligible: false,
      reason: `Worker has no participant-specific competency record for ${targetTaskType} with this participant.`,
    };
  }

  if (competency.worker_id !== targetWorkerId) {
    return { isEligible: false, reason: 'Competency record does not match the assigned worker.' };
  }

  // Strict non-transferability between participants
  if (competency.participant_id !== targetParticipantId) {
    return {
      isEligible: false,
      reason: 'Participant-specific clinical competency is non-transferable. Competency for one participant cannot be used for another.',
    };
  }

  if (competency.task_type !== targetTaskType) {
    return { isEligible: false, reason: `Competency task type mismatch: expected ${targetTaskType}, found ${competency.task_type}.` };
  }

  if (competency.competency_status !== 'TRAINED_COMPETENT') {
    return {
      isEligible: false,
      reason: `Competency status is "${competency.competency_status}". Worker must be fully TRAINED_COMPETENT for independent delivery.`,
    };
  }

  const expiry = new Date(competency.expiry_date);
  const today = new Date();
  if (expiry < today) {
    return { isEligible: false, reason: `Participant-specific competency expired on ${competency.expiry_date}. Annual renewal required.` };
  }

  return { isEligible: true };
}

export interface ClinicalShiftSchedulingContext {
  serviceId: ClinicalServiceId;
  serviceConfig: ClinicalServiceRecord | null | undefined;
  participantPlan: ParticipantClinicalPlanRecord | null | undefined;
  isParticipantG1Rosterable: boolean;
  workerAhpra?: {
    ahpra_registration_number?: string | null;
    ahpra_status?: string | null;
    ahpra_verified_at?: string | null;
    ahpra_expiry_date?: string | null;
  } | null;
  workerCompetency?: ParticipantSpecificCompetencyRecord | null;
  workerId: string;
  participantId: string;
}

export function canScheduleClinicalShift(
  ctx: ClinicalShiftSchedulingContext
): { allowed: boolean; reason?: string } {
  // 1. Service Level Gate
  const serviceCheck = evaluateClinicalServiceReadiness(ctx.serviceConfig);
  if (!serviceCheck.isOperational) {
    return {
      allowed: false,
      reason: `Clinical service ${ctx.serviceId} is not operational: ${serviceCheck.blockers.join(' ')}`,
    };
  }

  // 2. Participant G1 Readiness Gate
  if (!ctx.isParticipantG1Rosterable) {
    return {
      allowed: false,
      reason: 'Participant is not fully onboarded and rosterable per Governance G1 checklist.',
    };
  }

  // 3. Participant Clinical Plan Gate
  const planCheck = evaluateParticipantClinicalReadiness(ctx.participantPlan);
  if (!planCheck.isReady) {
    return {
      allowed: false,
      reason: `Participant clinical care plan blocker: ${planCheck.blockers.join(' ')}`,
    };
  }

  // 4. Worker Credential Gate
  if (ctx.serviceId === 'community_nursing') {
    const nursingCheck = verifyAhpraNursingRegistration(ctx.workerAhpra || {});
    if (!nursingCheck.isEligible) {
      return {
        allowed: false,
        reason: `Community Nursing requires a verified Registered Nurse: ${nursingCheck.reason}`,
      };
    }
  } else if (ctx.serviceId === 'complex_bowel_care' || ctx.serviceId === 'urinary_catheter_management') {
    const compCheck = verifyParticipantSpecificCompetency(
      ctx.workerCompetency,
      ctx.workerId,
      ctx.participantId,
      ctx.serviceId
    );
    if (!compCheck.isEligible) {
      return {
        allowed: false,
        reason: `High-intensity support requires participant-specific competence: ${compCheck.reason}`,
      };
    }
  }

  return { allowed: true };
}
