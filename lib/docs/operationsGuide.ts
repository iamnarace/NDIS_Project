export interface GuideChapter {
  id: string;
  number: number;
  title: string;
  category: 'core' | 'care' | 'workforce' | 'billing' | 'safeguarding' | 'admin';
  status: 'verified' | 'planned';
  content?: {
    purpose: string;
    beforeYouStart: string[];
    informationRequired: string[];
    stepByStepProcess: string[];
    whatHappensAfter: string[];
    statusMeanings: Record<string, string>;
    whereToFindRecord: string;
    commonMistakes: string[];
    relatedWorkflow: string;
  };
}

export const OPERATIONS_GUIDE_TOC: GuideChapter[] = [
  {
    id: 'getting_started',
    number: 1,
    title: 'Getting Started & Platform Overview',
    category: 'core',
    status: 'verified',
    content: {
      purpose: 'Understand Opus Care CRM architecture, role access, and daily operational navigation.',
      beforeYouStart: [
        'Obtain administrative login credentials or team member access key from operations management.',
        'Ensure you are using a modern supported browser (Chrome, Safari, Edge, or Firefox).',
      ],
      informationRequired: ['Valid admin authentication key or worker email address.'],
      stepByStepProcess: [
        'Navigate to /admin on the primary domain (opuscare.com.au/admin).',
        'Enter your administrator access key to establish an encrypted 7-day session.',
        'Review the Canonical Dashboard for high-priority operational items (unbilled hours, expiring worker screening checks, new referrals).',
        'Use the left sidebar or responsive mobile menu to switch between operational departments.',
      ],
      whatHappensAfter: [
        'All administrative actions, record creation, and status updates are immutably logged to the audit trail.',
      ],
      statusMeanings: {
        Authenticated: 'Current browser holds an active, secure session cookie.',
        Locked: 'Session has timed out or key has not yet been verified.',
      },
      whereToFindRecord: 'Security and session details can be audited under Settings > Account & Security.',
      commonMistakes: [
        'Sharing administrator session keys across multiple external devices without logging out.',
      ],
      relatedWorkflow: 'Referral Intake and Workforce Rostering.',
    },
  },
  {
    id: 'referrals',
    number: 2,
    title: 'Referrals & Intake Pipeline',
    category: 'care',
    status: 'verified',
    content: {
      purpose: 'Capture and process inbound participant enquiries from families, support coordinators, and hospital discharge teams.',
      beforeYouStart: [
        'Check whether the prospective participant lives within Opus Care service zones (Northern NSW or Sydney). Note: Service availability depends on location, participant requirements and current worker capacity.',
        'Confirm participant funding type (Plan-Managed, Self-Managed, or NDIA-Managed). Note: As an unregistered provider, Opus Care cannot claim directly via NDIA PRODA/PACE; NDIA-managed participants require an authorized contracting registered provider or plan nominee arrangement.',
      ],
      informationRequired: [
        'Participant full legal name and date of birth.',
        'Primary disability and requested support categories.',
        'Referrer contact details and relationship.',
        'Funding management type and plan manager email if applicable.',
      ],
      stepByStepProcess: [
        'Open the Referrals tab on the CRM sidebar.',
        'Review incoming entries in the Kanban column "New Inbound".',
        'Drag the card or select stage to "Contacted" after making phone/email contact.',
        'Complete intake assessment and move card to "Assessment".',
        'Once terms are agreed, click "Enrol as Active Participant" on the referral drawer.',
      ],
      whatHappensAfter: [
        'A formal Participant record is created with an official reference number (e.g. PAR-2026-0001).',
        'Referral status is automatically updated to "Accepted".',
        'An activity event is appended to the participant timeline.',
      ],
      statusMeanings: {
        new: 'Fresh inquiry awaiting first contact from intake coordinator.',
        contacted: 'First outreach completed; awaiting intake paperwork or phone intake.',
        assessment: 'Initial assessment or home consultation in progress.',
        agreement_sent: 'Service agreement has been drafted and issued for signing.',
        accepted: 'Successfully enrolled as active participant.',
      },
      whereToFindRecord: 'Find converted records under the Participants tab or in the referral archive.',
      commonMistakes: [
        'Deleting a referral instead of converting it, which loses the initial intake notes and history.',
      ],
      relatedWorkflow: 'Participant Profile Setup and Service Agreement Generation.',
    },
  },
  {
    id: 'participants',
    number: 3,
    title: 'Participant Management & Profiles',
    category: 'care',
    status: 'verified',
    content: {
      purpose: 'Maintain comprehensive records for active clients, emergency contacts, medical alerts, and support arrangements.',
      beforeYouStart: ['Participant must either be converted from a referral or added via Add Participant.'],
      informationRequired: [
        'NDIS Number (9-digit national reference).',
        'Residential address and suburb.',
        'Emergency contact names and emergency phone numbers.',
        'Medical alerts / allergies (e.g. EpiPen, seizure management).',
        'Specific worker instructions for home entry.',
      ],
      stepByStepProcess: [
        'Navigate to Participants tab.',
        'Click on any participant row to open their full slide-out profile drawer.',
        'Use the Overview subtab to view contact details, funding status, and quick health alerts.',
        'Click "Edit Emergency & Medical Info" to update care safety instructions.',
        'Use the Contacts subtab to link Support Coordinators, Plan Managers, or Family Advocates.',
      ],
      whatHappensAfter: [
        'Updated medical alerts and entry instructions become immediately visible to rostered support workers on their mobile shift view.',
      ],
      statusMeanings: {
        active: 'Participant currently receiving active rostered supports.',
        inactive: 'Participant on hold, hospitalised, or between service plans.',
        archived: 'Participant exited from Opus Care services.',
      },
      whereToFindRecord: 'Participants directory (/admin under Participants tab).',
      commonMistakes: [
        'Entering plan manager details in emergency contact fields instead of linking them in the Contacts tab.',
      ],
      relatedWorkflow: 'Support Plans, Risk Assessments, and Roster Scheduling.',
    },
  },
  {
    id: 'goals',
    number: 4,
    title: 'Participant Goals & Outcome Tracking',
    category: 'care',
    status: 'verified',
  },
  {
    id: 'support_plans',
    number: 5,
    title: 'Support Plans & Care Routines',
    category: 'care',
    status: 'verified',
  },
  {
    id: 'risk_assessments',
    number: 6,
    title: 'Participant Risk Assessments & Hazard Matrix',
    category: 'care',
    status: 'verified',
  },
  {
    id: 'quotes',
    number: 7,
    title: 'Quotes & Service Estimates',
    category: 'billing',
    status: 'verified',
    content: {
      purpose: 'Prepare itemised quotes using official NDIS price caps for participants, plan managers, or support coordinators.',
      beforeYouStart: [
        'Verify participant identity and funding type in the CRM.',
        'Confirm the support categories requested (e.g. Core 01_011 Daily Activities, 04_104 Community Access).',
      ],
      informationRequired: [
        'Participant selection.',
        'Support catalog line items with hourly rate and weekly allocated hours.',
        'Estimated duration in weeks (defaults to 52 for annual schedules).',
      ],
      stepByStepProcess: [
        'Navigate to Quotes tab and click "New Quote".',
        'Select the target participant from the dropdown.',
        'Add line items from the NDIS support catalog.',
        'Review weekly, monthly, and annualised estimate totals.',
        'Save as Draft or mark as Sent.',
        'Click "Print / PDF" to generate a client-ready quotation document.',
      ],
      whatHappensAfter: [
        'When accepted, 1-click conversion generates either an active Schedule of Supports or a full Service Agreement.',
      ],
      statusMeanings: {
        Draft: 'Quote in preparation; not yet provided to client.',
        Sent: 'Quote provided to participant, coordinator, or plan manager for review.',
        Accepted: 'Quote approved by client; ready for agreement creation.',
        Declined: 'Quote rejected or cancelled.',
        Converted: 'Converted to Service Agreement or active schedule.',
      },
      whereToFindRecord: 'Quotes tab under billing section.',
      commonMistakes: ['Overriding the reference unit rate above current NDIS price limits without justification.'],
      relatedWorkflow: 'Service Agreement Creation.',
    },
  },
  {
    id: 'agreements',
    number: 8,
    title: 'NDIS Service Agreements & Schedules of Supports',
    category: 'care',
    status: 'verified',
    content: {
      purpose: 'Generate, digitally execute, and manage NDIS Service Agreements and budget allocations.',
      beforeYouStart: [
        'Participant must be enrolled with active status.',
        'Funding management (Plan-Managed vs Self-Managed) and NDIS number must be verified.',
      ],
      informationRequired: [
        'Participant name and NDIS number.',
        'Commencement date and 12-month review date.',
        'Schedule of supports items (hourly rates and weekly hours).',
        'Non-labour travel cap and activity-based transport consent.',
      ],
      stepByStepProcess: [
        'Open Agreements tab and click "New Service Agreement".',
        'Verify participant details in Step 1.',
        'Review dates and funding terms in Step 2.',
        'Add support categories from the live NDIS catalog in Step 3.',
        'Review calculated annual financial commitment in Step 4.',
        'In Step 5, either Save Draft or toggle "Execute & Sign Digitally Now".',
        'Capture participant / nominee signature on digital canvas and submit.',
      ],
      whatHappensAfter: [
        'The agreement status moves to Active.',
        'Allocated hours become the reference budget for rostering and service delivery.',
      ],
      statusMeanings: {
        draft: 'Agreement terms being drafted; awaiting review or signing.',
        pending_signature: 'Terms finalised; awaiting client signature.',
        active: 'Fully executed and currently governing service delivery.',
        superseded: 'Replaced by a newer version/variation.',
      },
      whereToFindRecord: 'Agreements tab directory.',
      commonMistakes: ['Creating an agreement without setting the review date, causing compliance review alerts to trigger immediately.'],
      relatedWorkflow: 'Quotes and Rostering.',
    },
  },
  {
    id: 'workers',
    number: 9,
    title: 'Support Worker Profiles & Compliance Credentials',
    category: 'workforce',
    status: 'verified',
    content: {
      purpose: 'Maintain verified staff directory, hourly pay classifications, and credential expiry dates.',
      beforeYouStart: [
        'Collect worker personal details, NDIS Worker Screening Check (NWSC) number, WWCC number, and First Aid/CPR certificate.',
      ],
      informationRequired: [
        'Worker full legal name, mobile number, and email.',
        'Base hourly pay rate under SCHADS award.',
        'Service suburbs.',
        'Exact certificate expiry dates for NWSC, WWCC, First Aid, and CPR.',
      ],
      stepByStepProcess: [
        'Open Staff tab and click "Add Worker".',
        'Fill in personal and contact information.',
        'Record credential registration numbers and future expiry dates.',
        'Save record to workforce directory.',
        'Use the worker drawer overview to review clearance badges.',
      ],
      whatHappensAfter: [
        'The worker becomes available for assignment in the weekly Roster.',
        'The CRM warns the coordinator if an expired worker is scheduled for a shift.',
      ],
      statusMeanings: {
        Verified: 'Credentials verified and currently within valid dates.',
        Expiring: 'Clearance expires within 30 days; renewal required.',
        Expired: 'Clearance expired; worker blocked from rostering.',
      },
      whereToFindRecord: 'Staff tab under Workers & Credentials.',
      commonMistakes: ['Entering an expired clearance date, which flags the worker immediately on the Dashboard.'],
      relatedWorkflow: 'Rostering and Training Compliance.',
    },
  },
  {
    id: 'employment_contracts',
    number: 10,
    title: 'Employment & Contractor Agreements',
    category: 'workforce',
    status: 'planned',
  },
  {
    id: 'training_compliance',
    number: 11,
    title: 'Training Modules & Compliance Quizzes',
    category: 'workforce',
    status: 'verified',
  },
  {
    id: 'rostering',
    number: 12,
    title: 'Rostering & Shift Scheduling',
    category: 'workforce',
    status: 'verified',
    content: {
      purpose: 'Build and manage weekly schedules matching qualified support workers to participant needs.',
      beforeYouStart: [
        'Participant must have an active Service Agreement or confirmed funding.',
        'Assigned worker must have active, unexpired screening credentials.',
      ],
      informationRequired: [
        'Participant selection.',
        'Support worker selection.',
        'Start and end date/times.',
        'Location address and support item category.',
      ],
      stepByStepProcess: [
        'Open Workforce / Roster tab.',
        'Navigate to the desired week using the date picker controls.',
        'Click "+ New Shift" or click directly on the calendar grid.',
        'Select participant and support worker.',
        'Confirm shift duration and service type.',
        'Click Create Shift.',
      ],
      whatHappensAfter: [
        'Shift appears on the master operational calendar.',
        'Shift is dispatched to the worker’s mobile view in the Worker Portal.',
      ],
      statusMeanings: {
        rostered: 'Shift scheduled on calendar; pending worker confirmation.',
        confirmed: 'Worker has acknowledged and accepted the shift.',
        clocked_in: 'Worker has logged on site.',
        clocked_out: 'Worker has concluded shift on site.',
        completed: 'Shift documentation, progress notes, and travel submitted.',
        cancelled: 'Shift cancelled prior to delivery.',
      },
      whereToFindRecord: 'Workforce Roster tab.',
      commonMistakes: ['Rostering a worker to overlapping shifts across different suburbs.'],
      relatedWorkflow: 'Mobile Shift Completion and Timesheets.',
    },
  },
  {
    id: 'shift_workflow',
    number: 13,
    title: 'Worker Shift Workflow & Mobile Clock-In',
    category: 'workforce',
    status: 'verified',
  },
  {
    id: 'progress_notes',
    number: 14,
    title: 'Progress Notes & Clinical Documentation',
    category: 'care',
    status: 'verified',
  },
  {
    id: 'timesheets',
    number: 15,
    title: 'Timesheet Review & Manager Approval',
    category: 'billing',
    status: 'verified',
    content: {
      purpose: 'Audit completed shift hours, travel claims, and break deductions before releasing to billing.',
      beforeYouStart: ['Support worker must have completed shift documentation in the worker portal.'],
      informationRequired: [
        'Scheduled vs actual clock hours.',
        'Recorded travel kilometres and minutes.',
        'Break minutes deducted.',
      ],
      stepByStepProcess: [
        'Open Timesheets tab.',
        'Filter by status "Submitted" or "Pending Review".',
        'Inspect actual hours and verify that progress notes have been completed.',
        'Click "Approve" to accept the timesheet.',
        'If hours are incorrect, click "Reject" and provide a manager note for the worker to amend.',
      ],
      whatHappensAfter: [
        'Approving a timesheet moves all linked service records from "Not Ready" to "Ready" for billing.',
      ],
      statusMeanings: {
        Submitted: 'Awaiting coordinator audit and approval.',
        Approved: 'Verified by management; unlocked for invoice generation.',
        Rejected: 'Sent back to worker with manager correction note.',
      },
      whereToFindRecord: 'Timesheets tab.',
      commonMistakes: ['Approving a timesheet before the worker has attached the mandatory progress note.'],
      relatedWorkflow: 'Invoice Generation.',
    },
  },
  {
    id: 'invoices',
    number: 16,
    title: 'Invoicing & Billing Management',
    category: 'billing',
    status: 'verified',
    content: {
      purpose: 'Generate compliant NDIS invoices from approved service records and dispatch to Plan Managers, participants, or contracting providers.',
      beforeYouStart: [
        'Ensure genuine organisation ABN and bank remittance details are configured in Settings.',
        'Ensure all relevant timesheets for the billing period have been audited and Approved.',
        'Verify participant funding details (Plan-Managed, Self-Managed, or NDIA-Managed requiring contracting provider details).',
      ],
      informationRequired: [
        'Target participant selection.',
        'Approved service records selection.',
        'Invoice due days (default 14 days).',
      ],
      stepByStepProcess: [
        'Open Invoicing tab and click "Generate Invoice".',
        'Select the participant from the dropdown.',
        'Review the list of Approved service records ready for billing.',
        'Select the checkboxes for all records to be included on this invoice.',
        'Click "Generate Invoice".',
        'Use "Print / PDF" to view or download the A4 document (automatically rendered as "Tax Invoice" if GST registered with genuine ABN, or "Invoice" otherwise).',
        'Use "Send Email" to dispatch the invoice to the billing contact (requires valid ABN and bank configuration in Settings).',
      ],
      whatHappensAfter: [
        'The invoice is saved in Draft / Ready status.',
        'Included service records are transitioned to "Invoiced" to prevent duplicate billing.',
        'Funding period invoiced totals are updated.',
      ],
      statusMeanings: {
        Draft: 'Generated but pending final manager review.',
        Ready: 'Audited and ready for dispatch.',
        Sent: 'Dispatched to Plan Manager, participant, or contracting provider.',
        Paid: 'Marked as paid in CRM for operational tracking.',
        Cancelled: 'Voided invoice.',
      },
      whereToFindRecord: 'Invoicing tab directory.',
      commonMistakes: [
        'Assuming all NDIS invoices are automatically GST-free without verified registration, or attempting to dispatch invoices before organisation ABN and bank details are configured in Settings.',
        'Trying to generate an invoice before approving timesheets, which results in "No approved records found".',
      ],
      relatedWorkflow: 'Timesheet Approval and Payment Status Tracking.',
    },
  },
  {
    id: 'payments',
    number: 17,
    title: 'Payment Status Tracking',
    category: 'billing',
    status: 'verified',
    content: {
      purpose: 'Track payment status updates against issued invoices for operational tracking (note: this updates the invoice status flag in the CRM; it does not record a cash accounting ledger entry or bank feed reconciliation).',
      beforeYouStart: [
        'Verify payment remittance advice statement or bank settlement from Plan Manager or participant in your external bank account.',
      ],
      informationRequired: [
        'Invoice reference number (e.g. INV-2026-12345).',
        'Confirmed bank deposit matching invoice total.',
      ],
      stepByStepProcess: [
        'Open Invoicing tab.',
        'Locate the relevant invoice by searching invoice reference or participant name.',
        'Click "Mark status as Paid" in the actions column.',
        'Confirm the dialog acknowledging that this updates CRM tracking status only.',
      ],
      whatHappensAfter: [
        'The invoice status is updated to "Paid".',
        'An immutable audit event is recorded with timestamp and admin actor.',
      ],
      statusMeanings: {
        Paid: 'Invoice status updated to Paid in CRM for operational tracking.',
        'Partially Paid': 'Partial settlement recorded in CRM.',
      },
      whereToFindRecord: 'Invoicing tab under status filter "Paid".',
      commonMistakes: [
        'Assuming clicking "Mark status as Paid" syncs with accounting software or performs bank reconciliation.',
        'Marking an invoice as paid before confirming funds receipt in the organisation bank account.',
      ],
      relatedWorkflow: 'Invoicing & Billing.',
    },
  },
  {
    id: 'incidents',
    number: 18,
    title: 'Quality & Safeguarding: Incident Reporting',
    category: 'safeguarding',
    status: 'verified',
    content: {
      purpose: 'Record, classify, and investigate incidents or near-misses in compliance with NDIS Commission quality indicators.',
      beforeYouStart: ['Collect factual statements from involved workers, witnesses, and participants.'],
      informationRequired: [
        'Date, time, and exact location of incident.',
        'Severity classification (Low, Medium, High, Critical).',
        'Immediate actions taken to ensure participant safety.',
        'Reportable incident assessment checklist.',
      ],
      stepByStepProcess: [
        'Open Safeguarding tab on the CRM sidebar.',
        'Select the Incidents Register subtab.',
        'Review open incidents or inspect submitted worker incident reports.',
        'Evaluate whether the incident meets statutory reportable criteria (NDIS Commission Notification).',
        'Create associated Corrective Actions to prevent recurrence.',
        'Close incident when investigation and mitigations are complete.',
      ],
      whatHappensAfter: [
        'High and Critical incidents flag immediate alert badges on the Safeguarding KPI strip.',
        'Corrective actions are tracked against assigned team owners.',
      ],
      statusMeanings: {
        Open: 'Under investigation by operations management.',
        Under_Review: 'Corrective actions underway.',
        Closed: 'Investigation concluded and mitigations signed off.',
      },
      whereToFindRecord: 'Safeguarding tab under Incidents Register.',
      commonMistakes: [
        'Recording subjective opinions rather than objective factual observations in incident descriptions.',
      ],
      relatedWorkflow: 'Worker Shift Workflow and Corrective Action Management.',
    },
  },
  {
    id: 'complaints',
    number: 19,
    title: 'Complaints & Participant Feedback',
    category: 'safeguarding',
    status: 'verified',
  },
  {
    id: 'documents',
    number: 20,
    title: 'Document Vault & Storage',
    category: 'admin',
    status: 'verified',
  },
  {
    id: 'participant_portal',
    number: 21,
    title: 'Participant Portal Access & Experience',
    category: 'care',
    status: 'verified',
  },
  {
    id: 'worker_portal',
    number: 22,
    title: 'Staff / Worker Portal Experience',
    category: 'workforce',
    status: 'verified',
  },
  {
    id: 'settings',
    number: 23,
    title: 'Organisation Profile & Provider Configuration',
    category: 'admin',
    status: 'verified',
  },
  {
    id: 'troubleshooting',
    number: 24,
    title: 'Troubleshooting & Support',
    category: 'admin',
    status: 'verified',
  },
];
