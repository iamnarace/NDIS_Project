'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Activity,
  Home,
  Users,
  UserPlus,
  Target,
  ClipboardList,
  AlertTriangle,
  CalendarClock,
  FileCheck,
  Clock,
  Calculator,
  Receipt,
  FileText,
  Shield,
  AlertCircle,
  ShieldCheck,
  UserCheck,
  Sparkles,
  Layers,
  Settings,
  Search,
  Bell,
  X,
  Plus,
  CheckCircle2,
  Menu,
  BookOpen,
} from 'lucide-react';
import CrmNotificationItem from './CrmNotificationItem';

export type CrmTab =
  | 'dashboard'
  | 'referrals'
  | 'agreements'
  | 'participants'
  | 'goals'
  | 'support_plans'
  | 'risk_assessments'
  | 'safeguarding'
  | 'timesheets'
  | 'progress_notes'
  | 'quotes'
  | 'invoicing'
  | 'staff'
  | 'workforce'
  | 'compliance'
  | 'help'
  | 'settings';


export interface CrmContainerProps {
  currentTab: CrmTab;
  onSelectTab: (tab: CrmTab) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchPlaceholder?: string;
  unreadCount?: number;
  referralsCount?: number;
  participantsCount?: number;
  staffCount?: number;
  children: React.ReactNode;
  onOpenAddParticipant?: () => void;
  onOpenAddWorker?: () => void;
  onOpenNewAgreement?: () => void;
}

