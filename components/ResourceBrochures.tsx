'use client';

import { useState } from 'react';
import { FileText, Download, CheckCircle, ArrowRight, Shield, BookOpen, Star, Sparkles, X } from 'lucide-react';
import Link from 'next/link';

interface BrochureItem {
  id: string;
  title: string;
  category: string;
  audience: string;
  pages: string;
  description: string;
  highlights: string[];
  badgeColor: string;
}

const BROCHURES: BrochureItem[] = [
  {
    id: 'welcome-pack',
    title: 'Participant & Family Welcome Handbook',
    category: 'Welcome Guide',
    audience: 'NDIS Participants & Families',
    pages: '8 Pages · PDF',
    description: 'An easy-to-read guide outlining how 1-on-1 support works, how we match support workers, communication standards, and our person-centred philosophy.',
    highlights: ['Getting started checklist', 'Our matching process', 'Rights & choices', 'Emergency & cancellation policy'],
    badgeColor: '#0D9488'
  },
  {
    id: 'coordinator-kit',
    title: 'Support Coordinator & Plan Manager Referral Kit',
    category: 'Professional Kit',
    audience: 'Coordinators & Plan Managers',
    pages: '6 Pages · PDF',
    description: 'Detailed service catalogue, standard NDIS support item line codes, invoice turnaround commitments, and direct intake workflow.',
    highlights: ['NDIS line item mapping', 'No exit or joining fees', '24h referral turnaround', 'Clear progress reporting'],
    badgeColor: '#D97706'
  },
  {
    id: 'rights-feedback',
    title: 'Participant Rights, Privacy & Feedback Guide',
    category: 'Compliance & Safety',
    audience: 'All Participants',
    pages: '4 Pages · Easy English',
    description: 'Plain-language booklet detailing privacy protections, how to provide feedback or complaints, and the NDIS Code of Conduct commitment.',
    highlights: ['NDIS Code of Conduct', 'How to raise concerns', 'Privacy & data protection', 'NDIS Commission contacts'],
    badgeColor: '#2563EB'
  },
];

export function ResourceBrochures() {
  const [activeModal, setActiveModal] = useState<BrochureItem | null>(null);
  const [requestedEmail, setRequestedEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setActiveModal(null);
      setRequestedEmail('');
    }, 3000);
  };

  return (
    <div className="resourceBrochuresContainer">
      <div className="sectionHead">
        <span className="eyebrow"><BookOpen size={16} /> Information &amp; Resources</span>
        <h2>Information Packs &amp; Participant Guides</h2>
        <p>Download or review our clear, transparent guides designed for NDIS participants, families, and referring coordinators.</p>
      </div>

      <div className="brochuresGrid">
        {BROCHURES.map(item => (
          <article key={item.id} className="brochureCard">
            {/* Visual Header / Cover preview */}
            <div className="brochureCoverPreview">
              <div className="brochureSpine" />
              <div className="brochureCoverBody">
                <span className="brochureBadge" style={{ background: item.badgeColor }}>
                  {item.category}
                </span>
                <h4 className="coverTitle">{item.title}</h4>
                <div className="coverFooter">
                  <span>CarePoint Support Services</span>
                  <small>{item.pages}</small>
                </div>
              </div>
            </div>

            {/* Card Content */}
            <div className="brochureCardBody">
              <span className="audiencePill">{item.audience}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>

              <div className="highlightsList">
                <strong>Inside this guide:</strong>
                <ul>
                  {item.highlights.map(h => (
                    <li key={h}><CheckCircle size={13} color="#0D9488" /> {h}</li>
                  ))}
                </ul>
              </div>

              <div className="brochureActions">
                <button
                  type="button"
                  className="button full secondary"
                  onClick={() => setActiveModal(item)}
                >
                  <Download size={16} /> Request PDF Copy
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Interactive Preview / Request Modal */}
      {activeModal && (
        <div className="modalBackdrop" onClick={() => setActiveModal(null)}>
          <div className="modalCard" onClick={e => e.stopPropagation()}>
            <button className="modalCloseBtn" onClick={() => setActiveModal(null)}>
              <X size={20} />
            </button>

            <div className="modalHeader">
              <span className="brochureBadge" style={{ background: activeModal.badgeColor }}>
                {activeModal.category}
              </span>
              <h3>{activeModal.title}</h3>
              <p>{activeModal.description}</p>
            </div>

            {submitted ? (
              <div className="modalSuccessState">
                <CheckCircle size={40} color="#0D9488" />
                <h4>Guide Requested!</h4>
                <p>A copy of <strong>{activeModal.title}</strong> has been sent to <strong>{requestedEmail}</strong>.</p>
              </div>
            ) : (
              <form onSubmit={handleRequest} className="modalForm">
                <label className="inputLabel">
                  <span>Where should we email your free PDF copy?</span>
                  <input
                    required
                    type="email"
                    className="crispInput"
                    placeholder="Enter your email address..."
                    value={requestedEmail}
                    onChange={e => setRequestedEmail(e.target.value)}
                  />
                </label>
                <button type="submit" className="button full">
                  Send PDF to My Email <ArrowRight size={16} />
                </button>
                <small className="modalPrivacy">No spam. We will only send this requested resource.</small>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
