'use client';

import { Check, X, Shield, ArrowRight, HelpCircle, Sparkles } from 'lucide-react';
import Link from 'next/link';

export function FundingTransparencyCard() {
  return (
    <div className="fundingTransparencyContainer">
      <div className="sectionHead">
        <span className="eyebrow"><Shield size={16} /> Transparent NDIS Funding</span>
        <h2>How Your NDIS Plan Works With Opus Care</h2>
        <p>We believe in total transparency. Opus Care operates as an unregistered NDIS disability support provider focused on personal, high-quality, dependable care.</p>
      </div>

      <div className="fundingComparisonGrid">
        {/* Plan-Managed (Primary / Most popular) */}
        <div className="fundingPlanCard featured">
          <div className="popularBadge">Most Popular &amp; Seamless</div>
          <div className="planHeader">
            <h3>Plan-Managed</h3>
            <span className="statusTag green">Fully Supported ✅</span>
            <p>Your independent Plan Manager (e.g. Plan Partners, My Plan Manager, Leap in!) pays invoices directly.</p>
          </div>
          <ul className="planFeaturesList">
            <li><Check size={16} color="#0D9488" /> <strong>Zero out-of-pocket expenses</strong> for agreed support hours</li>
            <li><Check size={16} color="#0D9488" /> Invoices sent directly to your plan manager</li>
            <li><Check size={16} color="#0D9488" /> Rates capped strictly at official NDIS price limits</li>
            <li><Check size={16} color="#0D9488" /> Fast 24–48h invoice turnaround</li>
            <li><Check size={16} color="#0D9488" /> Full freedom to choose your preferred support worker</li>
          </ul>
          <Link className="button full" href="/referral">
            Refer with Plan-Managed Funding <ArrowRight size={16} />
          </Link>
        </div>

        {/* Self-Managed */}
        <div className="fundingPlanCard">
          <div className="planHeader">
            <h3>Self-Managed</h3>
            <span className="statusTag green">Fully Supported ✅</span>
            <p>You or your nominee manage your own NDIS funding allocations and pay providers directly.</p>
          </div>
          <ul className="planFeaturesList">
            <li><Check size={16} color="#0D9488" /> Maximum flexibility in scheduling and custom goals</li>
            <li><Check size={16} color="#0D9488" /> Clear, itemised PDF tax invoices for the myplace portal</li>
            <li><Check size={16} color="#0D9488" /> Standard 14-day payment terms</li>
            <li><Check size={16} color="#0D9488" /> Transparent service agreement with fixed hourly rates</li>
            <li><Check size={16} color="#0D9488" /> Direct 1-on-1 communication with your support worker</li>
          </ul>
          <Link className="button full secondary" href="/referral">
            Refer with Self-Managed Funding <ArrowRight size={16} />
          </Link>
        </div>

        {/* NDIA / Agency-Managed */}
        <div className="fundingPlanCard mutedCard">
          <div className="planHeader">
            <h3>Agency / NDIA-Managed</h3>
            <span className="statusTag gray">Not Applicable At Present</span>
            <p>Funding managed directly by the National Disability Insurance Agency through registered-only portals.</p>
          </div>
          <ul className="planFeaturesList">
            <li><X size={16} color="#94A3B8" /> Requires formal NDIS registered provider status</li>
            <li><Check size={16} color="#0D9488" /> <em>Tip:</em> You can request your NDIS planner or coordinator to switch parts of your plan to Plan-Management at any review for zero cost!</li>
            <li><Check size={16} color="#0D9488" /> Free advice on how plan-management works</li>
          </ul>
          <Link className="button full secondary" href="/contact">
            Ask Us About Switching to Plan-Managed <HelpCircle size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
