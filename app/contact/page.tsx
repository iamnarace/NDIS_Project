import { Mail, MapPin, Phone, Clock, ShieldCheck, ArrowRight, MessageSquare, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { SiteHeader } from '../../components/SiteHeader';
import { SiteFooter } from '../../components/SiteFooter';
import { ContactForm } from '../../components/ContactForm';
import { RegionalCoverageChecker } from '../../components/RegionalCoverageChecker';

export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Page Hero */}
        <section className="pageHero shell">
          <div className="heroCopy textCenter" style={{ margin: '0 auto', maxWidth: '780px' }}>
            <span className="eyebrow">
              <Sparkles size={16} /> Contact &amp; Enquiries
            </span>
            <h1>Let&apos;s Discuss Support Tailored to You</h1>
            <p className="lead">
              Have questions about NDIS supports, pricing, or worker availability around Yamba, Grafton, or the Northern Rivers? Send our local intake team a message or start a referral today.
            </p>
          </div>
        </section>

        {/* Contact Split Grid: Contact Form + Direct Details */}
        <section className="shell contactSplitSection">
          <div className="contactFormCol">
            <div className="contactFormCardWrapper">
              <div className="formCardHeader">
                <span className="formCardTag">Direct Intake Form</span>
                <h2>Send Us an Enquiry</h2>
                <p>We review and respond to every enquiry within 1 business day.</p>
              </div>
              <ContactForm />
            </div>
          </div>

          <div className="contactInfoSidebar">
            {/* Quick Contact Cards */}
            <div className="sidebarContactCard">
              <div className="sidebarIconCircle">
                <Mail size={24} color="#0D9488" />
              </div>
              <div>
                <span className="sidebarCardLabel">Direct Email</span>
                <h3>support@carepointsupport.com.au</h3>
                <p>For service agreements, plan inquiries, and coordinator referrals.</p>
                <a href="mailto:support@carepointsupport.com.au" className="sidebarActionLink">
                  Email us directly →
                </a>
              </div>
            </div>

            <div className="sidebarContactCard">
              <div className="sidebarIconCircle">
                <MapPin size={24} color="#0D9488" />
              </div>
              <div>
                <span className="sidebarCardLabel">Primary Hub &amp; Service Radius</span>
                <h3>Yamba &amp; Clarence Coast, NSW</h3>
                <p>Covering Yamba, Maclean, Grafton, Iluka, New Italy, Woodburn, Evans Head, and surrounding districts within a 50–60 km radius.</p>
                <Link href="#coverage" className="sidebarActionLink">
                  Check your town on map →
                </Link>
              </div>
            </div>

            <div className="sidebarContactCard">
              <div className="sidebarIconCircle">
                <Clock size={24} color="#0D9488" />
              </div>
              <div>
                <span className="sidebarCardLabel">Service Hours &amp; Flexibility</span>
                <h3>Monday – Sunday Support</h3>
                <p>Flexible in-home and community shifts tailored to your schedule and NDIS plan.</p>
                <span className="sidebarBadgeGreen">🟢 Intake Open</span>
              </div>
            </div>

            <div className="sidebarReferralCallout">
              <ShieldCheck size={28} color="#0D9488" />
              <div>
                <strong>Need a complete referral?</strong>
                <p>Our 3-step intake wizard lets coordinators and participants select specific goals and schedule needs.</p>
                <Link href="/referral" className="button primary full" style={{ marginTop: '12px' }}>
                  Make a Direct Referral <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Regional Coverage Checker */}
        <section className="shell" id="coverage" style={{ margin: '60px auto' }}>
          <RegionalCoverageChecker />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
