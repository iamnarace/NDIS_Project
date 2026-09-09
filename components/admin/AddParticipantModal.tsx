'use client';

import React, { useState } from 'react';
import { UserPlus, ArrowRight, ArrowLeft, Check, CheckCircle2 } from 'lucide-react';
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

interface AddParticipantModalProps {
  onClose: () => void;
  onCreated: (newParticipant: any) => void;
}

const WIZARD_STEPS = [
  { num: 1, label: 'Personal Details' },
  { num: 2, label: 'Service Area' },
  { num: 3, label: 'Funding & Plan' },
  { num: 4, label: 'Nominee / Contact' },
  { num: 5, label: 'Review & Create' },
];

export default function AddParticipantModal({ onClose, onCreated }: AddParticipantModalProps) {
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
      const payload = {
        name: name.trim(),
        ndisNumber: ndisNumber.trim() || undefined,
        dob: dob || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        suburb: suburb.trim(),
        streetAddress: streetAddress.trim() || undefined,
        fundingType,
        planManager: fundingType === 'Plan-Managed' ? planManagerName.trim() : undefined,
        planManagerEmail: fundingType === 'Plan-Managed' ? planManagerEmail.trim() : undefined,
        allocatedHours: Number(allocatedHours) || 0,
        primaryService,
        contactPerson: contactPerson.trim() || undefined,
        emergencyContactName: emergencyContactName.trim() || undefined,
        emergencyContactPhone: emergencyContactPhone.trim() || undefined,
        emergencyContactRelation: emergencyContactRelation.trim() || undefined,
        status: completeProfileLater ? 'pending_intake' : 'active',
      };

      const res = await fetch('/api/crm/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create participant record. Please check details.');
        return;
      }

      onCreated(data.participant);
      onClose();
    } catch (err: unknown) {
      setError('Network error while saving participant. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormDrawer isOpen onClose={onClose} wide>
      <DrawerHeader
        title="Add NDIS Participant"
        description="Create and onboard a participant into the Opus Care system."
        onClose={onClose}
        badge={<span className="compliance-pill">NDIS Onboarding</span>}
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
            <FormGrid2>
              <FormField label="Full Legal Name" required id="pName">
                <FormInput
                  id="pName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Eleanor Vance"
                  autoFocus
                />
              </FormField>

              <FormField label="NDIS Number" hint="9-digit national disability number" id="pNdis">
                <FormInput
                  id="pNdis"
                  value={ndisNumber}
                  onChange={(e) => setNdisNumber(e.target.value)}
                  placeholder="e.g. 430 982 104"
                />
              </FormField>
            </FormGrid2>

            <FormGrid2 style={{ marginTop: 16 }}>
              <FormField label="Date of Birth" id="pDob">
                <FormInput
                  id="pDob"
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />
              </FormField>

              <FormField label="Primary Phone" id="pPhone">
                <FormInput
                  id="pPhone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0400 000 000"
                />
              </FormField>
            </FormGrid2>

            <div style={{ marginTop: 16 }}>
              <FormField label="Email Address" id="pEmail">
                <FormInput
                  id="pEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="participant@email.com.au"
                />
              </FormField>
            </div>
          </FormSection>
        )}

        {/* STEP 2: SERVICE AREA & ADDRESS */}
        {step === 2 && (
          <FormSection title="2. Service Area & Address">
            <FormField label="Suburb / Town" required id="pSuburb">
              <FormSelect
                id="pSuburb"
                value={suburb}
                onChange={(e) => {
                  setSuburb(e.target.value);
                  setInServiceArea(e.target.value !== 'Other NSW');
                }}
              >
                <option value="Yamba NSW">Yamba NSW (Core Hub)</option>
                <option value="Maclean NSW">Maclean NSW</option>
                <option value="Grafton NSW">Grafton NSW</option>
                <option value="Iluka NSW">Iluka NSW</option>
                <option value="Townsend NSW">Townsend NSW</option>
                <option value="Coffs Harbour NSW">Coffs Harbour NSW</option>
                <option value="Other NSW">Other Clarence Valley / Northern Rivers</option>
              </FormSelect>
            </FormField>

            <div style={{ marginTop: 16 }}>
              <FormField label="Street Address (Optional)" hint="Participant residential support address" id="pAddress">
                <FormInput
                  id="pAddress"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="e.g. 14 River Street"
                />
              </FormField>
            </div>

            <div
              style={{
                marginTop: 16,
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                background: inServiceArea ? 'var(--status-mint-bg)' : 'var(--status-amber-bg)',
                border: `1px solid ${inServiceArea ? '#A7F3D0' : '#FDE68A'}`,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <CheckCircle2 size={16} color={inServiceArea ? '#059669' : '#D97706'} />
              <span style={{ fontSize: 12.5, fontWeight: 600, color: inServiceArea ? '#065F46' : '#92400E' }}>
                {inServiceArea
                  ? 'Confirmed inside Opus Care Primary Hub (Clarence Valley NSW)'
                  : 'Extended travel zone — subject to support worker travel arrangements'}
              </span>
            </div>
          </FormSection>
        )}

        {/* STEP 3: FUNDING & PLAN */}
        {step === 3 && (
          <FormSection title="3. Funding & Plan Management">
            <FormField label="NDIS Funding Management" required id="pFunding">
              <FormSelect
                id="pFunding"
                value={fundingType}
                onChange={(e) => setFundingType(e.target.value)}
              >
                <option value="Plan-Managed">Plan-Managed (Invoices sent to Plan Manager)</option>
                <option value="Self-Managed">Self-Managed (Participant / Nominee pays directly)</option>
                <option value="NDIA-Managed">Agency / NDIA-Managed</option>
              </FormSelect>
            </FormField>

            {fundingType === 'Plan-Managed' && (
              <FormGrid2 style={{ marginTop: 16 }}>
                <FormField label="Plan Management Agency" id="pPmName">
                  <FormInput
                    id="pPmName"
                    value={planManagerName}
                    onChange={(e) => setPlanManagerName(e.target.value)}
                    placeholder="e.g. Plan Partners / MyIntegra"
                  />
                </FormField>

                <FormField label="Invoices / Claims Email" id="pPmEmail">
                  <FormInput
                    id="pPmEmail"
                    type="email"
                    value={planManagerEmail}
                    onChange={(e) => setPlanManagerEmail(e.target.value)}
                    placeholder="invoices@planmanager.com.au"
                  />
                </FormField>
              </FormGrid2>
            )}

            <FormGrid2 style={{ marginTop: 16 }}>
              <FormField label="Allocated Weekly Support Hours" id="pHours">
                <FormInput
                  id="pHours"
                  type="number"
                  min="1"
                  max="168"
                  value={allocatedHours}
                  onChange={(e) => setAllocatedHours(e.target.value)}
                  placeholder="8"
                />
              </FormField>

              <FormField label="Primary Service Area" id="pService">
                <FormSelect
                  id="pService"
                  value={primaryService}
                  onChange={(e) => setPrimaryService(e.target.value)}
                >
                  <option value="Community Participation & Daily Living">Community Participation & Daily Living</option>
                  <option value="Personal Care & In-Home Support">Personal Care & In-Home Support</option>
                  <option value="Social & Civic Access">Social & Civic Access</option>
                  <option value="Respite & Day Programs">Respite & Day Programs</option>
                </FormSelect>
              </FormField>
            </FormGrid2>
          </FormSection>
        )}

        {/* STEP 4: NOMINEE & EMERGENCY CONTACT */}
        {step === 4 && (
          <FormSection title="4. Nominee & Emergency Contacts">
            <FormField label="Authorized Representative / Nominee (Optional)" hint="Family member, guardian, or advocate" id="pContact">
              <FormInput
                id="pContact"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Margaret Vance (Mother)"
              />
            </FormField>

            <FormGrid2 style={{ marginTop: 16 }}>
              <FormField label="Emergency Contact Name" id="pEmName">
                <FormInput
                  id="pEmName"
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  placeholder="Contact Name"
                />
              </FormField>

              <FormField label="Emergency Phone" id="pEmPhone">
                <FormInput
                  id="pEmPhone"
                  type="tel"
                  value={emergencyContactPhone}
                  onChange={(e) => setEmergencyContactPhone(e.target.value)}
                  placeholder="0400 000 000"
                />
              </FormField>
            </FormGrid2>

            <div style={{ marginTop: 16 }}>
              <FormField label="Relationship to Participant" id="pEmRel">
                <FormInput
                  id="pEmRel"
                  value={emergencyContactRelation}
                  onChange={(e) => setEmergencyContactRelation(e.target.value)}
                  placeholder="e.g. Next of kin / Sibling"
                />
              </FormField>
            </div>
          </FormSection>
        )}

        {/* STEP 5: REVIEW & SUMMARY */}
        {step === 5 && (
          <FormSection title="5. Review & Create Record">
            <FormSummaryCard
              title="Participant Registration Summary"
              badge="Ready for Verification"
              rows={[
                { label: 'Full Legal Name', value: name || 'Not specified' },
                { label: 'NDIS Number', value: ndisNumber || 'Not recorded' },
                { label: 'Service Location', value: suburb },
                { label: 'Funding Structure', value: fundingType },
                {
                  label: 'Plan Manager',
                  value: fundingType === 'Plan-Managed' ? planManagerName || 'Pending' : 'N/A (Self-Managed)',
                },
                { label: 'Allocated Weekly Hours', value: `${allocatedHours} hrs / week` },
                { label: 'Primary Support Service', value: primaryService },
              ]}
            />

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
                  checked={completeProfileLater}
                  onChange={(e) => setCompleteProfileLater(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: 'var(--brand-primary)' }}
                />
                <span>Mark as Pending Intake (Coordinator will follow up for full care notes)</span>
              </label>
            </div>
          </FormSection>
        )}
      </div>

      <StickyFormFooter
        onCancel={onClose}
        onSecondary={step > 1 ? handleBack : undefined}
        secondaryLabel="Back"
        onPrimary={step < 5 ? handleNext : () => handleSubmit()}
        primaryLabel={step < 5 ? 'Continue' : 'Create Participant'}
        primaryIcon={step === 5 ? <Check size={15} /> : undefined}
        showArrow={step < 5}
        loading={submitting}
      />
    </FormDrawer>
  );
}
