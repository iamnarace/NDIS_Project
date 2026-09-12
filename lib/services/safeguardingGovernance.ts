/**
 * Opus Care Support Services — Governance G4 Safeguarding Engine
 *
 * Implements:
 * 1. Factual Safeguarding Indicators & Critical Escalation Matrix
 * 2. Unregistered Provider Restrictive-Practice Boundary (Fail-Closed)
 * 3. Accurate External Reporting Duty Triage (Distinguishing Internal, WHS, Police, Registered Intermediary)
 * 4. Incident Closure Safety Gate (Requiring Manager Review & Safeguarding Lead Sign-Off)
 * 5. Complaint Governance (Anonymous, Advocate, Accessibility, Urgency, SLA)
 * 6. Corrective Action Linkage & Traceability
 */

export type SafeguardingIndicator =
  | 'abuse'
  | 'neglect'
  | 'exploitation'
  | 'violence'
  | 'sexual_misconduct'
  | 'financial_abuse'
  | 'coercion'
  | 'unsafe_environment'
  | 'missing_participant'
  | 'unexplained_injury'
  | 'worker_conduct_concern'
  | 'restrictive_practice_concern';

export const SAFEGUARDING_INDICATORS: { id: SafeguardingIndicator; label: string; description: string; isCritical: boolean }[] = [
  { id: 'abuse', label: 'Abuse (Physical, Emotional, Psychological)', description: 'Any act causing physical, emotional or mental harm or trauma.', isCritical: true },
  { id: 'neglect', label: 'Neglect / Deprivation of Care', description: 'Failure to provide basic necessities, supervision, or required support.', isCritical: true },
  { id: 'exploitation', label: 'Exploitation / Taking Unfair Advantage', description: 'Improper use of another person for personal, sexual or commercial advantage.', isCritical: true },
  { id: 'violence', label: 'Violence / Threat of Harm', description: 'Physical aggression, domestic violence, or assault.', isCritical: true },
  { id: 'sexual_misconduct', label: 'Sexual Misconduct / Inappropriate Conduct', description: 'Unwelcome sexual behaviour, harassment, or unlawful conduct.', isCritical: true },
  { id: 'financial_abuse', label: 'Financial Abuse / Misappropriation', description: 'Unauthorised use or theft of participant funds, property, or NDIS plan funds.', isCritical: false },
  { id: 'coercion', label: 'Coercion / Undue Influence', description: 'Pressuring participant to make decisions against their will or choice.', isCritical: false },
  { id: 'unsafe_environment', label: 'Unsafe Physical Environment / Hazard', description: 'Physical hazards, environmental contamination, or home safety risks.', isCritical: false },
  { id: 'missing_participant', label: 'Missing Participant / Unscheduled Departure', description: 'Participant unaccounted for or absent without agreed plan.', isCritical: false },
  { id: 'unexplained_injury', label: 'Unexplained Injury / Bruising', description: 'Injuries with unclear etiology or conflicting worker explanations.', isCritical: false },
  { id: 'worker_conduct_concern', label: 'Worker Conduct / Code of Conduct Breach', description: 'Behaviour violating the NDIS Code of Conduct or Opus policy.', isCritical: false },
  { id: 'restrictive_practice_concern', label: 'Restrictive Practice Concern / Allegation', description: 'Use or attempted use of seclusion, chemical, mechanical, physical, or environmental restraint.', isCritical: true },
];

export const CRITICAL_SAFEGUARDING_INDICATORS: SafeguardingIndicator[] = [
  'abuse',
  'neglect',
  'exploitation',
  'violence',
  'sexual_misconduct',
  'restrictive_practice_concern',
];

export type ExternalReportingDuty =
  | 'internal_only'
  | 'police_emergency'
  | 'safework_nsw_whs'
  | 'child_protection'
  | 'registered_provider_intermediary'
  | 'management_assessment_required';

export interface RestrictivePracticeBoundaryResult {
  hasConcern: boolean;
  managementRegulatoryReviewStop: boolean;
  canStaffAuthorise: boolean;
  bspReferenceRequired: boolean;
  regulatoryNotice: string;
}

