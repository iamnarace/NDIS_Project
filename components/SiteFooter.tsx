import Link from 'next/link';
import Image from 'next/image';
import { 
  MapPin, Phone, Mail, ArrowRight, Heart, Shield, CheckCircle2, 
  ExternalLink, Facebook, Linkedin, Instagram, Sparkles 
} from 'lucide-react';

export function SiteFooter() {
  return (
    <footer className="siteFooterWrapper">
      {/* Pre-Footer Action Banner */}
      <div className="footerCtaBand">
        <div className="shell footerCtaContent">
          <div className="footerCtaLeft">
            <span className="footerCtaTag">
              <Sparkles size={14} /> Immediate Capacity Available
            </span>
            <h3>Ready to experience person-centred NDIS support?</h3>
            <p>Connect with our local Northern Rivers support team today. We respond within 24 business hours.</p>
          </div>
          <div className="footerCtaBtns">
            <Link className="button primary lg" href="/referral">
              <span>Make a Direct Referral</span>
              <ArrowRight size={17} />
            </Link>
            <Link className="button outline lg" href="/contact">
              <span>Talk to Our Team</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main 4-Column Structured Footer (Care Circle Layout) */}
      <div className="mainFooterArea">
        <div className="shell mainFooterGrid">
          
          {/* Column 1: Brand, Mission, Locations & Contact */}
          <div className="footerCol brandCol">
            <Link href="/" className="footerLogoLink" aria-label="Opus Care Support Services Home">
              <Image
                src="/brand/Opus_Care_Logo_Transparent.png"
                alt="Opus Care Support Services"
                width={200}
                height={55}
                className="footerLogoImg"
              />
            </Link>
            <p className="footerMissionText">
              Opus Care Support Services is dedicated to providing specialized, compassionate, and person-centred disability support. We empower self-managed and plan-managed NDIS participants across the Clarence Coast and Northern Rivers to live with confidence and choice.
            </p>

            <div className="footerLocationsList">
              <span className="locItem"><MapPin size={14} className="locPin" /> Yamba NSW</span>
              <span className="locItem"><MapPin size={14} className="locPin" /> Grafton NSW</span>
              <span className="locItem"><MapPin size={14} className="locPin" /> Maclean NSW</span>
              <span className="locItem"><MapPin size={14} className="locPin" /> Iluka NSW</span>
              <span className="locItem"><MapPin size={14} className="locPin" /> New Italy NSW</span>
              <span className="locItem"><MapPin size={14} className="locPin" /> Evans Head NSW</span>
              <span className="locItem"><MapPin size={14} className="locPin" /> Clarence Valley &amp; Northern Rivers</span>
            </div>

            <div className="footerDirectContact">
              <a href="tel:0415716516" className="footerContactItem">
                <Phone size={15} /> <span>0415 716 516</span>
              </a>
              <a href="mailto:support@opuscare.com.au" className="footerContactItem">
                <Mail size={15} /> <span>support@opuscare.com.au</span>
              </a>
            </div>

            <div className="footerSocialIcons">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="socialIconBtn" aria-label="Facebook">
                <Facebook size={17} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="socialIconBtn" aria-label="LinkedIn">
                <Linkedin size={17} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="socialIconBtn" aria-label="Instagram">
                <Instagram size={17} />
              </a>
              <a href="mailto:support@opuscare.com.au" className="socialIconBtn" aria-label="Email Us">
                <Mail size={17} />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links (Bullet Pointed) */}
          <div className="footerCol linksCol">
            <h4 className="footerColTitle">Quick Links</h4>
            <ul className="footerBulletList">
              <li>
                <span className="bulletDot"></span>
                <Link href="/referral">Client Referral Forms</Link>
              </li>
              <li>
                <span className="bulletDot"></span>
                <Link href="/services">Support Estimator</Link>
              </li>
              <li>
                <span className="bulletDot"></span>
                <Link href="/about">About Opus Care</Link>
              </li>
              <li>
                <span className="bulletDot"></span>
                <Link href="/faq">Pricing &amp; FAQs</Link>
              </li>
              <li>
                <span className="bulletDot"></span>
                <Link href="/contact">Consultation &amp; Contact</Link>
              </li>
              <li>
                <span className="bulletDot"></span>
                <Link href="/privacy">Privacy Policy</Link>
              </li>
              <li>
                <span className="bulletDot"></span>
                <Link href="/complaints">Feedback &amp; Complaints</Link>
              </li>
              <li>
                <span className="bulletDot"></span>
                <Link href="/incident-management">Incident Framework</Link>
              </li>
              <li>
                <span className="bulletDot"></span>
                <Link href="/code-of-conduct">NDIS Code of Conduct</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Services (Bullet Pointed) */}
          <div className="footerCol servicesCol">
            <h4 className="footerColTitle">Services &amp; Supports</h4>
            <ul className="footerBulletList">
              <li>
                <span className="bulletDot"></span>
                <Link href="/services">Assistance with Daily Life</Link>
              </li>
              <li>
                <span className="bulletDot"></span>
                <Link href="/services">Community &amp; Social Participation</Link>
              </li>
              <li>
                <span className="bulletDot"></span>
                <Link href="/services">Life Skills &amp; Capacity Development</Link>
              </li>
              <li>
                <span className="bulletDot"></span>
                <Link href="/services">Transport &amp; Travel Assistance</Link>
              </li>
              <li>
                <span className="bulletDot"></span>
                <Link href="/services">In-Home Respite Support</Link>
              </li>
              <li>
                <span className="bulletDot"></span>
                <Link href="/services">1-on-1 Mentoring &amp; Goal Coaching</Link>
              </li>
            </ul>

            <div className="fundingBadgeCard">
              <span className="fundingBadgeTitle">Funding Management:</span>
              <div className="fundingPillsRow">
                <span className="fPill">Self-Managed</span>
                <span className="fPill">Plan-Managed</span>
              </div>
            </div>
          </div>

          {/* Column 4: Recognition & Compliance */}
          <div className="footerCol recognitionCol">
            <h4 className="footerColTitle">Recognition &amp; Standards</h4>
            
            <div className="ndisHeartBadgeBox">
              <div className="ndisBadgeIcon">
                <Heart size={20} fill="#E88A6E" color="#E88A6E" />
              </div>
              <div className="ndisBadgeText">
                <strong>NDIS PROVIDER</strong>
                <span>Supporting Self &amp; Plan-Managed Participants with Dignity &amp; Respect</span>
              </div>
            </div>

            {/* Traditional Custodians Acknowledgment */}
            <div className="countryAcknowledgementCard">
              <div className="countryHeader">
                <span className="countryFlagTag">🌿 Acknowledgment of Country</span>
              </div>
              <p className="countryText">
                Opus Care Support Services acknowledges the Traditional Custodians of the lands across the Clarence Coast, Northern Rivers, and Bundjalung, Yaegl, and Gumbaynggirr Nations. We pay our deepest respects to Elders past, present, and emerging.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Legal Bar */}
      <div className="footerBottomBar">
        <div className="shell footerBottomFlex">
          <p className="copyrightText">
            Opus Care Support Services Australia. All rights reserved &copy; 2026.
          </p>
          <div className="legalLinks">
            <Link href="/privacy">Privacy</Link>
            <span className="legalDiv">·</span>
            <Link href="/complaints">Complaints</Link>
            <span className="legalDiv">·</span>
            <Link href="/incident-management">Incidents</Link>
            <span className="legalDiv">·</span>
            <Link href="/code-of-conduct">Code of Conduct</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
