'use client';

import { useState } from 'react';
import { MapPin, Search, CheckCircle2, Navigation, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface Region {
  id: string;
  name: string;
  badge: string;
  suburbs: string[];
  description: string;
}

const REGIONS: Region[] = [
  {
    id: 'clarence-coast',
    name: 'Clarence Coast & Lower Clarence',
    badge: 'Primary Coastal Hub',
    suburbs: [
      'Yamba', 'Maclean', 'Iluka', 'Angourie', 'Townsend', 
      'Harwood', 'Woombah', 'Palmers Island', 'Brooms Head', 'Ashby'
    ],
    description: 'Our primary coastal service hub with immediate daily support worker capacity.'
  },
  {
    id: 'grafton-valley',
    name: 'Grafton & Clarence Valley',
    badge: 'Valley Service Area',
    suburbs: [
      'Grafton', 'South Grafton', 'Ulmarra', 'Junction Hill', 
      'Lawrence', 'Coutts Crossing', 'Clarenza'
    ],
    description: 'Regular weekday and weekend support worker rounds connecting community & home.'
  },
  {
    id: 'richmond-north',
    name: 'Richmond Valley & North Coast',
    badge: 'North Coast Area',
    suburbs: [
      'New Italy', 'Woodburn', 'Evans Head', 'Broadwater', 'Coraki'
    ],
    description: 'Tailored community access and in-home routines across the southern Richmond corridor.'
  },
  {
    id: 'southern-coastal',
    name: 'Southern Coastal Communities',
    badge: 'Extended Coastal',
    suburbs: [
      'Wooli', 'Minnie Water', 'Corindi Beach', 'Red Rock'
    ],
    description: 'Scheduled visits for community participation, respite and social outings.'
  }
];

export function RegionalCoverageChecker() {
  const [activeRegion, setActiveRegion] = useState<string>('clarence-coast');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const current = REGIONS.find(r => r.id === activeRegion) || REGIONS[0];

  const allSuburbs = REGIONS.flatMap(r => r.suburbs.map(s => ({ suburb: s, region: r.name })));
  const searchResults = searchTerm.trim() 
    ? allSuburbs.filter(item => item.suburb.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  return (
    <div className="coverageCardWrapper">
      <div className="coverageCardHeader">
        <div className="coverageBadgeRow">
          <span className="coverageBadge"><MapPin size={15} /> Local NSW Coverage</span>
          <span className="coveragePill">🟢 Taking Referrals in All Listed Suburbs</span>
        </div>
        <h3 className="coverageTitle">Clarence Coast &amp; Northern Rivers Footprint</h3>
        <p className="coverageSubtitle">
          Select your region or search your suburb to verify immediate support availability with Opus Care.
        </p>
      </div>

      <div className="coverageSearchBox">
        <div className="searchInputWrap">
          <Search size={18} className="searchIcon" />
          <input
            type="text"
            placeholder="Type your suburb (e.g. Yamba, Maclean, Grafton, New Italy)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="suburbSearchInput"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="clearSearchBtn">✕</button>
          )}
        </div>

        {searchTerm.trim() && (
          <div className="searchResultsPanel">
            {searchResults.length > 0 ? (
              <div className="searchResultGrid">
                {searchResults.map((item, idx) => (
                  <div key={idx} className="searchResultItem">
                    <CheckCircle2 size={16} className="matchCheck" />
                    <span className="matchSuburb">{item.suburb}</span>
                    <span className="matchRegion">({item.region})</span>
                    <span className="matchStatus">✓ Active Service Area</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="noSearchResult">
                <p>Don&apos;t see your specific town listed? We frequently accommodate participants in neighbouring rural properties.</p>
                <Link href="/contact" className="button primary sm">
                  <span>Enquire for Your Location</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="regionTabsNav">
        {REGIONS.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setActiveRegion(r.id)}
            className={`regionTabBtn ${activeRegion === r.id ? 'active' : ''}`}
          >
            <span className="regionName">{r.name}</span>
          </button>
        ))}
      </div>

      <div className="activeRegionPanel">
        <div className="regionPanelHeader">
          <div>
            <h4>{current.name}</h4>
            <p className="regionDesc">{current.description}</p>
          </div>
          <span className="regionBadgePill">{current.badge}</span>
        </div>

        <div className="suburbChipsContainer">
          <span className="chipsLabel">Covered Localities:</span>
          <div className="suburbChipsList">
            {current.suburbs.map((sub, i) => (
              <span key={i} className="suburbChip">
                <CheckCircle2 size={13} className="chipCheck" />
                {sub}
              </span>
            ))}
          </div>
        </div>

        <div className="regionActionFooter">
          <div className="regionProof">
            <ShieldCheck size={16} />
            <span>Zero hidden travel surcharges for scheduled core routes</span>
          </div>
          <Link href="/referral" className="button primary sm regionReferBtn">
            <span>Start Intake in {current.name.split('&')[0]}</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
