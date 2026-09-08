'use client';

import useDialogFocus from '@/components/ui/useDialogFocus';

import React, { useState } from 'react';
import { X, UserPlus, ArrowRight, ArrowLeft, Check, CheckCircle2 } from 'lucide-react';
import {
  FormField,
  TextInput,
  DatePicker,
  AddressSuburbPicker,
  RadioCard,
  FormStepper,
  ReviewSummary,
  InlineValidation,
  Checkbox,
} from '@/components/ui/form';

interface AddParticipantModalProps {
  onClose: () => void;
  onCreated: (newParticipant: any) => void;
}

const WIZARD_STEPS = [
  { num: 1, label: 'Personal Details' },
  { num: 2, label: 'Service Area & Address' },
  { num: 3, label: 'Funding & Plan' },
  { num: 4, label: 'Nominee / Contact' },
  { num: 5, label: 'Review & Create' },
];

export default function AddParticipantModal({ onClose, onCreated }: AddParticipantModalProps) {
  const dialogRef = useDialogFocus(onClose);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Personal Details
  const [name, setName] = useState('');
  const [ndisNumber, setNdisNumber] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Step 2: Address & Service Area
  const [suburb, setSuburb] = useState('Yamba NSW');
  const [inServiceArea, setInServiceArea] = useState(true);
  const [streetAddress, setStreetAddress] = useState('');

  // Step 3: Funding & Plan
  const [fundingType, setFundingType] = useState('Plan-Managed');
  const [planManagerName, setPlanManagerName] = useState('');
  const [planManagerEmail, setPlanManagerEmail] = useState('');
  const [allocatedHours, setAllocatedHours] = useState('8');

  // Step 4: Contact & Nominee
  const [contactPerson, setContactPerson] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [emergencyContactRelation, setEmergencyContactRelation] = useState('');
  const [primaryService, setPrimaryService] = useState('Community Participation & Daily Living');

  // Step 5: Options
  const [completeProfileLater, setCompleteProfileLater] = useState(false);

  const validateStep = (currentStep: number): boolean => {
    setError('');
    if (currentStep === 1) {
      if (!name.trim()) {
        setError('Participant Full Legal Name is required.');
        return false;
      }
    }
    if (currentStep === 2) {
      if (!suburb.trim()) {
        setError('Suburb / Town is required.');
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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      setError('Participant Full Legal Name is required.');
      setStep(1);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/crm/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          ndisNumber: ndisNumber.trim() || null,
          dateOfBirth: dob || null,
          phone: phone.trim() || null,
          email: email.trim() || null,
          suburb: suburb.trim() || 'Yamba NSW',
          streetAddress: streetAddress.trim() || null,
          fundingType,
          planManager: fundingType === 'Plan-Managed' ? planManagerName.trim() : null,
          planManagerEmail: fundingType === 'Plan-Managed' ? planManagerEmail.trim() : null,
          allocatedHours: Number(allocatedHours) || 0,
          primaryService: primaryService || 'Community Participation & Daily Living',
          contactPerson: contactPerson.trim() || null,
          emergencyContactName: emergencyContactName.trim() || null,
          emergencyContactPhone: emergencyContactPhone.trim() || null,
          emergencyContactRelation: emergencyContactRelation.trim() || null,
          profileComplete: !completeProfileLater,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Failed to create participant record.');
        return;
      }

      onCreated(data.participant);
      onClose();
    } catch (err: unknown) {
      setError('Connection error. Please check your network and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="crmModalOverlay" onClick={onClose}>
      <div
        className="crmModalBox" ref={dialogRef} role="dialog" aria-modal="true" aria-label="Add participant" tabIndex={-1}
        style={{ maxWidth: 740, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="crmModalHeader" style={{ flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: '#E0F2FE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--oc-info)',
              }}
            >
              <UserPlus size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--oc-info)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                INTAKE & ONBOARDING
              </span>
              <h3 className="crmSectionTitle" style={{ margin: 0 }}>Add NDIS Participant</h3>
            </div>
          </div>
          <button type="button" aria-label="Close dialog" onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--oc-muted)', padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* 5-Step Stepper */}
        <FormStepper
          steps={WIZARD_STEPS}
          currentStep={step}
          onStepClick={(num) => {
            if (num < step) setStep(num);
          }}
        />

        {/* Modal Body */}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
          {error && (
            <div style={{ marginBottom: 16 }}>
              <InlineValidation type="error" message={error} />
            </div>
          )}

          {/* STEP 1: PERSONAL DETAILS */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ marginBottom: 4 }}>
                <h4 className="crmCardTitle" style={{ margin: '0 0 4px' }}>Step 1: Personal Details</h4>
                <p className="crmBodyText" style={{ margin: 0, fontSize: '0.875rem', color: 'var(--oc-muted)' }}>
                  Enter the participant legal identification and direct contact details.
                </p>
              </div>

              <div className="ocFormGrid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <FormField label="Full Legal Name" required id="pName">
                  <TextInput
                    id="pName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Eleanor Vance"
                    autoFocus
                  />
                </FormField>

                <FormField label="NDIS Number" hint="9-digit national disability number" id="pNdis">
                  <TextInput
                    id="pNdis"
                    value={ndisNumber}
                    onChange={(e) => setNdisNumber(e.target.value)}
                    placeholder="e.g. 430 982 104"
                  />
                </FormField>
              </div>

              <div className="ocFormGrid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <FormField label="Date of Birth" id="pDob">
                  <DatePicker
                    id="pDob"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                  />
                </FormField>

                <FormField label="Primary Phone" id="pPhone">
                  <TextInput
                    id="pPhone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0400 000 000"
                  />
                </FormField>

                <FormField label="Email Address" id="pEmail">
                  <TextInput
                    id="pEmail"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="participant@example.com"
                  />
                </FormField>
              </div>
            </div>
          )}

          {/* STEP 2: ADDRESS & SERVICE AREA */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ marginBottom: 4 }}>
                <h4 className="crmCardTitle" style={{ margin: '0 0 4px' }}>Step 2: Service Area & Location</h4>
                <p className="crmBodyText" style={{ margin: 0, fontSize: '0.875rem', color: 'var(--oc-muted)' }}>
                  Verify whether the participant resides within Opus Care primary support coverage (Clarence Valley, Coffs Coast, Richmond Valley, Ballina).
                </p>
              </div>

              <FormField
                label="Primary Suburb / Hub"
                required
                hint="Start typing a suburb name to match against Opus Care regions."
              >
                <AddressSuburbPicker
                  value={suburb}
                  onChange={(sub, inArea) => {
                    setSuburb(sub);
                    setInServiceArea(inArea);
                  }}
                />
              </FormField>

              <FormField label="Residential Street Address" id="pAddress" hint="Used for worker dispatch and emergency plans">
                <TextInput
                  id="pAddress"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="e.g. 24 Ocean Street"
                />
              </FormField>
            </div>
          )}

          {/* STEP 3: FUNDING & PLAN DETAILS */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ marginBottom: 4 }}>
                <h4 className="crmCardTitle" style={{ margin: '0 0 4px' }}>Step 3: NDIS Funding & Plan Management</h4>
                <p className="crmBodyText" style={{ margin: 0, fontSize: '0.875rem', color: 'var(--oc-muted)' }}>
                  Opus Care supports Plan-Managed and Self-Managed participants with immediate capacity.
                </p>
              </div>

              <div>
                <label className="crmFormLabel">NDIS Management Model *</label>
                <div className="ocFormGrid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <RadioCard
                    selected={fundingType === 'Plan-Managed'}
                    onSelect={() => setFundingType('Plan-Managed')}
                    title="Plan-Managed"
                    description="Invoiced via registered Plan Management Agency"
                    badge="Most Common"
                  />
                  <RadioCard
                    selected={fundingType === 'Self-Managed'}
                    onSelect={() => setFundingType('Self-Managed')}
                    title="Self-Managed"
                    description="Invoiced directly to participant or family nominee"
                  />
                  <RadioCard
                    selected={fundingType === 'NDIA Managed'}
                    onSelect={() => setFundingType('NDIA Managed')}
                    title="NDIA Managed"
                    description="Agency managed (Requires registered provider status)"
                  />
                </div>
              </div>

              {/* Plan Manager Details (Adaptive) */}
              {fundingType === 'Plan-Managed' && (
                <div
                  style={{
                    background: '#F0F9FF',
                    border: '1px solid #BAE6FD',
                    borderRadius: 10,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0369A1' }}>
                    Plan Management Provider Invoicing Details
                  </span>
                  <div className="ocFormGrid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <FormField label="Plan Manager Organization / Contact">
                      <TextInput
                        value={planManagerName}
                        onChange={(e) => setPlanManagerName(e.target.value)}
                        placeholder="e.g. My Plan Manager / Maple Plan"
                      />
                    </FormField>
                    <FormField label="Invoicing Email Address">
                      <TextInput
                        type="email"
                        value={planManagerEmail}
                        onChange={(e) => setPlanManagerEmail(e.target.value)}
                        placeholder="invoices@planmanager.com.au"
                      />
                    </FormField>
                  </div>
                </div>
              )}

              <div className="ocFormGrid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <FormField label="Allocated Weekly Hours" hint="Target scheduled hours per week">
                  <TextInput
                    type="number"
                    step="0.5"
                    min="0"
                    value={allocatedHours}
                    onChange={(e) => setAllocatedHours(e.target.value)}
                    placeholder="e.g. 8"
                  />
                </FormField>

                <FormField label="Primary Support Stream">
                  <TextInput
                    value={primaryService}
                    onChange={(e) => setPrimaryService(e.target.value)}
                    placeholder="e.g. Community Access & 1:1 In-Home Support"
                  />
                </FormField>
              </div>
            </div>
          )}

          {/* STEP 4: PRIMARY CONTACT / NOMINEE */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ marginBottom: 4 }}>
                <h4 className="crmCardTitle" style={{ margin: '0 0 4px' }}>Step 4: Primary Contact & Nominee</h4>
                <p className="crmBodyText" style={{ margin: 0, fontSize: '0.875rem', color: 'var(--oc-muted)' }}>
                  Key stakeholders, emergency contacts, or Support Coordinator for rostering and care coordination.
                </p>
              </div>

              <FormField label="Support Coordinator / Decision Maker" hint="Name, role, or agency contact">
                <TextInput
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="e.g. Sarah Jenkins (Coordinator, Beyond Limits) - 0412 345 678"
                />
              </FormField>

              <div className="ocFormGrid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <FormField label="Emergency Contact Name">
                  <TextInput
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                    placeholder="e.g. Helen Vance"
                  />
                </FormField>

                <FormField label="Relationship">
                  <TextInput
                    value={emergencyContactRelation}
                    onChange={(e) => setEmergencyContactRelation(e.target.value)}
                    placeholder="e.g. Mother / Guardian"
                  />
                </FormField>

                <FormField label="Emergency Phone">
                  <TextInput
                    type="tel"
                    value={emergencyContactPhone}
                    onChange={(e) => setEmergencyContactPhone(e.target.value)}
                    placeholder="0433 888 999"
                  />
                </FormField>
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW & CREATE */}
          {step === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ marginBottom: 4 }}>
                <h4 className="crmCardTitle" style={{ margin: '0 0 4px' }}>Step 5: Review & Create Participant</h4>
                <p className="crmBodyText" style={{ margin: 0, fontSize: '0.875rem', color: 'var(--oc-muted)' }}>
                  Confirm participant profile details before provisioning into the Opus Care CRM.
                </p>
              </div>

              <ReviewSummary
                sections={[
                  {
                    title: 'Participant Profile',
                    fields: [
                      { label: 'Full Legal Name', value: name },
                      { label: 'NDIS Number', value: ndisNumber || 'Pending' },
                      { label: 'Date of Birth', value: dob || 'Unspecified' },
                      { label: 'Phone', value: phone || 'Unspecified' },
                      { label: 'Email', value: email || 'Unspecified' },
                    ],
                  },
                  {
                    title: 'Location & Service Area',
                    fields: [
                      {
                        label: 'Suburb / Region',
                        value: suburb,
                        badge: inServiceArea ? 'In Service Area' : 'Outside Service Area',
                      },
                      { label: 'Street Address', value: streetAddress || 'Unspecified' },
                    ],
                  },
                  {
                    title: 'Funding & Support Scope',
                    fields: [
                      { label: 'Funding Type', value: fundingType, badge: 'Active' },
                      { label: 'Plan Manager', value: planManagerName || 'N/A' },
                      { label: 'Allocated Hours', value: `${allocatedHours} hrs / week` },
                      { label: 'Primary Stream', value: primaryService },
                    ],
                  },
                ]}
              />

              <div style={{ background: 'var(--oc-background)', border: '1px solid var(--oc-border)', borderRadius: 8, padding: 14 }}>
                <Checkbox
                  checked={completeProfileLater}
                  onChange={setCompleteProfileLater}
                  label="Save as preliminary profile (Complete remaining fields later)"
                  description="Allows quick intake without requiring immediate support plans, risk assessments, or full coordinator details."
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--oc-border)',
            background: 'var(--oc-background)',
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
                onClick={handleBack}
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

            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="crmActionBtnPrimary"
              >
                <span>Continue</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSubmit()}
                className="crmActionBtnPrimary"
                style={{ background: '#059669' }}
              >
                {submitting ? (
                  <span>Saving Profile...</span>
                ) : (
                  <>
                    <Check size={16} />
                    <span>Create Participant Record</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
