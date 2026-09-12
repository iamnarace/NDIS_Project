export interface GuideWorkflowItem {
  id: string;
  title: string;
  category: string;
  summary: string;
  prerequisites: string[];
  requiredData: string[];
  downstreamEffect: string[];
  recordLocation: string;
  escalationPath: string;
  commonBlockers: string[];
}

export const OPERATIONS_GUIDE_WORKFLOWS: GuideWorkflowItem[] = [
  {
    id: 'referral_onboarding',
    title: 'Participant Referral, Suitability & Intake Governance',
    category: 'Participant Governance',
    summary: 'Governs participant intake from initial referral through suitability assessment and tailored onboarding requirements to rosterable readiness.',
    prerequisites: [
      'Verified adult participant (18+ years of age strictly per Opus Care launch scope)',
      'Verified funding management: Self-Managed, Plan-Managed, or registered provider arrangement',
      'Participant residence confirmed within Northern NSW or Sydney service corridor',
    ],
    requiredData: [
      'Full legal name and verified date of birth',
      'NDIS participant number and valid funding type',
      'Payer contact details (e.g. Plan Manager name and invoice email)',
      'Risk triage indicators (manual handling, dysphagia, behaviours of concern, medical/seizures)',
      'Emergency contact details',
    ],
    downstreamEffect: [
      'Generates dynamic, tailored onboarding checklist based on risk triage',
      'Blocks roster scheduling until 100% of required onboarding controls are satisfied',
      'Automates creation of participant 360 record in CRM',
    ],
    recordLocation: 'Admin CRM > Referrals & Participants tabs > Participant Onboarding Drawer',
    escalationPath: 'Operations Lead for boundary decisions; Clinical Supervisor if high-intensity/clinical tasks flagged.',
    commonBlockers: [
      'Participant under 18 years of age (outside launch scope)',
      'NDIA-managed funding without verified registered provider arrangement',
      'Postcode outside Northern NSW or Sydney approved serviceable regions',
      'Unwaived pending mandatory onboarding checklist item',
    ],
  },
  {
    id: 'worker_readiness',
    title: 'Worker Onboarding, Screening & Roster Safety',
    category: 'Workforce Governance',
    summary: 'Enforces worker compliance, mandatory NDIS Worker Screening clearance, competencies, and transport controls at the shift write boundary.',
    prerequisites: [
      'Applicant identity verified and Australian right-to-work confirmed',
      'Current verified NDIS Worker Screening Check (NDISWC) clearance recorded',
      'Opus worker orientation and NDIS Code of Conduct acknowledgement completed',
    ],
    requiredData: [
      'NDISWC clearance number, verification date, and expiry date',
      'First Aid (HLTAID011) and CPR (HLTAID009) certification dates',
      'Valid Australian driver licence and comprehensive insurance (if assigned transport shifts)',
      'Specific general or participant-specific competency records where applicable',
    ],
    downstreamEffect: [
      'Authoritatively marks worker as READY, READY_RESTRICTED, or BLOCKED',
      'Server-side atomic database write guard prevents shift assignment if worker is not ready',
      'Surfaces active alerts when critical credentials approach expiry',
    ],
    recordLocation: 'Admin CRM > Workforce & Staff tabs > Worker Readiness Panel',
    escalationPath: 'Workforce Coordinator for missing credentials; Managing Director for worker screening status changes.',
    commonBlockers: [
      'NDISWC status is Pending, Barred, Suspended, or Excluded (fail closed)',
      'Expired First Aid, CPR, or mandatory compliance training',
      'Assigning a transport shift without verified driver licence and insured vehicle',
      'Attempting client-side bypass of readiness flags (blocked by database trigger)',
    ],
  },
  {
    id: 'agreements_documents',
    title: 'Service Agreements & Controlled Document Packs',
    category: 'Legal & Contract Governance',
    summary: 'Manages NDIS Service Agreements, Schedules of Supports, and version-controlled participant document packs without inventing legal entities.',
    prerequisites: [
      'Proprietor legal contracting identity configured in Organisation Settings',
      'Participant legal name, NDIS number, and funding basis verified',
      'Agreed support items match current 2026-27 NDIS Support Catalogue',
    ],
    requiredData: [
      'Commencement date, scheduled review date, and optional expiry date',
      'Tailored Schedule of Supports items with hours per week and agreed price limits',
      'Digital or physical signature records with signer identity and timestamp',
    ],
    downstreamEffect: [
      'Locks executed agreement terms; updates require formal Variation agreement',
      'Unblocks "Service Agreement Executed" gate in participant onboarding checklist',
      'Sets up financial foundation for automated invoice and quote generation',
    ],
    recordLocation: 'Admin CRM > Agreements tab > Agreement Generator & Viewer modals',
    escalationPath: 'Operations Lead for customized clauses; Proprietor for legal contracting terms.',
    commonBlockers: [
      'Proprietor legal name missing from organisation settings (blocks execution and sending)',
      'Attempting to overwrite executed agreement clauses directly instead of creating a Variation',
      'Selecting non-operational or registration-required support items',
    ],
  },
  {
    id: 'roster_shifts',
    title: 'Roster Scheduling & Shift Safety Boundary',
    category: 'Service Delivery Governance',
    summary: 'Ensures that every scheduled support session satisfies participant readiness, worker readiness, and service scope constraints simultaneously.',
    prerequisites: [
      'Participant must be 100% onboarded and marked rosterable',
      'Assigned worker must be marked READY and hold current NDISWC clearance',
      'Requested service must be in ACTIVE or ACTIVE_WITH_CONTROLS operational status',
    ],
    requiredData: [
      'Participant ID, assigned Worker ID, and Service Item Code',
      'Shift start time, end time, and service location',
      'Transport flag and travel details if transport is provided during the shift',
    ],
    downstreamEffect: [
      'Creates shift record in workforce roster calendar',
      'Populates shift onto worker mobile portal with participant goals and support notes',
      'Enables shift check-in, completion, and progress note capture',
    ],
    recordLocation: 'Admin CRM > Workforce > Roster Tab / Shifts API',
    escalationPath: 'Rostering Coordinator for scheduling conflicts; Operations Lead for emergency covers.',
    commonBlockers: [
      'Participant onboarding incomplete (BLOCKED_PARTICIPANT_NOT_READY)',
      'Worker screening or credential expired (BLOCKED_WORKER_NOT_READY)',
      'Worker lacking required driver credentials on transport shift (BLOCKED_TRANSPORT)',
      'Clinical service scheduled without G6 supervisory clearance (BLOCKED_CLINICAL)',
    ],
  },
  {
    id: 'notes_timesheets',
    title: 'Progress Notes & Timesheet Governance',
    category: 'Service Delivery Governance',
    summary: 'Controls the transition from completed shifts to evidence-backed progress notes, worker timesheets, and invoiceable service records.',
    prerequisites: [
      'Shift scheduled and accepted by ready worker',
      'Shift completed with actual clock-in and clock-out timestamps',
    ],
    requiredData: [
      'Detailed shift progress note detailing supports delivered against participant goals',
      'Incidents, behaviours, or concerns flagged if observed during shift',
      'Actual billable duration and any approved participant travel kilometres',
    ],
    downstreamEffect: [
      'Generates worker timesheet for payroll review',
      'Generates pending billable service record for participant invoicing',
      'Appends progress note to participant timeline audit history',
    ],
    recordLocation: 'Admin CRM > Progress Notes & Timesheets tabs',
    escalationPath: 'Operations Coordinator for timesheet disputes; Safeguarding Lead if note reports an incident.',
    commonBlockers: [
      'Submitting empty or non-substantive progress note (blocks timesheet approval)',
      'Discrepancy between scheduled hours and actual clocked hours without explanation',
      'Unresolved incident mentioned in progress note without formal incident report',
    ],
  },
  {
    id: 'incidents_complaints',
    title: 'Incidents & Complaints Safeguarding Governance',
    category: 'Quality & Safeguarding',
    summary: 'Governs incident intake, immediate response, investigation, open disclosure, and resolution of participant complaints without fear of retribution.',
    prerequisites: [
      'Active participant service delivery or workforce operations in place',
      'Any safety hazard, injury, allegation, dissatisfaction or feedback raised',
      'Immediate physical safety secured and open disclosure initiated',
    ],
    requiredData: [
      'Date, time, location, and nature of incident or complaint',
      'Persons involved, witnesses, and immediate actions taken to ensure safety',
      'Severity rating and whether open disclosure was provided',
      'Corrective actions assigned with due dates and responsible officers',
    ],
    downstreamEffect: [
      'Creates formal entry in Safeguarding Register',
      'Alerts Safeguarding Lead and Operations Lead immediately',
      'Generates auditable corrective action trail to prevent recurrence',
    ],
    recordLocation: 'Admin CRM > Safeguarding tab (Incidents & Complaints registers)',
    escalationPath: 'Safeguarding Lead immediately; NDIS Quality & Safeguards Commission contact details provided to participant.',
    commonBlockers: [
      'Delayed reporting exceeding 24 hours from incident occurrence',
      'Closing incident without documenting root-cause review and corrective action',
      'Treating participant feedback dismissively or without transparent acknowledgement',
    ],
  },
  {
    id: 'privacy_consent',
    title: 'Privacy, Consents & Information Sharing Authorities',
    category: 'Privacy & Compliance',
    summary: 'Enforces Australian Privacy Principles, transparent Privacy Collection Notices, service consents, and scoped Information Sharing Authorities.',
    prerequisites: [
      'Participant intake, referral, or regular periodic review initiated',
      'Identity and legal authority of participant or appointed nominee verified',
    ],
    requiredData: [
      'Participant or authorised representative legal acknowledgement of Privacy Notice',
      'Informed service consent with acknowledged role (participant, guardian, nominee)',
      'Specific third-party name, organisation, role, and information scope for sharing authority',
      'Defined start and review dates; separate marketing consent strictly default-false',
    ],
    downstreamEffect: [
      'Satisfies privacy and consent gates in onboarding checklist',
      'Authorises communication with named Plan Managers, Coordinators, and Allied Health',
      'Ensures participant can revoke sharing authority at any time with full audit trail',
    ],
    recordLocation: 'Admin CRM > Participants > Consent & Privacy Drawer',
    escalationPath: 'Privacy Officer for access/correction requests or information sharing disputes.',
    commonBlockers: [
      'Pre-ticking consent checkboxes (prohibited by Opus governance)',
      'Sharing participant information with third parties without active, valid authority',
      'Failing to record nominee legal authority basis (e.g. parent, enduring power of attorney)',
    ],
  },
  {
    id: 'invoicing_billing',
    title: 'Invoicing, Payment Claims & Funding Rules',
    category: 'Finance & Pricing',
    summary: 'Produces compliant NDIS invoices strictly adhering to 2026-27 price limits, funding boundaries, and sole trader tax status.',
    prerequisites: [
      'Approved, verified service records generated from completed shifts and timesheets',
      'Confirmed funding type: Self-Managed, Plan-Managed, or registered provider arrangement',
      'Agreed pricing rate locked to historical contract terms',
    ],
    requiredData: [
      'Invoice reference number, issue date, and payment due date',
      'NDIS support item code, description, unit price, quantity, and subtotal',
      'Correct invoice header ("INVOICE", not "TAX INVOICE" as Opus is not registered for GST)',
      'Correct recipient details (Participant or Plan Manager)',
    ],
    downstreamEffect: [
      'Sends invoice PDF and statement to participant or plan manager email',
      'Updates financial metrics and accounts receivable tracking',
      'Creates permanent, immutable audit record of billed service delivery',
    ],
    recordLocation: 'Admin CRM > Invoicing & Quotes tabs',
    escalationPath: 'Finance Officer for payment allocation; Operations Lead for rate discrepancy.',
    commonBlockers: [
      'Labeling document as "TAX INVOICE" when business is not registered for GST',
      'Directly claiming from NDIA portal without registered provider intermediary arrangement',
      'Attempting retroactive modification of rates on finalised invoices',
    ],
  },
  {
    id: 'scope_boundaries',
    title: 'Service Scope, Regional Coverage & Provider Boundaries',
    category: 'Regulatory Governance',
    summary: 'Maintains clear operational boundaries between unregistered core supports, conditional clinical supports, and prohibited registration-required services.',
    prerequisites: [
      'Referral or service inquiry received for new or existing participant',
      'Geographic location and support request verified against Opus Care operating scope',
    ],
    requiredData: [
      'Requested service item codes and participant support needs',
      'Participant service delivery address and postcode',
      'Current NDIS registration status of provider (unregistered sole trader)',
    ],
    downstreamEffect: [
      'Permits quotation and scheduling for ACTIVE and ACTIVE_WITH_CONTROLS services',
      'Routes CONDITIONAL_CLINICAL services to clinical review holding gate (G6)',
      'Instantly declines REGISTRATION_REQUIRED services (SIL, SDA, Restrictive Practices, NDIA direct)',
    ],
    recordLocation: 'Admin CRM > Settings > Service Scope Registry / Regional Coverage',
    escalationPath: 'Operations Lead for service boundary evaluation; Managing Director for registration review.',
    commonBlockers: [
      'Marketing or quoting services requiring NDIS provider registration',
      'Delivering clinical nursing or complex bowel/catheter care without G6 clearance',
      'Accepting participants outside confirmed Northern NSW or Sydney serviceable regions',
    ],
  },
];

export function getOperationsGuideWorkflows(filterCategory?: string): GuideWorkflowItem[] {
  if (!filterCategory || filterCategory === 'all') {
    return OPERATIONS_GUIDE_WORKFLOWS;
  }
  return OPERATIONS_GUIDE_WORKFLOWS.filter((w) => w.category === filterCategory);
}

export function getOperationsGuideWorkflow(id: string): GuideWorkflowItem | null {
  return OPERATIONS_GUIDE_WORKFLOWS.find((w) => w.id === id) || null;
}
