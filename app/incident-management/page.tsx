import Link from 'next/link';
import { SiteHeader } from '../../components/SiteHeader';
import { SiteFooter } from '../../components/SiteFooter';

export default function IncidentPage() {
  return <><SiteHeader/><main>
    <section className="pageHero shell compactHero">
      <span className="eyebrow">Policy</span>
      <h1>Incident Management</h1>
      <p><strong>Draft policy — for review before business launch.</strong></p>
    </section>
    <section className="shell contentBand">
      <div>
        <h2>Our commitment</h2>
        <p>CarePoint Support Services intends to identify, respond to, record and review incidents connected with the delivery of supports, with participant safety, dignity and communication as the priority.</p>
      </div>
      <div>
        <h2>Our intended process</h2>
        <ol style={{paddingLeft:'1.2em',color:'#617873',lineHeight:1.75}}>
          <li>Make the situation safe and arrange urgent assistance where required.</li>
          <li>Support and inform the participant and relevant authorised people.</li>
          <li>Record what happened, actions taken and any follow-up required.</li>
          <li>Assess whether any external notification or escalation is required.</li>
          <li>Review the incident for corrective actions and service improvements.</li>
        </ol>
        <p>Final responsibilities, records, notification requirements and emergency contacts will be confirmed against CarePoint&apos;s final provider status and service scope before launch.</p>
        <Link className="button secondary" href="/">← Back to CarePoint</Link>
      </div>
    </section>
  </main><SiteFooter/></>;
}
