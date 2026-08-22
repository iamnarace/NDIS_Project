import { CheckCircle2, HeartHandshake, ShieldCheck, Users, Target, Award, Heart, Sparkles, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { SiteHeader } from '../../components/SiteHeader';
import { SiteFooter } from '../../components/SiteFooter';
import { ResourceBrochures } from '../../components/ResourceBrochures';

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
            CarePoint Support Services is built on dependable relationships, open communication, and practical disability support that respects every participant&apos;s dignity, routine, and choices.
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
            <span className="eyebrow">Our Approach</span>
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

        {/* Core Values Grid */}
        <section className="softSection">
          <div className="shell">
            <div className="sectionHead">
              <span className="eyebrow">Our Pillars</span>
              <h2>Values That Guide Every Support Hour</h2>
            </div>
            <div className="valuesGrid">
              <article>
                <Users size={32} />
                <h3>Person-Centred</h3>
                <p>
                  Support is shaped around your unique lifestyle, hobbies, and personal independence goals rather than a rigid agency template.
                </p>
              </article>
              <article>
                <ShieldCheck size={32} />
                <h3>Safe &amp; Accountable</h3>
                <p>
                  All workers hold verified NDIS Worker Screening Clearances, current First Aid &amp; CPR certifications, and adhere strictly to the NDIS Code of Conduct.
                </p>
              </article>
              <article>
                <HeartHandshake size={32} />
                <h3>Reliable Consistency</h3>
                <p>
                  We prioritize reliable worker matching and punctual scheduling so you build a trusting, comfortable routine.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* Resource Brochures */}
        <section className="shell">
          <ResourceBrochures />
        </section>

        {/* Provider Status Note */}
        <section className="shell contentBand">
          <div>
            <span className="eyebrow">Operating Transparency</span>
            <h2>Transparent While We Build</h2>
          </div>
          <div>
            <p>
              CarePoint is established under the unregistered NDIS provider framework for self-managed and plan-managed participants in NSW. We will never display an NDIS registered-provider badge or make misleading claims until full registration is formally completed.
            </p>
            <Link className="inlineCta" href="/referral">
              Discuss a referral with our team →
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
