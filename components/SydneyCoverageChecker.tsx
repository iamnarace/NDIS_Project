'use client';

import { useState } from 'react';
import { MapPin, CheckCircle, Clock, Search, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface RegionData {
  region: string;
  status: 'Open for Referrals' | 'Active Capacity' | 'Accepting Waitlist';
  suburbs: string[];
  keyHighlights: string;
}

const REGIONS: RegionData[] = [
  {
    region: 'Northern Rivers',
    status: 'Open for Referrals',
    suburbs: ['Ballina', 'Lennox Head', 'Alstonville', 'Wardell', 'Woodburn', 'Evans Head', 'Casino', 'Lismore'],
    keyHighlights: 'Daily living, local appointments, community access and social outings'
  },
  {
    region: 'Clarence Valley',
    status: 'Open for Referrals',
    suburbs: ['Grafton', 'Maclean', 'Yamba', 'Iluka', 'Lawrence', 'Ulmarra', 'South Grafton'],
    keyHighlights: 'Community sports, appointment transport, grocery & routine support'
  },
  {
    region: 'Richmond Valley',
    status: 'Active Capacity',
    suburbs: ['Casino', 'Coraki', 'Evans Head', 'Woodburn', 'Broadwater', 'Rappville'],
    keyHighlights: 'Public transport training, social connection, cafe & arts outings'
  },
  {
    region: 'Lower Clarence Coast',
    status: 'Open for Referrals',
    suburbs: ['Yamba', 'Maclean', 'Iluka', 'Harwood', 'Palmers Island', 'Woombah'],
    keyHighlights: 'Independent living capacity, shopping assistance, park walks & activities'
  },
  {
    region: 'Mid North Coast',
    status: 'Active Capacity',
    suburbs: ['Nambucca Heads', 'Macksville', 'Urunga', 'Bellingen', 'Sawtell', 'Toormina'],
    keyHighlights: 'University/TAFE study assistance, community recreation, evening routines'
  },
  {
    region: 'Coffs Coast',
    status: 'Accepting Waitlist',
    suburbs: ['Coffs Harbour', 'Woolgoolga', 'Sawtell', 'Toormina', 'Nambucca Heads', 'Urunga'],
    keyHighlights: 'Tailored community access & weekend social support'
  },
];

export function SydneyCoverageChecker() {
  const [selectedRegion, setSelectedRegion] = useState<string>('Northern Rivers');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const currentRegion = REGIONS.find(r => r.region === selectedRegion) || REGIONS[0];

  const filteredRegions = searchQuery.trim()
    ? REGIONS.filter(r =>
        r.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.suburbs.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  return (
    <div className="coverageCheckerCard">
      <div className="coverageHeader">
        <div className="badgeRow">
          <span className="coverageBadge"><MapPin size={15} /> Regional NSW Support</span>
          <span className="statusLive">🟢 Taking New Referrals</span>
        </div>
        <h3>Check Support Availability in Your Suburb</h3>
        <p>Opus Care provides person-centred disability support along the regional NSW Pacific Highway corridor.</p>
      </div>

      {/* Suburb Quick Search */}
      <div className="suburbSearchBox">
        <Search size={18} className="searchIcon" />
        <input
          type="text"
          placeholder="Type your suburb (e.g. Ballina, Grafton, Coffs Harbour)..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="suburbSearchInput"
        />
      </div>

      {searchQuery.trim() ? (
        <div className="searchResultsBox">
          {filteredRegions.length > 0 ? (
            filteredRegions.map(r => (
              <div key={r.region} className="searchResultRow">
                <div className="searchResultHeader">
                  <strong>{r.region}</strong>
                  <span className="availBadge"><CheckCircle size={14} /> {r.status}</span>
                </div>
                <div className="suburbTagsList">
                  {r.suburbs.map(sub => (
                    <span key={sub} className="suburbTag active">{sub}</span>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="noResultsFound">
              <p>We cover communities from Ballina through the Clarence Valley to Coffs Harbour, subject to worker availability and agreed travel. If your town is not listed, please enquire.</p>
              <Link className="button small" href="/referral">Enquire for your area <ArrowRight size={15} /></Link>
            </div>
          )}
        </div>
      ) : (
        <div className="regionTabsContainer">
          {/* Region Buttons */}
          <div className="regionTabsList">
            {REGIONS.map(r => (
              <button
                type="button"
                key={r.region}
                className={`regionTabBtn ${selectedRegion === r.region ? 'activeRegionTab' : ''}`}
                onClick={() => setSelectedRegion(r.region)}
              >
                <span>{r.region}</span>
                <small>{r.suburbs.length} suburbs</small>
              </button>
            ))}
          </div>

          {/* Region Details Display */}
          <div className="regionDetailsPanel">
            <div className="panelTop">
              <div>
                <span className="panelSubTitle">Selected Coverage Area</span>
                <h4>{currentRegion.region}</h4>
              </div>
              <span className="availStatusPill">
                <CheckCircle size={14} color="#0D9488" /> {currentRegion.status}
              </span>
            </div>

            <p className="highlightText"><strong>Focus Areas:</strong> {currentRegion.keyHighlights}</p>

            <div className="suburbsGrid">
              {currentRegion.suburbs.map(s => (
                <div key={s} className="suburbChip">
                  <MapPin size={13} color="#0D9488" />
                  <span>{s}</span>
                </div>
              ))}
            </div>

            <div className="panelBottomCta">
              <span>Ready for support in {currentRegion.region}?</span>
              <Link className="button small" href="/referral">
                Start Intake in {currentRegion.region} <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
