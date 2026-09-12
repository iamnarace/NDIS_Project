import React from 'react';
import Link from 'next/link';
import { SiteHeader } from '../../components/SiteHeader';
import { SiteFooter } from '../../components/SiteFooter';
import {
  FileText,
  FileCheck2,
  Shield,
  Download,
  ArrowRight,
  Printer,
  Lock,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

export const metadata = {
  title: 'NDIS Client Documents & Agreements | Opus Care Support Services',
  description: 'Access official NDIS Service Agreements, Participant Onboarding Packs, Schedule of Supports, and Consent documents for Opus Care Support Services.'
};

const DOCUMENTS = [
  {
    id: 'service-agreement',
    title: 'NDIS Service Agreement',
    category: 'Official Contract',
    tag: 'Ready to Fill & Sign',
    tagColor: '#059669',
    tagBg: '#ECFDF5',
    desc: 'Our standard, legally compliant Australian NDIS Service Agreement between Opus Care Support Services and the participant. Sets out rights, pricing limits, cancellation policies, and agreed supports.',
    href: '/documents/service-agreement',
    icon: FileText
  },
  {
    id: 'schedule-of-supports',
    title: 'Schedule of Supports',
    category: 'Official Contract',
    tag: '2026–27 Catalogue',
    tagColor: '#0284C7',
    tagBg: '#E0F2FE',
    desc: 'Tailored support item allocations, hourly rates strictly capped at 2026-27 NDIS price limits, and claiming schedules.',
    href: '/documents/schedule-of-supports',
    icon: FileText
  },
  {
    id: 'pricing-travel-cancellation',
    title: 'Pricing, Travel & Cancellation Policy',
    category: 'Finance & Pricing',
    tag: 'NDIS Price Limits',
    tagColor: '#0284C7',
    tagBg: '#E0F2FE',
    desc: 'Clear breakdown of hourly line-item rates across Weekday Daytime ($73.58/hr), evenings, weekends, travel rules, and the 2-clear-business-days cancellation policy.',
    href: '/documents/pricing-travel-cancellation',
    icon: Shield
  },
  {
    id: 'privacy-notice',
    title: 'Privacy Collection Notice & Handling',
    category: 'Privacy & Governance',
    tag: 'Privacy Act 1988',
    tagColor: '#059669',
    tagBg: '#ECFDF5',
    desc: 'How Opus Care collects, protects, uses, and retains your personal and sensitive data under the Australian Privacy Principles.',
    href: '/privacy',
    icon: Lock
  },
  {
    id: 'rights-and-responsibilities',
    title: 'Participant Charter of Rights & Responsibilities',
    category: 'Quality & Safeguarding',
    tag: 'Choice & Control',
    tagColor: '#7C3AED',
    tagBg: '#F3E8FF',
    desc: 'Your fundamental rights to dignity, autonomy, independent advocacy, freedom from abuse, and participant responsibilities.',
    href: '/documents/rights-and-responsibilities',
    icon: Shield
  },
  {
    id: 'complaints-feedback',
    title: 'Complaints, Feedback & Dispute Resolution',
    category: 'Quality & Safeguarding',
    tag: 'Fair & Protected',
    tagColor: '#D97706',
    tagBg: '#FEF3C7',
    desc: 'How to share feedback, raise concerns, and escalate complaints internally or to the NDIS Quality & Safeguards Commission without fear of retribution.',
    href: '/complaints',
    icon: FileCheck2
  },
  {
    id: 'incident-safeguarding',
    title: 'Incident Management & Safeguarding Information',
    category: 'Quality & Safeguarding',
    tag: 'Safety & Protection',
    tagColor: '#DC2626',
    tagBg: '#FEE2E2',
    desc: 'Our zero-tolerance approach to abuse and neglect, incident reporting procedures, and immediate support protocols.',
    href: '/incident-management',
    icon: Shield
  },
  {
    id: 'welcome-pack',
    title: 'Participant Welcome & Onboarding Pack',
    category: 'Client Handbook',
    tag: 'Essential Reading',
    tagColor: '#7C3AED',
    tagBg: '#F3E8FF',
    desc: 'A comprehensive handbook for new participants and family carers explaining worker matching, care coordination, and service standards.',
    href: '/documents/welcome-pack',
    icon: FileCheck2
  },
  {
    id: 'emergency-support',
    title: 'Emergency & Urgent Support Protocol',
    category: 'Safety & Emergency',
    tag: 'Critical Care',
    tagColor: '#DC2626',
    tagBg: '#FEE2E2',
    desc: '000 emergency escalation, 24/7 mental health crisis contacts (Lifeline 13 11 14, Beyond Blue), and urgent shift disruption contacts.',
    href: '/documents/emergency-support',
    icon: AlertTriangle
  },
  {
    id: 'exit-transition',
    title: 'Service Exit & Transition Policy',
    category: 'Client Lifecycle',
    tag: 'Fair Transition',
    tagColor: '#059669',
    tagBg: '#ECFDF5',
    desc: '14-day notice terms, unhindered exit rights, continuity of care, and orderly transfer of progress records.',
    href: '/documents/exit-transition',
    icon: FileText
  },
  {
    id: 'information-sharing',
    title: 'Information Sharing Authority',
    category: 'Privacy & Governance',
    tag: 'Consent Instrument',
    tagColor: '#7C3AED',
    tagBg: '#F3E8FF',
    desc: 'Consent instrument authorising information sharing with Plan Managers, Support Coordinators, and treating health practitioners.',
    href: '/documents/information-sharing',
    icon: Lock
  }
];

export default function DocumentsHubPage() {
  return (
    <>
      <SiteHeader />
      <main className="docHubMain">
        <section className="docHubHero">
          <div className="shell">
            <div className="docHubHeroCenter">
              <span className="greenCategoryTag">
                <Sparkles size={14} /> CLIENT & COORDINATOR HUB
              </span>
              <h1 className="sectionSerifTitle">NDIS Client Documents & Contract Templates</h1>
              <p className="sectionSubDesc">
                Download, review, or fill out our official onboarding documentation. Compliant with Australian consumer law and the NDIS Quality & Safeguards Commission.
              </p>
            </div>
          </div>
        </section>

        <section className="docHubGridSection">
          <div className="shell">
            <div className="docCardsGrid">
              {DOCUMENTS.map((doc) => {
                const Icon = doc.icon;
                return (
                  <div key={doc.id} className="docCardItem">
                    <div className="docCardTop">
                      <div className="docIconWrap">
                        <Icon size={28} />
                      </div>
                      <span
                        className="docTagPill"
                        style={{ color: doc.tagColor, backgroundColor: doc.tagBg }}
                      >
                        {doc.tag}
                      </span>
                    </div>

                    <span className="docCategory">{doc.category}</span>
                    <h2 className="docTitle">{doc.title}</h2>
                    <p className="docDesc">{doc.desc}</p>

                    <div className="docActionRow">
                      <Link href={doc.href} className="heroPillBtn filled sm">
                        <span>Open Document</span>
                        <ArrowRight size={15} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="docAssistanceBanner">
              <div>
                <h3>Need a customized Schedule of Supports?</h3>
                <p>Support coordinators and plan managers can request tailored line-item schedules directly.</p>
              </div>
              <a href="mailto:support@opuscare.com.au" className="heroPillBtn outline">
                <span>Email support@opuscare.com.au</span>
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
