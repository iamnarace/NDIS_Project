'use client';

import useDialogFocus from '@/components/ui/useDialogFocus';

import React, { useState } from 'react';
import { X, UserCheck, ArrowRight, ArrowLeft, Check, ShieldCheck, Briefcase } from 'lucide-react';
import {
  FormField,
  TextInput,
  SmartSelect,
  RadioCard,
  FormStepper,
  ReviewSummary,
  InlineValidation,
  CredentialUpload,
} from '@/components/ui/form';

interface AddWorkerModalProps {
  onClose: () => void;
  onCreated: (newStaff: any) => void;
}

const WIZARD_STEPS = [
  { num: 1, label: 'Personal Details' },
  { num: 2, label: 'Engagement Model' },
  { num: 3, label: 'Role & Rates' },
  { num: 4, label: 'Compliance & Clearances' },
  { num: 5, label: 'Review & Register' },
];

const HUB_SUBURBS = [
  'Yamba', 'Maclean', 'Grafton', 'Iluka', 'Townsend',
  'Coffs Harbour', 'Woolgoolga', 'Casino', 'Lismore', 'Ballina'
];

export default function AddWorkerModal({ onClose, onCreated }: AddWorkerModalProps) {
  const dialogRef = useDialogFocus(onClose);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Personal Details
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  // Step 2: Engagement Type
  const [engagementType, setEngagementType] = useState<'employee' | 'contractor'>('employee');
  const [abn, setAbn] = useState('');

  // Step 3: Role & Employment
  const [role, setRole] = useState('Disability Support Worker');
  const [hourlyRate, setHourlyRate] = useState('38.50');
  const [selectedSuburbs, setSelectedSuburbs] = useState<string[]>(['Yamba', 'Maclean']);

  // Step 4: Compliance Credentials
  const [ndisScreening, setNdisScreening] = useState('Verified');
  const [ndisScreeningExpiry, setNdisScreeningExpiry] = useState('');
  const [wwcc, setWwcc] = useState('');
  const [wwccExpiry, setWwccExpiry] = useState('');
  const [firstAidExpiry, setFirstAidExpiry] = useState('');
  const [cprExpiry, setCprExpiry] = useState('');
  const [policeCheckDate, setPoliceCheckDate] = useState('');
  const [ndisOrientationCompleted, setNdisOrientationCompleted] = useState(true);

  const toggleSuburb = (sub: string) => {
    if (selectedSuburbs.includes(sub)) {
      setSelectedSuburbs(selectedSuburbs.filter((s) => s !== sub));
    } else {
      setSelectedSuburbs([...selectedSuburbs, sub]);
    }
  };

  const validateStep = (currentStep: number): boolean => {
    setError('');
    if (currentStep === 1) {
      if (!name.trim()) {
        setError('Worker Full Legal Name is required.');
        return false;
      }
      if (!phone.trim()) {
        setError('Mobile phone number is required.');
        return false;
      }
      if (!email.trim()) {
        setError('Email address is required.');
        return false;
      }
    }
    if (currentStep === 2) {
      if (engagementType === 'contractor' && abn && !/^\d{11}$/.test(abn.replace(/\s/g, ''))) {
        setError('ABN should be 11 digits.');
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
    if (!name.trim() || !phone.trim() || !email.trim()) {
      setError('Full Legal Name, Mobile Phone, and Email are required.');
      setStep(1);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/crm/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          role: role.trim(),
          phone: phone.trim(),
          email: email.trim(),
          suburbs: selectedSuburbs.length > 0 ? selectedSuburbs : ['Yamba', 'Maclean'],
          hourlyRate: Number(hourlyRate) || 38.50,
          engagementType,
          abn: engagementType === 'contractor' ? abn.trim() || null : null,
          emergencyContact: emergencyContact.trim() || null,
          ndisScreening,
          ndisScreeningExpiry: ndisScreeningExpiry || null,
          wwcc: wwcc.trim() || null,
          wwccExpiry: wwccExpiry || null,
          firstAidExpiry: firstAidExpiry || null,
          cprExpiry: cprExpiry || null,
          policeCheckDate: policeCheckDate || null,
          ndisOrientationCompleted,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Failed to register support worker.');
        return;
      }

      onCreated(data.staff);
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
        className="crmModalBox" ref={dialogRef} role="dialog" aria-modal="true" aria-label="Add worker" tabIndex={-1}
        style={{ maxWidth: 740, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="crmModalHeader" style={{ flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: '#ECFDF5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#059669',
              }}
            >
              <UserCheck size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                WORKFORCE ONBOARDING
              </span>
              <h3 className="crmSectionTitle" style={{ margin: 0 }}>Register Support Worker</h3>
            </div>
          </div>
          <button type="button" aria-label="Close dialog" onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--oc-muted)', padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Stepper */}
        <FormStepper
          steps={WIZARD_STEPS}
          currentStep={step}
          onStepClick={(num) => {
            if (num < step) setStep(num);
          }}
        />

        {/* Body */}
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
                  Basic identity and contact information for roster communications and emergency contacts.
                </p>
              </div>

              <FormField label="Full Legal Name" required id="wName">
                <TextInput
                  id="wName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jordan Miller"
                  autoFocus
                />
              </FormField>

              <div className="ocFormGrid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <FormField label="Mobile Phone" required id="wPhone">
                  <TextInput
                    id="wPhone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0455 000 111"
                  />
                </FormField>

                <FormField label="Email Address" required id="wEmail">
                  <TextInput
                    id="wEmail"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="worker@opuscare.com.au"
                  />
                </FormField>
              </div>

              <FormField label="Emergency Contact" hint="Next of kin / Emergency contact name & phone">
                <TextInput
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="e.g. Sarah Miller (Partner) - 0411 222 333"
                />
              </FormField>
            </div>
          )}

          {/* STEP 2: ENGAGEMENT MODEL */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ marginBottom: 4 }}>
                <h4 className="crmCardTitle" style={{ margin: '0 0 4px' }}>Step 2: Engagement Type</h4>
                <p className="crmBodyText" style={{ margin: 0, fontSize: '0.875rem', color: 'var(--oc-muted)' }}>
                  Select whether the worker is engaged as an employee or independent subcontractor.
                </p>
              </div>

              <div className="ocFormGrid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <RadioCard
                  selected={engagementType === 'employee'}
                  onSelect={() => setEngagementType('employee')}
                  title="Employee (SCHADS Award)"
                  description="PAYG withholding, 11.5% Superannuation guarantee, Fair Work Award coverage."
                  badge="Standard PAYG"
                  icon={<Briefcase size={20} />}
                />
                <RadioCard
                  selected={engagementType === 'contractor'}
                  onSelect={() => setEngagementType('contractor')}
                  title="Independent Contractor"
                  description="Sole Trader with active ABN, invoice-based billing, required insurances & clearances."
                  badge="ABN / Invoicing"
                  icon={<ShieldCheck size={20} />}
                />
              </div>

              {engagementType === 'contractor' && (
                <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 8, padding: 14 }}>
                  <FormField label="Australian Business Number (ABN)" required hint="11-digit registered Australian Business Number">
                    <TextInput
                      value={abn}
                      onChange={(e) => setAbn(e.target.value)}
                      placeholder="e.g. 12 345 678 901"
                    />
                  </FormField>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: ROLE & EMPLOYMENT */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ marginBottom: 4 }}>
                <h4 className="crmCardTitle" style={{ margin: '0 0 4px' }}>Step 3: Role & Rates</h4>
                <p className="crmBodyText" style={{ margin: 0, fontSize: '0.875rem', color: 'var(--oc-muted)' }}>
                  Define position classification, agreed base hourly billing rate, and operational coverage areas.
                </p>
              </div>

              <div className="ocFormGrid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14 }}>
                <FormField label="Position / Role" required>
                  <SmartSelect
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    options={[
                      { value: 'Disability Support Worker', label: 'Disability Support Worker (Level 2)' },
                      { value: 'Support Worker & Mentor', label: 'Support Worker & Senior Mentor (Level 3)' },
                      { value: 'Complex Care Specialist', label: 'Complex Care Specialist (Level 4)' },
                      { value: 'Team Leader', label: 'Team Leader / Care Coordinator' },
                    ]}
                  />
                </FormField>

                <FormField label="Base Hourly Rate ($ AUD)" required hint="Standard weekday daytime rate">
                  <TextInput
                    type="number"
                    step="0.50"
                    min="30"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    placeholder="38.50"
                  />
                </FormField>
              </div>

              <div>
                <label className="crmFormLabel">Assigned Regional Coverage Hubs</label>
                <p className="crmFormHelper" style={{ marginBottom: 10 }}>
                  Select the regional towns where this worker is available for roster scheduling:
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {HUB_SUBURBS.map((sub) => {
                    const active = selectedSuburbs.includes(sub);
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => toggleSuburb(sub)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 20,
                          border: active ? '1.5px solid var(--oc-info)' : '1px solid var(--oc-border)',
                          background: active ? '#F0F9FF' : 'var(--oc-surface)',
                          color: active ? 'var(--oc-info)' : 'var(--oc-secondary)',
                          fontWeight: active ? 600 : 500,
                          fontSize: '0.8125rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {active ? `✓ ${sub}` : `+ ${sub}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: COMPLIANCE & CREDENTIALS */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ marginBottom: 4 }}>
                <h4 className="crmCardTitle" style={{ margin: '0 0 4px' }}>Step 4: Compliance Credentials & Clearances</h4>
                <p className="crmBodyText" style={{ margin: 0, fontSize: '0.875rem', color: 'var(--oc-muted)' }}>
                  Record mandatory safeguarding clearances with expiry tracking for automated roster compliance checks.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <CredentialUpload
                  title="NDIS Worker Screening Check (NDISWC)"
                  subtitle="National clearance verified through the NDIS Commission Worker Portal"
                  expiryDate={ndisScreeningExpiry}
                  onExpiryChange={setNdisScreeningExpiry}
                  required
                />

                <CredentialUpload
                  title="Working with Children Check (WWCC)"
                  subtitle="NSW Office of the Children's Guardian registration"
                  referenceNumber={wwcc}
                  onReferenceChange={setWwcc}
                  referencePlaceholder="e.g. WWC0982341E"
                  expiryDate={wwccExpiry}
                  onExpiryChange={setWwccExpiry}
                />

                <CredentialUpload
                  title="First Aid & CPR (HLTAID011 / HLTAID009)"
                  subtitle="Current certification for life support and emergency response"
                  expiryDate={firstAidExpiry}
                  onExpiryChange={setFirstAidExpiry}
                />

                <CredentialUpload
                  title="National Police Certificate"
                  subtitle="Criminal history check conducted within the last 12 months"
                  expiryDate={policeCheckDate}
                  onExpiryChange={setPoliceCheckDate}
                />
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW & REGISTER */}
          {step === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ marginBottom: 4 }}>
                <h4 className="crmCardTitle" style={{ margin: '0 0 4px' }}>Step 5: Review & Register Support Worker</h4>
                <p className="crmBodyText" style={{ margin: 0, fontSize: '0.875rem', color: 'var(--oc-muted)' }}>
                  Confirm worker profile and credentials before registering into the active roster.
                </p>
              </div>

              <ReviewSummary
                sections={[
                  {
                    title: 'Worker Profile',
                    fields: [
                      { label: 'Full Legal Name', value: name },
                      { label: 'Mobile Phone', value: phone },
                      { label: 'Email', value: email },
                      { label: 'Emergency Contact', value: emergencyContact || 'None' },
                    ],
                  },
                  {
                    title: 'Engagement & Classification',
                    fields: [
                      {
                        label: 'Engagement Model',
                        value: engagementType === 'employee' ? 'Employee (SCHADS Award)' : 'Independent Contractor',
                        badge: engagementType.toUpperCase(),
                      },
                      { label: 'Position', value: role },
                      { label: 'Base Rate', value: `$${hourlyRate} / hr` },
                      { label: 'Coverage Hubs', value: selectedSuburbs.join(', ') || 'Clarence Valley' },
                    ],
                  },
                  {
                    title: 'Safeguarding & Clearances',
                    fields: [
                      {
                        label: 'NDIS Worker Screening',
                        value: ndisScreeningExpiry ? `Valid to ${ndisScreeningExpiry}` : 'Verified',
                        badge: 'Active',
                      },
                      {
                        label: 'WWCC',
                        value: wwcc ? `${wwcc} (Exp: ${wwccExpiry || 'Pending'})` : 'Not provided',
                      },
                      {
                        label: 'First Aid & CPR',
                        value: firstAidExpiry ? `Valid to ${firstAidExpiry}` : 'Current',
                      },
                    ],
                  },
                ]}
              />
            </div>
          )}
        </div>

        {/* Footer */}
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
                  <span>Registering Worker...</span>
                ) : (
                  <>
                    <Check size={16} />
                    <span>Register Support Worker</span>
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
