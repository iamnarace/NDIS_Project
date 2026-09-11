export type ServiceScopeStatus =
  | 'ACTIVE'
  | 'ACTIVE_WITH_CONTROLS'
  | 'CONDITIONAL_CLINICAL'
  | 'REGISTRATION_REQUIRED'
  | 'FUTURE'
  | 'DISABLED';

export type ServiceRiskClass = 'Standard' | 'Enhanced' | 'High Intensity' | 'Clinical';

export interface ServiceScopeItem {
  serviceCode: string;
  publicName: string;
  internalDescription: string;
  ndisCategory: string;
  ndisSupportCatalogueMapping: string[];
  operationalStatus: ServiceScopeStatus;
  fundingMethodsAllowed: string[];
  registrationRequired: boolean;
  riskClass: ServiceRiskClass;
  clinicalApprovalRequired: boolean;
  participantPlanRequired: boolean;
  requiredWorkerCredentials: string[];
  requiredCompetencies: string[];
  transportEligible: boolean;
  travelBillingEligible: boolean;
  cancellationEligible: boolean;
  quoteEligible: boolean;
  rosterEligible: boolean;
  invoiceEligible: boolean;
  websiteVisible: boolean;
  effectiveDate: string;
  version: string;
}

export const INITIAL_SERVICE_SCOPE_REGISTRY: ServiceScopeItem[] = [
  // ACTIVE STANDARD SERVICES
  {
    serviceCode: 'OC-SRV-COMM-01',
    publicName: 'Community Access & Participation',
    internalDescription: '1-on-1 support for social, recreational, civic, and community activities.',
    ndisCategory: 'Core - Assistance with Social, Economic and Community Participation',
    ndisSupportCatalogueMapping: ['04_104_0125_6_1', '04_103_0125_6_1', '04_102_0125_6_1'],
    operationalStatus: 'ACTIVE',
    fundingMethodsAllowed: ['Self-Managed', 'Plan-Managed'],
    registrationRequired: false,
    riskClass: 'Standard',
    clinicalApprovalRequired: false,
    participantPlanRequired: false,
    requiredWorkerCredentials: ['ndis_worker_screening', 'first_aid', 'cpr', 'code_of_conduct'],
    requiredCompetencies: [],
    transportEligible: false,
    travelBillingEligible: true,
    cancellationEligible: true,
    quoteEligible: true,
    rosterEligible: true,
    invoiceEligible: true,
    websiteVisible: true,
    effectiveDate: '2026-07-01',
    version: '2026-27.1',
  },
  {
    serviceCode: 'OC-SRV-DAILY-01',
    publicName: 'Daily Living Assistance',
    internalDescription: 'Routine daily personal and practical support in the participant home.',
    ndisCategory: 'Core - Assistance with Daily Life',
    ndisSupportCatalogueMapping: ['01_011_0107_1_1', '01_015_0107_1_1', '01_013_0107_1_1', '01_014_0107_1_1'],
    operationalStatus: 'ACTIVE',
    fundingMethodsAllowed: ['Self-Managed', 'Plan-Managed'],
    registrationRequired: false,
    riskClass: 'Standard',
    clinicalApprovalRequired: false,
    participantPlanRequired: false,
    requiredWorkerCredentials: ['ndis_worker_screening', 'first_aid', 'cpr', 'code_of_conduct'],
    requiredCompetencies: [],
    transportEligible: false,
    travelBillingEligible: true,
    cancellationEligible: true,
    quoteEligible: true,
    rosterEligible: true,
    invoiceEligible: true,
    websiteVisible: true,
    effectiveDate: '2026-07-01',
    version: '2026-27.1',
  },
  {
    serviceCode: 'OC-SRV-HOUSE-01',
    publicName: 'Household Tasks / Domestic Assistance',
    internalDescription: 'Domestic assistance, cleaning, laundry, and home maintenance associated with disability needs.',
    ndisCategory: 'Core - Assistance with Daily Life',
    ndisSupportCatalogueMapping: ['01_019_0120_1_1', '01_020_0120_1_1'],
    operationalStatus: 'ACTIVE',
    fundingMethodsAllowed: ['Self-Managed', 'Plan-Managed'],
    registrationRequired: false,
    riskClass: 'Standard',
    clinicalApprovalRequired: false,
    participantPlanRequired: false,
    requiredWorkerCredentials: ['ndis_worker_screening', 'code_of_conduct', 'whs_induction'],
    requiredCompetencies: [],
    transportEligible: false,
    travelBillingEligible: true,
    cancellationEligible: true,
    quoteEligible: true,
    rosterEligible: true,
    invoiceEligible: true,
    websiteVisible: true,
    effectiveDate: '2026-07-01',
    version: '2026-27.1',
  },
  {
    serviceCode: 'OC-SRV-SKILL-01',
    publicName: 'Life Skills & Independence',
    internalDescription: 'Goal-oriented capacity building in daily routines, meal planning, cooking, and budgeting.',
    ndisCategory: 'Capacity Building - Increased Social and Community Participation',
    ndisSupportCatalogueMapping: ['15_037_0117_1_3'],
    operationalStatus: 'ACTIVE',
    fundingMethodsAllowed: ['Self-Managed', 'Plan-Managed'],
    registrationRequired: false,
    riskClass: 'Standard',
    clinicalApprovalRequired: false,
    participantPlanRequired: false,
    requiredWorkerCredentials: ['ndis_worker_screening', 'first_aid', 'code_of_conduct'],
    requiredCompetencies: [],
    transportEligible: false,
    travelBillingEligible: true,
    cancellationEligible: true,
    quoteEligible: true,
    rosterEligible: true,
    invoiceEligible: true,
    websiteVisible: true,
    effectiveDate: '2026-07-01',
    version: '2026-27.1',
  },
  {
    serviceCode: 'OC-SRV-SOC-01',
    publicName: 'Social Support / Companionship',
    internalDescription: 'One-to-one mentoring, active listening, and social companionship aligned with participant goals.',
    ndisCategory: 'Core - Assistance with Social, Economic and Community Participation',
    ndisSupportCatalogueMapping: ['04_104_0125_6_1'],
    operationalStatus: 'ACTIVE',
    fundingMethodsAllowed: ['Self-Managed', 'Plan-Managed'],
    registrationRequired: false,
    riskClass: 'Standard',
    clinicalApprovalRequired: false,
    participantPlanRequired: false,
    requiredWorkerCredentials: ['ndis_worker_screening', 'code_of_conduct'],
    requiredCompetencies: [],
    transportEligible: false,
    travelBillingEligible: true,
    cancellationEligible: true,
    quoteEligible: true,
    rosterEligible: true,
    invoiceEligible: true,
    websiteVisible: true,
    effectiveDate: '2026-07-01',
    version: '2026-27.1',
  },
  {
    serviceCode: 'OC-SRV-APPT-01',
    publicName: 'Appointment Support',
    internalDescription: 'Accompaniment to healthcare, allied health, and specialist appointments.',
    ndisCategory: 'Core - Assistance with Daily Life',
    ndisSupportCatalogueMapping: ['01_011_0107_1_1', '04_104_0125_6_1'],
    operationalStatus: 'ACTIVE',
    fundingMethodsAllowed: ['Self-Managed', 'Plan-Managed'],
    registrationRequired: false,
    riskClass: 'Standard',
    clinicalApprovalRequired: false,
    participantPlanRequired: false,
    requiredWorkerCredentials: ['ndis_worker_screening', 'first_aid', 'code_of_conduct'],
    requiredCompetencies: [],
    transportEligible: false,
    travelBillingEligible: true,
    cancellationEligible: true,
    quoteEligible: true,
    rosterEligible: true,
    invoiceEligible: true,
    websiteVisible: true,
    effectiveDate: '2026-07-01',
    version: '2026-27.1',
  },
  {
    serviceCode: 'OC-SRV-SHOP-01',
    publicName: 'Shopping / Errand Assistance',
    internalDescription: 'Assistance with grocery shopping, personal errands, and local community transit.',
    ndisCategory: 'Core - Assistance with Daily Life',
    ndisSupportCatalogueMapping: ['01_011_0107_1_1', '01_019_0120_1_1'],
    operationalStatus: 'ACTIVE',
    fundingMethodsAllowed: ['Self-Managed', 'Plan-Managed'],
    registrationRequired: false,
    riskClass: 'Standard',
    clinicalApprovalRequired: false,
    participantPlanRequired: false,
    requiredWorkerCredentials: ['ndis_worker_screening', 'first_aid', 'code_of_conduct'],
    requiredCompetencies: [],
    transportEligible: false,
    travelBillingEligible: true,
    cancellationEligible: true,
    quoteEligible: true,
    rosterEligible: true,
    invoiceEligible: true,
    websiteVisible: true,
    effectiveDate: '2026-07-01',
    version: '2026-27.1',
  },
  {
    serviceCode: 'OC-SRV-TRANS-01',
    publicName: 'Support-Related Transport',
    internalDescription: 'Activity-based participant transport connecting to appointments, study, recreation, or errands.',
    ndisCategory: 'Core - Transport',
    ndisSupportCatalogueMapping: ['02_051_0108_1_1'],
    operationalStatus: 'ACTIVE',
    fundingMethodsAllowed: ['Self-Managed', 'Plan-Managed'],
    registrationRequired: false,
    riskClass: 'Standard',
    clinicalApprovalRequired: false,
    participantPlanRequired: false,
    requiredWorkerCredentials: ['ndis_worker_screening', 'valid_driver_licence', 'vehicle_insurance_comprehensive', 'code_of_conduct'],
    requiredCompetencies: ['transport_safety'],
    transportEligible: true,
    travelBillingEligible: false,
    cancellationEligible: true,
    quoteEligible: true,
    rosterEligible: true,
    invoiceEligible: true,
    websiteVisible: true,
    effectiveDate: '2026-07-01',
    version: '2026-27.1',
  },

  // ACTIVE WITH CONTROLS
  {
    serviceCode: 'OC-SRV-PERS-01',
    publicName: 'Standard Personal Support',
    internalDescription: 'Dressing, grooming, routine personal care, toileting, and ordinary transfers within assessed worker competency.',
    ndisCategory: 'Core - Assistance with Daily Life',
    ndisSupportCatalogueMapping: ['01_011_0107_1_1', '01_015_0107_1_1'],
    operationalStatus: 'ACTIVE_WITH_CONTROLS',
    fundingMethodsAllowed: ['Self-Managed', 'Plan-Managed'],
    registrationRequired: false,
    riskClass: 'Enhanced',
    clinicalApprovalRequired: false,
    participantPlanRequired: true,
    requiredWorkerCredentials: ['ndis_worker_screening', 'first_aid', 'cpr', 'code_of_conduct'],
    requiredCompetencies: ['manual_handling', 'personal_care'],
    transportEligible: false,
    travelBillingEligible: true,
    cancellationEligible: true,
    quoteEligible: true,
    rosterEligible: true,
    invoiceEligible: true,
    websiteVisible: true,
    effectiveDate: '2026-07-01',
    version: '2026-27.1',
  },

  // CONDITIONAL CLINICAL (Not publicly bookable or normally rosterable)
  {
    serviceCode: 'OC-SRV-NURS-01',
    publicName: 'Community Nursing',
    internalDescription: 'Clinical nursing assessment, medication administration, and specialized health support delivered by a registered nurse.',
    ndisCategory: 'Capital & Core Clinical Nursing',
    ndisSupportCatalogueMapping: [],
    operationalStatus: 'CONDITIONAL_CLINICAL',
    fundingMethodsAllowed: ['Self-Managed', 'Plan-Managed'],
    registrationRequired: false,
    riskClass: 'Clinical',
    clinicalApprovalRequired: true,
    participantPlanRequired: true,
    requiredWorkerCredentials: ['ahpra_nursing', 'clinical_indemnity', 'ndis_worker_screening'],
    requiredCompetencies: ['clinical_nursing_assessment'],
    transportEligible: false,
    travelBillingEligible: true,
    cancellationEligible: true,
    quoteEligible: false,
    rosterEligible: false,
    invoiceEligible: false,
    websiteVisible: false,
    effectiveDate: '2026-07-01',
    version: '2026-27.1',
  },
  {
    serviceCode: 'OC-SRV-BOWEL-01',
    publicName: 'Complex Bowel Care',
    internalDescription: 'High intensity bowel care under health practitioner instruction and participant-specific clinical management plan.',
    ndisCategory: 'Core - High Intensity Daily Personal Activities',
    ndisSupportCatalogueMapping: [],
    operationalStatus: 'CONDITIONAL_CLINICAL',
    fundingMethodsAllowed: ['Self-Managed', 'Plan-Managed'],
    registrationRequired: false,
    riskClass: 'High Intensity',
    clinicalApprovalRequired: true,
    participantPlanRequired: true,
    requiredWorkerCredentials: ['ndis_worker_screening', 'first_aid', 'cpr'],
    requiredCompetencies: ['participant_specific_bowel_care'],
    transportEligible: false,
    travelBillingEligible: true,
    cancellationEligible: true,
    quoteEligible: false,
    rosterEligible: false,
    invoiceEligible: false,
    websiteVisible: false,
    effectiveDate: '2026-07-01',
    version: '2026-27.1',
  },
  {
    serviceCode: 'OC-SRV-CATH-01',
    publicName: 'Urinary Catheter Management',
    internalDescription: 'High intensity catheter care under health practitioner instruction and participant-specific clinical management plan.',
    ndisCategory: 'Core - High Intensity Daily Personal Activities',
    ndisSupportCatalogueMapping: [],
    operationalStatus: 'CONDITIONAL_CLINICAL',
    fundingMethodsAllowed: ['Self-Managed', 'Plan-Managed'],
    registrationRequired: false,
    riskClass: 'High Intensity',
    clinicalApprovalRequired: true,
    participantPlanRequired: true,
    requiredWorkerCredentials: ['ndis_worker_screening', 'first_aid', 'cpr'],
    requiredCompetencies: ['participant_specific_catheter_management'],
    transportEligible: false,
    travelBillingEligible: true,
    cancellationEligible: true,
    quoteEligible: false,
    rosterEligible: false,
    invoiceEligible: false,
    websiteVisible: false,
    effectiveDate: '2026-07-01',
    version: '2026-27.1',
  },

  // REGISTRATION REQUIRED & FUTURE SERVICES (Blocked internally and externally)
  {
    serviceCode: 'OC-SRV-PLAN-01',
    publicName: 'Plan Management',
    internalDescription: 'Financial intermediary and NDIS claims processing service.',
    ndisCategory: 'Capacity Building - Support Coordination and Financial Intermediary',
    ndisSupportCatalogueMapping: [],
    operationalStatus: 'REGISTRATION_REQUIRED',
    fundingMethodsAllowed: ['Plan-Managed'],
    registrationRequired: true,
    riskClass: 'Standard',
    clinicalApprovalRequired: false,
    participantPlanRequired: false,
    requiredWorkerCredentials: [],
    requiredCompetencies: [],
    transportEligible: false,
    travelBillingEligible: false,
    cancellationEligible: false,
    quoteEligible: false,
    rosterEligible: false,
    invoiceEligible: false,
    websiteVisible: false,
    effectiveDate: '2026-07-01',
    version: '2026-27.1',
  },
  {
    serviceCode: 'OC-SRV-BEHAV-01',
    publicName: 'Specialist Behaviour Support',
    internalDescription: 'Specialist behaviour intervention clinical support.',
    ndisCategory: 'Capacity Building - Improved Relationships',
    ndisSupportCatalogueMapping: [],
    operationalStatus: 'REGISTRATION_REQUIRED',
    fundingMethodsAllowed: ['Self-Managed', 'Plan-Managed'],
    registrationRequired: true,
    riskClass: 'Clinical',
    clinicalApprovalRequired: true,
    participantPlanRequired: true,
    requiredWorkerCredentials: ['ahpra_or_ndis_practitioner'],
    requiredCompetencies: ['behaviour_support_assessment'],
    transportEligible: false,
    travelBillingEligible: false,
    cancellationEligible: false,
    quoteEligible: false,
    rosterEligible: false,
    invoiceEligible: false,
    websiteVisible: false,
    effectiveDate: '2026-07-01',
    version: '2026-27.1',
  },
  {
    serviceCode: 'OC-SRV-BSP-01',
    publicName: 'Behaviour Support Plan Development',
    internalDescription: 'Authoring and lodgement of comprehensive Behaviour Support Plans.',
    ndisCategory: 'Capacity Building - Improved Relationships',
    ndisSupportCatalogueMapping: [],
    operationalStatus: 'REGISTRATION_REQUIRED',
    fundingMethodsAllowed: ['Self-Managed', 'Plan-Managed'],
    registrationRequired: true,
    riskClass: 'Clinical',
    clinicalApprovalRequired: true,
    participantPlanRequired: true,
    requiredWorkerCredentials: ['authorised_behaviour_practitioner'],
    requiredCompetencies: ['bsp_authoring'],
    transportEligible: false,
    travelBillingEligible: false,
    cancellationEligible: false,
    quoteEligible: false,
    rosterEligible: false,
    invoiceEligible: false,
    websiteVisible: false,
    effectiveDate: '2026-07-01',
    version: '2026-27.1',
  },
  {
    serviceCode: 'OC-SRV-SIL-01',
    publicName: 'Supported Independent Living (SIL)',
    internalDescription: '24/7 shared living and accommodation support. Mandatory registration required from 1 July 2026 under Registration Group 0138.',
    ndisCategory: 'Core - Assistance with Daily Life in a Group or Shared Living Arrangement',
    ndisSupportCatalogueMapping: [],
    operationalStatus: 'REGISTRATION_REQUIRED',
    fundingMethodsAllowed: ['Plan-Managed', 'NDIA-Managed'],
    registrationRequired: true,
    riskClass: 'Enhanced',
    clinicalApprovalRequired: false,
    participantPlanRequired: true,
    requiredWorkerCredentials: [],
    requiredCompetencies: [],
    transportEligible: false,
    travelBillingEligible: false,
    cancellationEligible: false,
    quoteEligible: false,
    rosterEligible: false,
    invoiceEligible: false,
    websiteVisible: false,
    effectiveDate: '2026-07-01',
    version: '2026-27.1',
  },
  {
    serviceCode: 'OC-SRV-SDA-01',
    publicName: 'Specialist Disability Accommodation (SDA)',
    internalDescription: 'Purpose-built accessible housing for participants with extreme functional impairment.',
    ndisCategory: 'Capital - Specialist Disability Accommodation',
    ndisSupportCatalogueMapping: [],
    operationalStatus: 'REGISTRATION_REQUIRED',
    fundingMethodsAllowed: ['Plan-Managed', 'NDIA-Managed'],
    registrationRequired: true,
    riskClass: 'Standard',
    clinicalApprovalRequired: false,
    participantPlanRequired: false,
    requiredWorkerCredentials: [],
    requiredCompetencies: [],
    transportEligible: false,
    travelBillingEligible: false,
    cancellationEligible: false,
    quoteEligible: false,
    rosterEligible: false,
    invoiceEligible: false,
    websiteVisible: false,
    effectiveDate: '2026-07-01',
    version: '2026-27.1',
  },
  {
    serviceCode: 'OC-SRV-NDIA-01',
    publicName: 'Direct NDIA-Managed Service Delivery',
    internalDescription: 'Direct invoicing through NDIA PRODA/PACE portal. Prohibited for unregistered providers unless delivered under registered subcontracting arrangement.',
    ndisCategory: 'Core & Capacity Building',
    ndisSupportCatalogueMapping: [],
    operationalStatus: 'REGISTRATION_REQUIRED',
    fundingMethodsAllowed: ['NDIA-Managed'],
    registrationRequired: true,
    riskClass: 'Standard',
    clinicalApprovalRequired: false,
    participantPlanRequired: false,
    requiredWorkerCredentials: [],
    requiredCompetencies: [],
    transportEligible: false,
    travelBillingEligible: false,
    cancellationEligible: false,
    quoteEligible: false,
    rosterEligible: false,
    invoiceEligible: false,
    websiteVisible: false,
    effectiveDate: '2026-07-01',
    version: '2026-27.1',
  },
  {
    serviceCode: 'OC-SRV-RESTR-01',
    publicName: 'Regulated Restrictive Practices',
    internalDescription: 'Seclusion, chemical, mechanical, physical, or environmental restraints. Strictly prohibited outside lawful NDIS authorization.',
    ndisCategory: 'Regulated Safeguarding',
    ndisSupportCatalogueMapping: [],
    operationalStatus: 'REGISTRATION_REQUIRED',
    fundingMethodsAllowed: [],
    registrationRequired: true,
    riskClass: 'High Intensity',
    clinicalApprovalRequired: true,
    participantPlanRequired: true,
    requiredWorkerCredentials: [],
    requiredCompetencies: [],
    transportEligible: false,
    travelBillingEligible: false,
    cancellationEligible: false,
    quoteEligible: false,
    rosterEligible: false,
    invoiceEligible: false,
    websiteVisible: false,
    effectiveDate: '2026-07-01',
    version: '2026-27.1',
  },
  {
    serviceCode: 'OC-SRV-PLAT-01',
    publicName: 'NDIS Digital Platform Service',
    internalDescription: 'Qualifying digital intermediary platform matching participants to independent providers and processing payments.',
    ndisCategory: 'Platform Intermediary',
    ndisSupportCatalogueMapping: [],
    operationalStatus: 'FUTURE',
    fundingMethodsAllowed: ['Self-Managed', 'Plan-Managed'],
    registrationRequired: true,
    riskClass: 'Standard',
    clinicalApprovalRequired: false,
    participantPlanRequired: false,
    requiredWorkerCredentials: [],
    requiredCompetencies: [],
    transportEligible: false,
    travelBillingEligible: false,
    cancellationEligible: false,
    quoteEligible: false,
    rosterEligible: false,
    invoiceEligible: false,
    websiteVisible: false,
    effectiveDate: '2026-07-01',
    version: '2026-27.1',
  },
  {
    serviceCode: 'OC-SRV-GRP-01',
    publicName: 'Group & Centre-Based Activities',
    internalDescription: 'Centre-based group social and community activities.',
    ndisCategory: 'Core - Assistance with Social, Economic and Community Participation',
    ndisSupportCatalogueMapping: [],
    operationalStatus: 'FUTURE',
    fundingMethodsAllowed: ['Self-Managed', 'Plan-Managed'],
    registrationRequired: false,
    riskClass: 'Standard',
    clinicalApprovalRequired: false,
    participantPlanRequired: false,
    requiredWorkerCredentials: [],
    requiredCompetencies: [],
    transportEligible: false,
    travelBillingEligible: false,
    cancellationEligible: false,
    quoteEligible: false,
    rosterEligible: false,
    invoiceEligible: false,
    websiteVisible: false,
    effectiveDate: '2026-07-01',
    version: '2026-27.1',
  },
];

