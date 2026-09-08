'use client';

import { useState } from 'react';
import { MapPin, Search, CheckCircle2, ArrowRight, Sparkles, Navigation } from 'lucide-react';
import Link from 'next/link';

import { REGIONS, MAJOR_LOCATIONS } from '../lib/regions';

export function RegionalCoverageChecker() {
  const [activeRegion, setActiveRegion] = useState<string>('clarence-valley');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const current = REGIONS.find(r => r.id === activeRegion) || REGIONS[1];

  const allSuburbs = REGIONS.flatMap(r => r.suburbs.map(s => ({ suburb: s, region: r.name })));
  const searchResults = searchTerm.trim() 
    ? allSuburbs.filter(item => item.suburb.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  const majorLocations = MAJOR_LOCATIONS;

  return (
    <div className="coverageCardWrapper">
      <div className="coverageCardHeader">
        <div className="coverageBadgeRow">
          <span className="coverageBadge"><MapPin size={15} /> NSW North Coast & Northern Rivers</span>
          <span className="coveragePill">🟢 Taking Referrals Across All Hubs</span>
        </div>
        <h3 className="coverageTitle">Supporting participants across the NSW North Coast and Northern Rivers</h3>
        <p className="coverageSubtitle">
          Opus Care Support Services provides person-centred disability support from Coffs Harbour through the Clarence Valley, Richmond Valley and Lismore region to Ballina, including surrounding towns and communities.
        </p>

        {/* Clean Major Locations Strip */}
        <div className="majorLocationsStrip">
          <span className="majorLocationsLabel">Major Locations:</span>
          <div className="majorLocationsFlow">
            {majorLocations.map((loc, idx) => (
              <span key={loc} className="locFlowItem">
                <strong>{loc}</strong>
                {idx < majorLocations.length - 1 && <span className="locArrow">→</span>}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Suburb Search */}
      <div className="coverageSearchBox">
        <div className="searchInputWrap">
          <Search size={18} className="searchIcon" />
          <input
            type="text"
            placeholder="Type your town or suburb (e.g. Coffs Harbour, Yamba, Lismore, Ballina)..."
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
                <p>Don&apos;t see your specific locality? We regularly support participants in surrounding rural and coastal properties.</p>
                <Link href="/contact" className="button primary sm">
                  <span>Enquire for Your Location</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Region Tabs */}
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

      {/* Active Region Panel */}
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
            {current.suburbs.map((sub, idx) => (
              <span key={idx} className="suburbChip">
                <CheckCircle2 size={13} className="chipCheck" />
                {sub}
              </span>
            ))}
          </div>
        </div>

        <div className="regionActionFooter">
          <Link href="/service-areas" className="viewAllAreasLink">
            <span>Explore Complete Suburb & Town Directory</span>
            <ArrowRight size={14} />
          </Link>
          <Link href="/referral" className="button primary sm regionReferBtn">
            <span>Start Intake in {current.name.split('/')[0]}</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default RegionalCoverageChecker;
