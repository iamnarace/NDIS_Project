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
                <summary>Who can use CarePoint Support Services?</summary>
                <p>CarePoint supports self-managed and plan-managed NDIS participants across Yamba, Maclean, Grafton, Iluka, New Italy, Woodburn, and surrounding Northern Rivers communities. Fit and availability are confirmed during our quick initial onboarding chat.</p>
              </details>

              <details>
                <summary>Are you a registered or unregistered NDIS provider?</summary>
                <p>CarePoint operates as an unregistered provider under the NDIS framework. We do not claim registered status. This means we can work directly with self-managed and plan-managed participants, offering personalised support with zero administrative overhead.</p>
              </details>

              <details>
                <summary>How are your hourly rates determined?</summary>
                <p>All our rates strictly adhere to the official NDIS Pricing Arrangements and Price Limits for standard 1-on-1 Core and Capacity Building supports. All rates, travel, and cancellation terms are documented upfront in your service agreement with zero hidden fees.</p>
              </details>

              <details>
                <summary>How quickly can support start after making a referral?</summary>
                <p>We review and respond to all referrals within 1 business day. After discussing your needs, confirming support worker availability, and signing an agreed service agreement, support can commence within 3–7 business days.</p>
              </details>

              <details>
                <summary>What qualifications and checks do your support workers hold?</summary>
                <p>All CarePoint support workers hold valid NDIS Worker Screening Check clearances, Working With Children Checks (WWCC), Current First Aid &amp; CPR certifications, and adhere strictly to the NDIS Code of Conduct.</p>
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
