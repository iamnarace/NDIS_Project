'use client';

import { Check, Shield, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export function FundingTransparencyCard() {
  return (
    <div className="fundingControlledContainer">
      <div className="sectionHead textCenter">
        <span className="greenCategoryTag">
          <Shield size={14} /> TRANSPARENT NDIS FUNDING
        </span>
        <h2 className="sectionSerifTitle">How Your NDIS Plan Works With Opus Care</h2>
        <p className="sectionSubDesc">
          We operate with complete financial transparency. We support self-managed and plan-managed participants with zero hidden administrative fees.
        </p>
      </div>

      <div className="fundingComparisonGrid">
        {/* Plan-Managed Card Pane */}
        <div className="controlledCardPane fundingPlanCard featured">
          <div className="planHeader">
            <span className="planPopularTag">Most Popular &amp; Seamless</span>
            <h3>Plan-Managed</h3>
            <span className="statusTag green">Fully Supported ✅</span>
            <p>Your independent Plan Manager (e.g. Plan Partners, My Plan Manager, Leap in!) pays invoices directly on your behalf.</p>
          </div>

          <ul className="planFeaturesList">
            <li>
              <CheckCircle2 size={18} className="featCheck" />
              <span><strong>Zero out-of-pocket expenses</strong> for agreed support hours</span>
            </li>
            <li>
              <CheckCircle2 size={18} className="featCheck" />
              <span>Invoices submitted directly to your plan manager</span>
            </li>
            <li>
              <CheckCircle2 size={18} className="featCheck" />
              <span>Rates capped strictly at official NDIS price limits</span>
            </li>
            <li>
              <CheckCircle2 size={18} className="featCheck" />
              <span>Fast 24–48h invoice turnaround guarantee</span>
            </li>
            <li>
              <CheckCircle2 size={18} className="featCheck" />
              <span>Full choice and control over your preferred support worker</span>
            </li>
          </ul>

          <div className="planCardFooter">
            <Link className="heroPillBtn filled full" href="/referral">
              <span>Refer with Plan-Managed Funding</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Self-Managed Card Pane */}
        <div className="controlledCardPane fundingPlanCard">
          <div className="planHeader">
            <span className="planFlexibleTag">Maximum Freedom</span>
            <h3>Self-Managed</h3>
            <span className="statusTag green">Fully Supported ✅</span>
            <p>You or your nominee manage your own NDIS funding allocations and pay support providers directly.</p>
          </div>

          <ul className="planFeaturesList">
            <li>
              <CheckCircle2 size={18} className="featCheck" />
              <span>Maximum flexibility in scheduling and personal goals</span>
            </li>
            <li>
              <CheckCircle2 size={18} className="featCheck" />
              <span>Clear, itemised PDF tax invoices ready for the myplace portal</span>
            </li>
            <li>
              <CheckCircle2 size={18} className="featCheck" />
              <span>Standard 14-day payment terms</span>
            </li>
            <li>
              <CheckCircle2 size={18} className="featCheck" />
              <span>Transparent service agreement with fixed hourly rates</span>
            </li>
            <li>
              <CheckCircle2 size={18} className="featCheck" />
              <span>Direct 1-on-1 communication with your support worker</span>
            </li>
          </ul>

          <div className="planCardFooter">
            <Link className="heroPillBtn outline full" href="/referral">
              <span>Refer with Self-Managed Funding</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
