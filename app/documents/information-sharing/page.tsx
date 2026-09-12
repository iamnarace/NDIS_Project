import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SiteHeader } from '../../../components/SiteHeader';
import { SiteFooter } from '../../../components/SiteFooter';
import { ArrowLeft, Share2, ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Information Sharing Authority | Opus Care Support Services',
  description: 'Official consent policy and template for sharing participant information with Plan Managers, Support Coordinators, and Allied Health.',
};

export default function InformationSharingPage() {
  return (
    <>
      <div className="no-print">
        <SiteHeader />
      </div>

      <main className="agreementPageMain">
        <div className="shell agreementActionsBar no-print">
          <Link href="/documents" className="backToDocsLink">
            <ArrowLeft size={16} />
            <span>Back to Document Hub</span>
          </Link>
        </div>

        <div className="shell">
          <div className="printableAgreementCard">
            <header className="contractHeader">
              <div className="contractBrandRow">
                <div>
                  <Image
                    src="/brand/Opus_Care_Logo_Transparent.png"
                    alt="Opus Care Support Services"
                    width={220}
                    height={60}
                    priority
                    className="contractLogo"
                  />
                  <p className="contractEntityDetails">
                    <strong>Opus Care Support Services</strong><br />
                    ABN: 41 267 197 576 · Privacy &amp; Disclosure Governance<br />
                    Australian Privacy Principles (Privacy Act 1988 Cth)
                  </p>
                </div>
                <div className="contractBadgeBox">
                  <span className="contractStatusTag">CONSENT INSTRUMENT</span>
                  <h1 className="contractMainTitle">INFORMATION SHARING AUTHORITY</h1>
                  <span className="contractSubTag">Version 2026.1</span>
                </div>
              </div>
            </header>

            <section className="contractSection">
              <h2 className="sectionClauseTitle">1. Purpose of Information Sharing</h2>
              <p className="clauseText">
                To coordinate your NDIS supports effectively, Opus Care Support Services may need to communicate and share relevant information with third parties involved in your care (such as your Plan Manager, Support Coordinator, Occupational Therapist, or GP). We will never disclose your information without your explicit written authority, unless required by Australian law.
              </p>
            </section>

            <section className="contractSection">
              <h2 className="sectionClauseTitle">2. Scopes of Authority</h2>
              <p className="clauseText">You may grant authority under one or more specific scopes:</p>
              <ul className="clauseList">
                <li><strong>Financial &amp; Invoicing Only:</strong> Authorises sharing of support schedules, timesheets, and invoices with your appointed Plan Manager for payment processing.</li>
                <li><strong>Service Schedules &amp; Delivery:</strong> Authorises communication with your Support Coordinator regarding shift times, worker matches, and service availability.</li>
                <li><strong>Support Plans &amp; Clinical Reports:</strong> Authorises sharing of individual support plans, risk profiles, and progress reports with treating health practitioners.</li>
                <li><strong>All Operational Records:</strong> Authorises comprehensive communication for full care coordination.</li>
              </ul>
            </section>

            <section className="contractSection">
              <h2 className="sectionClauseTitle">3. Your Right to Revoke Authority</h2>
              <p className="clauseText">
                You have the absolute right to revoke or amend an Information Sharing Authority at any time. Revocation takes effect immediately upon notifying Opus Care in writing or through your coordinator.
              </p>
              <div className="calloutRuleBox">
                <strong>To Revoke or Amend an Authority:</strong><br />
                Email your Privacy Officer at <strong>support@opuscare.com.au</strong> or request revocation in person. An updated record will be entered into your CRM profile with immediate effect.
              </div>
            </section>

            <footer className="contractFooterLegal">
              <p>Opus Care Support Services · ABN 41 267 197 576 · support@opuscare.com.au</p>
            </footer>
          </div>
        </div>
      </main>

      <div className="no-print">
        <SiteFooter />
      </div>
    </>
  );
}
