import Link from 'next/link';
import { Shield, Lock, FileText, ArrowLeft } from 'lucide-react';
import { SiteHeader } from '../../components/SiteHeader';
import { SiteFooter } from '../../components/SiteFooter';

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="pageHero">
          <div className="shell">
            <span className="eyebrow">
              <Shield size={15} /> Privacy &amp; Governance
            </span>
            <h1>Privacy Policy &amp; Information Handling</h1>
            <p>
              How CarePoint Support Services collects, manages, and protects personal and sensitive participant information in accordance with the Privacy Act 1988 (Cth) and Australian Privacy Principles.
            </p>
          </div>
        </section>

        <section className="softSection">
          <div className="shell">
            <div className="policyPaperCard">
              <div className="policySection">
                <h2>1. Commitment to Participant Privacy</h2>
                <p>
                  CarePoint Support Services respects and upholds the privacy rights of all NDIS participants, families, carers, and staff. We only collect personal information reasonably necessary to assess support needs, deliver tailored disability services, ensure participant safety, and fulfill statutory obligations.
                </p>
              </div>

              <div className="policySection">
                <h2>2. Types of Information Collected</h2>
                <p>Information collected may include:</p>
                <ul>
                  <li>Contact details (name, address, phone number, email)</li>
                  <li>NDIS plan details, funding management type, and plan dates</li>
                  <li>Emergency contact details and appointed nominees/guardians</li>
                  <li>Support preferences, daily routines, and personal goals</li>
                  <li>Relevant health, medical, or behavioural support information necessary for safe support delivery</li>
                </ul>
              </div>

              <div className="policySection">
                <h2>3. How We Use and Protect Your Data</h2>
                <p>
                  Your information is stored securely on protected systems with restricted role-based access. We do not sell or disclose your personal information to third parties without your explicit informed consent, unless required or authorised by Australian law.
                </p>
              </div>

              <div className="policySection">
                <h2>4. Accessing and Correcting Your Information</h2>
                <p>
                  You have the right to request access to any personal information we hold about you and to request corrections if any details are inaccurate or out of date. Contact our Privacy Officer at <strong>support@carepointsupport.com.au</strong>.
                </p>
              </div>

              <div style={{ marginTop: '32px' }}>
                <Link className="button secondary" href="/">
                  <ArrowLeft size={16} /> Return to Homepage
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