export function evaluateRestrictivePracticeBoundary(input: {
  hasRestrictivePracticeIndicator: boolean;
  bspReference?: string | null;
  isRegisteredProvider?: boolean;
}): RestrictivePracticeBoundaryResult {
  const isRegistered = Boolean(input.isRegisteredProvider);

  if (!input.hasRestrictivePracticeIndicator) {
    return {
      hasConcern: false,
      managementRegulatoryReviewStop: false,
      canStaffAuthorise: false,
      bspReferenceRequired: false,
      regulatoryNotice: 'No restrictive practice indicators identified.',
    };
  }

  // Opus Care is unregistered: fail closed against authorisation
  return {
    hasConcern: true,
    managementRegulatoryReviewStop: true,
    canStaffAuthorise: false,
    bspReferenceRequired: Boolean(input.bspReference),
    regulatoryNotice: isRegistered
      ? 'Registered provider restrictive practice rules apply.'
      : 'Opus Care Support Services is an unregistered NDIS provider. Unregistered providers cannot authorise, approve, or implement regulated restrictive practices. A mandatory management and regulatory review stop is active. If a Behaviour Support Plan exists, it must be overseen by the participant’s specialist Behaviour Support Practitioner.',
  };
}

export interface ExternalReportingAssessment {
  duty: ExternalReportingDuty;
  rationale: string;
  reportableToCommissionDirectly: false;
  statutoryAgency: string;
  externalGuidance: string;
}

export function assessExternalReportingDuty(input: {
  severity: string;
  indicators?: string[];
  emergencyServicesContacted?: boolean;
  workerWorkplaceInjury?: boolean;
  isSubcontractedUnderRegisteredProvider?: boolean;
  involvesMinor?: boolean;
}): ExternalReportingAssessment {
  const indicators = input.indicators || [];

  // Child protection safety boundary (Opus is Adults 18+ strictly)
  if (input.involvesMinor) {
    return {
      duty: 'child_protection',
      rationale: 'Involvement of a minor flagged. Immediate child wellbeing / mandatory reporting assessment required.',
      reportableToCommissionDirectly: false,
      statutoryAgency: 'NSW Department of Communities and Justice (Child Protection Helpline)',
      externalGuidance: 'Call 132 111 immediately if there is suspected risk of significant harm to a child.',
    };
  }

  // SafeWork NSW WHS workplace injury
  if (input.workerWorkplaceInjury) {
    return {
      duty: 'safework_nsw_whs',
      rationale: 'Worker workplace injury or dangerous incident under WHS Act 2011.',
      reportableToCommissionDirectly: false,
      statutoryAgency: 'SafeWork NSW',
      externalGuidance: 'Notifiable incidents (death, serious injury/illness) must be reported to SafeWork NSW immediately on 13 10 50.',
    };
  }

  // Police / Emergency
  if (
    input.emergencyServicesContacted ||
    indicators.includes('sexual_misconduct') ||
    indicators.includes('violence') ||
    input.severity === 'Critical'
  ) {
    return {
      duty: 'police_emergency',
      rationale: 'Allegation of physical violence, sexual assault, immediate danger, or emergency services attendance.',
      reportableToCommissionDirectly: false,
      statutoryAgency: 'NSW Police Force / Emergency Services (000)',
      externalGuidance: 'Contact 000 in immediate danger. For non-urgent police matters, contact Police Assistance Line 131 444.',
    };
  }

  // Registered Provider Intermediary arrangement
  if (input.isSubcontractedUnderRegisteredProvider) {
    return {
      duty: 'registered_provider_intermediary',
      rationale: 'Service delivered under subcontract to a registered NDIS provider. Registered provider holds primary NDIS Commission reporting duty.',
      reportableToCommissionDirectly: false,
      statutoryAgency: 'Lead Registered NDIS Provider',
      externalGuidance: 'Notify the lead registered provider in writing within 24 hours so they can meet their NDIS Commission 24h/5d reportable incident deadlines.',
    };
  }

  // Critical Safeguarding flags requiring management evaluation
  const hasCritical = indicators.some((i) => CRITICAL_SAFEGUARDING_INDICATORS.includes(i as SafeguardingIndicator));
  if (hasCritical || input.severity === 'High') {
    return {
      duty: 'management_assessment_required',
      rationale: 'High severity or critical safeguarding indicator requires senior management evaluation of external statutory obligations.',
      reportableToCommissionDirectly: false,
      statutoryAgency: 'Opus Safeguarding Lead / Management Review',
      externalGuidance: 'Managing Director and Safeguarding Lead must determine if external referral or registered partner notification is required.',
    };
  }

  // Standard internal continuous improvement
  return {
    duty: 'internal_only',
    rationale: 'Operational incident managed internally under Opus Care continuous improvement framework and NDIS Code of Conduct.',
    reportableToCommissionDirectly: false,
    statutoryAgency: 'Opus Care Internal Safeguarding Register',
    externalGuidance: 'Record immediate actions, conduct root-cause review, and assign corrective actions as necessary.',
  };
}

