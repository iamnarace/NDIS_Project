import React from 'react';
import { Heart, UserCheck, Home, Users, Shield, CheckCircle2, Sparkles } from 'lucide-react';

interface ValueCard {
  title: string;
  tagline: string;
  description: string;
  icon: React.ReactNode;
}

const VALUES: ValueCard[] = [
  {
    title: 'Compassion',
    tagline: 'Heart in Everything We Do',
    description: 'We treat every participant and family with empathy, genuine warmth, and unconditional dignity.',
    icon: <Heart size={24} />,
  },
  {
    title: 'Empowerment',
    tagline: 'Your Voice, Your Choice',
    description: 'We ensure you remain in full control of your decisions, supports, daily routines, and life direction.',
    icon: <UserCheck size={24} />,
  },
  {
    title: 'Independence',
    tagline: 'Building Real Life Skills',
    description: 'Focusing on capacity building, confidence, and practical mastery so you can thrive on your terms.',
    icon: <Home size={24} />,
  },
  {
    title: 'Community',
    tagline: 'Belonging & Connection',
    description: 'Supporting social outings, hobbies, relationships, and active participation across regional NSW.',
    icon: <Users size={24} />,
  },
  {
    title: 'Safety',
    tagline: 'Protected & Secure Support',
    description: 'Strict adherence to NDIS Quality and Safeguards standards, incident management, and worker screening.',
    icon: <Shield size={24} />,
  },
  {
    title: 'Trust',
    tagline: 'Reliability You Can Count On',
    description: 'Transparent communication, punctual workers, and honest partnership with families and coordinators.',
    icon: <CheckCircle2 size={24} />,
  },
];

export function CoreValuesSection() {
  return (
    <section className="coreValuesControlledSection">
      <div className="shell">
        <div className="sectionHead textCenter">
          <span className="greenCategoryTag">
            <Sparkles size={14} /> GUIDING PRINCIPLES
          </span>
          <h2 className="sectionSerifTitle">Values That Drive Our Support</h2>
          <p className="sectionSubDesc">
            Our core values define the standards our support workers bring to every participant interaction across Northern Rivers NSW.
          </p>
        </div>

        <div className="valuesControlledGrid3">
          {VALUES.map((val) => (
            <div key={val.title} className="controlledCardPane valueCardItem">
              <div className="valueIconCircle">
                {val.icon}
              </div>
              <span className="valueTaglineBadge">{val.tagline}</span>
              <h3>{val.title}</h3>
              <p>{val.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
