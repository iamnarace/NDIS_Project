import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkServiceArea } from '@/lib/regions';
import { getLiveServiceScopeEntry, type ServiceScopeItem } from '@/lib/services/serviceScope';

export type SuitabilityOutcome =
  | 'Suitable'
  | 'Suitable With Conditions'
  | 'Clinical Review Required'
  | 'Further Information Required'
  | 'Registered Provider Requirement'
  | 'Capacity Waitlist'
  | 'Management / Regulatory Review Required'
  | 'Declined / Outside Scope';

export interface PayerDetails {
  fundingType?: string;
  payerName?: string;
  payerEmail?: string;
  payerPhone?: string;
  planManagerName?: string;
  planManagerEmail?: string;
  registeredContractingProvider?: string;
  contractingArrangementDescription?: string;
  invoiceRecipient?: string;
}

export interface RiskTriageInput {
  mobilityTransfers?: boolean;
  manualHandling?: boolean;
  medicationSupport?: boolean;
  allergies?: string;
  dysphagiaMealtime?: boolean;
  seizures?: boolean;
  continenceSupport?: boolean;
  catheterCare?: boolean;
  bowelCare?: boolean;
  clinicalTasks?: boolean;
  behavioursOfConcern?: boolean;
  bspInPlace?: boolean;
  restrictivePracticesIndicated?: boolean;
  transportRequired?: boolean;
  communicationNeeds?: string;
}

export interface SuitabilityInput {
  referralId?: string;
  participantId?: string;
  participantName: string;
  dateOfBirth?: string;
  isAdult?: boolean;
  age?: number;
  fundingType: string;
  payerDetails?: PayerDetails;
  suburb: string;
  postcode?: string;
  requestedServices: string[];
  riskTriage: RiskTriageInput;
  assessedBy: string;
  assessorNotes?: string;
}

export interface SuitabilityResult {
  outcome: SuitabilityOutcome;
  outcomeReasons: string[];
  conditions: string[];
  isAdult: boolean;
  inServiceArea: boolean;
  region: string;
  serviceValidation: Array<{
    serviceCode: string;
    publicName: string;
    status: string;
    allowed: boolean;
    reason?: string;
  }>;
}

export interface ChecklistRequirement {
  code: string;
  title: string;
  category: 'Administrative & Identity' | 'Legal & Consent' | 'Care & Risk Governance' | 'Operational Readiness';
  required: boolean;
  waivable: boolean;
  status: 'pending' | 'completed' | 'waived' | 'not_applicable';
  completedAt?: string;
  completedBy?: string;
  waivedAt?: string;
  waivedBy?: string;
  waiverReason?: string;
  notes?: string;
  documentId?: string;
}

/**
 * 1. SERVICE SUITABILITY ASSESSMENT ENGINE (FAIL-CLOSED)
 * ----------------------------------------------------------------------------
 * Evaluates funding, age, service area, live service scope, and clinical/risk triage.
 * ----------------------------------------------------------------------------
 */
