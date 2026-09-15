import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import {
  MapPin,
  Briefcase,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  FileCheck,
  Award,
  Car,
  HeartHandshake
} from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { getOrganisationProfile } from '@/lib/organisation';
import { CareersApplicationForm } from '@/components/careers/CareersApplicationForm';
import { getRecruitmentAreaName } from '@/lib/regions';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getVacancy(slug: string) {
  const supabase = createAdminClient();
  if (!supabase) return null;

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
      about_role,
      responsibilities,
      essential_criteria,
      desirable_criteria,
      service_area_ids,
      location_notes,
      employment_basis,
      engagement_relationship,
      positions_count,
      driver_licence_required,
      vehicle_required,
      ndiswc_required,
      police_check_required,
      first_aid_required,
      cpr_required,
      child_related_role,
      qualification_required,
      other_requirements,
      pay_display_mode,
      pay_public_text,
      status,
      opens_at,
      closes_at,
      published_at
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .or(`opens_at.is.null,opens_at.lte.${now}`)
    .maybeSingle();

  return data;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const vacancy = await getVacancy(slug);
  if (!vacancy) {
    return {
      title: 'Job Opportunity Not Found | Opus Care Support Services',
    };
  }

  return {
    title: `${vacancy.title} (${vacancy.reference_number}) | Careers at Opus Care`,
    description: vacancy.short_summary || `Explore the ${vacancy.title} opportunity with Opus Care Support Services.`,
  };
}

