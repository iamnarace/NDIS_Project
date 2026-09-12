import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SiteHeader } from '../../../components/SiteHeader';
import { SiteFooter } from '../../../components/SiteFooter';
import { ArrowLeft, LogOut, CheckCircle2, ArrowRight, Shield } from 'lucide-react';

export const metadata = {
  title: 'Service Exit & Transition Policy | Opus Care Support Services',
  description: 'Fair transition notice, continuity of care, and exit procedures for participants leaving Opus Care Support Services.',
};

export default function ExitTransitionPage() {
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
                    ABN: 41 267 197 576 · Client Lifecycle &amp; Transition Governance<br />
                    Supporting Regional Northern NSW &amp; Selected Sydney Areas
                  </p>
                </div>
                <div className="contractBadgeBox">
                  <span className="contractStatusTag">LIFECYCLE POLICY</span>
                  <h1 className="contractMainTitle">EXIT &amp; TRANSITION POLICY</h1>
                  <span className="contractSubTag">Version 2026.1</span>
                </div>
              </div>
            </header>

            <section className="contractSection">
              <h2 className="sectionClauseTitle">1. Principles of Service Exit</h2>
              <p className="clauseText">
                At Opus Care Support Services, we recognize that your support journey is entirely your choice. Participants have the right to leave or transition from our services at any time, for any reason, without penalty or hindrance.
              </p>
            </section>

            <section className="contractSection">
              <h2 className="sectionClauseTitle">2. Notice Periods &amp; Orderly Transition</h2>
              <ul className="clauseList">
                <li><strong>Standard Notice:</strong> Under our standard NDIS Service Agreement, either party may terminate the agreement by providing <strong>fourteen (14) days&apos; written notice</strong>.</li>
                <li><strong>Immediate Termination:</strong> Immediate cessation of support may occur if there is an unacceptable physical safety hazard, violence, or severe threat to the wellbeing of the participant or staff.</li>
                <li><strong>Continuity of Care:</strong> During the 14-day notice period, Opus Care will continue providing scheduled supports as agreed, or assist in an accelerated handover if requested by the participant.</li>
              </ul>
            </section>

            <section className="contractSection">
              <h2 className="sectionClauseTitle">3. Handover of Support Information</h2>
              <p className="clauseText">
                With the participant&apos;s written consent (under an Information Sharing Authority), Opus Care will promptly provide:
              </p>
              <ul className="clauseList">
                <li>Current Individual Support Plan and routines summary</li>
                <li>Recent shift progress notes and milestone updates</li>
                <li>Outstanding invoices and statements for reconciliation with your Plan Manager</li>
                <li>Return of any participant-owned keys, access devices, or personal records</li>
              </ul>
            </section>

            <section className="contractSection">
              <h2 className="sectionClauseTitle">4. Final Account Reconciliation &amp; Feedback</h2>
              <p className="clauseText">
                Following transition, all outstanding service records will be finalized and invoiced within 14 calendar days. We will invite you to complete an optional exit feedback survey to help us continuously improve our quality of support.
              </p>
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
