'use client';

import React, { useState } from 'react';
import { MapPin, CheckCircle2, Search, Sparkles, Navigation, Clock, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

interface RegionData {
  id: string;
  name: string;
  distance: string;
  description: string;
  suburbs: string[];
  intakeStatus: 'Open for Referrals' | 'Active Capacity' | 'Available';
}

const REGIONS: RegionData[] = [
  {
    id: 'yamba-coastal',
    name: 'Yamba & Clarence Mouth',
    distance: '0 – 15 km (Primary Hub)',
    description: 'Immediate daily living, social participation, transport, and community access support throughout Yamba and immediate coastal communities.',
    suburbs: [
      'Yamba (Main Hub)',
      'Angourie',
      'Palmers Island',
      'Iluka (via Ferry/Ferry Link)',
      'Freeburn Island',
      'Micalo Island',
    ],
    intakeStatus: 'Open for Referrals',
  },
  {
    id: 'lower-clarence',
    name: 'Maclean & Lower Clarence',
    distance: '15 – 30 km',
    description: 'Dedicated support for in-home care, hospital appointments, community outings, and skills development across the Maclean and Lower Clarence districts.',
    suburbs: [
      'Maclean',
      'Townsend',
      'Harwood',
      'Woombah',
      'Chatsworth',
      'Lawrence',
      'Brooms Head',
      'Ashby & Ashby Heights',
    ],
    intakeStatus: 'Open for Referrals',
  },
  {
    id: 'grafton-valley',
    name: 'Grafton & Mid Clarence Valley',
    distance: '45 – 60 km',
    description: 'Comprehensive day support, appointment assistance, transport, shopping and recreation across Grafton and surrounding valley townships.',
    suburbs: [
      'Grafton (CBD & West)',
      'South Grafton',
      'Ulmarra',
      'Junction Hill',
      'Clarenza',
      'Coutts Crossing',
      'Swan Creek',
      'Koolkhan',
    ],
    intakeStatus: 'Open for Referrals',
  },
  {
    id: 'richmond-north',
    name: 'New Italy & Richmond Valley South',
    distance: '35 – 55 km (North)',
    description: 'Support connections linking the Lower Clarence up through the historical New Italy and southern Richmond Valley communities.',
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
    intakeStatus: 'Open for Referrals',
  },
  {
    id: 'southern-beaches',
    name: 'Southern Beaches & Yuraygir Coast',
    distance: '30 – 55 km (South)',
    description: 'Flexible coastal support for nature outings, independent living, and local transport along the Yuraygir and Corindi coastal strip.',
    suburbs: [
      'Wooli',
      'Minnie Water',
      'Corindi Beach',
      'Red Rock',
      'Pillar Valley',
      'Tucabia',
    ],
    intakeStatus: 'Open for Referrals',
  },
];

export function RegionalCoverageChecker() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>(REGIONS[0].id);

  const activeRegion = REGIONS.find((r) => r.id === selectedRegion) || REGIONS[0];

  // Global search match
  const searchMatches = searchQuery.trim() === ''
    ? []
    : REGIONS.flatMap((region) =>
        region.suburbs
          .filter((suburb) => suburb.toLowerCase().includes(searchQuery.toLowerCase().trim()))
          .map((suburb) => ({ suburb, regionName: region.name, distance: region.distance }))
      );

  return (
    <section className="coverageCardWrapper">
      <div className="coverageHeaderBlock">
        <div className="coverageEyebrow">
          <MapPin size={15} />
          <span>Local Service Footprint · Northern Rivers &amp; Clarence Coast NSW</span>
        </div>
        <h2 className="coverageTitle">CarePoint Service Coverage Around Yamba &amp; Beyond</h2>
        <p className="coverageSubtitle">
          Headquartered from <strong>Yamba</strong>, we deliver dependable, person-centred disability support across a <strong>50–60 km radius</strong>—including Maclean, Iluka, Grafton, New Italy, Woodburn, Evans Head, and surrounding coastal and valley communities.
        </p>
      </div>

      {/* Quick Suburb Search Box */}
      <div className="coverageSearchBox">
        <Search size={18} className="searchIcon" />
        <input
          type="text"
          placeholder="Type your town or suburb (e.g. Yamba, Grafton, Maclean, New Italy, Evans Head)..."
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

      {/* Search Results Display */}
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
                      <span className="searchDistPill">{m.distance}</span>
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
                <strong>Location not listed?</strong> If you live within ~60 km of Yamba, Grafton, or the Northern Rivers, please contact us directly. We frequently accommodate custom travel and support schedules.
              </p>
              <Link href="/contact" className="button secondary inlineSearchBtn">
                Ask About Your Area
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
            <span className="tabDist">{region.distance}</span>
          </button>
        ))}
      </div>

      {/* Active Region Display Card */}
      <div className="activeRegionPanel">
        <div className="regionPanelHeader">
          <div>
            <div className="regionStatusRow">
              <span className="statusBadgeGreen">🟢 {activeRegion.intakeStatus}</span>
              <span className="radiusBadge">📍 Radius: {activeRegion.distance}</span>
            </div>
            <h3 className="regionDetailTitle">{activeRegion.name}</h3>
            <p className="regionDetailDesc">{activeRegion.description}</p>
          </div>
          <div className="regionCtaCol">
            <Link href="/referral" className="button primary regionReferBtn">
              Refer in This Region
            </Link>
          </div>
        </div>

        <div className="suburbsListBlock">
          <span className="suburbsListLabel">Towns &amp; Communities Covered:</span>
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
            <span>Flexible Weekday &amp; Weekend Shift Hours</span>
          </div>
          <div className="trustItem">
            <ShieldCheck size={15} color="#0FA3A3" />
            <span>NDIS Pricing Guidelines Travel Compliant</span>
          </div>
        </div>
      </div>
    </section>
  );
}
