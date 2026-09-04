import Link from 'next/link';
import { MessageSquare, HeartHandshake, ShieldCheck, ArrowLeft } from 'lucide-react';
import { SiteHeader } from '../../components/SiteHeader';
import { SiteFooter } from '../../components/SiteFooter';

export default function ComplaintsPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="pageHero">
          <div className="shell">
            <span className="eyebrow">
              <MessageSquare size={15} /> Feedback &amp; Continuous Improvement
            </span>
            <h1>Complaints, Compliments &amp; Feedback</h1>
            <p>
              You have the right to give feedback and make complaints at any time without fear of negative consequences. We welcome your input to continuously improve our support.
            </p>
          </div>
        </section>

        <section className="softSection">
          <div className="shell">
            <div className="policyPaperCard">
              <div className="policySection">
                <h2>1. Our Open Feedback Philosophy</h2>
                <p>
                  At Opus Care Support Services, we view feedback and complaints as valuable opportunities to learn, adapt, and enhance our services. Anyone — including participants, family members, advocates, and support coordinators — can lodge a complaint or share feedback.
                </p>
              </div>

              <div className="policySection">
                <h2>2. How to Raise Feedback or a Concern</h2>
                <p>You can share your thoughts with us in any way you feel most comfortable:</p>
                <ul>
                  <li><strong>Email:</strong> Send a message to <em>support@opuscare.com.au</em></li>
                  <li><strong>Direct Conversation:</strong> Speak openly with your support worker or Opus Care coordinator</li>
                  <li><strong>Advocacy Support:</strong> You are welcome to have an independent advocate, family member, or friend assist you throughout the process</li>
                </ul>
              </div>

              <div className="policySection">
                <h2>3. How We Handle Complaints</h2>
                <p>
                  We acknowledge all complaints within 24 hours (1 business day), treat your concerns with confidentiality and respect, investigate the matter thoroughly, and provide you with a written outcome and proposed resolution within 10 business days.
                </p>
              </div>

              <div className="policySection">
                <h2>4. External Escalation: NDIS Commission</h2>
                <p>
                  If you are not satisfied with how your complaint has been handled, you have the right to contact the independent <strong>NDIS Quality and Safeguards Commission</strong> directly at <strong>1800 035 544</strong> or via <strong>ndiscommission.gov.au</strong>.
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
