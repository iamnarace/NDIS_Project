import Link from 'next/link';
import { Heart, TrendingUp, Wrench, ArrowRight } from 'lucide-react';

export function NdisFundingSection() {
  return (
    <section className="cleanSectionPadding ndisFundingSectionWrap">
      <div className="shell">
        <div className="sectionHeaderCenter">
          <span className="greenCategoryTag">NDIS FUNDING</span>
          <h2 className="sectionSerifTitle">Understanding Your NDIS Funding</h2>
          <p className="sectionSubDesc">
            Your NDIS plan funding is divided into categories. Understanding these helps you make the most of your supports and achieve your goals.
          </p>
        </div>

        <div className="fundingCardsGrid3">
          {/* Card 1: Core Supports */}
          <div className="controlledCardPane fundingPaneCard">
            <div className="fundingCardTop">
              <div className="fundingIconCircle rose">
                <Heart size={24} />
              </div>
              <h3>Core Supports</h3>
              <p className="fundingCardDesc">
                Day-to-day assistance with daily living activities, transport, consumables, and support worker costs.
              </p>
            </div>

            <div className="fundingIncludesBlock">
              <span className="includesLabel">Includes:</span>
              <div className="bulletTwoColGrid">
                <div className="bulletItem"><span className="bulletDot coral"></span> Personal care</div>
                <div className="bulletItem"><span className="bulletDot coral"></span> Transport</div>
                <div className="bulletItem"><span className="bulletDot coral"></span> Household tasks</div>
                <div className="bulletItem"><span className="bulletDot coral"></span> Community participation</div>
              </div>
            </div>
          </div>

          {/* Card 2: Capacity Building */}
          <div className="controlledCardPane fundingPaneCard">
            <div className="fundingCardTop">
              <div className="fundingIconCircle purple">
                <TrendingUp size={24} />
              </div>
              <h3>Capacity Building</h3>
              <p className="fundingCardDesc">
                Supports that help you build your independence and skills to achieve your goals over time.
              </p>
            </div>

            <div className="fundingIncludesBlock">
              <span className="includesLabel">Includes:</span>
              <div className="bulletTwoColGrid">
                <div className="bulletItem"><span className="bulletDot purple"></span> Support coordination</div>
                <div className="bulletItem"><span className="bulletDot purple"></span> Training &amp; education</div>
                <div className="bulletItem"><span className="bulletDot purple"></span> Therapy services</div>
                <div className="bulletItem"><span className="bulletDot purple"></span> Employment support</div>
              </div>
            </div>
          </div>

          {/* Card 3: Capital Supports */}
          <div className="controlledCardPane fundingPaneCard">
            <div className="fundingCardTop">
              <div className="fundingIconCircle teal">
                <Wrench size={24} />
              </div>
              <h3>Capital Supports</h3>
              <p className="fundingCardDesc">
                Higher-cost items and one-off purchases including assistive equipment and home modifications.
              </p>
            </div>

            <div className="fundingIncludesBlock">
              <span className="includesLabel">Includes:</span>
              <div className="bulletTwoColGrid">
                <div className="bulletItem"><span className="bulletDot teal"></span> Home modifications</div>
                <div className="bulletItem"><span className="bulletDot teal"></span> Assistive technology</div>
                <div className="bulletItem"><span className="bulletDot teal"></span> Vehicle modifications</div>
                <div className="bulletItem"><span className="bulletDot teal"></span> Specialist equipment</div>
              </div>
            </div>
          </div>
        </div>

        <div className="fundingSectionFooterLink">
          <Link href="/faq" className="learnFundingLink">
            <span>Learn more about NDIS funding</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default NdisFundingSection;
