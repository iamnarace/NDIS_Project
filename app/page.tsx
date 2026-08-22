import { ArrowRight, CalendarCheck, CheckCircle2, HeartHandshake, Home, Mail, MapPin, Phone, ShieldCheck, Sparkles, Users, Car, ClipboardCheck, MessageCircle, Clock3 } from 'lucide-react';

const services = [
  { icon: Home, title: 'Daily Living Support', text: 'Practical, respectful assistance with everyday routines so participants can feel confident and supported at home.' },
  { icon: Users, title: 'Community Participation', text: 'Support to attend appointments, social activities, shopping, community events and meaningful outings.' },
  { icon: Car, title: 'Transport Support', text: 'Flexible transport assistance for approved activities and appointments, subject to your plan and service agreement.' },
  { icon: Sparkles, title: 'Life Skills & Independence', text: 'Capacity-building support focused on routines, confidence, organisation and everyday independence.' },
  { icon: HeartHandshake, title: 'Companionship & Social Support', text: 'Reliable one-to-one support built around participant choice, interests, goals and preferred routines.' },
  { icon: ClipboardCheck, title: 'Household & Practical Assistance', text: 'Everyday support with practical household activities where these supports are appropriate to the participant’s plan.' },
];

const trust = ['NDIS Worker Screening Clearance', 'First Aid & CPR', 'Person-centred support', 'Clear service agreements'];

