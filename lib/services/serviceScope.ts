import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';

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

  // Explicit Transport Architecture (Governance G0.1)
  activityBasedTransportEligible: boolean;   // e.g. 04_590_0125_6_1 ($1.00/km while transporting participant)
  providerTravelLabourEligible: boolean;     // Worker time travelling to/from participant (up to 30 mins MM1-3)
  providerTravelNonLabourEligible: boolean; // Parking, road tolls, public transport (e.g. 04_799_0125_6_1)
  generalTransportSupport: boolean;         // Direct specialized transport item 02_051_0108_1_1 under Core Cat 02
  travelBillingEligible: boolean;           // Legacy compatibility flag (= providerTravelLabourEligible || providerTravelNonLabourEligible)

  cancellationEligible: boolean;
  quoteEligible: boolean;
  rosterEligible: boolean;
  invoiceEligible: boolean;
  websiteVisible: boolean;
  effectiveDate: string;
  version: string;
}

/**
 * PUBLIC MARKETING FALLBACK REGISTRY
 * ----------------------------------------------------------------------------
 * Retained SOLELY for harmless public marketing/display when offline or during
 * static site rendering.
 * 
 * IMPORTANT GOVERNANCE PRINCIPLE (Governance G0.1):
 * This static fallback MUST NEVER be used to authorize operational actions
 * (quoting, rostering, invoicing, clinical delivery). Operational decisions
 * MUST query the live database registry and FAIL CLOSED if unreachable.
 * ----------------------------------------------------------------------------
 */
