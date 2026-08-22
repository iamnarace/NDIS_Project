import Link from 'next/link';
import { SiteHeader } from '../../components/SiteHeader';
import { SiteFooter } from '../../components/SiteFooter';

export default function CodePage() {
  return <><SiteHeader/><main>
    <section className="pageHero shell compactHero">
      <span className="eyebrow">Policy</span>
      <h1>NDIS Code of Conduct Commitment</h1>
      <p><strong>Draft public commitment — for review before business launch.</strong></p>
    </section>
    <section className="shell contentBand">
      <div>
        <h2>Our commitment</h2>
        <p>CarePoint Support Services is being established to operate consistently with the NDIS Code of Conduct.</p>
      </div>
      <div>
        <p>This includes respecting individual rights and decision-making, protecting privacy, delivering supports safely and competently, acting with integrity and transparency, taking steps to prevent and respond to violence, neglect, abuse and exploitation, addressing concerns promptly, and supporting fair pricing practices.</p>
        <p>This page is a plain-language public commitment rather than a substitute for the official NDIS Code of Conduct. Final internal procedures and worker obligations will be documented before service delivery begins.</p>
        <Link className="button secondary" href="/">← Back to CarePoint</Link>
      </div>
    </section>
  </main><SiteFooter/></>;
}
