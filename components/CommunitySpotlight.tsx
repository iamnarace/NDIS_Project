import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, ShieldCheck, Heart, Users, MapPin, ArrowRight } from 'lucide-react';

export function CommunitySpotlight() {
  return (
    <section className="communitySpotlightSection">
      <div className="shell">
        {/* Top Hero Banner Feature */}
        <div className="campaignFeatureCard">
          <div className="campaignContent">
            <div className="campaignBadge">
              <Sparkles size={14} />
              <span>Supporting Your Journey · Every Step</span>
            </div>
            <h2 className="campaignTitle">Compassionate · Reliable · Person-Centred</h2>
            <p className="campaignText">
              CarePoint Support Services connects NDIS participants with dedicated, screened support workers who genuinely listen, care, and empower you to live life on your terms.
            </p>
            <div className="campaignPills">
              <span className="campaignPill">
                <ShieldCheck size={16} color="#2DD4BF" /> NDIS Screened Workers
              </span>
              <span className="campaignPill">
                <Heart size={16} color="#F472B6" /> Person-Centred
              </span>
              <span className="campaignPill">
                <MapPin size={16} color="#38BDF8" /> Greater Sydney NSW
              </span>
            </div>
            <div className="campaignActions">
              <Link href="/referral" className="button primary">
                Start a Referral <ArrowRight size={16} />
              </Link>
              <Link href="/contact" className="button secondary">
                Meet Our Team
              </Link>
            </div>
          </div>
          <div className="campaignImageCol">
            <Image
              src="/marketing/CarePoint_Hero_Banner_Visual.png"
              alt="CarePoint Support Worker with Participant in Sydney"
              width={700}
              height={320}
              className="campaignImg"
              style={{ objectFit: 'cover', borderRadius: '16px' }}
            />
          </div>
        </div>

        {/* Visual Highlights Grid */}
        <div className="marketingHighlightsGrid">
          <div className="highlightGraphicCard">
            <Image
              src="/marketing/CarePoint_Choice_Control_Visual.png"
              alt="Proudly Supporting Choice, Control and Inclusion"
              width={480}
              height={480}
              className="highlightImg"
              style={{ objectFit: 'contain', width: '100%', height: 'auto' }}
            />
          </div>

          <div className="highlightGraphicCard">
            <Image
              src="/marketing/CarePoint_Participant_Story_Visual.png"
              alt="CarePoint Participant Story"
              width={480}
              height={480}
              className="highlightImg"
              style={{ objectFit: 'contain', width: '100%', height: 'auto' }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
