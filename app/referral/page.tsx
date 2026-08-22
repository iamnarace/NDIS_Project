import { Mail, MapPin, Phone, ShieldCheck, CheckCircle2, Clock, FileText, ArrowRight } from 'lucide-react';
import { SiteHeader } from '../../components/SiteHeader';
import { SiteFooter } from '../../components/SiteFooter';
import { ReferralForm } from '../../components/ReferralForm';
import { ResourceBrochures } from '../../components/ResourceBrochures';

export default function ReferralPage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Page Hero */}
        <section className="pageHero shell compactHero">
          <span className="eyebrow">Participant &amp; Professional Referrals</span>
          <h1>Start With a Simple, Direct Referral</h1>
          <p>
            NDIS participants, family members, nominees, support coordinators and plan managers can submit a direct enquiry below. We respond within 1 business day.
          </p>
        </section>

        {/* Main Referral Form Split */}
        <section className="shell referral">
          <div className="referralCopy">
            <span className="eyebrow">Direct Intake Guide</span>
            <h2>Simple, Respectful &amp; Confidential</h2>
            <p>
              Please keep this first enquiry brief. We do not require detailed medical reports or clinical diagnostic files upfront. We will arrange a secure discussion if additional details are helpful.
            </p>

            {/* Intake Steps Mini Guide */}
            <div className="intakeStepsMini">
              <div className="intakeStepItem">
                <span className="stepNumBadge">1</span>
                <div>
                  <strong>Submit Online Referral</strong>
                  <small>Takes under 2 minutes to outline your preferred support.</small>
                </div>
              </div>
              <div className="intakeStepItem">
                <span className="stepNumBadge">2</span>
                <div>
                  <strong>Initial Conversation &amp; Fit Check</strong>
                  <small>We discuss goals, routine preferences, schedule and location.</small>
                </div>
              </div>
              <div className="intakeStepItem">
                <span className="stepNumBadge">3</span>
                <div>
                  <strong>Simple Service Agreement</strong>
                  <small>Transparent hourly rates aligned strictly with NDIS price limits.</small>
                </div>
              </div>
            </div>

            {/* Direct Contact Info */}
            <div className="contactMini">
              <span><Mail size={18} /> support@carepointsupport.com.au</span>
              <span><MapPin size={18} /> Servicing Greater Sydney, NSW</span>
              <span><Clock size={18} /> 24h Referral Response Guarantee</span>
            </div>

            <div className="complianceNote">
              <ShieldCheck size={24} />
              <div>
                <strong>Funding Compatibility</strong>
                <p>
                  CarePoint currently supports <strong>Plan-Managed</strong> and <strong>Self-Managed</strong> NDIS participants.
                </p>
              </div>
            </div>
          </div>

          {/* The Crystal-Clear 3-Step Referral Wizard */}
          <ReferralForm />
        </section>

        {/* Helpful Downloadable Guides */}
        <section className="shell">
          <ResourceBrochures />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
