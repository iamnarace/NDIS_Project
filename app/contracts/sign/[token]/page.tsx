'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { FileText, CheckCircle, AlertCircle, Clock, Shield, PenTool, Printer } from 'lucide-react';

export default function ContractSignPage() {
  const params = useParams();
  const rawToken = Array.isArray(params?.token) ? params.token[0] : (params?.token as string);

  const [loading, setLoading] = useState(true);
  const [documentData, setDocumentData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  // Signing form state
  const [signerName, setSignerName] = useState('');
  const [legalIntentAccepted, setLegalIntentAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [completionMeta, setCompletionMeta] = useState<{ is_fully_signed: boolean; reference: string } | null>(null);

  // Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Human interaction tracker
  const hasRecordedHumanView = useRef(false);

  // 1. Fetch document data (Read-Only: does NOT record human view)
  useEffect(() => {
    if (!rawToken) return;

    async function loadDocument() {
      try {
        const res = await fetch(`/api/contracts/sign/${rawToken}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.message || 'Unable to load contract.');
          setErrorCode(data.code || 'ERROR');
          setLoading(false);
          return;
        }

        setDocumentData(data);
        setSignerName(data.invitation?.recipient_name || '');
        setLoading(false);
      } catch (err: any) {
        setError(err?.message || 'Failed to connect to server.');
        setLoading(false);
      }
    }

    loadDocument();
  }, [rawToken]);

  // 2. Human interaction listener (pointer, keydown, scroll)
  useEffect(() => {
    if (!rawToken || hasRecordedHumanView.current) return;

    const recordHumanInteraction = () => {
      if (hasRecordedHumanView.current) return;
      hasRecordedHumanView.current = true;

      fetch(`/api/contracts/sign/${rawToken}/view`, {
        method: 'POST',
      }).catch(() => {
        // Silently catch
      });

      // Cleanup listeners once recorded
      window.removeEventListener('pointerdown', recordHumanInteraction);
      window.removeEventListener('keydown', recordHumanInteraction);
      window.removeEventListener('scroll', recordHumanInteraction);
    };

    window.addEventListener('pointerdown', recordHumanInteraction, { passive: true });
    window.addEventListener('keydown', recordHumanInteraction, { passive: true });
    window.addEventListener('scroll', recordHumanInteraction, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', recordHumanInteraction);
      window.removeEventListener('keydown', recordHumanInteraction);
      window.removeEventListener('scroll', recordHumanInteraction);
    };
  }, [rawToken]);

  // Canvas handling
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setHasDrawn(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.beginPath();
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing && e.type !== 'mousedown' && e.type !== 'touchstart') return;
    const canvas = canvasRef.current;
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

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  // Submit signature
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!legalIntentAccepted) {
      alert('Please accept the declaration to proceed.');
      return;
    }
    if (!signerName.trim()) {
      alert('Please enter your full legal name.');
      return;
    }
    if (!hasDrawn || !canvasRef.current) {
      alert('Please provide your digital signature on the signature pad.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const sigData = canvasRef.current.toDataURL('image/png');
      const res = await fetch(`/api/contracts/sign/${rawToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signer_name: signerName.trim(),
          signer_title: documentData?.invitation?.party_role === 'worker' ? 'Support Worker / Employee' : 'Participant / Client',
          signature_image_data: sigData,
          legal_intent_accepted: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Failed to submit signature.');
        setSubmitting(false);
        return;
      }

      setCompleted(true);
      setCompletionMeta({
        is_fully_signed: data.is_fully_signed,
        reference: data.agreement_reference,
      });
      setSubmitting(false);
    } catch (err: any) {
      setError(err?.message || 'Connection error. Please try again.');
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          <Clock size={36} style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 12px', color: '#0284c7' }} />
          <p style={{ margin: 0, fontWeight: 600 }}>Loading secure agreement workspace...</p>
        </div>
      </div>
    );
  }

  if (error && !documentData) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: 20, fontFamily: 'sans-serif' }}>
        <div style={{ maxWidth: 480, background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 32, textAlign: 'center' }}>
          <AlertCircle size={44} color="#dc2626" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: 20, color: '#0f172a', margin: '0 0 10px' }}>
            {errorCode === 'ALREADY_SIGNED' ? 'Agreement Already Signed' : errorCode === 'EXPIRED' ? 'Signing Link Expired' : 'Agreement Unavailable'}
          </h2>
          <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6, margin: '0 0 20px' }}>{error}</p>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>
            Need assistance? Contact <a href="mailto:support@opuscare.com.au" style={{ color: '#0284c7' }}>support@opuscare.com.au</a>.
          </div>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: 20, fontFamily: 'sans-serif' }}>
        <div style={{ maxWidth: 540, width: '100%', background: '#ffffff', border: '1px solid #bbf7d0', borderRadius: 8, padding: 36, textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          <CheckCircle size={56} color="#059669" style={{ margin: '0 auto 16px' }} />
          <h1 style={{ fontSize: 24, color: '#0f172a', margin: '0 0 8px' }}>Agreement Successfully Signed</h1>
          <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.6, margin: '0 0 24px' }}>
            Thank you, <strong>{signerName}</strong>. Your electronic signature has been permanently sealed and recorded.
          </p>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '16px 20px', textAlign: 'left', marginBottom: 28 }}>
            <div style={{ fontSize: 11, color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>Execution Record</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#14532d', marginTop: 4 }}>Reference: {completionMeta?.reference}</div>
            <div style={{ fontSize: 12, color: '#166534', marginTop: 4 }}>
              Status: <strong>{completionMeta?.is_fully_signed ? 'Fully Executed & Active' : 'Partially Signed (Awaiting Provider)'}</strong>
            </div>
            <div style={{ fontSize: 11, color: '#15803d', marginTop: 4 }}>Timestamp: {new Date().toISOString()}</div>
          </div>
          <button
            type="button"
            onClick={handlePrint}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#0284c7', color: '#ffffff', border: 'none', padding: '12px 24px', borderRadius: 6, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
          >
            <Printer size={16} />
            <span>Print or Save Confirmation</span>
          </button>
        </div>
      </div>
    );
  }

  const agr = documentData?.agreement || {};
  const qData = agr.questionnaire_data || {};
  const clauses = agr.compiled_clauses || {};
  const template = agr.template || {};
  const providerLegalName = documentData?.org?.legalName || 'Opus Care Support Services';
  const providerTradingName = documentData?.org?.tradingName || 'Opus Care Support Services';
  const providerPartyName = providerLegalName === providerTradingName
    ? providerLegalName
    : `${providerLegalName}, trading as ${providerTradingName}`;

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', padding: '32px 16px', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif' }}>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        {/* Top Trust Header */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 6, background: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Shield size={20} />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Opus Care Support Services
              </div>
              <div style={{ fontSize: 13, color: '#64748b' }}>Secure Document Review &amp; Execution</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Reference</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{agr.agreement_reference}</div>
          </div>
        </header>

        {/* Contract Document Card */}
        <article style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '48px 56px', boxShadow: '0 8px 30px rgba(0,0,0,0.04)', marginBottom: 28 }}>
          <div style={{ borderBottom: '3px solid #0284c7', paddingBottom: 20, marginBottom: 28, display: 'flex', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <span style={{ color: '#0284c7', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Opus Care Support Services</span>
              <h1 style={{ fontSize: 26, margin: '8px 0 6px', color: '#0f172a' }}>{agr.title}</h1>
              <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                {template.template_code || 'CONTROLLED AGREEMENT'} · {agr.owner_type === 'participant' ? 'Service Agreement' : 'Employment Agreement'}
              </p>
            </div>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px 18px', borderRadius: 6, minWidth: 200 }}>
              <span style={{ display: 'block', fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Agreement Reference</span>
              <strong style={{ display: 'block', fontSize: 13, color: '#0f172a', margin: '2px 0 6px' }}>{agr.agreement_reference}</strong>
              <span style={{ display: 'block', fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Status</span>
              <strong style={{ display: 'block', fontSize: 12, color: '#d97706' }}>AWAITING SIGNATURE</strong>
            </div>
          </div>

          {/* Section: Parties */}
          <section style={{ padding: '20px 0', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ fontSize: 16, margin: '0 0 16px', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Parties &amp; Commencement</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
              <div><dt style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Provider</dt><dd style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 600 }}>{providerPartyName} (ABN {documentData?.org?.abn || '41 267 197 576'})</dd></div>
              <div><dt style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>{agr.owner_type === 'participant' ? 'Participant' : 'Worker / Employee'}</dt><dd style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 600 }}>{qData.participant_name || qData.worker_name || documentData?.invitation?.recipient_name}</dd></div>
              <div><dt style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Commencement Date</dt><dd style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 600 }}>{agr.commencement_date || 'Immediate'}</dd></div>
              <div><dt style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Review / Expiry Date</dt><dd style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 600 }}>{agr.review_date || agr.expiry_date || '12 Months'}</dd></div>
            </div>
          </section>

          {/* Section: Employment Particulars (If Worker) */}
          {agr.owner_type !== 'participant' && (
            <section style={{ padding: '20px 0', borderBottom: '1px solid #f1f5f9' }}>
              <h2 style={{ fontSize: 16, margin: '0 0 16px', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Employment Particulars</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
                <div><dt style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Classification</dt><dd style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 600 }}>{qData.worker_classification || clauses.classification || 'Support Worker'}</dd></div>
                <div><dt style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Employment Basis</dt><dd style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 600 }}>{String(qData.worker_basis || clauses.basis || 'Permanent').replace(/_/g, ' ')}</dd></div>
                <div><dt style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Ordinary Hourly Rate</dt><dd style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 600 }}>${Number(qData.hourly_rate || clauses.hourly_rate || 0).toFixed(2)} AUD</dd></div>
                <div><dt style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Agreed Weekly Hours</dt><dd style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 600 }}>{Number(qData.agreed_weekly_hours || 0)} hours / week</dd></div>
                <div><dt style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Superannuation</dt><dd style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 600 }}>{Number(qData.super_rate_pct || clauses.super_pct || 12.0).toFixed(2)}%</dd></div>
                <div><dt style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Applicable Instrument</dt><dd style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 600 }}>{template.source_basis || 'SCHADS Award'}</dd></div>
              </div>
            </section>
          )}

          {/* Section: Terms & Conditions */}
          <section style={{ padding: '20px 0' }}>
            <h2 style={{ fontSize: 16, margin: '0 0 16px', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Terms &amp; Conditions</h2>
            {template.clause_schema && Object.keys(template.clause_schema).length > 0 ? (
              <div style={{ color: '#334155', fontSize: 13, lineHeight: 1.65 }}>
                {Object.entries(template.clause_schema).map(([key, val]: any) => (
                  <div key={key} style={{ marginTop: 16 }}>
                    <h4 style={{ margin: '0 0 6px', fontSize: 14, color: '#0f172a' }}>{key.replace(/[_-]+/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</h4>
                    {typeof val === 'string' && <p style={{ margin: '4px 0' }}>{val}</p>}
                    {Array.isArray(val) && (
                      <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
                        {val.map((item, idx) => <li key={idx}>{String(item)}</li>)}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#64748b', fontSize: 13 }}>Standard approved service terms apply.</p>
            )}
          </section>
        </article>

        {/* Recipient Signing Box */}
        <form onSubmit={handleSubmit} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 36, boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, borderBottom: '1px solid #f1f5f9', paddingBottom: 16 }}>
            <PenTool size={20} color="#0284c7" />
            <h3 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>Execute &amp; Sign Agreement</h3>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '12px 16px', borderRadius: 6, fontSize: 13, marginBottom: 20 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>
                Full Legal Name *
              </label>
              <input
                type="text"
                required
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Your full legal name"
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>
                Signer Role
              </label>
              <input
                type="text"
                disabled
                value={documentData?.invitation?.party_role === 'worker' ? 'Support Worker / Employee' : 'Participant / Client'}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 14, background: '#f8fafc', color: '#64748b', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Digital Signature Canvas */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                Digital Signature * (Draw with finger, stylus, or mouse)
              </label>
              {hasDrawn && (
                <button
                  type="button"
                  onClick={clearCanvas}
                  style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
                >
                  Clear Signature
                </button>
              )}
            </div>
            <div style={{ border: '2px dashed #cbd5e1', borderRadius: 6, background: '#fafafa', position: 'relative' }}>
              <canvas
                ref={canvasRef}
                width={760}
                height={160}
                onMouseDown={startDrawing}
                onMouseUp={stopDrawing}
                onMouseMove={draw}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchEnd={stopDrawing}
                onTouchMove={draw}
                style={{ display: 'block', width: '100%', height: 160, cursor: 'crosshair', touchAction: 'none' }}
              />
              {!hasDrawn && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', color: '#94a3b8', fontSize: 14 }}>
                  Sign in this box
                </div>
              )}
            </div>
          </div>

          {/* Neutral Intent & Consent Checkbox */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '14px 18px', marginBottom: 24 }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', fontSize: 13, color: '#1e293b', lineHeight: 1.5 }}>
              <input
                type="checkbox"
                required
                checked={legalIntentAccepted}
                onChange={(e) => setLegalIntentAccepted(e.target.checked)}
                style={{ marginTop: 3, width: 16, height: 16, cursor: 'pointer' }}
              />
              <span>
                <strong>Statutory Declaration &amp; Consent:</strong> I confirm my identity, consent to signing this agreement electronically, and intend my electronic signature to indicate my agreement to its terms.
              </span>
            </label>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 8, paddingLeft: 28 }}>
              Electronic execution governed by the <em>Electronic Transactions Act 1999 (Cth)</em>.
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <button
              type="submit"
              disabled={submitting || !hasDrawn || !legalIntentAccepted}
              style={{
                background: submitting || !hasDrawn || !legalIntentAccepted ? '#94a3b8' : '#0284c7',
                color: '#ffffff',
                border: 'none',
                padding: '12px 32px',
                borderRadius: 6,
                fontSize: 15,
                fontWeight: 600,
                cursor: submitting || !hasDrawn || !legalIntentAccepted ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? 'Verifying & Executing...' : 'Sign & Complete Agreement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
