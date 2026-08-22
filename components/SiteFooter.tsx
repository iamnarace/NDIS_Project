import Link from 'next/link';
import Image from 'next/image';
import { Shield, Phone, Mail, MapPin, Heart, ArrowRight } from 'lucide-react';

export function SiteFooter() {
  return (
    <footer className="siteFooterWrapper">
      {/* Top Banner / Referral Strip */}
      <div className="footerTopCtaStrip">
        <div className="shell footerCtaContent">
          <div>
            <span className="footerEyebrow">Start Your Journey</span>
            <h3>Looking for reliable, person-centred disability support in Sydney?</h3>
          </div>
          <div className="footerCtaBtns">
            <Link className="button footerPrimaryBtn" href="/referral">
              Start a Referral <ArrowRight size={16} />
            </Link>
            <Link className="button secondary footerSecondaryBtn" href="/contact">
              Talk to Our Team
            </Link>
          </div>
        </div>
      </div>

      <div className="shell mainFooterGrid">
        {/* Brand & Mission Column */}
        <div className="footerBrandCol">
          <Link className="footerBrandLogo" href="/">
            <div className="logoMarkContainer">
              <Image
                src="/brand/CarePoint_Mark_White.png"
                alt="CarePoint Support Services Logo"
                width={42}
                height={42}
                style={{ width: '42px', height: '42px', objectFit: 'contain' }}
              />
            </div>
            <div className="brandTextGroup">
              <strong className="footerBrandTitle">Care<span className="brandAccent">Point</span></strong>
              <small className="footerBrandSub">SUPPORT SERVICES · NDIS</small>
            </div>
          </Link>
          <p className="footerMissionText">
            Respectful, dependable disability support tailored around your goals, routines, and choices across Yamba, Grafton, and Northern Rivers NSW. Supporting self-managed and plan-managed NDIS participants.
          </p>
          <div className="footerWorkerCheckBadge">
            <Shield size={16} color="#2DD4BF" />
            <span>NDIS Worker Screening Cleared · First Aid &amp; CPR Certified</span>
          </div>
          <div className="footerNdisSupportTag" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px', background: 'rgba(255, 255, 255, 0.06)', padding: '10px 14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
            <Image
              src="/marketing/CarePoint_NDIS_Badge_512.png"
              alt="Proudly Supporting NDIS Participants"
              width={40}
              height={40}
              style={{ width: '40px', height: '40px', objectFit: 'contain' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#CCFBF1' }}>Proudly Supporting</span>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>NDIS Participants Across NSW</span>
            </div>
          </div>
        </div>

        {/* Navigation Column: Services */}
        <div className="footerCol">
          <strong className="footerColTitle">Our Services</strong>
          <Link href="/services">Daily Living Support</Link>
          <Link href="/services">Community Participation</Link>
          <Link href="/services">Transport &amp; Appointments</Link>
          <Link href="/services">Life Skills &amp; Independence</Link>
          <Link href="/services">Companionship &amp; Social</Link>
          <Link href="/services">Household Assistance</Link>
        </div>

        {/* Navigation Column: Information & Governance */}
        <div className="footerCol">
          <strong className="footerColTitle">Governance &amp; Trust</strong>
          <Link href="/about">About CarePoint</Link>
          <Link href="/faq">FAQ &amp; Pricing</Link>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/complaints">Complaints &amp; Feedback</Link>
          <Link href="/incident-management">Incident Management</Link>
          <Link href="/code-of-conduct">NDIS Code of Conduct</Link>
        </div>

        {/* Contact Column */}
        <div className="footerCol">
          <strong className="footerColTitle">Get In Touch</strong>
          <div className="footerContactItem">
            <Mail size={15} color="#2DD4BF" />
            <span>support@carepointsupport.com.au</span>
          </div>
          <div className="footerContactItem">
            <MapPin size={15} color="#2DD4BF" />
            <span>Yamba &amp; Clarence Coast, NSW</span>
          </div>
          <div className="footerContactItem">
            <Shield size={15} color="#2DD4BF" />
            <span>Unregistered NDIS Provider Model</span>
          </div>
          <div className="footerOpeningPill">
            <span>🟢 Taking New Referrals</span>
          </div>
        </div>
      </div>

      {/* Acknowledgment of Country */}
      <div className="shell countryAcknowledgement">
        <p>
          CarePoint Support Services acknowledges the Traditional Custodians of the lands on which we live, work and provide care across Greater Sydney and Australia. We pay our respects to Elders past, present and emerging.
        </p>
      </div>

      {/* Bottom Legal Copyright */}
      <div className="shell footerBottomLegal">
        <span>© {new Date().getFullYear()} CarePoint Support Services. All rights reserved.</span>
        <span>CarePoint is an independent support provider and is not affiliated with the National Disability Insurance Agency (NDIA). NDIS is a registered trademark of the NDIA.</span>
      </div>
    </footer>
  );
}
