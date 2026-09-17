import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import {
  Briefcase,
  ShieldCheck,
  MapPin,
  ArrowRight,
  Calendar,
  MessageCircle,
  ClipboardCheck
} from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { getOrganisationProfile } from '@/lib/organisation';
import { CareersApplicationForm } from '@/components/careers/CareersApplicationForm';
import { getRecruitmentAreaName } from '@/lib/regions';

export const metadata: Metadata = {
  title: 'Careers at Opus Care Support Services | Disability Support Jobs NSW',
  description:
    'Explore current opportunities and expressions of interest with Opus Care Support Services across Northern NSW and selected Sydney service areas.',
};

export const revalidate = 60; // ISR cache revalidation

async function getPublishedVacancies() {
  const supabase = createAdminClient();
  if (!supabase) return [];

  const now = new Date().toISOString();
  const { data } = await supabase
    .from('job_vacancies')
    .select(`
      id,
      reference_number,
      slug,
      title,
      category,
      short_summary,
      service_area_ids,
      location_notes,
      employment_basis,
      engagement_relationship,
      pay_display_mode,
      pay_public_text,
      closes_at,
      published_at
    `)
    .eq('status', 'published')
    .or(`opens_at.is.null,opens_at.lte.${now}`)
    .or(`closes_at.is.null,closes_at.gte.${now}`)
    .order('featured', { ascending: false })
    .order('published_at', { ascending: false, nullsFirst: false });

  return data || [];
}

export default async function CareersPage() {
  const [vacancies, orgProfile] = await Promise.all([
    getPublishedVacancies(),
    getOrganisationProfile()
  ]);
  const careersContactEmail = orgProfile.careersEmail || orgProfile.supportEmail || 'support@opuscare.com.au';

  return (
    <main className="careersPageRoot">
      <section className="careersCompactHero">
        <div className="shell">
          <div className="careersCompactHeroInner">
            <div>
              <span className="heroEyebrow">CAREERS AT OPUS CARE</span>
              <h1>Interested in working with Opus Care?</h1>
              <p>
                Tell us about the role and locations that suit you. We&apos;ll contact you when a suitable opportunity becomes available.
              </p>
            </div>
            <a href="#eoi" className="btnHeroPrimary">
              <span>Submit an Expression of Interest</span>
              <ArrowRight size={16} />
            </a>
          </div>

          <div className="careersCompactFacts" aria-label="Recruitment overview">
            <div>
              <MapPin size={19} />
              <span><strong>Local opportunities</strong>Northern NSW and selected Sydney areas</span>
            </div>
            <div>
              <MessageCircle size={19} />
              <span><strong>Simple first step</strong>Share the essentials now; details come later</span>
            </div>
            <div>
              <ClipboardCheck size={19} />
              <span><strong>Checks at the right time</strong>Credentials are verified if you progress</span>
            </div>
          </div>
        </div>
      </section>

      <section id="opportunities" className="careersCompactOpportunities">
        <div className="shell">
          <div className="careersCompactSectionHeading">
            <div>
              <span className="sectionEyebrow">CURRENT OPENINGS</span>
              <h2>Available roles</h2>
            </div>
            <p>Published vacancies appear here. You can register your interest at any time.</p>
          </div>

          {vacancies.length > 0 ? (
            <div className="vacanciesGrid careersCompactVacancies">
              {vacancies.map((vac: any) => {
                const basisList = Array.isArray(vac.employment_basis) ? vac.employment_basis : [];
                const areasList = Array.isArray(vac.service_area_ids) ? vac.service_area_ids : [];

                return (
                  <article key={vac.id} className="opportunityCard">
                    <div className="cardHeaderRow">
                      <span className="cardCategoryBadge">{vac.category || 'Disability Support'}</span>
                      <span className="cardRefBadge">{vac.reference_number}</span>
                    </div>
                    <h3 className="cardTitle"><Link href={`/careers/${vac.slug}`}>{vac.title}</Link></h3>
                    <p className="cardSummary">{vac.short_summary}</p>
                    <div className="cardMetaList">
                      <div className="metaItem"><MapPin size={15} /><span>{areasList.length > 0 ? areasList.map((id: string) => getRecruitmentAreaName(id)).join(' · ') : 'Northern NSW / Sydney'}</span></div>
                      <div className="metaItem"><Briefcase size={15} /><span style={{ textTransform: 'capitalize' }}>{basisList.join(' / ').replace(/_/g, ' ')}</span></div>
                      {vac.closes_at && <div className="metaItem"><Calendar size={15} /><span>Closes {new Date(vac.closes_at).toLocaleDateString('en-AU')}</span></div>}
                    </div>
                    <div className="cardFooterRow"><Link href={`/careers/${vac.slug}`} className="btnViewRole"><span>View role</span><ArrowRight size={15} /></Link></div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="careersCompactEmpty">
              <Briefcase size={21} />
              <div>
                <strong>No positions are currently advertised</strong>
                <span>Your Expression of Interest can still be considered for future opportunities.</span>
              </div>
              <a href="#eoi">Register interest <ArrowRight size={15} /></a>
            </div>
          )}
        </div>
      </section>

      <section id="eoi" className="careersEoiSection careersEoiPrimary">
        <div className="shell">
          <div className="sectionHeaderCenter careersEoiHeading">
            <span className="sectionEyebrow">MAIN APPLICATION</span>
            <h2 className="sectionTitle">Expression of Interest</h2>
            <p className="sectionSubtitle">
              Share your contact details and work preferences. A resume is optional and no screening documents are needed at this stage.
            </p>
          </div>
          <div className="eoiFormWrapper">
            <CareersApplicationForm applicationType="eoi" />
          </div>

          <div className="careersCompactAdjustment">
            <ShieldCheck size={20} />
            <p><strong>Need an adjustment?</strong> Email <a href={`mailto:${careersContactEmail}`}>{careersContactEmail}</a> and tell us what would help you apply or interview. You do not need to disclose a diagnosis.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
