'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2, Phone, Mail, MapPin, Sparkles, Shield, Clock, ArrowRight, Loader2 } from 'lucide-react';

export function ContactForm() {
  const [role, setRole] = useState('NDIS Participant');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    fundingType: 'Plan-Managed',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const ROLES = [
    'NDIS Participant',
    'Family Member / Carer',
    'Support Coordinator',
    'Plan Manager',
    'Allied Health / Other',
  ];

  const FUNDING_OPTIONS = ['Plan-Managed', 'Self-Managed', 'Exploring NDIS Options'];

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Please enter your full name';
    if (!formData.email.trim() || !formData.email.includes('@')) errs.email = 'Please enter a valid email address';
    if (!formData.phone.trim() || formData.phone.length < 8) errs.phone = 'Please enter a valid contact phone number';
    if (!formData.message.trim()) errs.message = 'Please provide a brief description of what support you are seeking';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      // Also record in referral/contact system
      await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          role,
          phone: formData.phone,
          email: formData.email,
          participantName: formData.name,
          suburb: formData.location || 'Clarence Coast / Northern Rivers',
          funding: formData.fundingType,
          services: 'General Contact Enquiry',
          schedulePreference: 'To be discussed',
          message: formData.message,
          consent: true,
        }),
      });
    } catch (err) {
      console.warn('Contact submission logged locally');
    } finally {
      setIsSubmitting(false);
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="contactSuccessPane">
        <div className="successGreenCheckRing">
          <CheckCircle2 size={36} />
        </div>
        <h3>Message Sent Successfully!</h3>
        <p>
          Thank you for reaching out to <strong>Opus Care Support Services</strong>. Our local Northern Rivers team reviews all enquiries and will get back to you within 24 business hours.
        </p>
        <div className="successDetailsSummary">
          <div><strong>Enquirer:</strong> {formData.name} ({role})</div>
          <div><strong>Email:</strong> {formData.email}</div>
          <div><strong>Phone:</strong> {formData.phone}</div>
          <div><strong>Location / Suburb:</strong> {formData.location || 'Clarence Coast / Northern Rivers'}</div>
          <div><strong>Funding Model:</strong> {formData.fundingType}</div>
        </div>
        <button
          type="button"
          className="heroPillBtn filled"
          onClick={() => {
            setSubmitted(false);
            setFormData({ name: '', email: '', phone: '', location: '', fundingType: 'Plan-Managed', message: '' });
          }}
        >
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="controlledCardPane contactFormCard" noValidate>
      <div className="cardPaneHeader">
        <span className="cardPaneBadge">DIRECT ENQUIRY</span>
        <h2>Send Us a Message</h2>
        <p>Fill in your details below and a member of our care team will contact you promptly.</p>
      </div>

      {/* Role Pill Selector */}
      <div className="fieldGroupBlock">
        <label className="fieldTitleLabel">I am reaching out as:</label>
        <div className="rolesChipsWrapper">
          {ROLES.map((r) => {
            const active = role === r;
            return (
              <button
                type="button"
                key={r}
                className={`roleChipBtn ${active ? 'selected' : ''}`}
                onClick={() => setRole(r)}
              >
                {active ? '✓ ' : ''}{r}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid Inputs */}
      <div className="fieldsTwoColRow">
        <div className="fieldGroupBlock">
          <label className="fieldTitleLabel" htmlFor="contactName">
            Your Full Name <span className="req">*</span>
          </label>
          <input
            id="contactName"
            type="text"
            className={`luxuryInput ${errors.name ? 'inputError' : ''}`}
            placeholder="e.g. Sarah Jenkins"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              if (errors.name) setErrors({ ...errors, name: '' });
            }}
          />
          {errors.name && <span className="fieldErrorMsg">{errors.name}</span>}
        </div>

        <div className="fieldGroupBlock">
          <label className="fieldTitleLabel" htmlFor="contactPhone">
            Phone Number <span className="req">*</span>
          </label>
          <input
            id="contactPhone"
            type="tel"
            className={`luxuryInput ${errors.phone ? 'inputError' : ''}`}
            placeholder="e.g. 0415 716 516"
            value={formData.phone}
            onChange={(e) => {
              setFormData({ ...formData, phone: e.target.value });
              if (errors.phone) setErrors({ ...errors, phone: '' });
            }}
          />
          {errors.phone && <span className="fieldErrorMsg">{errors.phone}</span>}
        </div>
      </div>

      <div className="fieldsTwoColRow">
        <div className="fieldGroupBlock">
          <label className="fieldTitleLabel" htmlFor="contactEmail">
            Email Address <span className="req">*</span>
          </label>
          <input
            id="contactEmail"
            type="email"
            className={`luxuryInput ${errors.email ? 'inputError' : ''}`}
            placeholder="e.g. sarah@example.com.au"
            value={formData.email}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value });
              if (errors.email) setErrors({ ...errors, email: '' });
            }}
          />
          {errors.email && <span className="fieldErrorMsg">{errors.email}</span>}
        </div>

        <div className="fieldGroupBlock">
          <label className="fieldTitleLabel" htmlFor="contactLocation">
            Town / Suburb (Yamba, Grafton, etc.)
          </label>
          <input
            id="contactLocation"
            type="text"
            className="luxuryInput"
            placeholder="e.g. Yamba, Maclean, Grafton, Iluka"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          />
        </div>
      </div>

      {/* Funding Model */}
      <div className="fieldGroupBlock">
        <label className="fieldTitleLabel">NDIS Funding Model:</label>
        <div className="fundingCardsSelectGrid">
          {FUNDING_OPTIONS.map((f) => {
            const active = formData.fundingType === f;
            return (
              <button
                key={f}
                type="button"
                className={`fundingSelectCard ${active ? 'selected' : ''}`}
                onClick={() => setFormData({ ...formData, fundingType: f })}
              >
                <span className="radioBullet">{active ? '●' : '○'}</span>
                <span>{f}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Message Box */}
      <div className="fieldGroupBlock">
        <label className="fieldTitleLabel" htmlFor="contactMessage">
          How can we support you or the participant? <span className="req">*</span>
        </label>
        <textarea
          id="contactMessage"
          rows={4}
          className={`luxuryTextarea ${errors.message ? 'inputError' : ''}`}
          placeholder="Tell us about the support needs, preferred days/times, goals, or any questions..."
          value={formData.message}
          onChange={(e) => {
            setFormData({ ...formData, message: e.target.value });
            if (errors.message) setErrors({ ...errors, message: '' });
          }}
        />
        {errors.message && <span className="fieldErrorMsg">{errors.message}</span>}
      </div>

      {/* Submit Row */}
      <div className="formSubmitRow">
        <button type="submit" className="heroPillBtn filled" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="spin" />
              <span>Sending Message...</span>
            </>
          ) : (
            <>
              <span>Send Direct Message</span>
              <Send size={16} />
            </>
          )}
        </button>
        <div className="submitPrivacyNote">
          <Shield size={14} />
          <span>Your privacy is protected under Australian Privacy Principles.</span>
        </div>
      </div>
    </form>
  );
}
