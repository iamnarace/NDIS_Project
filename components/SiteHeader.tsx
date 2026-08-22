'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Menu, X, Phone, Mail, ShieldCheck, MapPin, Sparkles } from 'lucide-react';
import { useState } from 'react';

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Top Notification & Trust Bar */}
      <div className="topNoticeBar">
        <div className="shell topNoticeContent">
          <div className="noticeLeft">
            <span className="noticeBadge">NDIS Provider</span>
            <span>Supporting Self-Managed &amp; Plan-Managed Participants Across Yamba, Grafton &amp; Northern Rivers NSW</span>
          </div>
          <div className="noticeRight">
            <a href="mailto:support@carepointsupport.com.au" className="noticeContactLink">
              <Mail size={13} /> support@carepointsupport.com.au
            </a>
            <span className="noticeDivider">·</span>
            <span className="noticeBadgeGreen">🟢 Intake Open</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Header */}
      <header className="mainHeader">
        <div className="shell headerContainer">
          {/* Logo */}
          <Link href="/" className="brandLogoLink" aria-label="CarePoint Support Services home">
            <div className="logoMarkContainer">
              <Image
                src="/brand/CarePoint_Mark_512x512_Transparent.png"
                alt="CarePoint Support Services Logo"
                width={46}
                height={46}
                priority
                style={{ width: '46px', height: '46px', objectFit: 'contain' }}
              />
            </div>
            <div className="brandTextGroup">
              <span className="brandTitle">Care<span className="brandAccent">Point</span></span>
              <span className="brandSub">SUPPORT SERVICES · NDIS</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="desktopNav" aria-label="Main navigation">
            <Link href="/" className="navLink">Home</Link>
            <Link href="/services" className="navLink">Services</Link>
            <Link href="/about" className="navLink">About Us</Link>
            <Link href="/faq" className="navLink">FAQ &amp; Pricing</Link>
            <Link href="/contact" className="navLink">Contact</Link>
          </nav>

          {/* Header Action Buttons */}
          <div className="headerActionsGroup">
            <Link className="headerPhoneLink" href="/contact">
              <Phone size={15} />
              <span>Contact Us</span>
            </Link>
            <Link className="button makeReferralHeaderBtn" href="/referral">
              <span>Make a Referral</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            className="mobileMenuToggleBtn"
            aria-label={open ? 'Close menu' : 'Open navigation menu'}
            aria-expanded={open}
            onClick={() => setOpen(o => !o)}
          >
            {open ? <X size={24}/> : <Menu size={24}/>}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      <div className={`mobileDrawerContainer${open ? ' mobileDrawerOpen' : ''}`} role="dialog" aria-modal="true">
        <div className="mobileDrawerHeader">
          <div className="brandTextGroup">
            <span className="brandTitle">Care<span className="brandAccent">Point</span></span>
            <span className="brandSub">SUPPORT SERVICES</span>
          </div>
          <button className="mobileMenuCloseBtn" onClick={() => setOpen(false)} aria-label="Close menu">
            <X size={22} />
          </button>
        </div>

        <nav className="mobileNavLinks">
          <Link href="/" onClick={() => setOpen(false)}>Home</Link>
          <Link href="/services" onClick={() => setOpen(false)}>Services &amp; Supports</Link>
          <Link href="/about" onClick={() => setOpen(false)}>About CarePoint</Link>
          <Link href="/faq" onClick={() => setOpen(false)}>FAQ &amp; Pricing</Link>
          <Link href="/contact" onClick={() => setOpen(false)}>Contact Team</Link>
          <div className="mobileDrawerCta">
            <Link className="button full" href="/referral" onClick={() => setOpen(false)}>
              Make a Direct Referral <ArrowRight size={16} />
            </Link>
          </div>
        </nav>

        <div className="mobileDrawerFooter">
          <span>📧 support@carepointsupport.com.au</span>
          <span>📍 Yamba, Grafton &amp; Northern Rivers, NSW</span>
          <small>Unregistered NDIS Provider · Supporting Self &amp; Plan Managed</small>
        </div>
      </div>
      {open && <div className="mobileBackdropOverlay" aria-hidden="true" onClick={() => setOpen(false)} />}
    </>
  );
}
