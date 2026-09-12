'use client';

import React, { useState, useEffect } from 'react';
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
  StickyFormFooter,
  FormError,
  FormSummaryCard,
} from '@/components/admin/forms';
import { Shield, AlertTriangle, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { checkServiceArea } from '@/lib/regions';

interface SuitabilityAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  referral?: any;
  participant?: any;
  onSuccess: (assessment: any) => void;
}

const WIZARD_STEPS = [
  { num: 1, label: 'Identity & Age' },
  { num: 2, label: 'Location & Region' },
  { num: 3, label: 'Funding & Payer' },
  { num: 4, label: 'Service Scope' },
  { num: 5, label: 'Risk & Triage' },
  { num: 6, label: 'Outcome Review' },
];

export default function SuitabilityAssessmentModal({
  isOpen,
  onClose,
  referral,
  participant,
  onSuccess,
}: SuitabilityAssessmentModalProps) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Identity & Age
  const [participantName, setParticipantName] = useState(
    referral?.participantName || participant?.name || ''
  );
  const [dob, setDob] = useState(participant?.dateOfBirth || '');
  const [isAdultConfirmed, setIsAdultConfirmed] = useState<boolean | null>(null);

  // Step 2: Location
  const [suburb, setSuburb] = useState(
    referral?.suburb || participant?.suburb || ''
  );
  const [postcode, setPostcode] = useState('');
  const [areaValidation, setAreaValidation] = useState<any>(null);

  // Step 3: Funding
  const [fundingType, setFundingType] = useState<string>(
    referral?.funding || participant?.fundingType || ''
  );
  const [planManagerName, setPlanManagerName] = useState(participant?.planManager || '');
  const [planManagerEmail, setPlanManagerEmail] = useState(participant?.planManagerEmail || '');
  const [registeredContractingProvider, setRegisteredContractingProvider] = useState('');
  const [contractingProviderRelationshipId, setContractingProviderRelationshipId] = useState('');
  const [verifiedProviderRelationships, setVerifiedProviderRelationships] = useState<any[]>([]);

  // Step 4: Services
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  // Step 5: Risk Triage
  const [mobilityTransfers, setMobilityTransfers] = useState(false);
  const [continenceSupport, setContinenceSupport] = useState(false);
  const [manualHandling, setManualHandling] = useState(false);
  const [medicationSupport, setMedicationSupport] = useState(false);
  const [allergies, setAllergies] = useState('');
  const [dysphagiaMealtime, setDysphagiaMealtime] = useState(false);
  const [seizures, setSeizures] = useState(false);
  const [clinicalTasks, setClinicalTasks] = useState(false);
  const [catheterCare, setCatheterCare] = useState(false);
  const [bowelCare, setBowelCare] = useState(false);
  const [behavioursOfConcern, setBehavioursOfConcern] = useState(false);
  const [bspInPlace, setBspInPlace] = useState(false);
  const [restrictivePractices, setRestrictivePractices] = useState(false);
  const [transportRequired, setTransportRequired] = useState(false);

  // Step 6: Evaluation
  const [assessorNotes, setAssessorNotes] = useState('');

  // Real-time location check
  useEffect(() => {
    if (suburb) {
      const res = checkServiceArea(suburb);
      setAreaValidation(res);
    }
  }, [suburb]);

  // Load the governed internal catalogue and structured provider relationships.
  useEffect(() => {
    async function loadGovernanceOptions() {
      try {
        const [servicesRes, providersRes] = await Promise.all([
          fetch('/api/governance/service-scope?view=internal'),
          fetch('/api/crm/contracting-providers'),
        ]);
        if (!servicesRes.ok) throw new Error('Internal service catalogue is unavailable.');
        const servicesData = await servicesRes.json();
        setAvailableServices(servicesData.services || []);
        if (providersRes.ok) {
          const providersData = await providersRes.json();
          setVerifiedProviderRelationships(
            (providersData.relationships || []).filter((item: any) => item.verification_status === 'verified')
          );
        }
      } catch (err) {
        console.error('Could not load governed suitability options', err);
        setError('Governance options could not be loaded. Assessment remains unavailable.');
      }
    }
    loadGovernanceOptions();
  }, []);

  const handleNext = () => {
    setError('');
    if (step === 1 && !participantName.trim()) {
      setError('Participant name is required.');
      return;
    }
    if (step === 1 && !dob && isAdultConfirmed === null) {
      setError('Record date of birth or explicitly confirm the adult 18+ intake evidence.');
      return;
    }
    if (step === 2 && !suburb.trim()) {
      setError('Suburb / location is required.');
      return;
    }
    if (step === 3 && !fundingType) {
      setError('Select the verified funding management type.');
      return;
    }
    if (step === 4 && selectedServices.length === 0) {
      setError('Select at least one service to assess.');
      return;
    }
    setStep((prev) => Math.min(prev + 1, 6));
  };

  const handleBack = () => {
    setError('');
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const toggleService = (code: string) => {
    setSelectedServices((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');

    try {
      const payload = {
        referralId: referral?.id,
        participantId: participant?.id,
        participantName: participantName.trim(),
        dateOfBirth: dob || undefined,
        isAdult: dob ? undefined : isAdultConfirmed,
        fundingType,
        payerDetails: {
          fundingType,
          planManagerName: planManagerName.trim() || undefined,
          planManagerEmail: planManagerEmail.trim() || undefined,
          registeredContractingProvider: registeredContractingProvider.trim() || undefined,
          contractingProviderRelationshipId: contractingProviderRelationshipId || undefined,
        },
        suburb: suburb.trim(),
        postcode: postcode.trim() || undefined,
        requestedServices: selectedServices,
        riskTriage: {
          manualHandling,
          mobilityTransfers,
          medicationSupport,
          allergies: allergies.trim() || undefined,
          dysphagiaMealtime,
          seizures,
          clinicalTasks,
          catheterCare,
          bowelCare,
          continenceSupport,
          behavioursOfConcern,
          bspInPlace,
          restrictivePracticesIndicated: restrictivePractices,
          transportRequired,
        },
        assessorNotes: assessorNotes.trim(),
      };

      const res = await fetch('/api/crm/suitability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || data.message || 'Suitability assessment submission failed.');
        return;
      }

      onSuccess(data.assessment);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Network error during assessment submission.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <FormDrawer isOpen={isOpen} onClose={onClose} wide>
      <DrawerHeader
        title="Service Suitability Assessment"
        description="Formal NDIS intake governance check: funding scope, serviceability, service scope, and risk triage."
        onClose={onClose}
        badge={<span className="compliance-pill">Governance G1</span>}
      />

      <FormStepper
        steps={WIZARD_STEPS}
        currentStep={step}
        onStepClick={(num) => {
          if (num < step) setStep(num);
        }}
      />

      <div className="drawer-body">
        {error && <FormError message={error} onDismiss={() => setError('')} />}

        {/* STEP 1: IDENTITY & AGE */}
        {step === 1 && (
          <FormSection title="1. Participant Identity & Age Scope">
            <FormGrid2>
              <FormField label="Participant Full Legal Name" required id="pName">
                <FormInput
                  id="pName"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  placeholder="e.g. Liam Davies"
                />
              </FormField>

              <FormField label="Date of Birth" id="pDob">
                <FormInput
                  id="pDob"
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />
              </FormField>
            </FormGrid2>

            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isAdultConfirmed === true}
                  onChange={(e) => setIsAdultConfirmed(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: 'var(--brand-primary)' }}
                />
                <span><strong>Adults 18+ Confirmation:</strong> Participant is at least 18 years of age (Opus Care launch scope is strictly Adults 18+).</span>
              </label>
            </div>

            {isAdultConfirmed === false && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: '#FEF2F2', border: '1px solid #F87171', borderRadius: 6, color: '#B91C1C', fontSize: 13 }}>
                <AlertCircle size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: -3 }} />
                Referrals under 18 years old cannot be onboarded. A decline outcome will be recorded.
              </div>
            )}
          </FormSection>
        )}

        {/* STEP 2: LOCATION & REGIONAL SERVICEABILITY */}
        {step === 2 && (
          <FormSection title="2. Service Area & Travel Feasibility">
            <FormGrid2>
              <FormField label="Suburb / Town" required id="pSuburb">
                <FormInput
                  id="pSuburb"
                  value={suburb}
                  onChange={(e) => setSuburb(e.target.value)}
                  placeholder="e.g. Yamba, Grafton, Coffs Harbour, Blacktown"
                />
              </FormField>

              <FormField label="Postcode" id="pPostcode">
                <FormInput
                  id="pPostcode"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                  placeholder="e.g. 2464"
                />
              </FormField>
            </FormGrid2>

            {areaValidation && (
              <div style={{
                marginTop: 14,
                padding: '12px 16px',
                borderRadius: 6,
                background: areaValidation.inServiceArea ? '#F0FDF4' : '#FFFBEB',
                border: `1px solid ${areaValidation.inServiceArea ? '#86EFAC' : '#FCD34D'}`,
                color: areaValidation.inServiceArea ? '#166534' : '#92400E',
                fontSize: 13,
              }}>
                {areaValidation.inServiceArea ? (
                  <div>
                    <CheckCircle2 size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: -3 }} />
                    <strong>In Active Service Cluster:</strong> Matched {areaValidation.regionName} ({areaValidation.regionCanonical})
                  </div>
                ) : (
                  <div>
                    <AlertTriangle size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: -3 }} />
                    <strong>Location Review Required:</strong> Location is outside active Northern NSW and Sydney clusters.
                  </div>
                )}
              </div>
            )}
          </FormSection>
        )}

        {/* STEP 3: FUNDING & BILLING RELATIONSHIP */}
        {step === 3 && (
          <FormSection title="3. Funding Model & Billing Pathway">
            <FormField label="NDIS Funding Management Method" required id="pFunding">
              <FormSelect
                id="pFunding"
                value={fundingType}
                onChange={(e) => setFundingType(e.target.value)}
              >
                <option value="Plan-Managed">Plan-Managed (Third-party intermediary)</option>
                <option value="Self-Managed">Self-Managed (Participant / Nominee direct invoice)</option>
                <option value="NDIA-Managed">NDIA-Managed (Agency Managed — requires registered partner arrangement)</option>
                <option value="Unsure">Unsure / Pending Plan Details</option>
              </FormSelect>
            </FormField>

            {fundingType === 'Plan-Managed' && (
              <FormGrid2 style={{ marginTop: 14 }}>
                <FormField label="Plan Management Agency" id="pmName">
                  <FormInput
                    id="pmName"
                    value={planManagerName}
                    onChange={(e) => setPlanManagerName(e.target.value)}
                    placeholder="e.g. MyPlan Manager, Plan Partners"
                  />
                </FormField>
                <FormField label="Plan Manager Invoicing Email" id="pmEmail">
                  <FormInput
                    id="pmEmail"
                    value={planManagerEmail}
                    onChange={(e) => setPlanManagerEmail(e.target.value)}
                    placeholder="invoices@planmanager.com.au"
                  />
                </FormField>
              </FormGrid2>
            )}

            {fundingType === 'NDIA-Managed' && (
              <div style={{ marginTop: 14 }}>
                <div style={{ padding: '10px 14px', background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: 6, color: '#92400E', fontSize: 13, marginBottom: 12 }}>
                  <Shield size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: -3 }} />
                  <strong>Provider Boundary Notice:</strong> Opus Care is an unregistered provider and cannot directly lodge NDIA claims. A formal subcontract with a registered provider is mandatory.
                </div>
                <FormField label="Verified Contracting Provider Relationship" id="regPartnerRelationship">
                  <FormSelect
                    id="regPartnerRelationship"
                    value={contractingProviderRelationshipId}
                    onChange={(e) => setContractingProviderRelationshipId(e.target.value)}
                  >
                    <option value="">No verified relationship selected</option>
                    {verifiedProviderRelationships.map((relationship) => (
                      <option key={relationship.id} value={relationship.id}>
                        {relationship.provider_name} — {relationship.contract_reference}
                      </option>
                    ))}
                  </FormSelect>
                </FormField>
                <div style={{ marginTop: 12 }}>
                <FormField label="Provider name supplied with enquiry (does not verify billing)" id="regPartner">
                  <FormInput
                    id="regPartner"
                    value={registeredContractingProvider}
                    onChange={(e) => setRegisteredContractingProvider(e.target.value)}
                    placeholder="Registered Partner Organisation Legal Name"
                  />
                </FormField>
                </div>
                {verifiedProviderRelationships.length === 0 && (
                  <p style={{ margin: '10px 0 0', fontSize: 12.5, color: '#92400E' }}>
                    No verified contracting relationship is recorded. This assessment will remain Billing Configuration Required.
                  </p>
                )}
              </div>
            )}
          </FormSection>
        )}

        {/* STEP 4: SERVICE SCOPE SELECTION */}
        {step === 4 && (
          <FormSection title="4. Requested Supports & Scope Verification">
            <p style={{ fontSize: 13, color: 'var(--oc-muted)', marginBottom: 12 }}>
              Select requested supports. System verifies eligibility against the live Opus Care Service Scope Registry.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
              {availableServices.map((srv) => {
                const isChecked = selectedServices.includes(srv.serviceCode);
                return (
                  <label
                    key={srv.serviceCode}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      padding: '10px 14px',
                      borderRadius: 6,
                      background: isChecked ? 'var(--brand-subtle, #F0FDF4)' : 'var(--oc-surface)',
                      border: `1px solid ${isChecked ? 'var(--brand-primary, #16A34A)' : 'var(--oc-border)'}`,
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleService(srv.serviceCode)}
                      style={{ marginTop: 3, accentColor: 'var(--brand-primary)' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{srv.publicName || srv.name}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--oc-muted)' }}>
                        {srv.operationalStatus || srv.status || srv.category}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </FormSection>
        )}

        {/* STEP 5: RISK & TRIAGE */}
        {step === 5 && (
          <FormSection title="5. Complexity & Risk Triage">
            <p style={{ fontSize: 13, color: 'var(--oc-muted)', marginBottom: 12 }}>
              Screen for high-intensity, clinical, or behavioural indicators. This informs dynamic onboarding requirements.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5 }}>
                <input type="checkbox" checked={mobilityTransfers} onChange={(e) => setMobilityTransfers(e.target.checked)} />
                <span>Mobility or transfer assistance required</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5 }}>
                <input type="checkbox" checked={manualHandling} onChange={(e) => setManualHandling(e.target.checked)} />
                <span>Manual handling / hoist / physical transfer assistance required</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5 }}>
                <input type="checkbox" checked={medicationSupport} onChange={(e) => setMedicationSupport(e.target.checked)} />
                <span>Medication prompting or assistance with self-administration</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5 }}>
                <input type="checkbox" checked={dysphagiaMealtime} onChange={(e) => setDysphagiaMealtime(e.target.checked)} />
                <span>Dysphagia, choking risk, or specialised mealtime management</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5 }}>
                <input type="checkbox" checked={seizures} onChange={(e) => setSeizures(e.target.checked)} />
                <span>Epilepsy or seizure management plan in place</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5 }}>
                <input type="checkbox" checked={continenceSupport} onChange={(e) => setContinenceSupport(e.target.checked)} />
                <span>Continence or toileting support required</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5 }}>
                <input type="checkbox" checked={transportRequired} onChange={(e) => setTransportRequired(e.target.checked)} />
                <span>Participant transport is requested as part of service delivery</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5 }}>
                <input type="checkbox" checked={catheterCare} onChange={(e) => setCatheterCare(e.target.checked)} />
                <span>Urinary catheter management (triggers clinical review)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5 }}>
                <input type="checkbox" checked={bowelCare} onChange={(e) => setBowelCare(e.target.checked)} />
                <span>Complex bowel care (triggers clinical review)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5 }}>
                <input type="checkbox" checked={clinicalTasks} onChange={(e) => setClinicalTasks(e.target.checked)} />
                <span>Other subcutaneous / clinical tasks (triggers clinical review)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5 }}>
                <input type="checkbox" checked={behavioursOfConcern} onChange={(e) => setBehavioursOfConcern(e.target.checked)} />
                <span>Behaviours of concern noted</span>
              </label>
              {behavioursOfConcern && (
                <div style={{ marginLeft: 24 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <input type="checkbox" checked={bspInPlace} onChange={(e) => setBspInPlace(e.target.checked)} />
                    <span>Positive Behaviour Support Plan (BSP) is currently active and available</span>
                  </label>
                </div>
              )}
              <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, marginTop: 6 }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13.5, color: '#991B1B' }}>
                  <input
                    type="checkbox"
                    checked={restrictivePractices}
                    onChange={(e) => setRestrictivePractices(e.target.checked)}
                    style={{ marginTop: 3 }}
                  />
                  <span>
                    <strong>Regulated Restrictive Practices Indicated:</strong> Participant is subject to chemical, mechanical, physical, environmental, or seclusion restrictions. (Triggers mandatory Safeguarding Stop).
                  </span>
                </label>
              </div>
            </div>
          </FormSection>
        )}

        {/* STEP 6: OUTCOME REVIEW */}
        {step === 6 && (
          <FormSection title="6. Suitability Determination & Sign-off">
            <FormSummaryCard
              title="Assessment Summary"
              rows={[
                { label: 'Participant', value: participantName },
                { label: 'Age Status', value: dob ? 'Calculated from date of birth' : isAdultConfirmed === true ? 'Adult 18+ confirmed' : isAdultConfirmed === false ? 'Under 18' : 'Unconfirmed' },
                { label: 'Location / Region', value: `${suburb} (${areaValidation?.regionCanonical || 'Review Needed'})` },
                { label: 'Funding Basis', value: fundingType },
                { label: 'Selected Supports', value: `${selectedServices.length} items selected` },
                {
                  label: 'Clinical Review Triggered',
                  value: catheterCare || bowelCare || clinicalTasks || seizures ? 'Yes (Clinical Clearance Required)' : 'No (Standard Supports)',
                },
                {
                  label: 'Restrictive Practices',
                  value: restrictivePractices ? 'YES (Management Escalation Stop)' : 'None Indicated',
                },
              ]}
            />

            <div style={{ marginTop: 16 }}>
              <FormField label="Assessor Governance Notes" id="notes">
                <FormTextarea
                  id="notes"
                  rows={3}
                  value={assessorNotes}
                  onChange={(e) => setAssessorNotes(e.target.value)}
                  placeholder="Record rationales, specific participant goals, or conditions for onboarding..."
                />
              </FormField>
            </div>
          </FormSection>
        )}
      </div>

      <StickyFormFooter
        onCancel={onClose}
        onSecondary={step > 1 ? handleBack : undefined}
        secondaryLabel={step > 1 ? 'Back' : undefined}
        onPrimary={step < 6 ? handleNext : handleSubmit}
        primaryLabel={step < 6 ? `Next: ${WIZARD_STEPS[step].label}` : 'Finalise Suitability Assessment'}
        primaryIcon={step === 6 ? <Shield size={15} /> : <ArrowRight size={15} />}
        loading={submitting}
      />
    </FormDrawer>
  );
}
