import Link from 'next/link';
import { Award, CheckCircle2, Shield, ArrowLeft } from 'lucide-react';
import { SiteHeader } from '../../components/SiteHeader';
import { SiteFooter } from '../../components/SiteFooter';

export default function CodeOfConductPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="pageHero">
          <div className="shell">
            <span className="eyebrow">
              <Award size={15} /> Professional Standards
            </span>
            <h1>NDIS Code of Conduct Commitment</h1>
            <p>
              Opus Care Support Services and all team members operate strictly in accordance with the NDIS Code of Conduct to promote safe, respectful, and ethical support.
            </p>
          </div>
        </section>

        <section className="softSection">
          <div className="shell">
            <div className="policyPaperCard">
              <div className="policySection">
                <h2>Our 7 Core Commitments Under the NDIS Code of Conduct</h2>
                <p>
                  All Opus Care workers, contractors, and management adhere to the 7 statutory principles set out by the NDIS Quality and Safeguards Commission:
                </p>
                <div className="conductGrid">
                  <div className="conductItem">
                    <strong>1. Respect Choice &amp; Self-Determination</strong>
                    <p>Act with respect for individual rights to freedom of expression, self-determination, and decision-making in accordance with relevant laws and conventions.</p>
                  </div>
                  <div className="conductItem">
                    <strong>2. Respect Privacy</strong>
                    <p>Respect the privacy of people with disability in all interactions, record-keeping, and communication.</p>
                  </div>
                  <div className="conductItem">
                    <strong>3. Safe &amp; Competent Support</strong>
                    <p>Provide supports and services in a safe and competent manner, with care and skill.</p>
                  </div>
                  <div className="conductItem">
                    <strong>4. Integrity, Honesty &amp; Transparency</strong>
                    <p>Act with integrity, honesty, and transparency in all financial, service agreement, and delivery matters.</p>
                  </div>
                  <div className="conductItem">
                    <strong>5. Prevent Violence, Abuse &amp; Neglect</strong>
                    <p>Promptly take steps to raise and act on concerns about matters that may impact the quality and safety of supports provided.</p>
                  </div>
                  <div className="conductItem">
                    <strong>6. Prevent Sexual Misconduct</strong>
                    <p>Take all reasonable steps to prevent and respond to all forms of violence, exploitation, neglect, abuse, and sexual misconduct.</p>
                  </div>
                  <div className="conductItem">
                    <strong>7. Zero Hidden Fees</strong>
                    <p>Bill strictly within agreed boundaries and official NDIS price limits with zero exploitation or unauthorized charges.</p>
                  </div>
                </div>
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
