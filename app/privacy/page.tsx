import Link from 'next/link';
import { SiteHeader } from '../../components/SiteHeader';
import { SiteFooter } from '../../components/SiteFooter';

export default function PrivacyPage() {
  return <><SiteHeader/><main>
    <section className="pageHero shell compactHero">
      <span className="eyebrow">Policy</span>
      <h1>Privacy &amp; Confidentiality</h1>
      <p><strong>Draft website policy — for review before business launch.</strong></p>
    </section>
    <section className="shell contentBand">
      <div>
        <h2>Overview</h2>
        <p>CarePoint Support Services is being designed to collect only information reasonably required to respond to enquiries, arrange supports and maintain appropriate service records. Personal and sensitive information will be handled with care, access controls and appropriate security.</p>
      </div>
      <div>
        <h2>What we may collect</h2>
        <p>Contact details, participant or nominee details, funding-management information, support preferences, relevant health or safety information, service records and communications.</p>
        <h2>How we intend to use information</h2>
        <p>To assess enquiries, arrange agreed supports, communicate with authorised people, issue service documentation and invoices, manage safety and meet legal or regulatory obligations.</p>
        <h2>Sharing information</h2>
        <p>Information should only be shared where authorised, required to deliver agreed supports, or required by law. Final privacy notices, consent wording, retention periods and complaint contacts will be confirmed before launch.</p>
        <h2>Website forms</h2>
        <p>The current website is a development build. Referral and contact forms must not be used for real participant information until secure form handling, storage and final privacy controls are configured.</p>
        <Link className="button secondary" href="/">← Back to CarePoint</Link>
      </div>
    </section>
  </main><SiteFooter/></>;
}
