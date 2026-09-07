'use client';

import { useState } from 'react';
import { CheckCircle2, Shield, Mail, ArrowRight } from 'lucide-react';

export function ContactForm() {
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', suburb: '', enquiringFor: 'Self / NDIS Participant', selectedServices: ['Community supports'], message: '', agreePrivacy: true });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const availableServices = ['Daily Living & Routines', 'Community supports', 'Transport & Appointments', 'Life Skills & Mentoring', 'Respite Care', 'Other / Not sure'];
  const toggleService = (srv: string) => setFormData(prev => ({ ...prev, selectedServices: prev.selectedServices.includes(srv) ? prev.selectedServices.filter(s => s !== srv) : [...prev.selectedServices, srv] }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setErrorMsg('');
    if (!formData.firstName.trim() || !formData.email.trim() || !formData.message.trim()) { setErrorMsg('Please enter your name, email address and message.'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          subject: `Website enquiry — ${formData.enquiringFor}`,
          message: `Location: ${formData.suburb || 'Not specified'}\nServices needed: ${formData.selectedServices.join(', ') || 'Not specified'}\n\n${formData.message}`,
        }),
      });
      if (!res.ok) throw new Error('Failed to send enquiry.');
      setSubmitted(true);
    } catch { setErrorMsg('Unable to send enquiry. Please contact us directly at support@opuscare.com.au'); }
    finally { setSubmitting(false); }
  };

  if (submitted) return <div className="controlledCardPane cleanEnquirySuccessCard"><div className="successCircle"><CheckCircle2 size={40} /></div><h2>Thank You for Reaching Out</h2><p>We have received your enquiry and our local Northern Rivers support team will get in touch with you at <strong>{formData.email}</strong> within 24 business hours.</p><div className="successEmailNote"><Mail size={16} /><span>Your enquiry has been sent to contact@opuscare.com.au</span></div></div>;

  return <form className="controlledCardPane cleanEnquiryFormBox" onSubmit={handleSubmit} noValidate>
    <div className="enquiryFormHeader"><h2>Let us help you</h2><p>Please get in touch by completing the enquiry form below. We respond promptly.</p></div>
    {errorMsg && <div className="enquiryErrorNotice">{errorMsg}</div>}
    <div className="formRowTwoCol"><div className="formFieldUnit"><label className="compactLabel" htmlFor="firstName">First name <span className="req">*</span></label><input id="firstName" type="text" className="compactInput" placeholder="e.g. Sarah" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} required /></div><div className="formFieldUnit"><label className="compactLabel" htmlFor="lastName">Last name</label><input id="lastName" type="text" className="compactInput" placeholder="e.g. Jenkins" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} /></div></div>
    <div className="formFieldUnit"><label className="compactLabel" htmlFor="enquiryEmail">Email address <span className="req">*</span></label><input id="enquiryEmail" type="email" className="compactInput" placeholder="e.g. sarah@example.com.au" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required /></div>
    <div className="formFieldUnit"><label className="compactLabel" htmlFor="suburbTown">Where do you need the service (Suburb / Town)</label><input id="suburbTown" type="text" className="compactInput" placeholder="e.g. Yamba, Grafton, Maclean, Iluka" value={formData.suburb} onChange={e => setFormData({ ...formData, suburb: e.target.value })} /></div>
    <div className="formFieldUnit"><label className="compactLabel">What services do you need?</label><div className="servicePillsSelectGrid">{availableServices.map((srv, idx) => { const selected=formData.selectedServices.includes(srv); return <button key={idx} type="button" className={`cleanServicePillBtn${selected ? ' active' : ''}`} onClick={() => toggleService(srv)}>{selected && <span className="checkMark">✓</span>} {srv}</button>; })}</div></div>
    <div className="formFieldUnit"><label className="compactLabel" htmlFor="enquiringFor">I am enquiring for:</label><select id="enquiringFor" className="compactSelect" value={formData.enquiringFor} onChange={e => setFormData({ ...formData, enquiringFor: e.target.value })}><option>Self / NDIS Participant</option><option>Family Member / Carer</option><option>Support Coordinator</option><option>Plan Manager</option><option>Allied Health / Other</option></select></div>
    <div className="formFieldUnit"><label className="compactLabel" htmlFor="enquiryMessage">How can we support you? <span className="req">*</span></label><textarea id="enquiryMessage" rows={3} className="compactTextarea" placeholder="Share your preferred days, support goals, or questions..." value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} required /></div>
    <div className="formPrivacyAgreement"><Shield size={14} className="privacyIcon" /><span>By submitting this form, you agree to be contacted by Opus Care Support Services regarding your enquiry. Your privacy is safeguarded under Australian Privacy Principles.</span></div>
    <div className="formSubmitAction"><button type="submit" disabled={submitting} className="cleanSolidSubmitBtn"><span>{submitting ? 'Submitting...' : 'Submit Enquiry'}</span><ArrowRight size={16} /></button></div>
  </form>;
}

export default ContactForm;
