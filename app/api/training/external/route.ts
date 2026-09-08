import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/training/external
 * Returns curated free external courses from NDIS Commission, NSW ADC, La Trobe, etc.
 * Supports ?category=... filter
 */
const FALLBACK_COURSES = [
  {
    id: '95829f62-ae2c-4d58-bac6-2beb33de705e',
    title: 'Worker Orientation – Quality, Safety and You',
    provider: 'NDIS Quality & Safeguards Commission',
    category: 'NDIS Essentials',
    description: 'Official NDIS orientation course covering worker responsibilities under the NDIS Code of Conduct, human rights, choice & control, and duty of care.',
    cost: 'Free',
    certificate_type: 'Official Certificate',
    target_audience: 'Required: All Workers',
    duration_text: 'Approx. 90 mins',
    url: 'https://training.ndiscommission.gov.au/',
    is_active: true
  },
  {
    id: 'e66b99a5-4b12-4881-b15f-5b390e609b05',
    title: 'New Worker NDIS Induction (8 Modules)',
    provider: 'NDIS Quality & Safeguards Commission',
    category: 'NDIS Essentials',
    description: 'Comprehensive 8-part modular induction covering disability identity, communication, incident reporting, safe mealtime practice, and person-centred values.',
    cost: 'Free',
    certificate_type: 'Official Certificate',
    target_audience: 'Recommended: New Workers',
    duration_text: '3–4 hours (Self-paced)',
    url: 'https://training.ndiscommission.gov.au/',
    is_active: true
  },
  {
    id: '17b6b6fb-4c4b-43b2-a260-d9233dde625b',
    title: 'Supporting Effective Communication',
    provider: 'NDIS Quality & Safeguards Commission',
    category: 'NDIS Essentials',
    description: 'Practical guide to communication rights, non-verbal cues, using augmentative and alternative communication (AAC) devices, and listening actively.',
    cost: 'Free',
    certificate_type: 'Official Certificate',
    target_audience: 'Required: All Workers',
    duration_text: 'Approx. 45 mins',
    url: 'https://training.ndiscommission.gov.au/',
    is_active: true
  },
  {
    id: 'b45ea4e4-7472-4fd3-aa35-ce02b0c399b1',
    title: 'Supporting Safe and Enjoyable Meals',
    provider: 'NDIS Quality & Safeguards Commission',
    category: 'NDIS Essentials',
    description: 'Essential training on identifying choking risks, understanding dysphagia, meal texture preparations, and following speech pathology mealtime plans.',
    cost: 'Free',
    certificate_type: 'Official Certificate',
    target_audience: 'Role-specific: Mealtime Support',
    duration_text: 'Approx. 60 mins',
    url: 'https://training.ndiscommission.gov.au/',
    is_active: true
  },
  {
    id: '8c772cfd-7833-4217-bf48-3a8fc4856f66',
    title: 'Abuse, Neglect & Exploitation – Module 1: Frontline Workers',
    provider: 'NSW Ageing & Disability Commission',
    category: 'Safeguarding',
    description: 'Free online training for frontline workers on identifying indicators of abuse, neglect and exploitation of older people and adults with disability in home and community settings.',
    cost: 'Free',
    certificate_type: 'Downloadable Certificate',
    target_audience: 'Required: All Workers',
    duration_text: 'Approx. 15–20 mins',
    url: 'https://www.ageingdisabilitycommission.nsw.gov.au/training.html',
    is_active: true
  },
  {
    id: '0d52b115-46bf-4054-9ee0-d20ea4b971a8',
    title: 'Abuse, Neglect & Exploitation – Module 2: Supervisors & Managers',
    provider: 'NSW Ageing & Disability Commission',
    category: 'Safeguarding',
    description: 'Guidance for coordinators, team leaders and managers on handling notifications, reporting to the Commission, and supporting workers through safeguarding inquiries.',
    cost: 'Free',
    certificate_type: 'Downloadable Certificate',
    target_audience: 'Role-specific: Supervisors',
    duration_text: 'Approx. 20 mins',
    url: 'https://www.ageingdisabilitycommission.nsw.gov.au/training.html',
    is_active: true
  },
  {
    id: '978bc57e-0797-400a-b283-d5d2bb89cf91',
    title: 'Know My Rights – Provider & Support Worker Journey',
    provider: 'NDIS Commission / Ausmed',
    category: 'NDIS Essentials',
    description: 'Interactive scenario-based learning journey focused on participant rights, dignity, and real-world application of the NDIS Code of Conduct.',
    cost: 'Free',
    certificate_type: 'Online Pathway',
    target_audience: 'Recommended',
    duration_text: 'Approx. 45 mins',
    url: 'https://www.ausmed.com.au/',
    is_active: true
  },
  {
    id: '5b5aa1e1-e1cf-4a37-b453-62c76b978939',
    title: 'Skills for Active Support (8 Modules)',
    provider: 'La Trobe University / Living with Disability',
    category: 'Support Practice',
    description: 'Evidence-based Active Support approach to increase meaningful engagement, autonomy, and quality of life for people with intellectual disability. (Creative Commons BY-SA 4.0).',
    cost: 'Free',
    certificate_type: 'Creative Commons',
    target_audience: 'Recommended: Intellectual Disability',
    duration_text: '8 Self-Paced Modules',
    url: 'https://everymomenthaspotential.com.au/',
    is_active: true
  },
  {
    id: 'dfdf8940-5203-4f90-a29d-43ee9e54d682',
    title: 'Positive Behaviour Support & Trauma-Informed Practice',
    provider: 'NDS / NDIS Commission',
    category: 'Behaviour & Trauma',
    description: 'Upholding human rights, understanding distress communication, proactive de-escalation, and reducing restrictive practices safely.',
    cost: 'Free',
    certificate_type: 'Official Certificate',
    target_audience: 'Role-specific',
    duration_text: 'Approx. 60–90 mins',
    url: 'https://www.nds.org.au/',
    is_active: true
  },
  {
    id: 'bb56da87-9bb3-455b-9d41-3b764bfbce0d',
    title: 'Frontline Practice Leadership',
    provider: 'La Trobe University',
    category: 'Leadership',
    description: 'Six free modules on coaching frontline workers, observing support practice, providing constructive feedback, and sustaining high-quality culture. (Creative Commons BY-SA 4.0).',
    cost: 'Free',
    certificate_type: 'Creative Commons',
    target_audience: 'Leadership & Supervisors',
    duration_text: '6 Modules',
    url: 'https://everymomenthaspotential.com.au/frontline-practice-leadership/',
    is_active: true
  },
  {
    id: 'c4ae04cf-f44e-4f11-8208-4aaae7e3328e',
    title: 'External Support Workers Training',
    provider: 'ADCET Academy',
    category: 'Optional Specialist Learning',
    description: 'Professional conduct, working relationships, and practical boundaries when supporting students with disability in education and community contexts.',
    cost: 'Free',
    certificate_type: 'Certificate + Digital Badge',
    target_audience: 'Optional PD',
    duration_text: 'Approx. 45 mins',
    url: 'https://www.adcet.edu.au/',
    is_active: true
  }
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');

  const filterFallback = () => {
    if (!category || category === 'All') return FALLBACK_COURSES;
    return FALLBACK_COURSES.filter(c => c.category === category);
  };

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json(filterFallback());
  }

  let query = supabase
    .from('external_courses')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('title', { ascending: true });

  if (category && category !== 'All') {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error || !data || data.length === 0) {
    return NextResponse.json(filterFallback());
  }
  return NextResponse.json(data);
}
