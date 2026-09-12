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

export async function getControlledDocuments(
  filter?: { status?: string; audience?: string; isPublic?: boolean },
  customSupabase?: SupabaseClient | null
): Promise<ControlledDocument[]> {
  const supabase = customSupabase || createAdminClient();
  if (!supabase) return CANONICAL_PARTICIPANT_DOCUMENTS;

  let query = supabase.from('controlled_documents').select('*');
  if (filter?.status) query = query.eq('status', filter.status);
  if (filter?.isPublic !== undefined) query = query.eq('is_public', filter.isPublic);
  if (filter?.audience) query = query.in('target_audience', [filter.audience, 'all']);

  const { data, error } = await query.order('document_code', { ascending: true });
  if (error || !data || data.length === 0) {
    return CANONICAL_PARTICIPANT_DOCUMENTS;
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
    return CANONICAL_PARTICIPANT_DOCUMENTS.find((d) => d.document_code === code) || null;
  }

  let query = supabase.from('controlled_documents').select('*').eq('document_code', code);
  if (version) query = query.eq('version', version);
  else query = query.eq('status', 'current');

  const { data, error } = await query.maybeSingle();
  if (error || !data) {
    return CANONICAL_PARTICIPANT_DOCUMENTS.find((d) => d.document_code === code) || null;
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
