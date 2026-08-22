'use client';

import { FormEvent, useState } from 'react';
import { ArrowRight, CheckCircle2, Loader2, User, Users, Shield, MapPin, Calendar, Heart, ArrowLeft, HelpCircle } from 'lucide-react';

const serviceOptions = [
  { id: 'daily-living', title: 'Daily Living Support', desc: 'Routines, meal prep, personal assistance at home' },
  { id: 'community', title: 'Community Participation', desc: 'Social activities, shopping, appointments & outings' },
  { id: 'transport', title: 'Transport Support', desc: 'Getting to appointments, work, study & community' },
  { id: 'life-skills', title: 'Life Skills & Capacity', desc: 'Confidence building, budgeting, cooking & independence' },
  { id: 'companionship', title: 'Companionship & Mentoring', desc: 'Shared hobbies, active listening & 1-on-1 friendship' },
  { id: 'household', title: 'Household Assistance', desc: 'Everyday household chores & practical home organisation' },
];

const roles = [
  { id: 'participant', label: 'NDIS Participant', icon: User },
  { id: 'family', label: 'Family / Carer / Nominee', icon: Heart },
  { id: 'coordinator', label: 'Support Coordinator', icon: Users },
  { id: 'plan-manager', label: 'Plan Manager', icon: Shield },
];

const fundingTypes = [
  { id: 'plan-managed', label: 'Plan-Managed (Most Common)', desc: 'Invoices sent directly to your plan manager' },
  { id: 'self-managed', label: 'Self-Managed', desc: 'Invoices sent to you for NDIS portal reimbursement' },
  { id: 'not-sure', label: 'Not Sure / Applying', desc: 'We can help explain your plan setup during intake' },
];

