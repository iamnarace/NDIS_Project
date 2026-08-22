import { ArrowRight, Car, CheckCircle2, ClipboardCheck, HeartHandshake, Home, Sparkles, Users, Shield, Calendar, Phone } from 'lucide-react';
import Link from 'next/link';
import { SiteHeader } from '../../components/SiteHeader';
import { SiteFooter } from '../../components/SiteFooter';
import { SupportFinderWidget } from '../../components/SupportFinderWidget';
import { RegionalCoverageChecker } from '../../components/RegionalCoverageChecker';
import { ResourceBrochures } from '../../components/ResourceBrochures';

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
    text: 'Dedicated one-to-one support to explore community life, join local groups, attend appointments, and take part in activities across the Clarence Coast with confidence.',
    examples: ['Attending social clubs & community groups', 'Visiting local cafes, riverfront & beaches', 'Shopping and personal errands in town', 'Sports, gym, swimming & recreational activities']
  },
  {
    icon: Car,
    title: 'Transport & Outings Support',
    category: 'Core Supports · Travel & Transport',
    text: 'Safe, flexible transport assistance connecting you to medical appointments, community outings, shopping, study, and social gatherings.',
    examples: ['Medical, hospital & allied health trips', 'Community recreation & scenic coastal outings', 'Travel to study, TAFE, work or volunteering', 'Local travel across Yamba, Maclean & Grafton']
  },
  {
    icon: Sparkles,
    title: 'Life Skills & Capacity Building',
    category: 'Capacity Building · Daily Living Skills',
    text: 'Goal-focused, practical capacity-building support designed to nurture everyday confidence, practical routines, and lasting independence.',
    examples: ['Planning weekly schedules & budgeting', 'Independent grocery shopping skills', 'Confidence navigating local transport & community', 'Cooking & household skill development']
  },
  {
    icon: HeartHandshake,
    title: 'Companionship & Active Mentoring',
    category: 'Core Supports · Individual Support',
    text: 'Consistent, dependable one-to-one support built around shared interests, positive communication, active listening, and meaningful connection.',
    examples: ['Engaging in shared hobbies, arts & crafts', 'Active listening & emotional encouragement', 'Safe, enjoyable weekend social outings', 'Goal-focused motivation & companionship']
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
          <div className="heroCopy textCenter" style={{ margin: '0 auto', maxWidth: '800px' }}>
            <span className="eyebrow">Comprehensive Disability Support</span>
            <h1>Support For Everyday Life, Built Around You</h1>
            <p className="lead">
              CarePoint delivers practical, high-quality disability support for self-managed and plan-managed NDIS participants across Yamba, Maclean, Grafton, New Italy, and Northern Rivers NSW.
            </p>
            <div className="actions" style={{ justifyContent: 'center' }}>
              <Link className="button" href="/referral">
                Make a Direct Referral <ArrowRight size={18} />
              </Link>
              <Link className="button secondary" href="/contact">
                Ask Our Team a Question
              </Link>
            </div>
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
        <section className="shell" style={{ margin: '40px auto' }}>
          <SupportFinderWidget />
        </section>

        {/* Regional Coverage Checker */}
        <section className="shell" style={{ margin: '40px auto' }}>
          <RegionalCoverageChecker />
        </section>

        {/* Resource Brochures */}
        <section className="shell" style={{ margin: '40px auto' }}>
          <ResourceBrochures />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
