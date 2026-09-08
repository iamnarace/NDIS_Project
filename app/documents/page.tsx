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
  Sparkles
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
    desc: 'Our standard, legally compliant Australian NDIS Service Agreement between Opus Care Support Services Pty Ltd and the participant. Sets out rights, pricing limits, cancellation policies, and agreed supports.',
    href: '/documents/service-agreement',
    icon: FileText
  },
  {
    id: 'welcome-pack',
    title: 'Participant Welcome & Onboarding Pack',
    category: 'Client Handbook',
    tag: 'Essential Reading',
    tagColor: '#7C3AED',
    tagBg: '#F3E8FF',
    desc: 'A comprehensive handbook for new participants and family carers. Explains how worker matching works, participant charter of rights, incident escalation, and quality standards.',
    href: '/documents/welcome-pack',
    icon: FileCheck2
  },
  {
    id: 'pricing-schedule',
    title: 'Schedule of Supports & Pricing Rates',
    category: 'Financial Guide',
    tag: 'NDIS Price Limits',
    tagColor: '#0284C7',
    tagBg: '#E0F2FE',
    desc: 'Clear breakdown of hourly line-item rates across Weekday Daytime ($65.47/hr), Weekday Evening, Saturday, Sunday, and Public Holidays strictly aligned with the NDIS Support Catalogue.',
    href: '/faq#pricing',
    icon: Shield
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
