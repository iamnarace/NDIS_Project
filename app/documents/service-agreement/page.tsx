'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SiteHeader } from '../../../components/SiteHeader';
import { SiteFooter } from '../../../components/SiteFooter';
import { 
  Printer, 
  Download, 
  ArrowLeft, 
  CheckCircle2, 
  FileText, 
  ShieldCheck, 
  Calendar,
  Lock
} from 'lucide-react';

export default function ServiceAgreementPage() {
  const [participantName, setParticipantName] = useState('');
  const [ndisNumber, setNdisNumber] = useState('');
  const [planManager, setPlanManager] = useState('');
  const [startDate, setStartDate] = useState('2026-09-01');
  const [endDate, setEndDate] = useState('2027-08-31');

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div className="no-print">
        <SiteHeader />
      </div>

      <main className="agreementPageMain">
        {/* Print & Action Bar */}
        <div className="shell agreementActionsBar no-print">
          <Link href="/documents" className="backToDocsLink">
            <ArrowLeft size={16} />
            <span>Back to Document Hub</span>
          </Link>

          <div className="agreementRightBtns">
            <button onClick={handlePrint} className="heroPillBtn filled sm printBtn">
              <Printer size={16} />
              <span>Print or Save to PDF</span>
            </button>
          </div>
        </div>

        {/* Printable Contract Document Container */}
        <div className="shell">
          <div className="printableAgreementCard">
            
            {/* Agreement Header */}
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
                    ABN: [Pending Provider Configuration]<br />
                    Email: support@opuscare.com.au · Web: opuscare.com.au<br />
                    Operating across Coffs Coast, Clarence Valley, Richmond Valley & Northern Rivers NSW
                  </p>
                </div>
                <div className="contractBadgeBox">
                  <span className="contractStatusTag">OFFICIAL DOCUMENT</span>
                  <h1 className="contractMainTitle">NDIS SERVICE AGREEMENT</h1>
                  <span className="contractSubTag">Standard Participant Agreement</span>
                </div>
              </div>
            </header>

            {/* Fillable Participant Details Box */}
            <section className="contractSection fillableBox">
              <h2 className="sectionClauseTitle">Part 1: Schedule of Parties & Participant Details</h2>
              <p className="clauseText">
                This Service Agreement is made between <strong>Opus Care Support Services Pty Ltd</strong> {`("the Provider")`} and the Participant or their authorised representative {`("the Participant")`}.
              </p>

              <div className="contractFieldsGrid">
                <div className="contractField">
                  <label>Participant Full Name:</label>
                  <input 
                    type="text" 
                    placeholder="e.g. John Doe"
                    value={participantName}
                    onChange={(e) => setParticipantName(e.target.value)}
                    className="contractInput"
                  />
                </div>

                <div className="contractField">
                  <label>NDIS Participant Number:</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 430 000 000"
                    value={ndisNumber}
                    onChange={(e) => setNdisNumber(e.target.value)}
                    className="contractInput"
                  />
                </div>

                <div className="contractField">
                  <label>NDIS Funding Management:</label>
                  <select className="contractInput">
                    <option>Plan-Managed</option>
                    <option>Self-Managed</option>
                  </select>
                </div>

                <div className="contractField">
                  <label>Plan Manager / Invoice Contact (if applicable):</label>
                  <input 
                    type="text" 
                    placeholder="Plan Management Company & Accounts Email"
                    value={planManager}
                    onChange={(e) => setPlanManager(e.target.value)}
                    className="contractInput"
                  />
                </div>

                <div className="contractField">
                  <label>Agreement Start Date:</label>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="contractInput"
                  />
                </div>

                <div className="contractField">
                  <label>Agreement End / Plan Review Date:</label>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="contractInput"
                  />
                </div>
              </div>
            </section>

            {/* Part 2: Schedule of Supports & NDIS Price Limits */}
            <section className="contractSection">
              <h2 className="sectionClauseTitle">Part 2: Schedule of Supports & Pricing Limits</h2>
              <p className="clauseText">
                The Provider agrees to provide the Participant with agreed disability supports in accordance with the <em>NDIS Pricing Arrangements and Price Limits</em> (Support Catalogue) in effect at the date of service delivery.
              </p>

              <table className="contractRatesTable">
                <thead>
                  <tr>
                    <th>Support Category</th>
                    <th>Support Description</th>
                    <th>Line Item Reference</th>
                    <th>Maximum Rate (NDIS Capped)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Core Supports</strong></td>
                    <td>Assistance with Daily Life (Standard Weekday Daytime 6am–8pm)</td>
                    <td>01_011_0107_1_1</td>
                    <td><strong>$65.47 / hr</strong></td>
                  </tr>
                  <tr>
                    <td><strong>Core Supports</strong></td>
                    <td>Assistance with Daily Life (Weekday Evening 8pm–12am)</td>
                    <td>01_015_0107_1_1</td>
                    <td><strong>$72.13 / hr</strong></td>
                  </tr>
                  <tr>
                    <td><strong>Core Supports</strong></td>
                    <td>Assistance with Daily Life (Saturday)</td>
                    <td>01_013_0107_1_1</td>
                    <td><strong>$92.12 / hr</strong></td>
                  </tr>
                  <tr>
                    <td><strong>Core Supports</strong></td>
                    <td>Assistance with Daily Life (Sunday)</td>
                    <td>01_014_0107_1_1</td>
                    <td><strong>$118.78 / hr</strong></td>
                  </tr>
                  <tr>
                    <td><strong>Core Supports</strong></td>
                    <td>Assistance with Daily Life (Public Holiday)</td>
                    <td>01_012_0107_1_1</td>
                    <td><strong>$145.44 / hr</strong></td>
                  </tr>
                  <tr>
                    <td><strong>Core Supports</strong></td>
                    <td>Social, Civic & Community Participation (Weekday Daytime)</td>
                    <td>04_104_0125_6_1</td>
                    <td><strong>$65.47 / hr</strong></td>
                  </tr>
                  <tr>
                    <td><strong>Capacity Building</strong></td>
                    <td>Individual Life Skills Development & Training</td>
                    <td>09_009_0117_6_3</td>
                    <td><strong>$74.60 / hr</strong></td>
                  </tr>
                  <tr>
                    <td><strong>Provider Travel</strong></td>
                    <td>Travel to participant location (where agreed, capped at NDIS limits)</td>
                    <td>Per NDIS Guidelines</td>
                    <td>Max 30 mins / $0.96 per km</td>
                  </tr>
                </tbody>
              </table>
              <small className="clauseNote">
                * Rates update automatically in line with National Disability Insurance Agency (NDIA) Annual Price Reviews.
              </small>
            </section>

            {/* Part 3: Responsibilities */}
            <section className="contractSection">
              <h2 className="sectionClauseTitle">Part 3: Responsibilities of the Provider (Opus Care)</h2>
              <ul className="clauseList">
                <li>Provide supports that meet the Participant&apos;s individual needs at the preferred times and locations.</li>
                <li>Treat the Participant, their family, and representatives with dignity, honesty, empathy, and respect.</li>
                <li>Ensure all support workers hold valid National Police Checks, NDIS Worker Screening (NDISWC), and Working with Children Checks (WWCC).</li>
                <li>Maintain comprehensive Public Liability and Personal Accident Insurance across all staff.</li>
                <li>Protect participant privacy and personal information in accordance with the <em>Privacy Act 1988 (Cth)</em> and Australian Privacy Principles.</li>
                <li>Issue clear, compliant tax invoices with accurate hours, line items, and date stamps within 7 days of service.</li>
              </ul>

              <h2 className="sectionClauseTitle" style={{ marginTop: '24px' }}>Part 4: Responsibilities of the Participant</h2>
              <ul className="clauseList">
                <li>Treat Opus Care support workers and office team with dignity and respect.</li>
                <li>Provide a safe and hazard-free environment for in-home service delivery.</li>
                <li>Notify Opus Care promptly if your NDIS plan changes, is suspended, or if funding is depleted.</li>
                <li>Provide appropriate notice if you need to cancel or reschedule a booked shift.</li>
              </ul>
            </section>

            {/* Part 5: Cancellation Policy */}
            <section className="contractSection">
              <h2 className="sectionClauseTitle">Part 5: Cancellation Policy (Short Notice Rules)</h2>
              <p className="clauseText">
                Opus Care operates strictly in accordance with the NDIS Pricing Arrangements Short Notice Cancellation rule:
              </p>
              <div className="calloutRuleBox">
                <strong>Notice Period Required:</strong> If the Participant needs to cancel a scheduled support shift, they must give notice at least <strong>two (2) clear business days</strong> prior to the scheduled start time. Where notice is provided with less than 2 clear business days, the Provider may claim 100% of the agreed shift fee from the Participant&apos;s NDIS plan.
              </div>
            </section>

            {/* Part 6: Feedback & Complaints */}
            <section className="contractSection">
              <h2 className="sectionClauseTitle">Part 6: Feedback, Incidents & Complaints</h2>
              <p className="clauseText">
                We welcome feedback, suggestions, and compliments. If you are not satisfied with any aspect of our service:
              </p>
              <ol className="clauseList">
                <li>Contact our local management team directly by emailing <strong>support@opuscare.com.au</strong>. We aim to acknowledge complaints within one business day and will keep you informed about the review.</li>
                <li>You can also contact an external independent advocate or make a complaint directly to the <strong>NDIS Quality and Safeguards Commission</strong>:
                  <br />Phone: <strong>1800 035 544</strong> (free call) · Web: <strong>ndiscommission.gov.au</strong>
                </li>
              </ol>
            </section>

            {/* Part 7: Signatures Block */}
            <section className="contractSection signaturesBlock">
              <h2 className="sectionClauseTitle">Part 7: Agreement & Signatures</h2>
              <p className="clauseText">
                By signing below, both parties acknowledge and accept the terms and conditions outlined in this NDIS Service Agreement:
              </p>

              <div className="signaturesGrid">
                {/* Participant Box */}
                <div className="sigBox">
                  <h4>Participant or Nominated Representative:</h4>
                  <div className="sigLineWrap">
                    <div className="sigLine" />
                    <span>Signature</span>
                  </div>
                  <div className="sigFieldRow">
                    <span>Full Name: <strong>{participantName || '________________________'}</strong></span>
                  </div>
                  <div className="sigFieldRow">
                    <span>Date: <strong>________________________</strong></span>
                  </div>
                </div>

                {/* Opus Care Box */}
                <div className="sigBox">
                  <h4>Signed on behalf of Opus Care Support Services:</h4>
                  <div className="sigLineWrap">
                    <div className="sigLine" />
                    <span>Authorised Representative Signature</span>
                  </div>
                  <div className="sigFieldRow">
                    <span>Name & Title: <strong>Care Director, Opus Care Support Services</strong></span>
                  </div>
                  <div className="sigFieldRow">
                    <span>Date: <strong>________________________</strong></span>
                  </div>
                </div>
              </div>
            </section>

            <footer className="contractFooterLegal">
              <p>Opus Care Support Services Pty Ltd · NSW North Coast & Northern Rivers · support@opuscare.com.au</p>
              <small>Unregistered NDIS Provider · Supporting Self-Managed and Plan-Managed Participants with Choice & Control</small>
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