// Helper query functions
export function getServiceScopeEntry(serviceCode: string): ServiceScopeItem | undefined {
  if (!serviceCode) return undefined;
  const clean = serviceCode.trim().toUpperCase();
  return INITIAL_SERVICE_SCOPE_REGISTRY.find(
    (s) => s.serviceCode.toUpperCase() === clean || s.publicName.toLowerCase() === serviceCode.toLowerCase().trim()
  );
}

export function getAllServiceScopeEntries(): ServiceScopeItem[] {
  return INITIAL_SERVICE_SCOPE_REGISTRY;
}

export function isServiceOffered(serviceCode: string): boolean {
  const item = getServiceScopeEntry(serviceCode);
  if (!item) return false;
  return item.operationalStatus === 'ACTIVE' || item.operationalStatus === 'ACTIVE_WITH_CONTROLS';
}

export function isRegistrationRequired(serviceCode: string): boolean {
  const item = getServiceScopeEntry(serviceCode);
  if (!item) return false;
  return item.registrationRequired || item.operationalStatus === 'REGISTRATION_REQUIRED';
}

export function requiresClinicalApproval(serviceCode: string): boolean {
  const item = getServiceScopeEntry(serviceCode);
  if (!item) return false;
  return item.clinicalApprovalRequired || item.operationalStatus === 'CONDITIONAL_CLINICAL';
}

