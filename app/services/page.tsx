import { ArrowRight, Car, CheckCircle2, ClipboardCheck, HeartHandshake, Home, Sparkles, Users, Shield, Calendar, Phone } from 'lucide-react';
import Link from 'next/link';
import { SiteHeader } from '../../components/SiteHeader';
import { SiteFooter } from '../../components/SiteFooter';
import { SupportFinderWidget } from '../../components/SupportFinderWidget';
import { SydneyCoverageChecker } from '../../components/SydneyCoverageChecker';

const services = [
  {
    icon: Home,
    title: 'Daily Living Support',
    category: 'Core Supports · Daily Activities',
    text: 'Respectful, practical assistance with everyday routines at home, shaped around your personal preferences, independence goals, and agreed support plan.',
    examples: ['Morning & evening routine assistance', 'Healthy meal preparation & cooking together', 'Personal care with dignity and respect', 'General in-home organisation & support']
  },
  {
    icon: Users,
    title: 'Social & Community Participation',
    category: 'Core Supports · Social & Civic Access',
    text: 'Dedicated one-to-one support to explore community life, join local groups, attend appointments, and take part in activities with confidence.',
    examples: ['Attending social clubs & community groups', 'Visiting local cafes, parks & libraries', 'Shopping and personal errands', 'Sports, gym, and recreational activities']
  },
  {
    icon: Car,
    title: 'Transport & Outings Support',
    category: 'Core Supports · Travel & Transport',
    text: 'Safe, flexible transport assistance connected to your agreed disability supports, education, medical appointments, and social commitments.',
    examples: ['Medical and allied health appointments', 'Community recreation and outings', 'Travel to study, work or volunteering', 'Agreed local travel across Sydney']
  },
  {
    icon: Sparkles,
    title: 'Life Skills & Capacity Building',
    category: 'Capacity Building · Daily Living Skills',
    text: 'Goal-focused, practical capacity-building support designed to nurture everyday confidence, practical routines, and lasting independence.',
    examples: ['Planning weekly schedules & budgeting', 'Independent grocery shopping skills', 'Using Sydney public transport with confidence', 'Cooking & household skill development']
  },
  {
    icon: HeartHandshake,
    title: 'Companionship & Active Mentoring',
    category: 'Core Supports · Individual Support',
    text: 'Consistent, dependable one-to-one support built around shared interests, positive communication, active listening, and meaningful connection.',
    examples: ['Engaging in shared hobbies & crafts', 'Active listening & emotional encouragement', 'Safe, enjoyable weekend social outings', 'Goal-focused motivation & companionship']
  },
  {
    icon: ClipboardCheck,
    title: 'Household Practical Assistance',
    category: 'Core Supports · Household Tasks',
    text: 'Everyday domestic support to help keep your living environment comfortable, safe, and organized where appropriate to your NDIS plan.',
    examples: ['Light household chores & tidying', 'Laundry, linen & home organisation', 'Pantry organisation & shopping support', 'Practical assistance around the home']
  },
];

export default function ServicesPage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Page Hero */}
        <section className="pageHero shell">
          <span className="eyebrow">Comprehensive Disability Support</span>
          <h1>Support For Everyday Life, Built Around You</h1>
          <p>
            CarePoint delivers practical, high-quality disability support for self-managed and plan-managed NDIS participants across Greater Sydney. Every service is discussed, agreed, and tailored to your personal goals.
          </p>
          <div className="actions">
            <Link className="button" href="/referral">
              Make a Direct Referral <ArrowRight size={18} />
            </Link>
            <Link className="button secondary" href="/contact">
              Ask Our Team a Question
            </Link>
          </div>
        </section>

        {/* Detailed Service Grid */}
        <section className="softSection">
          <div className="shell serviceDetailGrid">
            {services.map(({ icon: Icon, title, category, text, examples }) => (
              <article className="serviceDetail" key={title}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <span className="icon"><Icon size={26} /></span>
                  <span className="audiencePill">{category}</span>
                </div>
                <h2>{title}</h2>
                <p>{text}</p>
                <ul>
                  {examples.map(x => (
                    <li key={x}><CheckCircle2 size={16} color="#0D9488" /> {x}</li>
                  ))}
                </ul>
                <Link className="inlineCta" href="/referral">
                  Enquire about {title.toLowerCase()} <ArrowRight size={15} />
                </Link>
              </article>
            ))}
          </div>
        </section>

        {/* Interactive Pricing Estimator */}
        <section className="shell">
          <SupportFinderWidget />
        </section>

        {/* Coverage Checker */}
        <section className="shell">
          <SydneyCoverageChecker />
        </section>

        {/* Clinical & High-Risk Transparency Note */}
        <section className="shell contentBand">
          <div>
            <span className="eyebrow">Scope &amp; Safety Commitment</span>
            <h2>We Only Promise What We Safely Deliver</h2>
          </div>
          <div>
            <p>
              CarePoint will always confirm the participant&apos;s support requirements, our worker qualifications, funding arrangement, and risks before accepting a referral.
            </p>
            <p>
              Supports requiring specialist medical nursing, complex clinical bowel/wound care, restrictive-practice behaviour management, or Specialist Disability Accommodation (SDA) are not offered unless properly accredited.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
