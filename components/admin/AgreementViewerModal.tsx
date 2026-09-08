'use client';

import useDialogFocus from '@/components/ui/useDialogFocus';

import React, { useRef } from 'react';
import { X, Printer, Shield, CheckCircle2, FileText, Download, Clock, GitBranch } from 'lucide-react';

interface AgreementViewerModalProps {
  agreement: any;
  onClose: () => void;
  onCreateVariation?: (agreement: any) => void;
}

export default function AgreementViewerModal({ agreement, onClose, onCreateVariation }: AgreementViewerModalProps) {
  const dialogRef = useDialogFocus(onClose);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const isExecuted = agreement.status === 'active' || agreement.status === 'fully_signed';
  const qData = agreement.questionnaire_data || {};
  const clauses = agreement.compiled_clauses || {};

  return (
    <div className="crmModalOverlay" onClick={onClose}>
      <div className="crmModalBox" ref={dialogRef} role="dialog" aria-modal="true" aria-label="Agreement details" tabIndex={-1} style={{ maxWidth: 840, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
        {/* Header Bar */}
        <div className="crmModalHeader" style={{ flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              fontFamily: 'monospace',
              fontWeight: 600,
              background: '#E0F2FE',
              color: 'var(--oc-info)',
              padding: '3px 8px',
              borderRadius: 6,
              fontSize: '0.85rem'
            }}>
              {agreement.agreement_reference}
            </span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, color: 'var(--oc-text)' }}>
                  {agreement.title}
                </h3>
                <span style={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  background: isExecuted ? '#ECFDF5' : 'var(--oc-warning-soft)',
                  color: isExecuted ? '#059669' : '#B45309',
                  padding: '2px 8px',
                  borderRadius: 20
                }}>
                  v{agreement.version_number} • {agreement.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={handlePrint}
              className="crmSecondaryBtn"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: '0.82rem' }}
              title="Print Document"
            >
              <Printer size={15} />
              <span>Print / PDF</span>
            </button>

            {onCreateVariation && isExecuted && (
              <button
                onClick={() => onCreateVariation(agreement)}
                className="crmActionBtnPrimary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', fontSize: '0.82rem' }}
                title="Create a new version that supersedes this agreement"
              >
                <GitBranch size={15} />
                <span>Create Variation (v{agreement.version_number + 1})</span>
              </button>
            )}

            <button type="button" aria-label="Close dialog" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--oc-muted)', marginLeft: 6 }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Document Content */}
        <div ref={printRef} style={{ padding: 32, overflowY: 'auto', flex: 1, background: 'var(--oc-surface)', color: 'var(--oc-text)', lineHeight: 1.6 }}>
          {/* Document Header */}
          <div style={{ borderBottom: '2px solid var(--oc-border)', paddingBottom: 20, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#162E56', letterSpacing: '-0.01em' }}>
                OPUS CARE SUPPORT SERVICES
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--oc-muted)' }}>
                ABN: 89 654 321 098 • Suite 2, 18 Coldstream St, Yamba NSW 2464<br />
                Phone: 1300 895 210 • Email: support@opuscare.com.au
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8125rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--oc-muted)' }}>Agreement Ref</div>
              <div style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '1.1rem', color: 'var(--oc-info)' }}>
                {agreement.agreement_reference}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--oc-muted)' }}>Version: {agreement.version_number}.0 ({agreement.template_version})</div>
            </div>
          </div>

          {/* Key Parties & Overview */}
          <div style={{ background: 'var(--oc-background)', border: '1px solid var(--oc-border)', borderRadius: 10, padding: 18, marginBottom: 24 }}>
            <div className="ocFormGrid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--oc-muted)' }}>Participant / Recipient</span>
                <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--oc-text)' }}>{qData.participant_name || qData.worker_name || 'Recipient Name'}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--oc-secondary)' }}>
                  NDIS #: {qData.ndis_number || 'N/A'} • {qData.funding_type || 'Standard Terms'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--oc-muted)' }}>Term & Value</span>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--oc-text)' }}>
                  Commencement: {agreement.commencement_date}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#059669', fontWeight: 600 }}>
                  Estimated Plan Commitment: ${Number(agreement.estimated_budget || 0).toLocaleString('en-AU', { minimumFractionDigits: 2 })} AUD
                </div>
              </div>
            </div>
          </div>

          {/* Schedule of Supports Table (if participant agreement) */}
          {clauses.service_schedule && clauses.service_schedule.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#162E56', marginBottom: 10, borderBottom: '1px solid #EEF2F6', paddingBottom: 6 }}>
                Schedule of Supports & Mutually Agreed Pricing
              </h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--oc-subtle)', borderBottom: '1px solid var(--oc-border)', color: 'var(--oc-secondary)' }}>
                    <th style={{ padding: '8px 10px' }}>Item Code</th>
                    <th style={{ padding: '8px 10px' }}>Support Description</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>Hours / Wk</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Agreed Rate</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Weekly Total</th>
                  </tr>
                </thead>
                <tbody>
                  {clauses.service_schedule.map((item: any, idx: number) => {
                    const wkTotal = (Number(item.hours_pw) || 0) * (Number(item.agreed_rate) || 0);
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--oc-border)' }}>
                        <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--oc-info)' }}>{item.item_code}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 600 }}>{item.description}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>{item.hours_pw} hrs</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right' }}>${Number(item.agreed_rate).toFixed(2)}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, color: '#059669' }}>${wkTotal.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p style={{ fontSize: '0.8125rem', color: 'var(--oc-muted)', marginTop: 6, fontStyle: 'italic' }}>
                * All rates strictly adhere to the current applicable NDIS Support Catalogue and are mutually agreed between the parties. Any future rate change requires mutual written variation.
              </p>
            </div>
          )}

          {/* Legal Clauses Section */}
          <div style={{ marginBottom: 28, fontSize: '0.88rem', color: 'var(--oc-secondary)' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#162E56', marginBottom: 12, borderBottom: '1px solid #EEF2F6', paddingBottom: 6 }}>
              Key Operational & Legal Terms
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <strong style={{ color: 'var(--oc-text)' }}>1. Provider Responsibilities:</strong>
                <p style={{ margin: '4px 0 0' }}>
                  Opus Care will deliver supports in accordance with the NDIS Practice Standards, respecting the participant&apos;s autonomy, choice, and dignity of risk. We maintain appropriate worker clearances and worker compliance at all times.
                </p>
              </div>

              <div>
                <strong style={{ color: 'var(--oc-text)' }}>2. Participant Responsibilities & Safe Workplace:</strong>
                <p style={{ margin: '4px 0 0' }}>
                  The participant agrees to treat support workers with respect and maintain a safe home environment complying with NSW Work Health and Safety laws during support visits.
                </p>
              </div>

              <div>
                <strong style={{ color: 'var(--oc-text)' }}>3. Cancellation Policy:</strong>
                <p style={{ margin: '4px 0 0' }}>
                  In accordance with Opus Care operating policy and applicable NDIS Pricing Arrangements, cancellations made with less than the required short-notice cancellation window will be charged at 100% of the scheduled support fee. Opus Care will always endeavor to find an alternative time or deliver alternative non-face-to-face support where practical.
                </p>
              </div>

              <div>
                <strong style={{ color: 'var(--oc-text)' }}>4. Feedback, Complaints & Safeguarding:</strong>
                <p style={{ margin: '4px 0 0' }}>
                  If you have feedback or complaints, you can contact Opus Care Management directly on 1300 895 210 or via email. You also have the right to contact the NDIS Quality and Safeguards Commission at any time on 1800 035 544.
                </p>
              </div>

              {qData.transport_included && (
                <div>
                  <strong style={{ color: 'var(--oc-text)' }}>5. Transport & Vehicle Travel:</strong>
                  <p style={{ margin: '4px 0 0' }}>
                    Where transport support is provided in a support worker&apos;s vehicle, the vehicle is comprehensively insured and registered in NSW. Activity travel is billed in accordance with the agreed Schedule of Supports.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Signatures Block */}
          <div style={{ borderTop: '2px solid var(--oc-border)', paddingTop: 20, marginTop: 24 }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#162E56', marginBottom: 14 }}>
              Execution & Signature Record
            </h4>

            <div className="ocFormGrid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Participant / Worker Signature Box */}
              <div style={{ border: '1px solid var(--oc-border)', borderRadius: 8, padding: 14, background: 'var(--oc-background)' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--oc-muted)', textTransform: 'uppercase' }}>Signed by Participant / Nominee</div>
                <div style={{ minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px dashed var(--oc-border)', margin: '10px 0' }}>
                  {agreement.signatures?.some((s: any) => ['participant', 'guardian', 'worker', 'contractor'].includes(s.party_role)) ? (
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontFamily: 'cursive', fontSize: '1.3rem', color: '#162E56' }}>
                        {agreement.signatures.find((s: any) => ['participant', 'guardian', 'worker', 'contractor'].includes(s.party_role))?.signer_name}
                      </span>
                      <div style={{ fontSize: '0.8125rem', color: '#059669', fontWeight: 600 }}>✓ Verified Digital Signature</div>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.8125rem', color: 'var(--oc-muted)', fontStyle: 'italic' }}>Awaiting Signature</span>
                  )}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--oc-secondary)' }}>
                  Name: <strong>{qData.participant_name || qData.worker_name || 'Recipient'}</strong><br />
                  Date: {agreement.executed_at ? new Date(agreement.executed_at).toLocaleDateString('en-AU') : 'Pending'}
                </div>
              </div>

              {/* Provider Signature Box */}
              <div style={{ border: '1px solid var(--oc-border)', borderRadius: 8, padding: 14, background: 'var(--oc-background)' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--oc-muted)', textTransform: 'uppercase' }}>Signed for Opus Care Support Services</div>
                <div style={{ minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px dashed var(--oc-border)', margin: '10px 0' }}>
                  {agreement.signatures?.some((s: any) => s.party_role === 'provider_rep') ? (
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontFamily: 'cursive', fontSize: '1.3rem', color: '#162E56' }}>
                        Director of Operations
                      </span>
                      <div style={{ fontSize: '0.8125rem', color: '#059669', fontWeight: 600 }}>✓ Verified Provider Signature</div>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.8125rem', color: 'var(--oc-muted)', fontStyle: 'italic' }}>Awaiting Counter-Signature</span>
                  )}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--oc-secondary)' }}>
                  Name: <strong>Director of Operations</strong> (Managing Director)<br />
                  Date: {agreement.executed_at ? new Date(agreement.executed_at).toLocaleDateString('en-AU') : 'Pending'}
                </div>
              </div>
            </div>

            {/* Cryptographic SHA-256 Hash Footer */}
            {agreement.executed_hash_sha256 && (
              <div style={{ marginTop: 20, background: 'var(--oc-subtle)', padding: '10px 14px', borderRadius: 8, fontSize: '0.8125rem', color: 'var(--oc-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Shield size={14} style={{ color: '#059669' }} />
                  <span><strong>Signed and locked</strong></span>
                </div>
                <span style={{ color: '#059669', fontWeight: 600 }}>Signed copy retained</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
