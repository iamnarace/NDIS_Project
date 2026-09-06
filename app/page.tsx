import Link from 'next/link';
import Image from 'next/image';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import { SupportFinderWidget } from '../components/SupportFinderWidget';
import { RegionalCoverageChecker } from '../components/RegionalCoverageChecker';
import { NdisFundingSection } from '../components/NdisFundingSection';
import { JourneyBeginsSection } from '../components/JourneyBeginsSection';
import { NdisToolsResourcesSection } from '../components/NdisToolsResourcesSection';
import { NdisBlogNewsSection } from '../components/NdisBlogNewsSection';
import { ReadyCtaSection } from '../components/ReadyCtaSection';
import { ILoveNdisBadge } from '../components/ILoveNdisBadge';
import { SafetyPriorityNote } from '../components/SafetyPriorityNote';
import { CareSupportReadySection } from '../components/CareSupportReadySection';

import { 
  Heart, Users, Compass, Clock, ShieldCheck, MapPin, ArrowRight, 
  CheckCircle2, Sparkles, FileText, HeartHandshake,
  Home, Activity, Accessibility, UserCheck, ArrowUpRight, Mail
} from 'lucide-react';

export default function HomePage() {
  return (
    <>
      <SiteHeader />

      <main className="mainContentWrap">
        {/* ═══════════════════════════════════════════════════════════════════
            UNIFIED HERO SECTION: Authentic Local Care + Direct Actions
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="unifiedHeroSection">
          <div className="shell">
            <div className="unifiedHeroBox">
              <Image
                src="/images/ndis-community-walk.jpg"
                alt="Opus Care Support Worker and participant enjoying a coastal morning walk in Northern NSW"
                fill
                priority
                className="unifiedHeroCoverImg"
              />
              <div className="unifiedHeroOverlay" />
              <div className="unifiedHeroContentCard">
                <span className="unifiedHeroBadge">
                  🌿 PERSON-CENTRED NDIS SUPPORT · NORTHERN NSW
                </span>

                <h1 className="unifiedHeroTitle">
                  Working towards your best life, one step at a time
                </h1>

                <p className="unifiedHeroDesc">
                  At Opus Care Support Services, we match you with trusted, compassionate local support workers. Supporting Self-Managed and Plan-Managed Participants with genuine choice, control, and dedicated 1-on-1 care across Coffs Coast, Clarence Valley, Richmond Valley &amp; Northern Rivers.
                </p>

                <div className="unifiedHeroBtnRow">
                  <Link className="heroPillBtn filled" href="/referral">
                    <span>Check Your Eligibility</span>
                    <ArrowRight size={16} />
                  </Link>
                  <Link className="heroPillBtn outlineWhite" href="/services">
                    <span>View Our Services</span>
                    <ArrowUpRight size={18} />
                  </Link>
                </div>
              </div>
            </div>

            {/* "I 💚 NDIS" Trust Strip */}
            <ILoveNdisBadge />

            {/* Safety Priority Reassurance Micro-Note */}
            <SafetyPriorityNote />
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            CARE & SUPPORT READY: 8 Circular Activity Badges
        ═══════════════════════════════════════════════════════════════════ */}
        <CareSupportReadySection />

        {/* ═══════════════════════════════════════════════════════════════════
            NEW SECTION 1: UNDERSTANDING YOUR NDIS FUNDING (Reference 1)
        ═══════════════════════════════════════════════════════════════════ */}
        <NdisFundingSection />

        {/* ═══════════════════════════════════════════════════════════════════
            SERVICES SECTION: Signature Photo Cards (Compassion 360 Style)
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="cleanSectionPadding">
          <div className="shell">
            <div className="sectionHeaderCenter">
              <span className="greenCategoryTag">EXPLORE SERVICES</span>
              <h2 className="sectionSerifTitle">Trusted Services</h2>
              <p className="sectionSubDesc">
                Comprehensive, respectful disability support designed around your everyday routine across the Clarence Valley.
              </p>
            </div>

            <div className="photoCardGrid3">
              {/* Card 1: Home & Living */}
              <div className="photoServiceCard">
                <div className="photoCardImgWrapper">
                  <Image
                    src="/images/ndis-care-moment.jpg"
                    alt="Home and Living Support"
                    width={600}
                    height={400}
                    className="serviceCardPhoto"
                  />
                  <div className="photoCardCircleBadge purple">
                    <Home size={26} />
                  </div>
                </div>
                <div className="photoCardBottomPane">
                  <h3>Home &amp; Living Support</h3>
                  <p>Support with daily morning routines, meal prep, domestic chores, and personal care in your own home.</p>
                  <Link href="/services" className="cardDiscoverLink">
                    <span>Learn More</span> <ArrowRight size={15} />
                  </Link>
                </div>
              </div>

              {/* Card 2: Daily Living & Life Skills */}
              <div className="photoServiceCard">
                <div className="photoCardImgWrapper">
                  <Image
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=700&q=80"
                    alt="Daily Living and Life Skills"
                    width={600}
                    height={400}
                    className="serviceCardPhoto"
                  />
                  <div className="photoCardCircleBadge purple">
                    <Accessibility size={26} />
                  </div>
                </div>
                <div className="photoCardBottomPane">
                  <h3>Daily Living &amp; Life Skills</h3>
                  <p>Practical coaching in cooking, budgeting, public transport, and household independence for self-confidence.</p>
                  <Link href="/services" className="cardDiscoverLink">
                    <span>Learn More</span> <ArrowRight size={15} />
                  </Link>
                </div>
              </div>

              {/* Card 3: Community & Social Activities */}
              <div className="photoServiceCard">
                <div className="photoCardImgWrapper">
                  <Image
                    src="https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=700&q=80"
                    alt="Community and Social Activities"
                    width={600}
                    height={400}
                    className="serviceCardPhoto"
                  />
                  <div className="photoCardCircleBadge purple">
                    <Users size={26} />
                  </div>
                </div>
                <div className="photoCardBottomPane">
                  <h3>Community &amp; Social Activities</h3>
                  <p>Engage in local hobbies, beach trips, sports groups, creative classes, and social outings you enjoy.</p>
                  <Link href="/services" className="cardDiscoverLink">
                    <span>Learn More</span> <ArrowRight size={15} />
                  </Link>
                </div>
              </div>

              {/* Card 4: Transport Assistance */}
              <div className="photoServiceCard">
                <div className="photoCardImgWrapper">
                  <Image
                    src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=700&q=80"
                    alt="Transport & Travel Assistance"
                    width={600}
                    height={400}
                    className="serviceCardPhoto"
                  />
                  <div className="photoCardCircleBadge purple">
                    <MapPin size={26} />
                  </div>
                </div>
                <div className="photoCardBottomPane">
                  <h3>Transport &amp; Travel Assistance</h3>
                  <p>Safe, reliable transit to doctor visits, therapy, education, shopping, and work across Northern Rivers NSW.</p>
                  <Link href="/services" className="cardDiscoverLink">
                    <span>Learn More</span> <ArrowRight size={15} />
                  </Link>
                </div>
              </div>

              {/* Card 5: In-Home Respite Support */}
              <div className="photoServiceCard">
                <div className="photoCardImgWrapper">
                  <Image
                    src="/images/ndis-gardening-support.jpg"
                    alt="In-Home Respite Support"
                    width={600}
                    height={400}
                    className="serviceCardPhoto"
                  />
                  <div className="photoCardCircleBadge purple">
                    <Clock size={26} />
                  </div>
                </div>
                <div className="photoCardBottomPane">
                  <h3>In-Home Respite Support</h3>
                  <p>Quality respite care giving primary carers peace of mind while participants enjoy safe, attentive 1-on-1 support.</p>
                  <Link href="/services" className="cardDiscoverLink">
                    <span>Learn More</span> <ArrowRight size={15} />
                  </Link>
                </div>
              </div>

              {/* Card 6: 1-on-1 Mentoring & Coaching */}
              <div className="photoServiceCard">
                <div className="photoCardImgWrapper">
                  <Image
                    src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=700&q=80"
                    alt="Mentoring & Goal Coaching"
                    width={600}
                    height={400}
                    className="serviceCardPhoto"
                  />
                  <div className="photoCardCircleBadge purple">
                    <UserCheck size={26} />
                  </div>
                </div>
                <div className="photoCardBottomPane">
                  <h3>1-on-1 Mentoring &amp; Coaching</h3>
                  <p>Youth and adult mentoring focused on personal growth, fitness, emotional wellbeing, and career pathways.</p>
                  <Link href="/services" className="cardDiscoverLink">
                    <span>Learn More</span> <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            NEW SECTION 2: YOUR JOURNEY BEGINS HERE (Reference 4)
        ═══════════════════════════════════════════════════════════════════ */}
        <JourneyBeginsSection />

        {/* ═══════════════════════════════════════════════════════════════════
            NEW SECTION 3: FREE NDIS TOOLS & RESOURCES (Reference 3)
        ═══════════════════════════════════════════════════════════════════ */}
        <NdisToolsResourcesSection />

        {/* ═══════════════════════════════════════════════════════════════════
            NEW SECTION 4: NDIS NEWS / BLOG READS (Reference 2)
        ═══════════════════════════════════════════════════════════════════ */}
        <NdisBlogNewsSection />

        {/* ═══════════════════════════════════════════════════════════════════
            INTAKE PROCESS PANE: Simple & Supportive
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="intakeProcessSection">
          <div className="shell">
            <div className="sectionHeaderCenter">
              <span className="greenCategoryTag">INTAKE PROCESS</span>
              <h2 className="sectionSerifTitle">Our Simple and Supportive Intake Process</h2>
              <p className="sectionSubDesc">
                Getting started with Opus Care is effortless. Here is how we connect you with the right support.
              </p>
            </div>

            <div className="intakeStepsGrid3">
              {/* Step 01 */}
              <div className="intakeProcessCard">
                <span className="stepWatermarkNum">01</span>
                <div className="intakeIconBox">
                  <FileText size={32} />
                </div>
                <h3>Fill Out Our Online Form</h3>
                <p>Start your journey by completing our quick and easy online referral form. It helps us understand your routine and preferences.</p>
              </div>

              {/* Step 02 */}
              <div className="intakeProcessCard">
                <span className="stepWatermarkNum">02</span>
                <div className="intakeIconBox">
                  <Mail size={32} />
                </div>
                <h3>Speak With Our Friendly Team</h3>
                <p>Once we receive your form, our team contacts you promptly to discuss your goals, answer questions, and arrange your care plan.</p>
              </div>

              {/* Step 03 */}
              <div className="intakeProcessCard">
                <span className="stepWatermarkNum">03</span>
                <div className="intakeIconBox">
                  <HeartHandshake size={32} />
                </div>
                <h3>Receive Exceptional Care</h3>
                <p>We provide personalized, high-quality care and support workers matched to your lifestyle to help you or your loved ones thrive.</p>
              </div>
            </div>

            <div className="intakeActionRow">
              <Link className="heroPillBtn filled lg" href="/referral">
                <span>Start Intake Form Now</span>
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            VISION PANE: Empowering Independence
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="cleanSectionPadding">
          <div className="shell">
            <div className="visionSplitGrid">
              <div className="visionTextCol">
                <span className="greenCategoryTag">ABOUT OPUS CARE</span>
                <h2 className="sectionSerifTitle">Empowering Individuals to Achieve Their Dreams</h2>
                <p className="visionParagraph">
                  At Opus Care Support Services, we are dedicated to empowering individuals with disabilities to achieve their goals and lead independent, fulfilling lives across Yamba, Maclean, Grafton, and the Northern Rivers.
                </p>

                <div className="visionChecklist">
                  <div className="visionCheckItem">
                    <CheckCircle2 size={22} className="vCheckIcon" />
                    <div>
                      <strong>Our Mission:</strong> To provide comprehensive, person-centred services that support the unique aspirations of each participant in an environment where they can truly thrive.
                    </div>
                  </div>

                  <div className="visionCheckItem">
                    <CheckCircle2 size={22} className="vCheckIcon" />
                    <div>
                      <strong>Our Vision:</strong> To create an inclusive society where individuals with disabilities have equal opportunities to participate fully in all aspects of community life.
                    </div>
                  </div>
                </div>

                <div className="visionCallGroup">
                  <Link className="heroPillBtn purpleBtn" href="/about">
                    <span>Discover More</span>
                    <ArrowRight size={16} />
                  </Link>

                  <Link href="/contact" className="directEmailBlock">
                    <div className="emailCircleWrap">
                      <Mail size={18} />
                    </div>
                    <div className="emailTextWrap">
                      <small>Local Support Team</small>
                      <strong>support@opuscare.com.au</strong>
                    </div>
                  </Link>
                </div>
              </div>

              <div className="visionImgCol">
                <div className="visionImgCard">
                  <Image
                    src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=700&q=80"
                    alt="Participant and Support Worker smiling together"
                    width={700}
                    height={550}
                    className="visionPhoto"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            INTERACTIVE ESTIMATOR & COVERAGE CARD PANES (Id: estimator)
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="cleanSectionPadding" id="estimator">
          <div className="shell">
            <div className="sectionHeaderCenter">
              <span className="greenCategoryTag">PLANNING &amp; COVERAGE</span>
              <h2 className="sectionSerifTitle">Plan Your Support &amp; Check Coverage</h2>
              <p className="sectionSubDesc">
                Calculate your NDIS budget and verify immediate support worker availability in your town.
              </p>
            </div>

            <div className="interactivePanesGrid">
              <div className="interactivePaneCol">
                <SupportFinderWidget />
              </div>
              <div className="interactivePaneCol">
                <RegionalCoverageChecker />
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            NEW SECTION 5: READY TO GET STARTED CTA BANNER (Reference 4)
        ═══════════════════════════════════════════════════════════════════ */}
        <ReadyCtaSection />
      </main>

      <SiteFooter />
    </>
  );
}
