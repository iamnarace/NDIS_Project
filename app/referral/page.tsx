import { Mail, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { SiteHeader } from '../../components/SiteHeader';
import { SiteFooter } from '../../components/SiteFooter';
import { ReferralForm } from '../../components/ReferralForm';

export default function ReferralPage(){return <><SiteHeader/><main>
<section className="pageHero shell compactHero"><span className="eyebrow">Participant & professional referrals</span><h1>Start with a simple conversation.</h1><p>Participants, family members, nominees, support coordinators and plan managers can use this form to check fit and availability.</p></section>
<section className="referral shell referralPage"><div className="referralCopy"><span className="eyebrow">Before you refer</span><h2>Only the basics for now.</h2><p>Please do not send detailed medical reports, identity documents or other highly sensitive records through the first-contact form. We’ll explain a secure process if more information is needed later.</p><div className="contactMini"><span><Phone/> Phone number to be confirmed</span><span><Mail/> support@carepointsupport.com.au <small>working placeholder</small></span><span><MapPin/> Greater Sydney, NSW <small>service area to confirm</small></span></div><div className="complianceNote"><ShieldCheck/><div><strong>Funding model</strong><p>The current website is designed for self-managed and plan-managed NDIS participants. Final service eligibility is confirmed during intake.</p></div></div></div><ReferralForm/></section>
</main><SiteFooter/></>}
