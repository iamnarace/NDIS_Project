import { CheckCircle2, HeartHandshake, ShieldCheck, Users, Target, Award, Heart, Sparkles, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { SiteHeader } from '../../components/SiteHeader';
import { SiteFooter } from '../../components/SiteFooter';
import { ResourceBrochures } from '../../components/ResourceBrochures';
import { OurApproachSection } from '../../components/OurApproachSection';
import { CoreValuesSection } from '../../components/CoreValuesSection';

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Page Hero */}
        <section className="pageHero shell">
          <span className="eyebrow">About CarePoint</span>
          <h1>A Smaller Disability Support Provider With Professional Standards</h1>
          <p>
            CarePoint Support Services is built on dependable relationships, open communication, and practical disability support that respects every participant&apos;s dignity, routine, and choices across Greater Sydney.
          </p>
        </section>

        {/* Split Story Section */}
        <section className="split shell aboutPageSplit">
          <div className="aboutPhotoWrap">
            <Image
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80&auto=format&fit=crop"
              alt="CarePoint support team member engaged in respectful consultation"
              className="aboutPhoto"
              width={700}
              height={480}
            />
            <div className="aboutPhotoTag">
              <Heart size={24} />
              <div>
                <strong>Built on Human Respect</strong>
                <small>Every participant’s voice comes first</small>
              </div>
            </div>
          </div>

          <div className="aboutCopy">
            <span className="eyebrow">Our Philosophy</span>
            <h2>Listen First. Agree Clearly. Support Consistently.</h2>
            <p>
              We want participants, families, and coordinators to always know who they are dealing with, what has been agreed, what it costs, and what happens if circumstances change.
            </p>
            <ul>
              <li><CheckCircle2 size={18} /> Participant choice and control in everyday decisions</li>
              <li><CheckCircle2 size={18} /> Respect for culture, identity, privacy and communication needs</li>
              <li><CheckCircle2 size={18} /> Clear written service agreements and transparent billing</li>
              <li><CheckCircle2 size={18} /> Straightforward feedback and complaints process</li>
              <li><CheckCircle2 size={18} /> Active risk management and continuous improvement</li>
            </ul>
            <div className="actions">
              <Link className="button" href="/referral">
                Start a Conversation <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>

        {/* 4-Step Support Approach Infographic */}
        <OurApproachSection />

        {/* Core Values Grid */}
        <CoreValuesSection />

        {/* Resource Brochures */}
        <section className="shell">
          <ResourceBrochures />
        </section>

        {/* Provider Status Note */}
        <section className="shell aboutPageNote">
          <div className="complianceNote">
            <ShieldCheck size={24} />
            <div>
              <strong>NDIS Service Scope &amp; Integrity</strong>
              <p>
                CarePoint operates as an unregistered NDIS provider in New South Wales supporting self-managed and plan-managed participants. We adhere to the NDIS Quality and Safeguards Commission Code of Conduct, verify all workers via NDIS Worker Screening Checks, and prioritize transparency at every step.
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
