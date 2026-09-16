'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  X,
  Shield,
  Clock,
  CheckCircle,
  GitBranch,
  PenTool,
  Send,
  Mail,
  AlertCircle,
  RefreshCw,
  XCircle,
  Copy,
} from 'lucide-react';
import FormDrawer from './forms/FormDrawer';

interface AgreementViewerModalProps {
  agreement: any;
  onClose: () => void;
  onCreateVariation?: (agreement: any) => void;
  onResumeDraft?: (agreement: any) => void;
  onAgreementUpdated?: (updatedAgreement: any) => void;
}

function formatClauseLabel(value: string) {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function renderClauseContent(value: unknown, path = 'clause'): React.ReactNode {
  if (value == null || value === '') return null;

  if (typeof value === 'string' || typeof value === 'number') {
    return <p key={path}>{String(value)}</p>;
  }

  if (typeof value === 'boolean') {
    return <p key={path}>{value ? 'Yes' : 'No'}</p>;
  }

  if (Array.isArray(value)) {
    const simpleItems = value.every((item) => ['string', 'number'].includes(typeof item));
    if (simpleItems) {
      return (
        <ul key={path}>
          {value.map((item, index) => <li key={`${path}-${index}`}>{String(item)}</li>)}
        </ul>
      );
    }
    return value.map((item, index) => (
      <div className="agreementClauseGroup" key={`${path}-${index}`}>
        {renderClauseContent(item, `${path}-${index}`)}
      </div>
    ));
  }

  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).map(([key, child]) => (
      <section className="agreementClauseSection" key={`${path}-${key}`}>
        <h4>{formatClauseLabel(key)}</h4>
        {renderClauseContent(child, `${path}-${key}`)}
      </section>
    ));
  }

  return null;
}

