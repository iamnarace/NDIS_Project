import Image from 'next/image';
import { ArrowRight, CalendarCheck, CheckCircle2, HeartHandshake, Home, MapPin, ShieldCheck, Sparkles, Star, Users, Car, ClipboardCheck, Clock3, Phone } from 'lucide-react';
import Link from 'next/link';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';

const services = [
  { icon: Home, title: 'Daily Living Support', text: 'Practical, respectful assistance with everyday routines so support fits comfortably into daily life.' },
  { icon: Users, title: 'Community Participation', text: 'Support to attend appointments, activities, shopping, community events and meaningful outings.' },
  { icon: Car, title: 'Transport Support', text: 'Flexible transport assistance connected to agreed disability supports and participant goals.' },
  { icon: Sparkles, title: 'Life Skills & Independence', text: 'Capacity-building support focused on routines, confidence, organisation and everyday independence.' },
  { icon: HeartHandshake, title: 'Companionship & Social Support', text: 'One-to-one support built around choice, interests, preferred routines and social connection.' },
  { icon: ClipboardCheck, title: 'Household & Practical Assistance', text: "Everyday household support where appropriate to the participant's plan and agreed goals." },
];

const trust = ['NDIS Worker Screening Clearance', 'First Aid & CPR', 'Person-centred approach', 'Clear service agreements'];

const stats = [
  { value: '6', label: 'Support services offered' },
  { value: '100%', label: 'Person-centred approach' },
  { value: '24/7', label: 'Contact availability' },
  { value: 'NSW', label: 'Based in Greater Sydney' },
];

const testimonials = [
  {
    quote: 'Finally a support worker who actually listens. They work around my schedule, not theirs.',
    name: 'NDIS Participant, Western Sydney',
    rating: 5,
  },
  {
    quote: 'The referral process was simple and the communication was clear from day one.',
    name: 'Support Coordinator',
    rating: 5,
  },
  {
    quote: 'My son feels comfortable and respected. That means everything to our family.',
    name: 'Family / Nominee, Sydney',
    rating: 5,
  },
];

