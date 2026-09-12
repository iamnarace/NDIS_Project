import { createAdminClient } from '@/lib/supabase/admin';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface ControlledDocument {
  id?: string;
  document_code: string;
  title: string;
  category: string;
  version: string;
  effective_date: string;
  review_date: string;
  status: 'draft' | 'current' | 'superseded' | 'archived';
  owner_approver: string;
  acknowledgement_required: boolean;
  is_public: boolean;
  target_audience: 'public' | 'participant' | 'worker' | 'all';
  change_summary: string;
  source_template_url?: string;
  content_markdown?: string;
}

export const CANONICAL_PARTICIPANT_DOCUMENTS: ControlledDocument[] = [
  {
    document_code: 'DOC-AGR-01',
    title: 'NDIS Service Agreement',
    category: 'Legal & Contract',
    version: '2026.1',
    effective_date: '2026-07-01',
    review_date: '2027-06-30',
    status: 'current',
    owner_approver: 'Operations & Governance Lead',
    acknowledgement_required: true,
    is_public: true,
    target_audience: 'participant',
    change_summary: 'Aligned with NDIS 2026-27 Pricing Arrangements and Opus sole trader unregistered governance.',
    source_template_url: '/documents/service-agreement',
  },
  {
    document_code: 'DOC-SCH-01',
    title: 'Schedule of Supports',
    category: 'Operations & Billing',
    version: '2026.1',
    effective_date: '2026-07-01',
    review_date: '2027-06-30',
    status: 'current',
    owner_approver: 'Operations & Governance Lead',
    acknowledgement_required: true,
    is_public: true,
    target_audience: 'participant',
    change_summary: 'Tailored support item allocations and price limits.',
    source_template_url: '/documents/schedule-of-supports',
  },
  {
    document_code: 'DOC-PRC-01',
    title: 'Pricing, Travel & Cancellation Policy',
    category: 'Finance & Pricing',
    version: '2026.1',
    effective_date: '2026-07-01',
    review_date: '2027-06-30',
    status: 'current',
    owner_approver: 'Finance & Governance Lead',
    acknowledgement_required: false,
    is_public: true,
    target_audience: 'all',
    change_summary: 'Transparent pricing under NDIS price limits; strict 2-clear-business-days cancellation rules.',
    source_template_url: '/documents/pricing-travel-cancellation',
  },
  {
    document_code: 'DOC-PRV-01',
    title: 'Privacy Collection Notice & Information Handling',
    category: 'Privacy & Compliance',
    version: '2026.1',
    effective_date: '2026-07-01',
    review_date: '2027-06-30',
    status: 'current',
    owner_approver: 'Privacy Officer',
    acknowledgement_required: true,
    is_public: true,
    target_audience: 'all',
    change_summary: 'Australian Privacy Principles compliance, purpose of collection, secure retention and access rights.',
    source_template_url: '/privacy',
  },
  {
    document_code: 'DOC-RGT-01',
    title: 'Participant Charter of Rights & Responsibilities',
    category: 'Quality & Safeguarding',
    version: '2026.1',
    effective_date: '2026-07-01',
    review_date: '2027-06-30',
    status: 'current',
    owner_approver: 'Safeguarding Lead',
    acknowledgement_required: true,
    is_public: true,
    target_audience: 'participant',
    change_summary: 'Dignity, choice & control, advocacy rights, and participant responsibilities.',
    source_template_url: '/documents/rights-and-responsibilities',
  },
  {
    document_code: 'DOC-CMP-01',
    title: 'Complaints, Feedback & Dispute Resolution Guide',
    category: 'Quality & Safeguarding',
    version: '2026.1',
    effective_date: '2026-07-01',
    review_date: '2027-06-30',
    status: 'current',
    owner_approver: 'Safeguarding Lead',
    acknowledgement_required: false,
    is_public: true,
    target_audience: 'all',
    change_summary: 'Fair complaints process, external escalation to NDIS Commission, no fear of retribution.',
    source_template_url: '/complaints',
  },
  {
    document_code: 'DOC-INC-01',
    title: 'Incident Management & Safeguarding Guide',
    category: 'Quality & Safeguarding',
    version: '2026.1',
    effective_date: '2026-07-01',
    review_date: '2027-06-30',
    status: 'current',
    owner_approver: 'Safeguarding Lead',
    acknowledgement_required: false,
    is_public: true,
    target_audience: 'all',
    change_summary: 'Participant safety, incident response, zero tolerance for abuse, open disclosure.',
    source_template_url: '/incident-management',
  },
  {
    document_code: 'DOC-HBK-01',
    title: 'Participant Welcome & Onboarding Handbook',
    category: 'Client Experience',
    version: '2026.1',
    effective_date: '2026-07-01',
    review_date: '2027-06-30',
    status: 'current',
    owner_approver: 'Operations Lead',
    acknowledgement_required: false,
    is_public: true,
    target_audience: 'participant',
    change_summary: 'Complete client handbook covering service delivery, worker matching, and portal access.',
    source_template_url: '/documents/welcome-pack',
  },
  {
    document_code: 'DOC-EMG-01',
    title: 'Emergency & After-Hours Support Protocol',
    category: 'Safety & Emergency',
    version: '2026.1',
    effective_date: '2026-07-01',
    review_date: '2027-06-30',
    status: 'current',
    owner_approver: 'Operations Lead',
    acknowledgement_required: false,
    is_public: true,
    target_audience: 'all',
    change_summary: 'Critical incident triage, 000 protocols, and after-hours operational contact.',
    source_template_url: '/documents/emergency-support',
  },
  {
    document_code: 'DOC-EXT-01',
    title: 'Service Exit & Transition Policy',
    category: 'Client Experience',
    version: '2026.1',
    effective_date: '2026-07-01',
    review_date: '2027-06-30',
    status: 'current',
    owner_approver: 'Operations Lead',
    acknowledgement_required: false,
    is_public: true,
    target_audience: 'participant',
    change_summary: 'Fair 14-day notice, orderly transition of support records, and unhindered exit rights.',
    source_template_url: '/documents/exit-transition',
  },
  {
    document_code: 'DOC-ISA-01',
    title: 'Information Sharing Authority Template & Policy',
    category: 'Privacy & Compliance',
    version: '2026.1',
    effective_date: '2026-07-01',
    review_date: '2027-06-30',
    status: 'current',
    owner_approver: 'Privacy Officer',
    acknowledgement_required: true,
    is_public: true,
    target_audience: 'participant',
    change_summary: 'Specific consent for sharing information with Plan Managers, Support Coordinators, and Allied Health.',
    source_template_url: '/documents/information-sharing',
  },
];