export default function CrmContainer({
  currentTab,
  onSelectTab,
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search participants, workers, service agreements...',
  unreadCount = 3,
  referralsCount = 0,
  participantsCount = 0,
  staffCount = 0,
  children,
  onOpenAddParticipant,
  onOpenAddWorker,
  onOpenNewAgreement,
}: CrmContainerProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Global Cmd+K shortcut to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleTabClick = (tabKey: CrmTab) => {
    setMobileNavOpen(false);
    onSelectTab(tabKey);
  };

  const isTabActive = (tabKey: CrmTab) => {
    return currentTab === tabKey;
  };


  return (
    <div className="opusApp">
      <a href="#operations-content" className="ocSkipLink">
        Skip to content
      </a>

      {/* Mobile Backdrop Overlay */}
      {mobileNavOpen && (
        <div
          className="mobile-sidebar-overlay"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ================= CANONICAL SIDEBAR ================= */}
      <aside className={`sidebar ${mobileNavOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="brand-header">
          <Link href="/" className="brand-title-wrap" title="Return to Public Website">
            <Image
              src="/brand/Opus_Care_Logo_Transparent.png"
              alt="Opus Care"
              width={140}
              height={39}
              priority
              style={{ height: 32, width: 'auto', objectFit: 'contain' }}
            />
          </Link>
          <span className="brand-tag">CRM</span>
        </div>

        {/* Navigation Scroller */}
        <div className="nav-tree-scroller">
          {/* Home / Dashboard */}
          <ul className="nav-list">
            <li>
              <button
                type="button"
                className={`nav-link ${isTabActive('dashboard') ? 'active' : ''}`}
                onClick={() => handleTabClick('dashboard')}
              >
                <div className="nav-link-left">
                  <Home size={17} />
                  <span>Home</span>
                </div>
              </button>
            </li>
          </ul>

          {/* Group 1: Participant Care */}
          <div className="nav-group-label">Participant Care</div>
          <ul className="nav-list">
            <li>
              <button
                type="button"
                className={`nav-link ${isTabActive('participants') ? 'active' : ''}`}
                onClick={() => handleTabClick('participants')}
              >
                <div className="nav-link-left">
                  <Users size={17} />
                  <span>Participants</span>
                </div>
                {participantsCount > 0 && (
                  <span className="nav-counter">{participantsCount}</span>
                )}
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`nav-link ${isTabActive('referrals') ? 'active' : ''}`}
                onClick={() => handleTabClick('referrals')}
              >
                <div className="nav-link-left">
                  <UserPlus size={17} />
                  <span>Referrals</span>
                </div>
                {referralsCount > 0 && (
                  <span className="nav-counter alert">{referralsCount}</span>
                )}
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`nav-link ${isTabActive('goals') ? 'active' : ''}`}
                onClick={() => handleTabClick('goals')}
              >
                <div className="nav-link-left">
                  <Target size={17} />
                  <span>Goals</span>
                </div>
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`nav-link ${isTabActive('support_plans') ? 'active' : ''}`}
                onClick={() => handleTabClick('support_plans')}
              >
                <div className="nav-link-left">
                  <ClipboardList size={17} />
                  <span>Support Plans</span>
                </div>
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`nav-link ${isTabActive('risk_assessments') ? 'active' : ''}`}
                onClick={() => handleTabClick('risk_assessments')}
              >
                <div className="nav-link-left">
                  <AlertTriangle size={17} />
                  <span>Risk</span>
                </div>
              </button>
            </li>
          </ul>

          {/* Group 2: Service Delivery */}
          <div className="nav-group-label">Service Delivery</div>
          <ul className="nav-list">
            <li>
              <button
                type="button"
                className={`nav-link ${isTabActive('workforce') ? 'active' : ''}`}
                onClick={() => handleTabClick('workforce')}
              >
                <div className="nav-link-left">
                  <CalendarClock size={17} />
                  <span>Roster</span>
                </div>
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`nav-link ${isTabActive('progress_notes') ? 'active' : ''}`}
                onClick={() => handleTabClick('progress_notes')}
              >
                <div className="nav-link-left">
                  <FileCheck size={17} />
                  <span>Progress Notes</span>
                </div>
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`nav-link ${isTabActive('timesheets') ? 'active' : ''}`}
                onClick={() => handleTabClick('timesheets')}
              >
                <div className="nav-link-left">
                  <Clock size={17} />
                  <span>Timesheets</span>
                </div>
              </button>
            </li>
          </ul>

          {/* Group 3: Finance */}
          <div className="nav-group-label">Finance</div>
          <ul className="nav-list">
            <li>
              <button
                type="button"
                className={`nav-link ${isTabActive('quotes') ? 'active' : ''}`}
                onClick={() => handleTabClick('quotes')}
              >
                <div className="nav-link-left">
                  <Calculator size={17} />
                  <span>Quotes &amp; Funding</span>
                </div>
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`nav-link ${isTabActive('invoicing') ? 'active' : ''}`}
                onClick={() => handleTabClick('invoicing')}
              >
                <div className="nav-link-left">
                  <Receipt size={17} />
                  <span>Invoices</span>
                </div>
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`nav-link ${isTabActive('agreements') ? 'active' : ''}`}
                onClick={() => handleTabClick('agreements')}
              >
                <div className="nav-link-left">
                  <FileText size={17} />
                  <span>Agreements</span>
                </div>
              </button>
            </li>
          </ul>

          {/* Group 4: Quality & Governance */}
          <div className="nav-group-label">Quality &amp; Governance</div>
          <ul className="nav-list">
            <li>
              <button
                type="button"
                className={`nav-link ${isTabActive('safeguarding') ? 'active' : ''}`}
                onClick={() => handleTabClick('safeguarding')}
              >
                <div className="nav-link-left">
                  <Shield size={17} />
                  <span>Safeguarding &amp; Incidents</span>
                </div>
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`nav-link ${isTabActive('compliance') ? 'active' : ''}`}
                onClick={() => handleTabClick('compliance')}
              >
                <div className="nav-link-left">
                  <ShieldCheck size={17} />
                  <span>Compliance &amp; Training</span>
                </div>
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`nav-link ${isTabActive('help') ? 'active' : ''}`}
                onClick={() => handleTabClick('help')}
              >
                <div className="nav-link-left">
                  <BookOpen size={17} />
                  <span>Help Centre &amp; Guide</span>
                </div>
              </button>
            </li>
          </ul>

          {/* Group 5: Workforce */}
          <div className="nav-group-label">Workforce</div>
          <ul className="nav-list">
            <li>
              <button
                type="button"
                className={`nav-link ${isTabActive('staff') ? 'active' : ''}`}
                onClick={() => handleTabClick('staff')}
              >
                <div className="nav-link-left">
                  <UserCheck size={17} />
                  <span>Workers &amp; Credentials</span>
                </div>
                {staffCount > 0 && (
                  <span className="nav-counter">{staffCount}</span>
                )}
              </button>
            </li>
          </ul>

          {/* Group 6: Platform (Clearly Coming Later or Settings) */}
          <div className="nav-group-label">Platform</div>
          <ul className="nav-list">
            <li>
              <button
                type="button"
                className="nav-link"
                style={{ opacity: 0.65, cursor: 'default' }}
                title="Automations Engine — Coming in Phase 1"
                disabled
              >
                <div className="nav-link-left">
                  <Sparkles size={17} />
                  <span>Automations</span>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, background: '#F1F5F9', color: '#94A3B8', padding: '1px 6px', borderRadius: 6 }}>
                  Later
                </span>
              </button>
            </li>
            <li>
              <button
                type="button"
                className="nav-link"
                style={{ opacity: 0.65, cursor: 'default' }}
                title="Integrations Hub — Coming in Phase 1"
                disabled
              >
                <div className="nav-link-left">
                  <Layers size={17} />
                  <span>Integrations</span>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, background: '#F1F5F9', color: '#94A3B8', padding: '1px 6px', borderRadius: 6 }}>
                  Later
                </span>
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`nav-link ${isTabActive('settings') ? 'active' : ''}`}
                onClick={() => handleTabClick('settings')}
              >
                <div className="nav-link-left">
                  <Settings size={17} />
                  <span>Settings</span>
                </div>
              </button>
            </li>
          </ul>
        </div>

        {/* Sidebar Footer with User Profile */}
        <div className="sidebar-footer">
          <div
            className="user-block"
            onClick={() => handleTabClick('settings')}
            title="Administrator Profile & Settings"
          >
            <div className="user-avatar">OA</div>
            <div className="user-meta" style={{ minWidth: 0, flex: 1 }}>
              <div className="user-meta-name">Opus Admin</div>
              <div className="user-meta-sub" style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                support@opuscare.com.au
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ================= MAIN VIEWPORT ================= */}
      <main className="main-viewport">
        {/* Top Action Bar */}
        <header className="top-action-bar">
          <div className="top-bar-left-cluster">
            {/* Mobile Hamburger Button */}
            <button
              type="button"
              className="mobile-menu-toggle"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              aria-label={mobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileNavOpen}
            >
              {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Mobile Brand Link */}
            <Link href="/" className="mobile-brand-title" title="Return to Public Site">
              <Image
                src="/brand/Opus_Care_Logo_Transparent.png"
                alt="Opus Care"
                width={110}
                height={30}
                priority
                style={{ height: 26, width: 'auto', objectFit: 'contain' }}
              />
            </Link>
          </div>

          <div className="search-container">
            <Search size={16} />
            <input
              ref={searchInputRef}
              type="search"
              aria-label="Search operations"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
            />
            {searchQuery ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => onSearchChange('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
              >
                <X size={14} />
              </button>
            ) : (
              <span className="shortcut-badge">⌘K</span>
            )}
          </div>

          <div className="quick-actions">
            {onOpenAddParticipant && (
              <button
                type="button"
                className="btn btn-surface"
                onClick={onOpenAddParticipant}
              >
                <Plus size={15} />
                <span>Participant</span>
              </button>
            )}

            {onOpenAddWorker && (
              <button
                type="button"
                className="btn btn-surface"
                onClick={onOpenAddWorker}
              >
                <Plus size={15} />
                <span>Worker</span>
              </button>
            )}

            {onOpenNewAgreement && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={onOpenNewAgreement}
              >
                <FileText size={15} />
                <span>New Agreement</span>
              </button>
            )}

            {/* Notification Bell */}
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="btn btn-surface"
              style={{ width: 38, height: 38, padding: 0, justifyContent: 'center', position: 'relative' }}
              title="View Activity & Notifications"
              aria-label="Notifications"
              aria-expanded={showNotifications}
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    background: 'var(--brand-primary)',
                    color: '#FFFFFF',
                    fontSize: 10,
                    fontWeight: 700,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #FFFFFF',
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Notifications Slide-Over Flyout */}
        {showNotifications && (
          <div
            style={{
              position: 'absolute',
              right: 36,
              top: 72,
              zIndex: 100,
              width: 380,
              maxWidth: '90vw',
              background: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-card)',
              boxShadow: '0 16px 40px rgba(15, 23, 42, 0.14)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                  Notifications
                </h3>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Live operational & compliance alerts
                </p>
              </div>
              <button
                type="button"
                aria-label="Close notifications"
                onClick={() => setShowNotifications(false)}
                className="btn-close-icon"
                style={{ width: 28, height: 28 }}
              >
                <X size={15} />
              </button>
            </div>

            <div style={{ maxHeight: 380, overflowY: 'auto' }}>
              <div
                style={{
                  padding: '10px 20px 4px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Today
              </div>
              <CrmNotificationItem
                id="notif-1"
                title="Service Agreement Signed"
                description="Liam Davies signed the participant agreement."
                timestamp="15m ago"
                icon={<FileCheck size={16} />}
                tint="teal"
                unread
                actionLabel="View"
                onAction={() => {
                  setShowNotifications(false);
                  onSelectTab('agreements');
                }}
              />
              <CrmNotificationItem
                id="notif-2"
                title="New Inbound Referral"
                description="Sarah Jenkins submitted intake inquiry from Yamba NSW."
                timestamp="1h ago"
                icon={<UserPlus size={16} />}
                tint="emerald"
                unread
                actionLabel="Open"
                onAction={() => {
                  setShowNotifications(false);
                  onSelectTab('referrals');
                }}
              />
              <CrmNotificationItem
                id="notif-3"
                title="Shift Roster Published"
                description="Next week's Clarence Valley shifts are assigned and confirmed."
                timestamp="3h ago"
                icon={<CalendarClock size={16} />}
                tint="sky"
                actionLabel="Roster"
                onAction={() => {
                  setShowNotifications(false);
                  onSelectTab('workforce');
                }}
              />

              <div
                style={{
                  padding: '10px 20px 4px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  borderTop: '1px solid var(--border-subtle)',
                }}
              >
                Yesterday
              </div>
              <CrmNotificationItem
                id="notif-4"
                title="Worker Clearance Verified"
                description="James Wilson NDISWC clearance validated and recorded."
                timestamp="Yesterday"
                icon={<CheckCircle2 size={16} />}
                tint="indigo"
                actionLabel="Staff"
                onAction={() => {
                  setShowNotifications(false);
                  onSelectTab('staff');
                }}
              />
              <CrmNotificationItem
                id="notif-5"
                title="NDIS Pricing Reference Synchronized"
                description="Official NDIA Pricing Arrangements 2025/2026 active."
                timestamp="Yesterday"
                icon={<Sparkles size={16} />}
                tint="amber"
                actionLabel="Details"
                onAction={() => {
                  setShowNotifications(false);
                  onSelectTab('settings');
                }}
              />
            </div>

            <div
              style={{
                padding: '10px 16px',
                background: 'var(--bg-canvas)',
                textAlign: 'center',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                You&apos;re all caught up with NDIS compliance!
              </span>
            </div>
          </div>
        )}

        {/* Workspace Canvas */}
        <div id="operations-content" tabIndex={-1} className="workspace-content">
          {children}
        </div>
      </main>
    </div>
  );
}
