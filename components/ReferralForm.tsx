'use client';

import { FormEvent, useState } from 'react';
import { ArrowRight, CheckCircle2, Loader2, User, Users, Shield, MapPin, Calendar, Heart, ArrowLeft, Check, Sparkles } from 'lucide-react';

const serviceOptions = [
  { id: 'daily-living', title: 'Daily Living Support', desc: 'Routines, meal prep & personal care at home' },
  { id: 'community', title: 'Community Participation', desc: 'Social outings, beach trips, sports & activities' },
  { id: 'transport', title: 'Transport Assistance', desc: 'Medical appointments, work & community transit' },
  { id: 'life-skills', title: 'Life Skills & Capacity', desc: 'Budgeting, cooking, shopping & independence' },
  { id: 'respite', title: 'In-Home Respite Care', desc: 'Attentive care giving primary carers peace of mind' },
  { id: 'mentoring', title: '1-on-1 Mentoring & Coaching', desc: 'Confidence, fitness routines & goal setting' },
];

const roles = [
  { id: 'participant', label: 'NDIS Participant', icon: User },
  { id: 'family', label: 'Family / Carer / Nominee', icon: Heart },
  { id: 'coordinator', label: 'Support Coordinator', icon: Users },
  { id: 'plan-manager', label: 'Plan Manager', icon: Shield },
];

const fundingTypes = [
  { id: 'plan-managed', label: 'Plan-Managed', desc: 'Invoices sent directly to plan manager' },
  { id: 'self-managed', label: 'Self-Managed', desc: 'Invoices sent directly to participant' },
  { id: 'not-sure', label: 'Not Sure / Applying', desc: 'We explain during intake call' },
];

const availableDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function ReferralForm() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [stepError, setStepError] = useState('');
  const [submittedReferenceNumber, setSubmittedReferenceNumber] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    role: 'participant',
    name: '',
    phone: '',
    email: '',
    participantName: '',
    suburb: '',
    funding: 'Plan-Managed',
    services: [] as string[],
    days: [] as string[],
    message: '',
    consent: true,
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
    if (status === 'sending') return;
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
      setSubmittedReferenceNumber(result.id || result.reference_number || '');
      setStatus('success');
      setMessage('Thank you! Your referral enquiry has been received and recorded in the Opus Care CRM. Our intake team will contact you shortly.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Unable to submit referral at this time. Please email us at referrals@opuscare.com.au.');
    }
  }

  if (status === 'success') {
    return (
      <div className="referralSuccessPane">
        <div className="successIconWrap">
          <CheckCircle2 size={48} color="#10B981" />
        </div>
        <h3>Referral Received!</h3>
        <p className="successLead">{message}</p>
        <div className="successDetailsBox">
          {submittedReferenceNumber && (
            <div>
              <strong>Reference Number:</strong>{' '}
              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--oc-brand, #2563EB)' }}>
                {submittedReferenceNumber}
              </span>
            </div>
          )}
          <div><strong>Participant:</strong> {formData.participantName || formData.name}</div>
          <div><strong>Contact Phone:</strong> {formData.phone}</div>
          <div><strong>Suburbs:</strong> {formData.suburb || 'Yamba / Northern Rivers'}</div>
          <div><strong>Response Time:</strong> Our intake team will contact you shortly</div>
        </div>
        <button
          type="button"
          onClick={() => {
            setStatus('idle');
            setStepError('');
            setSubmittedReferenceNumber('');
            setStep(1);
            setFormData({
              role: 'participant',
              name: '',
              phone: '',
              email: '',
              participantName: '',
              suburb: '',
              funding: 'Plan-Managed',
              services: [],
              days: [],
              message: '',
              consent: true,
            });
          }}
          className="paneBtn primary"
        >
          Submit Another Referral
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="referralWizardForm">
      {/* Wizard Progress Header */}
      <div className="wizardProgressHeader">
        <div className="wizardStepInfo">
          <span className="wizardStepTag">STEP {step} OF 3</span>
          <h3>
            {step === 1 && '1. Contact Details & Role'}
            {step === 2 && '2. Support Preferences'}
            {step === 3 && '3. Schedule & Confirmation'}
          </h3>
        </div>
        <div className="wizardProgressBarTrack">
          <div
            className="wizardProgressBarFill"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      {status === 'error' && (
        <div className="formErrorNotice">
          ⚠️ {message}
        </div>
      )}

      {/* ─── STEP 1: CONTACT DETAILS ───────────────────────────────────── */}
      {step === 1 && (
        <div className="wizardStepBody">
          <div className="fieldGroupBlock">
            <label className="fieldTitleLabel">Who is submitting this referral?</label>
            <div className="roleSelectionGrid">
              {roles.map((r) => {
                const Icon = r.icon;
                const active = formData.role === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, role: r.id }))}
                    className={`roleSelectCard ${active ? 'selected' : ''}`}
                  >
                    <Icon size={18} />
                    <span>{r.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="formGridRow2">
            <div className="fieldGroupBlock">
              <label className="fieldTitleLabel">Your Full Name <span className="req">*</span></label>
              <input
                type="text"
                required
                placeholder="e.g. Sarah Jenkins"
                value={formData.name}
                onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                className="luxuryInput"
              />
            </div>

            <div className="fieldGroupBlock">
              <label className="fieldTitleLabel">Participant Full Name (if different)</label>
              <input
                type="text"
                placeholder="e.g. Liam Davies"
                value={formData.participantName}
                onChange={(e) => setFormData(p => ({ ...p, participantName: e.target.value }))}
                className="luxuryInput"
              />
            </div>
          </div>

          <div className="formGridRow2">
            <div className="fieldGroupBlock">
              <label className="fieldTitleLabel">Contact Phone Number <span className="req">*</span></label>
              <input
                type="tel"
                required
                placeholder="04xx xxx xxx"
                value={formData.phone}
                onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                className="luxuryInput"
              />
            </div>

            <div className="fieldGroupBlock">
              <label className="fieldTitleLabel">Email Address <span className="req">*</span></label>
              <input
                type="email"
                required
                placeholder="name@example.com.au"
                value={formData.email}
                onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                className="luxuryInput"
              />
            </div>
          </div>

          <div className="fieldGroupBlock">
            <label className="fieldTitleLabel">Participant Town or Suburb</label>
            <input
              type="text"
              placeholder="e.g. Yamba, Maclean, Grafton, New Italy..."
              value={formData.suburb}
              onChange={(e) => setFormData(p => ({ ...p, suburb: e.target.value }))}
              className="luxuryInput"
            />
          </div>

          {stepError && (
            <div className="formErrorNotice" style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}>
              ⚠️ {stepError}
            </div>
          )}

          <div className="wizardNavRow rightOnly">
            <button
              type="button"
              onClick={() => {
                if (!formData.name.trim() || !formData.phone.trim() || !formData.email.trim()) {
                  setStepError('Please enter your full name, phone number, and email address before proceeding.');
                  return;
                }
                setStepError('');
                setStep(2);
              }}
              className="heroPillBtn filled"
            >
              <span>Continue to Step 2</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 2: SUPPORT PREFERENCES ───────────────────────────────── */}
      {step === 2 && (
        <div className="wizardStepBody">
          <div className="fieldGroupBlock">
            <label className="fieldTitleLabel">Which support services are needed?</label>
            <div className="servicesCardsCheckGrid">
              {serviceOptions.map((srv) => {
                const checked = formData.services.includes(srv.title);
                return (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => toggleService(srv.title)}
                    className={`serviceSelectCard ${checked ? 'selected' : ''}`}
                  >
                    <div className="checkboxDot">{checked ? '✓' : ''}</div>
                    <div className="serviceSelectText">
                      <strong>{srv.title}</strong>
                      <small>{srv.desc}</small>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="fieldGroupBlock">
            <label className="fieldTitleLabel">NDIS Funding Management Type</label>
            <div className="fundingTypeSelectGrid">
              {fundingTypes.map((f) => {
                const active = formData.funding === f.label;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, funding: f.label }))}
                    className={`fundingSelectCard ${active ? 'selected' : ''}`}
                  >
                    <strong>{f.label}</strong>
                    <small>{f.desc}</small>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="wizardNavRow">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="heroPillBtn outline"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="heroPillBtn filled"
            >
              <span>Continue to Final Step</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 3: SCHEDULE & SUBMIT ─────────────────────────────────── */}
      {step === 3 && (
        <div className="wizardStepBody">
          <div className="fieldGroupBlock">
            <label className="fieldTitleLabel">Preferred Support Days (Optional)</label>
            <div className="daysPillsSelector">
              {availableDays.map((day) => {
                const active = formData.days.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`dayChipBtn ${active ? 'selected' : ''}`}
                  >
                    {active ? '✓ ' : '+ '}{day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="fieldGroupBlock">
            <label className="fieldTitleLabel">Additional Notes or Participant Goals</label>
            <textarea
              rows={4}
              placeholder="Tell us about hobbies, personality, specific shift hours needed, or goals..."
              value={formData.message}
              onChange={(e) => setFormData(p => ({ ...p, message: e.target.value }))}
              className="luxuryTextarea"
            />
          </div>

          <div className="consentCheckboxGroup">
            <label className="consentLabel">
              <input
                type="checkbox"
                checked={formData.consent}
                onChange={(e) => setFormData(p => ({ ...p, consent: e.target.checked }))}
                className="customCheckbox"
              />
              <span>
                I confirm the participant or nominee has consented to sharing these details with Opus Care Support Services for NDIS service intake.
              </span>
            </label>
          </div>

          <div className="wizardNavRow">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="heroPillBtn outline"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            <button
              type="submit"
              disabled={status === 'sending'}
              className="heroPillBtn filled submit"
            >
              {status === 'sending' ? (
                <>
                  <Loader2 size={18} className="spin" />
                  <span>Submitting Referral...</span>
                </>
              ) : (
                <>
                  <span>Submit Direct Referral</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