export const CANONICAL_OPERATIONAL_POLICIES: ControlledDocument[] = [
  {
    document_code: 'DOC-COC-01',
    title: 'NDIS Worker Code of Conduct Policy & Guidance',
    category: 'Workforce & Governance',
    version: '2026.1',
    effective_date: '2026-07-01',
    review_date: '2027-06-30',
    status: 'current',
    owner_approver: 'Operations & Governance Lead',
    acknowledgement_required: true,
    is_public: true,
    target_audience: 'worker',
    change_summary: 'NDIS Quality and Safeguards Commission Worker Code of Conduct operational requirements and worker agreement.',
    source_template_url: '/documents/worker-code-of-conduct',
  },
  {
    document_code: 'DOC-SFG-01',
    title: 'Participant Safeguarding & Zero-Tolerance Policy',
    category: 'Quality & Safeguarding',
    version: '2026.1',
    effective_date: '2026-07-01',
    review_date: '2027-06-30',
    status: 'current',
    owner_approver: 'Safeguarding Lead',
    acknowledgement_required: true,
    is_public: true,
    target_audience: 'all',
    change_summary: 'Zero-tolerance of abuse, neglect, exploitation, and discrimination with mandatory reporting duties.',
    source_template_url: '/documents/safeguarding-policy',
  },
  {
    document_code: 'DOC-BND-01',
    title: 'Professional Boundaries & Conduct Policy',
    category: 'Workforce & Governance',
    version: '2026.1',
    effective_date: '2026-07-01',
    review_date: '2027-06-30',
    status: 'current',
    owner_approver: 'Operations & Governance Lead',
    acknowledgement_required: true,
    is_public: true,
    target_audience: 'worker',
    change_summary: 'Standards for maintaining appropriate physical, financial, emotional, and social boundaries.',
    source_template_url: '/documents/professional-boundaries',
  },
  {
    document_code: 'DOC-WHS-01',
    title: 'Work Health & Safety (WHS) and Hazard Policy',
    category: 'Work Health & Safety',
    version: '2026.1',
    effective_date: '2026-07-01',
    review_date: '2027-06-30',
    status: 'current',
    owner_approver: 'WHS Officer',
    acknowledgement_required: true,
    is_public: true,
    target_audience: 'all',
    change_summary: 'Safe systems of work in domestic community environments, risk assessments, and PPE protocols.',
    source_template_url: '/documents/whs-policy',
  },
  {
    document_code: 'DOC-LNE-01',
    title: 'Lone Worker & Community Safety Protocol',
    category: 'Work Health & Safety',
    version: '2026.1',
    effective_date: '2026-07-01',
    review_date: '2027-06-30',
    status: 'current',
    owner_approver: 'WHS Officer',
    acknowledgement_required: true,
    is_public: true,
    target_audience: 'worker',
    change_summary: 'Safety procedures for solitary home visits, duress check-ins, and dangerous situation withdrawal.',
    source_template_url: '/documents/lone-worker-policy',
  },
  {
    document_code: 'DOC-BCP-01',
    title: 'Business Continuity & Disaster Management Plan',
    category: 'Governance & Continuity',
    version: '2026.1',
    effective_date: '2026-07-01',
    review_date: '2027-06-30',
    status: 'current',
    owner_approver: 'Operations & Governance Lead',
    acknowledgement_required: false,
    is_public: false,
    target_audience: 'all',
    change_summary: 'Contingency plans for severe weather, power loss, workforce shortages, and critical participant support continuity.',
    source_template_url: '/documents/business-continuity',
  },
  {
    document_code: 'DOC-IPC-01',
    title: 'Infection Prevention & Hygiene Protocol',
    category: 'Health & Safety',
    version: '2026.1',
    effective_date: '2026-07-01',
    review_date: '2027-06-30',
    status: 'current',
    owner_approver: 'Operations Lead',
    acknowledgement_required: true,
    is_public: true,
    target_audience: 'all',
    change_summary: 'Hand hygiene, PPE use, cross-contamination prevention, and illness reporting standards.',
    source_template_url: '/documents/infection-prevention',
  },
  {
    document_code: 'DOC-TRN-01',
    title: 'Participant Transport & Vehicle Safety Standard',
    category: 'Transport & Safety',
    version: '2026.1',
    effective_date: '2026-07-01',
    review_date: '2027-06-30',
    status: 'current',
    owner_approver: 'Operations Lead',
    acknowledgement_required: true,
    is_public: true,
    target_audience: 'worker',
    change_summary: 'Driver licensing, comprehensive insurance, seatbelt adherence, roadworthiness, and transport incident management.',
    source_template_url: '/documents/transport-safety',
  },
  {
    document_code: 'DOC-MNY-01',
    title: 'Money Handling & Financial Integrity Protocol',
    category: 'Finance & Safeguarding',
    version: '2026.1',
    effective_date: '2026-07-01',
    review_date: '2027-06-30',
    status: 'current',
    owner_approver: 'Finance Lead',
    acknowledgement_required: true,
    is_public: true,
    target_audience: 'all',
    change_summary: 'Safeguards for handling participant cash during community shopping, mandatory receipts, and zero financial gifts.',
    source_template_url: '/documents/money-handling',
  },
  {
    document_code: 'DOC-COI-01',
    title: 'Conflict of Interest Policy & Register',
    category: 'Governance & Integrity',
    version: '2026.1',
    effective_date: '2026-07-01',
    review_date: '2027-06-30',
    status: 'current',
    owner_approver: 'Operations & Governance Lead',
    acknowledgement_required: true,
    is_public: true,
    target_audience: 'worker',
    change_summary: 'Disclosure requirements for personal, commercial, or relational conflicts affecting service delivery.',
    source_template_url: '/documents/conflict-of-interest',
  },
  {
    document_code: 'DOC-REC-01',
    title: 'Records Retention, Disposal & Archival Policy',
    category: 'Privacy & Compliance',
    version: '2026.1',
    effective_date: '2026-07-01',
    review_date: '2027-06-30',
    status: 'current',
    owner_approver: 'Privacy Officer',
    acknowledgement_required: false,
    is_public: false,
    target_audience: 'all',
    change_summary: 'Strict compliance with Australian 7-year (adult) and age-25/7-year (child) NDIS record retention standards.',
    source_template_url: '/documents/records-retention',
  },
  {
    document_code: 'DOC-SCR-01',
    title: 'Worker Screening, Background Check & Suitability Policy',
    category: 'Workforce & Governance',
    version: '2026.1',
    effective_date: '2026-07-01',
    review_date: '2027-06-30',
    status: 'current',
    owner_approver: 'Operations & Governance Lead',
    acknowledgement_required: true,
    is_public: true,
    target_audience: 'worker',
    change_summary: 'Mandatory NDIS Worker Screening Check, National Police Check, WWCC, and referee verification before roster placement.',
    source_template_url: '/documents/worker-screening-policy',
  },
  {
    document_code: 'DOC-MED-01',
    title: 'Medication Assistance Standard (Non-Clinical / Prompting)',
    category: 'Health & Care Governance',
    version: '2026.1',
    effective_date: '2026-07-01',
    review_date: '2027-06-30',
    status: 'current',
    owner_approver: 'Care Governance Lead',
    acknowledgement_required: true,
    is_public: true,
    target_audience: 'worker',
    change_summary: 'Protocols strictly limited to assistance with self-administration, Webster pack verification, and prompting.',
    source_template_url: '/documents/medication-assistance',
  },
  {
    document_code: 'DOC-MNH-01',
    title: 'Manual Handling & Ergonomics Standard',
    category: 'Work Health & Safety',
    version: '2026.1',
    effective_date: '2026-07-01',
    review_date: '2027-06-30',
    status: 'current',
    owner_approver: 'WHS Officer',
    acknowledgement_required: true,
    is_public: true,
    target_audience: 'worker',
    change_summary: 'Ergonomic principles, participant transfer assistance rules, and no-manual-lifting hazardous load restrictions.',
    source_template_url: '/documents/manual-handling',
  },
  {
    document_code: 'DOC-CLN-01',
    title: 'Clinical Governance & Scope-of-Practice Standard',
    category: 'Clinical Governance',
    version: '2026.1',
    effective_date: '2026-07-01',
    review_date: '2027-06-30',
    status: 'current',
    owner_approver: 'Clinical Governance Lead',
    acknowledgement_required: true,
    is_public: true,
    target_audience: 'all',
    change_summary: 'Controlled definition of non-clinical boundary. High-intensity clinical supports disabled until clinical lead appointment.',
    source_template_url: '/documents/clinical-scope',
  },
];

