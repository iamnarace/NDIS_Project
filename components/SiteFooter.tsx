import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer>
      <div className="shell footerGrid">
        <div>
          <Link className="brand footerBrand" href="/">
            <span className="logoMark" aria-hidden="true"><span className="logoHeart">C</span><span>P</span></span>
            <span><strong>CarePoint</strong><small>Support Services</small></span>
          </Link>
          <p>Respectful, dependable disability support shaped around your goals, routines and choices.</p>
          <small className="muted">Working business details, service scope and insurance information will be finalised before public launch.</small>
        </div>
        <div><strong>Explore</strong><Link href="/services">Services</Link><Link href="/about">About</Link><Link href="/referral">Make a referral</Link><Link href="/contact">Contact</Link></div>
        <div><strong>Policies</strong><Link href="/privacy">Privacy</Link><Link href="/complaints">Complaints & feedback</Link><Link href="/incident-management">Incident management</Link><Link href="/code-of-conduct">Code of conduct</Link></div>
        <div><strong>Contact</strong><span>support@carepointsupport.com.au</span><span>Greater Sydney, NSW</span><span>Business hours to be confirmed</span></div>
      </div>
      <div className="shell footerBottom"><span>© 2026 CarePoint Support Services</span><span>CarePoint Support Services is not affiliated with the NDIA. NDIS is a scheme of the Australian Government.</span></div>
    </footer>
  );
}