export const PUBLIC_MARKETING_FALLBACK_REGISTRY: ServiceScopeItem[] = [
  // 1. ACTIVE STANDARD SERVICES
  {
    serviceCode: 'OC-SRV-COMM-01',
    publicName: 'Community Access & Participation',
    internalDescription: '1-on-1 support for social, recreational, civic, and community activities.',
    ndisCategory: 'Core - Assistance with Social, Economic and Community Participation',
    ndisSupportCatalogueMapping: [
      '04_104_0125_6_1', // Weekday Daytime
      '04_105_0125_6_1', // Weekday Evening
      '04_103_0125_6_1', // Saturday
      '04_102_0125_6_1', // Sunday
      '04_101_0125_6_1', // Public Holiday
      '04_106_0125_6_1', // Weekday Night
      '04_590_0125_6_1', // Activity Based Transport
      '04_799_0125_6_1', // Provider Travel - Non-Labour
    ],
    operationalStatus: 'ACTIVE',
    fundingMethodsAllowed: ['Self-Managed', 'Plan-Managed'],
    registrationRequired: false,
    riskClass: 'Standard',
    clinicalApprovalRequired: false,
    participantPlanRequired: false,
    requiredWorkerCredentials: ['ndis_worker_screening', 'first_aid', 'cpr', 'code_of_conduct'],
    requiredCompetencies: [],
    activityBasedTransportEligible: true,
    providerTravelLabourEligible: true,
    providerTravelNonLabourEligible: true,
    generalTransportSupport: false,
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
    ndisSupportCatalogueMapping: [
      '01_011_0107_1_1', // Weekday Daytime
      '01_015_0107_1_1', // Weekday Evening
      '01_013_0107_1_1', // Saturday
      '01_014_0107_1_1', // Sunday
      '01_012_0107_1_1', // Public Holiday
      '01_016_0107_1_1', // Weekday Night
      '01_799_0107_1_1', // Provider Travel - Non-Labour
    ],
    operationalStatus: 'ACTIVE',
    fundingMethodsAllowed: ['Self-Managed', 'Plan-Managed'],
    registrationRequired: false,
    riskClass: 'Standard',
    clinicalApprovalRequired: false,
    participantPlanRequired: false,
    requiredWorkerCredentials: ['ndis_worker_screening', 'first_aid', 'cpr', 'code_of_conduct'],
    requiredCompetencies: [],
    activityBasedTransportEligible: true,
    providerTravelLabourEligible: true,
    providerTravelNonLabourEligible: true,
    generalTransportSupport: false,
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
    ndisSupportCatalogueMapping: [
      '01_019_0120_1_1', // House Cleaning And Other Household Activities
      '01_020_0120_1_1', // House And/Or Yard Maintenance
    ],
    operationalStatus: 'ACTIVE',
    fundingMethodsAllowed: ['Self-Managed', 'Plan-Managed'],
    registrationRequired: false,
    riskClass: 'Standard',
    clinicalApprovalRequired: false,
    participantPlanRequired: false,
    requiredWorkerCredentials: ['ndis_worker_screening', 'code_of_conduct', 'whs_induction'],
    requiredCompetencies: [],
    activityBasedTransportEligible: false,
    providerTravelLabourEligible: true,
    providerTravelNonLabourEligible: true,
    generalTransportSupport: false,
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
    activityBasedTransportEligible: false,
    providerTravelLabourEligible: true,
    providerTravelNonLabourEligible: true,
    generalTransportSupport: false,
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
    ndisSupportCatalogueMapping: ['04_104_0125_6_1', '04_105_0125_6_1', '04_590_0125_6_1'],
    operationalStatus: 'ACTIVE',
    fundingMethodsAllowed: ['Self-Managed', 'Plan-Managed'],
    registrationRequired: false,
    riskClass: 'Standard',
    clinicalApprovalRequired: false,
    participantPlanRequired: false,
    requiredWorkerCredentials: ['ndis_worker_screening', 'code_of_conduct'],
    requiredCompetencies: [],
    activityBasedTransportEligible: true,
    providerTravelLabourEligible: true,
    providerTravelNonLabourEligible: true,
    generalTransportSupport: false,
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
    internalDescription: 'Accompaniment to healthcare, allied health, and specialist appointments. Claim reflects actual support delivered.',
    ndisCategory: 'Core - Assistance with Daily Life',
    ndisSupportCatalogueMapping: ['01_011_0107_1_1', '04_104_0125_6_1', '04_590_0125_6_1'],
    operationalStatus: 'ACTIVE',
    fundingMethodsAllowed: ['Self-Managed', 'Plan-Managed'],
    registrationRequired: false,
    riskClass: 'Standard',
    clinicalApprovalRequired: false,
    participantPlanRequired: false,
    requiredWorkerCredentials: ['ndis_worker_screening', 'first_aid', 'code_of_conduct'],
    requiredCompetencies: [],
    activityBasedTransportEligible: true,
    providerTravelLabourEligible: true,
    providerTravelNonLabourEligible: true,
    generalTransportSupport: false,
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
    internalDescription: 'Assistance with grocery shopping, personal errands, and local community transit. Claim reflects actual support delivered.',
    ndisCategory: 'Core - Assistance with Daily Life',
    ndisSupportCatalogueMapping: ['01_011_0107_1_1', '01_019_0120_1_1', '04_590_0125_6_1'],
    operationalStatus: 'ACTIVE',
    fundingMethodsAllowed: ['Self-Managed', 'Plan-Managed'],
    registrationRequired: false,
    riskClass: 'Standard',
    clinicalApprovalRequired: false,
    participantPlanRequired: false,
    requiredWorkerCredentials: ['ndis_worker_screening', 'first_aid', 'code_of_conduct'],
    requiredCompetencies: [],
    activityBasedTransportEligible: true,
    providerTravelLabourEligible: true,
    providerTravelNonLabourEligible: true,
    generalTransportSupport: false,
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
    publicName: 'General Transport Assistance',
    internalDescription: 'Direct specialized transport support under NDIS Category 02 (Assist-Travel/Transport) to access work, education, or community destinations. Distinct from Activity Based Transport provided during social participation shifts.',
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
    generalTransportSupport: true,
    activityBasedTransportEligible: false,
    providerTravelLabourEligible: false,
    providerTravelNonLabourEligible: false,
    travelBillingEligible: false,
    cancellationEligible: true,
    quoteEligible: true,
    rosterEligible: true,
    invoiceEligible: true,
    websiteVisible: true,
    effectiveDate: '2026-07-01',
    version: '2026-27.1',
  },

  // 2. ACTIVE WITH CONTROLS
  {
    serviceCode: 'OC-SRV-PERS-01',
    publicName: 'Standard Personal Support',
    internalDescription: 'Dressing, grooming, routine personal care, toileting, and ordinary transfers within assessed worker competency.',
    ndisCategory: 'Core - Assistance with Daily Life',
    ndisSupportCatalogueMapping: ['01_011_0107_1_1', '01_015_0107_1_1', '01_013_0107_1_1', '01_014_0107_1_1', '01_012_0107_1_1'],
    operationalStatus: 'ACTIVE_WITH_CONTROLS',
    fundingMethodsAllowed: ['Self-Managed', 'Plan-Managed'],
    registrationRequired: false,
    riskClass: 'Enhanced',
    clinicalApprovalRequired: false,
    participantPlanRequired: true,
    requiredWorkerCredentials: ['ndis_worker_screening', 'first_aid', 'cpr', 'code_of_conduct'],
    requiredCompetencies: ['manual_handling', 'personal_care'],
    activityBasedTransportEligible: true,
    providerTravelLabourEligible: true,
    providerTravelNonLabourEligible: true,
    generalTransportSupport: false,
    travelBillingEligible: true,
    cancellationEligible: true,
    quoteEligible: true,
    rosterEligible: true,
    invoiceEligible: true,
    websiteVisible: true,
    effectiveDate: '2026-07-01',
    version: '2026-27.1',
  },

  // 3. CONDITIONAL CLINICAL (Not publicly bookable or normally rosterable)
  {
    serviceCode: 'OC-SRV-NURS-01',
    publicName: 'Community Nursing',
    internalDescription: 'Clinical nursing care under Registration Group 0114 (Community Nursing Care) spanning EN, RN, CN, and NP classifications across applicable day/time variants. Strictly conditional upon clinical governance and supervision.',
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
    activityBasedTransportEligible: false,
    providerTravelLabourEligible: true,
    providerTravelNonLabourEligible: true,
    generalTransportSupport: false,
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
    activityBasedTransportEligible: false,
    providerTravelLabourEligible: true,
    providerTravelNonLabourEligible: true,
    generalTransportSupport: false,
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
    activityBasedTransportEligible: false,
    providerTravelLabourEligible: true,
    providerTravelNonLabourEligible: true,
    generalTransportSupport: false,
    travelBillingEligible: true,
    cancellationEligible: true,
    quoteEligible: false,
    rosterEligible: false,
    invoiceEligible: false,
    websiteVisible: false,
    effectiveDate: '2026-07-01',
    version: '2026-27.1',
  },

  // 4. REGISTRATION REQUIRED & FUTURE SERVICES (Blocked internally and externally)
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
    activityBasedTransportEligible: false,
    providerTravelLabourEligible: false,
    providerTravelNonLabourEligible: false,
    generalTransportSupport: false,
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
    activityBasedTransportEligible: false,
    providerTravelLabourEligible: false,
    providerTravelNonLabourEligible: false,
    generalTransportSupport: false,
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
    internalDescription: 'Authoring and submitting comprehensive behavior support plans.',
    ndisCategory: 'Capacity Building - Improved Relationships',
    ndisSupportCatalogueMapping: [],
    operationalStatus: 'REGISTRATION_REQUIRED',
    fundingMethodsAllowed: ['Self-Managed', 'Plan-Managed'],
    registrationRequired: true,
    riskClass: 'Clinical',
    clinicalApprovalRequired: true,
    participantPlanRequired: true,
    requiredWorkerCredentials: ['ahpra_or_ndis_practitioner'],
    requiredCompetencies: ['bsp_authoring'],
    activityBasedTransportEligible: false,
    providerTravelLabourEligible: false,
    providerTravelNonLabourEligible: false,
    generalTransportSupport: false,
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
    internalDescription: 'Group home or shared living 24/7 support (Group 0138 from 1 July 2026).',
    ndisCategory: 'Core - Assistance with Daily Life in a Group or Shared Living Arrangement',
    ndisSupportCatalogueMapping: [],
    operationalStatus: 'REGISTRATION_REQUIRED',
    fundingMethodsAllowed: ['Plan-Managed'],
    registrationRequired: true,
    riskClass: 'High Intensity',
    clinicalApprovalRequired: false,
    participantPlanRequired: true,
    requiredWorkerCredentials: [],
    requiredCompetencies: [],
    activityBasedTransportEligible: false,
    providerTravelLabourEligible: false,
    providerTravelNonLabourEligible: false,
    generalTransportSupport: false,
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
    internalDescription: 'Purpose-built specialized housing bricks-and-mortar accommodation.',
    ndisCategory: 'Capital - Specialist Disability Accommodation',
    ndisSupportCatalogueMapping: [],
    operationalStatus: 'REGISTRATION_REQUIRED',
    fundingMethodsAllowed: ['Plan-Managed'],
    registrationRequired: true,
    riskClass: 'Standard',
    clinicalApprovalRequired: false,
    participantPlanRequired: true,
    requiredWorkerCredentials: [],
    requiredCompetencies: [],
    activityBasedTransportEligible: false,
    providerTravelLabourEligible: false,
    providerTravelNonLabourEligible: false,
    generalTransportSupport: false,
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
    internalDescription: 'Agency-managed NDIS participant claims directly through NDIA portal.',
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
    activityBasedTransportEligible: false,
    providerTravelLabourEligible: false,
    providerTravelNonLabourEligible: false,
    generalTransportSupport: false,
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
    internalDescription: 'Chemical, mechanical, physical, environmental, or seclusion restrictive practices.',
    ndisCategory: 'Regulated Safeguarding',
    ndisSupportCatalogueMapping: [],
    operationalStatus: 'REGISTRATION_REQUIRED',
    fundingMethodsAllowed: ['Self-Managed', 'Plan-Managed'],
    registrationRequired: true,
    riskClass: 'High Intensity',
    clinicalApprovalRequired: true,
    participantPlanRequired: true,
    requiredWorkerCredentials: [],
    requiredCompetencies: [],
    activityBasedTransportEligible: false,
    providerTravelLabourEligible: false,
    providerTravelNonLabourEligible: false,
    generalTransportSupport: false,
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
    internalDescription: 'Automated worker matching and digital intermediary service.',
    ndisCategory: 'Platform Intermediary',
    ndisSupportCatalogueMapping: [],
    operationalStatus: 'FUTURE',
    fundingMethodsAllowed: ['Self-Managed', 'Plan-Managed'],
    registrationRequired: false,
    riskClass: 'Standard',
    clinicalApprovalRequired: false,
    participantPlanRequired: false,
    requiredWorkerCredentials: [],
    requiredCompetencies: [],
    activityBasedTransportEligible: false,
    providerTravelLabourEligible: false,
    providerTravelNonLabourEligible: false,
    generalTransportSupport: false,
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
    internalDescription: 'Facility-based or multi-participant group sessions and excursions.',
    ndisCategory: 'Core - Assistance with Social, Economic and Community Participation',
    ndisSupportCatalogueMapping: [],
    operationalStatus: 'FUTURE',
    fundingMethodsAllowed: ['Self-Managed', 'Plan-Managed'],
    registrationRequired: false,
    riskClass: 'Standard',
    clinicalApprovalRequired: false,
    participantPlanRequired: false,
    requiredWorkerCredentials: ['ndis_worker_screening', 'first_aid', 'cpr'],
    requiredCompetencies: [],
    activityBasedTransportEligible: false,
    providerTravelLabourEligible: false,
    providerTravelNonLabourEligible: false,
    generalTransportSupport: false,
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

// Alias for backwards compatibility with marketing components
export const INITIAL_SERVICE_SCOPE_REGISTRY = PUBLIC_MARKETING_FALLBACK_REGISTRY;

function mapDatabaseRowToItem(row: any): ServiceScopeItem {
  const providerTravelLabour = Boolean(row.provider_travel_labour_eligible);
  const providerTravelNonLabour = Boolean(row.provider_travel_non_labour_eligible);
  return {
    serviceCode: row.service_code,
    publicName: row.public_name,
    internalDescription: row.internal_description,
    ndisCategory: row.ndis_category,
    ndisSupportCatalogueMapping: Array.isArray(row.ndis_support_catalogue_mapping)
      ? row.ndis_support_catalogue_mapping
      : typeof row.ndis_support_catalogue_mapping === 'string'
      ? JSON.parse(row.ndis_support_catalogue_mapping)
      : [],
    operationalStatus: row.operational_status,
    fundingMethodsAllowed: Array.isArray(row.funding_methods_allowed)
      ? row.funding_methods_allowed
      : [],
    registrationRequired: Boolean(row.registration_required),
    riskClass: row.risk_class || 'Standard',
    clinicalApprovalRequired: Boolean(row.clinical_approval_required),
    participantPlanRequired: Boolean(row.participant_plan_required),
    requiredWorkerCredentials: Array.isArray(row.required_worker_credentials)
      ? row.required_worker_credentials
      : [],
    requiredCompetencies: Array.isArray(row.required_competencies)
      ? row.required_competencies
      : [],
    activityBasedTransportEligible: Boolean(row.activity_based_transport_eligible),
    providerTravelLabourEligible: providerTravelLabour,
    providerTravelNonLabourEligible: providerTravelNonLabour,
    generalTransportSupport: Boolean(row.general_transport_support),
    travelBillingEligible: providerTravelLabour || providerTravelNonLabour,
    cancellationEligible: Boolean(row.cancellation_eligible),
    quoteEligible: Boolean(row.quote_eligible),
    rosterEligible: Boolean(row.roster_eligible),
    invoiceEligible: Boolean(row.invoice_eligible),
    websiteVisible: Boolean(row.website_visible),
    effectiveDate: row.effective_date,
    version: row.version,
  };
}

/**
 * AUTHORITATIVE LIVE GOVERNANCE QUERY (FAIL-CLOSED)
 * ----------------------------------------------------------------------------
 * Queries the live database registry. If database is unreachable or query errors,
 * FAILS CLOSED by throwing an error. Does NOT fall back to static memory array.
 * ----------------------------------------------------------------------------
 */
export async function getLiveServiceScopeEntry(
  serviceCode: string,
  customSupabase?: SupabaseClient | null
): Promise<ServiceScopeItem> {
  if (!serviceCode) {
    throw new Error('Service code is required for governance query.');
  }
  const cleanCode = serviceCode.trim().toUpperCase();
  const supabase = customSupabase || createAdminClient();

  if (!supabase) {
    throw new Error('Governance service unavailable — database client could not be initialized.');
  }

  const { data, error } = await supabase
    .from('service_scope_registry')
    .select('*')
    .ilike('service_code', cleanCode)
    .maybeSingle();

  if (error) {
    throw new Error(`Governance service unavailable — service eligibility cannot be verified: ${error.message}`);
  }

  if (!data) {
    throw new Error(`Service scope record not found for code: ${serviceCode}`);
  }

  return mapDatabaseRowToItem(data);
}

/**
 * OPERATIONAL GOVERNANCE DECISION CHECKER (FAIL-CLOSED)
 * ----------------------------------------------------------------------------
 * Authorizes quoting, rostering, invoicing, or clinical delivery based ONLY on
 * the live database registry. Throws on database failure.
 * ----------------------------------------------------------------------------
 */
export async function verifyOperationalAction(
  serviceCode: string,
  action: 'quote' | 'roster' | 'invoice' | 'clinical',
  customSupabase?: SupabaseClient | null
): Promise<{ allowed: boolean; reason?: string; service: ServiceScopeItem }> {
  const service = await getLiveServiceScopeEntry(serviceCode, customSupabase);

  if (service.registrationRequired || service.operationalStatus === 'REGISTRATION_REQUIRED') {
    return {
      allowed: false,
      reason: `Registration required: Opus Care operates as an unregistered provider and cannot deliver or claim ${service.publicName}.`,
      service,
    };
  }

  if (service.operationalStatus === 'FUTURE' || service.operationalStatus === 'DISABLED') {
    return {
      allowed: false,
      reason: `Service is not active on the operational roadmap (Status: ${service.operationalStatus}).`,
      service,
    };
  }

  if (action === 'quote' && !service.quoteEligible) {
    return {
      allowed: false,
      reason: `${service.publicName} is not eligible for quoting in this operational phase.`,
      service,
    };
  }

  if (action === 'roster' && !service.rosterEligible) {
    return {
      allowed: false,
      reason: `${service.publicName} cannot be rostered without clinical governance approval.`,
      service,
    };
  }

  if (action === 'invoice' && !service.invoiceEligible) {
    return {
      allowed: false,
      reason: `${service.publicName} is not eligible for invoicing.`,
      service,
    };
  }

  if (action === 'clinical' && service.clinicalApprovalRequired) {
    return {
      allowed: false,
      reason: `${service.publicName} requires verified clinical supervisor approval prior to delivery.`,
      service,
    };
  }

  return { allowed: true, service };
}

// Synchronous public helpers (for harmless client-side UI rendering ONLY)
export function getMarketingServiceScopeEntry(serviceCode: string): ServiceScopeItem | undefined {
  if (!serviceCode) return undefined;
  const clean = serviceCode.trim().toUpperCase();
  return PUBLIC_MARKETING_FALLBACK_REGISTRY.find(
    (s) => s.serviceCode.toUpperCase() === clean || s.publicName.toLowerCase() === serviceCode.toLowerCase().trim()
  );
}

export function getAllMarketingServices(): ServiceScopeItem[] {
  return PUBLIC_MARKETING_FALLBACK_REGISTRY;
}

export function getMarketingPublicServices(): ServiceScopeItem[] {
  return PUBLIC_MARKETING_FALLBACK_REGISTRY.filter(
    (s) => s.websiteVisible && (s.operationalStatus === 'ACTIVE' || s.operationalStatus === 'ACTIVE_WITH_CONTROLS')
  );
}

// Backwards-compatible synchronous aliases (for existing presentation components)
export const getServiceScopeEntry = getMarketingServiceScopeEntry;
export const getAllServiceScopeEntries = getAllMarketingServices;
export const isServiceOffered = (code: string) => {
  const item = getMarketingServiceScopeEntry(code);
  return item ? item.operationalStatus === 'ACTIVE' || item.operationalStatus === 'ACTIVE_WITH_CONTROLS' : false;
};
export const isRegistrationRequired = (code: string) => {
  const item = getMarketingServiceScopeEntry(code);
  return item ? item.registrationRequired || item.operationalStatus === 'REGISTRATION_REQUIRED' : false;
};
export const requiresClinicalApproval = (code: string) => {
  const item = getMarketingServiceScopeEntry(code);
  return item ? item.clinicalApprovalRequired || item.operationalStatus === 'CONDITIONAL_CLINICAL' : false;
};
export const requiresParticipantSpecificPlan = (code: string) => {
  const item = getMarketingServiceScopeEntry(code);
  return item ? item.participantPlanRequired : false;
};
export const canBeQuoted = (code: string) => {
  const item = getMarketingServiceScopeEntry(code);
  return item ? item.quoteEligible : false;
};
export const canBeRostered = (code: string) => {
  const item = getMarketingServiceScopeEntry(code);
  return item ? item.rosterEligible : false;
};
export const canBeInvoiced = (code: string) => {
  const item = getMarketingServiceScopeEntry(code);
  return item ? item.invoiceEligible : false;
};
export const isWebsiteVisible = (code: string) => {
  const item = getMarketingServiceScopeEntry(code);
  return item ? item.websiteVisible : false;
};
