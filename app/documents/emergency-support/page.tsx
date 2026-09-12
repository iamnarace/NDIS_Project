import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SiteHeader } from '../../../components/SiteHeader';
import { SiteFooter } from '../../../components/SiteFooter';
import { ArrowLeft, Phone, AlertTriangle, ShieldCheck, Heart } from 'lucide-react';

export const metadata = {
  title: 'Emergency & Urgent Support Protocol | Opus Care Support Services',
  description: 'Emergency procedures, 000 protocols, mental health crisis contacts, and after-hours escalation for Opus Care participants.',
};

export default function EmergencySupportPage() {
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
                    ABN: 41 267 197 576 · Emergency Support Protocol<br />
                    Supporting Regional Northern NSW &amp; Selected Sydney Areas
                  </p>
                </div>
                <div className="contractBadgeBox">
                  <span className="contractStatusTag" style={{ background: '#FEE2E2', color: '#991B1B' }}>
                    CRITICAL INFORMATION
                  </span>
                  <h1 className="contractMainTitle">EMERGENCY &amp; URGENT SUPPORT</h1>
                  <span className="contractSubTag">Version 2026.1</span>
                </div>
              </div>
            </header>

            <section className="contractSection">
              <div
                style={{
                  background: '#FEF2F2',
                  border: '2px solid #EF4444',
                  borderRadius: 12,
                  padding: '20px 24px',
                  marginBottom: 20,
                }}
              >
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#991B1B', margin: '0 0 8px 0' }}>
                  Immediate Life-Threatening Emergencies: Call 000
                </h2>
                <p style={{ fontSize: 14, color: '#7F1D1D', margin: 0, lineHeight: 1.6 }}>
                  If you or someone in your care is in immediate physical danger, requires an ambulance, or is experiencing a medical crisis, please call <strong>Triple Zero (000)</strong> immediately. Do not wait for an Opus Care coordinator.
                </p>
              </div>
            </section>

            <section className="contractSection">
              <h2 className="sectionClauseTitle">1. 24/7 Crisis &amp; Mental Health Support Lines</h2>
              <p className="clauseText">Free, confidential support is available 24 hours a day, 7 days a week:</p>
              <div className="calloutRuleBox">
                <strong>Lifeline:</strong> 13 11 14 (Mental health crisis &amp; suicide prevention)<br />
                <strong>Beyond Blue:</strong> 1300 22 4636 (Anxiety and depression support)<br />
                <strong>Suicide Call Back Service:</strong> 1300 659 467<br />
                <strong>13YARN:</strong> 13 92 76 (First Nations crisis support line)<br />
                <strong>1800RESPECT:</strong> 1800 737 732 (Domestic, family and sexual violence support)
              </div>
            </section>

            <section className="contractSection">
              <h2 className="sectionClauseTitle">2. Urgent Shift Disruptions &amp; Opus Coordination</h2>
              <p className="clauseText">
                For urgent service delivery issues, worker non-arrival, or same-day support adjustments:
              </p>
              <ul className="clauseList">
                <li><strong>Operating Hours:</strong> Monday – Friday, 8:00 AM – 6:00 PM</li>
                <li><strong>Urgent Coordination Email:</strong> support@opuscare.com.au (monitored for urgent adjustments)</li>
                <li><strong>Response Protocol:</strong> Urgent shift adjustments during business hours are escalated to the on-call coordinator within 2 hours.</li>
              </ul>
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
