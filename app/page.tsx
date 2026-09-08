import Link from 'next/link';
import Image from 'next/image';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import { SupportFinderWidget } from '../components/SupportFinderWidget';
import { RegionalCoverageChecker } from '../components/RegionalCoverageChecker';
import { NdisFundingSection } from '../components/NdisFundingSection';
import { JourneyBeginsSection } from '../components/JourneyBeginsSection';
import { NdisToolsResourcesSection } from '../components/NdisToolsResourcesSection';
import { NdisBlogNewsSection } from '../components/NdisBlogNewsSection';
import { ReadyCtaSection } from '../components/ReadyCtaSection';
import { ILoveNdisBadge } from '../components/ILoveNdisBadge';
import { SafetyPriorityNote } from '../components/SafetyPriorityNote';
import { CareSupportReadySection } from '../components/CareSupportReadySection';
import { ParticipantPortalSection } from '../components/ParticipantPortalSection';

import { 
  Heart, Users, Compass, Clock, ShieldCheck, MapPin, ArrowRight, 
  CheckCircle2, Sparkles, FileText, HeartHandshake,
  Home, Activity, Accessibility, UserCheck, ArrowUpRight, Mail
} from 'lucide-react';

export default function HomePage() {
  return (
    <>
      <SiteHeader />

      <main className="mainContentWrap">
        {/* ═══════════════════════════════════════════════════════════════════
            UNIFIED HERO SECTION: Authentic Local Care + Direct Actions
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="unifiedHeroSection">
          <div className="shell">
            <div className="unifiedHeroBox">
              <Image
                src="/images/ndis-community-walk.jpg"
                alt="Opus Care Support Worker and participant enjoying a coastal morning walk in Northern NSW"
                fill
                priority
                className="unifiedHeroCoverImg"
              />
              <div className="unifiedHeroOverlay lightOverlay" />
              <div className="unifiedHeroContentCard lightCard">
                <span className="unifiedHeroBadge lightBadge">
                  EMPOWER YOUR NDIS JOURNEY · NORTHERN NSW
                </span>

                <h1 className="unifiedHeroTitle lightTitle">
                  Working towards your best life, one step at a time
                </h1>

                <p className="unifiedHeroDesc lightDesc">
                  At Opus Care Support Services, we match you with trusted, compassionate local support workers. Supporting Self-Managed and Plan-Managed Participants with genuine choice, control, and transparent 1-on-1 care across Coffs Coast, Clarence Valley, Richmond Valley & Northern Rivers.
                </p>

                <div className="unifiedHeroBtnRow">
                  <Link className="heroPillBtn purpleBtn" href="/referral">
                    <span>Sign Up in a Few Easy Steps</span>
                    <ArrowRight size={16} />
                  </Link>
                  <Link className="heroPillBtn outlinePurple" href="/services">
                    <span>View Our Services</span>
                    <ArrowUpRight size={18} />
                  </Link>
                </div>

                <div className="heroSubtagRow">
                  <span className="heroSubtagText">
                    🛡️ UNREGISTERED NDIS PROVIDER · SUPPORTING SELF & PLAN-MANAGED PARTICIPANTS
                  </span>
                </div>
              </div>
            </div>

            {/* "I 💚 NDIS" Trust Strip */}
            <ILoveNdisBadge />

            {/* Safety Priority Reassurance Micro-Note */}
            <SafetyPriorityNote />
          </div>
        </section>

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
