'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  AlertCircle,
  Upload,
  FileText,
  X,
  ArrowRight,
  ArrowLeft,
  Briefcase,
  ShieldCheck,
  Calendar,
  Clock,
  MapPin,
  Send,
  Loader2,
  Info
} from 'lucide-react';
import { RECRUITMENT_SERVICE_AREAS } from '@/lib/regions';

export interface CareersApplicationFormProps {
  applicationType: 'vacancy' | 'eoi';
  vacancyId?: string;
  vacancyTitle?: string;
  childRelatedRole?: boolean;
  driverLicenceRequired?: boolean;
  vehicleRequired?: boolean;
  onSuccess?: (referenceNumber: string) => void;
}

export function CareersApplicationForm({
  applicationType = 'eoi',
  vacancyId,
  vacancyTitle,
  childRelatedRole = false,
  driverLicenceRequired = false,
  vehicleRequired = false,
  onSuccess
}: CareersApplicationFormProps) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successReference, setSuccessReference] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Contact
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    suburb: '',
    postcode: '',
    eoi_role_interest: 'Disability Support Worker',

    // Step 2: Work Preferences
    preferred_service_area_ids: [] as string[],
    employment_preferences: ['casual'] as string[],
    work_rights_status: 'yes',
    earliest_start_date: '',

    // Step 3: Experience & Readiness Declarations
    experience_summary: '',
    qualification_summary: '',
    driver_licence_status: driverLicenceRequired ? 'yes' : 'not_applicable',
    vehicle_access_status: vehicleRequired ? 'yes' : 'not_applicable',
    ndiswc_status_declared: 'current',
    police_check_status_declared: 'current',
    first_aid_status_declared: 'current',
    cpr_status_declared: 'current',
    wwcc_status_declared: childRelatedRole ? 'current' : 'not_applicable',

    // Step 4: Availability
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as string[],
    available_periods: ['Daytime'] as string[],
    availability_notes: '',
    motivation: '',

    // Step 5: Consents
    privacy_consent: false,
    accuracy_declaration: false,

    // Honeypot (bot trap)
    website_url: ''
  });

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const resumeInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrorMessage('');
  };

  const toggleArrayItem = (field: 'preferred_service_area_ids' | 'employment_preferences' | 'available_days' | 'available_periods', item: string) => {
    setFormData(prev => {
      const current = prev[field] || [];
      const exists = current.includes(item);
      const updated = exists ? current.filter(x => x !== item) : [...current, item];
      return { ...prev, [field]: updated };
    });
  };

  const validateStep = (currentStep: number): boolean => {
    setErrorMessage('');

    if (currentStep === 1) {
      if (!formData.first_name.trim()) {
        setErrorMessage('Please provide your first name.');
        return false;
      }
      if (!formData.last_name.trim()) {
        setErrorMessage('Please provide your last name.');
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
        setErrorMessage('Please enter a valid email address.');
        return false;
      }
      if (!formData.phone.trim()) {
        setErrorMessage('Please enter a contact phone number.');
        return false;
      }
      if (!formData.suburb.trim()) {
        setErrorMessage('Please enter your residential suburb.');
        return false;
      }
      if (!/^\d{4}$/.test(formData.postcode.trim())) {
        setErrorMessage('Please enter a valid 4-digit Australian postcode.');
        return false;
      }
      return true;
    }

    if (currentStep === 2) {
      if (formData.preferred_service_area_ids.length === 0) {
        setErrorMessage('Please select at least one preferred service area.');
        return false;
      }
      if (formData.employment_preferences.length === 0) {
        setErrorMessage('Please select at least one employment preference.');
        return false;
      }
      return true;
    }

    if (currentStep === 3) {
      // Experience is optional but recommended
      return true;
    }

    if (currentStep === 4) {
      if (applicationType === 'vacancy' && !resumeFile) {
        setErrorMessage('Please upload your Resume / CV before continuing.');
        return false;
      }
      return true;
    }

    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, 5));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      errorRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setErrorMessage('');
    setStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.privacy_consent) {
      setErrorMessage('You must confirm that you have read and agreed to the Privacy Policy.');
      return;
    }
    if (!formData.accuracy_declaration) {
      setErrorMessage('You must confirm that the information provided is accurate.');
      return;
    }

    if (applicationType === 'vacancy' && !resumeFile) {
      setErrorMessage('Resume / CV document is required for vacancy applications.');
      return;
    }

    setSubmitting(true);

    try {
      const dataPayload = new FormData();
      dataPayload.append('application_type', applicationType);
      if (applicationType === 'vacancy' && vacancyId) {
        dataPayload.append('vacancy_id', vacancyId);
      }
      dataPayload.append('first_name', formData.first_name.trim());
      dataPayload.append('last_name', formData.last_name.trim());
      dataPayload.append('email', formData.email.trim());
      dataPayload.append('phone', formData.phone.trim());
      dataPayload.append('suburb', formData.suburb.trim());
      dataPayload.append('postcode', formData.postcode.trim());

      dataPayload.append('preferred_service_area_ids', JSON.stringify(formData.preferred_service_area_ids));
      dataPayload.append('employment_preferences', JSON.stringify(formData.employment_preferences));
      dataPayload.append('work_rights_status', formData.work_rights_status);
      if (formData.earliest_start_date) {
        dataPayload.append('earliest_start_date', formData.earliest_start_date);
      }

      dataPayload.append('experience_summary', formData.experience_summary.trim());
      dataPayload.append('qualification_summary', formData.qualification_summary.trim());
      dataPayload.append('driver_licence_status', formData.driver_licence_status);
      dataPayload.append('vehicle_access_status', formData.vehicle_access_status);
      dataPayload.append('ndiswc_status_declared', formData.ndiswc_status_declared);
      dataPayload.append('police_check_status_declared', formData.police_check_status_declared);
      dataPayload.append('first_aid_status_declared', formData.first_aid_status_declared);
      dataPayload.append('cpr_status_declared', formData.cpr_status_declared);
      dataPayload.append('wwcc_status_declared', formData.wwcc_status_declared);

      const availabilityObj = {
        days: formData.available_days,
        periods: formData.available_periods
      };
      dataPayload.append('availability', JSON.stringify(availabilityObj));
      dataPayload.append('availability_notes', formData.availability_notes.trim());
      dataPayload.append('motivation', formData.motivation.trim());

      dataPayload.append('privacy_consent', 'true');
      dataPayload.append('accuracy_declaration', 'true');

      if (formData.website_url) {
        dataPayload.append('website_url', formData.website_url);
      }

      if (resumeFile) {
        dataPayload.append('resume', resumeFile);
      }
      if (coverFile) {
        dataPayload.append('cover_letter', coverFile);
      }

      const res = await fetch('/api/careers/applications', {
        method: 'POST',
        body: dataPayload
      });

      const result = await res.json();

      if (!res.ok || !result.ok) {
        setErrorMessage(result.error || 'Failed to submit application. Please check your information and try again.');
        setSubmitting(false);
        return;
      }

      setSuccessReference(result.reference_number || 'APP-2026-0001');
      if (onSuccess) {
        onSuccess(result.reference_number);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'A network error occurred. Please check your connection and try again.');
      setSubmitting(false);
    }
  };

  // SUCCESS STATE
  if (successReference) {
    return (
      <div className="careersSuccessCard" role="region" aria-live="polite">
        <div className="successIconBadge">
          <CheckCircle2 size={44} className="textEmerald" />
        </div>
        <h2 className="successTitle">Application received</h2>
        <p className="successSubtitle">
          Thank you for your interest in Opus Care Support Services.
        </p>

        <div className="referenceHighlightBox">
          <span className="refLabel">Your application reference:</span>
          <strong className="refNumber">{successReference}</strong>
        </div>

        <p className="successNoticeText">
          Our team will review your application. If we need more information or would like to progress your application, we&apos;ll contact you using the details you provided.
        </p>

        <div className="successSecurityNotice">
          <ShieldCheck size={16} />
          <span>
            For privacy and security, we will never ask for your bank, tax file number or sensitive identity numbers over unencrypted email.
          </span>
        </div>

        <div className="successActionsRow">
          <Link href="/careers" className="btnPrimary">
            Return to Careers
          </Link>
          <Link href="/services" className="btnSecondary">
            View Opus Care Services
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="careersFormContainer">
      {/* Progress Steps Header */}
      <div className="careersStepTracker" aria-label="Application Progress">
        <div className={`stepDot ${step >= 1 ? 'active' : ''} ${step > 1 ? 'done' : ''}`}>
          <span className="stepNum">1</span>
          <span className="stepLabel">Contact</span>
        </div>
        <div className="stepLine"></div>
        <div className={`stepDot ${step >= 2 ? 'active' : ''} ${step > 2 ? 'done' : ''}`}>
          <span className="stepNum">2</span>
          <span className="stepLabel">Preferences</span>
        </div>
        <div className="stepLine"></div>
        <div className={`stepDot ${step >= 3 ? 'active' : ''} ${step > 3 ? 'done' : ''}`}>
          <span className="stepNum">3</span>
          <span className="stepLabel">Experience</span>
        </div>
        <div className="stepLine"></div>
        <div className={`stepDot ${step >= 4 ? 'active' : ''} ${step > 4 ? 'done' : ''}`}>
          <span className="stepNum">4</span>
          <span className="stepLabel">Documents</span>
        </div>
        <div className="stepLine"></div>
        <div className={`stepDot ${step >= 5 ? 'active' : ''}`}>
          <span className="stepNum">5</span>
          <span className="stepLabel">Review</span>
        </div>
      </div>

      {/* Honeypot hidden input */}
      <div style={{ display: 'none' }} aria-hidden="true">
        <input
          type="text"
          name="website_url"
          tabIndex={-1}
          autoComplete="off"
          value={formData.website_url}
          onChange={e => handleInputChange('website_url', e.target.value)}
        />
      </div>

      {/* Inline Error Alert */}
      {errorMessage && (
        <div ref={errorRef} className="formErrorAlert" role="alert" aria-live="assertive">
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* STEP 1: Contact & Role */}
        {step === 1 && (
          <fieldset className="formStepFieldset">
            <legend className="stepTitle">
              {applicationType === 'eoi' ? 'Expression of Interest — Your Contact Details' : `Apply for: ${vacancyTitle || 'Support Role'}`}
            </legend>
            <p className="stepDescription">
              {applicationType === 'eoi'
                ? 'Tell us who you are and what type of support work you are interested in across Northern NSW or Sydney.'
                : 'Please complete your contact details. We will use these to acknowledge your application and stay in touch.'}
            </p>

            {applicationType === 'eoi' && (
              <div className="formGroup">
                <label htmlFor="eoi_role_interest" className="formLabel">Role of Interest *</label>
                <select
                  id="eoi_role_interest"
                  className="formSelect"
                  value={formData.eoi_role_interest}
                  onChange={e => handleInputChange('eoi_role_interest', e.target.value)}
                >
                  <option value="Disability Support Worker">Disability Support Worker</option>
                  <option value="Community Support Worker">Community Support Worker</option>
                  <option value="Future support opportunities">Future support opportunities</option>
                  <option value="Administration / coordination">Administration / coordination</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            )}

            <div className="formRowGrid">
              <div className="formGroup">
                <label htmlFor="first_name" className="formLabel">First Name *</label>
                <input
                  id="first_name"
                  type="text"
                  required
                  maxLength={80}
                  className="formInput"
                  placeholder="e.g. Jane"
                  value={formData.first_name}
                  onChange={e => handleInputChange('first_name', e.target.value)}
                />
              </div>

              <div className="formGroup">
                <label htmlFor="last_name" className="formLabel">Last Name *</label>
                <input
                  id="last_name"
                  type="text"
                  required
                  maxLength={80}
                  className="formInput"
                  placeholder="e.g. Smith"
                  value={formData.last_name}
                  onChange={e => handleInputChange('last_name', e.target.value)}
                />
              </div>
            </div>

            <div className="formRowGrid">
              <div className="formGroup">
                <label htmlFor="email" className="formLabel">Email Address *</label>
                <input
                  id="email"
                  type="email"
                  required
                  maxLength={160}
                  className="formInput"
                  placeholder="jane.smith@example.com"
                  value={formData.email}
                  onChange={e => handleInputChange('email', e.target.value)}
                />
              </div>

              <div className="formGroup">
                <label htmlFor="phone" className="formLabel">Mobile / Phone Number *</label>
                <input
                  id="phone"
                  type="tel"
                  required
                  maxLength={40}
                  className="formInput"
                  placeholder="0400 000 000"
                  value={formData.phone}
                  onChange={e => handleInputChange('phone', e.target.value)}
                />
              </div>
            </div>

            <div className="formRowGrid">
              <div className="formGroup">
                <label htmlFor="suburb" className="formLabel">Residential Suburb / Town *</label>
                <input
                  id="suburb"
                  type="text"
                  required
                  maxLength={100}
                  className="formInput"
                  placeholder="e.g. Coffs Harbour or Blacktown"
                  value={formData.suburb}
                  onChange={e => handleInputChange('suburb', e.target.value)}
                />
              </div>

              <div className="formGroup">
                <label htmlFor="postcode" className="formLabel">Postcode *</label>
                <input
                  id="postcode"
                  type="text"
                  required
                  maxLength={4}
                  className="formInput"
                  placeholder="2450"
                  value={formData.postcode}
                  onChange={e => handleInputChange('postcode', e.target.value)}
                />
              </div>
            </div>

            <div className="privacyProtectionNotice">
              <ShieldCheck size={16} className="textEmerald" />
              <span>
                <strong>Privacy Guaranteed:</strong> Opus Care does not ask for your Tax File Number (TFN), bank account, superannuation, Medicare or driver licence number on initial applications.
              </span>
            </div>

            <div className="formNavRow">
              <div></div>
              <button type="button" onClick={nextStep} className="btnPrimary">
                <span>Continue to Work Preferences</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </fieldset>
        )}

        {/* STEP 2: Work Preferences */}
        {step === 2 && (
          <fieldset className="formStepFieldset">
            <legend className="stepTitle">Work Preferences & Locations</legend>
            <p className="stepDescription">
              Select the service regions where you are willing and able to travel for support work.
            </p>

            <div className="formGroup">
              <label className="formLabel">Preferred Service Areas *</label>
              <div className="checkboxGrid">
                {RECRUITMENT_SERVICE_AREAS.map(area => (
                  <label key={area.id} className="checkboxCardLabel">
                    <input
                      type="checkbox"
                      checked={formData.preferred_service_area_ids.includes(area.id)}
                      onChange={() => toggleArrayItem('preferred_service_area_ids', area.id)}
                    />
                    <span className="checkboxTitle">{area.name}</span>
                    <span className="checkboxSub">{area.region}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="formGroup">
              <label className="formLabel">Employment Basis Preference *</label>
              <div className="checkboxGrid">
                {[
                  { id: 'casual', title: 'Casual', desc: 'Flexible hourly shifts based on participant needs' },
                  { id: 'part_time', title: 'Part-Time', desc: 'Agreed regular recurring weekly hours' },
                  { id: 'full_time', title: 'Full-Time', desc: 'Standard 38-hour weekly roster' },
                  { id: 'fixed_term', title: 'Fixed-Term', desc: 'Set period or specific support project' },
                  { id: 'flexible', title: 'Flexible / Open to discussion', desc: 'Open to various working arrangements' },
                ].map(opt => (
                  <label key={opt.id} className="checkboxCardLabel">
                    <input
                      type="checkbox"
                      checked={formData.employment_preferences.includes(opt.id)}
                      onChange={() => toggleArrayItem('employment_preferences', opt.id)}
                    />
                    <span className="checkboxTitle">{opt.title}</span>
                    <span className="checkboxSub">{opt.desc}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="formRowGrid">
              <div className="formGroup">
                <label htmlFor="work_rights_status" className="formLabel">Valid Australian Work Rights *</label>
                <select
                  id="work_rights_status"
                  className="formSelect"
                  value={formData.work_rights_status}
                  onChange={e => handleInputChange('work_rights_status', e.target.value)}
                >
                  <option value="yes">Yes — I hold valid unrestricted work rights in Australia</option>
                  <option value="student_visa">Yes — Student / Visa with work rights</option>
                  <option value="unsure">Not sure / Would like to discuss</option>
                  <option value="no">No</option>
                </select>
              </div>

              <div className="formGroup">
                <label htmlFor="earliest_start_date" className="formLabel">Earliest Available Start Date</label>
                <input
                  id="earliest_start_date"
                  type="date"
                  className="formInput"
                  value={formData.earliest_start_date}
                  onChange={e => handleInputChange('earliest_start_date', e.target.value)}
                />
              </div>
            </div>

            <div className="formNavRow">
              <button type="button" onClick={prevStep} className="btnSecondary">
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
              <button type="button" onClick={nextStep} className="btnPrimary">
                <span>Continue to Experience</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </fieldset>
        )}

        {/* STEP 3: Experience & Screening Declarations */}
        {step === 3 && (
          <fieldset className="formStepFieldset">
            <legend className="stepTitle">Experience & Screening Declarations</legend>
            <p className="stepDescription">
              Please share your background and declare the status of standard industry credentials. Note: Initial declarations are unverified; official documents are reviewed before participant-facing work.
            </p>

            <div className="formGroup">
              <label htmlFor="experience_summary" className="formLabel">
                Relevant Experience
              </label>
              <textarea
                id="experience_summary"
                rows={4}
                maxLength={1500}
                className="formTextarea"
                placeholder="Briefly tell us about your experience supporting people with disability, aged care, healthcare, volunteering or relevant transferable skills..."
                value={formData.experience_summary}
                onChange={e => handleInputChange('experience_summary', e.target.value)}
              />
              <span className="charCount">{formData.experience_summary.length} / 1,500 characters</span>
            </div>

            <div className="formGroup">
              <label htmlFor="qualification_summary" className="formLabel">
                Qualifications & Training (Optional)
              </label>
              <textarea
                id="qualification_summary"
                rows={2}
                maxLength={1000}
                className="formTextarea"
                placeholder="e.g. Certificate III / IV in Individual Support, Disability, Community Services, Nursing, or other qualifications..."
                value={formData.qualification_summary}
                onChange={e => handleInputChange('qualification_summary', e.target.value)}
              />
            </div>

            <div className="screeningGrid">
              <div className="formGroup">
                <label htmlFor="driver_licence_status" className="formLabel">Current Driver Licence</label>
                <select
                  id="driver_licence_status"
                  className="formSelect"
                  value={formData.driver_licence_status}
                  onChange={e => handleInputChange('driver_licence_status', e.target.value)}
                >
                  <option value="yes">Current Full / Provisional Licence</option>
                  <option value="no">No current licence</option>
                  <option value="not_applicable">Not applicable</option>
                </select>
              </div>

              <div className="formGroup">
                <label htmlFor="vehicle_access_status" className="formLabel">Access to Reliable Vehicle</label>
                <select
                  id="vehicle_access_status"
                  className="formSelect"
                  value={formData.vehicle_access_status}
                  onChange={e => handleInputChange('vehicle_access_status', e.target.value)}
                >
                  <option value="yes">Yes — Available for participant travel</option>
                  <option value="no">No</option>
                  <option value="not_applicable">Not applicable</option>
                </select>
              </div>

              <div className="formGroup">
                <label htmlFor="ndiswc_status_declared" className="formLabel">NDIS Worker Screening Check</label>
                <select
                  id="ndiswc_status_declared"
                  className="formSelect"
                  value={formData.ndiswc_status_declared}
                  onChange={e => handleInputChange('ndiswc_status_declared', e.target.value)}
                >
                  <option value="current">Current Clearance Held</option>
                  <option value="in_progress">Application In Progress</option>
                  <option value="not_held">Not currently held / Willing to apply</option>
                  <option value="unsure">Not sure</option>
                </select>
              </div>

              <div className="formGroup">
                <label htmlFor="police_check_status_declared" className="formLabel">National Police Certificate</label>
                <select
                  id="police_check_status_declared"
                  className="formSelect"
                  value={formData.police_check_status_declared}
                  onChange={e => handleInputChange('police_check_status_declared', e.target.value)}
                >
                  <option value="current">Current / Issued within 12 months</option>
                  <option value="expired">Expired / Renewal needed</option>
                  <option value="not_held">Not currently held / Willing to apply</option>
                </select>
              </div>

              <div className="formGroup">
                <label htmlFor="first_aid_status_declared" className="formLabel">First Aid (HLTAID011)</label>
                <select
                  id="first_aid_status_declared"
                  className="formSelect"
                  value={formData.first_aid_status_declared}
                  onChange={e => handleInputChange('first_aid_status_declared', e.target.value)}
                >
                  <option value="current">Current Certificate</option>
                  <option value="expired">Expired / Renewal needed</option>
                  <option value="not_held">Not held / Willing to complete</option>
                </select>
              </div>

              <div className="formGroup">
                <label htmlFor="cpr_status_declared" className="formLabel">CPR (HLTAID009)</label>
                <select
                  id="cpr_status_declared"
                  className="formSelect"
                  value={formData.cpr_status_declared}
                  onChange={e => handleInputChange('cpr_status_declared', e.target.value)}
                >
                  <option value="current">Current Certificate (within 12 mo)</option>
                  <option value="expired">Expired / Renewal needed</option>
                  <option value="not_held">Not held / Willing to complete</option>
                </select>
              </div>

              {childRelatedRole && (
                <div className="formGroup">
                  <label htmlFor="wwcc_status_declared" className="formLabel">Working With Children Check (WWCC)</label>
                  <select
                    id="wwcc_status_declared"
                    className="formSelect"
                    value={formData.wwcc_status_declared}
                    onChange={e => handleInputChange('wwcc_status_declared', e.target.value)}
                  >
                    <option value="current">Current NSW WWCC clearance</option>
                    <option value="in_progress">Application in progress</option>
                    <option value="not_held">Not currently held</option>
                  </select>
                </div>
              )}
            </div>

            <div className="formNavRow">
              <button type="button" onClick={prevStep} className="btnSecondary">
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
              <button type="button" onClick={nextStep} className="btnPrimary">
                <span>Continue to Documents</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </fieldset>
        )}

        {/* STEP 4: Documents & Availability */}
        {step === 4 && (
          <fieldset className="formStepFieldset">
            <legend className="stepTitle">Application Documents & Availability</legend>
            <p className="stepDescription">
              Upload your Resume / CV. All documents are stored in secure private storage and never shared publicly.
            </p>

            {/* Resume Upload */}
            <div className="formGroup">
              <label className="formLabel">
                Resume / CV {applicationType === 'vacancy' ? '*' : '(Recommended)'}
              </label>
              <div
                className={`fileUploadZone ${resumeFile ? 'fileSelected' : ''}`}
                onClick={() => resumeInputRef.current?.click()}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') resumeInputRef.current?.click(); }}
                tabIndex={0}
                role="button"
                aria-label="Upload Resume CV. Maximum 8 Megabytes. PDF, DOC, or DOCX formats accepted."
              >
                <input
                  ref={resumeInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  style={{ display: 'none' }}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) setResumeFile(file);
                  }}
                />
                <Upload size={28} className="uploadIcon" />
                {resumeFile ? (
                  <div className="selectedFileInfo">
                    <FileText size={18} className="textEmerald" />
                    <strong>{resumeFile.name}</strong>
                    <span className="fileSize">({(resumeFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                  </div>
                ) : (
                  <div>
                    <span className="uploadText">Click or drag to upload Resume / CV</span>
                    <span className="uploadSubtext">PDF, DOC, or DOCX (Max 8 MB)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Cover Letter Upload */}
            <div className="formGroup">
              <label className="formLabel">Cover Letter (Optional)</label>
              <div
                className={`fileUploadZone ${coverFile ? 'fileSelected' : ''}`}
                onClick={() => coverInputRef.current?.click()}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') coverInputRef.current?.click(); }}
                tabIndex={0}
                role="button"
                aria-label="Upload Cover Letter. Maximum 5 Megabytes. PDF, DOC, or DOCX formats accepted."
              >
                <input
                  ref={coverInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  style={{ display: 'none' }}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) setCoverFile(file);
                  }}
                />
                <Upload size={24} className="uploadIcon" />
                {coverFile ? (
                  <div className="selectedFileInfo">
                    <FileText size={18} className="textEmerald" />
                    <strong>{coverFile.name}</strong>
                    <span className="fileSize">({(coverFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                  </div>
                ) : (
                  <div>
                    <span className="uploadText">Click to upload Cover Letter (Optional)</span>
                    <span className="uploadSubtext">PDF, DOC, or DOCX (Max 5 MB)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Availability Days */}
            <div className="formGroup">
              <label className="formLabel">Typical Weekly Availability</label>
              <div className="daysPillRow">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                  <button
                    key={d}
                    type="button"
                    className={`dayPillBtn ${formData.available_days.includes(d) ? 'selected' : ''}`}
                    onClick={() => toggleArrayItem('available_days', d)}
                  >
                    {d.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            {/* Availability Periods */}
            <div className="formGroup">
              <label className="formLabel">Preferred Shift Times</label>
              <div className="timesPillRow">
                {['Morning', 'Daytime', 'Evening', 'Sleepover / Active Night', 'Flexible'].map(p => (
                  <button
                    key={p}
                    type="button"
                    className={`timePillBtn ${formData.available_periods.includes(p) ? 'selected' : ''}`}
                    onClick={() => toggleArrayItem('available_periods', p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="formGroup">
              <label htmlFor="availability_notes" className="formLabel">Availability Notes (Optional)</label>
              <input
                id="availability_notes"
                type="text"
                maxLength={500}
                className="formInput"
                placeholder="e.g. Available school hours, alternating weekends, etc."
                value={formData.availability_notes}
                onChange={e => handleInputChange('availability_notes', e.target.value)}
              />
            </div>

            <div className="formGroup">
              <label htmlFor="motivation" className="formLabel">Why are you interested in joining Opus Care? (Optional)</label>
              <textarea
                id="motivation"
                rows={3}
                maxLength={1000}
                className="formTextarea"
                placeholder="Tell us what motivates you to work in disability support or what you value about our person-centred approach..."
                value={formData.motivation}
                onChange={e => handleInputChange('motivation', e.target.value)}
              />
            </div>

            <div className="formNavRow">
              <button type="button" onClick={prevStep} className="btnSecondary">
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
              <button type="button" onClick={nextStep} className="btnPrimary">
                <span>Review & Submit</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </fieldset>
        )}

        {/* STEP 5: Final Review & Legal Consents */}
        {step === 5 && (
          <fieldset className="formStepFieldset">
            <legend className="stepTitle">Review & Submit Application</legend>
            <p className="stepDescription">
              Please review your details and confirm your declarations below before submitting.
            </p>

            <div className="reviewSummaryCard">
              <div className="reviewRow">
                <span className="reviewLabel">Application For:</span>
                <strong>{applicationType === 'vacancy' ? (vacancyTitle || 'Support Role') : formData.eoi_role_interest}</strong>
              </div>
              <div className="reviewRow">
                <span className="reviewLabel">Applicant:</span>
                <span>{formData.first_name} {formData.last_name}</span>
              </div>
              <div className="reviewRow">
                <span className="reviewLabel">Contact:</span>
                <span>{formData.email} · {formData.phone}</span>
              </div>
              <div className="reviewRow">
                <span className="reviewLabel">Location:</span>
                <span>{formData.suburb}, NSW {formData.postcode}</span>
              </div>
              <div className="reviewRow">
                <span className="reviewLabel">Preferred Areas:</span>
                <span>{formData.preferred_service_area_ids.join(', ') || 'All broad areas'}</span>
              </div>
              <div className="reviewRow">
                <span className="reviewLabel">Employment Prefs:</span>
                <span>{formData.employment_preferences.join(', ')}</span>
              </div>
              <div className="reviewRow">
                <span className="reviewLabel">Resume:</span>
                <span>{resumeFile ? resumeFile.name : 'None attached'}</span>
              </div>
            </div>

            {/* Legal Declarations */}
            <div className="consentBox">
              <label className="checkboxConsentLabel">
                <input
                  type="checkbox"
                  required
                  checked={formData.privacy_consent}
                  onChange={e => handleInputChange('privacy_consent', e.target.checked)}
                />
                <span className="consentText">
                  <strong>Privacy Consent: *</strong> I understand that Opus Care Support Services will collect and use the information in this application for recruitment, candidate assessment and related recruitment administration. I have read the{' '}
                  <Link href="/privacy" target="_blank" className="textUnderline">
                    Opus Care Privacy Policy
                  </Link>.
                </span>
              </label>

              <label className="checkboxConsentLabel">
                <input
                  type="checkbox"
                  required
                  checked={formData.accuracy_declaration}
                  onChange={e => handleInputChange('accuracy_declaration', e.target.checked)}
                />
                <span className="consentText">
                  <strong>Accuracy Declaration: *</strong> I confirm that the information I have provided is accurate to the best of my knowledge. I understand that any screening status I have declared will still need to be independently verified before participant-facing work.
                </span>
              </label>
            </div>

            <div className="adjustmentNoticeBox">
              <Info size={16} />
              <span>
                <strong>Need a reasonable adjustment?</strong> Opus Care welcomes requests for reasonable adjustments during recruitment. Contact our team at <a href="mailto:careers@opuscare.com.au">careers@opuscare.com.au</a> to discuss adjustments. You do not need to disclose a medical diagnosis.
              </span>
            </div>

            <div className="formNavRow">
              <button type="button" onClick={prevStep} className="btnSecondary" disabled={submitting}>
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
              <button type="submit" className="btnPrimary btnSubmit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 size={16} className="spinner" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Submit Application</span>
                  </>
                )}
              </button>
            </div>
          </fieldset>
        )}
      </form>
    </div>
  );
}
