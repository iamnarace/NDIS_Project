import Link from 'next/link';
import { ArrowRight, Menu } from 'lucide-react';

export function SiteHeader() {
  return (
    <>
      <div className="notice">Supporting self-managed and plan-managed NDIS participants · Greater Sydney, NSW</div>
      <header className="nav shell">
        <Link href="/" className="brand" aria-label="CarePoint Support Services home">
          <span className="logoMark" aria-hidden="true"><span className="logoHeart">C</span><span>P</span></span>
          <span><strong>CarePoint</strong><small>Support Services</small></span>
        </Link>
        <nav aria-label="Main navigation">
          <Link href="/services">Services</Link>
          <Link href="/about">About</Link>
          <Link href="/referral">Referrals</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <div className="navActions">
          <Link className="textLink" href="/contact">Talk to us</Link>
          <Link className="button small" href="/referral">Make a referral <ArrowRight size={16}/></Link>
        </div>
        <Link href="/contact" className="mobileMenu" aria-label="Contact CarePoint"><Menu size={22}/></Link>
      </header>
    </>
  );
}
