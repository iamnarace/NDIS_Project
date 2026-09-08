import { Mail, MapPin, Phone, ShieldCheck, CheckCircle2, Clock, FileText, ArrowRight, Sparkles, HeartHandshake } from 'lucide-react';
import SiteHeader from '../../components/SiteHeader';
import SiteFooter from '../../components/SiteFooter';
import { ReferralForm } from '../../components/ReferralForm';

export default function ReferralPage() {
  return (
    <>
      <SiteHeader />

      <main className="referralMainWrapper">
        {/* Page Hero Header */}
        <section className="referralHeroSection">
          <div className="shell">
            <div className="referralHeroCenter">
              <span className="greenCategoryTag">
                <Sparkles size={14} /> DIRECT NDIS INTAKE
              </span>
              <h1 className="sectionSerifTitle">Start With a Simple, Direct Referral</h1>
              <p className="sectionSubDesc">
                Participants, family members, nominees, Support Coordinators, and Plan Managers can submit an enquiry below. We respond within 24 business hours.
              </p>
            </div>
          </div>
        </section>

        {/* Main Referral Form Split Panes */}
        <section className="referralContentSection">
          <div className="shell referralPanesGrid">
            
            {/* Left Side: Intake Guide Pane */}
            <div className="intakeGuideCardPane">
              <span className="guideSubBadge">DIRECT INTAKE GUIDE</span>
              <h2>Simple, Respectful & Confidential</h2>
              <p className="guideIntro">
                Please keep this first enquiry brief. We do not require complex diagnostic files or medical history upfront. We will arrange a friendly conversation at your convenience.
              </p>

              {/* 3 Step Intake Guide */}
              <div className="guideStepsList">
                <div className="guideStepItem">
                  <div className="guideStepNum">1</div>
                  <div className="guideStepContent">
                    <strong>Submit Online Referral</strong>
                    <p>Takes under 2 minutes to outline your preferred support needs.</p>
                  </div>
                </div>

                <div className="guideStepItem">
                  <div className="guideStepNum">2</div>
                  <div className="guideStepContent">
                    <strong>Initial Conversation & Fit Check</strong>
                    <p>We discuss goals, routine preferences, schedule, and preferred support worker qualities.</p>
                  </div>
                </div>

                <div className="guideStepItem">
                  <div className="guideStepNum">3</div>
                  <div className="guideStepContent">
                    <strong>Simple Service Agreement</strong>
                    <p>Transparent rates strictly aligned with official NDIS price limits with zero hidden fees.</p>
                  </div>
                </div>
              </div>

              {/* Direct Contact Info */}
              <div className="guideContactBox">
                <div className="guideContactLine">
                  <Mail size={16} className="gIcon" />
                  <a href="mailto:support@opuscare.com.au">support@opuscare.com.au</a>
                </div>
                <div className="guideContactLine">
                  <MapPin size={16} className="gIcon" />
                  <span>Yamba, Grafton & Northern Rivers NSW</span>
                </div>
                <div className="guideContactLine">
                  <Clock size={16} className="gIcon" />
                  <span>24h Referral Response Guarantee</span>
                </div>
              </div>

              {/* Funding Compatibility Badge */}
              <div className="guideFundingBadge">
                <ShieldCheck size={22} className="fCheckIcon" />
                <div>
                  <strong>Funding Compatibility</strong>
                  <p>Supporting <strong>Plan-Managed</strong> and <strong>Self-Managed</strong> NDIS participants.</p>
                </div>
              </div>
            </div>

            {/* Right Side: The 3-Step Interactive Form */}
            <div className="referralFormCardPane">
              <ReferralForm />
            </div>

          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
