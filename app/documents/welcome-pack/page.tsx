import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SiteHeader } from '../../../components/SiteHeader';
import { SiteFooter } from '../../../components/SiteFooter';
import { 
  ArrowLeft, 
  Printer, 
  CheckCircle2, 
  ShieldCheck, 
  Heart, 
  Sparkles,
  Users,
  Compass
} from 'lucide-react';

export const metadata = {
  title: 'Participant Welcome & Onboarding Pack | Opus Care Support Services',
  description: 'Participant rights, worker matching, service delivery principles, and quality standards for new Opus Care participants.'
};

export default function WelcomePackPage() {
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
          <div className="agreementRightBtns">
            <Link href="/documents/service-agreement" className="heroPillBtn outline sm">
              <span>View Service Agreement</span>
            </Link>
          </div>
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
                    <strong>Opus Care Support Services Pty Ltd</strong><br />
                    Supporting Self-Managed and Plan-Managed Participants<br />
                    Coffs Coast, Clarence Valley, Richmond Valley & Northern Rivers NSW
                  </p>
                </div>
                <div className="contractBadgeBox">
                  <span className="contractStatusTag">CLIENT HANDBOOK</span>
                  <h1 className="contractMainTitle">WELCOME & ONBOARDING PACK</h1>
                  <span className="contractSubTag">Your Guide to Quality NDIS Support</span>
                </div>
              </div>
            </header>

            <section className="contractSection">
              <h2 className="sectionClauseTitle">Welcome to Opus Care Support Services</h2>
              <p className="clauseText">
                We are proud to welcome you to Opus Care. Our mission is to provide tailored, compassionate, and person-centred disability support that empowers you to achieve your life goals, build independence, and remain in complete control of your care.
              </p>
            </section>

            <section className="contractSection">
              <h2 className="sectionClauseTitle">1. Your Rights as an NDIS Participant</h2>
              <p className="clauseText">Under the NDIS Quality and Safeguards Commission and Opus Care standards, you have the right to:</p>
              <ul className="clauseList">
                <li><strong>Choice and Control:</strong> Decide who supports you, when they support you, and how supports are delivered.</li>
                <li><strong>Dignity and Respect:</strong> Be treated with empathy, courtesy, and respect for your cultural identity and lifestyle.</li>
                <li><strong>Privacy and Confidentiality:</strong> Have your personal, medical, and financial information kept strictly private.</li>
                <li><strong>Safe Environment:</strong> Receive support from screened, vetted, and appropriately trained workers.</li>
                <li><strong>Voice and Feedback:</strong> Provide feedback, raise questions, or make complaints without fear of retribution.</li>
              </ul>
            </section>

            <section className="contractSection">
              <h2 className="sectionClauseTitle">2. How Support Worker Matching Works</h2>
              <p className="clauseText">
                We know that chemistry matters. We match support workers based on shared interests, routines, and required qualifications. You always have the opportunity to meet your worker, and if the fit isn&apos;t right, we will happily arrange an alternative worker without hesitation.
              </p>
            </section>

            <section className="contractSection">
              <h2 className="sectionClauseTitle">3. Safety, Screening & Insurance</h2>
              <p className="clauseText">
                Every Opus Care support worker has completed:
              </p>
              <ul className="clauseList">
                <li>National Police Certificate</li>
                <li>NDIS Worker Screening Check (NDISWC)</li>
                <li>Working with Children Check (WWCC)</li>
                <li>Verified Professional Reference Checks</li>
                <li>Comprehensive Public Liability & Personal Accident Insurance</li>
              </ul>
            </section>

            <section className="contractSection">
              <h2 className="sectionClauseTitle">4. Contacting Your Care Team</h2>
              <p className="clauseText">
                Our support team is based right here on the North Coast of NSW:
              </p>
              <div className="calloutRuleBox">
                <strong>General Inquiries & Care Coordination:</strong> support@opuscare.com.au<br />
                <strong>Participant Portal:</strong> portal.opuscare.com.au<br />
                <strong>Urgent Shift Adjustments:</strong> Mon–Fri 8am–6pm (response within 2 business hours)
              </div>
            </section>

            <footer className="contractFooterLegal">
              <p>Opus Care Support Services Pty Ltd · NSW North Coast & Northern Rivers · support@opuscare.com.au</p>
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
