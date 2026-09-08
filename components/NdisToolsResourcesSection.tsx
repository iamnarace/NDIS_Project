import Link from 'next/link';
import { DollarSign, BookOpen, Calculator, ArrowRight } from 'lucide-react';

export function NdisToolsResourcesSection() {
  return (
    <section className="cleanSectionPadding ndisResourcesSectionWrap">
      <div className="shell">
        <div className="sectionHeaderCenter">
          <span className="greenCategoryTag">RESOURCES</span>
          <h2 className="sectionSerifTitle">Free NDIS Tools & Resources</h2>
          <p className="sectionSubDesc">
            Quick access to the price guide, the full support catalogue, and a budget calculator to plan your funding.
          </p>
        </div>

        <div className="toolsCardsGrid3">
          {/* Tool Card 1: Pricing Arrangements */}
          <div className="controlledCardPane toolsPaneCard">
            <div className="toolsIconBadge">
              <DollarSign size={24} />
            </div>
            <h3>NDIS Pricing Arrangements</h3>
            <p className="toolsDesc">
              Current NDIA price limits across support categories — fully updated to the latest Pricing Arrangements & Price Limits.
            </p>
            <div className="toolsCardAction">
              <Link href="/faq" className="toolsActionBtn">
                <span>View pricing</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>

          {/* Tool Card 2: Support Catalogue */}
          <div className="controlledCardPane toolsPaneCard">
            <div className="toolsIconBadge">
              <BookOpen size={24} />
            </div>
            <h3>Support Catalogue</h3>
            <p className="toolsDesc">
              Search and filter every NDIS support item, line-item code, category, and registration group for your daily routine.
            </p>
            <div className="toolsCardAction">
              <Link href="/services" className="toolsActionBtn">
                <span>Browse catalogue</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>

          {/* Tool Card 3: Budget Calculator */}
          <div className="controlledCardPane toolsPaneCard">
            <div className="toolsIconBadge">
              <Calculator size={24} />
            </div>
            <h3>Budget Calculator</h3>
            <p className="toolsDesc">
              Estimate how far a plan budget stretches across the supports you use — calculating weekly hours, rates, and totals.
            </p>
            <div className="toolsCardAction">
              <a href="#estimator" className="toolsActionBtn">
                <span>Open calculator</span>
                <ArrowRight size={15} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default NdisToolsResourcesSection;
