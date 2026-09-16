'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';

type PathKey = 'participant' | 'current' | 'family' | 'professional';

type Path = {
  label: string;
  image: string;
  imageAlt: string;
  question: string;
  options: string[];
  href: string;
  action: string;
};

const paths: Record<PathKey, Path> = {
  participant: {
    label: "I'm looking for disability support for myself",
    image: '/images/ndis-community-walk.jpg',
    imageAlt: 'Participant and support worker enjoying a community walk',
    question: 'What kind of support would help you most?',
    options: [
      'Help with daily life at home',
      'Getting out, appointments and community activities',
      'Building confidence and independent living skills',
      "I'm not sure where to start",
    ],
    href: '/referral?source=guided-participant',
    action: 'Start my intake',
  },
  current: {
    label: 'I already receive disability support',
    image: '/images/ndis-care-moment.jpg',
    imageAlt: 'A warm everyday disability support moment',
    question: 'What would you like help with?',
    options: [
      'Changing or adding to my current supports',
      'Finding a provider that feels like a better fit',
      'Getting help with my Opus Care portal',
      'Talking with the Opus Care team',
    ],
    href: '/contact?source=guided-current-support',
    action: 'Contact our team',
  },
  family: {
    label: "I'm a family member, nominee or carer",
    image: '/images/ndis-gardening-support.jpg',
    imageAlt: 'Participant enjoying an outdoor activity with support',
    question: 'How can we help you and the person you support?',
    options: [
      'Explore available support options',
      'Make a referral for someone',
      'Understand how getting started works',
      'Speak with someone before deciding',
    ],
    href: '/referral?source=guided-family',
    action: 'Make a referral',
  },
  professional: {
    label: "I'm a support coordinator or professional",
    image: '/opus-care-regional-support.webp',
    imageAlt: 'Opus Care regional disability support',
    question: 'What do you need from Opus Care?',
    options: [
      'Refer a participant',
      'Check service availability in a participant’s area',
      'Discuss compatibility and support requirements',
      'Request information before referring',
    ],
    href: '/referral?source=guided-professional',
    action: 'Open professional referral',
  },
};

export function HomeGuidedEntry() {
  const [selectedPath, setSelectedPath] = useState<PathKey | null>(null);
  const [selectedNeed, setSelectedNeed] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const path = selectedPath ? paths[selectedPath] : null;

  useEffect(() => {
    if (!path) return;
    closeButtonRef.current?.focus();
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [path]);

  function openPath(key: PathKey) {
    setSelectedPath(key);
    setSelectedNeed('');
    setStep(1);
  }

  function closePath() {
    setSelectedPath(null);
    setSelectedNeed('');
    setStep(1);
  }

  return (
    <>
      <section className="macEntrySection" aria-labelledby="mac-entry-title">
        <div className="shell macEntryShell">
          <p className="macEntryEyebrow">Welcome to Opus Care Support Services</p>
          <h1 id="mac-entry-title" className="macEntryTitle">
            Helping you find the right disability support, every step of the way
          </h1>
          <p className="macEntryIntro">
            Whether you are looking for support for yourself, helping someone you care for, or making a professional referral, choose a card below and we will guide you to the right place.
          </p>

          <div className="macAudienceGrid">
            {(Object.entries(paths) as [PathKey, Path][]).map(([key, item]) => (
              <button key={key} type="button" className="macAudienceCard" onClick={() => openPath(key)}>
                <span className="macAudienceImage">
                  <Image src={item.image} alt={item.imageAlt} fill sizes="(max-width: 760px) 100vw, 25vw" />
                </span>
                <span className="macAudienceLabel">
                  <span>{item.label}</span>
                  <span className="macAudienceArrow" aria-hidden="true">
                    <ArrowRight size={19} />
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {path && (
        <div className="macGuideLayer" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closePath();
        }}>
          <section className="macGuidePanel" role="dialog" aria-modal="true" aria-labelledby="mac-guide-title">
            <header className="macGuideHeader">
              <span>Step {step} of 2</span>
              <button ref={closeButtonRef} type="button" onClick={closePath} aria-label="Close guide"><X size={24} /></button>
            </header>

            <div className="macGuideBody">
              {step === 1 ? (
                <>
                  <p className="macGuideContext">{path.label}</p>
                  <h2 id="mac-guide-title">{path.question}</h2>
                  <p className="macGuideHelp">Choose the answer that fits best. You can still speak with us if you are unsure.</p>
                  <fieldset className="macGuideOptions">
                    <legend className="srOnly">Choose one option</legend>
                    {path.options.map((option) => (
                      <label key={option} className={selectedNeed === option ? 'selected' : ''}>
                        <input type="radio" name="guided-need" value={option} checked={selectedNeed === option} onChange={() => setSelectedNeed(option)} />
                        <span className="macRadioMark">{selectedNeed === option && <Check size={16} />}</span>
                        <span>{option}</span>
                      </label>
                    ))}
                  </fieldset>
                </>
              ) : (
                <>
                  <p className="macGuideContext">Your suggested next step</p>
                  <h2 id="mac-guide-title">Let’s connect you with the right team</h2>
                  <div className="macGuideResult">
                    <Check size={22} />
                    <div><strong>You selected</strong><p>{selectedNeed}</p></div>
                  </div>
                  <p className="macGuideHelp">Continue to Opus Care’s existing secure form. Your answer here has not been saved or sent.</p>
                </>
              )}
            </div>

            <footer className="macGuideFooter">
              {step === 2 && <button type="button" className="macGuideBack" onClick={() => setStep(1)}><ArrowLeft size={17} /> Back</button>}
              {step === 1 ? (
                <button type="button" className="macGuideNext" disabled={!selectedNeed} onClick={() => setStep(2)}>Next <ArrowRight size={17} /></button>
              ) : (
                <Link className="macGuideNext" href={`${path.href}&need=${encodeURIComponent(selectedNeed)}`}>{path.action} <ArrowRight size={17} /></Link>
              )}
            </footer>
          </section>
        </div>
      )}
    </>
  );
}