export async function validateSuitability(
  input: SuitabilityInput,
  customSupabase?: SupabaseClient | null
): Promise<SuitabilityResult> {
  const reasons: string[] = [];
  const conditions: string[] = [];

  // A. Age Verification: Opus Care launch scope is strictly Adults 18+
  let isAdult = true;
  if (input.dateOfBirth) {
    const dob = new Date(input.dateOfBirth);
    if (!isNaN(dob.getTime())) {
      const diffMs = Date.now() - dob.getTime();
      const age = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25));
      if (age < 18) {
        isAdult = false;
      }
    }
  } else if (input.isAdult === false || (input.age !== undefined && input.age < 18)) {
    isAdult = false;
  }

  if (!isAdult) {
    return {
      outcome: 'Declined / Outside Scope',
      outcomeReasons: [
        'Participant is under 18 years of age. Opus Care operational launch scope is strictly Adults 18+. Child service governance is not supported in the current operational phase.'
      ],
      conditions: [],
      isAdult: false,
      inServiceArea: false,
      region: 'Outside Scope',
      serviceValidation: []
    };
  }

  // B. Location / Regional Serviceability Check
  const areaCheck = checkServiceArea(input.suburb);
  const region = areaCheck.regionCanonical || (areaCheck.inServiceArea ? 'Northern NSW' : 'Outside Scope');

  if (!areaCheck.inServiceArea) {
    reasons.push(`Location (${input.suburb}) is outside Opus Care active service clusters in Northern NSW and Sydney.`);
  }

  // C. Funding & Billing Safeguards
  const funding = input.fundingType?.trim() || 'Unsure';
  let hasValidFundingBasis = false;

  if (funding === 'Self-Managed') {
    hasValidFundingBasis = true;
  } else if (funding === 'Plan-Managed') {
    hasValidFundingBasis = true;
    if (!input.payerDetails?.planManagerName && !input.payerDetails?.planManagerEmail) {
      conditions.push('Plan Manager contact and billing remittance details must be confirmed during onboarding.');
    }
  } else if (funding === 'NDIA-Managed') {
    // NDIA-Managed relationships require genuine contracting/subcontracting partner identity
    const regProvider = input.payerDetails?.registeredContractingProvider?.trim();
    if (regProvider && regProvider.length > 2) {
      hasValidFundingBasis = true;
      conditions.push(`Service delivery under NDIA-Managed arrangement requires verified third-party contracting agreement with registered provider: ${regProvider}.`);
    } else {
      reasons.push(
        'Billing Configuration Required: Opus Care operates as an unregistered provider and cannot directly claim from the NDIA. A verified subcontract or billing intermediary arrangement with a registered provider is required.'
      );
    }
  } else {
    reasons.push('Funding model is unconfirmed or unclear. Formal funding confirmation is required before service commencement.');
  }

  // D. Restrictive Practices Guard (Strict Regulatory Stop)
  if (input.riskTriage?.restrictivePracticesIndicated) {
    return {
      outcome: 'Management / Regulatory Review Required',
      outcomeReasons: [
        'Regulated Restrictive Practices indicated. As an unregistered NDIS provider, Opus Care workers cannot implement or administer regulated restrictive practices without formal NDIS Quality and Safeguards Commission registration, approved Behaviour Support Plans, and practitioner oversight.'
      ],
      conditions: ['Immediate escalation to Opus Care Director / Safeguarding Lead required.'],
      isAdult: true,
      inServiceArea: areaCheck.inServiceArea,
      region,
      serviceValidation: []
    };
  }

  // E. Live Service Scope Query (Fail-Closed)
  const serviceValidations: Array<{
    serviceCode: string;
    publicName: string;
    status: string;
    allowed: boolean;
    reason?: string;
  }> = [];

  let hasConditionalClinical = false;
  let hasRegistrationRequired = false;
  let hasActiveWithControls = false;

  if (!input.requestedServices || input.requestedServices.length === 0) {
    reasons.push('No requested services specified for assessment.');
  } else {
    for (const code of input.requestedServices) {
      try {
        const item: ServiceScopeItem = await getLiveServiceScopeEntry(code, customSupabase);
        
        if (item.registrationRequired || item.operationalStatus === 'REGISTRATION_REQUIRED') {
          hasRegistrationRequired = true;
          serviceValidations.push({
            serviceCode: item.serviceCode,
            publicName: item.publicName,
            status: item.operationalStatus,
            allowed: false,
            reason: `${item.publicName} requires NDIS Provider Registration (Opus Care is currently unregistered).`,
          });
        } else if (item.clinicalApprovalRequired || item.operationalStatus === 'CONDITIONAL_CLINICAL') {
          hasConditionalClinical = true;
          serviceValidations.push({
            serviceCode: item.serviceCode,
            publicName: item.publicName,
            status: item.operationalStatus,
            allowed: false,
            reason: `${item.publicName} requires Clinical Governance and AHPRA supervisory clearance prior to delivery.`,
          });
        } else if (item.operationalStatus === 'ACTIVE_WITH_CONTROLS') {
          hasActiveWithControls = true;
          serviceValidations.push({
            serviceCode: item.serviceCode,
            publicName: item.publicName,
            status: item.operationalStatus,
            allowed: true,
            reason: 'Active with controls: requires risk assessment and personal support profile.',
          });
        } else if (item.operationalStatus === 'ACTIVE') {
          serviceValidations.push({
            serviceCode: item.serviceCode,
            publicName: item.publicName,
            status: item.operationalStatus,
            allowed: true,
          });
        } else {
          serviceValidations.push({
            serviceCode: item.serviceCode,
            publicName: item.publicName,
            status: item.operationalStatus,
            allowed: false,
            reason: `Service status is ${item.operationalStatus} (not active on current roadmap).`,
          });
        }
      } catch (err: any) {
        // Fail-closed on database or service query errors
        throw new Error(`Governance service unavailable — could not verify service scope for ${code}: ${err.message}`);
      }
    }
  }

  // F. Risk Triage Controls
  if (input.riskTriage?.clinicalTasks || input.riskTriage?.catheterCare || input.riskTriage?.bowelCare) {
    hasConditionalClinical = true;
    conditions.push('High intensity clinical tasks identified. Clinical supervisor sign-off and participant-specific healthcare plan required.');
  }

  if (input.riskTriage?.manualHandling || input.riskTriage?.mobilityTransfers) {
    conditions.push('Manual handling / transfer profile required in participant support plan.');
  }

  if (input.riskTriage?.dysphagiaMealtime) {
    conditions.push('Dysphagia / mealtime management plan from speech pathologist required.');
  }

  if (input.riskTriage?.behavioursOfConcern) {
    if (!input.riskTriage?.bspInPlace) {
      conditions.push('Behaviours of concern noted without formal Behaviour Support Plan. Escalation and risk profile required.');
    } else {
      conditions.push('Current positive Behaviour Support Plan must be reviewed and attached to onboarding.');
    }
  }

  // G. Deterministic Outcome Calculation
  let outcome: SuitabilityOutcome;

  if (!areaCheck.inServiceArea) {
    outcome = 'Declined / Outside Scope';
  } else if (hasRegistrationRequired) {
    outcome = 'Registered Provider Requirement';
    reasons.push('One or more requested services require NDIS Provider Registration.');
  } else if (hasConditionalClinical) {
    outcome = 'Clinical Review Required';
    reasons.push('Requested supports require clinical governance review and supervisory sign-off.');
  } else if (!hasValidFundingBasis) {
    outcome = 'Further Information Required';
  } else if (conditions.length > 0 || hasActiveWithControls) {
    outcome = 'Suitable With Conditions';
  } else {
    outcome = 'Suitable';
  }

  return {
    outcome,
    outcomeReasons: reasons,
    conditions,
    isAdult: true,
    inServiceArea: areaCheck.inServiceArea,
    region,
    serviceValidation: serviceValidations,
  };
}

