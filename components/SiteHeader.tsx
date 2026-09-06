'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, ArrowRight, Mail, Sparkles } from 'lucide-react';

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Top Announcement Bar */}
      <div className="topNoticeBar">
        <div className="shell topNoticeContent">
          <div className="noticeLeft">
            <span className="noticeBadge">NDIS Provider</span>
            <span className="noticeText">Supporting Self &amp; Plan-Managed Participants Across Yamba &amp; Northern Rivers NSW</span>
          </div>
          <div className="noticeRight">
            <span className="intakeBadge">
              <span className="statusDotPulse"></span> Intake Open
            </span>
            <a href="mailto:support@opuscare.com.au" className="noticeContactLink">
              <Mail size={13} /> support@opuscare.com.au
            </a>
          </div>
        </div>
      </div>

      {/* Main Header with Dedicated Spacing */}
      <header className="mainHeader">
        <div className="shell headerContainer">
          <Link href="/" className="brandGroup" aria-label="Opus Care Support Services Home">
            <Image
              src="/brand/Opus_Care_Logo_Transparent.png"
              alt="Opus Care Support Services"
              width={210}
              height={58}
              priority
              className="brandLogoImg"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="desktopNav" aria-label="Main Navigation">
            <Link href="/" className="navLink">Home</Link>
            <Link href="/services" className="navLink">Services &amp; Supports</Link>
            <Link href="/about" className="navLink">About Opus Care</Link>
            <Link href="/faq" className="navLink">Pricing &amp; FAQ</Link>
            <Link href="/contact" className="navLink">Contact Us</Link>
          </nav>

          {/* Header Actions */}
          <div className="headerActionsGroup">
            <Link href="/contact" className="headerEmailLink">
              <Mail size={14} />
              <span>Contact Us</span>
            </Link>
            <Link href="/referral" className="headerCtaBtn">
              <span>Make a Referral</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            className="mobileMenuToggleBtn"
            aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={open}
            onClick={() => setOpen(o => !o)}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <div className={`mobileDrawerContainer${open ? ' mobileDrawerOpen' : ''}`} role="dialog" aria-modal="true">
        <div className="mobileDrawerHeader">
          <Image
            src="/brand/Opus_Care_Logo_Transparent.png"
            alt="Opus Care Support Services"
            width={160}
            height={44}
            className="mobileDrawerLogo"
          />
          <button className="mobileMenuCloseBtn" onClick={() => setOpen(false)} aria-label="Close menu">
            <X size={22} />
          </button>
        </div>

        <nav className="mobileNavLinks">
          <Link href="/" onClick={() => setOpen(false)}>Home</Link>
          <Link href="/services" onClick={() => setOpen(false)}>Services &amp; Supports</Link>
          <Link href="/about" onClick={() => setOpen(false)}>About Opus Care</Link>
          <Link href="/faq" onClick={() => setOpen(false)}>Pricing &amp; FAQ</Link>
          <Link href="/contact" onClick={() => setOpen(false)}>Contact Us</Link>
          <div className="mobileDrawerCta">
            <Link className="headerCtaBtn full" href="/referral" onClick={() => setOpen(false)}>
              <span>Make a Direct Referral</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </nav>

        <div className="mobileDrawerFooter">
          <span>📧 support@opuscare.com.au</span>
          <span>📍 Yamba, Grafton &amp; Northern Rivers, NSW</span>
          <small>Unregistered NDIS Provider · Supporting Self &amp; Plan Managed</small>
        </div>
      </div>
      {open && <div className="mobileBackdropOverlay" aria-hidden="true" onClick={() => setOpen(false)} />}
    </>
  );
}

export default SiteHeader;
