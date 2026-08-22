import React from 'react';
import { Heart, UserCheck, Home, Users, Shield, CheckCircle } from 'lucide-react';

interface ValueCard {
  title: string;
  tagline: string;
  description: string;
  themeColor: string;
  bgTint: string;
  icon: React.ReactNode;
}

const VALUES: ValueCard[] = [
  {
    title: 'Compassion',
    tagline: 'Heart in Everything We Do',
    description: 'We treat every participant and family with empathy, genuine warmth, and unconditional dignity.',
    themeColor: '#6D2C91',
    bgTint: 'rgba(109, 44, 145, 0.08)',
    icon: <Heart size={28} color="#6D2C91" />,
  },
  {
    title: 'Empowerment',
    tagline: 'Your Voice, Your Choice',
    description: 'We ensure you remain in full control of your decisions, supports, daily routines, and life direction.',
    themeColor: '#10B981',
    bgTint: 'rgba(16, 185, 129, 0.08)',
    icon: <UserCheck size={28} color="#10B981" />,
  },
  {
    title: 'Independence',
    tagline: 'Building Real Life Skills',
    description: 'Focusing on capacity building, confidence, and practical mastery so you can thrive on your terms.',
    themeColor: '#0FA3A3',
    bgTint: 'rgba(15, 163, 163, 0.08)',
    icon: <Home size={28} color="#0FA3A3" />,
  },
  {
    title: 'Community',
    tagline: 'Belonging & Connection',
    description: 'Facilitating active social outings, hobbies, peer networks, and community participation across Sydney.',
    themeColor: '#0D3B46',
    bgTint: 'rgba(13, 59, 70, 0.08)',
    icon: <Users size={28} color="#0D3B46" />,
  },
  {
    title: 'Safety',
    tagline: 'Protected & Secure Support',
    description: 'Strict adherence to NDIS Quality and Safeguards standards, incident management, and worker screening.',
    themeColor: '#6D2C91',
    bgTint: 'rgba(109, 44, 145, 0.08)',
    icon: <Shield size={28} color="#6D2C91" />,
  },
  {
    title: 'Trust',
    tagline: 'Reliability You Can Count On',
    description: 'Transparent communication, punctual workers, and honest partnership with families and coordinators.',
    themeColor: '#10B981',
    bgTint: 'rgba(16, 185, 129, 0.08)',
    icon: <CheckCircle size={28} color="#10B981" />,
  },
];

export function CoreValuesSection() {
  return (
    <section className="coreValuesSection">
      <div className="shell">
        <div className="sectionHead textCenter">
          <span className="eyebrow">Our Guiding Principles</span>
          <h2 className="sectionTitle">Values Grounded in Real Care</h2>
          <p className="sectionSubtitle">
            Every shift, every conversation, and every support plan is built upon six foundational pillars.
          </p>
        </div>

        <div className="valuesGrid">
          {VALUES.map((val) => (
            <div key={val.title} className="valueCard" style={{ borderTop: `4px solid ${val.themeColor}` }}>
              <div className="valueIconCircle" style={{ backgroundColor: val.bgTint }}>
                {val.icon}
              </div>
              <h3 className="valueCardTitle" style={{ color: val.themeColor }}>{val.title}</h3>
              <div className="valueTagline">{val.tagline}</div>
              <p className="valueDesc">{val.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
