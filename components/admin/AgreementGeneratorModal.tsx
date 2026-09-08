'use client';

import React, { useState, useMemo, useRef } from 'react';
import { 
  X, Check, AlertTriangle, Shield, FileText, ArrowRight, ArrowLeft, 
  UserCheck, Users, Printer, Sparkles, CheckCircle2, Lock, Download, PenTool
} from 'lucide-react';

interface AgreementGeneratorModalProps {
  participants: any[];
  staff: any[];
  onClose: () => void;
  onCreated: (newAgreement: any) => void;
  initialTemplateCode?: string;
  variationOf?: any;
}

const NDIS_SERVICES = [
  { code: '01_011_0107_1_1', description: 'Assistance with Daily Personal Activities (Standard)', refRate: 67.56, defaultHours: 6.0 },
  { code: '04_104_0125_6_1', description: 'Access Community, Social and Civic Activities', refRate: 67.56, defaultHours: 4.0 },
  { code: '01_019_0120_1_1', description: 'House Cleaning & Other Household Activities', refRate: 58.45, defaultHours: 2.0 },
  { code: '01_013_0107_1_1', description: 'Weekend Support Saturday (Core)', refRate: 94.82, defaultHours: 3.0 },
  { code: '02_051_0108_1_1', description: 'Transport - Activity Based Transport Assistance', refRate: 45.00, defaultHours: 1.0 },
];

