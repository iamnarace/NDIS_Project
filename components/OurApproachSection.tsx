'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Ear, FileHeart, HeartHandshake, Award, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Step {
  number: string;
  title: string;
  subtitle: string;
  description: string;
  badgeColor: string;
  iconBg: string;
  iconColor: string;
  icon: React.ReactNode;
}

const STEPS: Step[] = [
  {
    number: '01',
    title: 'Listen',
    subtitle: 'Understanding What Matters',
    description: 'We sit down with you and your support circle to listen to your unique goals, daily routines, preferences, and personal vision.',
    badgeColor: '#0FA3A3',
    iconBg: 'rgba(15, 163, 163, 0.12)',
    iconColor: '#0FA3A3',
    icon: <Ear size={26} />,
  },
  {
    number: '02',
    title: 'Plan',
    subtitle: 'Tailored Support Matching',
    description: 'Together we design a personalised support schedule aligned with your NDIS budget (Core & Capacity Building) and match you with compatible workers.',
    badgeColor: '#6D2C91',
    iconBg: 'rgba(109, 44, 145, 0.12)',
    iconColor: '#6D2C91',
    icon: <FileHeart size={26} />,
  },
  {
    number: '03',
    title: 'Support',
    subtitle: 'Reliable, Caring Delivery',
    description: 'Consistent, punctual, respectful support workers arrive on time to assist you at home, in the community, with transport, or building skills.',
    badgeColor: '#0D3B46',
    iconBg: 'rgba(13, 59, 70, 0.12)',
    iconColor: '#0D3B46',
    icon: <HeartHandshake size={26} />,
  },
  {
    number: '04',
    title: 'Achieve',
    subtitle: 'Independence & Confidence',
    description: 'We continuously celebrate your milestones, track progress against your NDIS goals, and adapt supports as your independence grows.',
    badgeColor: '#6D2C91',
    iconBg: 'rgba(109, 44, 145, 0.12)',
    iconColor: '#6D2C91',
    icon: <Award size={26} />,
  },
];

export function OurApproachSection() {
  const [activeStep, setActiveStep] = useState<number>(0);

  return (
    <section className="approachSection">
      <div className="shell">
        <div className="sectionHead textCenter">
          <div className="approachBadge">
            <Sparkles size={14} />
            <span>Person-Centred · Dignified · Empowering</span>
          </div>
          <h2 className="sectionTitle">Our 4-Step Support Approach</h2>
          <p className="sectionSubtitle">
            How we partner with NDIS participants, families, and support coordinators across Clarence Coast & Northern Rivers NSW to deliver care you can genuinely rely on.
          </p>
        </div>

        <div className="approachStepsGrid">
          {STEPS.map((step, idx) => {
            const isActive = activeStep === idx;
            return (
              <div
                key={step.number}
                className={`approachStepCard ${isActive ? 'active' : ''}`}
                onClick={() => setActiveStep(idx)}
                onMouseEnter={() => setActiveStep(idx)}
              >
                <div className="stepTopRow">
                  <span className="stepNumber" style={{ backgroundColor: step.badgeColor }}>
                    {step.number}
                  </span>
                  <div className="stepIconBox" style={{ backgroundColor: step.iconBg, color: step.iconColor }}>
                    {step.icon}
                  </div>
                </div>

                <h3 className="stepTitle">{step.title}</h3>
                <h4 className="stepSubtitle">{step.subtitle}</h4>
                <p className="stepDesc">{step.description}</p>

                <div className="stepFooterIndicator" style={{ backgroundColor: isActive ? step.badgeColor : '#E2E8F0' }} />
              </div>
            );
          })}
        </div>

        <div className="approachBannerStrip">
          <div className="approachBannerLeft">
            <Image
              src="/marketing/CarePoint_NDIS_Badge_512.png"
              alt="Proudly Supporting NDIS Participants"
              width={56}
              height={56}
              style={{ width: '56px', height: '56px', objectFit: 'contain' }}
            />
            <div>
              <strong>Supporting NDIS Participants Across Greater Sydney &amp; NSW</strong>
              <p>Self-Managed &amp; Plan-Managed Participants · Fast Intake Turnaround</p>
            </div>
          </div>
          <div className="approachBannerRight">
            <Link href="/referral" className="button approachCtaBtn">
              Start a Referral <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
