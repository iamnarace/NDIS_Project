import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Smartphone, 
  Lock, 
  FileSpreadsheet,
  CalendarCheck
} from 'lucide-react';

const PORTAL_FEATURES = [
  'View upcoming Opus Care supports',
  'Read your goals and available support plan',
  'View funding amounts tracked by Opus Care',
  'Find your support and emergency contacts'
];

export function ParticipantPortalSection() {
  return (
    <section className="portalSectionWrap" id="portal">
      <div className="shell">
        <div className="portalSplitGrid">
          
          {/* Left Column: Portal Information & Bullet Checklist */}
          <div className="portalInfoCol">
            <span className="portalSuperTag">
              YOUR OPUS CARE SUPPORT INFORMATION
            </span>

            <h2 className="portalMainTitle">
              Participant & Carer Portal
            </h2>

            <p className="portalSubTitle">
              Your supports, clearly organised
            </p>

            <p className="portalIntroText">
              Sign in to view the care information linked to your account, including upcoming supports and funding tracked by Opus Care. Contact our team for document copies or help with access.
            </p>

            <div className="portalChecklistGrid">
              {PORTAL_FEATURES.map((feature, idx) => (
                <div key={idx} className="portalCheckItem">
                  <div className="portalCheckIconWrap">
                    <CheckCircle2 size={18} className="portalCheckIcon" />
                  </div>
                  <span className="portalCheckText">{feature}</span>
                </div>
              ))}
            </div>

            <div className="portalActionRow">
              <Link href="/portal" className="heroPillBtn purpleBtn">
                <Lock size={16} />
                <span>Dashboard Log In</span>
                <ArrowRight size={16} />
              </Link>

              <Link href="/contact" className="heroPillBtn outline">
                <span>Request Portal Access</span>
              </Link>
            </div>

            <div className="portalPoweredNote">
              <span>Access your care information in one place.</span>
            </div>
          </div>

          {/* Right Column: Interactive Portal Preview Card */}
          <div className="portalPreviewCol">
            <div className="portalDeviceCard">
              <div className="portalDeviceTopBar">
                <div className="portalDeviceDots">
                  <span className="dot red" />
                  <span className="dot yellow" />
                  <span className="dot green" />
                </div>
                <span className="portalDeviceUrl">Illustrative preview · example information</span>
                <span className="portalDeviceSecure">
                  <Lock size={12} /> Secure
                </span>
              </div>

              <div className="portalDeviceBody">
                <div className="portalHeaderMini">
                  <div>
                    <span className="miniParticipantLabel">Participant Dashboard</span>
                    <h4>Welcome back, Sarah M.</h4>
                    <p className="miniPlanId">NDIS Plan #43098214 · Self-Managed</p>
                  </div>
                  <span className="miniStatusLive">🟢 Active Roster</span>
                </div>

                {/* Budget Meters */}
                <div className="miniBudgetBox">
                  <div className="miniBudgetItem">
                    <div className="miniBudgetHead">
                      <span>Core Supports</span>
                      <strong>$18,420 remaining</strong>
                    </div>
                    <div className="miniBudgetBar">
                      <div className="miniBudgetFill core" style={{ width: '68%' }} />
                    </div>
                    <small>Allocated: $28,000</small>
                  </div>

                  <div className="miniBudgetItem">
                    <div className="miniBudgetHead">
                      <span>Capacity Building</span>
                      <strong>$8,250 remaining</strong>
                    </div>
                    <div className="miniBudgetBar">
                      <div className="miniBudgetFill capacity" style={{ width: '54%' }} />
                    </div>
                    <small>Allocated: $15,000</small>
                  </div>
                </div>

                {/* Upcoming Shift & Pending Invoice */}
                <div className="miniShiftCard">
                  <div className="miniShiftHeader">
                    <CalendarCheck size={16} className="miniShiftIcon" />
                    <strong>Upcoming Support Shift</strong>
                  </div>
                  <p>Tomorrow at 9:00 AM – 1:00 PM · Support Worker: <em>Emma H.</em></p>
                  <small>Community Access & Life Skills Training</small>
                </div>

                <div className="miniInvoiceCard">
                  <div className="miniInvoiceLeft">
                    <FileSpreadsheet size={16} className="miniInvoiceIcon" />
                    <div>
                      <strong>Invoice #INV-2026-084</strong>
                      <small>3.5 hrs Support · $229.04</small>
                    </div>
                  </div>
                  <div className="miniInvoiceButtons">
                    <span className="miniActionBtn approve">Approve</span>
                    <span className="miniActionBtn decline">Query</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
