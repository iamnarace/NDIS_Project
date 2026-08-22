import Link from 'next/link';
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
              <svg width="40" height="40" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="footerTeal" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0D9488"/>
                    <stop offset="100%" stopColor="#065F5B"/>
                  </linearGradient>
                  <linearGradient id="footerSun" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FBBF24"/>
                    <stop offset="100%" stopColor="#F59E0B"/>
                  </linearGradient>
                </defs>
                <rect width="64" height="64" rx="18" fill="url(#footerTeal)"/>
                <path d="M32 47C32 47 21 41 18.5 34.5C16 28 20 22 25.5 22C29 22 31 24.5 32 26.5C33 24.5 35 22 38.5 22C44 22 48 28 45.5 34.5C43 41 32 47 32 47Z" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="32" cy="33" r="5.5" fill="url(#footerSun)"/>
                <circle cx="32" cy="33" r="2.2" fill="#FFFFFF"/>
              </svg>
            </div>
            <div className="brandTextGroup">
              <strong className="footerBrandTitle">Care<span className="brandAccent">Point</span></strong>
              <small className="footerBrandSub">SUPPORT SERVICES · NDIS</small>
            </div>
          </Link>
          <p className="footerMissionText">
            Respectful, dependable disability support tailored around your goals, routines, and choices across Greater Sydney. Supporting self-managed and plan-managed NDIS participants.
          </p>
          <div className="footerWorkerCheckBadge">
            <Shield size={16} color="#2DD4BF" />
            <span>NDIS Worker Screening Cleared · First Aid &amp; CPR Certified</span>
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
            <span>Greater Sydney, NSW, Australia</span>
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
