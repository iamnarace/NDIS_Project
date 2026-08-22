import Image from 'next/image';
import { ArrowRight, CalendarCheck, CheckCircle2, HeartHandshake, Home, MapPin, ShieldCheck, Sparkles, Star, Users, Car, ClipboardCheck, Clock3, Phone, BookOpen, Calculator } from 'lucide-react';
import Link from 'next/link';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { SupportFinderWidget } from '../components/SupportFinderWidget';
import { SydneyCoverageChecker } from '../components/SydneyCoverageChecker';
import { ResourceBrochures } from '../components/ResourceBrochures';
import { FundingTransparencyCard } from '../components/FundingTransparencyCard';

const services = [
  { icon: Home, title: 'Daily Living Support', text: 'Respectful assistance with morning and evening routines, meal planning, and practical in-home support tailored to your lifestyle.' },
  { icon: Users, title: 'Community Participation', text: 'Support to attend community events, join social groups, access sporting activities, and explore Sydney with confidence.' },
  { icon: Car, title: 'Transport & Outings', text: 'Safe, flexible transport assistance for appointments, education, shopping, and goal-focused social outings.' },
  { icon: Sparkles, title: 'Life Skills & Independence', text: 'Capacity-building support focused on developing confidence, everyday organisation, travel training, and cooking skills.' },
  { icon: HeartHandshake, title: 'Companionship & Social Support', text: 'Consistent, one-to-one mentoring and social connection built around your genuine hobbies, choices, and interests.' },
  { icon: ClipboardCheck, title: 'Household Assistance', text: 'Practical help with everyday household tasks and home organisation aligned with your NDIS plan goals.' },
];

const trust = ['NDIS Worker Screening Clearance', 'First Aid & CPR Certified', 'Person-Centred Approach', 'Zero Hidden Fees'];

const stats = [
  { value: '100%', label: 'Person-Centred & Participant-Led' },
  { value: '6', label: 'Core & Capacity Support Areas' },
  { value: 'Greater Sydney', label: 'Local Suburb Coverage' },
  { value: '24h', label: 'Referral Response Commitment' },
];

