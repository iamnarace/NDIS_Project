'use client';

import React, { useState } from 'react';
import { UserCheck, Check, ShieldCheck, Briefcase } from 'lucide-react';
import {
  FormDrawer,
  DrawerHeader,
  FormStepper,
  FormSection,
  FormField,
  FormInput,
  FormSelect,
  FormGrid2,
  FormSummaryCard,
  FormError,
  StickyFormFooter,
} from '@/components/admin/forms';

interface AddWorkerModalProps {
  onClose: () => void;
  onCreated: (newStaff: any) => void;
}

const WIZARD_STEPS = [
  { num: 1, label: 'Personal Details' },
  { num: 2, label: 'Engagement Model' },
  { num: 3, label: 'Role & Rates' },
  { num: 4, label: 'Clearances' },
  { num: 5, label: 'Review & Register' },
];

const HUB_SUBURBS = [
  'Yamba', 'Maclean', 'Grafton', 'Iluka', 'Townsend',
  'Coffs Harbour', 'Woolgoolga', 'Casino', 'Lismore', 'Ballina'
];

export default function AddWorkerModal({ onClose, onCreated }: AddWorkerModalProps) {
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
    if (!name.trim()) {
      setError('Worker Full Legal Name is required.');
      setStep(1);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        name: name.trim(),
        role: role.trim(),
        phone: phone.trim(),
        email: email.trim(),
        emergencyContact: emergencyContact.trim() || undefined,
        engagementType,
        abn: engagementType === 'contractor' ? (abn.trim() || undefined) : undefined,
        suburbs: selectedSuburbs,
        ndisScreening,
        ndisScreeningExpiry: ndisScreeningExpiry || undefined,
        wwcc: wwcc.trim() || undefined,
        wwccExpiry: wwccExpiry || undefined,
        policeCheckDate: policeCheckDate || undefined,
        firstAidExpiry: firstAidExpiry || undefined,
        cprExpiry: cprExpiry || undefined,
        ndisOrientationCompleted,
        hourlyRate: parseFloat(hourlyRate) || 0,
        status: 'active',
      };

      const res = await fetch('/api/crm/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || data.message || 'Failed to register worker. Please check required fields.');
        return;
      }

      onCreated(data.staff);
      onClose();
    } catch (err: unknown) {
      setError('Network error while saving worker. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormDrawer isOpen onClose={onClose} wide>
      <DrawerHeader
        title="Register Support Worker"
        description="Onboard support staff with verified NDIS clearance and hub allocations."
        onClose={onClose}
        badge={<span className="compliance-pill">Workforce Compliance</span>}
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

        {/* STEP 1: PERSONAL DETAILS */}
        {step === 1 && (
          <FormSection title="1. Personal Identification">
            <FormField label="Full Legal Name" required id="wName">
              <FormInput
                id="wName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. James Wilson"
                autoFocus
              />
            </FormField>

            <FormGrid2 style={{ marginTop: 16 }}>
              <FormField label="Mobile Phone" required id="wPhone">
                <FormInput
                  id="wPhone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0400 000 000"
                />
              </FormField>

              <FormField label="Email Address" required id="wEmail">
                <FormInput
                  id="wEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="worker@opuscare.com.au"
                />
              </FormField>
            </FormGrid2>

            <div style={{ marginTop: 16 }}>
              <FormField label="Emergency Contact (Optional)" hint="Name & phone number of next of kin" id="wEmContact">
                <FormInput
                  id="wEmContact"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="e.g. Sarah Wilson (0411 222 333)"
                />
              </FormField>
            </div>
          </FormSection>
        )}

        {/* STEP 2: ENGAGEMENT MODEL */}
        {step === 2 && (
          <FormSection title="2. Engagement Model & Employment Basis">
            <FormField label="Engagement Basis" required id="wEngagement">
              <FormSelect
                id="wEngagement"
                value={engagementType}
                onChange={(e) => setEngagementType(e.target.value as 'employee' | 'contractor')}
              >
                <option value="employee">Direct Employee (PAYG, Superannuation &amp; Award Terms)</option>
                <option value="contractor">Independent Contractor (ABN Invoicing &amp; Own Insurances)</option>
              </FormSelect>
            </FormField>

            {engagementType === 'contractor' && (
              <div style={{ marginTop: 16 }}>
                <FormField label="Contractor ABN" required hint="11-digit Australian Business Number" id="wAbn">
                  <FormInput
                    id="wAbn"
                    value={abn}
                    onChange={(e) => setAbn(e.target.value)}
                    placeholder="12 345 678 901"
                  />
                </FormField>
              </div>
            )}
          </FormSection>
        )}

        {/* STEP 3: ROLE & SERVICE HUBS */}
        {step === 3 && (
          <FormSection title="3. Role, Rates & Allocated Service Hubs">
            <FormGrid2>
              <FormField label="Role / Classification" required id="wRole">
                <FormSelect
                  id="wRole"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="Disability Support Worker">Disability Support Worker (Level 2)</option>
                  <option value="Senior Support Worker">Senior Support Worker (Level 3)</option>
                  <option value="Support Coordinator">Support Coordinator</option>
                  <option value="Care Team Lead">Care Team Lead / Supervisor</option>
                </FormSelect>
              </FormField>

              <FormField label="Base Hourly Rate ($ AUD)" required id="wRate">
                <FormInput
                  id="wRate"
                  type="number"
                  step="0.50"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                />
              </FormField>
            </FormGrid2>

            <div style={{ marginTop: 20 }}>
              <div className="form-label" style={{ marginBottom: 8 }}>
                Allocated Service Hubs &amp; Travel Zones
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {HUB_SUBURBS.map((sub) => {
                  const isSelected = selectedSuburbs.includes(sub);
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => toggleSuburb(sub)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 12.5,
                        fontWeight: 600,
                        border: isSelected ? '1px solid var(--brand-primary)' : '1px solid var(--border)',
                        background: isSelected ? 'var(--brand-subtle)' : '#FFFFFF',
                        color: isSelected ? 'var(--brand-primary)' : 'var(--text-body)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {isSelected ? `✓ ${sub}` : `+ ${sub}`}
                    </button>
                  );
                })}
              </div>
            </div>
          </FormSection>
        )}

        {/* STEP 4: COMPLIANCE & CLEARANCES */}
        {step === 4 && (
          <FormSection title="4. Statutory Clearances & Mandatory Checks">
            <FormGrid2>
              <FormField label="NDIS Worker Screening" required id="wNdisScreening">
                <FormSelect
                  id="wNdisScreening"
                  value={ndisScreening}
                  onChange={(e) => setNdisScreening(e.target.value)}
                >
                  <option value="Verified">Verified / Valid (NDISWC Active)</option>
                  <option value="Pending">Application Pending with Commission</option>
                  <option value="Exempt">Exempt / Supervised</option>
                </FormSelect>
              </FormField>

              <FormField label="Screening Expiry Date" id="wNdisExpiry">
                <FormInput
                  id="wNdisExpiry"
                  type="date"
                  value={ndisScreeningExpiry}
                  onChange={(e) => setNdisScreeningExpiry(e.target.value)}
                />
              </FormField>
            </FormGrid2>

            <FormGrid2 style={{ marginTop: 16 }}>
              <FormField label="WWCC Number" id="wWwcc">
                <FormInput
                  id="wWwcc"
                  value={wwcc}
                  onChange={(e) => setWwcc(e.target.value)}
                  placeholder="WWC0000000E"
                />
              </FormField>

              <FormField label="WWCC Expiry Date" id="wWwccExpiry">
                <FormInput
                  id="wWwccExpiry"
                  type="date"
                  value={wwccExpiry}
                  onChange={(e) => setWwccExpiry(e.target.value)}
                />
              </FormField>
            </FormGrid2>

            <FormGrid2 style={{ marginTop: 16 }}>
              <FormField label="First Aid Certificate Expiry" id="wFaExpiry">
                <FormInput
                  id="wFaExpiry"
                  type="date"
                  value={firstAidExpiry}
                  onChange={(e) => setFirstAidExpiry(e.target.value)}
                />
              </FormField>

              <FormField label="CPR Certificate Expiry" id="wCprExpiry">
                <FormInput
                  id="wCprExpiry"
                  type="date"
                  value={cprExpiry}
                  onChange={(e) => setCprExpiry(e.target.value)}
                />
              </FormField>
            </FormGrid2>

            <div style={{ marginTop: 16 }}>
              <FormField label="National Police Check Date" id="wPoliceDate">
                <FormInput
                  id="wPoliceDate"
                  type="date"
                  value={policeCheckDate}
                  onChange={(e) => setPoliceCheckDate(e.target.value)}
                />
              </FormField>
            </div>

            <div style={{ marginTop: 20 }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  color: 'var(--text-heading)',
                }}
              >
                <input
                  type="checkbox"
                  checked={ndisOrientationCompleted}
                  onChange={(e) => setNdisOrientationCompleted(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: 'var(--brand-primary)' }}
                />
                <span>NDIS Worker Orientation Module (&quot;Quality, Safety and You&quot;) Completed</span>
              </label>
            </div>
          </FormSection>
        )}

        {/* STEP 5: REVIEW & SUMMARY */}
        {step === 5 && (
          <FormSection title="5. Review & Register Worker">
            <FormSummaryCard
              title="Workforce Registration Summary"
              badge="Ready for Roster Allocation"
              rows={[
                { label: 'Full Legal Name', value: name || 'Not specified' },
                { label: 'Role / Title', value: role },
                { label: 'Engagement Model', value: engagementType === 'employee' ? 'Direct Employee' : `Contractor (ABN ${abn || 'Pending'})` },
                { label: 'Base Rate', value: `$${hourlyRate} AUD / hr` },
                { label: 'Allocated Hubs', value: selectedSuburbs.join(', ') || 'None selected' },
                { label: 'NDIS Clearance', value: ndisScreening },
                { label: 'WWCC Check', value: wwcc ? `${wwcc} (Active)` : 'Not provided' },
              ]}
            />
          </FormSection>
        )}
      </div>

      <StickyFormFooter
        onCancel={onClose}
        onSecondary={step > 1 ? handleBack : undefined}
        secondaryLabel="Back"
        onPrimary={step < 5 ? handleNext : () => handleSubmit()}
        primaryLabel={step < 5 ? 'Continue' : 'Register Support Worker'}
        primaryIcon={step === 5 ? <Check size={15} /> : undefined}
        showArrow={step < 5}
        loading={submitting}
      />
    </FormDrawer>
  );
}