export const ALL_CONTROLLED_DOCUMENTS: ControlledDocument[] = [
  ...CANONICAL_PARTICIPANT_DOCUMENTS,
  ...CANONICAL_OPERATIONAL_POLICIES,
];

export async function getControlledDocuments(
  filter?: { status?: string; audience?: string; isPublic?: boolean },
  customSupabase?: SupabaseClient | null
): Promise<ControlledDocument[]> {
  const supabase = customSupabase || createAdminClient();
  if (!supabase) return ALL_CONTROLLED_DOCUMENTS;

  let query = supabase.from('controlled_documents').select('*');
  if (filter?.status) query = query.eq('status', filter.status);
  if (filter?.isPublic !== undefined) query = query.eq('is_public', filter.isPublic);
  if (filter?.audience) query = query.in('target_audience', [filter.audience, 'all']);

  const { data, error } = await query.order('document_code', { ascending: true });
  if (error || !data || data.length === 0) {
    return ALL_CONTROLLED_DOCUMENTS;
  }
  return data as ControlledDocument[];
}

export async function getControlledDocument(
  code: string,
  version?: string,
  customSupabase?: SupabaseClient | null
): Promise<ControlledDocument | null> {
  const supabase = customSupabase || createAdminClient();
  if (!supabase) {
    return ALL_CONTROLLED_DOCUMENTS.find((d) => d.document_code === code) || null;
  }

  let query = supabase.from('controlled_documents').select('*').eq('document_code', code);
  if (version) query = query.eq('version', version);
  else query = query.eq('status', 'current');

  const { data, error } = await query.maybeSingle();
  if (error || !data) {
    return ALL_CONTROLLED_DOCUMENTS.find((d) => d.document_code === code) || null;
  }
  return data as ControlledDocument;
}

