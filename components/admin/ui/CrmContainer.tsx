'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  LayoutDashboard,
  UserPlus,
  Users,
  CalendarClock,
  FileText,
  UserCheck,
  GraduationCap,
  Settings,
  Search,
  Bell,
  CheckCircle2,
  X,
  FileCheck,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Sparkles,
  Target,
  ClipboardList,
  ShieldCheck,
  Calculator,
  Receipt,
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
  searchPlaceholder = 'Search participants, workers, agreements...',
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

  const NAV_ITEMS: { id: CrmTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'dashboard', label: 'Home', icon: <LayoutDashboard size={16} /> },
    {
      id: 'referrals',
      label: 'Referrals',
      icon: <UserPlus size={16} />,
      count: referralsCount > 0 ? referralsCount : undefined,
    },
    {
      id: 'participants',
      label: 'Participants',
      icon: <Users size={16} />,
      count: participantsCount > 0 ? participantsCount : undefined,
    },
    { id: 'goals', label: 'Goals', icon: <Target size={16} /> },
    { id: 'support_plans', label: 'Support Plans', icon: <ClipboardList size={16} /> },
    { id: 'risk_assessments', label: 'Risk', icon: <ShieldCheck size={16} /> },
    { id: 'workforce', label: 'Roster', icon: <CalendarClock size={16} /> },
    { id: 'timesheets', label: 'Timesheets', icon: <Clock size={16} /> },
    { id: 'progress_notes', label: 'Progress Notes', icon: <FileCheck size={16} /> },
    { id: 'quotes', label: 'Quotes & Budgets', icon: <Calculator size={16} /> },
    { id: 'invoicing', label: 'Invoicing & Claims', icon: <Receipt size={16} /> },
    { id: 'agreements', label: 'Agreements', icon: <FileText size={16} /> },
    { id: 'safeguarding', label: 'Safeguarding', icon: <ShieldAlert size={16} /> },
    {
      id: 'staff',
      label: 'Workers',
      icon: <UserCheck size={16} />,
      count: staffCount > 0 ? staffCount : undefined,
    },
    { id: 'compliance', label: 'Training', icon: <GraduationCap size={16} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
  ];

  return (
    <div className="vsCanvas">
      <a href="#operations-content" className="ocSkipLink">Skip to content</a>
      {/* Main Horizontal Window with Vertical Left Dock */}
      <div className="vsWindowHorizontal">
        {/* VERTICAL LEFT DOCK (Matching VibeStore Pill Style on Left Side) */}
        <aside className="vsLeftDock">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Brand Logo & Tag */}
            <Link
              href="/"
              className="vsBrandLogoBox"
              title="Return to Public Website"
              style={{ padding: '0 4px' }}
            >
              <div className="vsLogoIcon">
                <Image
                  src="/brand/Opus_Care_Mark.png"
                  alt="Opus Care"
                  width={28}
                  height={28}
                  priority
                  style={{ objectFit: 'contain' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="vsBrandName">Opus Care</span>
                <span className="vsTagCrm">CRM</span>
              </div>
            </Link>

            {/* Vertical Stack of Navigation Pills */}
            <nav aria-label="Main Navigation" className="vsNavListVertical">
              {NAV_ITEMS.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <React.Fragment key={item.id}>
                    {item.id === 'participants' && <div className="ocNavGroup">Participant care</div>}
                    {item.id === 'workforce' && <div className="ocNavGroup">Service delivery</div>}
                    {item.id === 'quotes' && <div className="ocNavGroup">Finance & governance</div>}
                    {item.id === 'staff' && <div className="ocNavGroup">People & workspace</div>}
                  <button
                    key={item.id}
                    aria-current={isActive ? 'page' : undefined}
                    type="button"
                    onClick={() => onSelectTab(item.id)}
                    className={`vsDockBtnVertical ${isActive ? 'active' : ''}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    {item.count !== undefined && (
                      <span className="vsDockBadge">
                        {item.count}
                      </span>
                    )}
                  </button>
                  </React.Fragment>
                );
              })}
            </nav>
          </div>

          {/* Bottom Profile & System Sync Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid rgba(226, 232, 240, 0.85)', paddingTop: 16 }}>
            <div
              onClick={() => onSelectTab('settings')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 14,
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--oc-background)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <div className="vsAvatarBtn" style={{ width: 34, height: 34, fontSize: '0.8125rem' }}>
                OA
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--oc-text)', lineHeight: 1.2 }}>Opus Admin</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--oc-muted)' }}>support@opuscare...</div>
              </div>
            </div>

            <div
              className="vsLivePill"
              title="Opus Care operations"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <span className="vsLiveDot" />
              <span>Operations workspace</span>
            </div>
          </div>
        </aside>

        {/* RIGHT MAIN PANEL */}
        <div className="vsMainPanel">
          {/* Top Search & Actions Header Bar */}
          <header className="vsTopBar">
            <div className="vsTopBarRow">
              {/* Full-Width Search Input (VibeStore Style) */}
              <div className="vsSearchWrap" style={{ flex: 1 }}>
                <div className="vsSearchBar">
                  <Search size={16} color="var(--oc-muted)" style={{ flexShrink: 0 }} />
                  <input
                    type="search"
                    aria-label="Search operations"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="vsSearchInput"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      aria-label="Clear search"
                      onClick={() => onSearchChange('')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--oc-muted)', display: 'flex', alignItems: 'center' }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Right Quick Action Triggers & Bell */}
              <div className="vsTopActions">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {onOpenAddParticipant && (
                    <button
                      type="button"
                      onClick={onOpenAddParticipant}
                      className="vsBtnOutline"
                    >
                      + Participant
                    </button>
                  )}
                  {onOpenAddWorker && (
                    <button
                      type="button"
                      onClick={onOpenAddWorker}
                      className="vsBtnOutline"
                    >
                      + Worker
                    </button>
                  )}
                  {onOpenNewAgreement && (
                    <button
                      type="button"
                      onClick={onOpenNewAgreement}
                      className="vsBtnTinted"
                    >
                      New agreement
                    </button>
                  )}
                </div>

                {/* Notification Bell */}
                <button
                  type="button"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="vsBellBtn"
                  title="View Activity & Notifications"
                  aria-label="Notifications"
                  aria-expanded={showNotifications}
                >
                  <Bell size={16} />
                  {unreadCount > 0 && (
                    <span className="vsBellBadge">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </header>

          {/* Notifications Slide-Over Flyout (Matching Screen 3) */}
          {showNotifications && (
            <div
              style={{
                position: 'absolute',
                right: 28,
                top: 80,
                zIndex: 100,
                width: 380,
                maxWidth: '90vw',
                background: 'var(--oc-surface)',
                borderRadius: 20,
                border: '1px solid rgba(0, 0, 0, 0.08)',
                boxShadow: '0 16px 40px rgba(15, 23, 42, 0.14)',
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--oc-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--oc-text)' }}>Notifications</h3>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--oc-muted)' }}>Live operational & compliance alerts</p>
                </div>
                <button
                  type="button"
                  aria-label="Close notifications"
                  onClick={() => setShowNotifications(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--oc-muted)', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              </div>

              <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                <div style={{ padding: '8px 18px 4px', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--oc-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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

                <div style={{ padding: '8px 18px 4px', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--oc-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderTop: '1px solid var(--oc-subtle)' }}>
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
              <div style={{ padding: '10px', background: 'var(--oc-background)', textAlign: 'center', borderTop: '1px solid var(--oc-subtle)' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--oc-muted)' }}>
                  You&apos;re all caught up with NDIS compliance!
                </span>
              </div>
            </div>
          )}

          {/* Main Tab Content */}
          <main id="operations-content" tabIndex={-1} className="ocMain" style={{ flex: 1 }}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
