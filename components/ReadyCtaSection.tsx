import Link from 'next/link';
import { Heart, Home, Sparkles, Users, ArrowRight, Mail } from 'lucide-react';

export function ReadyCtaSection() {
  return (
    <section className="readyCtaSectionWrap lightRadiant">
      <div className="shell">
        <div className="readyCtaInnerContainer">
          <span className="readySuperTag">GET STARTED TODAY</span>
          <h2 className="readyMainTitle">Ready to Get Started?</h2>
          <p className="readySubDesc">
            Whether you&apos;re looking for NDIS support services, household assistance, or want to learn more about how we can help, we&apos;re here for you. Contact us today for a free consultation.
          </p>

          {/* 4 Clean Service Pills */}
          <div className="readyPillsRow">
            <div className="readyPillItem">
              <div className="pillIconCircle">
                <Heart size={16} />
              </div>
              <span>NDIS Support</span>
            </div>
            <div className="readyPillItem">
              <div className="pillIconCircle">
                <Home size={16} />
              </div>
              <span>Home & Living</span>
            </div>
            <div className="readyPillItem">
              <div className="pillIconCircle">
                <Sparkles size={16} />
              </div>
              <span>Daily Assistance</span>
            </div>
            <div className="readyPillItem">
              <div className="pillIconCircle">
                <Users size={16} />
              </div>
              <span>Community Participation</span>
            </div>
          </div>

          {/* Action Buttons & Direct Email */}
          <div className="readyActionsBlock">
            <Link href="/referral" className="readyIntakeBtn">
              <span>Complete NDIS Intake</span>
              <ArrowRight size={17} />
            </Link>
            <div className="readyEmailNote">
              <span>Or email us at </span>
              <a href="mailto:support@opuscare.com.au" className="readyEmailLink">
                support@opuscare.com.au
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ReadyCtaSection;