export default function HomePage() {
  return <><SiteHeader/><main>

    {/* ── HERO ───────────────────────────────────────────────────────── */}
    <section className="hero shell" id="top">
      <div className="heroCopy">
        <span className="eyebrow"><ShieldCheck size={17}/> Choice · dignity · independence</span>
        <h1>Support that feels <em>personal.</em><br/>Care you can count on.</h1>
        <p className="lead">CarePoint Support Services provides practical, respectful disability support designed around each participant&apos;s goals, routines and choices across Greater Sydney.</p>
        <div className="actions">
          <Link className="button" href="/referral">Start a referral <ArrowRight size={18}/></Link>
          <Link className="button secondary" href="/services">Explore services</Link>
        </div>
        <div className="trustRow">{trust.map(x => <span key={x}><CheckCircle2 size={16}/>{x}</span>)}</div>
      </div>
      <div className="heroVisual">
        {/* Real photo from Unsplash – disability support / community care */}
        <div className="photo heroPhoto" role="img" aria-label="Support worker and participant enjoying time together outdoors">
          <Image
            src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800&q=80&auto=format&fit=crop"
            alt="Support worker smiling with participant outdoors"
            className="heroImg"
            width={800}
            height={600}
            priority
          />
          <div className="photoOverlay">
            <span>CarePoint Support Services</span>
            <strong>Your goals. Your choices. Your support.</strong>
          </div>
        </div>
        <div className="floatingCard">
          <Clock3 size={22}/>
          <div><strong>Flexible support</strong><small>Built around your schedule and agreed supports</small></div>
        </div>
        <div className="floatingCard floatingCard2">
          <CheckCircle2 size={22}/>
          <div><strong>NDIS Screening</strong><small>Worker clearance verified</small></div>
        </div>
      </div>
    </section>

    {/* ── AUDIENCE STRIP ─────────────────────────────────────────────── */}
    <section className="audienceStrip">
      <div className="shell">
        <span>Looking for support as a</span>
        <Link href="/referral">Participant</Link>
        <Link href="/referral">Family / nominee</Link>
        <Link href="/referral">Support coordinator</Link>
        <Link href="/referral">Plan manager</Link>
      </div>
    </section>

    {/* ── STATS BAND ─────────────────────────────────────────────────── */}
    <section className="statsBand">
      <div className="shell statsGrid">
        {stats.map(({ value, label }) => (
          <div key={label} className="statItem">
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </section>

    {/* ── SERVICES ───────────────────────────────────────────────────── */}
    <section className="softSection" id="services">
      <div className="shell">
        <div className="sectionHead">
          <span className="eyebrow">Our support</span>
          <h2>Practical help for everyday life</h2>
          <p>Focused services, clear boundaries and support shaped around the person — not a one-size-fits-all package.</p>
        </div>
        <div className="serviceGrid">
          {services.map(({icon: Icon, title, text}) => (
            <article className="serviceCard" key={title}>
              <span className="icon"><Icon/></span>
              <h3>{title}</h3>
              <p>{text}</p>
              <Link href="/services">Learn more <ArrowRight size={15}/></Link>
            </article>
          ))}
        </div>
        <div className="centerCta"><Link className="button secondary" href="/services">View all service details <ArrowRight size={17}/></Link></div>
      </div>
    </section>

    {/* ── ABOUT SPLIT ────────────────────────────────────────────────── */}
    <section className="split shell" id="about">
      <div className="aboutPhotoWrap">
        <Image
          src="https://images.unsplash.com/photo-1607748862156-7c548e7e98f4?w=700&q=80&auto=format&fit=crop"
          alt="Support worker helping participant with daily activity"
          className="aboutPhoto"
          width={700}
          height={500}
        />
        <div className="aboutPhotoTag">
          <HeartHandshake size={20}/>
          <div>
            <strong>Participant-first</strong>
            <small>Your goals drive every decision</small>
          </div>
        </div>
      </div>
      <div className="aboutCopy">
        <span className="eyebrow">Why CarePoint</span>
        <h2>Small enough to know you. Professional enough to support you well.</h2>
        <p>CarePoint is being built around a simple idea: disability support should feel dependable, clear and genuinely centred on the person receiving it.</p>
        <ul>
          <li><CheckCircle2/>Participant choice and control</li>
          <li><CheckCircle2/>Respectful communication</li>
          <li><CheckCircle2/>Reliable scheduling and clear expectations</li>
          <li><CheckCircle2/>Transparent service agreements and pricing</li>
          <li><CheckCircle2/>Safety, privacy and continuous improvement</li>
        </ul>
        <Link className="inlineCta" href="/about">More about our approach →</Link>
        <div className="complianceNote">
          <ShieldCheck size={20}/>
          <p>CarePoint is currently an unregistered provider. We support self-managed and plan-managed NDIS participants only.</p>
        </div>
      </div>
    </section>

    {/* ── TESTIMONIALS ───────────────────────────────────────────────── */}
    <section className="testimonialsSection">
      <div className="shell">
        <div className="sectionHead" style={{textAlign:'center',margin:'0 auto 48px'}}>
          <span className="eyebrow">What people say</span>
          <h2>Heard from participants & coordinators</h2>
          <p style={{margin:'0 auto',maxWidth:560}}>These reflect the kind of experience CarePoint is committed to building. Verified reviews will be added at launch.</p>
        </div>
        <div className="testimonialsGrid">
          {testimonials.map(({ quote, name, rating }) => (
            <article key={name} className="testimonialCard">
              <div className="stars">{Array.from({length: rating}).map((_, i) => <Star key={i} size={16} fill="#f59e0b" color="#f59e0b"/>)}</div>
              <blockquote>&ldquo;{quote}&rdquo;</blockquote>
              <cite>— {name}</cite>
            </article>
          ))}
        </div>
      </div>
    </section>

    {/* ── PROCESS ────────────────────────────────────────────────────── */}
    <section className="processSection" id="process">
      <div className="shell">
        <div className="sectionHead light">
          <span className="eyebrow">Getting started</span>
          <h2>From enquiry to support, without the run-around.</h2>
        </div>
        <div className="steps">
          <article><b>01</b><h3>Tell us what you need</h3><p>Send a short enquiry with the participant&apos;s general goals, location and preferred support.</p></article>
          <article><b>02</b><h3>Talk it through</h3><p>We confirm fit, availability, funding management and important support or safety requirements.</p></article>
          <article><b>03</b><h3>Agree clearly</h3><p>Supports, schedule, pricing, travel, cancellations and responsibilities are documented before starting.</p></article>
          <article><b>04</b><h3>Support begins</h3><p>Support starts with clear communication, records and regular check-ins as needs evolve.</p></article>
        </div>
      </div>
    </section>

    {/* ── PROOF BAND ─────────────────────────────────────────────────── */}
    <section className="shell proofBand">
      <div><ShieldCheck/><strong>Safe, accountable foundations</strong><span>Code of Conduct · privacy · feedback · incidents · risk awareness</span></div>
      <div><MapPin/><strong>Local support</strong><span>Greater Sydney service area being finalised</span></div>
      <div><CalendarCheck/><strong>Simple referrals</strong><span>Participant and professional referral pathway</span></div>
    </section>

    {/* ── PHOTO CTA BAND ─────────────────────────────────────────────── */}
    <section className="photoCta">
      <Image
        src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1400&q=80&auto=format&fit=crop"
        alt=""
        className="photoCtaBg"
        width={1400}
        height={600}
        aria-hidden="true"
      />
      <div className="photoCtaOverlay"/>
      <div className="shell photoCtaContent">
        <h2>Ready to find the right support?</h2>
        <p>Whether you&apos;re a participant, family member or professional, start with a simple conversation.</p>
        <div className="actions">
          <Link className="button" href="/referral">Make a referral <ArrowRight size={18}/></Link>
          <Link className="button" style={{background:'rgba(255,255,255,.15)',border:'1.5px solid rgba(255,255,255,.5)'}} href="/contact">
            <Phone size={16}/> Contact us
          </Link>
        </div>
      </div>
    </section>

    {/* ── FAQ ────────────────────────────────────────────────────────── */}
    <section className="faq softSection" id="faq"><div className="shell">
      <div className="sectionHead"><span className="eyebrow">Frequently asked questions</span><h2>Useful information before you get started</h2></div>
      <div className="faqGrid">
        <details open><summary>Who can use CarePoint?</summary><p>The current unregistered-provider model is designed for self-managed and plan-managed NDIS participants. Final eligibility is confirmed during intake.</p></details>
        <details><summary>Are you a registered NDIS provider?</summary><p>Not at this stage. CarePoint will not claim registered-provider status unless registration is formally approved.</p></details>
        <details><summary>How are prices set?</summary><p>Prices are agreed before support begins and documented in the service agreement. Final rates will be aligned with the current NDIS pricing framework and relevant support items.</p></details>
        <details><summary>Do you use service agreements?</summary><p>Yes. CarePoint intends to use written service agreements so supports, pricing, travel, cancellations, payment and responsibilities are clear.</p></details>
      </div>
    </div></section>

    {/* ── FINAL CTA ──────────────────────────────────────────────────── */}
    <section className="contact shell" id="contact">
      <div>
        <span className="eyebrow">Ready to talk?</span>
        <h2>Let&apos;s find out if CarePoint is the right fit.</h2>
        <p>Whether you&apos;re a participant, family member, support coordinator or plan manager, start with a simple enquiry.</p>
      </div>
      <div className="contactActions">
        <Link className="button" href="/referral">Make a referral <ArrowRight size={18}/></Link>
        <Link className="button secondary" href="/contact">Contact us</Link>
      </div>
    </section>

  </main><SiteFooter/></>;
}
