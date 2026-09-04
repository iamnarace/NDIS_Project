import Link from 'next/link';
import Image from 'next/image';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import { SupportFinderWidget } from '../components/SupportFinderWidget';
import { RegionalCoverageChecker } from '../components/RegionalCoverageChecker';
import { 
  Heart, Users, Compass, Clock, ShieldCheck, MapPin, ArrowRight, 
  CheckCircle2, Star, Sparkles, Newspaper, ExternalLink, Calendar, 
  Smile, Award, FileText, Check, PhoneCall
} from 'lucide-react';

export default function HomePage() {
  return (
    <>
      <SiteHeader />

      <main className="mainContentWrap">
        {/* ═══════════════════════════════════════════════════════════════════
            HERO SECTION: Compassion360 Box Style with Authentic Imagery
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="heroSection">
          <div className="shell">
            <div className="heroBoxGrid">
              
              {/* Left Column: Hero Copy & Actions */}
              <div className="heroCopyBox">
                <div className="heroBadgeRow">
                  <span className="heroPillBadge">
                    <Sparkles size={14} className="sparkleIcon" /> Person-Centred NDIS Support
                  </span>
                  <span className="heroLocationPill">
                    <MapPin size={13} /> Yamba &amp; Northern Rivers NSW
                  </span>
                </div>

                <h1 className="heroHeading">
                  Empowering Your Independence with <span className="highlightNavy">Compassionate</span> <span className="highlightPurple">NDIS Care</span>
                </h1>

                <p className="heroLead">
                  Practical, respectful disability support designed entirely around your goals, daily routines, and choices. We proudly support self-managed and plan-managed participants with reliable, consistent support workers.
                </p>

                <div className="heroFeatureChecklist">
                  <div className="featCheckItem">
                    <CheckCircle2 size={18} className="featIcon" />
                    <span>NDIS Worker Screening &amp; WWCC Cleared</span>
                  </div>
                  <div className="featCheckItem">
                    <CheckCircle2 size={18} className="featIcon" />
                    <span>No Lock-In Contracts &amp; 100% Price-Limit Aligned</span>
                  </div>
                  <div className="featCheckItem">
                    <CheckCircle2 size={18} className="featIcon" />
                    <span>Rapid Intake Response Within 24 Hours</span>
                  </div>
                </div>

                <div className="heroActionsGroup">
                  <Link className="button primary lg heroCtaBtn" href="/referral">
                    <span>Make a Direct Referral</span>
                    <ArrowRight size={17} />
                  </Link>
                  <Link className="button outline lg heroSecondaryBtn" href="/services">
                    <span>Explore Services</span>
                  </Link>
                </div>

                <div className="heroTrustBar">
                  <div className="trustAvatars">
                    <span className="starRow">★★★★★</span>
                    <span className="trustText"><strong>5.0 Star Rating</strong> from local participants &amp; families</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Hero Visual Frame & Floating Trust Badges */}
              <div className="heroVisualBox">
                <div className="heroImageFrame">
                  <Image
                    src="https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=900&q=80"
                    alt="Opus Care Support Worker smiling with participant outdoors"
                    width={600}
                    height={460}
                    priority
                    className="heroMainImg"
                  />
                  <div className="heroImageOverlay">
                    <div className="overlayBadge">
                      <strong>Local Northern Rivers Team</strong>
                      <span>Dedicated support right where you live</span>
                    </div>
                  </div>
                </div>

                <div className="heroCardStack">
                  <div className="heroTrustCard">
                    <div className="cardIconWrap teal">
                      <Heart size={20} />
                    </div>
                    <div>
                      <strong>100% Person-Centred</strong>
                      <p>You choose your worker &amp; your schedule</p>
                    </div>
                  </div>

                  <div className="heroTrustCard">
                    <div className="cardIconWrap purple">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <strong>NDIS Screening Cleared</strong>
                      <p>Police checked, insured &amp; experienced staff</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            STATS BAND: 4 Modular Bento Metric Boxes
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="statsBandSection">
          <div className="shell">
            <div className="statsBentoGrid">
              <div className="statBentoBox">
                <span className="statNumber">6+</span>
                <span className="statLabel">Core NDIS Services</span>
                <small className="statSub">Daily life, community &amp; skills</small>
              </div>
              <div className="statBentoBox">
                <span className="statNumber">100%</span>
                <span className="statLabel">Person-Centred Matching</span>
                <small className="statSub">Support workers who fit your lifestyle</small>
              </div>
              <div className="statBentoBox">
                <span className="statNumber">24/7</span>
                <span className="statLabel">Emergency &amp; Respite</span>
                <small className="statSub">Reliable round-the-clock availability</small>
              </div>
              <div className="statBentoBox">
                <span className="statNumber">15+</span>
                <span className="statLabel">Covered Suburbs</span>
                <small className="statSub">Yamba, Maclean, Grafton &amp; surrounds</small>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            COMPASSION360 4-STEP CARE APPROACH (BENTO GRID)
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="sectionPadding whiteSection">
          <div className="shell">
            <div className="sectionHeaderCenter">
              <span className="sectionSuperBadge">
                <Compass size={14} /> Our 4-Step Approach
              </span>
              <h2 className="sectionMainHeading">How Opus Care Supports Your Journey</h2>
              <p className="sectionSubHeading">
                From your initial enquiry to achieving your personal milestones, our simple 4-step process ensures a smooth, stress-free experience.
              </p>
            </div>

            <div className="approachBentoGrid">
              <div className="approachBentoCard">
                <div className="stepNumberBadge">01</div>
                <h3>1. Listen &amp; Understand</h3>
                <p>We meet with you and your family to understand your daily routines, hobbies, goals, and specific support preferences.</p>
                <div className="cardCheckItem">
                  <Check size={14} className="cIcon" />
                  <span>Free in-person or phone consultation</span>
                </div>
              </div>

              <div className="approachBentoCard">
                <div className="stepNumberBadge">02</div>
                <h3>2. Tailored Matching</h3>
                <p>We match you with experienced, local support workers whose personalities, skills, and energy align with what you enjoy.</p>
                <div className="cardCheckItem">
                  <Check size={14} className="cIcon" />
                  <span>You meet your worker before starting</span>
                </div>
              </div>

              <div className="approachBentoCard">
                <div className="stepNumberBadge">03</div>
                <h3>3. Reliable Support</h3>
                <p>Your support worker arrives on time, every time, assisting you with daily living, social outings, appointments, and skills.</p>
                <div className="cardCheckItem">
                  <Check size={14} className="cIcon" />
                  <span>Consistent, familiar faces</span>
                </div>
              </div>

              <div className="approachBentoCard">
                <div className="stepNumberBadge">04</div>
                <h3>4. Review &amp; Grow</h3>
                <p>We regularly check in with you and your Support Coordinator to ensure services remain aligned with your evolving NDIS goals.</p>
                <div className="cardCheckItem">
                  <Check size={14} className="cIcon" />
                  <span>Flexible adjustments anytime</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            LIVE NDIS NEWS & PRICE GUIDE UPDATES WIDGET
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="sectionPadding lightGraySection">
          <div className="shell">
            <div className="ndisNewsBentoCard">
              <div className="newsHeader">
                <div className="newsTitleGroup">
                  <span className="newsTagBadge">
                    <Newspaper size={14} /> NDIS Sector News &amp; Updates
                  </span>
                  <h3>Latest NDIS Updates &amp; Price Guide Information</h3>
                  <p>Stay informed about the latest NDIS pricing arrangements, PACE system rollout, and participant rights.</p>
                </div>
                <Link href="/faq" className="button outline sm viewAllNewsBtn">
                  <span>View Pricing FAQ</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              <div className="newsItemsGrid">
                <div className="newsItemBox">
                  <div className="newsItemDate">
                    <Calendar size={13} /> 2026 Price Guide Current
                  </div>
                  <h4>NDIS Price Limit Alignment</h4>
                  <p>All Opus Care 1:1 support rates are strictly capped at official NDIA price limits with zero hidden gap fees.</p>
                  <span className="newsStatusPill">✓ 100% Compliant</span>
                </div>

                <div className="newsItemBox">
                  <div className="newsItemDate">
                    <Calendar size={13} /> PACE System Compatible
                  </div>
                  <h4>Seamless Plan Endorsements</h4>
                  <p>Our intake systems connect seamlessly with NDIA&apos;s PACE system for smooth invoicing and plan management claims.</p>
                  <span className="newsStatusPill">✓ Direct Invoicing</span>
                </div>

                <div className="newsItemBox">
                  <div className="newsItemDate">
                    <Calendar size={13} /> Choice &amp; Control
                  </div>
                  <h4>Self &amp; Plan-Managed Freedom</h4>
                  <p>Enjoy complete flexibility to choose your own support hours, routines, and preferred support workers.</p>
                  <span className="newsStatusPill">✓ No Lock-In Contracts</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            SERVICES CATALOGUE: 6 Structured Bento Boxes
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="sectionPadding whiteSection">
          <div className="shell">
            <div className="sectionHeaderCenter">
              <span className="sectionSuperBadge">
                <Heart size={14} /> Support Catalogue
              </span>
              <h2 className="sectionMainHeading">Comprehensive NDIS Disability Supports</h2>
              <p className="sectionSubHeading">
                Practical, respectful support tailored to your unique lifestyle across Yamba, Grafton, Maclean, and the Northern Rivers.
              </p>
            </div>

            <div className="servicesBentoGrid">
              
              {/* Service 1 */}
              <div className="serviceBentoCard">
                <div className="serviceCardTop">
                  <div className="serviceIconCircle teal">
                    <Users size={22} />
                  </div>
                  <span className="serviceCategoryTag">Core Support</span>
                </div>
                <h3>Assistance with Daily Life</h3>
                <p>Support with morning routines, meal preparation, personal care, light housekeeping, and medication reminders at home.</p>
                <ul className="serviceFeatureList">
                  <li><Check size={14} className="sCheck" /> Morning &amp; evening personal care</li>
                  <li><Check size={14} className="sCheck" /> Nutritious meal preparation</li>
                  <li><Check size={14} className="sCheck" /> Household chores &amp; organization</li>
                </ul>
                <div className="serviceCardFooter">
                  <Link href="/services" className="serviceLearnLink">
                    <span>Learn more</span> <ArrowRight size={14} />
                  </Link>
                </div>
              </div>

              {/* Service 2 */}
              <div className="serviceBentoCard">
                <div className="serviceCardTop">
                  <div className="serviceIconCircle purple">
                    <Compass size={22} />
                  </div>
                  <span className="serviceCategoryTag">Social &amp; Civic</span>
                </div>
                <h3>Community &amp; Social Participation</h3>
                <p>Engage in community groups, beach visits, sports, creative classes, library outings, and social events you love.</p>
                <ul className="serviceFeatureList">
                  <li><Check size={14} className="sCheck" /> Attending local clubs &amp; events</li>
                  <li><Check size={14} className="sCheck" /> Beach &amp; outdoor leisure trips</li>
                  <li><Check size={14} className="sCheck" /> Building lasting friendships</li>
                </ul>
                <div className="serviceCardFooter">
                  <Link href="/services" className="serviceLearnLink">
                    <span>Learn more</span> <ArrowRight size={14} />
                  </Link>
                </div>
              </div>

              {/* Service 3 */}
              <div className="serviceBentoCard">
                <div className="serviceCardTop">
                  <div className="serviceIconCircle coral">
                    <Sparkles size={22} />
                  </div>
                  <span className="serviceCategoryTag">Capacity Building</span>
                </div>
                <h3>Life Skills &amp; Independence</h3>
                <p>Build essential skills for autonomous living, including cooking, grocery shopping, budgeting, and public transport practice.</p>
                <ul className="serviceFeatureList">
                  <li><Check size={14} className="sCheck" /> Cooking &amp; kitchen confidence</li>
                  <li><Check size={14} className="sCheck" /> Budgeting &amp; shopping skills</li>
                  <li><Check size={14} className="sCheck" /> Time management &amp; scheduling</li>
                </ul>
                <div className="serviceCardFooter">
                  <Link href="/services" className="serviceLearnLink">
                    <span>Learn more</span> <ArrowRight size={14} />
                  </Link>
                </div>
              </div>

              {/* Service 4 */}
              <div className="serviceBentoCard">
                <div className="serviceCardTop">
                  <div className="serviceIconCircle teal">
                    <MapPin size={22} />
                  </div>
                  <span className="serviceCategoryTag">Travel Support</span>
                </div>
                <h3>Transport &amp; Travel Assistance</h3>
                <p>Safe, reliable transportation to medical appointments, work, study, grocery stores, and social activities across the valley.</p>
                <ul className="serviceFeatureList">
                  <li><Check size={14} className="sCheck" /> Medical &amp; therapy appointments</li>
                  <li><Check size={14} className="sCheck" /> Work &amp; education commuting</li>
                  <li><Check size={14} className="sCheck" /> Fully insured, safe vehicles</li>
                </ul>
                <div className="serviceCardFooter">
                  <Link href="/services" className="serviceLearnLink">
                    <span>Learn more</span> <ArrowRight size={14} />
                  </Link>
                </div>
              </div>

              {/* Service 5 */}
              <div className="serviceBentoCard">
                <div className="serviceCardTop">
                  <div className="serviceIconCircle purple">
                    <Clock size={22} />
                  </div>
                  <span className="serviceCategoryTag">Carer Respite</span>
                </div>
                <h3>In-Home Respite Support</h3>
                <p>Providing primary carers with peace of mind while participants enjoy engaging, supportive, and safe 1-on-1 care.</p>
                <ul className="serviceFeatureList">
                  <li><Check size={14} className="sCheck" /> Day &amp; evening respite blocks</li>
                  <li><Check size={14} className="sCheck" /> Weekend recreational support</li>
                  <li><Check size={14} className="sCheck" /> Calm, familiar home environment</li>
                </ul>
                <div className="serviceCardFooter">
                  <Link href="/services" className="serviceLearnLink">
                    <span>Learn more</span> <ArrowRight size={14} />
                  </Link>
                </div>
              </div>

              {/* Service 6 */}
              <div className="serviceBentoCard">
                <div className="serviceCardTop">
                  <div className="serviceIconCircle coral">
                    <Award size={22} />
                  </div>
                  <span className="serviceCategoryTag">Goal Mentoring</span>
                </div>
                <h3>1-on-1 Mentoring &amp; Goal Coaching</h3>
                <p>Dedicated youth and adult mentoring focused on personal growth, emotional wellbeing, fitness, and career pathways.</p>
                <ul className="serviceFeatureList">
                  <li><Check size={14} className="sCheck" /> Confidence &amp; routine building</li>
                  <li><Check size={14} className="sCheck" /> Fitness &amp; recreational coaching</li>
                  <li><Check size={14} className="sCheck" /> Pathways to work or study</li>
                </ul>
                <div className="serviceCardFooter">
                  <Link href="/services" className="serviceLearnLink">
                    <span>Learn more</span> <ArrowRight size={14} />
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            INTERACTIVE CALCULATOR & COVERAGE BOXES
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="sectionPadding lightGraySection">
          <div className="shell">
            <div className="interactiveSectionGrid">
              
              {/* Estimator */}
              <div className="interactiveCol">
                <SupportFinderWidget />
              </div>

              {/* Regional Coverage */}
              <div className="interactiveCol">
                <RegionalCoverageChecker />
              </div>

            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            AUTHENTIC TESTIMONIALS (3 Bento Boxes)
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="sectionPadding whiteSection">
          <div className="shell">
            <div className="sectionHeaderCenter">
              <span className="sectionSuperBadge">
                <Star size={14} /> Local Participant Stories
              </span>
              <h2 className="sectionMainHeading">What Participants &amp; Families Say</h2>
              <p className="sectionSubHeading">
                Real feedback from participants and Support Coordinators who partner with Opus Care.
              </p>
            </div>

            <div className="testimonialsBentoGrid">
              <div className="testimonialBentoCard">
                <div className="starRating">★★★★★</div>
                <p className="testimonialQuote">
                  &ldquo;Opus Care matched my son with a support worker who genuinely shares his love for music and sports. It has transformed his weekly routine and confidence.&rdquo;
                </p>
                <div className="testimonialAuthor">
                  <strong>Sarah M.</strong>
                  <span>Parent · Yamba NSW</span>
                </div>
              </div>

              <div className="testimonialBentoCard">
                <div className="starRating">★★★★★</div>
                <p className="testimonialQuote">
                  &ldquo;As a Support Coordinator, finding reliable workers in Grafton with zero intake delays is hard. Opus Care responded within hours and started supports that week.&rdquo;
                </p>
                <div className="testimonialAuthor">
                  <strong>David T.</strong>
                  <span>Support Coordinator · Clarence Valley</span>
                </div>
              </div>

              <div className="testimonialBentoCard">
                <div className="starRating">★★★★★</div>
                <p className="testimonialQuote">
                  &ldquo;The flexibility is what I love most. My support worker helps me with meal prep, gym sessions, and getting to my appointments in Maclean on time.&rdquo;
                </p>
                <div className="testimonialAuthor">
                  <strong>Michael K.</strong>
                  <span>NDIS Participant · Maclean NSW</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            PHOTO CALL TO ACTION BAND
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="ctaBannerSection">
          <div className="shell">
            <div className="ctaBannerBox">
              <div className="ctaContentWrap">
                <span className="ctaSuperTag">
                  <PhoneCall size={14} /> Start Your Support Today
                </span>
                <h2>Ready for Person-Centred NDIS Support with Opus Care?</h2>
                <p>
                  Whether you need daily assistance, community access, or travel support, our team is here to help you live life on your terms.
                </p>
                <div className="ctaActionRow">
                  <Link className="button primary lg" href="/referral">
                    <span>Submit a Direct Referral</span>
                    <ArrowRight size={17} />
                  </Link>
                  <Link className="button outline lg" href="/contact">
                    <span>Speak with Our Team</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
