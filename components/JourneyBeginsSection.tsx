import Link from 'next/link';
import Image from 'next/image';
import { RefreshCw, MessageSquare, ArrowRight, CheckCircle2 } from 'lucide-react';

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
              Discover how our personalised, person-centred support makes your NDIS and disability journey easier across Coffs Coast, Clarence Valley, Richmond Valley & Northern Rivers.
            </p>

            <div className="journeyPhotoCollageGrid">
              <div className="collagePhotoCard main">
                <Image
                  src="/images/ndis-care-moment.jpg"
                  alt="Support worker assisting participant in home kitchen"
                  width={500}
                  height={380}
                  className="collageImg"
                />
              </div>
              <div className="collagePhotoCard subTop">
                <Image
                  src="/images/ndis-community-walk.jpg"
                  alt="Participants enjoying outdoor community walk"
                  width={350}
                  height={220}
                  className="collageImg"
                />
              </div>
              <div className="collagePhotoCard subBottom">
                <Image
                  src="/images/ndis-gardening-support.jpg"
                  alt="Gardening and active outdoor support session"
                  width={350}
                  height={220}
                  className="collageImg"
                />
              </div>
            </div>
          </div>

          {/* Right Column: 2 Distinct Color-Coded Action Cards (Enabled4Life Style) */}
          <div className="journeyCardsCol">
            {/* Action Card 1: Deep Royal Indigo Card */}
            <div className="journeyActionCard cardIndigo">
              <div className="actionCardHeader">
                <div className="actionIconWrap indigoIcon">
                  <RefreshCw size={26} />
                </div>
                <span className="actionSuperText">SIMPLE STEPS TO</span>
                <h3>Get started Switching Providers</h3>
              </div>
              <p className="actionCardBody">
                Are you ready to switch to a provider that genuinely listens, shows up on time, and values your choices? We handle the transition smoothly with zero paperwork stress.
              </p>
              <Link href="/contact" className="actionCardLinkBtn whiteBtn">
                <span>Start here</span>
                <ArrowRight size={16} />
              </Link>
            </div>

            {/* Action Card 2: Soft Lilac Card */}
            <div className="journeyActionCard cardLilac">
              <div className="actionCardHeader">
                <div className="actionIconWrap lilacIcon">
                  <MessageSquare size={26} />
                </div>
                <span className="actionSuperText">I&apos;M READY TO</span>
                <h3>Get started with Opus Care</h3>
              </div>
              <p className="actionCardBody">
                Are you ready to speak with our local team about your goals and funding? We respond promptly within 24 business hours to organize your support plan.
              </p>
              <Link href="/referral" className="actionCardLinkBtn purpleBtn">
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
