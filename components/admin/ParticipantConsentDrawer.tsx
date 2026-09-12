'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  FileCheck2,
  Lock,
  X,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Share2,
  UserCheck,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { FormDrawer, DrawerHeader } from '@/components/admin/forms';
import { notify } from '@/components/ui/ProductFeedback';
import type { ParticipantConsentRecord, InformationSharingAuthorityRecord } from '@/lib/services/privacyConsent';

interface ParticipantConsentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  participantId: string;
  participantName: string;
}

export default function ParticipantConsentDrawer({
  isOpen,
  onClose,
  participantId,
  participantName,
}: ParticipantConsentDrawerProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [consents, setConsents] = useState<ParticipantConsentRecord | null>(null);
  const [authorities, setAuthorities] = useState<InformationSharingAuthorityRecord[]>([]);

  // Form states
  const [privacyAck, setPrivacyAck] = useState(false);
  const [privacyRole, setPrivacyRole] = useState<'participant' | 'guardian' | 'nominee' | 'authorised_rep'>('participant');
  const [serviceConsent, setServiceConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false); // strictly false by default!
  const [nomineeName, setNomineeName] = useState('');
  const [nomineeRelationship, setNomineeRelationship] = useState('');
  const [nomineeBasis, setNomineeBasis] = useState<string>('');

  // New sharing authority modal state
  const [showNewAuthority, setShowNewAuthority] = useState(false);
  const [authPurpose, setAuthPurpose] = useState('');
  const [authRecipientName, setAuthRecipientName] = useState('');
  const [authRecipientOrg, setAuthRecipientOrg] = useState('');
  const [authRecipientRole, setAuthRecipientRole] = useState('Plan Manager');
  const [authScope, setAuthScope] = useState<'financial_invoicing_only' | 'service_schedules_and_delivery' | 'support_plans_and_clinical_reports' | 'all_operational_records'>('financial_invoicing_only');
  const [authReviewDate, setAuthReviewDate] = useState('');

  // Revoke state
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokeReason, setRevokeReason] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/crm/consents?participant_id=${encodeURIComponent(participantId)}`);
      if (!res.ok) throw new Error('Failed to load consent records');
      const data = await res.json();
      setConsents(data.consents);
      setAuthorities(data.information_sharing_authorities || []);

      if (data.consents) {
        setPrivacyAck(Boolean(data.consents.privacy_notice_acknowledged));
        setPrivacyRole(data.consents.privacy_acknowledged_role || 'participant');
        setServiceConsent(Boolean(data.consents.service_consent_granted));
        setMarketingConsent(Boolean(data.consents.marketing_consent_granted));
        setNomineeName(data.consents.nominee_name || '');
        setNomineeRelationship(data.consents.nominee_relationship || '');
        setNomineeBasis(data.consents.nominee_authority_basis || '');
      }
    } catch (err: any) {
      notify(err.message);
    } finally {
      setLoading(false);
    }
  }, [participantId]);

  useEffect(() => {
    if (!isOpen || !participantId) return;
    loadData();
  }, [isOpen, participantId, loadData]);

  const handleSaveConsents = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/crm/consents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_id: participantId,
          privacy_notice_acknowledged: privacyAck,
          privacy_acknowledged_role: privacyRole,
          service_consent_granted: serviceConsent,
          marketing_consent_granted: marketingConsent,
          nominee_name: nomineeName.trim() || undefined,
          nominee_relationship: nomineeRelationship.trim() || undefined,
          nominee_authority_basis: nomineeBasis || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to save consents');
      }

      notify('Participant consents updated successfully');
      await loadData();
    } catch (err: any) {
      notify(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAuthority = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authPurpose || !authRecipientName || !authRecipientOrg || !authReviewDate) {
      notify('Please complete all required authority fields');
      return;
    }

    try {
      const res = await fetch('/api/crm/consents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          participant_id: participantId,
          purpose: authPurpose,
          recipient_name: authRecipientName,
          recipient_organisation: authRecipientOrg,
          recipient_role: authRecipientRole,
          information_scope: authScope,
          review_date: authReviewDate,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create authority');
      }

      notify('Information Sharing Authority granted');
      setShowNewAuthority(false);
      setAuthPurpose('');
      setAuthRecipientName('');
      setAuthRecipientOrg('');
      setAuthReviewDate('');
      await loadData();
    } catch (err: any) {
      notify(err.message);
    }
  };

  const handleRevokeAuthority = async (id: string) => {
    if (!revokeReason.trim()) {
      notify('A documented reason is required to revoke authority');
      return;
    }

    try {
      const res = await fetch('/api/crm/consents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'revoke',
          participant_id: participantId,
          authority_id: id,
          reason: revokeReason.trim(),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to revoke authority');
      }

      notify('Information Sharing Authority revoked');
      setRevokingId(null);
      setRevokeReason('');
      await loadData();
    } catch (err: any) {
      notify(err.message);
    }
  };

  return (
    <FormDrawer isOpen={isOpen} onClose={onClose} wide>
      <div className="drawer-header">
        <div className="header-title-block">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={18} color="var(--brand-primary)" />
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>
              Privacy, Consents &amp; Information Sharing
            </h2>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--text-muted)' }}>
            Participant: <strong>{participantName}</strong> • Governed under Australian Privacy Principles
          </p>
        </div>
      </div>

      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748B' }}>
            Loading consent records...
          </div>
        ) : (
          <>
            {/* Section 1: Privacy Collection Notice */}
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileCheck2 size={18} color="#0284C7" />
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  1. Privacy Collection Notice Acknowledgement
                </h3>
              </div>
              <p style={{ fontSize: 12.5, color: '#64748B', margin: 0 }}>
                Certifies that the participant or authorized representative has received and acknowledged the Opus Care Privacy Collection Notice (Version 2026.1) in accordance with the Privacy Act 1988 (Cth).
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                <input
                  type="checkbox"
                  id="privacyAckCheck"
                  checked={privacyAck}
                  onChange={(e) => setPrivacyAck(e.target.checked)}
                  style={{ width: 17, height: 17 }}
                />
                <label htmlFor="privacyAckCheck" style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', cursor: 'pointer' }}>
                  Privacy Collection Notice acknowledged
                </label>
              </div>

              {privacyAck && (
                <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginTop: 4 }}>
                  <span style={{ fontSize: 12, color: '#64748B' }}>Acknowledged By Role:</span>
                  <select
                    value={privacyRole}
                    onChange={(e: any) => setPrivacyRole(e.target.value)}
                    style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5 }}
                  >
                    <option value="participant">Participant</option>
                    <option value="guardian">Legal Guardian</option>
                    <option value="nominee">NDIS Nominee</option>
                    <option value="authorised_rep">Authorised Representative</option>
                  </select>
                </div>
              )}
            </div>

            {/* Section 2: Service Delivery & Marketing Consents */}
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserCheck size={18} color="#059669" />
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  2. Service Consent &amp; Marketing Separation
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <input
                    type="checkbox"
                    id="serviceConsentCheck"
                    checked={serviceConsent}
                    onChange={(e) => setServiceConsent(e.target.checked)}
                    style={{ width: 17, height: 17, marginTop: 2 }}
                  />
                  <div>
                    <label htmlFor="serviceConsentCheck" style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', cursor: 'pointer' }}>
                      Service &amp; Support Delivery Consent Granted
                    </label>
                    <div style={{ fontSize: 12, color: '#64748B' }}>
                      Informed consent to receive disability support services from Opus Care Support Services.
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    paddingTop: 10,
                    borderTop: '1px solid #E2E8F0',
                  }}
                >
                  <input
                    type="checkbox"
                    id="marketingConsentCheck"
                    checked={marketingConsent}
                    onChange={(e) => setMarketingConsent(e.target.checked)}
                    style={{ width: 17, height: 17, marginTop: 2 }}
                  />
                  <div>
                    <label htmlFor="marketingConsentCheck" style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', cursor: 'pointer' }}>
                      Separate Optional Marketing / Case Study Consent (Optional)
                    </label>
                    <div style={{ fontSize: 12, color: '#64748B' }}>
                      Strictly optional. Does NOT affect service delivery. No marketing communications are sent without explicit consent.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Nominee / Authorised Representative */}
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: 0 }}>
                3. Nominee / Representative Authority Details
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Representative Name</label>
                  <input
                    type="text"
                    value={nomineeName}
                    onChange={(e) => setNomineeName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5, marginTop: 4 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Relationship</label>
                  <input
                    type="text"
                    value={nomineeRelationship}
                    onChange={(e) => setNomineeRelationship(e.target.value)}
                    placeholder="e.g. Mother / Appointed Guardian"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5, marginTop: 4 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Authority Basis</label>
                  <select
                    value={nomineeBasis}
                    onChange={(e) => setNomineeBasis(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5, marginTop: 4 }}
                  >
                    <option value="">None / Self-representing</option>
                    <option value="parent_guardian">Parent / Legal Guardian</option>
                    <option value="plan_nominee">NDIS Plan Nominee</option>
                    <option value="correspondence_nominee">NDIS Correspondence Nominee</option>
                    <option value="enduring_power_of_attorney">Enduring Power of Attorney</option>
                    <option value="court_tribunal_appointed">Court / Tribunal Appointed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Save Consents Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleSaveConsents}
                disabled={saving}
                className="btn btn-primary"
                style={{ padding: '8px 18px', fontSize: 13 }}
              >
                {saving ? 'Saving...' : 'Save Consent Records'}
              </button>
            </div>

            {/* Section 4: Information Sharing Authorities */}
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Share2 size={18} color="#7C3AED" />
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: 0 }}>
                    4. Information Sharing Authorities ({authorities.length})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewAuthority(true)}
                  className="btn btn-surface"
                  style={{ padding: '6px 12px', fontSize: 12 }}
                >
                  <Plus size={14} />
                  <span>Grant New Authority</span>
                </button>
              </div>

              {authorities.length === 0 ? (
                <div style={{ padding: '16px 0', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
                  No active third-party Information Sharing Authorities recorded.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {authorities.map((auth) => {
                    const isRevoked = auth.status === 'revoked';
                    return (
                      <div
                        key={auth.id}
                        style={{
                          border: '1px solid',
                          borderColor: isRevoked ? '#FECDD3' : '#E2E8F0',
                          borderRadius: 8,
                          padding: '12px 16px',
                          background: isRevoked ? '#FFF1F2' : '#F8FAFC',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontWeight: 700, fontSize: 13.5, color: '#0F172A' }}>
                              {auth.recipient_name} ({auth.recipient_organisation})
                            </span>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                padding: '1px 7px',
                                borderRadius: 4,
                                background: isRevoked ? '#FDA4AF' : '#D1FAE5',
                                color: isRevoked ? '#9F1239' : '#065F46',
                              }}
                            >
                              {auth.status}
                            </span>
                          </div>

                          {!isRevoked && (
                            <button
                              type="button"
                              onClick={() => setRevokingId(auth.id || '')}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: '#E11D48',
                                fontSize: 12,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <Trash2 size={13} />
                              <span>Revoke</span>
                            </button>
                          )}
                        </div>

                        <div style={{ fontSize: 12, color: '#475569' }}>
                          <strong>Purpose:</strong> {auth.purpose} • <strong>Scope:</strong> {auth.information_scope.replace(/_/g, ' ')}
                        </div>
                        <div style={{ fontSize: 11.5, color: '#64748B' }}>
                          Commenced: {auth.start_date} • Review Due: {auth.review_date}
                        </div>

                        {isRevoked && (
                          <div style={{ fontSize: 11.5, color: '#9F1239', marginTop: 4 }}>
                            <strong>Revoked:</strong> {auth.revocation_date?.split('T')[0]} • <strong>Reason:</strong> {auth.revocation_reason}
                          </div>
                        )}

                        {revokingId === auth.id && (
                          <div
                            style={{
                              marginTop: 8,
                              padding: 10,
                              background: '#FFFFFF',
                              border: '1px solid #FDA4AF',
                              borderRadius: 6,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 8,
                            }}
                          >
                            <label style={{ fontSize: 12, fontWeight: 600, color: '#9F1239' }}>
                              Document Reason for Revocation:
                            </label>
                            <input
                              type="text"
                              value={revokeReason}
                              onChange={(e) => setRevokeReason(e.target.value)}
                              placeholder="e.g. Participant requested change of Support Coordinator"
                              style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #CBD5E1', fontSize: 12 }}
                            />
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                onClick={() => { setRevokingId(null); setRevokeReason(''); }}
                                style={{ padding: '4px 10px', fontSize: 11, border: 'none', background: '#F1F5F9', borderRadius: 4, cursor: 'pointer' }}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRevokeAuthority(auth.id || '')}
                                style={{ padding: '4px 10px', fontSize: 11, border: 'none', background: '#E11D48', color: '#FFF', borderRadius: 4, cursor: 'pointer' }}
                              >
                                Confirm Revocation
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Grant Authority Modal */}
      {showNewAuthority && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 12,
              padding: 24,
              width: 480,
              maxWidth: '90%',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Grant Information Sharing Authority</h3>
              <button
                type="button"
                onClick={() => setShowNewAuthority(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAuthority} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Recipient Name</label>
                <input
                  type="text"
                  required
                  value={authRecipientName}
                  onChange={(e) => setAuthRecipientName(e.target.value)}
                  placeholder="e.g. John Smith"
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Recipient Organisation</label>
                <input
                  type="text"
                  required
                  value={authRecipientOrg}
                  onChange={(e) => setAuthRecipientOrg(e.target.value)}
                  placeholder="e.g. North Coast Plan Management"
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>Role</label>
                  <select
                    value={authRecipientRole}
                    onChange={(e) => setAuthRecipientRole(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5 }}
                  >
                    <option value="Plan Manager">Plan Manager</option>
                    <option value="Support Coordinator">Support Coordinator</option>
                    <option value="Allied Health Practitioner">Allied Health</option>
                    <option value="NDIS Quality Commission / Auditor">Auditor</option>
                    <option value="Medical Practitioner">Medical Practitioner</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>Information Scope</label>
                  <select
                    value={authScope}
                    onChange={(e: any) => setAuthScope(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5 }}
                  >
                    <option value="financial_invoicing_only">Financial Invoicing Only</option>
                    <option value="service_schedules_and_delivery">Schedules &amp; Delivery</option>
                    <option value="support_plans_and_clinical_reports">Support Plans &amp; Reports</option>
                    <option value="all_operational_records">All Operational Records</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Purpose of Disclosure</label>
                <input
                  type="text"
                  required
                  value={authPurpose}
                  onChange={(e) => setAuthPurpose(e.target.value)}
                  placeholder="e.g. Processing NDIS invoice payments and plan budget tracking"
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Review / Expiry Date</label>
                <input
                  type="date"
                  required
                  value={authReviewDate}
                  onChange={(e) => setAuthReviewDate(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowNewAuthority(false)}
                  className="btn btn-surface"
                  style={{ padding: '6px 14px', fontSize: 12 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '6px 14px', fontSize: 12 }}
                >
                  Grant Authority
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </FormDrawer>
  );
}
