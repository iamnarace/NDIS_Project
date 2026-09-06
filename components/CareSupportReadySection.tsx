import React from 'react';
import Link from 'next/link';
import { 
  Utensils, 
  Sparkles, 
  Soup, 
  Car, 
  HeartHandshake, 
  HeartPulse, 
  Compass, 
  Sunrise,
  ArrowRight
} from 'lucide-react';

interface SupportActivityItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  accentBg: string;
  accentColor: string;
}

const SUPPORT_ACTIVITIES: SupportActivityItem[] = [
  {
    id: 'cooking',
    title: 'Cooking',
    description: 'Preparing fresh, wholesome meals tailored to your taste and diet',
    icon: <Utensils size={36} />,
    accentBg: '#E0F2F1',
    accentColor: '#00897B'
  },
  {
    id: 'domestic-assistance',
    title: 'Domestic assistance',
    description: 'Help with general housework, laundry, and maintaining a comfortable home',
    icon: <Sparkles size={36} />,
    accentBg: '#E8F5E9',
    accentColor: '#2E7D32'
  },
  {
    id: 'meal-preparation',
    title: 'Meal preparation',
    description: 'Weekly grocery shopping, meal planning, and nutritious batch cooking',
    icon: <Soup size={36} />,
    accentBg: '#FFF3E0',
    accentColor: '#E65100'
  },
  {
    id: 'out-and-about',
    title: 'Getting out and about',
    description: 'Safe transport to doctor visits, appointments, shopping, and local errands',
    icon: <Car size={36} />,
    accentBg: '#E1F5FE',
    accentColor: '#0288D1'
  },
  {
    id: 'social-support',
    title: 'Social support and companionship',
    description: 'Catching up for coffee, exploring hobbies, and engaging with the community',
    icon: <HeartHandshake size={36} />,
    accentBg: '#F3E5F5',
    accentColor: '#7B1FA2'
  },
  {
    id: 'personal-care',
    title: 'Personal care',
    description: 'Respectful, dignified assistance with daily hygiene, grooming, and mobility',
    icon: <HeartPulse size={36} />,
    accentBg: '#FCE4EC',
    accentColor: '#C2185B'
  },
  {
    id: 'independent-life',
    title: 'Maintain an independent life',
    description: 'Empowering goal coaching, practical life skills, and building self-confidence',
    icon: <Compass size={36} />,
    accentBg: '#E8EAF6',
    accentColor: '#3949AB'
  },
  {
    id: 'morning-evening-routines',
    title: 'Help with morning and evening routines',
    description: 'Calm, dependable support helping you start and end each day smoothly',
    icon: <Sunrise size={36} />,
    accentBg: '#FFF8E1',
    accentColor: '#F57F17'
  }
];

export function CareSupportReadySection() {
  return (
    <section className="careSupportReadySection">
      <div className="shell">
        <div className="sectionHeaderCenter">
          <span className="greenCategoryTag">EVERYDAY ASSISTANCE</span>
          <h2 className="sectionSerifTitle">Care and support workers are ready to help you with</h2>
          <p className="sectionSubDesc">
            Tailored 1-on-1 support for self-managed and plan-managed participants across Northern NSW.
          </p>
        </div>

        <div className="careCirclesGrid">
          {SUPPORT_ACTIVITIES.map((activity) => (
            <div key={activity.id} className="careCircleCard">
              <div 
                className="careCircleBadge" 
                style={{ backgroundColor: activity.accentBg, color: activity.accentColor }}
              >
                {activity.icon}
              </div>
              <h3 className="careCircleTitle">{activity.title}</h3>
              <p className="careCircleDesc">{activity.description}</p>
            </div>
          ))}
        </div>

        <div className="careReadyBottomCta">
          <div className="careReadyBottomBox">
            <div className="careReadyBottomText">
              <h4>Need assistance with something specific?</h4>
              <p>Every care plan is uniquely tailored. Tell us what matters most to your daily routine.</p>
            </div>
            <div className="careReadyBottomActions">
              <Link href="/referral" className="heroPillBtn filled">
                <span>Request a Support Worker</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