export default function AgreementViewerModal({
  agreement,
  onClose,
  onCreateVariation,
  onResumeDraft,
  onAgreementUpdated,
}: AgreementViewerModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const isExecuted = agreement.status === 'active' || agreement.status === 'fully_signed';
  const qData = agreement.questionnaire_data || {};
  const clauses = agreement.compiled_clauses || {};

  // Invitations state
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);

  // Send form state
  const [recipientEmail, setRecipientEmail] = useState(
    qData.worker_email || qData.participant_email || ''
  );
  const [recipientName, setRecipientName] = useState(
    qData.worker_name || qData.participant_name || ''
  );
  const [signAsProvider, setSignAsProvider] = useState(true);
  const [providerSignerName, setProviderSignerName] = useState('Naresh Admin');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [simulatedUrl, setSimulatedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Provider Canvas
  const providerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Load invitations
  const loadInvitations = async () => {
    if (!agreement?.id) return;
    setLoadingInvitations(true);
    try {
      const res = await fetch(`/api/crm/agreements/${agreement.id}/invitations`);
      const data = await res.json();
      if (res.ok) {
        setInvitations(data.invitations || []);
      }
    } catch {
      // Silently catch
    } finally {
      setLoadingInvitations(false);
    }
  };

  useEffect(() => {
    loadInvitations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agreement?.id]);

  const activeInvitation = invitations.find(
    (i) => i.status === 'pending' || i.status === 'viewed'
  );

  // Provider canvas handling
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setHasDrawn(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = providerCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.beginPath();
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing && e.type !== 'mousedown' && e.type !== 'touchstart') return;
    const canvas = providerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleSendInvitation = async () => {
    if (!recipientEmail || !recipientEmail.includes('@')) {
      setSendError('Please enter a valid recipient email address.');
      return;
    }
    if (signAsProvider && (!hasDrawn || !providerCanvasRef.current)) {
      setSendError('Please provide your provider signature on the pad before sending.');
      return;
    }

    setSending(true);
    setSendError(null);
    setSimulatedUrl(null);

    try {
      const providerSigData = signAsProvider && providerCanvasRef.current
        ? providerCanvasRef.current.toDataURL('image/png')
        : null;

      const res = await fetch(`/api/crm/agreements/${agreement.id}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          party_role: agreement.owner_type === 'staff' ? 'worker' : 'participant',
          recipient_name: recipientName.trim() || 'Recipient',
          recipient_email: recipientEmail.trim(),
          sign_as_provider: signAsProvider,
          provider_signer_name: providerSignerName,
          provider_signature_data: providerSigData,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSendError(data.message || 'Failed to issue signing invitation.');
        setSending(false);
        loadInvitations();
        return;
      }

      if (data.signing_url_preview) {
        setSimulatedUrl(data.signing_url_preview);
      } else {
        setShowSendModal(false);
      }

      loadInvitations();
      if (onAgreementUpdated) {
        onAgreementUpdated({ ...agreement, status: 'sent_for_signature' });
      }
      setSending(false);
    } catch (err: any) {
      setSendError(err?.message || 'Server error occurred.');
      setSending(false);
    }
  };

  const handleRevokeInvitation = async (invId: string) => {
    if (!confirm('Are you sure you want to revoke this signing invitation? The link will immediately be deactivated.')) {
      return;
    }

    try {
      const res = await fetch(`/api/crm/agreements/${agreement.id}/invitations?invitation_id=${invId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        loadInvitations();
        if (onAgreementUpdated) {
          onAgreementUpdated({ ...agreement, status: 'draft' });
        }
      }
    } catch {
      alert('Failed to revoke invitation.');
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const signatures = agreement.signatures || [];
  const providerSig = signatures.find((s: any) => s.party_role === 'provider_rep');
  const recipientSig = signatures.find((s: any) => ['worker', 'participant', 'guardian'].includes(s.party_role));

  return (
    <FormDrawer isOpen onClose={onClose} wide fullPage>
      {/* Header Bar */}
      <div className="drawer-header">
        <div className="header-title-block">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span
              style={{
                fontFamily: 'monospace',
                fontWeight: 700,
                background: 'var(--brand-subtle)',
                color: 'var(--brand-primary)',
                padding: '3px 8px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
              }}
            >
              {agreement.agreement_reference}
            </span>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{agreement.title}</h2>
            <span
              className={`pill-semantic ${isExecuted ? 'pill-mint' : 'pill-amber'}`}
            >
              v{agreement.version_number} • {agreement.status.toUpperCase().replace(/_/g, ' ')}
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--text-muted)' }}>
            Commenced: {agreement.commencement_date || 'Not set'} • Review: {agreement.review_date || '12 Months'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!isExecuted && (
            <button
              type="button"
              onClick={() => setShowSendModal(true)}
              className="btn btn-primary"
              style={{ padding: '6px 14px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Mail size={14} />
              <span>{activeInvitation ? 'Manage Invitation' : 'Send for Signature'}</span>
            </button>
          )}

          {onResumeDraft && agreement.status === 'draft' && (
            <button
              type="button"
              onClick={() => onResumeDraft(agreement)}
              className="btn btn-surface"
              style={{ padding: '6px 12px', fontSize: 12 }}
            >
              <PenTool size={14} />
              <span>Internal Sign</span>
            </button>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="btn btn-surface"
            style={{ padding: '6px 12px', fontSize: 12 }}
            title="Print Document"
          >
            <Printer size={14} />
            <span>Print / PDF</span>
          </button>

          {onCreateVariation && isExecuted && (
            <button
              type="button"
              onClick={() => onCreateVariation(agreement)}
              className="btn btn-surface"
              style={{ padding: '6px 12px', fontSize: 12 }}
              title="Create a variation that supersedes this agreement"
            >
              <GitBranch size={14} />
              <span>Variation (v{agreement.version_number + 1})</span>
            </button>
          )}

          <button
            type="button"
            className="btn-close-icon"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="drawer-body" ref={printRef}>
        {/* Active Invitation Banner */}
        {activeInvitation && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: activeInvitation.delivery_status === 'failed' ? '#FEF2F2' : '#EFF6FF',
              border: `1px solid ${activeInvitation.delivery_status === 'failed' ? '#FECACA' : '#BFDBFE'}`,
              borderRadius: 'var(--radius-sm)',
              padding: '12px 18px',
              marginBottom: 16,
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {activeInvitation.delivery_status === 'failed' ? (
                <AlertCircle size={18} color="#DC2626" />
              ) : (
                <Send size={18} color="#0284C7" />
              )}
              <div>
                <strong style={{ fontSize: 13, color: activeInvitation.delivery_status === 'failed' ? '#991B1B' : '#1E40AF' }}>
                  {activeInvitation.delivery_status === 'failed'
                    ? `Email Delivery Failed (${activeInvitation.delivery_error || 'Dispatch rejected'})`
                    : `Active Signing Invitation Sent to ${activeInvitation.recipient_email}`}
                </strong>
                <div style={{ fontSize: 11.5, color: '#475569', marginTop: 2 }}>
                  Status: <strong>{activeInvitation.status.toUpperCase()}</strong>
                  {activeInvitation.viewed_at && ` · First viewed: ${new Date(activeInvitation.viewed_at).toLocaleTimeString()}`}
                  {` · Expires: ${new Date(activeInvitation.expires_at).toLocaleDateString()}`}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {activeInvitation.delivery_status === 'failed' && (
                <button
                  type="button"
                  onClick={() => setShowSendModal(true)}
                  style={{ background: '#DC2626', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  Retry Send
                </button>
              )}
              <button
                type="button"
                onClick={() => handleRevokeInvitation(activeInvitation.id)}
                style={{ background: '#fff', border: '1px solid #CBD5E1', color: '#64748B', padding: '5px 12px', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}
              >
                Revoke Link
              </button>
            </div>
          </div>
        )}

        {/* Send Modal Overlay */}
        {showSendModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.6)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
            }}
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: 8,
                maxWidth: 580,
                width: '100%',
                padding: 28,
                border: '1px solid var(--border)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid #f1f5f9', paddingBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Mail size={18} color="#0284c7" />
                  <h3 style={{ margin: 0, fontSize: 17, color: '#0f172a' }}>Send Agreement for External Signature</h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowSendModal(false);
                    setSendError(null);
                    setSimulatedUrl(null);
                  }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                >
                  <X size={18} />
                </button>
              </div>

              {sendError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 14px', borderRadius: 6, fontSize: 13, marginBottom: 16 }}>
                  {sendError}
                </div>
              )}

              {simulatedUrl ? (
                <div>
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '14px 18px', borderRadius: 6, marginBottom: 18 }}>
                    <strong>Development Simulation Active:</strong>
                    <p style={{ margin: '4px 0 10px', fontSize: 12.5 }}>
                      Invitation generated successfully. You can test the signing flow directly:
                    </p>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        type="text"
                        readOnly
                        value={simulatedUrl}
                        style={{ flex: 1, padding: '8px 10px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 4, background: '#fff' }}
                      />
                      <button
                        type="button"
                        onClick={() => handleCopyLink(simulatedUrl)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#0284c7', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}
                      >
                        <Copy size={13} />
                        <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                      </button>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSendModal(false);
                        setSimulatedUrl(null);
                      }}
                      className="btn btn-primary"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4, textTransform: 'uppercase' }}>
                      Recipient Full Name *
                    </label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="e.g. Jane Doe"
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4, textTransform: 'uppercase' }}>
                      Recipient Email Address *
                    </label>
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="e.g. worker@example.com"
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* Provider pre-signing toggle */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: 14, marginBottom: 18 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                      <input
                        type="checkbox"
                        checked={signAsProvider}
                        onChange={(e) => setSignAsProvider(e.target.checked)}
                        style={{ width: 16, height: 16 }}
                      />
                      <span>Sign as Provider Now (Formal Pre-Signed Offer)</span>
                    </label>
                    <p style={{ margin: '4px 0 0 26px', fontSize: 11.5, color: '#64748b' }}>
                      Recommended for employment agreements. When the recipient signs, the contract executes immediately.
                    </p>

                    {signAsProvider && (
                      <div style={{ marginTop: 12, paddingLeft: 26 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Provider Signature Pad</span>
                          {hasDrawn && (
                            <button
                              type="button"
                              onClick={() => {
                                const canvas = providerCanvasRef.current;
                                const ctx = canvas?.getContext('2d');
                                ctx?.clearRect(0, 0, canvas?.width || 400, canvas?.height || 100);
                                setHasDrawn(false);
                              }}
                              style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: 11, cursor: 'pointer' }}
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        <canvas
                          ref={providerCanvasRef}
                          width={480}
                          height={90}
                          onMouseDown={startDrawing}
                          onMouseUp={stopDrawing}
                          onMouseMove={draw}
                          onMouseLeave={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchEnd={stopDrawing}
                          onTouchMove={draw}
                          style={{ border: '1px dashed #94a3b8', borderRadius: 4, background: '#fff', width: '100%', height: 90, cursor: 'crosshair', touchAction: 'none' }}
                        />
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => setShowSendModal(false)}
                      className="btn btn-surface"
                      disabled={sending}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSendInvitation}
                      className="btn btn-primary"
                      disabled={sending}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      {sending ? <RefreshCw size={14} className="spin" /> : <Send size={14} />}
                      <span>{sending ? 'Dispatching...' : 'Dispatch Invitation'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recipient & Financial Summary Card */}
        <div
          style={{
            background: 'var(--bg-canvas)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            marginBottom: 20,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
          }}
        >
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Recipient / Party
            </span>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-heading)', marginTop: 2 }}>
              {qData.participant_name || qData.worker_name || 'Not Recorded'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Type: {agreement.owner_type === 'participant' ? 'NDIS Participant' : 'Care / Support Worker'}
            </div>
          </div>

          <div>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Template Source
            </span>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-heading)', marginTop: 2 }}>
              {agreement.template?.title || 'Controlled Agreement Template'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Basis: {agreement.template?.source_basis || 'Operational Controlled Template'}
            </div>
          </div>

          <div>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Estimated Financial Value
            </span>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--status-mint)', marginTop: 2 }}>
              {agreement.owner_type === 'participant'
                ? `$${Number(agreement.estimated_budget || 0).toLocaleString('en-AU', { minimumFractionDigits: 2 })} AUD`
                : `$${Number(qData.hourly_rate || 0).toFixed(2)} AUD / hr`}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Commencement: {agreement.commencement_date || 'Immediate'}
            </div>
          </div>
        </div>

        <article className="agreementDocumentPage">
          <header className="agreementDocumentHeader">
            <div>
              <span>OPUS CARE SUPPORT SERVICES</span>
              <h1>{agreement.title}</h1>
              <p>{agreement.template?.template_code || 'CONTROLLED AGREEMENT'} · Version {agreement.template_version || agreement.version_number}</p>
            </div>
            <div className="agreementDocumentReference">
              <span>Agreement reference</span>
              <strong>{agreement.agreement_reference}</strong>
              <span>Status</span>
              <strong>{String(agreement.status || 'draft').replaceAll('_', ' ')}</strong>
            </div>
          </header>

          <section className="agreementDocumentSection">
            <h2>Parties and commencement</h2>
            <dl className="agreementParticularsGrid">
              <div><dt>Provider</dt><dd>Opus Care Support Services</dd></div>
              <div><dt>{agreement.owner_type === 'participant' ? 'Participant' : 'Worker'}</dt><dd>{qData.participant_name || qData.worker_name || 'Not recorded'}</dd></div>
              <div><dt>Commencement date</dt><dd>{agreement.commencement_date || 'Not recorded'}</dd></div>
              <div><dt>Review or end date</dt><dd>{agreement.review_date || agreement.expiry_date || 'Not recorded'}</dd></div>
            </dl>
          </section>

          {agreement.owner_type !== 'participant' && (
            <section className="agreementDocumentSection">
              <h2>Employment particulars</h2>
              <dl className="agreementParticularsGrid">
                <div><dt>Classification</dt><dd>{qData.worker_classification || clauses.classification || 'Not recorded'}</dd></div>
                <div><dt>Employment basis</dt><dd>{String(qData.worker_basis || clauses.basis || 'Not recorded').replaceAll('_', ' ')}</dd></div>
                <div><dt>Ordinary hourly rate</dt><dd>${Number(qData.hourly_rate || clauses.hourly_rate || 0).toFixed(2)} AUD</dd></div>
                <div><dt>Agreed weekly hours</dt><dd>{Number(qData.agreed_weekly_hours || 0)} hours</dd></div>
                <div><dt>Superannuation</dt><dd>{Number(qData.super_rate_pct || clauses.super_pct || 0).toFixed(2)}%</dd></div>
                <div><dt>Applicable instrument</dt><dd>{agreement.template?.source_basis || 'Template source not recorded'}</dd></div>
              </dl>
            </section>
          )}

          <section className="agreementDocumentSection agreementTermsSection">
            <h2>Approved terms and conditions</h2>
            {agreement.template?.clause_schema && Object.keys(agreement.template.clause_schema).length > 0 ? (
              renderClauseContent(agreement.template.clause_schema)
            ) : (
              <div className="agreementMissingClauses">
                This template record does not contain approved clause text. Add legally reviewed clauses to the document template before sending it for signature.
              </div>
            )}
          </section>
        </article>

        {/* Schedule of Supports (For Participants) */}
        {clauses.service_schedule && Array.isArray(clauses.service_schedule) && (
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 10 }}>
              Schedule of Supports &amp; Pricing Limits
            </h3>
            <div className="crmTableWrapper">
              <table className="crmTable">
                <thead>
                  <tr>
                    <th>Item Code</th>
                    <th>Support Description</th>
                    <th>Hours / Wk</th>
                    <th>Agreed Rate</th>
                    <th>Weekly Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {clauses.service_schedule.map((row: any, idx: number) => {
                    const hrs = Number(row.hours_pw || 0);
                    const rate = Number(row.agreed_rate || 0);
                    const subtotal = hrs * rate;
                    return (
                      <tr key={idx}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--brand-primary)' }}>
                          {row.item_code}
                        </td>
                        <td>{row.description}</td>
                        <td>{hrs.toFixed(1)} hrs</td>
                        <td>${rate.toFixed(2)} / hr</td>
                        <td style={{ fontWeight: 700, color: 'var(--text-heading)' }}>
                          ${subtotal.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Signatures & Execution Record */}
        <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Shield size={16} color="var(--brand-primary)" />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)' }}>
              Execution &amp; Audit Trail
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
              background: '#F8FAFC',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '14px 16px',
            }}
          >
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Recipient Execution
              </span>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-heading)', marginTop: 2 }}>
                {recipientSig ? recipientSig.signer_name : 'Pending Recipient Signature'}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                {recipientSig
                  ? `Signed via ${recipientSig.signing_method || 'electronic link'} on ${new Date(recipientSig.signed_at).toLocaleDateString()}`
                  : 'Awaiting digital signing'}
              </div>
            </div>

            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Provider Representative
              </span>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-heading)', marginTop: 2 }}>
                {providerSig ? providerSig.signer_name : 'Pending Provider Signature'}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                {providerSig
                  ? `Signed via ${providerSig.signing_method} on ${new Date(providerSig.signed_at).toLocaleDateString()}`
                  : 'Managing Director, Opus Care'}
              </div>
            </div>
          </div>

          {agreement.executed_hash_sha256 && (
            <div style={{ marginTop: 10, fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>
              Authoritative Executed Checksum (SHA-256): {agreement.executed_hash_sha256}
            </div>
          )}
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="drawer-footer">
        <button type="button" className="btn-link" onClick={onClose}>
          Close Viewer
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handlePrint}
        >
          <Printer size={15} />
          <span>Print / Export PDF</span>
        </button>
      </div>
    </FormDrawer>
  );
}
