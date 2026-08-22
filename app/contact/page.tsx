import { Mail, MapPin, MessageCircle, Phone, Clock, ShieldCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { SiteHeader } from '../../components/SiteHeader';
import { SiteFooter } from '../../components/SiteFooter';
import { SydneyCoverageChecker } from '../../components/SydneyCoverageChecker';

export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Page Hero */}
        <section className="pageHero shell compactHero">
          <span className="eyebrow">Contact CarePoint</span>
          <h1>Get In Touch With Our Team</h1>
          <p>
            Have questions before making a referral? Whether you&apos;re a participant, family member or coordinator, we&apos;re here to help.
          </p>
        </section>

        {/* Contact Information Cards */}
        <section className="softSection">
          <div className="shell contactCards">
            <article>
              <Mail size={32} />
              <span>Email Support</span>
              <h2>support@carepointsupport.com.au</h2>
              <p>Direct inquiries, intake forms, and service agreement questions.</p>
              <a href="mailto:support@carepointsupport.com.au">Send us an email →</a>
            </article>

            <article>
              <MapPin size={32} />
              <span>Service Area</span>
              <h2>Greater Sydney, NSW</h2>
              <p>Western Sydney, South West, Inner West, Hills District, North Shore &amp; surrounds.</p>
              <Link href="/services">View coverage map →</Link>
            </article>

            <article>
              <Clock size={32} />
              <span>Operating Hours</span>
              <h2>Monday – Saturday</h2>
              <p>Flexible 7-day support arrangements available upon agreement.</p>
              <Link href="/referral">Request preferred hours →</Link>
            </article>
          </div>
        </section>

        {/* Coverage Checker on Contact Page */}
        <section className="shell">
          <SydneyCoverageChecker />
        </section>

        {/* Bottom Direct Action */}
        <section className="shell contentBand">
          <div>
            <MessageCircle size={32} />
            <h2>Ready to Discuss Support?</h2>
          </div>
          <div>
            <p>
              Our online referral wizard takes less than 2 minutes and asks only for essential details to start the conversation.
            </p>
            <Link className="button" href="/referral">
              Start Online Referral <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
