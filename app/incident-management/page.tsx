import Link from 'next/link';
import { AlertCircle, ShieldCheck, HeartPulse, ArrowLeft } from 'lucide-react';
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
              <ShieldCheck size={15} /> Safety &amp; Safeguards
            </span>
            <h1>Incident Management &amp; Safety Framework</h1>
            <p>
              How Opus Care Support Services identifies, manages, records, and prevents incidents to ensure the safety, health, and wellbeing of every participant.
            </p>
          </div>
        </section>

        <section className="softSection">
          <div className="shell">
            <div className="policyPaperCard">
              <div className="policySection">
                <h2>1. Safety First Culture</h2>
                <p>
                  The safety and dignity of participants, staff, and the community are our highest priority. Our Incident Management System is designed to respond swiftly to any unforeseen events, minimize harm, provide immediate care, and learn from every occurrence.
                </p>
              </div>

              <div className="policySection">
                <h2>2. Immediate Response &amp; First Aid</h2>
                <p>
                  In the event of an incident or injury, our support workers are trained to prioritize immediate participant safety and first aid, notify emergency services if needed, contact nominees/family, and report the event immediately to senior management.
                </p>
              </div>

              <div className="policySection">
                <h2>3. Investigation &amp; Corrective Actions</h2>
                <p>
                  Every reported incident undergoes a root-cause review within 48 hours to determine contributing factors, update participant risk profiles, adjust support procedures, and implement preventative measures to ensure it does not happen again.
                </p>
              </div>

              <div className="policySection">
                <h2>4. Regulatory Reporting</h2>
                <p>
                  We comply fully with mandatory incident notification guidelines under NDIS safeguards and state health regulations.
                </p>
              </div>

              <div style={{ marginTop: '32px' }}>
                <Link className="button secondary" href="/">
                  <ArrowLeft size={16} /> Return to Homepage
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
