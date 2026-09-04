import { CheckCircle2, HeartHandshake, ShieldCheck, Users, Target, Award, Heart, Sparkles, ArrowRight, MapPin, Check } from 'lucide-react';
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
        <section className="pageHero">
          <div className="shell">
            <span className="eyebrow">
              <Sparkles size={15} /> About Opus Care
            </span>
            <h1>A Dedicated Disability Support Provider With Professional Standards</h1>
            <p>
              Opus Care Support Services is built on dependable relationships, open communication, and practical disability support that respects every participant&apos;s dignity, routine, and choices across Yamba, Grafton, New Italy, and Northern Rivers NSW.
            </p>
          </div>
        </section>

        {/* Split Story Section */}
        <section className="softSection">
          <div className="shell">
            <div className="split aboutPageSplit">
              <div className="aboutPhotoWrap">
                <Image
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80&auto=format&fit=crop"
                  alt="Opus Care support team member engaged in respectful consultation"
                  className="aboutPhoto"
                  width={700}
                  height={480}
                />
                <div className="aboutPhotoTag">
                  <Heart size={24} color="#0D9488" />
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
                <ul className="aboutCheckList">
                  <li><CheckCircle2 size={18} color="#0D9488" /> <span>Participant choice and control in everyday decisions</span></li>
                  <li><CheckCircle2 size={18} color="#0D9488" /> <span>Respect for culture, identity, privacy and communication needs</span></li>
                  <li><CheckCircle2 size={18} color="#0D9488" /> <span>Clear written service agreements and transparent billing</span></li>
                  <li><CheckCircle2 size={18} color="#0D9488" /> <span>Straightforward feedback and complaints process</span></li>
                  <li><CheckCircle2 size={18} color="#0D9488" /> <span>Active risk management and continuous improvement</span></li>
                </ul>
                <div className="actions" style={{ marginTop: '28px' }}>
                  <Link className="button" href="/referral">
                    Start a Referral <ArrowRight size={18} />
                  </Link>
                  <Link className="button secondary" href="/contact">
                    Contact Our Team
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4-Step Support Approach Infographic */}
        <OurApproachSection />

        {/* Core Values Section */}
        <CoreValuesSection />

        {/* Resource Brochures */}
        <section className="shell">
          <ResourceBrochures />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