export async function recordDocumentAcknowledgement(
  params: {
    documentId?: string;
    documentCode: string;
    documentVersion: string;
    acknowledgerType: 'participant' | 'worker' | 'nominee';
    acknowledgerId: string;
    acknowledgerName: string;
    method?: 'digital_portal' | 'written_form' | 'verbal_recorded';
    notes?: string;
  },
  customSupabase?: SupabaseClient | null
) {
  const supabase = customSupabase || createAdminClient();
  if (!supabase) throw new Error('Database client unavailable');

  let docId = params.documentId;
  if (!docId) {
    const doc = await getControlledDocument(params.documentCode, params.documentVersion, supabase);
    docId = doc?.id;
  }

  if (!docId) {
    throw new Error(`Controlled document ${params.documentCode} v${params.documentVersion} not found in database.`);
  }

  const { data, error } = await supabase
    .from('document_acknowledgements')
    .insert({
      document_id: docId,
      document_code: params.documentCode,
      document_version: params.documentVersion,
      acknowledger_type: params.acknowledgerType,
      acknowledger_id: params.acknowledgerId,
      acknowledger_name: params.acknowledgerName,
      method: params.method || 'digital_portal',
      notes: params.notes || null,
    })
    .select()
    .single();

  if (error) throw new Error(`Could not record document acknowledgement: ${error.message}`);
  return data;
}
