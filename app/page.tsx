import { ArrowRight, CalendarCheck, CheckCircle2, HeartHandshake, Home, MapPin, ShieldCheck, Sparkles, Users, Car, ClipboardCheck, MessageCircle, Clock3 } from 'lucide-react';
import Link from 'next/link';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';

const services = [
  { icon: Home, title: 'Daily Living Support', text: 'Practical, respectful assistance with everyday routines so support fits comfortably into daily life.' },
  { icon: Users, title: 'Community Participation', text: 'Support to attend appointments, activities, shopping, community events and meaningful outings.' },
  { icon: Car, title: 'Transport Support', text: 'Flexible transport assistance connected to agreed disability supports and participant goals.' },
  { icon: Sparkles, title: 'Life Skills & Independence', text: 'Capacity-building support focused on routines, confidence, organisation and everyday independence.' },
  { icon: HeartHandshake, title: 'Companionship & Social Support', text: 'One-to-one support built around choice, interests, preferred routines and social connection.' },
  { icon: ClipboardCheck, title: 'Household & Practical Assistance', text: 'Everyday household support where appropriate to the participant’s plan and agreed goals.' },
];

const trust = ['NDIS Worker Screening Clearance', 'First Aid & CPR', 'Person-centred approach', 'Clear service agreements'];

export default function HomePage() {
  return <><SiteHeader/><main>
    <section className="hero shell" id="top">
      <div className="heroCopy">
        <span className="eyebrow"><ShieldCheck size={17}/> Choice · dignity · independence</span>
        <h1>Support that feels <em>personal.</em><br/>Care you can count on.</h1>
        <p className="lead">CarePoint Support Services provides practical, respectful disability support designed around each participant’s goals, routines and choices across Greater Sydney.</p>
        <div className="actions"><Link className="button" href="/referral">Start a referral <ArrowRight size={18}/></Link><Link className="button secondary" href="/services">Explore services</Link></div>
        <div className="trustRow">{trust.map(x => <span key={x}><CheckCircle2 size={16}/>{x}</span>)}</div>
      </div>
      <div className="heroVisual">
        <div className="photo placeholderPhoto" role="img" aria-label="CarePoint brand visual placeholder">
          <div className="careScene"><span className="sceneCircle one"/><span className="sceneCircle two"/><div className="scenePerson a"/><div className="scenePerson b"/></div>
          <div className="photoOverlay"><span>CarePoint Support Services</span><strong>Your goals. Your choices. Your support.</strong></div>
        </div>
        <div className="floatingCard"><Clock3/><div><strong>Flexible support</strong><small>Built around your schedule and agreed supports</small></div></div>
      </div>
    </section>

    <section className="audienceStrip"><div className="shell"><span>Looking for support as a</span><Link href="/referral">Participant</Link><Link href="/referral">Family / nominee</Link><Link href="/referral">Support coordinator</Link><Link href="/referral">Plan manager</Link></div></section>

    <section className="softSection" id="services"><div className="shell">
      <div className="sectionHead"><span className="eyebrow">Our support</span><h2>Practical help for everyday life</h2><p>Focused services, clear boundaries and support shaped around the person — not a one-size-fits-all package.</p></div>
      <div className="serviceGrid">{services.map(({icon: Icon,title,text}) => <article className="serviceCard" key={title}><span className="icon"><Icon/></span><h3>{title}</h3><p>{text}</p><Link href="/services">Learn more <ArrowRight size={15}/></Link></article>)}</div>
      <div className="centerCta"><Link className="button secondary" href="/services">View all service details <ArrowRight size={17}/></Link></div>
    </div></section>

    <section className="split shell" id="about">
      <div className="aboutVisual"><div className="brandOrb">CP</div><div className="quoteCard"><MessageCircle/><p>“Good support starts by listening.”</p><span>CarePoint principle</span></div></div>
      <div className="aboutCopy"><span className="eyebrow">Why CarePoint</span><h2>Small enough to know you. Professional enough to support you well.</h2><p>CarePoint is being built around a simple idea: disability support should feel dependable, clear and genuinely centred on the person receiving it.</p>
        <ul><li><CheckCircle2/>Participant choice and control</li><li><CheckCircle2/>Respectful communication</li><li><CheckCircle2/>Reliable scheduling and clear expectations</li><li><CheckCircle2/>Transparent service agreements and pricing</li><li><CheckCircle2/>Safety, privacy and continuous improvement</li></ul>
        <Link className="inlineCta" href="/about">More about our approach →</Link>
      </div>
    </section>

    <section className="processSection" id="process"><div className="shell"><div className="sectionHead light"><span className="eyebrow">Getting started</span><h2>From enquiry to support, without the run-around.</h2></div><div className="steps">
      <article><b>01</b><h3>Tell us what you need</h3><p>Send a short enquiry with the participant’s general goals, location and preferred support.</p></article>
      <article><b>02</b><h3>Talk it through</h3><p>We confirm fit, availability, funding management and important support or safety requirements.</p></article>
      <article><b>03</b><h3>Agree clearly</h3><p>Supports, schedule, pricing, travel, cancellations and responsibilities are documented before starting.</p></article>
      <article><b>04</b><h3>Support begins</h3><p>Support starts with clear communication, records and regular check-ins as needs evolve.</p></article>
    </div></div></section>

    <section className="shell proofBand"><div><ShieldCheck/><strong>Safe, accountable foundations</strong><span>Code of Conduct · privacy · feedback · incidents · risk awareness</span></div><div><MapPin/><strong>Local support</strong><span>Greater Sydney service area being finalised</span></div><div><CalendarCheck/><strong>Simple referrals</strong><span>Participant and professional referral pathway</span></div></section>

    <section className="faq softSection" id="faq"><div className="shell"><div className="sectionHead"><span className="eyebrow">Frequently asked questions</span><h2>Useful information before you get started</h2></div><div className="faqGrid">
      <details open><summary>Who can use CarePoint?</summary><p>The current unregistered-provider model is designed for self-managed and plan-managed NDIS participants. Final eligibility is confirmed during intake.</p></details>
      <details><summary>Are you a registered NDIS provider?</summary><p>Not at this stage. CarePoint will not claim registered-provider status unless registration is formally approved.</p></details>
      <details><summary>How are prices set?</summary><p>Prices are agreed before support begins and documented in the service agreement. Final rates will be aligned with the current NDIS pricing framework and relevant support items.</p></details>
      <details><summary>Do you use service agreements?</summary><p>Yes. CarePoint intends to use written service agreements so supports, pricing, travel, cancellations, payment and responsibilities are clear.</p></details>
    </div></div></section>

    <section className="contact shell" id="contact"><div><span className="eyebrow">Ready to talk?</span><h2>Let’s find out if CarePoint is the right fit.</h2><p>Whether you’re a participant, family member, support coordinator or plan manager, start with a simple enquiry.</p></div><div className="contactActions"><Link className="button" href="/referral">Make a referral <ArrowRight size={18}/></Link><Link className="button secondary" href="/contact">Contact us</Link></div></section>
  </main><SiteFooter/></>;
}