const testimonials = [
  {
    quote: 'CarePoint matched us with a support worker who genuinely shares my brother’s interests in cooking and music. The consistency and respect have been wonderful.',
    name: 'Family Member & Nominee, Western Sydney',
    rating: 5,
  },
  {
    quote: 'As a Support Coordinator, finding reliable workers with clear communication and fast onboarding is critical. CarePoint makes the referral process smooth.',
    name: 'NDIS Support Coordinator, Inner West',
    rating: 5,
  },
  {
    quote: 'I have full choice over my schedule and outings. My support worker helps me get to my weekly gym sessions and community art classes.',
    name: 'NDIS Participant, Hills District',
    rating: 5,
  },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* ── HERO SECTION ─────────────────────────────────────────────────── */}
        <section className="hero shell" id="top">
          <div className="heroCopy">
            <span className="eyebrow">
              <ShieldCheck size={17} /> Choice · Dignity · Independence
            </span>
            <h1>
              Support that feels <em>personal.</em><br />
              Care you can count on.
            </h1>
            <p className="lead">
              CarePoint Support Services provides practical, respectful disability support shaped around your goals, routines and choices across Greater Sydney.
            </p>
            <div className="actions">
              <Link className="button" href="/referral">
                Make a Direct Referral <ArrowRight size={18} />
              </Link>
              <Link className="button secondary" href="/services">
                Explore All Services
              </Link>
            </div>
            <div className="trustRow">
              {trust.map(x => (
                <span key={x}>
                  <CheckCircle2 size={16} />
                  {x}
                </span>
              ))}
            </div>
          </div>

          <div className="heroVisual">
            <div className="heroPhoto" role="img" aria-label="Support worker and participant enjoying meaningful connection outdoors in Sydney">
              <Image
                src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800&q=80&auto=format&fit=crop"
                alt="Support worker smiling warmly with participant outdoors"
                className="heroImg"
                width={800}
                height={520}
                priority
              />
              <div className="photoOverlay">
                <span>CarePoint Support Services</span>
                <strong>Your Goals. Your Schedule. Your Choice.</strong>
              </div>
            </div>
            <div className="floatingCard">
              <Clock3 size={24} />
              <div>
                <strong>Flexible Scheduling</strong>
                <small>Built around your agreed routines and plan</small>
              </div>
            </div>
            <div className="floatingCard2">
              <ShieldCheck size={22} />
              <div>
                <strong>Verified Support</strong>
                <small>Worker screening &amp; First Aid certified</small>
              </div>
            </div>
          </div>
        </section>

        {/* ── AUDIENCE SHORTCUTS STRIP ─────────────────────────────────────── */}
        <section className="audienceStrip">
          <div className="shell">
            <span>Looking for support as a:</span>
            <Link href="/referral">NDIS Participant</Link>
            <Link href="/referral">Family / Carer / Nominee</Link>
            <Link href="/referral">Support Coordinator</Link>
            <Link href="/referral">Plan Manager</Link>
          </div>
        </section>

        {/* ── STATS BAND ───────────────────────────────────────────────────── */}
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

        {/* ── SERVICES OVERVIEW ────────────────────────────────────────────── */}
        <section className="softSection" id="services">
          <div className="shell">
            <div className="sectionHead">
              <span className="eyebrow">Our Support Services</span>
              <h2>Practical Help For Everyday Life</h2>
              <p>
                Focused disability supports, clear boundaries, and personalized assistance designed around the person — not a one-size-fits-all package.
              </p>
            </div>
            <div className="serviceGrid">
              {services.map(({ icon: Icon, title, text }) => (
                <article className="serviceCard" key={title}>
                  <span className="icon"><Icon size={26} /></span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                  <Link href="/services">
                    Explore service details <ArrowRight size={15} />
                  </Link>
                </article>
              ))}
            </div>
            <div className="centerCta">
              <Link className="button secondary" href="/services">
                View Detailed Support Catalogue <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </section>

        {/* ── INTERACTIVE SUPPORT FINDER & PRICING ESTIMATOR WIDGET ────────── */}
        <section className="shell">
          <SupportFinderWidget />
        </section>

        {/* ── ABOUT / APPROACH SPLIT ───────────────────────────────────────── */}
        <section className="split shell" id="about">
          <div className="aboutPhotoWrap">
            <Image
              src="https://images.unsplash.com/photo-1607748862156-7c548e7e98f4?w=700&q=80&auto=format&fit=crop"
              alt="Support worker assisting participant with daily routine"
              className="aboutPhoto"
              width={700}
              height={480}
            />
            <div className="aboutPhotoTag">
              <HeartHandshake size={24} />
              <div>
                <strong>Participant-First Care</strong>
                <small>Every decision guided by your goals &amp; choice</small>
              </div>
            </div>
          </div>

          <div className="aboutCopy">
            <span className="eyebrow">Why CarePoint</span>
            <h2>Small enough to know you. Professional enough to support you well.</h2>
            <p>
              CarePoint is founded on a simple principle: disability support should feel dependable, transparent, and genuinely centred on the person receiving it.
            </p>
            <ul>
              <li><CheckCircle2 size={18} /> Participant choice and control in every routine</li>
              <li><CheckCircle2 size={18} /> Respectful communication and active listening</li>
              <li><CheckCircle2 size={18} /> Reliable scheduling and clear service expectations</li>
              <li><CheckCircle2 size={18} /> Transparent NDIS price-limit aligned agreements</li>
              <li><CheckCircle2 size={18} /> Robust privacy, safety and incident awareness</li>
            </ul>
            <Link className="inlineCta" href="/about">
              Learn more about our team and values <ArrowRight size={16} />
            </Link>
            <div className="complianceNote">
              <ShieldCheck size={22} />
              <div>
                <strong>NDIS Provider Transparency</strong>
                <p>
                  CarePoint operates as an unregistered NDIS provider supporting self-managed and plan-managed participants in NSW.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── SYDNEY REGION COVERAGE CHECKER ───────────────────────────────── */}
        <section className="shell">
          <SydneyCoverageChecker />
        </section>

        {/* ── TESTIMONIALS SECTION ─────────────────────────────────────────── */}
        <section className="testimonialsSection">
          <div className="shell">
            <div className="sectionHead" style={{ textAlign: 'center', margin: '0 auto 48px' }}>
              <span className="eyebrow">Community Voices</span>
              <h2>Heard From Participants &amp; Coordinators</h2>
              <p style={{ margin: '0 auto', maxWidth: 580 }}>
                These reflect the supportive, dependable relationships CarePoint is dedicated to building across Sydney.
              </p>
            </div>
            <div className="testimonialsGrid">
              {testimonials.map(({ quote, name, rating }) => (
                <article key={name} className="testimonialCard">
                  <div className="stars">
                    {Array.from({ length: rating }).map((_, i) => (
                      <Star key={i} size={16} fill="#F59E0B" color="#F59E0B" />
                    ))}
                  </div>
                  <blockquote>&ldquo;{quote}&rdquo;</blockquote>
                  <cite>— {name}</cite>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── RESOURCE BROCHURES & GUIDES ──────────────────────────────────── */}
        <section className="shell">
          <ResourceBrochures />
        </section>

        {/* ── FUNDING TRANSPARENCY EXPLAINER ───────────────────────────────── */}
        <section className="shell">
          <FundingTransparencyCard />
        </section>

        {/* ── 4-STEP ONBOARDING PROCESS ────────────────────────────────────── */}
        <section className="processSection" id="process">
          <div className="shell">
            <div className="sectionHead light">
              <span className="eyebrow">Getting Started</span>
              <h2>From Enquiry to Support, Without the Run-Around</h2>
            </div>
            <div className="steps">
              <article>
                <b>01</b>
                <h3>Tell Us What You Need</h3>
                <p>Send a quick enquiry with the participant&apos;s goals, location, and preferred support areas.</p>
              </article>
              <article>
                <b>02</b>
                <h3>Talk It Through</h3>
                <p>We confirm fit, availability, funding management, and safety or routine requirements.</p>
              </article>
              <article>
                <b>03</b>
                <h3>Agree Clearly</h3>
                <p>Supports, schedule, pricing, travel, and responsibilities are clearly documented in a simple service agreement.</p>
              </article>
              <article>
                <b>04</b>
                <h3>Support Begins</h3>
                <p>Support starts smoothly with consistent check-ins and responsive communication.</p>
              </article>
            </div>
          </div>
        </section>

        {/* ── PROOF & TRUST BAND ───────────────────────────────────────────── */}
        <section className="shell proofBand">
          <div>
            <ShieldCheck size={28} />
            <strong>Safe &amp; Accountable</strong>
            <span>Code of Conduct · Privacy Act · Incident &amp; Feedback Systems</span>
          </div>
          <div>
            <MapPin size={28} />
            <strong>Greater Sydney Local</strong>
            <span>Western Sydney, Inner West, Hills District, North Shore &amp; South West</span>
          </div>
          <div>
            <CalendarCheck size={28} />
            <strong>Direct Referrals</strong>
            <span>Seamless intake for self-managed, plan-managed &amp; coordinators</span>
          </div>
        </section>

        {/* ── PHOTO CTA BAND ───────────────────────────────────────────────── */}
        <section className="photoCta">
          <Image
            src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1400&q=80&auto=format&fit=crop"
            alt="Group of people from diverse backgrounds smiling together outdoors"
            className="photoCtaBg"
            width={1400}
            height={440}
            aria-hidden="true"
          />
          <div className="photoCtaOverlay" />
          <div className="shell photoCtaContent">
            <h2>Ready to find the right disability support?</h2>
            <p>Whether you&apos;re a participant, family member or coordinator, start with a simple conversation.</p>
            <div className="actions">
              <Link className="button" href="/referral">
                Make a Direct Referral <ArrowRight size={18} />
              </Link>
              <Link className="button secondary" style={{ background: 'rgba(255,255,255,0.12)', color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.6)' }} href="/contact">
                <Phone size={16} /> Talk to Our Team
              </Link>
            </div>
          </div>
        </section>

        {/* ── FAQ SECTION ──────────────────────────────────────────────────── */}
        <section className="faq softSection" id="faq">
          <div className="shell">
            <div className="sectionHead">
              <span className="eyebrow">Frequently Asked Questions</span>
              <h2>Useful Information Before You Get Started</h2>
            </div>
            <div className="faqGrid">
              <details open>
                <summary>Who can use CarePoint Support Services?</summary>
                <p>CarePoint supports self-managed and plan-managed NDIS participants across Greater Sydney. Final eligibility and fit are confirmed during initial intake.</p>
              </details>
              <details>
                <summary>Are you a registered NDIS provider?</summary>
                <p>CarePoint operates as an unregistered provider under the NDIS framework. We do not claim registered status, which means we work directly with self-managed and plan-managed participants.</p>
              </details>
              <details>
                <summary>How are prices and hourly rates set?</summary>
                <p>Our rates strictly align with the official NDIS Pricing Arrangements and Price Limits. All rates, travel arrangements, and cancellation terms are documented upfront in your service agreement with zero hidden charges.</p>
              </details>
              <details>
                <summary>How quickly can support commence after referral?</summary>
                <p>We review and respond to all referrals within 1 business day. Once we confirm fit and complete a simple service agreement, support can often start within 3–7 business days.</p>
              </details>
            </div>
          </div>
        </section>

        {/* ── FINAL CONTACT CTA ────────────────────────────────────────────── */}
        <section className="contact shell" id="contact">
          <div>
            <span className="eyebrow">Ready To Connect?</span>
            <h2>Let&apos;s find out if CarePoint is the right fit.</h2>
            <p>Whether you&apos;re a participant, family member, support coordinator or plan manager, start with a simple enquiry.</p>
          </div>
          <div className="contactActions">
            <Link className="button" href="/referral">
              Make a Referral <ArrowRight size={18} />
            </Link>
            <Link className="button secondary" href="/contact">
              Contact Us Directly
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
