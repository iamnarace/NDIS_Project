'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  FileText,
  UserCheck,
  Users,
  Check,
  PenTool,
  Lock,
  Calendar,
  AlertCircle,
  Plus,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import {
  FormDrawer,
  DrawerHeader,
  FormStepper,
  FormSection,
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
  FormGrid2,
  FormSummaryCard,
  FormError,
  StickyFormFooter,
} from '@/components/admin/forms';

interface AgreementGeneratorModalProps {
  participants: any[];
  staff: any[];
  onClose: () => void;
  onCreated: (newAgreement: any) => void;
  initialTemplateCode?: string;
  variationOf?: any;
  draftAgreement?: any;
}

const DEFAULT_SUPPORT_ITEMS = [
  { code: '01_011_0107_1_1', description: 'Assistance with Self-Care Activities - Standard - Weekday Daytime', refRate: 73.58, defaultHours: 6.0, category: 'Core' },
  { code: '04_104_0125_6_1', description: 'Access Community Social and Rec Activities - Standard - Weekday Daytime', refRate: 73.58, defaultHours: 4.0, category: 'Capacity Building' },
  { code: '01_020_0120_1_1', description: 'House Cleaning and Other Household Activities', refRate: 60.10, defaultHours: 2.0, category: 'Core' },
  { code: '01_019_0120_1_1', description: 'House or Yard Maintenance', refRate: 59.01, defaultHours: 2.0, category: 'Core' },
  { code: '01_013_0107_1_1', description: 'Assistance with Self-Care Activities - Standard - Saturday', refRate: 103.54, defaultHours: 3.0, category: 'Core' },
  { code: '02_051_0108_1_1', description: 'Transport (Specialised / Plan-Agreed)', refRate: 0.00, defaultHours: 1.0, category: 'Capital' },
];

