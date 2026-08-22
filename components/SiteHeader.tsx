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
            <span>Supporting Self-Managed &amp; Plan-Managed Participants Across Greater Sydney, NSW</span>
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
              <svg width="42" height="42" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="headerTeal" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0D9488"/>
                    <stop offset="100%" stopColor="#065F5B"/>
                  </linearGradient>
                  <linearGradient id="headerSun" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FBBF24"/>
                    <stop offset="100%" stopColor="#F59E0B"/>
                  </linearGradient>
                </defs>
                <rect width="64" height="64" rx="18" fill="url(#headerTeal)"/>
                <path d="M32 47C32 47 21 41 18.5 34.5C16 28 20 22 25.5 22C29 22 31 24.5 32 26.5C33 24.5 35 22 38.5 22C44 22 48 28 45.5 34.5C43 41 32 47 32 47Z" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="32" cy="33" r="5.5" fill="url(#headerSun)"/>
                <circle cx="32" cy="33" r="2.2" fill="#FFFFFF"/>
              </svg>
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
          <span>📍 Greater Sydney, NSW</span>
          <small>Unregistered NDIS Provider · Supporting Self &amp; Plan Managed</small>
        </div>
      </div>
      {open && <div className="mobileBackdropOverlay" aria-hidden="true" onClick={() => setOpen(false)} />}
    </>
  );
}
