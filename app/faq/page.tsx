'use client';

import { useState } from 'react';
import { HelpCircle, ChevronDown, Shield, Sparkles, ArrowRight, CheckCircle2, Phone, Mail } from 'lucide-react';
import Link from 'next/link';
import { SiteHeader } from '../../components/SiteHeader';
import { SiteFooter } from '../../components/SiteFooter';
import { FundingTransparencyCard } from '../../components/FundingTransparencyCard';
import { ResourceBrochures } from '../../components/ResourceBrochures';

interface FaqItem {
  id: string;
  question: string;
  category: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    id: 'who-can-use',
    question: 'Who can use Opus Care Support Services?',
    category: 'Eligibility & Intake',
    answer: 'Opus Care provides personalised disability supports for self-managed and plan-managed NDIS participants across Yamba, Maclean, Grafton, Iluka, New Italy, Woodburn, Evans Head, and surrounding Northern Rivers communities. Fit, compatibility, and availability are confirmed during our friendly initial onboarding chat.',
  },
  {
    id: 'provider-status',
    question: 'Are you a registered or unregistered NDIS provider?',
    category: 'NDIS Registration',
    answer: 'Opus Care operates as an unregistered provider under the NDIS framework. We maintain strict compliance with the NDIS Quality and Safeguards Commission and the NDIS Code of Conduct. As an unregistered provider, we work directly with self-managed and plan-managed participants, ensuring personalised matching with zero corporate administrative overhead.',
  },
  {
    id: 'hourly-rates',
    question: 'How are your hourly rates determined?',
    category: 'Pricing & Billing',
    answer: 'All our hourly rates strictly adhere to the official NDIS Pricing Arrangements and Price Limits for standard 1-on-1 Core (Assistance with Daily Living, Social & Community Participation) and Capacity Building supports. All rates, travel, and cancellation terms are documented upfront in your service agreement with zero hidden fees or exit charges.',
  },
  {
    id: 'turnaround-time',
    question: 'How quickly can support start after making a referral?',
    category: 'Service Start',
    answer: 'We review and respond to all referrals within 24 business hours. Following an initial discussion of your needs, confirming support worker availability, and signing an agreed service agreement, support can commence within 3 to 7 business days.',
  },
  {
    id: 'worker-checks',
    question: 'What qualifications and clearances do your support workers hold?',
    category: 'Safety & Compliance',
    answer: 'All Opus Care support workers hold verified NDIS Worker Screening Check (NWSC) clearances, Working With Children Checks (WWCC), current First Aid & CPR certifications, comprehensive vehicle insurance, and adhere strictly to the NDIS Code of Conduct.',
  },
  {
    id: 'cancellation-policy',
    question: 'What is your cancellation and reschedule policy?',
    category: 'Policies',
    answer: 'Our cancellation policy strictly complies with standard NDIS pricing guidelines (at least 2 clear business days notice for short-notice cancellations). We always work flexibly with participants and families to reschedule shifts whenever reasonably possible.',
  },
];

export default function FaqPage() {
  const [openIds, setOpenIds] = useState<string[]>(['who-can-use']);

  const toggleFaq = (id: string) => {
    setOpenIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <>
      <SiteHeader />
      <main className="faqMainWrapper">
        {/* Page Hero */}
        <section className="faqHeroSection">
          <div className="shell">
            <div className="faqHeroCenter">
              <span className="greenCategoryTag">
                <HelpCircle size={14} /> CLARITY &amp; TRANSPARENCY
              </span>
              <h1 className="sectionSerifTitle">Frequently Asked Questions &amp; Pricing</h1>
              <p className="sectionSubDesc">
                Find clear, straightforward answers regarding our NDIS support services, pricing limits, billing, matching process, and regional coverage across Northern Rivers NSW.
              </p>
            </div>
          </div>
        </section>

        {/* Controlled Accordion Card Panes */}
        <section className="faqAccordionSection">
          <div className="shell">
            <div className="faqAccordionContainer">
              {FAQS.map((faq) => {
                const isOpen = openIds.includes(faq.id);
                return (
                  <div
                    key={faq.id}
                    className={`controlledCardPane faqAccordionCard ${isOpen ? 'active' : ''}`}
                  >
                    <button
                      type="button"
                      className="faqQuestionBtn"
                      onClick={() => toggleFaq(faq.id)}
                      aria-expanded={isOpen}
                    >
                      <div className="faqQuestionContent">
                        <span className="faqCategoryBadge">{faq.category}</span>
                        <h3>{faq.question}</h3>
                      </div>
                      <div className={`faqChevronIcon ${isOpen ? 'rotated' : ''}`}>
                        <ChevronDown size={20} />
                      </div>
                    </button>

                    {isOpen && (
                      <div className="faqAnswerPane">
                        <p>{faq.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Funding Transparency Controlled Panes */}
        <section className="fundingSectionWrap">
          <div className="shell">
            <FundingTransparencyCard />
          </div>
        </section>

        {/* Resource Brochures */}
        <section className="brochuresSectionWrap">
          <div className="shell">
            <ResourceBrochures />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
