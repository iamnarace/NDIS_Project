import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import Link from 'next/link';
import { SiteHeader } from '../../components/SiteHeader';
import { SiteFooter } from '../../components/SiteFooter';

export default function ContactPage(){return <><SiteHeader/><main>
<section className="pageHero shell compactHero"><span className="eyebrow">Contact CarePoint</span><h1>Questions before making a referral?</h1><p>Start with a general enquiry and we’ll help work out whether CarePoint is the right fit for the support you’re looking for.</p></section>
<section className="softSection"><div className="shell contactCards"><article><Mail/><span>Email</span><h2>support@carepointsupport.com.au</h2><p>Working placeholder until the final CarePoint domain and mailbox are confirmed.</p><a href="mailto:support@carepointsupport.com.au">Email CarePoint</a></article><article><Phone/><span>Phone</span><h2>Number to be confirmed</h2><p>We’ll add the final business number before public launch.</p></article><article><MapPin/><span>Service area</span><h2>Greater Sydney, NSW</h2><p>Exact suburbs and travel boundaries will be confirmed as capacity is finalised.</p></article></div></section>
<section className="shell contentBand"><div><MessageCircle/><h2>Ready to discuss support?</h2></div><div><p>The referral form asks only for enough information to start a conversation. Detailed participant records should be shared later through an agreed secure process.</p><Link className="button" href="/referral">Make a referral</Link></div></section>
</main><SiteFooter/></>}
