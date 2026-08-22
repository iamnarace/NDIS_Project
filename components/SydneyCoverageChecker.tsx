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
    region: 'Western Sydney',
    status: 'Open for Referrals',
    suburbs: ['Parramatta', 'Blacktown', 'Penrith', 'Westmead', 'Merrylands', 'Auburn', 'Seven Hills', 'Mount Druitt'],
    keyHighlights: 'Daily living, transport to Westmead health precinct, community social outings'
  },
  {
    region: 'South West Sydney',
    status: 'Open for Referrals',
    suburbs: ['Liverpool', 'Campbelltown', 'Bankstown', 'Cabramatta', 'Fairfield', 'Casula', 'Ingleburn'],
    keyHighlights: 'Community sports, appointment transport, grocery & routine support'
  },
  {
    region: 'Inner West & Canterbury',
    status: 'Active Capacity',
    suburbs: ['Strathfield', 'Burwood', 'Ashfield', 'Marrickville', 'Campsie', 'Newtown', 'Leichhardt'],
    keyHighlights: 'Public transport training, social connection, cafe & arts outings'
  },
  {
    region: 'Hills District & North West',
    status: 'Open for Referrals',
    suburbs: ['Castle Hill', 'Baulkham Hills', 'Rouse Hill', 'Kellyville', 'Bella Vista', 'Norwest'],
    keyHighlights: 'Independent living capacity, shopping assistance, park walks & activities'
  },
  {
    region: 'Ryde & Northern Suburbs',
    status: 'Active Capacity',
    suburbs: ['Ryde', 'Macquarie Park', 'Epping', 'Eastwood', 'Hornsby', 'Pennant Hills'],
    keyHighlights: 'University/TAFE study assistance, community recreation, evening routines'
  },
  {
    region: 'Sydney City & Eastern Suburbs',
    status: 'Accepting Waitlist',
    suburbs: ['Sydney CBD', 'Redfern', 'Surry Hills', 'Bondi Junction', 'Randwick', 'Maroubra'],
    keyHighlights: 'Tailored community access & weekend social support'
  },
];

export function SydneyCoverageChecker() {
  const [selectedRegion, setSelectedRegion] = useState<string>('Western Sydney');
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
          <span className="coverageBadge"><MapPin size={15} /> Local Greater Sydney Provider</span>
          <span className="statusLive">🟢 Taking New Referrals</span>
        </div>
        <h3>Check Support Availability in Your Suburb</h3>
        <p>CarePoint provides dependable, local disability support workers across Sydney neighbourhoods.</p>
      </div>

      {/* Suburb Quick Search */}
      <div className="suburbSearchBox">
        <Search size={18} className="searchIcon" />
        <input
          type="text"
          placeholder="Type your Sydney suburb (e.g. Parramatta, Liverpool, Castle Hill)..."
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
              <p>We provide flexible travel across most of Greater Sydney. If your suburb isn’t listed, send us a quick enquiry!</p>
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
