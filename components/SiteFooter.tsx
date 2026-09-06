import Link from 'next/link';
import Image from 'next/image';
import { 
  MapPin, Mail, ArrowRight, Heart, Shield, CheckCircle2, 
  Facebook, Linkedin, Instagram, Sparkles, ExternalLink 
} from 'lucide-react';

export function SiteFooter() {
  return (
    <footer className="siteFooterWrapper deepPurpleFooter">
      {/* Main 4-Column Structured Footer */}
      <div className="mainFooterArea">
        <div className="shell mainFooterGrid">
          
          {/* Column 1: Brand, Mission, Locations & Contact */}
          <div className="footerCol brandCol">
            <Link href="/" className="footerLogoLink" aria-label="Opus Care Support Services Home">
              <Image
                src="/brand/Opus_Care_Logo_Transparent.png"
                alt="Opus Care Support Services"
                width={210}
                height={58}
                className="footerLogoImg invertLogo"
              />
            </Link>
            <p className="footerMissionText">
              Opus Care Support Services is dedicated to providing specialized, compassionate, and person-centred disability support. We empower self-managed and plan-managed NDIS participants across NSW North Coast and Northern Rivers to live with independence and choice.
            </p>

            <div className="footerLocationsList">
              <span className="locItem"><MapPin size={13} className="locPin" /> Coffs Harbour NSW</span>
              <span className="locItem"><MapPin size={13} className="locPin" /> Woolgoolga NSW</span>
              <span className="locItem"><MapPin size={13} className="locPin" /> Grafton &amp; Clarence Valley</span>
              <span className="locItem"><MapPin size={13} className="locPin" /> Maclean &amp; Yamba</span>
              <span className="locItem"><MapPin size={13} className="locPin" /> Casino &amp; Richmond Valley</span>
              <span className="locItem"><MapPin size={13} className="locPin" /> Lismore &amp; Ballina</span>
            </div>

            <div className="footerDirectContact">
              <a href="mailto:support@opuscare.com.au" className="footerContactItem">
                <Mail size={15} /> <span>support@opuscare.com.au</span>
              </a>
            </div>

            <div className="footerSocialIcons">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="socialIconBtn" aria-label="Facebook">
                <Facebook size={16} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="socialIconBtn" aria-label="LinkedIn">
                <Linkedin size={16} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="socialIconBtn" aria-label="Instagram">
                <Instagram size={16} />
              </a>
              <a href="mailto:support@opuscare.com.au" className="socialIconBtn" aria-label="Email Us">
                <Mail size={16} />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="footerCol linksCol">
            <h4 className="footerColTitle">Quick Links</h4>
            <ul className="footerBulletList">
              <li><span className="bulletDot"></span><Link href="/about">About Opus Care</Link></li>
              <li><span className="bulletDot"></span><Link href="/services">Services &amp; Supports</Link></li>
              <li><span className="bulletDot"></span><Link href="/service-areas">Areas We Serve</Link></li>
              <li><span className="bulletDot"></span><Link href="/faq">Pricing &amp; FAQs</Link></li>
              <li><span className="bulletDot"></span><Link href="/referral">Make a Referral</Link></li>
              <li><span className="bulletDot"></span><Link href="/contact">Contact Our Team</Link></li>
              <li><span className="bulletDot"></span><Link href="/privacy">Privacy Policy</Link></li>
              <li><span className="bulletDot"></span><Link href="/complaints">Feedback &amp; Complaints</Link></li>
              <li><span className="bulletDot"></span><Link href="/incident-management">Incident Framework</Link></li>
              <li><span className="bulletDot"></span><Link href="/code-of-conduct">NDIS Code of Conduct</Link></li>
            </ul>
          </div>

          {/* Column 3: Services & Supports */}
          <div className="footerCol servicesCol">
            <h4 className="footerColTitle">Services</h4>
            <ul className="footerBulletList">
              <li><span className="bulletDot"></span><Link href="/services">Assistance with Daily Life</Link></li>
              <li><span className="bulletDot"></span><Link href="/services">Community &amp; Social Participation</Link></li>
              <li><span className="bulletDot"></span><Link href="/services">Life Skills &amp; Capacity Development</Link></li>
              <li><span className="bulletDot"></span><Link href="/services">Transport &amp; Travel Assistance</Link></li>
              <li><span className="bulletDot"></span><Link href="/services">In-Home Respite Support</Link></li>
              <li><span className="bulletDot"></span><Link href="/services">1-on-1 Mentoring &amp; Coaching</Link></li>
            </ul>

            {/* Clean, Full-Width Funding Badge Box (No awkward text wrapping) */}
            <div className="fundingBadgeCard">
              <span className="fundingBadgeTitle">NDIS FUNDING MODEL:</span>
              <div className="fundingPillsRow">
                <span className="fPill">Self-Managed</span>
                <span className="fPill">Plan-Managed</span>
              </div>
            </div>
          </div>

          {/* Column 4: About Us & Intake CTA */}
          <div className="footerCol recognitionCol">
            <h4 className="footerColTitle">About Us</h4>
            
            {/* Supporting Self & Plan Managed */}
            <div className="cleanStatusBadgeCard">
              <Heart size={18} className="badgeHeartIcon" />
              <span>Supporting Self &amp; Plan-Managed</span>
            </div>

            {/* TIS National Card */}
            <div className="cleanStatusBadgeCard secondary">
              <Shield size={18} className="badgeShieldIcon" />
              <span>TIS National Interpreting Available</span>
            </div>

            <div className="footerIntakeCtaBox">
              <Link href="/referral" className="footerRedIntakeBtn">
                <span>NDIS Intake Form</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* Acknowledgment of Country with Side-by-Side Flags */}
      <div className="countryAckBand">
        <div className="shell">
          <div className="countryAckContent">
            <div className="flagsPairRow">
              {/* Australian Aboriginal Flag */}
              <svg className="flagSvg" viewBox="0 0 60 36" width="48" height="29" aria-label="Australian Aboriginal Flag">
                <rect width="60" height="18" fill="#000000" />
                <rect y="18" width="60" height="18" fill="#D9261C" />
                <circle cx="30" cy="18" r="10" fill="#FBB03B" />
              </svg>
              {/* Torres Strait Islander Flag */}
              <svg className="flagSvg" viewBox="0 0 60 36" width="48" height="29" aria-label="Torres Strait Islander Flag">
                <rect width="60" height="9" fill="#009944" />
                <rect y="9" width="60" height="2" fill="#000000" />
                <rect y="11" width="60" height="14" fill="#0055A5" />
                <rect y="25" width="60" height="2" fill="#000000" />
                <rect y="27" width="60" height="9" fill="#009944" />
                <path d="M 24 23 C 24 13 36 13 36 23 C 34 23 34 16 30 16 C 26 16 26 23 24 23 Z" fill="#FFFFFF" />
                <polygon points="30,17 31,20 34,20 31.5,22 32.5,25 30,23 27.5,25 28.5,22 26,20 29,20" fill="#FFFFFF" />
              </svg>
            </div>
            <p className="countryAckText">
              Opus Care Support Services acknowledges and pays respect to the Traditional Custodians of the lands on which we live, meet, and provide support across the NSW North Coast, Clarence Coast, Northern Rivers, and Bundjalung, Yaegl, and Gumbaynggirr Nations. We pay our deepest respects to Elders past, present, and emerging. We extend that respect to all Aboriginal and Torres Strait Islander peoples today.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Legal Bar */}
      <div className="footerBottomBar">
        <div className="shell footerBottomFlex">
          <p className="copyrightText">
            &copy; Copyright Opus Care Support Services Pty Ltd 2026. All Rights Reserved.
          </p>
          <div className="legalLinks">
            <Link href="/privacy">Privacy Policy</Link>
            <span className="legalDiv">&middot;</span>
            <Link href="/faq">Terms of Use</Link>
            <span className="legalDiv">&middot;</span>
            <Link href="/complaints">Complaints</Link>
            <span className="legalDiv">&middot;</span>
            <Link href="/incident-management">Incidents</Link>
            <span className="legalDiv">&middot;</span>
            <Link href="/code-of-conduct">Code of Conduct</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
