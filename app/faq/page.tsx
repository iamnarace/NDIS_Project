import Link from 'next/link';
import { SiteHeader } from '../../components/SiteHeader';
import { SiteFooter } from '../../components/SiteFooter';

const faqs = [
  ['Who can use CarePoint?', 'The current service model is designed for self-managed and plan-managed NDIS participants. Final eligibility is confirmed before support begins.'],
  ['Are you a registered NDIS provider?', 'Not at this stage. CarePoint will not claim registered-provider status unless formal registration is approved.'],
  ['How are prices set?', 'Prices are discussed before support begins and documented in the service agreement. Plan-managed supports must remain within applicable NDIS pricing rules.'],
  ['Do you use service agreements?', 'Yes. CarePoint intends to use written service agreements so supports, pricing, travel, cancellations, payment and responsibilities are clear.'],
  ['Can a support coordinator refer someone?', 'Yes. Participants, nominees, support coordinators and plan managers can make a referral or availability enquiry.'],
  ['What information should I send first?', 'Only basic contact, suburb, funding-management and general support information. Please do not send detailed medical records through the first-contact form.'],
];

export default function FAQPage(){return <><SiteHeader/><main><section className="pageHero shell"><span className="eyebrow">Frequently asked questions</span><h1>Clear answers before support starts.</h1><p>These answers describe the current CarePoint business model and will be updated as the final service scope, insurance, contact details and provider status are confirmed.</p></section><section className="softSection"><div className="shell faqList">{faqs.map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div></section><section className="contact shell"><div><span className="eyebrow">Still have a question?</span><h2>Talk to CarePoint.</h2></div><Link className="button" href="/contact">Contact us</Link></section></main><SiteFooter/></>}
