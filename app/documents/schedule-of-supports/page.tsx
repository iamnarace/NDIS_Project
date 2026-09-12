import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SiteHeader } from '../../../components/SiteHeader';
import { SiteFooter } from '../../../components/SiteFooter';
import { ArrowLeft, Calendar, FileText, DollarSign, Clock } from 'lucide-react';

export const metadata = {
  title: 'Schedule of Supports | Opus Care Support Services',
  description: 'Official NDIS Schedule of Supports template with 2026-27 price caps and support allocations for Opus Care Support Services.',
};

export default function ScheduleOfSupportsPage() {
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
                  <span className="contractStatusTag">OFFICIAL ATTACHMENT</span>
                  <h1 className="contractMainTitle">SCHEDULE OF SUPPORTS</h1>
                  <span className="contractSubTag">NDIS Catalogue 2026–27</span>
                </div>
              </div>
            </header>

            <section className="contractSection">
              <h2 className="sectionClauseTitle">1. Agreed Support Allocations</h2>
              <p className="clauseText">
                This Schedule of Supports forms an integral part of the NDIS Service Agreement between Opus Care Support Services and the participant. Pricing is strictly capped at official 2026–27 NDIS rates:
              </p>
              <div className="crmTableWrapper" style={{ marginTop: 12 }}>
                <table className="crmTable">
                  <thead>
                    <tr>
                      <th>Line Item Code</th>
                      <th>Support Item Description</th>
                      <th>Agreed Rate</th>
                      <th>Unit</th>
                      <th>GST</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ fontFamily: 'monospace' }}>01_011_0107_1_1</td>
                      <td>Assistance with Self-Care – Weekday Daytime</td>
                      <td>$73.58 / hr</td>
                      <td>Hour</td>
                      <td>N/A (Not Registered)</td>
                    </tr>
                    <tr>
                      <td style={{ fontFamily: 'monospace' }}>04_104_0125_6_1</td>
                      <td>Access Community, Social &amp; Rec – Weekday Daytime</td>
                      <td>$73.58 / hr</td>
                      <td>Hour</td>
                      <td>N/A (Not Registered)</td>
                    </tr>
                    <tr>
                      <td style={{ fontFamily: 'monospace' }}>01_020_0120_1_1</td>
                      <td>House Cleaning and Other Household Activities</td>
                      <td>$60.10 / hr</td>
                      <td>Hour</td>
                      <td>N/A (Not Registered)</td>
                    </tr>
                    <tr>
                      <td style={{ fontFamily: 'monospace' }}>01_019_0120_1_1</td>
                      <td>House or Yard Maintenance</td>
                      <td>$59.01 / hr</td>
                      <td>Hour</td>
                      <td>N/A (Not Registered)</td>
                    </tr>
                    <tr>
                      <td style={{ fontFamily: 'monospace' }}>02_051_0108_1_1</td>
                      <td>Transport (Specialised / Plan-Agreed)</td>
                      <td>Agreed Plan Rate</td>
                      <td>Session</td>
                      <td>N/A (Not Registered)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="contractSection">
              <h2 className="sectionClauseTitle">2. Invoicing &amp; Payment Arrangements</h2>
              <p className="clauseText">
                Invoices are generated following verified shift completion and delivered fortnightly or monthly according to participant preference. Invoices specify individual shift dates, worker names, start/finish times, and itemized quantities.
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
