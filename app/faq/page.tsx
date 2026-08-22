import { ShieldCheck, HelpCircle, ArrowRight, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { SiteHeader } from '../../components/SiteHeader';
import { SiteFooter } from '../../components/SiteFooter';
import { SupportFinderWidget } from '../../components/SupportFinderWidget';
import { FundingTransparencyCard } from '../../components/FundingTransparencyCard';
import { ResourceBrochures } from '../../components/ResourceBrochures';

const participantFaqs = [
  ['Who can access CarePoint Support Services?', 'CarePoint supports self-managed and plan-managed NDIS participants across Greater Sydney. Final eligibility and worker suitability are confirmed during intake.'],
  ['Are you an NDIS registered provider?', 'CarePoint operates under the unregistered NDIS provider framework. This model allows self-managed and plan-managed participants to choose their support workers freely and flexibly.'],
  ['How do I choose the days and times for my support?', 'You decide your preferred schedule during our initial intake. We discuss your routines, preferred times, and any weekend or evening requirements.'],
  ['Can I meet my support worker before services start?', 'Yes! We encourage an introductory meet-and-greet (in person or online) so you feel completely comfortable and confident with your support worker.'],
];

const coordinatorFaqs = [
  ['How do Support Coordinators make a referral?', 'Coordinators can use our online referral form or email us directly at support@carepointsupport.com.au. We acknowledge and respond to all referrals within 1 business day.'],
  ['How are prices and hourly rates determined?', 'Our pricing strictly adheres to the official NDIS Pricing Arrangements and Price Limits for standard core and capacity-building line items.'],
  ['What are your billing and invoice turnaround times?', 'We issue clean, itemised PDF tax invoices within 48 hours of completed shifts, sent directly to the designated Plan Manager or self-managed participant.'],
  ['What are your cancellation policies?', 'Our cancellation policy aligns with the standard NDIS framework (short-notice cancellation guidelines) and is clearly documented in the service agreement.'],
];

export default function FAQPage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Page Hero */}
        <section className="pageHero shell">
          <span className="eyebrow"><HelpCircle size={16} /> FAQ &amp; Transparency</span>
          <h1>Frequently Asked Questions &amp; NDIS Pricing</h1>
          <p>
            Clear, honest answers about our support model, NDIS price limit alignment, service agreements, and referral processes.
          </p>
        </section>

        {/* Participant FAQs */}
        <section className="softSection">
          <div className="shell">
            <div className="sectionHead">
              <span className="eyebrow">For Participants &amp; Families</span>
              <h2>General Support &amp; Onboarding Questions</h2>
            </div>
            <div className="faqGrid">
              {participantFaqs.map(([q, a]) => (
                <details key={q} open>
                  <summary>{q}</summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Estimator */}
        <section className="shell">
          <SupportFinderWidget />
        </section>

        {/* Coordinator & Plan Manager FAQs */}
        <section className="softSection">
          <div className="shell">
            <div className="sectionHead">
              <span className="eyebrow">For Professionals</span>
              <h2>Support Coordinators &amp; Plan Managers</h2>
            </div>
            <div className="faqGrid">
              {coordinatorFaqs.map(([q, a]) => (
                <details key={q}>
                  <summary>{q}</summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Funding Guide */}
        <section className="shell">
          <FundingTransparencyCard />
        </section>

        {/* Resource Brochures */}
        <section className="shell">
          <ResourceBrochures />
        </section>

        {/* Contact CTA */}
        <section className="contact shell">
          <div>
            <span className="eyebrow">Still have a question?</span>
            <h2>We&apos;re Here to Help You Navigate Your Support</h2>
            <p>Reach out to our Sydney team directly to discuss your specific goals or NDIS plan.</p>
          </div>
          <div className="contactActions">
            <Link className="button" href="/referral">
              Make a Referral <ArrowRight size={18} />
            </Link>
            <Link className="button secondary" href="/contact">
              Contact Team
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
