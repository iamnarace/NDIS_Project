import { HelpCircle, Shield, ArrowRight, Phone, Mail, FileText } from 'lucide-react';
import Link from 'next/link';
import { SiteHeader } from '../../components/SiteHeader';
import { SiteFooter } from '../../components/SiteFooter';
import { FundingTransparencyCard } from '../../components/FundingTransparencyCard';
import { ResourceBrochures } from '../../components/ResourceBrochures';

export default function FaqPage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Page Hero */}
        <section className="pageHero">
          <div className="shell">
            <span className="eyebrow">
              <HelpCircle size={15} /> Clarity &amp; Transparency
            </span>
            <h1>Frequently Asked Questions &amp; Pricing</h1>
            <p>
              Find clear answers regarding our NDIS support services, rates, billing, matching process, and service boundaries across Yamba and Northern Rivers NSW.
            </p>
          </div>
        </section>

        {/* FAQ Grid */}
        <section className="softSection">
          <div className="shell">
            <div className="faqGrid">
              <details open>
                <summary>Who can use Opus Care Support Services?</summary>
                <p>Opus Care supports self-managed and plan-managed NDIS participants across Yamba, Maclean, Grafton, Iluka, New Italy, Woodburn, and surrounding Northern Rivers communities. Fit and availability are confirmed during our quick initial onboarding chat.</p>
              </details>

              <details>
                <summary>Are you a registered or unregistered NDIS provider?</summary>
                <p>Opus Care is an independent, unregistered provider. We work directly with self-managed and plan-managed participants and may also support clients through agreed arrangements with registered providers.</p>
              </details>

              <details>
                <summary>How are your hourly rates determined?</summary>
                <p>All our rates strictly adhere to the official NDIS Pricing Arrangements and Price Limits for standard 1-on-1 Core and Capacity Building supports. All rates, travel, and cancellation terms are documented upfront in your service agreement with zero hidden fees.</p>
              </details>

              <details>
                <summary>How quickly can support start after making a referral?</summary>
                <p>Start times depend on your needs, location, worker availability and completion of an agreed service arrangement. We explain the expected timeframe during intake.</p>
              </details>

              <details>
                <summary>What qualifications and checks do your support workers hold?</summary>
                <p>Worker checks, qualifications and experience are confirmed for the supports being provided. Please ask us which checks apply to your service before support begins.</p>
              </details>

              <details>
                <summary>What is your cancellation and reschedule policy?</summary>
                <p>Our cancellation policy aligns with the standard NDIS pricing guidelines (giving at least 2 clear business days&apos; notice for short-notice cancellations). We always work with participants to reschedule where reasonably possible.</p>
              </details>
            </div>
          </div>
        </section>

        {/* Funding Transparency Component */}
        <section className="shell">
          <FundingTransparencyCard />
        </section>

        {/* Resource Brochures Component */}
        <section className="shell">
          <ResourceBrochures />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
