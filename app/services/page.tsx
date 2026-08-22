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
        <section className="pageHero">
          <div className="shell">
            <span className="eyebrow">
              <Sparkles size={15} /> Support Offerings
            </span>
            <h1>Comprehensive 1-on-1 NDIS Support</h1>
            <p>
              We provide individualized disability supports tailored for self-managed and plan-managed participants across Yamba, Maclean, Grafton, Iluka, New Italy, and Northern Rivers NSW.
            </p>
          </div>
        </section>

        {/* Detailed Service Cards Grid */}
        <section className="softSection">
          <div className="shell">
            <div className="serviceDetailGrid">
              {services.map(({ icon: Icon, title, category, text, examples }) => (
                <article key={title} className="serviceDetail">
                  <span className="audiencePill">{category}</span>
                  <h2>{title}</h2>
                  <p>{text}</p>
                  <ul>
                    {examples.map(ex => (
                      <li key={ex}>
                        <CheckCircle2 size={16} color="#0D9488" />
                        <span>{ex}</span>
                      </li>
                    ))}
                  </ul>
                  <Link className="inlineCta" href="/referral">
                    Refer for this support <ArrowRight size={15} />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Support Estimator Widget */}
        <section className="shell">
          <SupportFinderWidget />
        </section>

        {/* Regional Coverage Checker */}
        <section className="shell">
          <RegionalCoverageChecker />
        </section>

        {/* Resource Brochures */}
        <section className="shell">
          <ResourceBrochures />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
