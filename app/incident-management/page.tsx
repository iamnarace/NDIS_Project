import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  HeartPulse,
  ArrowLeft,
  AlertTriangle,
  Phone,
  FileCheck2,
  Lock,
  LifeBuoy,
} from 'lucide-react';
import { SiteHeader } from '../../components/SiteHeader';
import { SiteFooter } from '../../components/SiteFooter';

export default function IncidentManagementPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="pageHero">
          <div className="shell">
            <span className="eyebrow">
              <ShieldCheck size={15} /> Quality & Safeguarding Framework
            </span>
            <h1>Incident Management & Safety Protocol</h1>
            <p>
              How Opus Care Support Services identifies, manages, records, discloses, and prevents incidents to safeguard the safety, health, dignity, and human rights of every participant.
            </p>
          </div>
        </section>

        <section className="softSection" style={{ paddingBottom: '60px' }}>
          <div className="shell" style={{ maxWidth: '840px', margin: '0 auto' }}>
            <div className="policyPaperCard">
              <div className="policySection">
                <h2>1. Zero-Tolerance for Abuse, Neglect & Harm</h2>
                <p>
                  Opus Care Support Services maintains a strict zero-tolerance approach to abuse, neglect, exploitation, violence, and sexual misconduct. All staff and contractors are bound by the <strong>NDIS Code of Conduct</strong> and are required to uphold participant rights, act with integrity, and report any safety or wellbeing concern immediately.
                </p>
              </div>

              <div className="policySection">
                <h2>2. Immediate Safety Response & First Aid</h2>
                <p>
                  When an incident occurs during support delivery, workers must follow a clear priority sequence:
                </p>
                <ol style={{ paddingLeft: '20px', lineHeight: 1.8 }}>
                  <li><strong>Participant Wellbeing:</strong> Remove immediate danger and administer First Aid / CPR if trained and safe to do so.</li>
                  <li><strong>Emergency Services:</strong> Dial <strong>000</strong> immediately for ambulance, police, or fire if there is severe injury, acute medical distress, or immediate threat to life.</li>
                  <li><strong>Notify Nominee / Family:</strong> Contact the participant&apos;s nominated emergency contact or guardian in accordance with their agreed support plan.</li>
                  <li><strong>Internal Escalation:</strong> Contact the Opus Care Operations Coordinator and lodge a formal incident report within 24 hours.</li>
                </ol>
              </div>

              <div className="policySection">
                <h2>3. Open Disclosure Principle</h2>
                <p>
                  We believe in complete transparency. When an incident occurs that affects a participant, we practice <strong>Open Disclosure</strong>:
                </p>
                <ul style={{ paddingLeft: '20px', lineHeight: 1.8 }}>
                  <li>Providing an immediate, factual explanation of what happened.</li>
                  <li>Offering sincere acknowledgement and support for any distress caused.</li>
                  <li>Explaining the immediate actions taken to ensure ongoing safety.</li>
                  <li>Sharing the findings of our investigation and the corrective actions being put in place to prevent recurrence.</li>
                </ul>
              </div>

              <div className="policySection">
                <h2>4. Restrictive Practice Boundary (Unregistered Provider)</h2>
                <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '8px', padding: '16px', marginBottom: '14px' }}>
                  <p style={{ margin: 0, fontWeight: 600, color: '#92400E' }}>
                    Strict Governance Notice — Unregistered Provider Scope
                  </p>
                  <p style={{ margin: '6px 0 0', fontSize: '0.88rem', color: '#92400E', lineHeight: 1.6 }}>
                    Opus Care Support Services is an unregistered NDIS provider. In accordance with NDIS Quality and Safeguards Commission rules, <strong>unregistered providers cannot authorise, approve, or implement regulated restrictive practices</strong> (chemical, mechanical, physical, environmental restraint, or seclusion).
                  </p>
                  <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: '#B45309' }}>
                    Where a participant requires a positive Behaviour Support Plan involving regulated restrictive practices, such supports must be registered with the NDIS Commission and delivered under an authorised registered provider arrangement.
                  </p>
                </div>
              </div>

              <div className="policySection">
                <h2>5. Statutory & External Notification Pathways</h2>
                <p>
                  Opus Care distinguishes internal quality management from statutory reporting duties:
                </p>
                <ul style={{ paddingLeft: '20px', lineHeight: 1.8 }}>
                  <li><strong>Management / Regulatory Reporting Assessment:</strong> As an unregistered provider, direct reportable incident notification to the NDIS Commission applies to registered providers. Opus Care requires immediate management assessment for all high-severity incidents to determine external statutory obligations (including Police, SafeWork NSW, and lead registered partner notifications).</li>
                  <li><strong>Emergency & Crime:</strong> Suspected sexual assault, physical assault, or severe unlawful conduct is reported immediately to NSW Police.</li>
                  <li><strong>Work Health & Safety (WHS):</strong> Any notifiable workplace incident resulting in worker death or serious injury is reported immediately to <strong>SafeWork NSW (13 10 50)</strong> under the <em>Work Health and Safety Act 2011</em>.</li>
                  <li><strong>Subcontracting / Intermediary Notifications:</strong> When delivering supports under subcontract to a registered NDIS provider, Opus Care reports all incidents to the lead registered provider within statutory timeframes to support their NDIS Commission reportable incident obligations.</li>
                </ul>
              </div>

              <div className="policySection">
                <h2>6. Investigation, Corrective Actions & Root-Cause Review</h2>
                <p>
                  Every reported incident is reviewed by the Safeguarding Lead and Operations Manager within 48 hours. Corrective and preventative actions (CAPA) are logged, assigned an owner and due date, and tracked until completion to ensure continuous improvement across our service.
                </p>
              </div>

              <div className="policySection">
                <h2>7. Crisis & External Support Contacts</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginTop: '12px' }}>
                  <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <strong>Emergency Services</strong>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#DC2626', marginTop: '4px' }}>000</div>
                    <small style={{ color: '#64748B' }}>Police, Ambulance, Fire (24/7)</small>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <strong>Lifeline Crisis Support</strong>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0284C7', marginTop: '4px' }}>13 11 14</div>
                    <small style={{ color: '#64748B' }}>24/7 mental health crisis support</small>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <strong>1800RESPECT</strong>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#7C3AED', marginTop: '4px' }}>1800 737 732</div>
                    <small style={{ color: '#64748B' }}>Domestic, family & sexual violence</small>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <strong>NDIS Commission</strong>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#059669', marginTop: '4px' }}>1800 035 544</div>
                    <small style={{ color: '#64748B' }}>Participant safeguarding & complaints</small>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '32px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                <Link className="button secondary" href="/">
                  <ArrowLeft size={16} /> Return to Homepage
                </Link>
                <Link className="button primary" href="/complaints">
                  Lodge Feedback or Concern
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
