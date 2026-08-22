import Link from 'next/link';
import { SiteHeader } from '../../components/SiteHeader';
import { SiteFooter } from '../../components/SiteFooter';

export default function ComplaintsPage() {
  return <><SiteHeader/><main>
    <section className="pageHero shell compactHero">
      <span className="eyebrow">Policy</span>
      <h1>Complaints &amp; Feedback</h1>
      <p><strong>Draft policy — for review before business launch.</strong></p>
    </section>
    <section className="shell contentBand">
      <div>
        <h2>Our approach</h2>
        <p>CarePoint Support Services aims to make it safe and straightforward for participants, families, representatives and other stakeholders to raise feedback or concerns.</p>
      </div>
      <div>
        <h2>How feedback will be handled</h2>
        <ol style={{paddingLeft:'1.2em',color:'#617873',lineHeight:1.75}}>
          <li>Listen respectfully and record the concern.</li>
          <li>Assess any immediate safety issue and act promptly.</li>
          <li>Discuss possible resolution with the person raising the concern.</li>
          <li>Document actions and outcomes.</li>
          <li>Review whether systems or support practices need improvement.</li>
        </ol>
        <p>People receiving NDIS supports can also raise concerns with the NDIS Quality and Safeguards Commission. Final contact details, response targets and escalation process will be added before launch.</p>
        <Link className="button secondary" href="/">← Back to CarePoint</Link>
      </div>
    </section>
  </main><SiteFooter/></>;
}