export default function AgreementGeneratorModal({
  participants,
  staff,
  onClose,
  onCreated,
  initialTemplateCode = 'PACK-PART-01',
  variationOf = null,
}: AgreementGeneratorModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(variationOf ? 3 : 1);
  const [selectedTemplate, setSelectedTemplate] = useState<string>(variationOf ? variationOf.template?.template_code || 'DOC-PART-01' : initialTemplateCode);
  const [ownerType, setOwnerType] = useState<'participant' | 'staff' | 'contractor'>(
    variationOf ? variationOf.owner_type : initialTemplateCode.includes('WRK') ? 'staff' : initialTemplateCode.includes('CTR') ? 'contractor' : 'participant'
  );
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>(variationOf ? variationOf.owner_id : '');

  // Recipient info
  const [recipientName, setRecipientName] = useState<string>(variationOf?.questionnaire_data?.participant_name || '');
  const [ndisNumber, setNdisNumber] = useState<string>(variationOf?.questionnaire_data?.ndis_number || '');
  const [fundingType, setFundingType] = useState<string>(variationOf?.questionnaire_data?.funding_type || 'Plan-Managed');
  const [planManagerName, setPlanManagerName] = useState<string>(variationOf?.questionnaire_data?.plan_manager_name || '');
  const [planManagerEmail, setPlanManagerEmail] = useState<string>(variationOf?.questionnaire_data?.plan_manager_email || '');
  
  // Schedule of Supports items
  const [scheduleItems, setScheduleItems] = useState(
    variationOf?.compiled_clauses?.service_schedule || [
      { item_code: '01_011_0107_1_1', description: 'Assistance with Daily Personal Activities (Standard)', hours_pw: 6.0, agreed_rate: 67.56 },
      { item_code: '04_104_0125_6_1', description: 'Access Community, Social and Civic Activities', hours_pw: 4.0, agreed_rate: 67.56 },
    ]
  );

  // Participant Consent toggles
  const [transportIncluded, setTransportIncluded] = useState<boolean>(variationOf?.questionnaire_data?.transport_included ?? true);
  const [mediaConsent, setMediaConsent] = useState<boolean>(variationOf?.questionnaire_data?.media_consent ?? false);

  // Workforce & Contractor fields
  const [workerClassification, setWorkerClassification] = useState('Level 2 Support Worker');
  const [workerBasis, setWorkerBasis] = useState<'full_time' | 'part_time' | 'casual'>('casual');
  const [workerRate, setWorkerRate] = useState<number>(38.50);
  const [superRate, setSuperRate] = useState<number>(11.50);
  const [includeRestraintClause, setIncludeRestraintClause] = useState<boolean>(false);

  // Sham Contracting Checklist (Contractor Gate)
  const [contractorChecks, setContractorChecks] = useState({
    independentBiz: false,
    toolsAndInsurances: false,
    delegationRight: false,
    paidForOutcome: false,
  });

  // Dates
  const [commencementDate, setCommencementDate] = useState<string>(
    variationOf?.commencement_date || new Date().toISOString().split('T')[0]
  );
  const [reviewDate, setReviewDate] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');

  // Signing state
  const [signingTab, setSigningTab] = useState<'canvas' | 'link' | 'wet'>('canvas');
  const [signerName, setSignerName] = useState<string>('');
  const [signerTitle, setSignerTitle] = useState<string>('Participant');
  const [providerSignerName, setProviderSignerName] = useState<string>('Director of Operations');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Canvas drawing
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Auto-fill when owner selected
  const handleOwnerChange = (id: string) => {
    setSelectedOwnerId(id);
    if (ownerType === 'participant') {
      const p = participants.find((item) => item.id === id);
      if (p) {
        setRecipientName(p.name);
        setNdisNumber(p.ndisNumber || '');
        setFundingType(p.fundingType || 'Plan-Managed');
        setPlanManagerName(p.planManager || '');
        setSignerName(p.name);
        setSignerTitle('Participant');
      }
    } else {
      const w = staff.find((item) => item.id === id);
      if (w) {
        setRecipientName(w.name);
        setWorkerRate(w.hourlyRate || 38.50);
        setSignerName(w.name);
        setSignerTitle(w.role || 'Support Worker');
      }
    }
  };

  // Calculate annual budget commitment
  const totalAnnualBudget = useMemo(() => {
    const weekly = scheduleItems.reduce((acc: number, item: any) => {
      return acc + (Number(item.hours_pw || 0) * Number(item.agreed_rate || 0));
    }, 0);
    return weekly * 52;
  }, [scheduleItems]);

  // Update schedule row
  const updateScheduleItem = (index: number, field: string, value: any) => {
    const updated = [...scheduleItems];
    updated[index] = { ...updated[index], [field]: value };
    setScheduleItems(updated);
  };

  const addScheduleRow = () => {
    setScheduleItems([
      ...scheduleItems,
      { item_code: '01_011_0107_1_1', description: 'Assistance with Daily Living', hours_pw: 2.0, agreed_rate: 67.56 }
    ]);
  };

  const removeScheduleRow = (idx: number) => {
    if (scheduleItems.length > 1) {
      setScheduleItems(scheduleItems.filter((_: any, i: number) => i !== idx));
    }
  };

  // Canvas events
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.strokeStyle = '#162E56';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  // Sham contracting gate check
  const isContractorGatePassed = useMemo(() => {
    if (selectedTemplate !== 'DOC-CTR-01') return true;
    return (
      contractorChecks.independentBiz &&
      contractorChecks.toolsAndInsurances &&
      contractorChecks.delegationRight &&
      contractorChecks.paidForOutcome
    );
  }, [selectedTemplate, contractorChecks]);

  // Submit and Create/Execute Agreement
  const handleSaveAndExecute = async (executeNow: boolean) => {
    setSubmitting(true);
    setError('');

    // 1. Fetch template ID
    try {
      const tmplRes = await fetch(`/api/crm/agreements/templates?category=all`);
      const tmpls = await tmplRes.json();
      const matchTmpl = tmpls.find((t: any) => t.template_code === selectedTemplate) || tmpls[0];

      if (!matchTmpl) {
        setError('Template not found');
        setSubmitting(false);
        return;
      }

      // Compile questionnaire data
      const qData: Record<string, any> = {
        participant_name: ownerType === 'participant' ? recipientName : undefined,
        worker_name: ownerType !== 'participant' ? recipientName : undefined,
        ndis_number: ndisNumber,
        funding_type: fundingType,
        plan_manager_name: fundingType === 'Plan-Managed' ? planManagerName : undefined,
        plan_manager_email: fundingType === 'Plan-Managed' ? planManagerEmail : undefined,
        transport_included: transportIncluded,
        media_consent: mediaConsent,
        worker_classification: workerClassification,
        worker_basis: workerBasis,
        hourly_rate: workerRate,
        super_rate_pct: superRate,
        include_restraint_clause: includeRestraintClause,
      };

      const compiledClauses: Record<string, any> = {
        service_schedule: ownerType === 'participant' ? scheduleItems : [],
        total_annual_budget: totalAnnualBudget,
      };

      const title = variationOf 
        ? `${variationOf.title} (Variation v${variationOf.version_number + 1})`
        : selectedTemplate === 'PACK-PART-01'
        ? `New Participant Pack - ${recipientName}`
        : selectedTemplate === 'PACK-WRK-01'
        ? `New Worker Pack - ${recipientName}`
        : `${matchTmpl.title} - ${recipientName}`;

      // POST to create draft
      const createRes = await fetch('/api/crm/agreements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: matchTmpl.id,
          owner_type: ownerType,
          owner_id: selectedOwnerId || '00000000-0000-0000-0000-000000000000',
          title,
          questionnaire_data: qData,
          compiled_clauses: compiledClauses,
          commencement_date: commencementDate,
          review_date: reviewDate || null,
          expiry_date: expiryDate || null,
          estimated_budget: totalAnnualBudget,
          status: executeNow ? 'partially_signed' : 'draft',
          is_variation: !!variationOf,
          prior_agreement_id: variationOf?.id || null,
        }),
      });

      const createData = await createRes.json();
      if (!createRes.ok) {
        setError(createData.message || 'Failed to generate agreement.');
        setSubmitting(false);
        return;
      }

      const newAgr = createData.agreement;

      // If user provided a digital signature on canvas
      if (executeNow && newAgr && hasDrawn && canvasRef.current) {
        const sigData = canvasRef.current.toDataURL('image/png');
        // Sign as participant / worker
        await fetch('/api/crm/agreements/sign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agreement_id: newAgr.id,
            party_role: ownerType === 'participant' ? 'participant' : 'worker',
            signer_name: signerName || recipientName,
            signer_title: signerTitle,
            signing_method: 'digital_canvas',
            signature_image_data: sigData,
          }),
        });

        // Sign as provider rep to fully execute!
        await fetch('/api/crm/agreements/sign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agreement_id: newAgr.id,
            party_role: 'provider_rep',
            signer_name: providerSignerName,
            signer_title: 'Managing Director, Opus Care Support Services',
            signing_method: 'digital_canvas',
          }),
        });
      }

      onCreated(newAgr);
      onClose();
    } catch (err: unknown) {
      setError('Network error while saving agreement.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="crmModalOverlay" onClick={onClose}>
      <div className="crmModalBox" style={{ maxWidth: 840, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="crmModalHeader" style={{ flexShrink: 0 }}>
          <div>
            <span className="refIdTag">
              {variationOf ? `AGREEMENT VARIATION (v${variationOf.version_number + 1})` : 'OPUS CARE AGREEMENT ENGINE'}
            </span>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
              {step === 1 && 'Step 1: Select Document or Onboarding Pack'}
              {step === 2 && 'Step 2: Select Recipient & Stakeholders'}
              {step === 3 && 'Step 3: Customise Terms & Schedule of Supports'}
              {step === 4 && 'Step 4: Review, Execute &amp; Sign'}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
            <X size={20} />
          </button>
        </div>

        {/* Wizard Steps Indicator */}
        <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', padding: '8px 24px', flexShrink: 0 }}>
          {[
            { num: 1, label: 'Document Type' },
            { num: 2, label: 'Recipient' },
            { num: 3, label: 'Terms & Schedule' },
            { num: 4, label: 'Review & Sign' }
          ].map((s) => {
            const active = step === s.num;
            const completed = step > s.num;
            return (
              <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 24 }}>
                <span style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: active ? '#0284C7' : completed ? '#10B981' : '#CBD5E1',
                  color: '#FFFFFF',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {completed ? '✓' : s.num}
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: active ? 800 : 600, color: active ? '#0F172A' : '#64748B' }}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Body Content */}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '10px 14px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 16 }}>
              {error}
            </div>
          )}

          {/* STEP 1: SELECT DOCUMENT OR PACK */}
          {step === 1 && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#162E56', margin: '0 0 4px' }}>
                  A. Turnkey Multi-Document Onboarding Packs
                </h4>
                <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>
                  Pre-assembled compliance bundles generated from a single unified questionnaire.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
                <div
                  onClick={() => {
                    setSelectedTemplate('PACK-PART-01');
                    setOwnerType('participant');
                  }}
                  style={{
                    border: selectedTemplate === 'PACK-PART-01' ? '2px solid #0284C7' : '1px solid #E2E8F0',
                    background: selectedTemplate === 'PACK-PART-01' ? '#F0F9FF' : '#FFFFFF',
                    borderRadius: 10,
                    padding: 16,
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(15,23,42,0.03)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#E0F2FE', color: '#0284C7', padding: '2px 6px', borderRadius: 4 }}>
                      NEW PARTICIPANT PACK
                    </span>
                    {selectedTemplate === 'PACK-PART-01' && <Check size={16} style={{ color: '#0284C7' }} />}
                  </div>
                  <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.95rem', marginBottom: 4 }}>
                    New Participant Onboarding Pack (All-in-One)
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', lineHeight: 1.4 }}>
                    Includes Service Agreement, Schedule of Supports, Privacy Consent, Authority to Communicate, Emergency Plan, Risk Assessment &amp; Transport/Media Consents.
                  </div>
                </div>

                <div
                  onClick={() => {
                    setSelectedTemplate('PACK-WRK-01');
                    setOwnerType('staff');
                  }}
                  style={{
                    border: selectedTemplate === 'PACK-WRK-01' ? '2px solid #059669' : '1px solid #E2E8F0',
                    background: selectedTemplate === 'PACK-WRK-01' ? '#ECFDF5' : '#FFFFFF',
                    borderRadius: 10,
                    padding: 16,
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(15,23,42,0.03)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#D1FAE5', color: '#059669', padding: '2px 6px', borderRadius: 4 }}>
                      NEW WORKER PACK
                    </span>
                    {selectedTemplate === 'PACK-WRK-01' && <Check size={16} style={{ color: '#059669' }} />}
                  </div>
                  <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.95rem', marginBottom: 4 }}>
                    New Worker Onboarding Pack (All-in-One)
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', lineHeight: 1.4 }}>
                    Includes SCHADS Employment Agreement, Position Description, NDIS Code of Conduct, Confidentiality Deed, Conflict of Interest &amp; Clearance Verification.
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#162E56', margin: '0 0 4px' }}>
                  B. Standalone Agreements
                </h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                {[
                  { code: 'DOC-PART-01', title: 'NDIS Service Agreement', cat: 'participant', desc: 'Standard terms, rights, cancellations' },
                  { code: 'DOC-PART-02', title: 'Schedule of Supports', cat: 'participant', desc: 'Itemised lines, agreed prices, hours' },
                  { code: 'DOC-WRK-01', title: 'SCHADS Worker Agreement', cat: 'staff', desc: 'Permanent or Casual employee contract' },
                  { code: 'DOC-CTR-01', title: 'Independent Contractor Agreement', cat: 'contractor', desc: 'ABN Sole Trader / Subcontractor' },
                ].map((item) => {
                  const active = selectedTemplate === item.code;
                  return (
                    <div
                      key={item.code}
                      onClick={() => {
                        setSelectedTemplate(item.code);
                        setOwnerType(item.cat as any);
                      }}
                      style={{
                        border: active ? '2px solid #0284C7' : '1px solid #E2E8F0',
                        background: active ? '#F0F9FF' : '#FFFFFF',
                        borderRadius: 8,
                        padding: 12,
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', fontWeight: 700, color: '#0284C7' }}>{item.code}</span>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0F172A', margin: '2px 0' }}>{item.title}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{item.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: SELECT RECIPIENT */}
          {step === 2 && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#162E56', margin: '0 0 6px' }}>
                  Select {ownerType === 'participant' ? 'Participant' : 'Worker / Contractor'}
                </h4>
                <p style={{ fontSize: '0.82rem', color: '#64748B', margin: 0 }}>
                  Choosing an existing profile automatically pulls their NDIS details, funding type, rates, and contact info.
                </p>
              </div>

              {ownerType === 'participant' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <label className="crmFormLabel">Choose Registered Participant</label>
                  <select
                    value={selectedOwnerId}
                    onChange={(e) => handleOwnerChange(e.target.value)}
                    className="crmFormInput"
                  >
                    <option value="">-- Select Participant from Directory --</option>
                    {participants.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.referenceNumber || 'NDIS'}) — {p.suburb} ({p.fundingType || 'Plan-Managed'})
                      </option>
                    ))}
                  </select>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 10 }}>
                    <div>
                      <label className="crmFormLabel">Participant Legal Full Name *</label>
                      <input
                        type="text"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        className="crmFormInput"
                        placeholder="Full Legal Name"
                        required
                      />
                    </div>
                    <div>
                      <label className="crmFormLabel">NDIS Number</label>
                      <input
                        type="text"
                        value={ndisNumber}
                        onChange={(e) => setNdisNumber(e.target.value)}
                        className="crmFormInput"
                        placeholder="e.g. 430 982 104"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <label className="crmFormLabel">Choose Support Worker from Team</label>
                  <select
                    value={selectedOwnerId}
                    onChange={(e) => handleOwnerChange(e.target.value)}
                    className="crmFormInput"
                  >
                    <option value="">-- Select Worker from Register --</option>
                    {staff.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.role}) — ${w.hourlyRate || 38.50}/hr
                      </option>
                    ))}
                  </select>

                  <div>
                    <label className="crmFormLabel">Worker Full Legal Name *</label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="crmFormInput"
                      placeholder="Full Legal Name"
                      required
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: CUSTOMISE TERMS & SCHEDULE */}
          {step === 3 && (
            <div>
              {/* SHAM CONTRACTING WARNING GATE FOR CONTRACTORS */}
              {selectedTemplate === 'DOC-CTR-01' && (
                <div style={{ background: '#FEF2F2', border: '1.5px solid #F87171', borderRadius: 10, padding: 18, marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#991B1B', fontWeight: 800, fontSize: '0.95rem', marginBottom: 6 }}>
                    <AlertTriangle size={18} />
                    <span>MANDATORY LEGAL WARNING: Independent Contractor Assessment</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#7F1D1D', margin: '0 0 12px', lineHeight: 1.4 }}>
                    Under the <em>Fair Work Act 2009</em> and High Court precedent, holding an ABN or issuing an invoice does NOT establish an independent contractor relationship. You must confirm the following 4 criteria before generating a contractor agreement:
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { key: 'independentBiz', text: 'Worker operates a genuinely independent business and is free to accept or refuse assignments.' },
                      { key: 'toolsAndInsurances', text: 'Worker maintains their own mandatory Public Liability ($10M+) and Professional Indemnity insurances.' },
                      { key: 'delegationRight', text: 'Worker retains the genuine contractual right to delegate or subcontract the performance of the work.' },
                      { key: 'paidForOutcome', text: 'Worker is engaged for a specific project/outcome, rather than subservient hourly direct labour.' }
                    ].map((item) => (
                      <label key={item.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.82rem', color: '#991B1B', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={(contractorChecks as any)[item.key]}
                          onChange={(e) => setContractorChecks({ ...contractorChecks, [item.key]: e.target.checked })}
                          style={{ marginTop: 2 }}
                        />
                        <span>{item.text}</span>
                      </label>
                    ))}
                  </div>

                  {!isContractorGatePassed && (
                    <div style={{ marginTop: 10, fontSize: '0.75rem', fontWeight: 700, color: '#B91C1C' }}>
                      ⚠️ All 4 checkboxes must be confirmed before proceeding. Otherwise, worker must be engaged as an employee under SCHADS.
                    </div>
                  )}
                </div>
              )}

              {/* PARTICIPANT QUESTIONNAIRE */}
              {ownerType === 'participant' && (
                <div>
                  {/* Funding Type */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                    <div>
                      <label className="crmFormLabel">NDIS Funding Administration *</label>
                      <select
                        value={fundingType}
                        onChange={(e) => setFundingType(e.target.value)}
                        className="crmFormInput"
                      >
                        <option value="Plan-Managed">Plan-Managed (Direct Invoice to Plan Manager)</option>
                        <option value="Self-Managed">Self-Managed (Participant Invoiced on 7-Day Terms)</option>
                        <option value="NDIA Managed">NDIA Managed (PACE / Agency Claiming)</option>
                      </select>
                    </div>

                    <div>
                      <label className="crmFormLabel">Commencement Date *</label>
                      <input
                        type="date"
                        value={commencementDate}
                        onChange={(e) => setCommencementDate(e.target.value)}
                        className="crmFormInput"
                        required
                      />
                    </div>
                  </div>

                  {fundingType === 'Plan-Managed' && (
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 14, marginBottom: 20 }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0284C7', display: 'block', marginBottom: 8 }}>
                        Plan Management Invoicing Protocol
                      </span>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                          <label className="crmFormLabel">Plan Manager Company</label>
                          <input
                            type="text"
                            value={planManagerName}
                            onChange={(e) => setPlanManagerName(e.target.value)}
                            className="crmFormInput"
                            placeholder="e.g. Peak Plan Management"
                          />
                        </div>
                        <div>
                          <label className="crmFormLabel">Invoices Email</label>
                          <input
                            type="email"
                            value={planManagerEmail}
                            onChange={(e) => setPlanManagerEmail(e.target.value)}
                            className="crmFormInput"
                            placeholder="invoices@peakplan.com.au"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Schedule of Supports Line Items */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#162E56' }}>
                        Schedule of Supports &amp; Mutually Agreed Pricing
                      </span>
                      <button
                        type="button"
                        onClick={addScheduleRow}
                        className="crmSecondaryBtn"
                        style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                      >
                        + Add Support Item
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {scheduleItems.map((row: any, idx: number) => {
                        return (
                          <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1.8fr 3fr 1fr 1.2fr auto', gap: 8, alignItems: 'center', background: '#F8FAFC', padding: 8, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                            <select
                              value={row.item_code}
                              onChange={(e) => {
                                const match = NDIS_SERVICES.find(s => s.code === e.target.value);
                                if (match) {
                                  updateScheduleItem(idx, 'item_code', match.code);
                                  updateScheduleItem(idx, 'description', match.description);
                                  updateScheduleItem(idx, 'agreed_rate', match.refRate);
                                }
                              }}
                              className="crmFormInput"
                              style={{ padding: '4px 8px', fontSize: '0.8rem', fontFamily: 'monospace' }}
                            >
                              {NDIS_SERVICES.map(s => (
                                <option key={s.code} value={s.code}>{s.code}</option>
                              ))}
                            </select>

                            <input
                              type="text"
                              value={row.description}
                              onChange={(e) => updateScheduleItem(idx, 'description', e.target.value)}
                              className="crmFormInput"
                              style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                            />

                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                value={row.hours_pw}
                                onChange={(e) => updateScheduleItem(idx, 'hours_pw', Number(e.target.value))}
                                className="crmFormInput"
                                style={{ padding: '4px 6px', fontSize: '0.8rem', textAlign: 'center' }}
                              />
                              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>h/wk</span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ fontSize: '0.8rem', color: '#64748B' }}>$</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={row.agreed_rate}
                                onChange={(e) => updateScheduleItem(idx, 'agreed_rate', Number(e.target.value))}
                                className="crmFormInput"
                                style={{ padding: '4px 6px', fontSize: '0.8rem', textAlign: 'right' }}
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => removeScheduleRow(idx)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626' }}
                              title="Remove item"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ marginTop: 10, textAlign: 'right', fontSize: '0.85rem', color: '#0F172A' }}>
                      <strong>Estimated Total Annual Commitment: </strong>
                      <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#059669' }}>
                        ${totalAnnualBudget.toLocaleString('en-AU', { minimumFractionDigits: 2 })} AUD
                      </span>
                    </div>
                  </div>

                  {/* Consent Toggles */}
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 14 }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 10 }}>
                      Conditional Schedules &amp; Consents
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: '#334155', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={transportIncluded}
                          onChange={(e) => setTransportIncluded(e.target.checked)}
                        />
                        <span><strong>Include Transport Assistance Schedule</strong> (Vehicular travel &amp; mileage allowances)</span>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: '#334155', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={mediaConsent}
                          onChange={(e) => setMediaConsent(e.target.checked)}
                        />
                        <span><strong>Include Photography &amp; Media Release</strong> (Optional marketing consent schedule)</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* WORKFORCE QUESTIONNAIRE */}
              {ownerType === 'staff' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label className="crmFormLabel">Employment Type (SCHADS Award) *</label>
                      <select
                        value={workerBasis}
                        onChange={(e) => setWorkerBasis(e.target.value as any)}
                        className="crmFormInput"
                      >
                        <option value="casual">Casual (includes 25% casual loading)</option>
                        <option value="part_time">Permanent Part-Time (Agreed pattern of hours)</option>
                        <option value="full_time">Permanent Full-Time (38 hrs/week)</option>
                      </select>
                    </div>

                    <div>
                      <label className="crmFormLabel">Award Classification</label>
                      <select
                        value={workerClassification}
                        onChange={(e) => setWorkerClassification(e.target.value)}
                        className="crmFormInput"
                      >
                        <option value="Level 2 Support Worker">Level 2 Support Worker</option>
                        <option value="Level 3 Support Worker">Level 3 Senior Support Worker</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label className="crmFormLabel">Agreed Base Hourly Rate ($/hr)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={workerRate}
                        onChange={(e) => setWorkerRate(Number(e.target.value))}
                        className="crmFormInput"
                      />
                    </div>
                    <div>
                      <label className="crmFormLabel">Superannuation Guarantee (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={superRate}
                        onChange={(e) => setSuperRate(Number(e.target.value))}
                        className="crmFormInput"
                      />
                    </div>
                  </div>

                  {/* Restraint of Trade Flag */}
                  <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', padding: 12, borderRadius: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#FEF3C7', color: '#B45309', padding: '2px 6px', borderRadius: 4 }}>
                        LEGAL REVIEW REQUIRED
                      </span>
                      <strong style={{ fontSize: '0.85rem', color: '#92400E' }}>Non-Solicitation &amp; Restraint Clause</strong>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: '#92400E', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={includeRestraintClause}
                        onChange={(e) => setIncludeRestraintClause(e.target.checked)}
                      />
                      <span>Include reasonable 6-month post-employment participant non-solicitation clause</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: REVIEW & SIGN */}
          {step === 4 && (
            <div>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0284C7', textTransform: 'uppercase' }}>Draft Ready for Execution</span>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>{recipientName}</h4>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Effective Date</span>
                    <div style={{ fontWeight: 800, color: '#0F172A' }}>{commencementDate}</div>
                  </div>
                </div>

                {ownerType === 'participant' && (
                  <div style={{ fontSize: '0.82rem', color: '#475569', borderTop: '1px solid #E2E8F0', paddingTop: 10 }}>
                    Schedule: <strong>{scheduleItems.length} support lines</strong> • Annual Commitment: <strong>${totalAnnualBudget.toLocaleString('en-AU', { minimumFractionDigits: 2 })} AUD</strong>
                  </div>
                )}
              </div>

              {/* Execution Options */}
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#162E56', display: 'block', marginBottom: 8 }}>
                  Execution Pathway
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setSigningTab('canvas')}
                    style={{
                      flex: 1,
                      padding: 10,
                      borderRadius: 8,
                      border: signingTab === 'canvas' ? '2px solid #0284C7' : '1px solid #CBD5E1',
                      background: signingTab === 'canvas' ? '#F0F9FF' : '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      color: signingTab === 'canvas' ? '#0284C7' : '#475569'
                    }}
                  >
                    On-Screen E-Signature
                  </button>
                  <button
                    type="button"
                    onClick={() => setSigningTab('link')}
                    style={{
                      flex: 1,
                      padding: 10,
                      borderRadius: 8,
                      border: signingTab === 'link' ? '2px solid #0284C7' : '1px solid #CBD5E1',
                      background: signingTab === 'link' ? '#F0F9FF' : '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      color: signingTab === 'link' ? '#0284C7' : '#475569'
                    }}
                  >
                    Send Remote Signing Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setSigningTab('wet')}
                    style={{
                      flex: 1,
                      padding: 10,
                      borderRadius: 8,
                      border: signingTab === 'wet' ? '2px solid #0284C7' : '1px solid #CBD5E1',
                      background: signingTab === 'wet' ? '#F0F9FF' : '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      color: signingTab === 'wet' ? '#0284C7' : '#475569'
                    }}
                  >
                    Download for Wet Signature
                  </button>
                </div>
              </div>

              {/* CANVAS DRAWING AREA */}
              {signingTab === 'canvas' && (
                <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 10, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>
                      Sign with finger or mouse:
                    </label>
                    <button
                      type="button"
                      onClick={clearCanvas}
                      style={{ background: 'none', border: 'none', color: '#0284C7', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Clear Canvas
                    </button>
                  </div>

                  <div style={{ background: '#FFFFFF', border: '1.5px dashed #94A3B8', borderRadius: 8, overflow: 'hidden' }}>
                    <canvas
                      ref={canvasRef}
                      width={500}
                      height={120}
                      style={{ width: '100%', height: 120, touchAction: 'none', cursor: 'crosshair' }}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                    <div>
                      <label className="crmFormLabel">Signer Full Legal Name</label>
                      <input
                        type="text"
                        value={signerName}
                        onChange={(e) => setSignerName(e.target.value)}
                        className="crmFormInput"
                        placeholder="Signer Legal Name"
                      />
                    </div>
                    <div>
                      <label className="crmFormLabel">Signer Authority / Role</label>
                      <input
                        type="text"
                        value={signerTitle}
                        onChange={(e) => setSignerTitle(e.target.value)}
                        className="crmFormInput"
                        placeholder="e.g. Participant, Plan Nominee"
                      />
                    </div>
                  </div>
                </div>
              )}

              {signingTab === 'link' && (
                <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: 18, color: '#1E40AF', fontSize: '0.85rem' }}>
                  <strong>Remote Digital Signing Link:</strong>
                  <p style={{ margin: '6px 0 12px' }}>
                    Upon saving, a cryptographically signed, secure token link will be generated. You can email or SMS this link directly to the recipient to execute on their mobile device without requiring a login.
                  </p>
                  <span style={{ fontSize: '0.78rem', background: '#DBEAFE', padding: '4px 8px', borderRadius: 4, fontFamily: 'monospace' }}>
                    https://opuscare.com.au/sign?token=SECURE_TOKEN_PENDING
                  </span>
                </div>
              )}

              {signingTab === 'wet' && (
                <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 10, padding: 18, fontSize: '0.85rem', color: '#334155' }}>
                  <strong>Physical Wet-Ink Execution:</strong>
                  <p style={{ margin: '6px 0 12px' }}>
                    Save this agreement as a draft, open it, and print. Once physically signed by the participant and provider representative, upload the scanned copy to seal the agreement into the immutable private vault.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((step - 1) as any)}
                className="crmSecondaryBtn"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <ArrowLeft size={15} />
                <span>Back</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              className="crmSecondaryBtn"
            >
              Cancel
            </button>

            {step < 4 ? (
              <button
                type="button"
                disabled={step === 3 && selectedTemplate === 'DOC-CTR-01' && !isContractorGatePassed}
                onClick={() => {
                  if (step === 2 && !recipientName.trim()) {
                    setError('Recipient name is required.');
                    return;
                  }
                  setError('');
                  setStep((step + 1) as any);
                }}
                className="crmActionBtnPrimary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <span>Continue</span>
                <ArrowRight size={15} />
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSaveAndExecute(false)}
                  className="crmSecondaryBtn"
                >
                  Save as Draft
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSaveAndExecute(true)}
                  className="crmActionBtnPrimary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <PenTool size={15} />
                  <span>{submitting ? 'Executing...' : 'Sign & Seal Agreement'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
