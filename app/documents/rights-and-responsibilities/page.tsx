import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SiteHeader } from '../../../components/SiteHeader';
import { SiteFooter } from '../../../components/SiteFooter';
import { ArrowLeft, ShieldCheck, Heart, Users, Compass, AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'Participant Charter of Rights & Responsibilities | Opus Care Support Services',
  description: 'Official NDIS participant rights, choice & control, dignity, and participant responsibilities under Opus Care Support Services.',
};

export default function RightsAndResponsibilitiesPage() {
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
                    ABN: 41 267 197 576 · Unregistered NDIS Provider<br />
                    Adults 18+ · Self-Managed &amp; Plan-Managed Supports
                  </p>
                </div>
                <div className="contractBadgeBox">
                  <span className="contractStatusTag">PARTICIPANT CHARTER</span>
                  <h1 className="contractMainTitle">RIGHTS &amp; RESPONSIBILITIES</h1>
                  <span className="contractSubTag">Version 2026.1</span>
                </div>
              </div>
            </header>

            <section className="contractSection">
              <h2 className="sectionClauseTitle">1. Your Rights as an NDIS Participant</h2>
              <p className="clauseText">
                Under the NDIS Quality and Safeguards Commission Code of Conduct and Opus Care governance, you have the fundamental right to:
              </p>
              <ul className="clauseList">
                <li><strong>Individual Autonomy &amp; Choice:</strong> Retain full choice and control over your supports, routines, support workers, and personal goals.</li>
                <li><strong>Respect &amp; Dignity:</strong> Be treated with empathy, courtesy, and dignity without discrimination based on disability, age, gender, race, religion, or sexual orientation.</li>
                <li><strong>Privacy &amp; Confidentiality:</strong> Expect your personal, medical, and financial information to be handled in strict accordance with the Privacy Act 1988 (Cth).</li>
                <li><strong>Freedom from Harm &amp; Exploitation:</strong> Receive supports free from violence, abuse, neglect, exploitation, or unauthorized restrictive practices.</li>
                <li><strong>Independent Advocacy:</strong> Involve an independent advocate, family member, or trusted representative at any stage of assessment, service planning, or review.</li>
                <li><strong>Fair Feedback &amp; Complaints:</strong> Raise concerns or make complaints without fear of retribution, negative impact on your service, or dismissal.</li>
              </ul>
            </section>

            <section className="contractSection">
              <h2 className="sectionClauseTitle">2. Your Responsibilities as a Participant</h2>
              <p className="clauseText">
                To help us deliver safe, high-quality, and respectful supports, participants and their families are asked to:
              </p>
              <ul className="clauseList">
                <li><strong>Safe Environment:</strong> Maintain a safe physical environment free from hazards, smoke, and violence when workers provide supports in your home.</li>
                <li><strong>Mutual Respect:</strong> Treat support workers and coordination staff with courtesy and respect at all times.</li>
                <li><strong>Accurate Information:</strong> Provide up-to-date and accurate information regarding your support needs, emergency contacts, medical directives, and NDIS plan details.</li>
                <li><strong>Timely Notice:</strong> Provide at least two (2) clear business days&apos; notice if you need to cancel or reschedule a support session.</li>
                <li><strong>Payment Cooperation:</strong> Ensure that agreed invoices are promptly authorized through your Plan Manager or paid within agreed invoice terms.</li>
              </ul>
            </section>

            <section className="contractSection">
              <h2 className="sectionClauseTitle">3. Accessing Independent Advocacy</h2>
              <p className="clauseText">
                If you would like an independent advocate to support you during meetings or complaints, you can access free advocacy services:
              </p>
              <div className="calloutRuleBox">
                <strong>National Disability Advocacy Program (NDAP):</strong> Finder tool at disabilityadvocacyfinder.dss.gov.au<br />
                <strong>Disability Advocacy NSW:</strong> 1300 365 085<br />
                <strong>People with Disability Australia (PWDA):</strong> 1800 422 015
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
