import { createAdminClient } from '@/lib/supabase/admin';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface ParticipantConsentRecord {
  id?: string;
  participant_id: string;
  privacy_notice_acknowledged: boolean;
  privacy_notice_version: string;
  privacy_acknowledged_at?: string | null;
  privacy_acknowledged_by?: string | null;
  privacy_acknowledged_role: 'participant' | 'guardian' | 'nominee' | 'authorised_rep';
  privacy_acknowledgement_method: 'digital_portal' | 'written_form' | 'verbal_recorded';
  service_consent_granted: boolean;
  service_consent_at?: string | null;
  service_consent_by?: string | null;
  marketing_consent_granted: boolean;
  marketing_consent_at?: string | null;
  nominee_name?: string | null;
  nominee_relationship?: string | null;
  nominee_authority_basis?: 'parent_guardian' | 'plan_nominee' | 'correspondence_nominee' | 'enduring_power_of_attorney' | 'court_tribunal_appointed' | null;
  nominee_verified_at?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface InformationSharingAuthorityRecord {
  id?: string;
  participant_id: string;
  purpose: string;
  recipient_name: string;
  recipient_organisation: string;
  recipient_role: string;
  information_scope: 'financial_invoicing_only' | 'service_schedules_and_delivery' | 'support_plans_and_clinical_reports' | 'all_operational_records';
  start_date: string;
  review_date: string;
  status: 'active' | 'revoked' | 'expired';
  revocation_date?: string | null;
  revocation_reason?: string | null;
  revoked_by?: string | null;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export async function getParticipantConsents(
  participantId: string,
  customSupabase?: SupabaseClient | null
): Promise<ParticipantConsentRecord | null> {
  const supabase = customSupabase || createAdminClient();
  if (!supabase) throw new Error('Database client unavailable');

  const { data, error } = await supabase
    .from('participant_consents')
    .select('*')
    .eq('participant_id', participantId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load participant consents: ${error.message}`);
  }
  return data as ParticipantConsentRecord | null;
}

export async function upsertParticipantConsents(
  params: {
    participant_id: string;
    privacy_notice_acknowledged: boolean;
    privacy_notice_version?: string;
    privacy_acknowledged_by?: string;
    privacy_acknowledged_role?: 'participant' | 'guardian' | 'nominee' | 'authorised_rep';
    privacy_acknowledgement_method?: 'digital_portal' | 'written_form' | 'verbal_recorded';
    service_consent_granted: boolean;
    service_consent_by?: string;
    marketing_consent_granted: boolean;
    nominee_name?: string;
    nominee_relationship?: string;
    nominee_authority_basis?: 'parent_guardian' | 'plan_nominee' | 'correspondence_nominee' | 'enduring_power_of_attorney' | 'court_tribunal_appointed';
    notes?: string;
  },
  actorId: string = 'admin',
  customSupabase?: SupabaseClient | null
): Promise<ParticipantConsentRecord> {
  const supabase = customSupabase || createAdminClient();
  if (!supabase) throw new Error('Database client unavailable');

  const now = new Date().toISOString();

  const payload: any = {
    participant_id: params.participant_id,
    privacy_notice_acknowledged: Boolean(params.privacy_notice_acknowledged),
    privacy_notice_version: params.privacy_notice_version || '2026.1',
    privacy_acknowledged_at: params.privacy_notice_acknowledged ? now : null,
    privacy_acknowledged_by: params.privacy_acknowledged_by || null,
    privacy_acknowledged_role: params.privacy_acknowledged_role || 'participant',
    privacy_acknowledgement_method: params.privacy_acknowledgement_method || 'digital_portal',
    service_consent_granted: Boolean(params.service_consent_granted),
    service_consent_at: params.service_consent_granted ? now : null,
    service_consent_by: params.service_consent_by || null,
    marketing_consent_granted: Boolean(params.marketing_consent_granted),
    marketing_consent_at: params.marketing_consent_granted ? now : null,
    nominee_name: params.nominee_name || null,
    nominee_relationship: params.nominee_relationship || null,
    nominee_authority_basis: params.nominee_authority_basis || null,
    nominee_verified_at: params.nominee_name ? now : null,
    notes: params.notes || null,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from('participant_consents')
    .upsert(payload, { onConflict: 'participant_id' })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save participant consents: ${error.message}`);
  }

  // Audit event
  await supabase.from('audit_events').insert({
    entity_type: 'participant_consent',
    entity_id: params.participant_id,
    actor_type: 'staff',
    actor_id: actorId,
    action: 'participant_consents_updated',
    changes: payload,
    metadata: { participant_id: params.participant_id },
  }).select().maybeSingle();

  return data as ParticipantConsentRecord;
}

export async function getInformationSharingAuthorities(
  participantId: string,
  customSupabase?: SupabaseClient | null
): Promise<InformationSharingAuthorityRecord[]> {
  const supabase = customSupabase || createAdminClient();
  if (!supabase) throw new Error('Database client unavailable');

  const { data, error } = await supabase
    .from('information_sharing_authorities')
    .select('*')
    .eq('participant_id', participantId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load information sharing authorities: ${error.message}`);
  }
  return data as InformationSharingAuthorityRecord[];
}

export async function createInformationSharingAuthority(
  params: {
    participant_id: string;
    purpose: string;
    recipient_name: string;
    recipient_organisation: string;
    recipient_role: string;
    information_scope: 'financial_invoicing_only' | 'service_schedules_and_delivery' | 'support_plans_and_clinical_reports' | 'all_operational_records';
    start_date?: string;
    review_date: string;
  },
  actorId: string = 'admin',
  customSupabase?: SupabaseClient | null
): Promise<InformationSharingAuthorityRecord> {
  const supabase = customSupabase || createAdminClient();
  if (!supabase) throw new Error('Database client unavailable');

  if (!params.purpose || !params.recipient_name || !params.recipient_organisation || !params.review_date) {
    throw new Error('Missing required information sharing authority fields.');
  }

  const payload = {
    participant_id: params.participant_id,
    purpose: params.purpose,
    recipient_name: params.recipient_name,
    recipient_organisation: params.recipient_organisation,
    recipient_role: params.recipient_role,
    information_scope: params.information_scope,
    start_date: params.start_date || new Date().toISOString().split('T')[0],
    review_date: params.review_date,
    status: 'active',
    created_by: actorId,
  };

  const { data, error } = await supabase
    .from('information_sharing_authorities')
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create information sharing authority: ${error.message}`);
  }

  // Audit event
  await supabase.from('audit_events').insert({
    entity_type: 'information_sharing_authority',
    entity_id: data.id,
    actor_type: 'staff',
    actor_id: actorId,
    action: 'information_sharing_authority_granted',
    changes: payload,
    metadata: { participant_id: params.participant_id },
  }).select().maybeSingle();

  return data as InformationSharingAuthorityRecord;
}

export async function revokeInformationSharingAuthority(
  authorityId: string,
  participantId: string,
  reason: string,
  actorId: string = 'admin',
  customSupabase?: SupabaseClient | null
): Promise<InformationSharingAuthorityRecord> {
  const supabase = customSupabase || createAdminClient();
  if (!supabase) throw new Error('Database client unavailable');

  if (!reason || !reason.trim()) {
    throw new Error('A documented reason is required to revoke an Information Sharing Authority.');
  }

  const now = new Date().toISOString();
  const payload = {
    status: 'revoked',
    revocation_date: now,
    revocation_reason: reason.trim(),
    revoked_by: actorId,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from('information_sharing_authorities')
    .update(payload)
    .eq('id', authorityId)
    .eq('participant_id', participantId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to revoke information sharing authority: ${error.message}`);
  }

  // Audit event
  await supabase.from('audit_events').insert({
    entity_type: 'information_sharing_authority',
    entity_id: authorityId,
    actor_type: 'staff',
    actor_id: actorId,
    action: 'information_sharing_authority_revoked',
    changes: payload,
    metadata: { participant_id: participantId, revocation_reason: reason },
  }).select().maybeSingle();

  return data as InformationSharingAuthorityRecord;
}