export function canCloseIncident(
  incident: {
    severity: string;
    safeguarding_indicators?: string[];
    management_regulatory_review_stop?: boolean;
    manager_review?: string | null;
    safeguarding_lead_reviewed_at?: string | null;
  },
  actorRole: string = 'staff'
): { allowed: boolean; reason?: string } {
  const indicators = incident.safeguarding_indicators || [];
  const hasCritical = indicators.some((i) => CRITICAL_SAFEGUARDING_INDICATORS.includes(i as SafeguardingIndicator));
  const isHighOrCritical = incident.severity === 'High' || incident.severity === 'Critical';
  const hasReviewStop = Boolean(incident.management_regulatory_review_stop);

  if (isHighOrCritical || hasCritical || hasReviewStop) {
    // Ordinary workers and staff cannot close
    if (actorRole !== 'admin' && actorRole !== 'safeguarding_lead') {
      return {
        allowed: false,
        reason: 'Only an authorized Safeguarding Lead or Admin can close high-severity or safeguarding incidents.',
      };
    }

    if (!incident.manager_review || incident.manager_review.trim().length < 5) {
      return {
        allowed: false,
        reason: 'Documented manager review is required before closing a high-severity or safeguarding incident.',
      };
    }

    if (!incident.safeguarding_lead_reviewed_at) {
      return {
        allowed: false,
        reason: 'Safeguarding Lead review sign-off is required before closing this incident.',
      };
    }
  }

  return { allowed: true };
}

export interface ComplaintLodgementInput {
  is_anonymous?: boolean;
  complainant_name: string;
  complainant_role?: string;
  contact_details?: string | null;
  advocate_name?: string | null;
  advocate_relationship?: string | null;
  advocate_contact?: string | null;
  accessibility_communication_needs?: string | null;
  category?: string;
  urgency?: 'Low' | 'Medium' | 'High' | 'Urgent';
  immediate_safety_issue?: boolean;
  summary: string;
  details: string;
  source?: string;
  participant_id?: string | null;
}

export function processComplaintLodgement(input: ComplaintLodgementInput) {
  const isAnonymous = Boolean(input.is_anonymous);
  const urgency = input.urgency || (input.immediate_safety_issue ? 'Urgent' : 'Medium');

  const displayName = isAnonymous ? 'Anonymous Complainant' : input.complainant_name;
  const displayContact = isAnonymous ? (input.contact_details ? '[Confidential / Anonymous Contact Supplied]' : null) : input.contact_details;

  // Calculate target resolution and acknowledgement SLA dates
  const now = new Date();
  const ackDays = urgency === 'Urgent' || input.immediate_safety_issue ? 1 : 2;
  const resDays = urgency === 'Urgent' || input.immediate_safety_issue ? 3 : 10;

  const ackTarget = new Date(now.getTime() + ackDays * 86400000).toISOString().split('T')[0];
  const responseTarget = new Date(now.getTime() + resDays * 86400000).toISOString().split('T')[0];

  return {
    is_anonymous: isAnonymous,
    complainant_name: displayName,
    complainant_role: input.complainant_role || 'Participant',
    contact_details: displayContact,
    advocate_name: input.advocate_name || null,
    advocate_relationship: input.advocate_relationship || null,
    advocate_contact: input.advocate_contact || null,
    accessibility_communication_needs: input.accessibility_communication_needs || null,
    category: input.category || 'service_delivery',
    urgency,
    immediate_safety_issue: Boolean(input.immediate_safety_issue) || urgency === 'Urgent',
    summary: input.summary,
    details: input.details,
    source: input.source || (isAnonymous ? 'Public / Anonymous' : 'Portal'),
    participant_id: isAnonymous ? null : input.participant_id || null,
    status: 'Received',
    response_target_date: responseTarget,
    acknowledgement_target_date: ackTarget,
  };
}