export default function HomePage() {
  return (
    <main>
      <div className="notice">Serving self-managed and plan-managed NDIS participants · Sydney & NSW</div>
      <header className="nav shell">
        <a href="#top" className="brand" aria-label="CarePoint Support Services home">
          <span className="logoMark"><span>C</span><span>P</span></span>
          <span><strong>CarePoint</strong><small>Support Services</small></span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#services">Services</a><a href="#about">About</a><a href="#process">How it works</a><a href="#faq">FAQ</a><a href="#contact">Contact</a>
        </nav>
        <a className="button small" href="#referral">Make a referral</a>
      </header>

      <section className="hero shell" id="top">
        <div className="heroCopy">
          <span className="eyebrow"><ShieldCheck size={17}/> Support built around choice, dignity and independence</span>
          <h1>Support that feels <em>personal.</em><br/>Care you can count on.</h1>
          <p className="lead">CarePoint Support Services provides practical, respectful disability support designed around each participant’s goals, routines and choices.</p>
          <div className="actions"><a className="button" href="#referral">Start a referral <ArrowRight size={18}/></a><a className="button secondary" href="#contact">Talk to us</a></div>
          <div className="trustRow">{trust.map(x => <span key={x}><CheckCircle2 size={16}/>{x}</span>)}</div>
        </div>
        <div className="heroVisual">
          <div className="photo placeholderPhoto" role="img" aria-label="Placeholder for an authentic CarePoint participant support photo">
            <div className="photoOverlay"><span>CarePoint Support Services</span><strong>Your goals. Your choices. Your support.</strong></div>
          </div>
          <div className="floatingCard"><Clock3/><div><strong>Flexible support</strong><small>Built around your schedule and agreed supports</small></div></div>
        </div>
      </section>

      <section className="softSection" id="services"><div className="shell">
        <div className="sectionHead"><span className="eyebrow">Our support</span><h2>Practical help for everyday life</h2><p>Our initial service menu is intentionally focused on common lower-risk supports. Final services and NDIS support items will be confirmed before launch.</p></div>
        <div className="serviceGrid">{services.map(({icon: Icon,title,text}) => <article className="serviceCard" key={title}><span className="icon"><Icon/></span><h3>{title}</h3><p>{text}</p><a href="#contact">Ask about this service <ArrowRight size={15}/></a></article>)}</div>
      </div></section>

      <section className="split shell" id="about">
        <div className="aboutVisual"><div className="quoteCard"><MessageCircle/><p>“Good support starts by listening.”</p><span>CarePoint principle</span></div></div>
        <div className="aboutCopy"><span className="eyebrow">Why CarePoint</span><h2>Small enough to know you. Professional enough to support you well.</h2><p>We’re building CarePoint around a simple idea: disability support should feel dependable, clear and genuinely centred on the person receiving it.</p>
          <ul><li><CheckCircle2/>Participant choice and control</li><li><CheckCircle2/>Respectful communication</li><li><CheckCircle2/>Reliable scheduling and clear expectations</li><li><CheckCircle2/>Transparent service agreements and pricing</li><li><CheckCircle2/>Safety, privacy and continuous improvement</li></ul>
          <div className="complianceNote"><ShieldCheck/><div><strong>NDIS Code of Conduct</strong><p>CarePoint’s operating policies are being built to align with obligations that apply to NDIS providers, including unregistered providers.</p></div></div>
        </div>
      </section>

      <section className="processSection" id="process"><div className="shell"><div className="sectionHead light"><span className="eyebrow">Getting started</span><h2>A clear path from enquiry to support</h2></div><div className="steps">
        <article><b>01</b><h3>Tell us what you need</h3><p>Send an enquiry or referral with the participant’s goals, preferred supports, location and availability.</p></article>
        <article><b>02</b><h3>We talk it through</h3><p>We confirm fit, availability, funding management and any important support or safety requirements.</p></article>
        <article><b>03</b><h3>Agree the support</h3><p>We provide a written service agreement covering supports, schedule, pricing, travel, cancellations and responsibilities.</p></article>
        <article><b>04</b><h3>Support begins</h3><p>Once agreed, support starts with clear communication, records and regular check-ins.</p></article>
      </div></div></section>

      <section className="referral shell" id="referral">
        <div className="referralCopy"><span className="eyebrow">Participant & professional referrals</span><h2>Looking for support?</h2><p>This demo referral form shows the workflow we’ll connect to secure email/storage once your final business systems are chosen.</p><div className="contactMini"><span><Phone/> 1300 CAREPOINT <small>Placeholder</small></span><span><Mail/> support@carepointsupport.com.au <small>Placeholder</small></span><span><MapPin/> Greater Sydney, NSW <small>Service area to confirm</small></span></div></div>
        <form className="formCard"><div className="two"><label>Your name<input name="name" placeholder="Full name"/></label><label>You are<select name="role"><option>Participant</option><option>Family / nominee</option><option>Support coordinator</option><option>Plan manager</option><option>Other professional</option></select></label></div><div className="two"><label>Phone<input name="phone" placeholder="04xx xxx xxx"/></label><label>Email<input name="email" type="email" placeholder="name@example.com"/></label></div><label>Support you’re looking for<select name="service"><option>Select a service</option>{services.map(s=><option key={s.title}>{s.title}</option>)}</select></label><label>Tell us a little more<textarea name="message" rows={5} placeholder="Preferred days, suburb, goals or anything useful for our first conversation..."/></label><label className="consent"><input type="checkbox"/> I understand this demo form does not yet transmit or store information.</label><button className="button full" type="button">Send referral <ArrowRight size={18}/></button></form>
      </section>

      <section className="faq softSection" id="faq"><div className="shell"><div className="sectionHead"><span className="eyebrow">Frequently asked questions</span><h2>Useful information before you get started</h2></div><div className="faqGrid">
        <details open><summary>Who can use CarePoint?</summary><p>For the initial unregistered-provider model, the website is designed for self-managed and plan-managed NDIS participants. Final eligibility wording will be confirmed before launch.</p></details>
        <details><summary>Are you a registered NDIS provider?</summary><p>Not at this stage. The website will not claim registered-provider status unless registration is formally approved. CarePoint is currently being structured as an unregistered provider.</p></details>
        <details><summary>How are prices set?</summary><p>Prices will be agreed before support begins and documented in the service agreement. Final rates will be configured against the current NDIS pricing schedule and applicable support items.</p></details>
        <details><summary>Do I need a service agreement?</summary><p>CarePoint intends to use written service agreements for clarity around supports, pricing, travel, cancellations, payment and responsibilities.</p></details>
      </div></div></section>

      <section className="contact shell" id="contact"><div><span className="eyebrow">Contact</span><h2>Let’s talk about the right support.</h2><p>Whether you’re a participant, family member, support coordinator or plan manager, we can start with a simple conversation.</p></div><div className="contactActions"><a className="button" href="mailto:support@carepointsupport.com.au"><Mail size={18}/> Email CarePoint</a><a className="button secondary" href="#referral"><CalendarCheck size={18}/> Make a referral</a></div></section>

      <footer><div className="shell footerGrid"><div><a className="brand footerBrand" href="#top"><span className="logoMark"><span>C</span><span>P</span></span><span><strong>CarePoint</strong><small>Support Services</small></span></a><p>Person-centred disability support across Sydney and NSW.</p><small className="muted">Demo business details are placeholders pending final ABN, domain, insurance, service scope and registration decisions.</small></div><div><strong>Explore</strong><a href="#services">Services</a><a href="#about">About</a><a href="#referral">Make a referral</a><a href="#faq">FAQ</a></div><div><strong>Policies</strong><a href="/privacy">Privacy</a><a href="/complaints">Complaints & feedback</a><a href="/incident-management">Incident management</a><a href="/code-of-conduct">Code of conduct</a></div><div><strong>Contact</strong><span>support@carepointsupport.com.au</span><span>Greater Sydney, NSW</span><span>Mon–Fri · hours TBC</span></div></div><div className="shell footerBottom"><span>© 2026 CarePoint Support Services</span><span>CarePoint Support Services is not affiliated with the NDIA. NDIS is a scheme of the Australian Government.</span></div></footer>
    </main>
  );
}
