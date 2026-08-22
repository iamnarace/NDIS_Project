'use client';

import { FormEvent, useState } from 'react';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';

const serviceOptions = [
  'Daily Living Support',
  'Community Participation',
  'Transport Support',
  'Life Skills & Independence',
  'Companionship & Social Support',
  'Household & Practical Assistance',
  'Not sure yet',
];

export function ReferralForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setStatus('sending');
    setMessage('');
    try {
      const response = await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Unable to send referral');
      setStatus('success');
      setMessage('Thanks — your enquiry has been received. We’ll contact you using your preferred details.');
      form.reset();
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Online referrals are not configured yet. Please email CarePoint directly.');
    }
  }

  return (
    <form className="formCard" onSubmit={submit}>
      <div className="formIntro"><span className="pill">Referral form</span><h3>Tell us how we can help</h3><p>Please keep this first enquiry brief and avoid including detailed medical records or highly sensitive information.</p></div>
      <div className="two"><label>Your name<input required name="name" autoComplete="name" placeholder="Full name"/></label><label>You are<select required name="role" defaultValue=""><option value="" disabled>Select</option><option>Participant</option><option>Family / nominee</option><option>Support coordinator</option><option>Plan manager</option><option>Other professional</option></select></label></div>
      <div className="two"><label>Phone<input required name="phone" autoComplete="tel" placeholder="04xx xxx xxx"/></label><label>Email<input required name="email" type="email" autoComplete="email" placeholder="name@example.com"/></label></div>
      <div className="two"><label>Participant suburb<input name="suburb" placeholder="e.g. Parramatta"/></label><label>Plan management<select name="funding" defaultValue=""><option value="">Select if known</option><option>Plan-managed</option><option>Self-managed</option><option>Not sure</option></select></label></div>
      <label>Support you’re looking for<select name="service" defaultValue=""><option value="">Select a service</option>{serviceOptions.map(service => <option key={service}>{service}</option>)}</select></label>
      <label>What would you like help with?<textarea name="message" rows={5} placeholder="Preferred days, general support goals, suburb and anything useful for our first conversation..."/></label>
      <label>Preferred contact<select name="contactPreference"><option>Phone</option><option>Email</option><option>Either is fine</option></select></label>
      <label className="consent"><input required type="checkbox" name="consent" value="yes"/> I consent to CarePoint using these details to respond to this enquiry.</label>
      <button className="button full" disabled={status === 'sending'} type="submit">{status === 'sending' ? <><Loader2 className="spin" size={18}/> Sending…</> : <>Send referral <ArrowRight size={18}/></>}</button>
      {message && <div className={`formStatus ${status}`} role="status">{status === 'success' && <CheckCircle2 size={18}/>}<span>{message}</span></div>}
    </form>
  );
}