export default async function VacancyDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const [vacancy, orgProfile] = await Promise.all([
    getVacancy(slug),
    getOrganisationProfile()
  ]);

  if (!vacancy) {
    notFound();
  }

  const now = Date.now();
  const isNotYetOpen = vacancy.opens_at && new Date(vacancy.opens_at).getTime() > now;
  const isClosed = vacancy.closes_at && new Date(vacancy.closes_at).getTime() < now;
  const careersContactEmail = orgProfile.careersEmail || orgProfile.supportEmail || 'support@opuscare.com.au';
  const basisList = Array.isArray(vacancy.employment_basis) ? vacancy.employment_basis : [];
  const serviceAreas = Array.isArray(vacancy.service_area_ids) ? vacancy.service_area_ids : [];
  const responsibilities = Array.isArray(vacancy.responsibilities) ? vacancy.responsibilities : [];
  const essentialCriteria = Array.isArray(vacancy.essential_criteria) ? vacancy.essential_criteria : [];
  const desirableCriteria = Array.isArray(vacancy.desirable_criteria) ? vacancy.desirable_criteria : [];

  return (
    <main className="vacancyDetailRoot">
      {/* 1. TOP BREADCRUMB & HEADER */}
      <div className="vacancyHeaderSection">
        <div className="shell">
          <div className="breadcrumbRow">
            <Link href="/careers" className="breadcrumbBackLink">
              <ArrowLeft size={16} />
              <span>Back to all Careers</span>
            </Link>
          </div>

          <div className="vacancyHeaderCard">
            <div className="headerBadgeRow">
              <span className="categoryBadge">{vacancy.category || 'Disability Support'}</span>
              <span className="refBadge">{vacancy.reference_number}</span>
              {isClosed ? (
                <span className="statusBadge closed">Applications Closed</span>
              ) : (
                <span className="statusBadge open">Accepting Applications</span>
              )}
            </div>

            <h1 className="vacancyDetailTitle">{vacancy.title}</h1>
            <p className="vacancyDetailSummary">{vacancy.short_summary}</p>

            <div className="vacancyQuickMetaGrid">
              <div className="metaBox">
                <MapPin size={18} className="textEmerald" />
                <div>
                  <span className="metaLabel">Service Areas</span>
                  <strong className="metaVal">
                    {serviceAreas.length > 0
                      ? serviceAreas.map((id: string) => getRecruitmentAreaName(id)).join(', ')
                      : 'Northern NSW / Sydney'}
                  </strong>
                </div>
              </div>

              <div className="metaBox">
                <Briefcase size={18} className="textEmerald" />
                <div>
                  <span className="metaLabel">Employment Basis</span>
                  <strong className="metaVal" style={{ textTransform: 'capitalize' }}>
                    {basisList.join(' / ').replace(/_/g, ' ') || 'Casual / Part-Time'}
                  </strong>
                </div>
              </div>

              {vacancy.closes_at && (
                <div className="metaBox">
                  <Calendar size={18} className="textEmerald" />
                  <div>
                    <span className="metaLabel">Closing Date</span>
                    <strong className="metaVal">
                      {new Date(vacancy.closes_at).toLocaleDateString('en-AU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </strong>
                  </div>
                </div>
              )}
            </div>

            {!isClosed && (
              <div className="headerApplyCtaRow">
                <a href="#apply-form" className="btnPrimary btnLarge">
                  <span>Apply for this Role</span>
                  <ArrowRight size={16} />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. MAIN ROLE CONTENT GRID */}
      <div className="vacancyBodySection">
        <div className="shell vacancyBodyGrid">
          <div className="vacancyMainContentCol">
            {/* About Role */}
            <section className="detailSectionBlock">
              <h2>About the Opportunity</h2>
              <div className="proseText">
                <p>{vacancy.about_role}</p>
              </div>
            </section>

            {/* Responsibilities */}
            {responsibilities.length > 0 && (
              <section className="detailSectionBlock">
                <h2>What You&apos;ll Be Doing</h2>
                <ul className="criteriaBulletsList">
                  {responsibilities.map((item: string, idx: number) => (
                    <li key={idx}>
                      <CheckCircle2 size={18} className="bulletIcon" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Essential Criteria */}
            {essentialCriteria.length > 0 && (
              <section className="detailSectionBlock">
                <h2>Essential Criteria</h2>
                <ul className="criteriaBulletsList">
                  {essentialCriteria.map((item: string, idx: number) => (
                    <li key={idx}>
                      <CheckCircle2 size={18} className="bulletIcon" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Desirable Criteria */}
            {desirableCriteria.length > 0 && (
              <section className="detailSectionBlock">
                <h2>Desirable Criteria</h2>
                <ul className="criteriaBulletsList">
                  {desirableCriteria.map((item: string, idx: number) => (
                    <li key={idx}>
                      <CheckCircle2 size={18} className="bulletIcon bulletDesirable" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Location & Travel */}
            <section className="detailSectionBlock">
              <h2>Location &amp; Travel Requirements</h2>
              <div className="proseText">
                {vacancy.location_notes ? (
                  <p>{vacancy.location_notes}</p>
                ) : (
                  <p>
                    Supports occur in participant homes and local community settings across{' '}
                    <strong>{serviceAreas.map((id: string) => getRecruitmentAreaName(id)).join(', ')}</strong>. Reliable transport and travel within your approved service areas is required.
                  </p>
                )}
              </div>
            </section>

            {/* Pay & Conditions */}
            {vacancy.pay_display_mode !== 'hidden' && (
              <section className="detailSectionBlock">
                <h2>Pay &amp; Conditions</h2>
                <div className="payNoticeCard">
                  {vacancy.pay_display_mode === 'custom_text' && vacancy.pay_public_text ? (
                    <p>{vacancy.pay_public_text}</p>
                  ) : (
                    <p>
                      Pay and conditions will be determined in accordance with the applicable industrial instrument, classification and employment arrangement.
                    </p>
                  )}
                </div>
              </section>
            )}

            {/* Reasonable Adjustments */}
            <section className="detailSectionBlock adjustmentsCallout">
              <h3>Need an Adjustment to Apply or Interview?</h3>
              <p>
                Opus Care welcomes requests for reasonable adjustments during recruitment. Contact our team at{' '}
                <a href={`mailto:${careersContactEmail}`}>{careersContactEmail}</a> and tell us what would help you participate. You do not need to disclose a diagnosis.
              </p>
            </section>

            {/* 3. APPLICATION FORM SECTION */}
            <section id="apply-form" className="applicationFormSection">
              <div className="sectionHeaderLeft">
                <span className="sectionEyebrow">ONLINE APPLICATION</span>
                <h2>Submit Your Application</h2>
                <p>Complete the form below to apply for <strong>{vacancy.title}</strong> ({vacancy.reference_number}).</p>
              </div>

              {isNotYetOpen ? (
                <div className="closedNoticeCard">
                  <Clock size={24} className="textMuted" />
                  <h4>Applications have not opened yet</h4>
                  <p>
                    Applications for this position will open on {new Date(vacancy.opens_at).toLocaleDateString('en-AU')}. You are welcome to submit an Expression of Interest in the meantime.
                  </p>
                  <Link href="/careers#eoi" className="btnSecondary">
                    Submit an Expression of Interest
                  </Link>
                </div>
              ) : isClosed ? (
                <div className="closedNoticeCard">
                  <AlertCircle size={24} className="textMuted" />
                  <h4>Applications are now closed</h4>
                  <p>
                    Applications for this position closed on {new Date(vacancy.closes_at).toLocaleDateString('en-AU')}. You are welcome to submit an Expression of Interest for future roles.
                  </p>
                  <Link href="/careers#eoi" className="btnSecondary">
                    Submit an Expression of Interest
                  </Link>
                </div>
              ) : (
                <CareersApplicationForm
                  applicationType="vacancy"
                  vacancyId={vacancy.id}
                  vacancyTitle={vacancy.title}
                  childRelatedRole={vacancy.child_related_role}
                  driverLicenceRequired={vacancy.driver_licence_required}
                  vehicleRequired={vacancy.vehicle_required}
                />
              )}
            </section>
          </div>

          {/* Right Sidebar Checklist */}
          <aside className="vacancySidebarCol">
            <div className="sidebarStickyCard">
              <h3>Role Requirements Checklist</h3>
              <ul className="sidebarChecklist">
                <li>
                  <CheckCircle2 size={16} className="textEmerald" />
                  <span>
                    <strong>Work Rights:</strong> Legal entitlement to work in Australia.
                  </span>
                </li>
                {vacancy.ndiswc_required && (
                  <li>
                    <ShieldCheck size={16} className="textEmerald" />
                    <span>
                      <strong>NDIS Worker Screening:</strong> Required by Opus Care internal policy before direct support.
                    </span>
                  </li>
                )}
                {vacancy.police_check_required && (
                  <li>
                    <ShieldCheck size={16} className="textEmerald" />
                    <span>
                      <strong>Police Check:</strong> Current National Police Check (within 3 years).
                    </span>
                  </li>
                )}
                {(vacancy.first_aid_required || vacancy.cpr_required) && (
                  <li>
                    <ShieldCheck size={16} className="textEmerald" />
                    <span>
                      <strong>First Aid &amp; CPR:</strong> Current HLTAID011 / HLTAID009 certificate.
                    </span>
                  </li>
                )}
                {vacancy.driver_licence_required && (
                  <li>
                    <Car size={16} className="textEmerald" />
                    <span>
                      <strong>Driver Licence:</strong> Current valid Australian driver licence (C-Class).
                    </span>
                  </li>
                )}
                {vacancy.vehicle_required && (
                  <li>
                    <Car size={16} className="textEmerald" />
                    <span>
                      <strong>Vehicle Access:</strong> Reliable registered and insured vehicle.
                    </span>
                  </li>
                )}
                {vacancy.child_related_role && (
                  <li>
                    <ShieldCheck size={16} className="textEmerald" />
                    <span>
                      <strong>WWCC:</strong> NSW Working With Children Check (child-related support only).
                    </span>
                  </li>
                )}
                {vacancy.qualification_required && (
                  <li>
                    <Award size={16} className="textEmerald" />
                    <span>
                      <strong>Qualification:</strong> Relevant Certificate III/IV or disability qualification.
                    </span>
                  </li>
                )}
                <li>
                  <HeartHandshake size={16} className="textEmerald" />
                  <span>
                    <strong>Values:</strong> Commitment to participant dignity, choice and person-centred care.
                  </span>
                </li>
              </ul>

              <div className="sidebarPrivacyBadge">
                <HeartHandshake size={18} className="textEmerald" />
                <span>We value honest self-declarations. Credentials are formally verified during onboarding.</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
