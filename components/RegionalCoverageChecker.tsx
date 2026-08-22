'use client';

import React, { useState } from 'react';
import { MapPin, CheckCircle2, Search, Sparkles, Navigation, Clock, ShieldCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface RegionData {
  id: string;
  name: string;
  badge: string;
  description: string;
  suburbs: string[];
}

const REGIONS: RegionData[] = [
  {
    id: 'clarence-coast',
    name: 'Clarence Coast & Lower Clarence',
    badge: 'Coastal & Riverfront',
    description: 'Providing daily living, social participation, transport, and in-home support throughout Yamba, Maclean, Iluka and coastal communities.',
    suburbs: [
      'Yamba',
      'Maclean',
      'Iluka',
      'Angourie',
      'Townsend',
      'Harwood',
      'Woombah',
      'Palmers Island',
      'Brooms Head',
      'Ashby & Ashby Heights',
      'Chatsworth Island',
    ],
  },
  {
    id: 'grafton-valley',
    name: 'Grafton & Clarence Valley',
    badge: 'Valley & Central',
    description: 'Dedicated support for in-home assistance, social outings, appointments, shopping, and life skills across Grafton and the valley.',
    suburbs: [
      'Grafton',
      'South Grafton',
      'Ulmarra',
      'Junction Hill',
      'Lawrence',
      'Coutts Crossing',
      'Clarenza',
      'Swan Creek',
      'Koolkhan',
    ],
  },
  {
    id: 'richmond-valley',
    name: 'Richmond Valley & North Coast',
    badge: 'Northern Connection',
    description: 'Support connections linking the Clarence up through New Italy, Woodburn, Evans Head and surrounding communities.',
    suburbs: [
      'New Italy',
      'Woodburn',
      'Evans Head',
      'Broadwater',
      'Coraki',
      'Swan Bay',
      'Tabbimoble',
      'Bungawalbin',
    ],
  },
  {
    id: 'southern-beaches',
    name: 'Southern Coastal Communities',
    badge: 'Coastal Villages',
    description: 'Flexible support for community access, independent living, and local outings along the southern coastal strip.',
    suburbs: [
      'Wooli',
      'Minnie Water',
      'Corindi Beach',
      'Red Rock',
      'Pillar Valley',
      'Tucabia',
    ],
  },
];

export function RegionalCoverageChecker() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>(REGIONS[0].id);

  const activeRegion = REGIONS.find((r) => r.id === selectedRegion) || REGIONS[0];

  // Search match
  const searchMatches = searchQuery.trim() === ''
    ? []
    : REGIONS.flatMap((region) =>
        region.suburbs
          .filter((suburb) => suburb.toLowerCase().includes(searchQuery.toLowerCase().trim()))
          .map((suburb) => ({ suburb, regionName: region.name, badge: region.badge }))
      );

  return (
    <div className="coverageCardWrapper">
      <div className="coverageHeaderBlock">
        <div className="coverageEyebrow">
          <MapPin size={15} />
          <span>Local Community Service Coverage</span>
        </div>
        <h2 className="coverageTitle">Service Areas &amp; Locations Covered</h2>
        <p className="coverageSubtitle">
          We provide dependable, person-centred disability support across the <strong>Clarence Coast, Grafton, New Italy, and Northern Rivers NSW</strong>. Select a region or search your suburb below:
        </p>
      </div>

      {/* Suburb Search */}
      <div className="coverageSearchBox">
        <Search size={18} className="searchIcon" />
        <input
          type="text"
          placeholder="Search your town or suburb (e.g. Yamba, Grafton, Maclean, New Italy, Evans Head, Iluka)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="coverageSearchInput"
          aria-label="Search town or suburb"
        />
        {searchQuery && (
          <button className="clearSearchBtn" onClick={() => setSearchQuery('')}>
            Clear
          </button>
        )}
      </div>

      {/* Live Search Results */}
      {searchQuery.trim() !== '' && (
        <div className="searchResultsPanel">
          {searchMatches.length > 0 ? (
            <div>
              <p className="searchResultHeading">
                ✅ <strong>{searchMatches.length} Service Area{searchMatches.length > 1 ? 's' : ''} Found:</strong>
              </p>
              <div className="searchResultGrid">
                {searchMatches.map((m, i) => (
                  <div key={i} className="searchResultCard">
                    <div className="searchResultTop">
                      <span className="searchSubName">{m.suburb}</span>
                      <span className="searchDistPill">{m.badge}</span>
                    </div>
                    <span className="searchRegionName">Part of {m.regionName}</span>
                    <span className="searchStatusGreen">🟢 Open for Referrals</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="searchNoResult">
              <p>
                <strong>Don&apos;t see your specific town?</strong> We frequently support nearby surrounding localities across the region. Please get in touch to confirm availability.
              </p>
              <Link href="/contact" className="button secondary inlineSearchBtn">
                Contact Us About Your Area
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Region Selector Tabs */}
      <div className="regionTabsStrip" role="tablist">
        {REGIONS.map((region) => (
          <button
            key={region.id}
            role="tab"
            aria-selected={selectedRegion === region.id}
            className={`regionTabBtn ${selectedRegion === region.id ? 'active' : ''}`}
            onClick={() => {
              setSelectedRegion(region.id);
              setSearchQuery('');
            }}
          >
            <span className="tabName">{region.name}</span>
            <span className="tabDist">{region.badge}</span>
          </button>
        ))}
      </div>

      {/* Active Region Panel */}
      <div className="activeRegionPanel">
        <div className="regionPanelHeader">
          <div>
            <div className="regionStatusRow">
              <span className="statusBadgeGreen">🟢 Open for Referrals</span>
              <span className="radiusBadge">📍 {activeRegion.badge}</span>
            </div>
            <h3 className="regionDetailTitle">{activeRegion.name}</h3>
            <p className="regionDetailDesc">{activeRegion.description}</p>
          </div>
          <div className="regionCtaCol">
            <Link href="/referral" className="button primary regionReferBtn">
              Start a Referral in This Area <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className="suburbsListBlock">
          <span className="suburbsListLabel">Towns &amp; Suburbs Included:</span>
          <div className="suburbChipsList">
            {activeRegion.suburbs.map((suburb) => (
              <span key={suburb} className="suburbChip">
                <CheckCircle2 size={13} color="#0D9488" />
                {suburb}
              </span>
            ))}
          </div>
        </div>

        <div className="regionFooterTrustRow">
          <div className="trustItem">
            <Navigation size={15} color="#0FA3A3" />
            <span>Local Support Workers Based in Clarence Coast &amp; Northern Rivers</span>
          </div>
          <div className="trustItem">
            <Clock size={15} color="#0FA3A3" />
            <span>Flexible Weekday &amp; Weekend Schedule Options</span>
          </div>
          <div className="trustItem">
            <ShieldCheck size={15} color="#0FA3A3" />
            <span>NDIS Price Limit Aligned</span>
          </div>
        </div>
      </div>
    </div>
  );
}
