'use client';

import React from 'react';
import Image from 'next/image';
import { Ear, FileHeart, HeartHandshake, Award, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Step {
  number: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
}

const STEPS: Step[] = [
  {
    number: '01',
    title: 'Listen',
    subtitle: 'Understanding What Matters',
    description: 'We sit down with you and your support circle to listen to your unique goals, daily routines, preferences, and personal vision.',
    icon: <Ear size={24} />,
  },
  {
    number: '02',
    title: 'Plan',
    subtitle: 'Tailored Support Matching',
    description: 'Together we design a personalised support schedule aligned with your NDIS budget (Core & Capacity Building) and match you with compatible workers.',
    icon: <FileHeart size={24} />,
  },
  {
    number: '03',
    title: 'Support',
    subtitle: 'Reliable, Caring Delivery',
    description: 'Consistent, punctual, respectful support workers arrive on time to assist you at home, in the community, with transport, or building skills.',
    icon: <HeartHandshake size={24} />,
  },
  {
    number: '04',
    title: 'Achieve',
    subtitle: 'Independence & Confidence',
    description: 'We continuously celebrate your milestones, track progress against your NDIS goals, and adapt supports as your independence grows.',
    icon: <Award size={24} />,
  },
];

export function OurApproachSection() {
  return (
    <section className="approachControlledSection">
      <div className="shell">
        <div className="sectionHead textCenter">
          <span className="greenCategoryTag">
            <Sparkles size={14} /> PERSON-CENTRED · DIGNIFIED · EMPOWERING
          </span>
          <h2 className="sectionSerifTitle">Our 4-Step Support Approach</h2>
          <p className="sectionSubDesc">
            How we partner with NDIS participants, families, and support coordinators across Clarence Coast &amp; Northern Rivers NSW to deliver care you can genuinely rely on.
          </p>
        </div>

        {/* 4 Uniform Step Cards Grid */}
        <div className="approachStepsGrid4">
          {STEPS.map((step) => (
            <div key={step.number} className="controlledCardPane approachStepCard">
              <div className="stepTopRow">
                <span className="stepNumberBadge">{step.number}</span>
                <div className="stepIconCircle">
                  {step.icon}
                </div>
              </div>

              <span className="stepSubtitleTag">{step.subtitle}</span>
              <h3 className="stepTitle">{step.title}</h3>
              <p className="stepDesc">{step.description}</p>
            </div>
          ))}
        </div>

        {/* Bottom Banner Strip */}
        <div className="controlledCardPane approachBannerStrip">
          <div className="approachBannerLeft">
            <div className="bannerMarkIconWrap">
              <Image
                src="/brand/Opus_Care_Mark.png"
                alt="Opus Care"
                width={52}
                height={52}
                className="bannerMarkImg"
              />
            </div>
            <div>
              <strong>Supporting Participants Across Regional NSW</strong>
              <p>Self-Managed &amp; Plan-Managed Participants · Immediate Northern Rivers Capacity</p>
            </div>
          </div>
          <div className="approachBannerRight">
            <Link href="/referral" className="heroPillBtn filled">
              <span>Start a Direct Referral</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
