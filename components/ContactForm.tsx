'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2, Phone, Mail, MapPin, Sparkles, Shield, Clock, ArrowRight } from 'lucide-react';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 800);
  };

  if (submitted) {
    return (
      <div className="contactSuccessPanel">
        <div className="successBadgeIcon">
          <CheckCircle2 size={48} color="#0D9488" />
        </div>
        <h3>Message Sent Successfully!</h3>
        <p>
          Thank you for reaching out to <strong>CarePoint Support Services</strong>. Our local intake team in Yamba / Northern Rivers has received your enquiry and will respond within <strong>1 business day</strong>.
        </p>
        <div className="successDetailsSummary">
          <div><strong>Enquirer:</strong> {formData.name} ({role})</div>
          <div><strong>Email:</strong> {formData.email}</div>
          <div><strong>Location / Suburb:</strong> {formData.location || 'Clarence Coast / Northern Rivers'}</div>
          <div><strong>Funding:</strong> {formData.fundingType}</div>
        </div>
        <button
          className="button primary"
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
    <form onSubmit={handleSubmit} className="premiumContactForm" noValidate>
      {/* Role Pill Selector */}
      <div className="formFieldGroup">
        <label className="fieldLabel">I am contacting as:</label>
        <div className="rolePillsWrapper">
          {ROLES.map((r) => (
            <button
              type="button"
              key={r}
              className={`rolePillBtn ${role === r ? 'selected' : ''}`}
              onClick={() => setRole(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Inputs */}
      <div className="formGridRow2">
        <div className="formFieldGroup">
          <label className="fieldLabel" htmlFor="contactName">
            Your Full Name <span className="reqStar">*</span>
          </label>
          <input
            id="contactName"
            type="text"
            className={`premiumInput ${errors.name ? 'inputError' : ''}`}
            placeholder="e.g. Sarah Jenkins"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              if (errors.name) setErrors({ ...errors, name: '' });
            }}
          />
          {errors.name && <span className="fieldErrorMsg">{errors.name}</span>}
        </div>

        <div className="formFieldGroup">
          <label className="fieldLabel" htmlFor="contactPhone">
            Phone Number <span className="reqStar">*</span>
          </label>
          <input
            id="contactPhone"
            type="tel"
            className={`premiumInput ${errors.phone ? 'inputError' : ''}`}
            placeholder="e.g. 0400 123 456"
            value={formData.phone}
            onChange={(e) => {
              setFormData({ ...formData, phone: e.target.value });
              if (errors.phone) setErrors({ ...errors, phone: '' });
            }}
          />
          {errors.phone && <span className="fieldErrorMsg">{errors.phone}</span>}
        </div>
      </div>

      <div className="formGridRow2">
        <div className="formFieldGroup">
          <label className="fieldLabel" htmlFor="contactEmail">
            Email Address <span className="reqStar">*</span>
          </label>
          <input
            id="contactEmail"
            type="email"
            className={`premiumInput ${errors.email ? 'inputError' : ''}`}
            placeholder="e.g. sarah@example.com"
            value={formData.email}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value });
              if (errors.email) setErrors({ ...errors, email: '' });
            }}
          />
          {errors.email && <span className="fieldErrorMsg">{errors.email}</span>}
        </div>

        <div className="formFieldGroup">
          <label className="fieldLabel" htmlFor="contactLocation">
            Town / Suburb (Yamba, Grafton, etc.)
          </label>
          <input
            id="contactLocation"
            type="text"
            className="premiumInput"
            placeholder="e.g. Yamba, Maclean, Grafton, New Italy"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          />
        </div>
      </div>

      {/* Funding Model */}
      <div className="formFieldGroup">
        <label className="fieldLabel">NDIS Plan Management Type:</label>
        <div className="fundingPillsWrapper">
          {FUNDING_OPTIONS.map((f) => (
            <label key={f} className={`fundingRadioPill ${formData.fundingType === f ? 'selected' : ''}`}>
              <input
                type="radio"
                name="fundingType"
                value={f}
                checked={formData.fundingType === f}
                onChange={(e) => setFormData({ ...formData, fundingType: e.target.value })}
              />
              <span>{f}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Message Box */}
      <div className="formFieldGroup">
        <label className="fieldLabel" htmlFor="contactMessage">
          How can we support you or the participant? <span className="reqStar">*</span>
        </label>
        <textarea
          id="contactMessage"
          rows={4}
          className={`premiumTextarea ${errors.message ? 'inputError' : ''}`}
          placeholder="Tell us about the support needs, preferred days/times, goals, or any questions..."
          value={formData.message}
          onChange={(e) => {
            setFormData({ ...formData, message: e.target.value });
            if (errors.message) setErrors({ ...errors, message: '' });
          }}
        />
        {errors.message && <span className="fieldErrorMsg">{errors.message}</span>}
      </div>

      {/* Submit Button */}
      <div className="formSubmitRow">
        <button type="submit" className="button primary formSubmitBtn" disabled={isSubmitting}>
          {isSubmitting ? 'Sending Message...' : 'Send Direct Message'} <Send size={16} />
        </button>
        <span className="submitPrivacyNote">
          <Shield size={14} color="#0D9488" />
          <span>Your privacy is protected under Australian Privacy Principles.</span>
        </span>
      </div>
    </form>
  );
}
