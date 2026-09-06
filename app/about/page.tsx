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
      <main className="aboutMainWrapper">
        {/* Page Hero */}
        <section className="aboutHeroSection">
          <div className="shell">
            <div className="aboutHeroCenter">
              <span className="greenCategoryTag">
                <Sparkles size={14} /> ABOUT OPUS CARE
              </span>
              <h1 className="sectionSerifTitle">A Dedicated Disability Support Provider With Professional Standards</h1>
              <p className="sectionSubDesc">
                Opus Care Support Services is built on dependable relationships, open communication, and practical disability support that respects every participant&apos;s dignity, routine, and choices across Yamba, Grafton, New Italy, and Northern Rivers NSW.
              </p>
            </div>
          </div>
        </section>

        {/* Split Philosophy Controlled Card Panes */}
        <section className="philosophySectionWrap">
          <div className="shell philosophySplitPanes">
            {/* Left: Photo Card Pane */}
            <div className="controlledCardPane aboutPhotoCardPane">
              <div className="aboutPhotoInner">
                <Image
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80&auto=format&fit=crop"
                  alt="Opus Care support team member engaged in respectful consultation"
                  className="aboutPhotoImg"
                  width={700}
                  height={480}
                />
                <div className="aboutPhotoBadgeOverlay">
                  <Heart size={20} />
                  <div>
                    <strong>Built on Human Respect</strong>
                    <small>Every participant&apos;s voice comes first</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Philosophy Content Card Pane */}
            <div className="controlledCardPane aboutCopyCardPane">
              <span className="guideSubBadge">OUR PHILOSOPHY</span>
              <h2>Listen First. Agree Clearly. Support Consistently.</h2>
              <p className="aboutIntro">
                We want participants, families, and coordinators to always know who they are dealing with, what has been agreed, what it costs, and what happens if circumstances change.
              </p>

              <ul className="aboutCheckList">
                <li>
                  <CheckCircle2 size={18} className="aboutCheckIcon" />
                  <span>Participant choice and control in everyday decisions</span>
                </li>
                <li>
                  <CheckCircle2 size={18} className="aboutCheckIcon" />
                  <span>Respect for culture, identity, privacy and communication needs</span>
                </li>
                <li>
                  <CheckCircle2 size={18} className="aboutCheckIcon" />
                  <span>Clear written service agreements and transparent billing</span>
                </li>
                <li>
                  <CheckCircle2 size={18} className="aboutCheckIcon" />
                  <span>Straightforward feedback and complaints process</span>
                </li>
                <li>
                  <CheckCircle2 size={18} className="aboutCheckIcon" />
                  <span>Active risk management and continuous improvement</span>
                </li>
              </ul>

              <div className="aboutCtaRow">
                <Link className="heroPillBtn filled" href="/referral">
                  <span>Start a Referral</span>
                  <ArrowRight size={16} />
                </Link>
                <Link className="heroPillBtn outline" href="/contact">
                  <span>Contact Our Team</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 4-Step Support Approach Infographic */}
        <OurApproachSection />

        {/* Core Values Section */}
        <CoreValuesSection />

        {/* Resource Brochures */}
        <section className="brochuresSectionWrap">
          <div className="shell">
            <ResourceBrochures />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
