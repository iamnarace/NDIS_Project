import Link from 'next/link';
import './home-guided-entry.css';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import { HomeGuidedEntry } from '../components/HomeGuidedEntry';
import { SupportFinderWidget } from '../components/SupportFinderWidget';
import { RegionalCoverageChecker } from '../components/RegionalCoverageChecker';
import { NdisFundingSection } from '../components/NdisFundingSection';
import { JourneyBeginsSection } from '../components/JourneyBeginsSection';
import { NdisToolsResourcesSection } from '../components/NdisToolsResourcesSection';
import { NdisBlogNewsSection } from '../components/NdisBlogNewsSection';
import { ReadyCtaSection } from '../components/ReadyCtaSection';
import { CareSupportReadySection } from '../components/CareSupportReadySection';
import { ParticipantPortalSection } from '../components/ParticipantPortalSection';

import { 
  ArrowRight, FileText, HeartHandshake, Mail
} from 'lucide-react';

export default function HomePage() {
  return (
    <>
      <SiteHeader />

      <main className="mainContentWrap">
        <HomeGuidedEntry />
        <div className="macFundingBoundary">
          <span>UNREGISTERED NDIS PROVIDER</span>
          <span>SUPPORTING SELF & PLAN-MANAGED PARTICIPANTS</span>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            CARE & SUPPORT READY: 8 Circular Activity Badges
        ═══════════════════════════════════════════════════════════════════ */}
        <CareSupportReadySection />

        {/* ═══════════════════════════════════════════════════════════════════
            PARTICIPANT & CARER CRM PORTAL SECTION (Careview / Enabled4Life Style)
        ═══════════════════════════════════════════════════════════════════ */}
        <ParticipantPortalSection />

        {/* ═══════════════════════════════════════════════════════════════════
            NEW SECTION 1: UNDERSTANDING YOUR NDIS FUNDING (Reference 1)
        ═══════════════════════════════════════════════════════════════════ */}
        <NdisFundingSection />

        {/* ═══════════════════════════════════════════════════════════════════
            NEW SECTION 2: YOUR JOURNEY BEGINS HERE (Reference 4)
        ═══════════════════════════════════════════════════════════════════ */}
        <JourneyBeginsSection />

        {/* ═══════════════════════════════════════════════════════════════════
            NEW SECTION 3: FREE NDIS TOOLS & RESOURCES (Reference 3)
        ═══════════════════════════════════════════════════════════════════ */}
        <NdisToolsResourcesSection />

        {/* ═══════════════════════════════════════════════════════════════════
            NEW SECTION 4: NDIS NEWS / BLOG READS (Reference 2)
        ═══════════════════════════════════════════════════════════════════ */}
        <NdisBlogNewsSection />

        {/* ═══════════════════════════════════════════════════════════════════
            INTAKE PROCESS PANE: Simple & Supportive
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="intakeProcessSection">
          <div className="shell">
            <div className="sectionHeaderCenter">
              <span className="greenCategoryTag">INTAKE PROCESS</span>
              <h2 className="sectionSerifTitle">Our Simple and Supportive Intake Process</h2>
              <p className="sectionSubDesc">
                Getting started with Opus Care is effortless. Here is how we connect you with the right support.
              </p>
            </div>

            <div className="intakeStepsGrid3">
              {/* Step 01 */}
              <div className="intakeProcessCard cardTeal">
                <span className="stepWatermarkNum">01</span>
                <div className="intakeIconBox">
                  <FileText size={32} />
                </div>
                <h3>Fill Out Our Online Form</h3>
                <p>Start your journey by completing our quick and easy online referral form. It helps us understand your routine and preferences.</p>
              </div>

              {/* Step 02 */}
              <div className="intakeProcessCard cardLilac">
                <span className="stepWatermarkNum">02</span>
                <div className="intakeIconBox">
                  <Mail size={32} />
                </div>
                <h3>Speak With Our Friendly Team</h3>
                <p>Once we receive your form, our team contacts you promptly to discuss your goals, answer questions, and arrange your care plan.</p>
              </div>

              {/* Step 03 */}
              <div className="intakeProcessCard cardAmber">
                <span className="stepWatermarkNum">03</span>
                <div className="intakeIconBox">
                  <HeartHandshake size={32} />
                </div>
                <h3>Receive Exceptional Care</h3>
                <p>We provide personalized, high-quality care and support workers matched to your lifestyle to help you or your loved ones thrive.</p>
              </div>
            </div>

            <div className="intakeActionRow">
              <Link className="heroPillBtn filled lg" href="/referral">
                <span>Start Intake Form Now</span>
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            INTERACTIVE ESTIMATOR & COVERAGE CARD PANES (Id: estimator)
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="cleanSectionPadding" id="estimator">
          <div className="shell">
            <div className="sectionHeaderCenter">
              <span className="greenCategoryTag">PLANNING & COVERAGE</span>
              <h2 className="sectionSerifTitle">Plan Your Support & Check Coverage</h2>
              <p className="sectionSubDesc">
                Calculate your NDIS budget and verify immediate support worker availability in your town.
              </p>
            </div>

            <div className="interactivePanesGrid">
              <div className="interactivePaneCol">
                <SupportFinderWidget />
              </div>
              <div className="interactivePaneCol">
                <RegionalCoverageChecker />
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            NEW SECTION 5: READY TO GET STARTED CTA BANNER (Reference 4)
        ═══════════════════════════════════════════════════════════════════ */}
        <ReadyCtaSection />
      </main>

      <SiteFooter />
    </>
  );
}
