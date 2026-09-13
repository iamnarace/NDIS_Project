import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SiteHeader } from '../../../components/SiteHeader';
import { SiteFooter } from '../../../components/SiteFooter';
import { ArrowLeft, ShieldCheck, DollarSign, Clock, Car, AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'Pricing, Travel & Cancellation Policy | Opus Care Support Services',
  description: 'Official NDIS pricing schedule, provider travel rules, and short-notice cancellation policy for Opus Care Support Services.',
};

export default function PricingTravelCancellationPage() {
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
                    ABN: 41 267 197 576<br />
                    Supporting Self-Managed and Plan-Managed Participants
                  </p>
                </div>
                <div className="contractBadgeBox">
                  <span className="contractStatusTag">OFFICIAL SCHEDULE</span>
                  <h1 className="contractMainTitle">PRICING, TRAVEL &amp; CANCELLATIONS</h1>
                  <span className="contractSubTag">NDIS Pricing Arrangements 2026–27</span>
                </div>
              </div>
            </header>

            <section className="contractSection">
              <h2 className="sectionClauseTitle">1. Core Support Pricing Limits (2026–27)</h2>
              <p className="clauseText">
                Opus Care Support Services delivers support strictly adhering to the maximum price limits set out in the official NDIS Pricing Arrangements and Price Limits 2026–27. We never charge above the gazetted NDIS price cap. GST has not been charged – supplier is not registered for GST.
              </p>
              <div className="crmTableWrapper" style={{ marginTop: 12 }}>
                <table className="crmTable">
                  <thead>
                    <tr>
                      <th>Service Category</th>
                      <th>Support Item Description</th>
                      <th>Rate Limit</th>
                      <th>Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>01_011_0107_1_1</td>
                      <td>Assistance with Self-Care – Weekday Daytime</td>
                      <td>$73.58</td>
                      <td>Hour</td>
                    </tr>
                    <tr>
                      <td>01_015_0107_1_1</td>
                      <td>Assistance with Self-Care – Weekday Evening</td>
                      <td>$81.07</td>
                      <td>Hour</td>
                    </tr>
                    <tr>
                      <td>01_013_0107_1_1</td>
                      <td>Assistance with Self-Care – Saturday</td>
                      <td>$103.54</td>
                      <td>Hour</td>
                    </tr>
                    <tr>
                      <td>01_014_0107_1_1</td>
                      <td>Assistance with Self-Care – Sunday</td>
                      <td>$133.50</td>
                      <td>Hour</td>
                    </tr>
                    <tr>
                      <td>01_012_0107_1_1</td>
                      <td>Assistance with Self-Care – Public Holiday</td>
                      <td>$163.46</td>
                      <td>Hour</td>
                    </tr>
                    <tr>
                      <td>04_104_0125_6_1</td>
                      <td>Access Community, Social &amp; Rec – Weekday Daytime</td>
                      <td>$73.58</td>
                      <td>Hour</td>
                    </tr>
                    <tr>
                      <td>01_020_0120_1_1</td>
                      <td>House Cleaning &amp; Other Household Activities</td>
                      <td>$60.10</td>
                      <td>Hour</td>
                    </tr>
                    <tr>
                      <td>01_019_0120_1_1</td>
                      <td>House or Yard Maintenance</td>
                      <td>$59.01</td>
                      <td>Hour</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="contractSection">
              <h2 className="sectionClauseTitle">2. Travel &amp; Transport Policy</h2>
              <p className="clauseText">
                Travel claiming is strictly governed under official NDIS rules and distinguished between labour and non-labour costs:
              </p>
              <ul className="clauseList">
                <li><strong>Provider Travel (Labour):</strong> Where agreed in advance in the Schedule of Supports, travel time to deliver supports in MMM1–3 regional locations may be claimed up to the NDIS maximum (30 minutes in metropolitan areas, up to 60 minutes in non-metropolitan zones).</li>
                <li><strong>Activity Based Transport (Non-Labour):</strong> When a support worker transports a participant during a support session in a private or company vehicle, vehicle running costs may be claimed as agreed in the Schedule of Supports (e.g. up to $1.00/km for standard vehicles, in addition to the worker hourly support rate).</li>
                <li><strong>Separation from Employee Reimbursement:</strong> Client transport billing under the NDIS Support Catalogue is distinct from employee internal mileage reimbursement.</li>
              </ul>
            </section>

            <section className="contractSection">
              <h2 className="sectionClauseTitle">3. Short-Notice Cancellation Policy</h2>
              <p className="clauseText">
                Under NDIS pricing arrangements, cancellation rules are governed by the relevant support schedule and agreed Service Agreement terms. A cancellation is considered a <strong>Short-Notice Cancellation</strong> where the participant cancels without the notice required under their agreed support schedule.
              </p>
              <div className="calloutRuleBox">
                <strong>Cancellation Terms:</strong><br />
                • <strong>Timely Notice:</strong> Where timely notice is provided in accordance with the agreed schedule prior to the shift, no cancellation fee applies.<br />
                • <strong>Short-Notice Claims:</strong> Where notice is provided after the required cut-off (or where a participant is not present at the agreed location), Opus Care may claim up to 100% of the agreed fee for the scheduled hours from the participant&apos;s plan, provided the worker cannot be reasonably reassigned to other duties.<br />
                • <strong>Mitigation Duty:</strong> Opus Care actively makes every reasonable effort to find alternative productive duties or reassign workers to avoid charging cancellation fees whenever possible.
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