export function requiresParticipantSpecificPlan(serviceCode: string): boolean {
  const item = getServiceScopeEntry(serviceCode);
  if (!item) return false;
  return item.participantPlanRequired;
}

export function canBeQuoted(serviceCode: string): boolean {
  const item = getServiceScopeEntry(serviceCode);
  if (!item) return false;
  return item.quoteEligible;
}

export function canBeRostered(serviceCode: string): boolean {
  const item = getServiceScopeEntry(serviceCode);
  if (!item) return false;
  return item.rosterEligible;
}

export function canBeInvoiced(serviceCode: string): boolean {
  const item = getServiceScopeEntry(serviceCode);
  if (!item) return false;
  return item.invoiceEligible;
}

export function isWebsiteVisible(serviceCode: string): boolean {
  const item = getServiceScopeEntry(serviceCode);
  if (!item) return false;
  return item.websiteVisible;
}

export function getServicesByStatus(status: ServiceScopeStatus): ServiceScopeItem[] {
  return INITIAL_SERVICE_SCOPE_REGISTRY.filter((s) => s.operationalStatus === status);
}

export function getOperationalServices(): ServiceScopeItem[] {
  return INITIAL_SERVICE_SCOPE_REGISTRY.filter(
    (s) => s.operationalStatus === 'ACTIVE' || s.operationalStatus === 'ACTIVE_WITH_CONTROLS'
  );
}

export function getRestrictedServices(): ServiceScopeItem[] {
  return INITIAL_SERVICE_SCOPE_REGISTRY.filter(
    (s) => s.operationalStatus === 'REGISTRATION_REQUIRED' || s.operationalStatus === 'FUTURE'
  );
}

export function getConditionalClinicalServices(): ServiceScopeItem[] {
  return INITIAL_SERVICE_SCOPE_REGISTRY.filter(
    (s) => s.operationalStatus === 'CONDITIONAL_CLINICAL'
  );
}
