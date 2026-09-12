'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  ShieldCheck,
  ArrowLeft,
  Send,
  CheckCircle2,
  AlertTriangle,
  Lock,
  UserX,
  Phone,
  HelpCircle,
} from 'lucide-react';
import { SiteHeader } from '../../components/SiteHeader';
import { SiteFooter } from '../../components/SiteFooter';

export default function ComplaintsPage() {
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [complainantName, setComplainantName] = useState('');
  const [complainantRole, setComplainantRole] = useState('Participant');
  const [contactDetails, setContactDetails] = useState('');
  const [hasAdvocate, setHasAdvocate] = useState(false);
  const [advocateName, setAdvocateName] = useState('');
  const [advocateRelationship, setAdvocateRelationship] = useState('');
  const [advocateContact, setAdvocateContact] = useState('');
  const [accessibilityNeeds, setAccessibilityNeeds] = useState('');
  const [category, setCategory] = useState('service_delivery');
  const [urgency, setUrgency] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  const [immediateSafetyIssue, setImmediateSafetyIssue] = useState(false);
  const [summary, setSummary] = useState('');
  const [details, setDetails] = useState('');

  const [loading, setLoading] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [targetDate, setTargetDate] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/safeguarding/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_anonymous: isAnonymous,
          complainant_name: isAnonymous ? 'Anonymous' : complainantName,
          complainant_role: complainantRole,
          contact_details: isAnonymous ? null : contactDetails,
          advocate_name: hasAdvocate ? advocateName : null,
          advocate_relationship: hasAdvocate ? advocateRelationship : null,
          advocate_contact: hasAdvocate ? advocateContact : null,
          accessibility_communication_needs: accessibilityNeeds || null,
          category,
          urgency,
          immediate_safety_issue: immediateSafetyIssue,
          summary,
          details,
          source: isAnonymous ? 'Public Website (Anonymous)' : 'Public Website',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit complaint. Please try again.');
      }

      setSubmittedRef(data.complaint?.complaint_reference || 'CMP-RECORDED');
      setTargetDate(data.complaint?.response_target_date || null);
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SiteHeader />
      <main>
        {/* Page Hero */}
        <section className="pageHero">
          <div className="shell">
            <span className="eyebrow">
              <MessageSquare size={15} /> Feedback & Continuous Improvement
            </span>
            <h1>Complaints, Compliments & Feedback</h1>
            <p>
              You have the right to speak up, give feedback, and raise concerns at any time without fear of negative consequences or retribution. We welcome your input to continuously improve our support.
            </p>
          </div>
        </section>

        <section className="softSection" style={{ paddingBottom: '60px' }}>
          <div className="shell" style={{ maxWidth: '840px', margin: '0 auto' }}>
            {/* Feedback Policy Card */}
            <div className="policyPaperCard" style={{ marginBottom: '32px' }}>
              <div className="policySection">
                <h2>1. Our Open Feedback Philosophy</h2>
                <p>
                  At Opus Care Support Services, complaints and suggestions are handled respectfully, confidentially, and fairly. Anyone — including participants, family members, friends, independent advocates, and support coordinators — can lodge a complaint or share feedback.
                </p>
              </div>

              <div className="policySection">
                <h2>2. Ways to Share Feedback or Lodge a Complaint</h2>
                <ul style={{ paddingLeft: '20px', lineHeight: 1.8 }}>
                  <li><strong>Online Form:</strong> Use the secure form below (you may choose to remain completely anonymous).</li>
                  <li><strong>Email:</strong> Send direct written feedback to <em>support@opuscare.com.au</em>.</li>
                  <li><strong>Direct Conversation:</strong> Speak openly with your support worker or Opus Care operations coordinator.</li>
                  <li><strong>Independent Advocacy:</strong> You have the right to appoint an independent advocate or support person to represent or assist you at any stage.</li>
                </ul>
              </div>

              <div className="policySection">
                <h2>3. How We Respond & Target Timelines</h2>
                <p>
                  We aim to acknowledge complaints within <strong>one business day</strong> and provide a reasoned resolution within <strong>ten business days</strong>. If a matter involves an immediate safety risk, urgent triage begins immediately.
                </p>
              </div>

              <div className="policySection">
                <h2>4. External Escalation & Independent Oversight</h2>
                <p>
                  If you are not satisfied with how your concern has been handled, or if you prefer to speak to an external body at any time, you can contact:
                </p>
                <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0', marginTop: '12px' }}>
                  <p style={{ margin: 0, fontWeight: 600 }}>NDIS Quality and Safeguards Commission</p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: '#475569' }}>
                    Telephone: <strong>1800 035 544</strong> (free call from landlines) | Website: <strong>ndiscommission.gov.au</strong>
                  </p>
                  <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                    An independent statutory body established to improve the quality and safety of NDIS supports across Australia.
                  </p>
                </div>
              </div>
            </div>

            {/* Complaint / Feedback Submission Form */}
            <div className="policyPaperCard" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
                  <Send size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Lodge Feedback or a Complaint</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.875rem', color: '#64748B' }}>
                    Confidential submission directly to the Opus Care Quality & Safeguarding Lead
                  </p>
                </div>
              </div>

              {submittedRef ? (
                <div style={{ background: '#ECFDF5', border: '1px solid #10B981', borderRadius: '10px', padding: '24px', textAlign: 'center' }}>
                  <CheckCircle2 size={44} style={{ color: '#059669', margin: '0 auto 12px' }} />
                  <h4 style={{ margin: '0 0 8px', color: '#065F46', fontSize: '1.2rem' }}>Thank You. Your Feedback Has Been Received.</h4>
                  <p style={{ margin: '0 0 16px', color: '#047857', fontSize: '0.95rem' }}>
                    Reference Number: <strong>{submittedRef}</strong>
                  </p>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: '#065F46' }}>
                    Our Safeguarding Lead will review your submission. {targetDate && `Our target response date is ${targetDate}.`}
                  </p>
                  <button
                    onClick={() => {
                      setSubmittedRef(null);
                      setSummary('');
                      setDetails('');
                    }}
                    style={{ marginTop: '20px', background: '#059669', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Submit Another Feedback Item
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {errorMessage && (
                    <div style={{ background: '#FEF2F2', border: '1px solid #F87171', borderRadius: '8px', padding: '12px', color: '#B91C1C', fontSize: '0.88rem' }}>
                      {errorMessage}
                    </div>
                  )}

                  {/* Anonymous Option */}
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '14px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <input
                      type="checkbox"
                      id="anonymousToggle"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      style={{ marginTop: '3px', cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                    <label htmlFor="anonymousToggle" style={{ cursor: 'pointer', fontSize: '0.88rem', color: '#334155' }}>
                      <strong>Submit Anonymously</strong>
                      <span style={{ display: 'block', color: '#64748B', fontSize: '0.82rem', marginTop: '2px' }}>
                        If selected, your name and contact details will not be stored with this complaint. Please provide sufficient detail in the description so we can investigate properly.
                      </span>
                    </label>
                  </div>

                  {!isAnonymous && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                          Your Name *
                        </label>
                        <input
                          type="text"
                          required={!isAnonymous}
                          placeholder="e.g. Jane Doe"
                          value={complainantName}
                          onChange={(e) => setComplainantName(e.target.value)}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                          Your Role / Relationship
                        </label>
                        <select
                          value={complainantRole}
                          onChange={(e) => setComplainantRole(e.target.value)}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', background: '#FFF' }}
                        >
                          <option value="Participant">NDIS Participant</option>
                          <option value="Family Member / Carer">Family Member / Carer</option>
                          <option value="Independent Advocate">Independent Advocate</option>
                          <option value="Support Coordinator">Support Coordinator</option>
                          <option value="Worker">Support Worker / Colleague</option>
                          <option value="Community Member">Community Member / Other</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {!isAnonymous && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                        Contact Details (Email or Phone)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. jane@example.com or 0400 000 000"
                        value={contactDetails}
                        onChange={(e) => setContactDetails(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                      />
                      <small style={{ color: '#64748B', fontSize: '0.8rem', display: 'block', marginTop: '4px' }}>
                        Needed so we can acknowledge receipt and share the outcome with you.
                      </small>
                    </div>
                  )}

                  {/* Advocate Support Person Option */}
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="checkbox"
                        id="advocateToggle"
                        checked={hasAdvocate}
                        onChange={(e) => setHasAdvocate(e.target.checked)}
                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                      />
                      <label htmlFor="advocateToggle" style={{ cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600, color: '#334155' }}>
                        I am assisted by an advocate or support person
                      </label>
                    </div>

                    {hasAdvocate && (
                      <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748B', marginBottom: '4px' }}>Advocate Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Mark Smith"
                            value={advocateName}
                            onChange={(e) => setAdvocateName(e.target.value)}
                            style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748B', marginBottom: '4px' }}>Relationship / Org</label>
                          <input
                            type="text"
                            placeholder="e.g. Independent Advocate"
                            value={advocateRelationship}
                            onChange={(e) => setAdvocateRelationship(e.target.value)}
                            style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748B', marginBottom: '4px' }}>Advocate Contact</label>
                          <input
                            type="text"
                            placeholder="e.g. 0411 222 333"
                            value={advocateContact}
                            onChange={(e) => setAdvocateContact(e.target.value)}
                            style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Category & Urgency */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                        Category *
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', background: '#FFF' }}
                      >
                        <option value="service_delivery">Service Delivery & Support Quality</option>
                        <option value="worker_conduct">Worker Conduct & Code of Conduct</option>
                        <option value="billing_pricing">Billing, Pricing & Invoicing</option>
                        <option value="communication">Communication & Responsiveness</option>
                        <option value="safety_rights">Safety, Dignity & Participant Rights</option>
                        <option value="compliment">Compliment / Positive Feedback</option>
                        <option value="other">Other Concern</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                        Urgency Level
                      </label>
                      <select
                        value={urgency}
                        onChange={(e) => setUrgency(e.target.value as any)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', background: '#FFF' }}
                      >
                        <option value="Low">Low — General feedback or minor question</option>
                        <option value="Medium">Medium — Standard service concern</option>
                        <option value="High">High — Disrupted service or recurring issue</option>
                        <option value="Urgent">Urgent — Safety hazard or critical concern</option>
                      </select>
                    </div>
                  </div>

                  {/* Immediate Safety Flag */}
                  <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: '8px', padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="checkbox"
                      id="safetyToggle"
                      checked={immediateSafetyIssue}
                      onChange={(e) => setImmediateSafetyIssue(e.target.checked)}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                    <label htmlFor="safetyToggle" style={{ cursor: 'pointer', fontSize: '0.85rem', color: '#92400E' }}>
                      <strong>Immediate Safety Issue:</strong> Check this if someone is in distress, at imminent physical risk, or urgent intervention is needed. (If in immediate physical danger, please call 000 first).
                    </label>
                  </div>

                  {/* Summary & Details */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                      Summary of Concern *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Brief headline describing what happened"
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                      Detailed Description *
                    </label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Please share what happened, when, who was present, and how you would like this matter resolved..."
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', lineHeight: 1.5 }}
                    />
                  </div>

                  {/* Accessibility & Communication Needs */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                      Accessibility & Communication Needs (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. prefer SMS, Easy Read response, relay service, preferred time of day"
                      value={accessibilityNeeds}
                      onChange={(e) => setAccessibilityNeeds(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                    <span style={{ fontSize: '0.82rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Lock size={14} /> Submitted securely to Safeguarding Register
                    </span>
                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        background: '#0F172A',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '12px 24px',
                        fontSize: '0.92rem',
                        fontWeight: 600,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.7 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      {loading ? 'Submitting...' : 'Submit Feedback / Complaint'}
                      <Send size={15} />
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div style={{ marginTop: '32px' }}>
              <Link className="button secondary" href="/">
                <ArrowLeft size={16} /> Return to Homepage
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
