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
  | 'invoicing'
  | 'quotes'
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
                  <button
                    key={item.id}
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
              onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <div className="vsAvatarBtn" style={{ width: 34, height: 34, fontSize: '0.75rem' }}>
                OA
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>Opus Admin</div>
                <div style={{ fontSize: '0.7rem', color: '#64748B' }}>support@opuscare...</div>
              </div>
            </div>

            <div
              className="vsLivePill"
              title="Connected to Supabase Sydney (ap-southeast-2)"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <span className="vsLiveDot" />
              <span>Sydney Live (ap-southeast-2)</span>
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
                  <Search size={16} color="#94A3B8" style={{ flexShrink: 0 }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="vsSearchInput"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => onSearchChange('')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex', alignItems: 'center' }}
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
                      + New Pack
                    </button>
                  )}
                </div>

                {/* Notification Bell */}
                <button
                  type="button"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="vsBellBtn"
                  title="View Activity & Notifications"
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
                background: '#FFFFFF',
                borderRadius: 20,
                border: '1px solid rgba(0, 0, 0, 0.08)',
                boxShadow: '0 16px 40px rgba(15, 23, 42, 0.14)',
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>Notifications</h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>Live operational & compliance alerts</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNotifications(false)}
                  style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              </div>

              <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                <div style={{ padding: '8px 18px 4px', fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Today
                </div>
                <CrmNotificationItem
                  id="notif-1"
                  title="Service Agreement Signed"
                  description="Liam Davies digitally executed PACK-PART-01 with SHA-256 seal."
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

                <div style={{ padding: '8px 18px 4px', fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', borderTop: '1px solid #F1F5F9' }}>
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
              <div style={{ padding: '10px', background: '#F8FAFC', textAlign: 'center', borderTop: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>
                  You&apos;re all caught up with NDIS compliance!
                </span>
              </div>
            </div>
          )}

          {/* Main Tab Content */}
          <main style={{ padding: '24px 28px', flex: 1 }}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
