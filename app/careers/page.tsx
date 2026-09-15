import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import {
  Briefcase,
  Heart,
  ShieldCheck,
  MapPin,
  Clock,
  ArrowRight,
  CheckCircle2,
  Users,
  Calendar,
  Sparkles,
  HelpCircle,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
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
  const vacancies = await getPublishedVacancies();

  return (
    <main className="careersPageRoot">
      {/* 1. HERO SECTION */}
      <section className="careersHeroSection">
        <div className="shell">
          <div className="careersHeroInner">
            <span className="heroEyebrow">CAREERS AT OPUS CARE</span>
            <h1 className="heroTitle">Build a meaningful career with Opus Care</h1>
            <p className="heroSubtitle">
              If you care about dignity, choice, reliability and helping people participate in everyday life, we&apos;d like to hear from you. Explore current opportunities with Opus Care Support Services or submit an Expression of Interest for future roles.
            </p>

            <div className="heroCtaRow">
              <a href="#opportunities" className="btnHeroPrimary">
                <span>View Current Opportunities</span>
                <ArrowRight size={16} />
              </a>
              <a href="#eoi" className="btnHeroSecondary">
                <span>Submit an Expression of Interest</span>
              </a>
            </div>

            <div className="heroTrustBadges">
              <div className="trustBadgeItem">
                <Heart size={16} className="textEmerald" />
                <span>Person-Centred Support</span>
              </div>
              <div className="trustBadgeItem">
                <MapPin size={16} className="textEmerald" />
                <span>Northern NSW &amp; Sydney</span>
              </div>
              <div className="trustBadgeItem">
                <ShieldCheck size={16} className="textEmerald" />
                <span>Safe, Ethical &amp; Accountable</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SECTION: WHAT MATTERS TO US */}
      <section className="careersValuesSection">
        <div className="shell">
          <div className="sectionHeaderCenter">
            <span className="sectionEyebrow">OUR CULTURE &amp; VALUES</span>
            <h2 className="sectionTitle">Support that starts with respect</h2>
            <p className="sectionSubtitle">
              We empower support workers who bring empathy, practical skill and genuine dedication to every shift.
            </p>
          </div>

          <div className="valuesCardsGrid">
            <div className="valueCard">
              <div className="valueIconWrap">
                <Heart size={24} />
              </div>
              <h3>Person-centred</h3>
              <p>
                We listen to the person, respect their choices and support the routines and goals that matter to them.
              </p>
            </div>

            <div className="valueCard">
              <div className="valueIconWrap">
                <Clock size={24} />
              </div>
              <h3>Reliable</h3>
              <p>
                Participants should be able to rely on the people supporting them. Clear communication, punctuality and accurate records matter.
              </p>
            </div>

            <div className="valueCard">
              <div className="valueIconWrap">
                <ShieldCheck size={24} />
              </div>
              <h3>Safe &amp; accountable</h3>
              <p>
                Screening, training, professional boundaries, privacy and incident reporting are part of how we work.
              </p>
            </div>

            <div className="valueCard">
              <div className="valueIconWrap">
                <MapPin size={24} />
              </div>
              <h3>Local &amp; practical</h3>
              <p>
                Our work happens in homes and communities. We value workers who understand local travel, everyday routines and community participation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SECTION: CURRENT OPPORTUNITIES */}
      <section id="opportunities" className="careersOpportunitiesSection">
        <div className="shell">
          <div className="sectionHeaderCenter">
            <span className="sectionEyebrow">CURRENT OPENINGS</span>
            <h2 className="sectionTitle">Current Opportunities</h2>
            <p className="sectionSubtitle">
              Opportunities are published directly by our team. Check back regularly or register your interest below.
            </p>
          </div>

          {vacancies.length > 0 ? (
            <div className="vacanciesGrid">
              {vacancies.map((vac: any) => {
                const basisList = Array.isArray(vac.employment_basis) ? vac.employment_basis : [];
                const areasList = Array.isArray(vac.service_area_ids) ? vac.service_area_ids : [];

                return (
                  <article key={vac.id} className="opportunityCard">
                    <div className="cardHeaderRow">
                      <span className="cardCategoryBadge">{vac.category || 'Disability Support'}</span>
                      <span className="cardRefBadge">{vac.reference_number}</span>
                    </div>

                    <h3 className="cardTitle">
                      <Link href={`/careers/${vac.slug}`}>{vac.title}</Link>
                    </h3>

                    <p className="cardSummary">{vac.short_summary}</p>

                    <div className="cardMetaList">
                      <div className="metaItem">
                        <MapPin size={15} />
                        <span>
                          {areasList.length > 0
                            ? areasList.map((id: string) => getRecruitmentAreaName(id)).join(' · ')
                            : 'Northern NSW / Sydney'}
                        </span>
                      </div>

                      <div className="metaItem">
                        <Briefcase size={15} />
                        <span style={{ textTransform: 'capitalize' }}>
                          {basisList.join(' / ').replace(/_/g, ' ')}
                        </span>
                      </div>

                      {vac.closes_at && (
                        <div className="metaItem">
                          <Calendar size={15} />
                          <span>Closes {new Date(vac.closes_at).toLocaleDateString('en-AU')}</span>
                        </div>
                      )}
                    </div>

                    <div className="cardFooterRow">
                      <Link href={`/careers/${vac.slug}`} className="btnViewRole">
                        <span>View Role Details</span>
                        <ArrowRight size={15} />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            /* TRUTHFUL ZERO-VACANCY STATE */
            <div className="zeroVacancyCard">
              <div className="zeroVacancyIcon">
                <Briefcase size={40} className="textMuted" />
              </div>
              <h3 className="zeroVacancyTitle">No positions are currently advertised</h3>
              <p className="zeroVacancyBody">
                You&apos;re welcome to submit an Expression of Interest. If a suitable opportunity becomes available, our team may contact you in line with our recruitment and privacy processes.
              </p>
              <a href="#eoi" className="btnPrimary">
                Submit an Expression of Interest
              </a>
            </div>
          )}
        </div>
      </section>

      {/* 4. SECTION: WHAT HAPPENS AFTER YOU APPLY */}
      <section className="careersProcessSection">
        <div className="shell">
          <div className="sectionHeaderCenter">
            <span className="sectionEyebrow">RECRUITMENT JOURNEY</span>
            <h2 className="sectionTitle">What happens after you apply</h2>
            <p className="sectionSubtitle">
              We follow a transparent, structured pathway to ensure a great fit for participants and support workers alike.
            </p>
          </div>

          <div className="processStepsGrid">
            <div className="processStepCard">
              <span className="stepNumber">1</span>
              <h4>Application received</h4>
              <p>We record your application securely and issue an official application reference number.</p>
            </div>

            <div className="processStepCard">
              <span className="stepNumber">2</span>
              <h4>Initial review</h4>
              <p>We compare your experience, travel availability and preferences with the genuine requirements of the role.</p>
            </div>

            <div className="processStepCard">
              <span className="stepNumber">3</span>
              <h4>Conversation or interview</h4>
              <p>Shortlisted applicants are invited for an interview to discuss support approach, values and expectations.</p>
            </div>

            <div className="processStepCard">
              <span className="stepNumber">4</span>
              <h4>Checks &amp; references</h4>
              <p>Where appropriate, we confirm references and role-specific worker screening requirements.</p>
            </div>

            <div className="processStepCard">
              <span className="stepNumber">5</span>
              <h4>Offer &amp; onboarding</h4>
              <p>If an offer is made and accepted, you move into Opus Care&apos;s formal worker onboarding, agreement and induction process.</p>
            </div>

            <div className="processStepCard">
              <span className="stepNumber">6</span>
              <h4>Roster readiness</h4>
              <p>Hiring does not automatically make a worker roster-ready. Required credentials and training are verified first.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SECTION: SCREENING & READINESS */}
      <section className="careersReadinessSection">
        <div className="shell">
          <div className="readinessPane">
            <div className="readinessTextCol">
              <span className="sectionEyebrow">COMPLIANCE &amp; SAFETY</span>
              <h2>Before participant-facing work begins</h2>
              <p className="readinessIntro">
                Requirements depend on the role. Successful applicants may need to complete identity and work-right checks, Opus Care induction, role-specific training and relevant screening before being approved for participant-facing support.
              </p>

              <ul className="readinessBulletsList">
                <li>
                  <CheckCircle2 size={18} className="bulletCheck" />
                  <span>
                    <strong>NDIS Worker Screening clearance:</strong> Required by Opus Care internal policy for direct support workers.
                  </span>
                </li>
                <li>
                  <CheckCircle2 size={18} className="bulletCheck" />
                  <span>
                    <strong>National Police Check:</strong> Where required by Opus Care policy and role scope.
                  </span>
                </li>
                <li>
                  <CheckCircle2 size={18} className="bulletCheck" />
                  <span>
                    <strong>First Aid &amp; CPR:</strong> HLTAID011 / HLTAID009 certificates where required for the role.
                  </span>
                </li>
                <li>
                  <CheckCircle2 size={18} className="bulletCheck" />
                  <span>
                    <strong>Driver licence &amp; vehicle:</strong> Current valid licence and suitable transport where driving is an inherent requirement.
                  </span>
                </li>
                <li>
                  <CheckCircle2 size={18} className="bulletCheck" />
                  <span>
                    <strong>Working With Children Check (WWCC):</strong> A Working With Children Check is required where a role involves child-related work in NSW. Opus Care&apos;s current launch service scope is focused on adults; role-specific requirements will be confirmed during recruitment.
                  </span>
                </li>
              </ul>
            </div>

            <div className="readinessInfoBox">
              <ShieldCheck size={32} className="textEmerald" />
              <h4>No Upfront Document Hassle</h4>
              <p>
                You only need to submit your Resume / CV during initial application. Verified credential documents and references are collected later if your application progresses.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SECTION: EXPRESSION OF INTEREST FORM */}
      <section id="eoi" className="careersEoiSection">
        <div className="shell">
          <div className="sectionHeaderCenter">
            <span className="sectionEyebrow">FUTURE ROLES</span>
            <h2 className="sectionTitle">Expression of Interest</h2>
            <p className="sectionSubtitle">
              There may not be a current vacancy that matches your experience or location. You can send us an Expression of Interest and, if a suitable opportunity becomes available, our team may contact you.
            </p>
          </div>

          <div className="eoiFormWrapper">
            <CareersApplicationForm applicationType="eoi" />
          </div>
        </div>
      </section>

      {/* 7. SECTION: INCLUSIVE RECRUITMENT STATEMENT */}
      <section className="careersInclusionSection">
        <div className="shell">
          <div className="inclusionCard">
            <div className="inclusionIcon">
              <Users size={32} />
            </div>
            <div className="inclusionContent">
              <h3>Need an adjustment to apply or interview?</h3>
              <p>
                Opus Care Support Services is committed to fair, respectful and merit-based recruitment. We welcome applications from people with diverse backgrounds and lived experiences. If you need a reasonable adjustment to participate in the application or interview process, contact our team and tell us what would help. You do not need to disclose a diagnosis.
              </p>
              <a href="mailto:careers@opuscare.com.au" className="inclusionEmailLink">
                Email our recruitment team: careers@opuscare.com.au
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
