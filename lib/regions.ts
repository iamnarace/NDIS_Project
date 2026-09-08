export interface Region {
  id: string;
  name: string;
  badge: string;
  majorTowns: string[];
  suburbs: string[];
  description: string;
}

export const REGIONS: Region[] = [
  {
    id: 'coffs-coast',
    name: 'Coffs Coast / Coffs Harbour Region',
    badge: 'Coffs Coast Hub',
    majorTowns: ['Coffs Harbour', 'Woolgoolga', 'Sawtell', 'Toormina'],
    suburbs: [
      'Coffs Harbour', 'North Boambee Valley', 'Boambee', 'Boambee East', 
      'Toormina', 'Sawtell', 'Bonville', 'Korora', 'Sapphire Beach', 
      'Moonee Beach', 'Emerald Beach', 'Sandy Beach', 'Woolgoolga', 
      'Safety Beach', 'Mullaway', 'Arrawarra', 'Corindi Beach'
    ],
    description: 'Providing compassionate in-home and community participation supports across Coffs Harbour and the coastal northern corridor.'
  },
  {
    id: 'clarence-valley',
    name: 'Clarence Valley',
    badge: 'Primary Valley Hub',
    majorTowns: ['Grafton', 'Maclean', 'Yamba', 'Iluka'],
    suburbs: [
      'Red Rock', 'Wooli', 'Minnie Water', 'Grafton', 'South Grafton', 
      'Junction Hill', 'Clarenza', 'Waterview Heights', 'Ulmarra', 
      'Maclean', 'Townsend', 'Gulmarrad', 'Lawrence', 'Yamba', 
      'Angourie', 'Iluka'
    ],
    description: 'Our established coastal and valley base with immediate daily support capacity for self and plan-managed participants.'
  },
  {
    id: 'richmond-valley',
    name: 'Richmond Valley',
    badge: 'Richmond Hub',
    majorTowns: ['Casino', 'Evans Head', 'Woodburn'],
    suburbs: [
      'New Italy', 'Woodburn', 'Evans Head', 'Broadwater', 'Coraki', 
      'Casino', 'Surrounding Richmond Valley Communities'
    ],
    description: 'Dependable disability support and skills development throughout the Richmond Valley corridor.'
  },
  {
    id: 'lismore-region',
    name: 'Lismore Region',
    badge: 'Lismore Hub',
    majorTowns: ['Lismore', 'Goonellabah', 'Nimbin'],
    suburbs: [
      'Lismore', 'East Lismore', 'South Lismore', 'North Lismore', 
      'Goonellabah', 'Girards Hill', 'Lismore Heights', 'Richmond Hill', 
      'Wyrallah', 'Clunes', 'Nimbin', 'Surrounding Communities'
    ],
    description: 'Person-centred 1-on-1 support workers assisting participants across central and outer Lismore communities.'
  },
  {
    id: 'ballina-northern-rivers',
    name: 'Ballina / Northern Rivers',
    badge: 'Northern Rivers Hub',
    majorTowns: ['Ballina', 'Lennox Head', 'Alstonville'],
    suburbs: [
      'Alstonville', 'Wollongbar', 'Wardell', 'Meerschaum Vale', 'Rous', 
      'Tintenbar', 'Lennox Head', 'Skennars Head', 'East Ballina', 
      'West Ballina', 'Ballina', 'Surrounding Ballina Shire Communities'
    ],
    description: 'Supporting participants across Ballina Shire and coastal communities with reliable, personalized routines.'
  }
];

export const MAJOR_LOCATIONS = [
  'Coffs Harbour', 'Woolgoolga', 'Grafton', 'Maclean', 'Yamba', 
  'Casino', 'Lismore', 'Alstonville', 'Lennox Head', 'Ballina'
];

export interface SuburbEntry {
  suburb: string;
  regionId: string;
  regionName: string;
  isMajor: boolean;
}

export function getAllServiceSuburbs(): SuburbEntry[] {
  const result: SuburbEntry[] = [];
  const seen = new Set<string>();

  for (const reg of REGIONS) {
    for (const sub of reg.suburbs) {
      const clean = sub.trim();
      if (!seen.has(clean.toLowerCase())) {
        seen.add(clean.toLowerCase());
        result.push({
          suburb: clean,
          regionId: reg.id,
          regionName: reg.name,
          isMajor: MAJOR_LOCATIONS.includes(clean) || reg.majorTowns.includes(clean),
        });
      }
    }
  }
  return result.sort((a, b) => a.suburb.localeCompare(b.suburb));
}

export function checkServiceArea(inputSuburb: string): {
  inServiceArea: boolean;
  matchedSuburb?: string;
  regionName?: string;
} {
  if (!inputSuburb || typeof inputSuburb !== 'string') {
    return { inServiceArea: false };
  }

  const clean = inputSuburb.toLowerCase().trim();
  // Strip postcodes, 'NSW', Australia etc.
  const core = clean.replace(/\\b(nsw|australia|24\\d\\d)\\b/gi, '').trim();

  for (const reg of REGIONS) {
    for (const sub of reg.suburbs) {
      const subLower = sub.toLowerCase();
      if (clean === subLower || core === subLower || clean.includes(subLower) || subLower.includes(core)) {
        return {
          inServiceArea: true,
          matchedSuburb: sub,
          regionName: reg.name,
        };
      }
    }
  }

  return { inServiceArea: false };
}