export default function AgreementGeneratorModal({
  participants,
  staff,
  onClose,
  onCreated,
  initialTemplateCode = 'PACK-PART-01',
  variationOf = null,
  draftAgreement = null,
}: AgreementGeneratorModalProps) {
  const sourceAgreement = draftAgreement || variationOf;
  const [step, setStep] = useState<number>(sourceAgreement ? 3 : 1);

  // Loaded support catalogue items
  const [supportCatalogue, setSupportCatalogue] = useState<any[]>(DEFAULT_SUPPORT_ITEMS);
  const [pricingLoaded, setPricingLoaded] = useState(false);

  // Template & Owner Type
  const [ownerType, setOwnerType] = useState<'participant' | 'staff' | 'contractor'>(
    sourceAgreement
      ? sourceAgreement.owner_type
      : initialTemplateCode.includes('WRK')
      ? 'staff'
      : initialTemplateCode.includes('CTR')
      ? 'contractor'
      : 'participant'
  );

  const [selectedTemplate, setSelectedTemplate] = useState<string>(
    sourceAgreement ? sourceAgreement.template?.template_code || 'DOC-PART-01' : initialTemplateCode
  );

  // Selected owner state
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>(
    sourceAgreement ? sourceAgreement.owner_id : ''
  );

  // Recipient info
  const [recipientName, setRecipientName] = useState<string>(
    sourceAgreement?.questionnaire_data?.participant_name ||
      sourceAgreement?.questionnaire_data?.worker_name ||
      ''
  );
  const [ndisNumber, setNdisNumber] = useState<string>(sourceAgreement?.questionnaire_data?.ndis_number || '');
  const [fundingType, setFundingType] = useState<string>(
    sourceAgreement?.questionnaire_data?.funding_type || ''
  );
  const [planManagerName, setPlanManagerName] = useState<string>(
    sourceAgreement?.questionnaire_data?.plan_manager_name || ''
  );
  const [planManagerEmail, setPlanManagerEmail] = useState<string>(
    sourceAgreement?.questionnaire_data?.plan_manager_email || ''
  );

  // Dates
  const [commencementDate, setCommencementDate] = useState<string>(
    sourceAgreement?.commencement_date || new Date().toISOString().split('T')[0]
  );
  const [reviewDate, setReviewDate] = useState<string>(
    sourceAgreement?.review_date ||
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  // Schedule of Supports items
  const [scheduleItems, setScheduleItems] = useState<any[]>(
    sourceAgreement?.compiled_clauses?.service_schedule || [
      {
        item_code: '01_011_0107_1_1',
        description: 'Assistance with Self-Care Activities - Standard - Weekday Daytime',
        hours_pw: 6.0,
        agreed_rate: 73.58,
      },
      {
        item_code: '04_104_0125_6_1',
        description: 'Access Community Social and Rec Activities - Standard - Weekday Daytime',
        hours_pw: 4.0,
        agreed_rate: 73.58,
      },
    ]
  );

  const [travelNonLabourCap, setTravelNonLabourCap] = useState<number>(
    sourceAgreement?.questionnaire_data?.travel_non_labour_cap ?? 1200
  );
  const [transportIncluded, setTransportIncluded] = useState<boolean>(
    sourceAgreement?.questionnaire_data?.transport_included ?? true
  );
  const [mediaConsent, setMediaConsent] = useState<boolean>(
    sourceAgreement?.questionnaire_data?.media_consent ?? false
  );

  // Workforce & Contractor fields
  const [workerClassification, setWorkerClassification] = useState(
    sourceAgreement?.questionnaire_data?.worker_classification || 'Disability Support Worker (Level 2)'
  );
  const [workerBasis, setWorkerBasis] = useState<'full_time' | 'part_time' | 'casual'>(
    sourceAgreement?.questionnaire_data?.worker_basis || 'casual'
  );
  const [workerRate, setWorkerRate] = useState<number>(
    sourceAgreement?.questionnaire_data?.hourly_rate || 38.50
  );
  const [superRate, setSuperRate] = useState<number>(
    sourceAgreement?.questionnaire_data?.super_rate_pct || 12.00
  );
  const [workerAgreedHours, setWorkerAgreedHours] = useState<number>(
    sourceAgreement?.questionnaire_data?.agreed_weekly_hours || 20
  );

  // Execution & Signature State
  const [executeNow, setExecuteNow] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [signerTitle, setSignerTitle] = useState('Recipient / Participant');
  const [providerSignerName, setProviderSignerName] = useState('Naresh Admin');
  const [isProprietorConfigured, setIsProprietorConfigured] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Check legal contracting identity configuration
  useEffect(() => {
    async function checkProviderConfig() {
      try {
        const res = await fetch('/api/crm/provider-config');
        if (res.ok) {
          const cfg = await res.json();
          setIsProprietorConfigured(Boolean(cfg?.proprietor_legal_name && cfg.proprietor_legal_name.trim().length > 0));
        }
      } catch (err) {
        console.error('Could not check provider config', err);
      }
    }
    checkProviderConfig();
  }, []);

  // Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Fetch live support items from database catalogue
  useEffect(() => {
    async function loadCatalogue() {
      try {
        const res = await fetch('/api/billing/support-items');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.items) && data.items.length > 0) {
            const mapped = data.items.map((item: any) => ({
              code: item.support_item_code,
              description: item.support_item_name,
              refRate: Number(item.reference_rate) || 73.58,
              defaultHours: 4.0,
              category: item.category || 'Core',
            }));
            setSupportCatalogue(mapped);
            setPricingLoaded(true);
          }
        }
      } catch (err) {
        console.error('Could not load support items catalogue', err);
      }
    }
    loadCatalogue();
  }, []);

  // When owner is selected from dropdown, update form defaults
  const handleOwnerSelect = (ownerId: string) => {
    setSelectedOwnerId(ownerId);
    if (ownerType === 'participant') {
      const part = participants.find((p) => p.id === ownerId);
      if (part) {
        setRecipientName(part.name);
        setNdisNumber(part.ndisNumber || '');
        setFundingType(part.fundingType || '');
        setPlanManagerName(part.planManager || '');
        setSignerName(part.name);
      }
    } else {
      const w = staff.find((s) => s.id === ownerId);
      if (w) {
        setRecipientName(w.name);
        setWorkerRate(w.hourlyRate || 38.50);
        setSignerName(w.name);
      }
    }
  };

  // Schedule Calculations
  const calculatedDurationWeeks = useMemo(() => {
    if (!commencementDate || !reviewDate) return 52;
    const start = new Date(commencementDate).getTime();
    const end = new Date(reviewDate).getTime();
    const diffDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
    return Math.max(1, Math.round(diffDays / 7));
  }, [commencementDate, reviewDate]);

  const totalWeeklyHours = useMemo(() => {
    return scheduleItems.reduce((acc, item) => acc + (Number(item.hours_pw) || 0), 0);
  }, [scheduleItems]);

  const totalLabourValue = useMemo(() => {
    return scheduleItems.reduce((acc, item) => {
      const hrs = Number(item.hours_pw) || 0;
      const rate = Number(item.agreed_rate) || 0;
      return acc + hrs * rate * calculatedDurationWeeks;
    }, 0);
  }, [scheduleItems, calculatedDurationWeeks]);

  const totalAgreementBudget = useMemo(() => {
    if (ownerType === 'participant') {
      return totalLabourValue + Number(travelNonLabourCap || 0);
    }
    return Number(workerRate || 0) * Number(workerAgreedHours || 0) * calculatedDurationWeeks;
  }, [ownerType, totalLabourValue, travelNonLabourCap, workerRate, workerAgreedHours, calculatedDurationWeeks]);

  // Stepper items based on owner type
  const steps = useMemo(() => {
    if (ownerType === 'participant') {
      return [
        { num: 1, label: 'Recipient' },
        { num: 2, label: 'Agreement Details' },
        { num: 3, label: 'Support Items' },
        { num: 4, label: 'Schedule' },
        { num: 5, label: 'Review & Sign' },
      ];
    }
    return [
      { num: 1, label: 'Recipient & Role' },
      { num: 2, label: 'Engagement Basis' },
      { num: 3, label: 'Classification & Rate' },
      { num: 4, label: 'Clearances & Terms' },
      { num: 5, label: 'Review & Sign' },
    ];
  }, [ownerType]);

  // Support item row actions
  const addSupportItem = (code: string) => {
    const found = supportCatalogue.find((c) => c.code === code);
    if (!found) return;
    setScheduleItems((prev) => [
      ...prev,
      {
        item_code: found.code,
        description: found.description,
        hours_pw: found.defaultHours,
        agreed_rate: found.refRate,
      },
    ]);
  };

  const removeSupportItem = (index: number) => {
    setScheduleItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateSupportItem = (index: number, field: string, val: any) => {
    setScheduleItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0F172A';
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const validateStep = (s: number): boolean => {
    setError('');
    if (s === 1) {
      if (!selectedOwnerId) {
        setError(`Please select a ${ownerType === 'participant' ? 'participant' : 'support worker'} to continue.`);
        return false;
      }
    }
    if (s === 2 && ownerType === 'participant') {
      if (!commencementDate) {
        setError('Agreement commencement date is required.');
        return false;
      }
    }
    if (s === 3 && ownerType === 'participant') {
      if (scheduleItems.length === 0) {
        setError('At least one NDIS support item must be included in the schedule.');
        return false;
      }
    }
    if (s === 5 && executeNow) {
      if (!isProprietorConfigured) {
        setError('Complete the legal contracting identity in Organisation Settings before executing this agreement.');
        return false;
      }
      if (!signerName.trim()) {
        setError('Signer name is required to execute agreement.');
        return false;
      }
      if (!hasDrawn) {
        setError('A drawn digital signature is required to execute immediately.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const handleBack = () => {
    setError('');
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (saveAsDraftOnly: boolean = false) => {
    if (!saveAsDraftOnly && !validateStep(step)) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const isPart = ownerType === 'participant';
      const shouldExecute = !saveAsDraftOnly && executeNow && hasDrawn;

      const agreementPayload: any = {
        ...(draftAgreement ? { id: draftAgreement.id } : {}),
        title:
          sourceAgreement?.title ||
          (isPart
            ? `NDIS Service Agreement & Schedule of Supports - ${recipientName}`
            : `Workforce Support Agreement - ${recipientName}`),
        template_id:
          sourceAgreement?.template_id ||
          (isPart
            ? 'f11ede83-fc58-4171-a6ab-d5751f4c6807'
            : ownerType === 'contractor'
            ? 'd58eaf68-c545-4606-8ca2-a31a04caca8c'
            : 'b17b956a-0802-4fb3-a034-fd3a1668fa98'),
        owner_type: ownerType,
        owner_id: selectedOwnerId,
        commencement_date: commencementDate,
        review_date: reviewDate,
        expiry_date: reviewDate,
        estimated_budget: totalAgreementBudget,
        status: shouldExecute ? 'fully_signed' : 'draft',
        compiled_clauses: isPart
          ? {
              service_schedule: scheduleItems,
              cancellation_window_days: 2,
              duration_weeks: calculatedDurationWeeks,
            }
          : {
              basis: workerBasis,
              classification: workerClassification,
              hourly_rate: workerRate,
              super_pct: superRate,
            },
        questionnaire_data: isPart
          ? {
              participant_name: recipientName,
              ndis_number: ndisNumber,
              funding_type: fundingType,
              plan_manager_name: fundingType === 'Plan-Managed' ? planManagerName : null,
              plan_manager_email: fundingType === 'Plan-Managed' ? planManagerEmail : null,
              transport_included: transportIncluded,
              media_consent: mediaConsent,
              travel_non_labour_cap: travelNonLabourCap,
              duration_weeks: calculatedDurationWeeks,
            }
          : {
              worker_name: recipientName,
              worker_classification: workerClassification,
              worker_basis: workerBasis,
              hourly_rate: workerRate,
              super_rate_pct: superRate,
              agreed_weekly_hours: workerAgreedHours,
            },
        ...(variationOf
          ? {
              is_variation: true,
              prior_agreement_id: variationOf.id,
            }
          : {}),
      };

      const res = await fetch('/api/crm/agreements', {
        method: draftAgreement ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agreementPayload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save agreement record.');
        return;
      }

      const savedAgr = data.agreement;
      let finalAgreement = savedAgr;

      // Handle dual signing if executeNow is active
      if (shouldExecute && savedAgr && canvasRef.current) {
        const sigData = canvasRef.current.toDataURL('image/png');

        // 1. Recipient Signature
        const recipientSignRes = await fetch('/api/crm/agreements/sign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agreement_id: savedAgr.id,
            signer_type: ownerType,
            signer_name: signerName.trim() || recipientName,
            signer_title: signerTitle,
            signing_method: 'digital_canvas',
            signature_image_data: sigData,
          }),
        });

        const recSignData = await recipientSignRes.json();
        if (!recipientSignRes.ok) {
          setError(recSignData.message || 'Agreement saved, but recipient signature could not be verified.');
          return;
        }

        // 2. Provider Rep Signature
        const providerSignRes = await fetch('/api/crm/agreements/sign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agreement_id: savedAgr.id,
            signer_type: 'provider_rep',
            signer_name: providerSignerName,
            signer_title: 'Managing Director, Opus Care Support Services',
            signing_method: 'digital_canvas',
          }),
        });

        const provSignData = await providerSignRes.json();
        if (!providerSignRes.ok || !provSignData.is_fully_signed) {
          setError(provSignData.message || 'Recipient signature recorded, but provider execution could not be finalized.');
          return;
        }

        finalAgreement = provSignData.agreement;
      }

      onCreated(finalAgreement);
      onClose();
    } catch (err: unknown) {
      setError('Network communication error while executing agreement.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormDrawer isOpen onClose={onClose} wide>
      <DrawerHeader
        title={
          draftAgreement
            ? 'Continue Draft Agreement'
            : variationOf
            ? `Agreement Variation (v${(variationOf.version_number || 1) + 1})`
            : ownerType === 'participant'
            ? 'New Service Agreement'
            : 'New Workforce Agreement'
        }
        description={
          ownerType === 'participant'
            ? 'Create a schedule of supports compliant with NDIS Pricing Arrangements.'
            : 'Generate employment or contractor terms with verified compliance.'
        }
        onClose={onClose}
        badge={
          <span className="compliance-pill">
            {pricingLoaded ? 'Pricing Reference Loaded' : 'Verified Catalogue Active'}
          </span>
        }
      />

      <FormStepper
        steps={steps}
        currentStep={step}
        onStepClick={(num) => {
          if (num < step) setStep(num);
        }}
      />

      <div className="drawer-body">
        {error && <FormError message={error} onDismiss={() => setError('')} />}

        {/* STEP 1: RECIPIENT & DOCUMENT TYPE */}
        {step === 1 && (
          <div>
            <FormSection title="1. Agreement Target & Recipient">
              {!sourceAgreement && (
                <FormField label="Agreement Type" required id="agrType">
                  <FormSelect
                    id="agrType"
                    value={ownerType}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setOwnerType(val);
                      setSelectedOwnerId('');
                      setRecipientName('');
                    }}
                  >
                    <option value="participant">Participant Service Agreement &amp; Schedule of Supports</option>
                    <option value="staff">Direct Support Worker Employment Contract (PAYG)</option>
                    <option value="contractor">Independent Support Contractor Agreement (ABN)</option>
                  </FormSelect>
                </FormField>
              )}

              <div style={{ marginTop: 16 }}>
                <FormField
                  label={`Select ${ownerType === 'participant' ? 'Participant' : 'Support Worker'}`}
                  required
                  hint={
                    ownerType === 'participant'
                      ? 'Only registered participants with active records can be selected.'
                      : 'Verified staff members from the workforce directory.'
                  }
                  id="agrOwner"
                >
                  <FormSelect
                    id="agrOwner"
                    value={selectedOwnerId}
                    onChange={(e) => handleOwnerSelect(e.target.value)}
                  >
                    <option value="">
                      -- Choose {ownerType === 'participant' ? 'Participant' : 'Worker'} --
                    </option>
                    {ownerType === 'participant'
                      ? participants.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} {p.ndisNumber ? `(NDIS #${p.ndisNumber})` : ''} - {p.suburb || 'Location not recorded'}
                          </option>
                        ))
                      : staff.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.role || 'Support Worker'}) - ${s.hourlyRate || 38.50}/hr
                          </option>
                        ))}
                  </FormSelect>
                </FormField>
              </div>

              {selectedOwnerId && (
                <div
                  style={{
                    marginTop: 16,
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-canvas)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Selected Recipient Record
                  </span>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-heading)' }}>
                    {recipientName}
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                    {ownerType === 'participant'
                      ? `NDIS #: ${ndisNumber || 'Not recorded'} • Funding: ${fundingType}`
                      : `Classification: ${workerClassification} • Base: $${workerRate}/hr`}
                  </div>
                </div>
              )}
            </FormSection>
          </div>
        )}

        {/* STEP 2: DETAILS & DATES */}
        {step === 2 && (
          <div>
            {ownerType === 'participant' ? (
              <FormSection title="2. Agreement Schedule & Funding Details">
                <FormGrid2>
                  <FormField label="Agreement Start Date" required id="agrStart">
                    <FormInput
                      id="agrStart"
                      type="date"
                      value={commencementDate}
                      onChange={(e) => setCommencementDate(e.target.value)}
                    />
                  </FormField>

                  <FormField label="Agreement Review Date" required id="agrEnd">
                    <FormInput
                      id="agrEnd"
                      type="date"
                      value={reviewDate}
                      onChange={(e) => setReviewDate(e.target.value)}
                    />
                  </FormField>
                </FormGrid2>

                <div style={{ marginTop: 16 }}>
                  <FormField label="NDIS Funding Type" required id="agrFunding">
                    <FormSelect
                      id="agrFunding"
                      value={fundingType}
                      onChange={(e) => setFundingType(e.target.value)}
                    >
                      <option value="Plan-Managed">Plan-Managed (Invoices issued to registered Plan Manager)</option>
                      <option value="Self-Managed">Self-Managed (Participant / Nominee pays directly)</option>
                      <option value="NDIA-Managed">Agency / NDIA-Managed</option>
                    </FormSelect>
                  </FormField>
                </div>

                {fundingType === 'Plan-Managed' && (
                  <FormGrid2 style={{ marginTop: 16 }}>
                    <FormField label="Plan Management Agency" id="agrPmName">
                      <FormInput
                        id="agrPmName"
                        value={planManagerName}
                        onChange={(e) => setPlanManagerName(e.target.value)}
                        placeholder="e.g. Plan Partners"
                      />
                    </FormField>

                    <FormField label="Plan Manager Invoice Email" id="agrPmEmail">
                      <FormInput
                        id="agrPmEmail"
                        type="email"
                        value={planManagerEmail}
                        onChange={(e) => setPlanManagerEmail(e.target.value)}
                        placeholder="invoices@planpartners.com.au"
                      />
                    </FormField>
                  </FormGrid2>
                )}
              </FormSection>
            ) : (
              <FormSection title="2. Engagement Terms & Employment Basis">
                <FormField label="Employment Basis" required id="wBasis">
                  <FormSelect
                    id="wBasis"
                    value={workerBasis}
                    onChange={(e) => setWorkerBasis(e.target.value as any)}
                  >
                    <option value="casual">Casual (includes 25% casual loading under SCHADS Award)</option>
                    <option value="part_time">Part-Time (Guaranteed weekly minimum hours)</option>
                    <option value="full_time">Full-Time (38.0 hours standard weekly)</option>
                  </FormSelect>
                </FormField>

                <FormGrid2 style={{ marginTop: 16 }}>
                  <FormField label="Agreed Weekly Hours" required id="wHours">
                    <FormInput
                      id="wHours"
                      type="number"
                      value={workerAgreedHours}
                      onChange={(e) => setWorkerAgreedHours(Number(e.target.value) || 0)}
                    />
                  </FormField>

                  <FormField label="Commencement Date" required id="wStart">
                    <FormInput
                      id="wStart"
                      type="date"
                      value={commencementDate}
                      onChange={(e) => setCommencementDate(e.target.value)}
                    />
                  </FormField>
                </FormGrid2>
              </FormSection>
            )}
          </div>
        )}

        {/* STEP 3: SUPPORT ITEMS / CLASSIFICATION */}
        {step === 3 && (
          <div>
            {ownerType === 'participant' ? (
              <FormSection title="3. Support Categories & NDIS Item Selection">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-heading)' }}>
                      Included Support Items ({scheduleItems.length})
                    </span>
                    <FormSelect
                      style={{ width: 'auto', minWidth: 260, padding: '6px 12px', fontSize: 12.5 }}
                      onChange={(e) => {
                        if (e.target.value) {
                          addSupportItem(e.target.value);
                          e.target.value = '';
                        }
                      }}
                    >
                      <option value="">+ Add Support Item From Catalogue...</option>
                      {supportCatalogue.map((item) => (
                        <option key={item.code} value={item.code}>
                          [{item.code}] {item.description} (${item.refRate}/hr)
                        </option>
                      ))}
                    </FormSelect>
                  </div>

                  {scheduleItems.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px 14px',
                        background: '#F8FAFC',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand-primary)', fontFamily: 'monospace' }}>
                            {item.item_code}
                          </span>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-heading)' }}>
                            {item.description}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSupportItem(idx)}
                          style={{ background: 'none', border: 'none', color: 'var(--status-rose)', cursor: 'pointer', padding: 4 }}
                          title="Remove item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <FormGrid2>
                        <FormField label="Allocated Weekly Hours" id={`hrs_${idx}`}>
                          <FormInput
                            id={`hrs_${idx}`}
                            type="number"
                            step="0.5"
                            value={item.hours_pw}
                            onChange={(e) => updateSupportItem(idx, 'hours_pw', Number(e.target.value))}
                          />
                        </FormField>

                        <FormField label="Agreed Rate ($ / hr)" id={`rate_${idx}`}>
                          <FormInput
                            id={`rate_${idx}`}
                            type="number"
                            step="0.01"
                            value={item.agreed_rate}
                            onChange={(e) => updateSupportItem(idx, 'agreed_rate', Number(e.target.value))}
                          />
                        </FormField>
                      </FormGrid2>
                    </div>
                  ))}

                  <div style={{ marginTop: 10 }}>
                    <FormField label="Travel & Non-Labour Cap ($ AUD)" hint="Allowance cap for provider travel under NDIA guidelines" id="agrTravel">
                      <FormInput
                        id="agrTravel"
                        type="number"
                        value={travelNonLabourCap}
                        onChange={(e) => setTravelNonLabourCap(Number(e.target.value) || 0)}
                      />
                    </FormField>
                  </div>
                </div>
              </FormSection>
            ) : (
              <FormSection title="3. Worker Classification & Remuneration">
                <FormField label="Classification Title" required id="wClass">
                  <FormSelect
                    id="wClass"
                    value={workerClassification}
                    onChange={(e) => setWorkerClassification(e.target.value)}
                  >
                    <option value="Disability Support Worker (Level 2)">Disability Support Worker (Level 2)</option>
                    <option value="Senior Support Worker (Level 3)">Senior Support Worker (Level 3)</option>
                    <option value="Support Coordinator (Level 4)">Support Coordinator (Level 4)</option>
                    <option value="Care Team Lead (Level 5)">Care Team Lead (Level 5)</option>
                  </FormSelect>
                </FormField>

                <FormGrid2 style={{ marginTop: 16 }}>
                  <FormField label="Base Hourly Rate ($ AUD)" required id="wRate">
                    <FormInput
                      id="wRate"
                      type="number"
                      step="0.50"
                      value={workerRate}
                      onChange={(e) => setWorkerRate(Number(e.target.value) || 0)}
                    />
                  </FormField>

                  <FormField label="Superannuation Contribution (%)" id="wSuper">
                    <FormInput
                      id="wSuper"
                      type="number"
                      step="0.25"
                      value={superRate}
                      onChange={(e) => setSuperRate(Number(e.target.value) || 0)}
                    />
                  </FormField>
                </FormGrid2>
              </FormSection>
            )}
          </div>
        )}

        {/* STEP 4: SCHEDULE & ALLOCATION SUMMARY */}
        {step === 4 && (
          <div>
            {ownerType === 'participant' ? (
              <FormSection title="4. Support Schedule & Live Calculation">
                {/* Live Funding Calculation Summary Card */}
                <FormSummaryCard
                  title={`Schedule Budget Estimate (${calculatedDurationWeeks} Weeks)`}
                  badge="Standard NDIS Price Limit"
                  rows={[
                    { label: 'Weekly Allocated Hours:', value: `${totalWeeklyHours.toFixed(1)} hrs / week` },
                    { label: 'Total Estimated Hours:', value: `${(totalWeeklyHours * calculatedDurationWeeks).toFixed(1)} hrs` },
                    { label: 'Labour Value:', value: `$${totalLabourValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
                    { label: 'Travel & Non-Labour Cap:', value: `$${Number(travelNonLabourCap || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
                  ]}
                  totalLabel="Total Agreement Value"
                  totalValue={`$${totalAgreementBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                />

                <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={transportIncluded}
                      onChange={(e) => setTransportIncluded(e.target.checked)}
                      style={{ width: 16, height: 16, accentColor: 'var(--brand-primary)' }}
                    />
                    <span>Activity-Based Transport included and approved</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={mediaConsent}
                      onChange={(e) => setMediaConsent(e.target.checked)}
                      style={{ width: 16, height: 16, accentColor: 'var(--brand-primary)' }}
                    />
                    <span>Media &amp; Photographic Consent recorded</span>
                  </label>
                </div>
              </FormSection>
            ) : (
              <FormSection title="4. Contractual Clearances & Award Terms">
                <FormSummaryCard
                  title={`Contractual Estimate (${calculatedDurationWeeks} Weeks)`}
                  badge="SCHADS Award Basis"
                  rows={[
                    { label: 'Classification:', value: workerClassification },
                    { label: 'Employment Basis:', value: workerBasis.toUpperCase() },
                    { label: 'Base Hourly Rate:', value: `$${workerRate.toFixed(2)} AUD / hr` },
                    { label: 'Agreed Weekly Commitment:', value: `${workerAgreedHours} hrs / week` },
                    { label: 'Statutory Superannuation:', value: `${superRate}% SGC` },
                  ]}
                  totalLabel="Annualized Commitment"
                  totalValue={`$${totalAgreementBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                />
              </FormSection>
            )}
          </div>
        )}

        {/* STEP 5: REVIEW & SIGN */}
        {step === 5 && (
          <FormSection title="5. Review & Execution">
            <FormSummaryCard
              title={
                ownerType === 'participant'
                  ? `NDIS Service Agreement - ${recipientName}`
                  : `Workforce Support Contract - ${recipientName}`
              }
              badge="Ready for Execution"
              rows={[
                { label: 'Recipient Name:', value: recipientName },
                { label: 'Commencement Date:', value: commencementDate },
                { label: 'Review Date:', value: reviewDate },
                {
                  label: 'Financial Commitment:',
                  value: `$${totalAgreementBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AUD`,
                },
              ]}
            />

            <div style={{ marginTop: 20 }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: 'var(--text-heading)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: executeNow ? 'var(--brand-subtle)' : 'var(--bg-canvas)',
                  border: `1px solid ${executeNow ? 'var(--brand-primary)' : 'var(--border)'}`,
                }}
              >
                <input
                  type="checkbox"
                  checked={executeNow}
                  onChange={(e) => setExecuteNow(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: 'var(--brand-primary)' }}
                />
                <span>Execute &amp; Sign Digitally Now (Record signatures and mark Active)</span>
              </label>
            </div>

            {executeNow && !isProprietorConfigured && (
              <div
                style={{
                  marginTop: 14,
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#B91C1C',
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>
                  <strong>Execution Blocked:</strong> Complete the legal contracting identity in Organisation Settings before executing this agreement.
                </span>
              </div>
            )}

            {executeNow && (
              <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <FormGrid2>
                  <FormField label="Signer Name" required id="sigName">
                    <FormInput
                      id="sigName"
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                      placeholder="Signer Full Legal Name"
                    />
                  </FormField>

                  <FormField label="Signer Title / Role" required id="sigTitle">
                    <FormInput
                      id="sigTitle"
                      value={signerTitle}
                      onChange={(e) => setSignerTitle(e.target.value)}
                    />
                  </FormField>
                </FormGrid2>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label className="form-label">
                      Digital Signature Canvas <span className="req">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={clearSignature}
                      style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Clear Signature
                    </button>
                  </div>
                  <canvas
                    ref={canvasRef}
                    width={560}
                    height={140}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    style={{
                      width: '100%',
                      height: 140,
                      background: '#FFFFFF',
                      border: '2px dashed var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'crosshair',
                      touchAction: 'none',
                    }}
                  />
                  <span className="helper-text">Draw signature using trackpad, mouse, or touch device.</span>
                </div>
              </div>
            )}
          </FormSection>
        )}
      </div>

      <StickyFormFooter
        onCancel={onClose}
        onSecondary={() => handleSubmit(true)}
        secondaryLabel="Save Draft"
        secondaryDisabled={submitting}
        onPrimary={step < 5 ? handleNext : () => handleSubmit(false)}
        primaryDisabled={step === 5 && executeNow && !isProprietorConfigured}
        primaryLabel={
          step < 5
            ? `Next: ${steps[step].label}`
            : executeNow
            ? 'Execute & Activate'
            : 'Save Agreement'
        }
        primaryIcon={step === 5 && executeNow ? <PenTool size={15} /> : step === 5 ? <Check size={15} /> : undefined}
        showArrow={step < 5}
        loading={submitting}
      />
    </FormDrawer>
  );
}