/**
 * 2. DYNAMIC ONBOARDING REQUIREMENTS GENERATOR
 * ----------------------------------------------------------------------------
 * Generates tailored checklist items based on participant complexity, funding,
 * and requested services. Ordinary community access is not forced through clinical plans.
 * ----------------------------------------------------------------------------
 */
export function computeOnboardingRequirements(
  assessment: SuitabilityResult,
  riskTriage: RiskTriageInput,
  fundingType: string
): Record<string, ChecklistRequirement> {
  const reqs: Record<string, ChecklistRequirement> = {};

  const addReq = (
    code: string,
    title: string,
    category: ChecklistRequirement['category'],
    required: boolean,
    waivable: boolean,
    notes?: string
  ) => {
    reqs[code] = {
      code,
      title,
      category,
      required,
      waivable,
      status: required ? 'pending' : 'not_applicable',
      notes,
    };
  };

  // Administrative & Identity
  addReq('identity_verified', 'Participant Legal Identity Verified', 'Administrative & Identity', true, false, 'Confirm full legal name and Medicare or photo ID.');
  addReq('ndis_number_verified', 'NDIS Participant Number Verified', 'Administrative & Identity', true, true, 'Waivable only if participant is self-funding pending NDIS access.');
  addReq('adult_age_confirmed', 'Adult 18+ Scope Confirmed', 'Administrative & Identity', true, false, 'Opus Care launch scope is strictly Adults 18+.');
  addReq('funding_payer_confirmed', 'Funding Model & Payer Details Confirmed', 'Administrative & Identity', true, false, 'Plan Manager, Self-Managed, or Registered Provider subcontract.');
  addReq('emergency_contact_recorded', 'Emergency Contact Recorded', 'Administrative & Identity', true, false, 'At least one verified next-of-kin or emergency contact.');
  addReq('communication_needs_recorded', 'Communication & Accessibility Preferences', 'Administrative & Identity', true, true, 'Participant preferred communication method.');

  // Legal & Consent
  addReq('privacy_notice_acknowledged', 'Privacy Collection Notice Acknowledged', 'Legal & Consent', true, false, 'Participant or nominee has acknowledged privacy notice.');
  addReq('participant_consent_obtained', 'Service & Support Consent Obtained', 'Legal & Consent', true, false, 'Freely given, informed consent for service delivery.');
  
  // Information Sharing is conditionally required if third party (Plan Manager / Coordinator / Allied Health) is involved
  const needsThirdPartySharing = fundingType === 'Plan-Managed' || Boolean(riskTriage.clinicalTasks || riskTriage.behavioursOfConcern);
  addReq('information_sharing_authority', 'Information Sharing Authority', 'Legal & Consent', needsThirdPartySharing, true, 'Authorises communication with Plan Manager, Coordinator, or Allied Health.');

  addReq('suitability_assessment_approved', 'Formal Service Suitability Approved', 'Legal & Consent', true, false, 'Approved suitability assessment record.');
  addReq('service_agreement_executed', 'Service Agreement Executed', 'Legal & Consent', true, false, 'Legally binding agreement executed by both parties.');
  addReq('schedule_of_supports_confirmed', 'Schedule of Supports Confirmed', 'Legal & Consent', true, false, 'Agreed items, hours, and 2026-27 NDIS rates.');

  // Care & Risk Governance
  addReq('participant_risk_assessment_completed', 'Participant Risk Assessment Completed', 'Care & Risk Governance', true, false, 'Identified environmental, mobility, and community access risks.');
  addReq('participant_support_plan_completed', 'Individual Support Plan Completed', 'Care & Risk Governance', true, false, 'Participant-centred routines, goals, and support strategies.');

  // Conditional Clinical Requirements
  const needsClinical = Boolean(
    assessment.outcome === 'Clinical Review Required' ||
    riskTriage.clinicalTasks ||
    riskTriage.catheterCare ||
    riskTriage.bowelCare ||
    riskTriage.seizures
  );
  addReq('clinical_plan_verified', 'Clinical Care Plan & Supervisory Clearance', 'Care & Risk Governance', needsClinical, false, 'Required for catheter, bowel, seizure, or clinical nursing tasks.');

  // Conditional Behaviour Support Requirements
  const needsBsp = Boolean(riskTriage.behavioursOfConcern || riskTriage.bspInPlace);
  addReq('bsp_review_completed', 'Positive Behaviour Support Plan Review', 'Care & Risk Governance', needsBsp, false, 'Required when behaviours of concern are present.');

  // Home & Community WHS
  addReq('home_community_whs_assessed', 'Home / Community WHS Environmental Assessment', 'Care & Risk Governance', true, true, 'Safety audit of physical environment.');

  // Operational Readiness
  addReq('first_shift_readiness_approved', 'First Shift Service Readiness Sign-Off', 'Operational Readiness', true, false, 'Final coordinator/admin verification before rostering.');

  return reqs;
}