export function ReferralForm() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    role: 'participant',
    name: '',
    phone: '',
    email: '',
    participantName: '',
    suburb: '',
    funding: 'plan-managed',
    services: [] as string[],
    days: [] as string[],
    message: '',
    contactPreference: 'Phone',
    consent: false,
  });

  const toggleService = (title: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(title)
        ? prev.services.filter(s => s !== title)
        : [...prev.services, title]
    }));
  };

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formData.consent) {
      alert('Please check the consent box to submit your enquiry.');
      return;
    }
    setStatus('sending');
    setMessage('');
    try {
      const response = await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          service: formData.services.join(', ') || 'General Enquiry',
          schedulePreference: formData.days.join(', ') || 'Flexible'
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Unable to send referral');
      setStatus('success');
      setMessage('Thank you! Your referral enquiry has been received. Our team will contact you within 1 business day.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Online referrals are currently being configured. Please contact us directly at support@carepointsupport.com.au.');
    }
  }

  if (status === 'success') {
    return (
      <div className="referralSuccessCard">
        <div className="successIconBadge">
          <CheckCircle2 size={48} color="#0D9488" />
        </div>
        <h3>Referral Received Successfully</h3>
        <p className="successLead">{message}</p>
        <div className="successDetailsBox">
          <div><strong>Name:</strong> {formData.name}</div>
          <div><strong>Role:</strong> {formData.role}</div>
          <div><strong>Suburb:</strong> {formData.suburb || 'Greater Sydney'}</div>
          <div><strong>Selected Supports:</strong> {formData.services.join(', ') || 'General support'}</div>
        </div>
        <p className="successNote">We treat all information confidentially in accordance with the Privacy Act and NDIS Code of Conduct.</p>
        <button className="button" type="button" onClick={() => { setStatus('idle'); setStep(1); }}>
          Submit another referral
        </button>
      </div>
    );
  }

  return (
    <form className="crispReferralWizard" onSubmit={handleSubmit}>
      {/* Wizard Header & Progress */}
      <div className="wizardHeader">
        <div className="wizardPillRow">
          <span className="wizardBadge">Direct Referral & Intake</span>
          <span className="stepCounter">Step {step} of 3</span>
        </div>
        <h3>{step === 1 ? '1. Your Details & Role' : step === 2 ? '2. Support Needs & NDIS Plan' : '3. Location, Schedule & Submit'}</h3>
        <p className="wizardSubtitle">
          {step === 1 && 'Tell us who is reaching out so we can prepare the right conversation.'}
          {step === 2 && 'Select the types of support you’re looking for and your funding arrangement.'}
          {step === 3 && 'Let us know your preferred days, location and any initial questions.'}
        </p>

        {/* Step Progress Bar */}
        <div className="progressBarTrack">
          <div className="progressBarFill" style={{ width: step === 1 ? '33.3%' : step === 2 ? '66.6%' : '100%' }} />
        </div>
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <div className="wizardStepSection">
          <div className="fieldGroup">
            <label className="fieldTitle">Who is this referral for?</label>
            <div className="roleSelectorGrid">
              {roles.map(({ id, label, icon: Icon }) => (
                <button
                  type="button"
                  key={id}
                  className={`roleSelectBtn ${formData.role === id ? 'activeRole' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, role: id }))}
                >
                  <Icon size={20} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="twoColumns">
            <label className="inputLabel">
              <span>Your Full Name <strong className="req">*</strong></span>
              <input
                required
                type="text"
                className="crispInput"
                placeholder="e.g. Sarah Jenkins"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </label>

            {(formData.role === 'coordinator' || formData.role === 'family' || formData.role === 'plan-manager') && (
              <label className="inputLabel">
                <span>Participant First Name / Initials</span>
                <input
                  type="text"
                  className="crispInput"
                  placeholder="e.g. Alex (optional for privacy)"
                  value={formData.participantName}
                  onChange={e => setFormData({ ...formData, participantName: e.target.value })}
                />
              </label>
            )}
          </div>

          <div className="twoColumns">
            <label className="inputLabel">
              <span>Phone Number <strong className="req">*</strong></span>
              <input
                required
                type="tel"
                className="crispInput"
                placeholder="04xx xxx xxx"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
              />
            </label>

            <label className="inputLabel">
              <span>Email Address <strong className="req">*</strong></span>
              <input
                required
                type="email"
                className="crispInput"
                placeholder="name@example.com.au"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </label>
          </div>

          <div className="wizardNavActions">
            <div className="privacyNoticeText">
              <Shield size={16} />
              <span>We never share your contact details. Only used to discuss your support request.</span>
            </div>
            <button
              type="button"
              className="button"
              onClick={() => {
                if (!formData.name || !formData.phone || !formData.email) {
                  alert('Please enter your Name, Phone and Email to continue.');
                  return;
                }
                setStep(2);
              }}
            >
              Continue to Support Needs <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div className="wizardStepSection">
          <div className="fieldGroup">
            <label className="fieldTitle">Select Required Supports <span className="helperText">(Select all that apply)</span></label>
            <div className="serviceCheckGrid">
              {serviceOptions.map(({ id, title, desc }) => {
                const isSelected = formData.services.includes(title);
                return (
                  <div
                    key={id}
                    className={`serviceCheckCard ${isSelected ? 'serviceSelected' : ''}`}
                    onClick={() => toggleService(title)}
                  >
                    <div className="serviceCheckHeader">
                      <div className={`fakeCheckbox ${isSelected ? 'checked' : ''}`}>
                        {isSelected && <CheckCircle2 size={16} color="#FFFFFF" />}
                      </div>
                      <strong>{title}</strong>
                    </div>
                    <p>{desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="fieldGroup">
            <label className="fieldTitle">NDIS Plan Management Type</label>
            <div className="fundingSelectorGrid">
              {fundingTypes.map(({ id, label, desc }) => (
                <div
                  key={id}
                  className={`fundingCard ${formData.funding === id ? 'activeFunding' : ''}`}
                  onClick={() => setFormData({ ...formData, funding: id })}
                >
                  <strong>{label}</strong>
                  <p>{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="wizardNavActions between">
            <button type="button" className="button secondary" onClick={() => setStep(1)}>
              <ArrowLeft size={16} /> Back
            </button>
            <button
              type="button"
              className="button"
              onClick={() => setStep(3)}
            >
              Continue to Location &amp; Schedule <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div className="wizardStepSection">
          <div className="twoColumns">
            <label className="inputLabel">
              <span>Participant Suburb / Area in Sydney <strong className="req">*</strong></span>
              <input
                required
                type="text"
                className="crispInput"
                placeholder="e.g. Parramatta, Liverpool, Ryde, Hills..."
                value={formData.suburb}
                onChange={e => setFormData({ ...formData, suburb: e.target.value })}
              />
            </label>

            <label className="inputLabel">
              <span>Preferred Contact Method</span>
              <select
                className="crispInput"
                value={formData.contactPreference}
                onChange={e => setFormData({ ...formData, contactPreference: e.target.value })}
              >
                <option>Phone call</option>
                <option>Email</option>
                <option>SMS message first</option>
              </select>
            </label>
          </div>

          <div className="fieldGroup">
            <label className="fieldTitle">Preferred Days for Support</label>
            <div className="daysRow">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Flexible'].map(day => (
                <button
                  type="button"
                  key={day}
                  className={`dayPill ${formData.days.includes(day) ? 'activeDay' : ''}`}
                  onClick={() => toggleDay(day)}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <label className="inputLabel">
            <span>How can we best support you? <span className="helperText">(Goals, hobbies, specific requirements)</span></span>
            <textarea
              className="crispTextarea"
              rows={4}
              placeholder="Tell us a little about your goals (e.g. looking for someone friendly to help get out into the community on Tuesday mornings, visit local cafes, or assist with weekly meal planning)..."
              value={formData.message}
              onChange={e => setFormData({ ...formData, message: e.target.value })}
            />
          </label>

          <label className="consentCheckbox">
            <input
              required
              type="checkbox"
              checked={formData.consent}
              onChange={e => setFormData({ ...formData, consent: e.target.checked })}
            />
            <span>
              I consent to CarePoint Support Services contacting me regarding this disability support enquiry. (No sensitive medical documents required now).
            </span>
          </label>

          {message && status === 'error' && (
            <div className="formStatus error">
              <span>{message}</span>
            </div>
          )}

          <div className="wizardNavActions between">
            <button type="button" className="button secondary" onClick={() => setStep(2)}>
              <ArrowLeft size={16} /> Back
            </button>
            <button
              type="submit"
              className="button submitBtn"
              disabled={status === 'sending'}
            >
              {status === 'sending' ? (
                <>
                  <Loader2 className="spin" size={18} /> Submitting Referral...
                </>
              ) : (
                <>
                  Submit Referral Enquiry <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
