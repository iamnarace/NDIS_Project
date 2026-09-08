'use client';

import React, { useState, useMemo, useRef } from 'react';
import { 
  X, Check, AlertTriangle, Shield, FileText, ArrowRight, ArrowLeft, 
  UserCheck, Users, Printer, Sparkles, CheckCircle2, Lock, Download, PenTool
} from 'lucide-react';
import {
  FormField,
  TextInput,
  DatePicker,
  RadioCard,
  FormStepper,
  ReviewSummary,
  InlineValidation,
  Checkbox,
} from '@/components/ui/form';

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
  const [selectedTemplate, setSelectedTemplate] = useState<string>(
    variationOf ? variationOf.template?.template_code || 'DOC-PART-01' : initialTemplateCode
  );
  const [ownerType, setOwnerType] = useState<'participant' | 'staff' | 'contractor'>(
    variationOf
      ? variationOf.owner_type
      : initialTemplateCode.includes('WRK')
      ? 'staff'
      : initialTemplateCode.includes('CTR')
      ? 'contractor'
      : 'participant'
  );

  // Selected owner state - MUST strictly hold the database UUID
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>(
    variationOf ? variationOf.owner_id : ''
  );

  // Recipient info
  const [recipientName, setRecipientName] = useState<string>(
    variationOf?.questionnaire_data?.participant_name || variationOf?.questionnaire_data?.worker_name || ''
  );
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
  const [signerName, setSignerName] = useState<string>('');
  const [signerTitle, setSignerTitle] = useState<string>('Participant');
  const [providerSignerName, setProviderSignerName] = useState<string>('Director of Operations');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Canvas drawing
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Auto-fill when owner selected - guarantees resolving to database UUID
  const handleOwnerChange = (idOrRef: string) => {
    if (ownerType === 'participant') {
      const p = participants.find((item) => item.id === idOrRef || item.referenceNumber === idOrRef);
      if (p) {
        setSelectedOwnerId(p.id); // store actual UUID
        setRecipientName(p.name);
        setNdisNumber(p.ndisNumber || '');
        setFundingType(p.fundingType || 'Plan-Managed');
        setPlanManagerName(p.planManager || '');
        setSignerName(p.name);
        setSignerTitle('Participant');
      } else {
        setSelectedOwnerId(idOrRef);
      }
    } else {
      const w = staff.find((item) => item.id === idOrRef || item.referenceNumber === idOrRef);
      if (w) {
        setSelectedOwnerId(w.id); // store actual UUID
        setRecipientName(w.name);
        setWorkerRate(w.hourlyRate || 38.50);
        setSignerName(w.name);
        setSignerTitle(w.role || 'Support Worker');
      } else {
        setSelectedOwnerId(idOrRef);
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

    try {
      // Resolve true UUID
      let targetOwnerUuid = selectedOwnerId;
      if (ownerType === 'participant') {
        const p = participants.find((item) => item.id === selectedOwnerId || item.referenceNumber === selectedOwnerId);
        if (p?.id) targetOwnerUuid = p.id;
      } else {
        const w = staff.find((item) => item.id === selectedOwnerId || item.referenceNumber === selectedOwnerId);
        if (w?.id) targetOwnerUuid = w.id;
      }

      if (!targetOwnerUuid) {
        setError(`Please select a registered ${ownerType === 'participant' ? 'participant' : 'support worker'} from the register.`);
        setSubmitting(false);
        return;
      }

      if (!recipientName.trim()) {
        setError('Recipient Full Legal Name is required.');
        setSubmitting(false);
        return;
      }

      // Fetch template
      const tmplRes = await fetch(`/api/crm/agreements/templates?category=all`);
      const tmpls = await tmplRes.json();
      const matchTmpl = tmpls.find((t: any) => t.template_code === selectedTemplate) || tmpls[0];

      if (!matchTmpl) {
        setError('Template configuration not found.');
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
          owner_id: targetOwnerUuid,
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
      setError('Network error while saving agreement. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="crmModalOverlay" onClick={onClose}>
      <div
        className="crmModalBox"
        style={{ maxWidth: 840, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="crmModalHeader" style={{ flexShrink: 0 }}>
          <div>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#0284C7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {variationOf ? `AGREEMENT VARIATION (v${variationOf.version_number + 1})` : 'OPUS CARE AGREEMENT ENGINE'}
            </span>
            <h3 className="crmSectionTitle" style={{ margin: 0 }}>
              {step === 1 && 'Step 1: Select Document or Onboarding Pack'}
              {step === 2 && 'Step 2: Select Recipient & Stakeholders'}
              {step === 3 && 'Step 3: Customise Terms & Schedule of Supports'}
              {step === 4 && 'Step 4: Review & Sign'}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* Stepper */}
        <FormStepper
          steps={[
            { num: 1, label: 'Document Type' },
            { num: 2, label: 'Recipient' },
            { num: 3, label: 'Terms & Schedule' },
            { num: 4, label: 'Review & Sign' },
          ]}
          currentStep={step}
          onStepClick={(s) => {
            if (s < step) setStep(s as any);
          }}
        />

        {/* Body Content */}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
          {error && (
            <div style={{ marginBottom: 16 }}>
              <InlineValidation type="error" message={error} />
            </div>
          )}

          {/* STEP 1: SELECT DOCUMENT */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <h4 className="crmCardTitle" style={{ margin: '0 0 4px' }}>All-in-One Onboarding Packs</h4>
                <p className="crmBodyText" style={{ margin: 0, fontSize: '0.875rem', color: '#64748B' }}>
                  Recommended: Generate a comprehensive compliance pack bundled with all statutory consents.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <RadioCard
                  selected={selectedTemplate === 'PACK-PART-01'}
                  onSelect={() => {
                    setSelectedTemplate('PACK-PART-01');
                    setOwnerType('participant');
                  }}
                  title="New Participant Onboarding Pack"
                  description="Includes Service Agreement, Schedule of Supports, Privacy Consent, Authority to Communicate, Risk Assessment & Transport/Media Consents."
                  badge="PARTICIPANT PACK"
                  icon={<Users size={20} />}
                />

                <RadioCard
                  selected={selectedTemplate === 'PACK-WRK-01'}
                  onSelect={() => {
                    setSelectedTemplate('PACK-WRK-01');
                    setOwnerType('staff');
                  }}
                  title="New Worker Onboarding Pack"
                  description="Includes SCHADS Employment Agreement, Position Description, NDIS Code of Conduct, Confidentiality Deed & Clearance Verification."
                  badge="WORKER PACK"
                  icon={<UserCheck size={20} />}
                />
              </div>

              <div style={{ marginTop: 6 }}>
                <h4 className="crmCardTitle" style={{ margin: '0 0 4px' }}>Standalone Contracts & Schedules</h4>
                <p className="crmBodyText" style={{ margin: 0, fontSize: '0.875rem', color: '#64748B' }}>
                  Generate individual legally binding schedules or employment agreements.
                </p>
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
                        border: active ? '2px solid #0284C7' : '1.5px solid #E2E8F0',
                        background: active ? '#F0F9FF' : '#FFFFFF',
                        borderRadius: 8,
                        padding: 12,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', fontWeight: 600, color: '#0284C7' }}>{item.code}</span>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#0F172A', margin: '2px 0' }}>{item.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{item.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: SELECT RECIPIENT */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <h4 className="crmCardTitle" style={{ margin: '0 0 4px' }}>
                  Select {ownerType === 'participant' ? 'Participant' : 'Support Worker / Contractor'}
                </h4>
                <p className="crmBodyText" style={{ margin: 0, fontSize: '0.875rem', color: '#64748B' }}>
                  Selecting a registered record pulls their verified database UUID, contact info, and pricing profile.
                </p>
              </div>

              {ownerType === 'participant' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <FormField label="Choose Registered Participant from Directory *" hint="Populates official NDIS numbers and funding details">
                    <select
                      value={selectedOwnerId}
                      onChange={(e) => handleOwnerChange(e.target.value)}
                      className="crmFormSelect"
                    >
                      <option value="">-- Select Participant from Directory --</option>
                      {participants.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.referenceNumber || 'NDIS'}) — {p.suburb} ({p.fundingType || 'Plan-Managed'})
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <FormField label="Participant Legal Full Name *" required>
                      <TextInput
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        placeholder="Full Legal Name"
                        required
                      />
                    </FormField>
                    <FormField label="NDIS Number">
                      <TextInput
                        value={ndisNumber}
                        onChange={(e) => setNdisNumber(e.target.value)}
                        placeholder="e.g. 430 982 104"
                      />
                    </FormField>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <FormField label="Choose Support Worker from Team *" hint="Guarantees valid worker UUID foreign key binding">
                    <select
                      value={selectedOwnerId}
                      onChange={(e) => handleOwnerChange(e.target.value)}
                      className="crmFormSelect"
                    >
                      <option value="">-- Select Worker from Register --</option>
                      {staff.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({w.referenceNumber || 'STF'}) — ${w.hourlyRate || 38.50}/hr ({w.role})
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Worker Full Legal Name *" required>
                    <TextInput
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="Full Legal Name"
                      required
                    />
                  </FormField>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: CUSTOMISE TERMS & SCHEDULE */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* SHAM CONTRACTING WARNING GATE FOR CONTRACTORS */}
              {selectedTemplate === 'DOC-CTR-01' && (
                <div style={{ background: '#FEF2F2', border: '1.5px solid #F87171', borderRadius: 10, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <AlertTriangle size={18} style={{ color: '#DC2626' }} />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#991B1B' }}>
                      Independent Contractor Verification Gate
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: '#7F1D1D', margin: '0 0 12px', lineHeight: 1.45 }}>
                    To prevent sham contracting under the Fair Work Act, verify all 4 criteria before issuing a subcontractor agreement:
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <Checkbox
                      checked={contractorChecks.independentBiz}
                      onChange={(v) => setContractorChecks({ ...contractorChecks, independentBiz: v })}
                      label="Operates an independent commercial business with active ABN"
                    />
                    <Checkbox
                      checked={contractorChecks.toolsAndInsurances}
                      onChange={(v) => setContractorChecks({ ...contractorChecks, toolsAndInsurances: v })}
                      label="Maintains own insurance, vehicle, and work equipment"
                    />
                    <Checkbox
                      checked={contractorChecks.delegationRight}
                      onChange={(v) => setContractorChecks({ ...contractorChecks, delegationRight: v })}
                      label="Has genuine right to delegate or subcontract support shifts"
                    />
                    <Checkbox
                      checked={contractorChecks.paidForOutcome}
                      onChange={(v) => setContractorChecks({ ...contractorChecks, paidForOutcome: v })}
                      label="Remunerated on invoice for service outcomes, not hourly wage"
                    />
                  </div>
                </div>
              )}

              {/* PARTICIPANT SCHEDULE OF SUPPORTS */}
              {ownerType === 'participant' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <h4 className="crmCardTitle" style={{ margin: 0 }}>
                      Schedule of Supports & Mutually Agreed Pricing
                    </h4>
                    <button
                      type="button"
                      onClick={addScheduleRow}
                      className="crmSecondaryBtn"
                      style={{ minHeight: 34, padding: '4px 12px', fontSize: '0.8rem' }}
                    >
                      + Add Service Line
                    </button>
                  </div>

                  <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden', marginBottom: 14 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                      <thead>
                        <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#64748B' }}>
                          <th style={{ padding: '8px 12px' }}>NDIS Support Item</th>
                          <th style={{ padding: '8px 12px', width: 100 }}>Hours/Wk</th>
                          <th style={{ padding: '8px 12px', width: 110 }}>Agreed Rate</th>
                          <th style={{ padding: '8px 12px', width: 110 }}>Weekly Est.</th>
                          <th style={{ padding: '8px 12px', width: 40 }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {scheduleItems.map((item: any, idx: number) => {
                          const weeklyTotal = (Number(item.hours_pw || 0) * Number(item.agreed_rate || 0)).toFixed(2);
                          return (
                            <tr key={idx} style={{ borderBottom: '1px solid #EEF2F6' }}>
                              <td style={{ padding: '6px 12px' }}>
                                <select
                                  value={item.item_code}
                                  onChange={(e) => {
                                    const match = NDIS_SERVICES.find((s) => s.code === e.target.value);
                                    if (match) {
                                      updateScheduleItem(idx, 'item_code', match.code);
                                      updateScheduleItem(idx, 'description', match.description);
                                      updateScheduleItem(idx, 'agreed_rate', match.refRate);
                                    }
                                  }}
                                  className="crmFormSelect"
                                  style={{ minHeight: 36, padding: '4px 8px', fontSize: '0.8125rem' }}
                                >
                                  {NDIS_SERVICES.map((ns) => (
                                    <option key={ns.code} value={ns.code}>
                                      {ns.description} ({ns.code})
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td style={{ padding: '6px 12px' }}>
                                <input
                                  type="number"
                                  step="0.5"
                                  min="0"
                                  value={item.hours_pw}
                                  onChange={(e) => updateScheduleItem(idx, 'hours_pw', parseFloat(e.target.value) || 0)}
                                  className="crmFormInput"
                                  style={{ minHeight: 36, padding: '4px 8px', fontSize: '0.8125rem' }}
                                />
                              </td>
                              <td style={{ padding: '6px 12px' }}>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.agreed_rate}
                                  onChange={(e) => updateScheduleItem(idx, 'agreed_rate', parseFloat(e.target.value) || 0)}
                                  className="crmFormInput"
                                  style={{ minHeight: 36, padding: '4px 8px', fontSize: '0.8125rem' }}
                                />
                              </td>
                              <td style={{ padding: '6px 12px', fontWeight: 600, color: '#0F172A' }}>
                                ${weeklyTotal}
                              </td>
                              <td style={{ padding: '6px 12px' }}>
                                {scheduleItems.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeScheduleRow(idx)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
                                  >
                                    <X size={14} />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748B' }}>Estimated Annual Budget Commitment (52 Weeks):</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>${totalAnnualBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>

                  {/* Consents */}
                  <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Checkbox
                      checked={transportIncluded}
                      onChange={setTransportIncluded}
                      label="Include Transport Assistance Schedule"
                      description="Authorizes travel allowances and mileage billing under standard NDIS price limits."
                    />
                    <Checkbox
                      checked={mediaConsent}
                      onChange={setMediaConsent}
                      label="Include Photography & Media Consent Schedule"
                      description="Optional consent for Opus Care community stories and updates."
                    />
                  </div>
                </div>
              )}

              {/* WORKER / CONTRACTOR TERMS */}
              {ownerType !== 'participant' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <FormField label="Classification / Award Level">
                      <TextInput
                        value={workerClassification}
                        onChange={(e) => setWorkerClassification(e.target.value)}
                        placeholder="Level 2 Support Worker"
                      />
                    </FormField>

                    <FormField label="Employment Basis">
                      <select
                        value={workerBasis}
                        onChange={(e) => setWorkerBasis(e.target.value as any)}
                        className="crmFormSelect"
                      >
                        <option value="casual">Casual (25% loading included)</option>
                        <option value="part_time">Part-Time (Permanent contracted hours)</option>
                        <option value="full_time">Full-Time (38 hrs/wk standard)</option>
                      </select>
                    </FormField>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <FormField label="Base Hourly Rate ($ AUD)" required>
                      <TextInput
                        type="number"
                        step="0.5"
                        value={workerRate}
                        onChange={(e) => setWorkerRate(parseFloat(e.target.value) || 0)}
                      />
                    </FormField>

                    <FormField label="Superannuation Guarantee (%)">
                      <TextInput
                        type="number"
                        step="0.1"
                        value={superRate}
                        onChange={(e) => setSuperRate(parseFloat(e.target.value) || 0)}
                      />
                    </FormField>
                  </div>

                  <Checkbox
                    checked={includeRestraintClause}
                    onChange={setIncludeRestraintClause}
                    label="Include Non-Solicitation & Restraint Clause (Fair Work Act compliant)"
                    description="12-month post-employment restraint prohibiting direct solicitation of Opus Care participants."
                  />
                </div>
              )}

              {/* Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 10 }}>
                <FormField label="Commencement Date" required>
                  <DatePicker
                    value={commencementDate}
                    onChange={(e) => setCommencementDate(e.target.value)}
                  />
                </FormField>

                <FormField label="Annual Review Date">
                  <DatePicker
                    value={reviewDate}
                    onChange={(e) => setReviewDate(e.target.value)}
                  />
                </FormField>

                <FormField label="Expiry Date">
                  <DatePicker
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                  />
                </FormField>
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW & SIGN */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <h4 className="crmCardTitle" style={{ margin: '0 0 4px' }}>Step 4: Review & Sign</h4>
                <p className="crmBodyText" style={{ margin: 0, fontSize: '0.875rem', color: '#64748B' }}>
                  Review agreement terms and complete execution with compliant digital signature.
                </p>
              </div>

              <ReviewSummary
                sections={[
                  {
                    title: 'Contract Details',
                    fields: [
                      { label: 'Document Template', value: selectedTemplate },
                      { label: 'Recipient Name', value: recipientName },
                      { label: 'Commencement Date', value: commencementDate },
                      {
                        label: 'Total Value / Rate',
                        value: ownerType === 'participant' ? `$${totalAnnualBudget.toLocaleString()} / year` : `$${workerRate} / hour`,
                      },
                    ],
                  },
                ]}
              />

              {/* Digital Signature Canvas */}
              <div
                style={{
                  background: '#F8FAFC',
                  border: '1.5px solid #CBD5E1',
                  borderRadius: 10,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <PenTool size={18} style={{ color: '#0284C7' }} />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0F172A' }}>
                      Digital Signature Canvas ({ownerType === 'participant' ? 'Participant / Guardian' : 'Support Worker'})
                    </span>
                  </div>
                  {hasDrawn && (
                    <button
                      type="button"
                      onClick={clearCanvas}
                      style={{ background: 'none', border: 'none', color: '#DC2626', fontSize: '0.78rem', cursor: 'pointer' }}
                    >
                      Clear Canvas
                    </button>
                  )}
                </div>

                <div
                  style={{
                    background: '#FFFFFF',
                    border: '1.5px dashed #CBD5E1',
                    borderRadius: 8,
                    overflow: 'hidden',
                    height: 140,
                    cursor: 'crosshair',
                  }}
                >
                  <canvas
                    ref={canvasRef}
                    width={760}
                    height={140}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    style={{ width: '100%', height: '100%', display: 'block' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <FormField label="Signatory Name">
                    <TextInput
                      value={signerName || recipientName}
                      onChange={(e) => setSignerName(e.target.value)}
                      placeholder="Signatory Name"
                    />
                  </FormField>
                  <FormField label="Signatory Capacity">
                    <TextInput
                      value={signerTitle}
                      onChange={(e) => setSignerTitle(e.target.value)}
                      placeholder="e.g. Participant / Support Worker"
                    />
                  </FormField>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid #E2E8F0',
            background: '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((prev) => Math.max(prev - 1, 1) as any)}
                className="crmSecondaryBtn"
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
                onClick={() => setStep((prev) => Math.min(prev + 1, 4) as any)}
                className="crmActionBtnPrimary"
              >
                <span>Continue</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <>
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
                  style={{ background: '#059669' }}
                >
                  {submitting ? (
                    <span>Executing Agreement...</span>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Execute & Activate</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
