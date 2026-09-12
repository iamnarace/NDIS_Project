import { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, CheckCircle2, ArrowRight, ShieldCheck, Mail, Sparkles, Navigation } from 'lucide-react';
import SiteHeader from '../../components/SiteHeader';
import SiteFooter from '../../components/SiteFooter';
import { REGIONS } from '../../lib/regions';

export const metadata: Metadata = {
  title: 'Areas We Serve | NDIS Support Coffs Harbour, Grafton, Yamba, Lismore & Ballina',
  description: 'Opus Care provides person-centred disability support across the NSW North Coast and Northern Rivers: Coffs Harbour, Woolgoolga, Grafton, Maclean, Yamba, Casino, Evans Head, Lismore, Alstonville, Lennox Head, Ballina and surrounding communities.',
  keywords: [
    'NDIS support Coffs Harbour',
    'disability support Grafton',
    'NDIS support Yamba',
    'support worker Casino',
    'NDIS provider Lismore',
    'disability support Ballina',
    'NDIS support Maclean',
    'support worker Lennox Head',
    'Northern Rivers NDIS provider',
    'NSW North Coast disability care'
  ]
};

export default function ServiceAreasPage() {
  const majorLocations = [
    'Coffs Harbour', 'Woolgoolga', 'Grafton', 'Maclean', 'Yamba',
    'Casino', 'Lismore', 'Alstonville', 'Lennox Head', 'Ballina'
  ];

  return (
    <>
      <SiteHeader />

      <main className="serviceAreasMainWrap">
        {/* Page Hero */}
        <section className="serviceAreasHero">
          <div className="shell">
            <div className="areasHeroCenter">
              <span className="greenCategoryTag">
                <MapPin size={14} /> NSW NORTH COAST & NORTHERN RIVERS
              </span>
              <h1 className="sectionSerifTitle">
                Supporting participants across the NSW North Coast and Northern Rivers
              </h1>
              <p className="sectionSubDesc">
                Opus Care Support Services provides person-centred disability support from Coffs Harbour through the Clarence Valley, Richmond Valley and Lismore region to Ballina, including surrounding towns and communities.
              </p>
              <p style={{ fontSize: '0.9rem', color: '#64748b', fontStyle: 'italic', marginTop: '8px' }}>
                Service availability depends on location, participant requirements and current worker capacity.
              </p>

              {/* Major Locations Ticker */}
              <div className="majorLocationsStrip centeredStrip">
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
          </div>
        </section>

        {/* Complete 5-Region Detailed Directory */}
        <section className="cleanSectionPadding">
          <div className="shell">
            <div className="areasDirectoryGrid">
              {REGIONS.map((region, idx) => (
                <div key={region.id} className="controlledCardPane regionDirectoryCard">
                  <div className="regionDirHeader">
                    <div className="dirIconWrap">
                      <MapPin size={22} />
                    </div>
                    <div>
                      <span className="dirSuperBadge">{region.badge}</span>
                      <h2>{region.name}</h2>
                    </div>
                  </div>

                  <p className="regionDirDesc">{region.description}</p>

                  <div className="keyHubsRow">
                    <span className="hubsLabel">Key Hubs:</span>
                    <div className="hubsPills">
                      {region.majorTowns.map(town => (
                        <span key={town} className="hubPill">{town}</span>
                      ))}
                    </div>
                  </div>

                  <div className="allSuburbsSection">
                    <span className="suburbsListLabel">Covered Suburbs & Localities:</span>
                    <div className="suburbsPillsWrap">
                      {region.suburbs.map(sub => (
                        <span key={sub} className="suburbTag">
                          <CheckCircle2 size={13} className="subCheckIcon" />
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="dirCardFooter">
                    <Link href={`/referral?region=${region.id}`} className="heroPillBtn filled sm">
                      <span>Start Intake in {region.name.split('/')[0]}</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ))}

              {/* Sydney Operational Service Corridor */}
              <div className="controlledCardPane regionDirectoryCard">
                <div className="regionDirHeader">
                  <div className="dirIconWrap">
                    <MapPin size={22} />
                  </div>
                  <div>
                    <span className="dirSuperBadge">Sydney Hub</span>
                    <h2>Sydney Metropolitan &amp; Western Sydney</h2>
                  </div>
                </div>

                <p className="regionDirDesc">
                  Selected operational support coverage across metropolitan and Western Sydney hubs. Service availability depends on location, participant requirements and current worker capacity.
                </p>

                <div className="keyHubsRow">
                  <span className="hubsLabel">Key Hubs:</span>
                  <div className="hubsPills">
                    <span className="hubPill">Blacktown</span>
                    <span className="hubPill">Parramatta</span>
                    <span className="hubPill">Western Sydney</span>
                    <span className="hubPill">Sydney CBD</span>
                    <span className="hubPill">Redfern</span>
                  </div>
                </div>

                <div className="allSuburbsSection">
                  <span className="suburbsListLabel">Operational Localities (By Arrangement):</span>
                  <div className="suburbsPillsWrap">
                    {['Blacktown', 'Parramatta', 'Western Sydney', 'Sydney CBD', 'Redfern', 'Penrith', 'Liverpool', 'Strathfield', 'Auburn', 'Burwood', 'Westmead', 'Granville', 'Ryde'].map(sub => (
                      <span key={sub} className="suburbTag">
                        <CheckCircle2 size={13} className="subCheckIcon" />
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="dirCardFooter">
                  <Link href="/referral" className="heroPillBtn filled sm">
                    <span>Start Intake in Sydney</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>

            {/* Location Consultation Callout */}
            <div className="controlledCardPane locationEnquiryBanner">
              <div className="enquiryBannerText">
                <h3>Not sure whether Opus Care services your specific location?</h3>
                <p>
                  We regularly accommodate participants residing in neighbouring rural acreage and outer coastal communities. Get in touch with our team to check availability in your area.
                </p>
              </div>
              <div className="enquiryBannerActions">
                <Link href="/contact" className="heroPillBtn filled">
                  <span>Check Availability with Our Team</span>
                  <ArrowRight size={16} />
                </Link>
                <a href="mailto:support@opuscare.com.au" className="bannerEmailLink">
                  <Mail size={15} /> support@opuscare.com.au
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