/**
 * 3. SERVER-SIDE PARTICIPANT READINESS VERIFIER (FAIL-CLOSED)
 * ----------------------------------------------------------------------------
 * Loads the current onboarding checklist and calculates whether the participant
 * is fully ready for active roster scheduling.
 * ----------------------------------------------------------------------------
 */
export async function checkParticipantReadiness(
  participantId: string,
  customSupabase?: SupabaseClient | null
): Promise<{
  isReady: boolean;
  percentage: number;
  blockers: string[];
  requirements: Record<string, ChecklistRequirement>;
}> {
  const supabase = customSupabase || createAdminClient();
  if (!supabase) {
    throw new Error('Governance service unavailable — database client could not be initialized.');
  }

  const { data: checklist, error: chkErr } = await supabase
    .from('participant_onboarding_checklists')
    .select('*')
    .eq('participant_id', participantId)
    .maybeSingle();

  if (chkErr) {
    throw new Error(`Governance service unavailable — checklist lookup failed: ${chkErr.message}`);
  }

  if (!checklist) {
    return {
      isReady: false,
      percentage: 0,
      blockers: ['No onboarding checklist found for participant.'],
      requirements: {},
    };
  }

  const reqs: Record<string, ChecklistRequirement> = checklist.requirements || {};
  const blockers: string[] = [];
  let totalApplicable = 0;
  let completedOrWaived = 0;

  for (const [key, item] of Object.entries(reqs)) {
    if (!item.required) continue; // skip not_applicable
    totalApplicable++;

    if (item.status === 'completed') {
      completedOrWaived++;
    } else if (item.status === 'waived') {
      if (!item.waivable) {
        blockers.push(`Critical non-waivable requirement "${item.title}" cannot be waived.`);
      } else if (!item.waiverReason || !item.waiverReason.trim()) {
        blockers.push(`Waived requirement "${item.title}" is missing mandatory waiver rationale.`);
      } else {
        completedOrWaived++;
      }
    } else {
      blockers.push(`Incomplete requirement: ${item.title}`);
    }
  }

  const percentage = totalApplicable > 0 ? Math.round((completedOrWaived / totalApplicable) * 100) : 0;
  const isReady = totalApplicable > 0 && completedOrWaived === totalApplicable && blockers.length === 0;

  return {
    isReady,
    percentage,
    blockers,
    requirements: reqs,
  };
}
