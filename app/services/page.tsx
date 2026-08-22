import { ArrowRight, Car, CheckCircle2, ClipboardCheck, HeartHandshake, Home, Sparkles, Users } from 'lucide-react';
import Link from 'next/link';
import { SiteHeader } from '../../components/SiteHeader';
import { SiteFooter } from '../../components/SiteFooter';

const services = [
  { icon: Home, title: 'Daily Living Support', text: 'Respectful assistance with everyday routines and practical tasks, shaped around the participant’s preferences, goals and agreed support plan.', examples: ['Everyday routines', 'Meal preparation support', 'Personal organisation', 'General in-home assistance'] },
  { icon: Users, title: 'Community Participation', text: 'One-to-one support to get out, connect and take part in community life with confidence.', examples: ['Social activities', 'Shopping and errands', 'Appointments', 'Community events'] },
  { icon: Car, title: 'Transport Support', text: 'Transport assistance connected to agreed disability supports, subject to funding, vehicle suitability and the service agreement.', examples: ['Appointments', 'Community access', 'Activities', 'Agreed local travel'] },
  { icon: Sparkles, title: 'Life Skills & Independence', text: 'Practical capacity-building support focused on confidence, routines and everyday independence.', examples: ['Planning and routines', 'Shopping skills', 'Using community services', 'Confidence building'] },
  { icon: HeartHandshake, title: 'Companionship & Social Support', text: 'Consistent support built around interests, communication preferences and meaningful participation.', examples: ['Conversation and connection', 'Hobbies and interests', 'Outings', 'Goal-focused social support'] },
  { icon: ClipboardCheck, title: 'Household & Practical Assistance', text: "Support with agreed household tasks where appropriate to the participant's plan and goals.", examples: ['Light household tasks', 'Home organisation', 'Shopping support', 'Routine assistance'] },
];

export default function ServicesPage() {
  return <><SiteHeader/><main>
    <section className="pageHero shell"><span className="eyebrow">Our services</span><h1>Support for everyday life, built around you.</h1><p>CarePoint is starting with practical, lower-risk disability supports for self-managed and plan-managed NDIS participants. Every service is discussed and agreed before support begins.</p><div className="actions"><Link className="button" href="/referral">Make a referral <ArrowRight size={18}/></Link><Link className="button secondary" href="/contact">Ask a question</Link></div></section>
    <section className="softSection"><div className="shell serviceDetailGrid">{services.map(({icon:Icon,title,text,examples}) => <article className="serviceDetail" key={title}><span className="icon"><Icon/></span><h2>{title}</h2><p>{text}</p><ul>{examples.map(x=><li key={x}><CheckCircle2 size={16}/>{x}</li>)}</ul><Link href="/referral">Ask about {title.toLowerCase()} <ArrowRight size={15}/></Link></article>)}</div></section>
    <section className="shell contentBand"><div><span className="eyebrow">Important</span><h2>We only promise what we can safely deliver.</h2></div><div><p>CarePoint will confirm the participant’s needs, our capacity, funding management, risks and the exact service scope before accepting a referral. Supports requiring specialist qualifications, restrictive-practice authorisation, clinical oversight or registration are not represented here unless and until CarePoint is properly authorised and equipped to provide them.</p></div></section>
  </main><SiteFooter/></>;
}
