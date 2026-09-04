import { Mail, MapPin, Phone, Shield, Clock, HeartHandshake, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { SiteHeader } from '../../components/SiteHeader';
import { SiteFooter } from '../../components/SiteFooter';
import { RegionalCoverageChecker } from '../../components/RegionalCoverageChecker';
import { ContactForm } from '../../components/ContactForm';

export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Page Hero */}
        <section className="pageHero">
          <div className="shell">
            <span className="eyebrow">
              <Mail size={15} /> Get In Touch
            </span>
            <h1>Contact Opus Care Support Services</h1>
            <p>
              Whether you are an NDIS participant, family member, nominee, support coordinator or plan manager, we would love to hear from you.
            </p>
          </div>
        </section>

        {/* Split Form & Information Section */}
        <section className="softSection">
          <div className="shell">
            <div className="contactSplitSection">
              {/* Left Column: Interactive Contact Form */}
              <ContactForm />

              {/* Right Column: Contact Details & Quick Links */}
              <aside className="contactInfoSidebar">
                <div className="sidebarContactCard">
                  <div className="sidebarIconCircle">
                    <Mail size={22} color="#0D9488" />
                  </div>
                  <div>
                    <span className="sidebarCardLabel">Direct Email</span>
                    <h3>bijaykafle41@gmail.com</h3>
                    <p>Send enquiries anytime. We review messages and respond as soon as practical.</p>
                    <a href="mailto:bijaykafle41@gmail.com" className="sidebarActionLink">
                      Send an email →
                    </a>
                  </div>
                </div>

                <div className="sidebarContactCard">
                  <div className="sidebarIconCircle">
                    <MapPin size={22} color="#0D9488" />
                  </div>
                  <div>
                    <span className="sidebarCardLabel">Local Service Region</span>
                    <h3>Clarence Coast &amp; Northern Rivers</h3>
                    <p>Supporting Yamba, Maclean, Grafton, Iluka, New Italy, Woodburn, Evans Head and surrounding communities.</p>
                    <span className="sidebarBadgeGreen">🟢 Taking New Referrals</span>
                  </div>
                </div>

                <div className="sidebarContactCard">
                  <div className="sidebarIconCircle">
                    <Shield size={22} color="#0D9488" />
                  </div>
                  <div>
                    <span className="sidebarCardLabel">NDIS Framework</span>
                    <h3>Unregistered Provider Model</h3>
                    <p>Supporting self-managed and plan-managed NDIS participants with zero hidden administrative fees.</p>
                    <Link href="/faq" className="sidebarActionLink">
                      View pricing transparency →
                    </Link>
                  </div>
                </div>

                <div className="sidebarReferralCallout">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Sparkles size={18} color="#5EEAD4" />
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#5EEAD4' }}>Ready To Refer?</span>
                  </div>
                  <strong>Need to make a direct participant referral?</strong>
                  <p>Our online referral form takes only 3 minutes to complete and ensures fast onboarding.</p>
                  <Link href="/referral" className="button secondary" style={{ marginTop: '16px', background: '#FFFFFF', color: '#0E3D3A' }}>
                    Complete Referral Form <ArrowRight size={16} />
                  </Link>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* Regional Coverage Checker */}
        <section className="shell">
          <RegionalCoverageChecker />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
