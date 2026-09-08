import { Mail, MapPin, Shield, Clock, Sparkles, ArrowRight, CheckCircle2, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { SiteHeader } from '../../components/SiteHeader';
import { SiteFooter } from '../../components/SiteFooter';
import { RegionalCoverageChecker } from '../../components/RegionalCoverageChecker';
import { ContactForm } from '../../components/ContactForm';

export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main className="contactMainWrapper">
        {/* Page Hero Header */}
        <section className="contactHeroSection">
          <div className="shell">
            <div className="contactHeroCenter">
              <span className="greenCategoryTag">
                <Mail size={14} /> GET IN TOUCH
              </span>
              <h1 className="sectionSerifTitle">Contact Opus Care Support Services</h1>
              <p className="sectionSubDesc">
                Whether you are an NDIS participant, family member, nominee, support coordinator, or plan manager, we are here to assist with dependable guidance and fast turnaround.
              </p>
            </div>
          </div>
        </section>

        {/* Controlled Split Panes Section */}
        <section className="contactPanesSection">
          <div className="shell contactSplitPanes">
            {/* Left: Controlled Form Pane */}
            <ContactForm />

            {/* Right: Controlled Sidebar Details Pane */}
            <aside className="contactDetailsSidebarPane">
              {/* Direct Email Box */}
              <div className="controlledCardPane contactDetailCard">
                <div className="sidebarIconCircle">
                  <Mail size={22} />
                </div>
                <div className="sidebarDetailContent">
                  <span className="sidebarLabel">DIRECT EMAIL</span>
                  <h3>support@opuscare.com.au</h3>
                  <p>Send enquiries anytime. Our local care coordinators review and respond to all messages within 24 business hours.</p>
                  <a href="mailto:support@opuscare.com.au" className="sidebarActionLink">
                    Send an email →
                  </a>
                </div>
              </div>

              {/* Fast Response Guarantee Box */}
              <div className="controlledCardPane contactDetailCard">
                <div className="sidebarIconCircle purpleCircle">
                  <Clock size={22} />
                </div>
                <div className="sidebarDetailContent">
                  <span className="sidebarLabel">INTAKE CAPACITY</span>
                  <h3>Immediate Availability</h3>
                  <p>We have active support worker capacity across Lower Clarence and Richmond Valley with zero waitlists for core supports.</p>
                  <span className="sidebarBadgeGreen">🟢 Taking New Referrals</span>
                </div>
              </div>

              {/* Service Hub Box */}
              <div className="controlledCardPane contactDetailCard">
                <div className="sidebarIconCircle">
                  <MapPin size={22} />
                </div>
                <div className="sidebarDetailContent">
                  <span className="sidebarLabel">LOCAL SERVICE REGION</span>
                  <h3>Yamba, Grafton & Northern Rivers</h3>
                  <p>Supporting Yamba, Maclean, Grafton, Iluka, New Italy, Woodburn, Evans Head, and surrounding Clarence communities.</p>
                </div>
              </div>

              {/* Quick Referral Banner Card */}
              <div className="controlledCardPane sidebarReferralCard">
                <span className="guideSubBadge">READY TO REFER?</span>
                <h4>Need to submit a direct participant referral?</h4>
                <p>Our online referral form takes under 2 minutes to complete and ensures fast onboarding.</p>
                <Link href="/referral" className="heroPillBtn filled">
                  <span>Complete Referral Form</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </aside>
          </div>
        </section>

        {/* Regional Coverage Checker Section */}
        <section className="coverageSectionWrap">
          <div className="shell">
            <RegionalCoverageChecker />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
