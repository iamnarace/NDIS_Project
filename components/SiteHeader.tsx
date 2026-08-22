'use client';

import Link from 'next/link';
import { ArrowRight, Menu, X } from 'lucide-react';
import { useState } from 'react';

export function SiteHeader() {
  const [open, setOpen] = useState(false);

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
        <button
          className="mobileMenu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen(o => !o)}
        >
          {open ? <X size={22}/> : <Menu size={22}/>}
        </button>
      </header>

      {/* Mobile drawer */}
      <div id="mobile-nav" className={`mobileDrawer${open ? ' mobileDrawerOpen' : ''}`} role="dialog" aria-label="Navigation menu" aria-modal="true">
        <nav className="mobileNav">
          <Link href="/services" onClick={() => setOpen(false)}>Services</Link>
          <Link href="/about" onClick={() => setOpen(false)}>About</Link>
          <Link href="/referral" onClick={() => setOpen(false)}>Referrals</Link>
          <Link href="/contact" onClick={() => setOpen(false)}>Contact</Link>
          <Link className="button" href="/referral" onClick={() => setOpen(false)}>
            Make a referral <ArrowRight size={16}/>
          </Link>
        </nav>
      </div>
      {open && <div className="mobileOverlay" aria-hidden="true" onClick={() => setOpen(false)}/>}
    </>
  );
}
