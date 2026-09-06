import Link from 'next/link';
import Image from 'next/image';
import { RefreshCw, MessageSquare, ArrowRight } from 'lucide-react';

export function JourneyBeginsSection() {
  return (
    <section className="cleanSectionPadding journeySectionWrap">
      <div className="shell">
        <div className="journeySplitGrid">
          
          {/* Left Column: Heading + Organic Lifestyle Photo Collage */}
          <div className="journeyTextCol">
            <span className="journeySubTag">WHERE TO START</span>
            <h2 className="journeyMainHeading">
              Your journey <span className="highlightHandwriting">begins here</span>
            </h2>
            <p className="journeyDescText">
              Discover how our personalised, person-centred support makes your NDIS and disability journey easier across Yamba, Grafton, Maclean, and Northern Rivers NSW.
            </p>

            <div className="journeyPhotoCollageGrid">
              <div className="collagePhotoCard main">
                <Image
                  src="https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=700&q=80"
                  alt="Support worker assisting participant in home kitchen"
                  width={500}
                  height={380}
                  className="collageImg"
                />
              </div>
              <div className="collagePhotoCard subTop">
                <Image
                  src="https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=400&q=80"
                  alt="Participants enjoying outdoor community activity"
                  width={350}
                  height={220}
                  className="collageImg"
                />
              </div>
              <div className="collagePhotoCard subBottom">
                <Image
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80"
                  alt="Skill building and mentoring session"
                  width={350}
                  height={220}
                  className="collageImg"
                />
              </div>
            </div>
          </div>

          {/* Right Column: 2 Deep Royal Purple Action Cards */}
          <div className="journeyCardsCol">
            {/* Action Card 1: Switching Providers */}
            <div className="journeyActionPurpleCard">
              <div className="actionCardHeader">
                <div className="actionIconWrap">
                  <RefreshCw size={26} />
                </div>
                <span className="actionSuperText">SIMPLE STEPS TO</span>
                <h3>Get started Switching Providers</h3>
              </div>
              <p className="actionCardBody">
                Are you ready to switch to a provider that genuinely listens, shows up on time, and values your choices? We handle the transition smoothly with zero paperwork stress.
              </p>
              <Link href="/contact" className="actionCardLinkBtn">
                <span>Start here</span>
                <ArrowRight size={16} />
              </Link>
            </div>

            {/* Action Card 2: Get Started with Opus Care */}
            <div className="journeyActionPurpleCard">
              <div className="actionCardHeader">
                <div className="actionIconWrap">
                  <MessageSquare size={26} />
                </div>
                <span className="actionSuperText">I&apos;M READY TO</span>
                <h3>Get started with Opus Care</h3>
              </div>
              <p className="actionCardBody">
                Are you ready to speak with our local team about your goals and funding? We respond promptly within 24 business hours to organize your support plan.
              </p>
              <Link href="/referral" className="actionCardLinkBtn">
                <span>Enquire now</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

export default JourneyBeginsSection;
