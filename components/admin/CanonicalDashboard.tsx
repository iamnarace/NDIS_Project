'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  UserCheck,
  FileText,
  AlertCircle,
  CalendarClock,
  Clock,
  ArrowRight,
} from 'lucide-react';

export interface CanonicalDashboardProps {
  participants: any[];
  referrals: any[];
  staff: any[];
  agreements: any[];
  countNew: number;
  financeMetrics: {
    delivered_hours_mtd?: number;
    gross_invoiced_mtd?: number;
    paid_claims_mtd?: number;
    outstanding_claims?: number;
    unbilled_hours?: number;
    unbilled_amount?: number;
  } | null;
  onSelectTab: (tab: any) => void;
  onOpenAgreementGenerator?: () => void;
  onOpenAddParticipant?: () => void;
  onOpenAddWorker?: () => void;
}

export default function CanonicalDashboard({
  participants,
  referrals,
  staff,
  agreements,
  countNew,
  financeMetrics,
  onSelectTab,
}: CanonicalDashboardProps) {
  const [upcomingShifts, setUpcomingShifts] = useState<any[]>([]);
  const [shiftsLoading, setShiftsLoading] = useState(true);
  const [pendingTimesheetsCount, setPendingTimesheetsCount] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;

    async function loadDeliveryData() {
      try {
        const [shiftsRes, tsRes] = await Promise.all([
          fetch('/api/workforce/shifts'),
          fetch('/api/workforce/timesheets'),
        ]);

        if (isMounted) {
          if (shiftsRes.ok) {
            const sData = await shiftsRes.json();
            const list = Array.isArray(sData) ? sData : [];
            const now = Date.now();
            // Filter start_time >= current time, exclude cancelled / completed
            const filtered = list.filter((shift: any) => {
              if (!shift.start_time) return false;
              const shiftTime = new Date(shift.start_time).getTime();
              if (isNaN(shiftTime) || shiftTime < now) return false;
              const status = (shift.status || '').toLowerCase();
              if (status === 'cancelled' || status === 'completed') return false;
              return true;
            });
            filtered.sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
            setUpcomingShifts(filtered);
          }
          if (tsRes.ok) {
            const tData = await tsRes.json();
            const tsList = Array.isArray(tData) ? tData : tData.timesheets || [];
            const pending = tsList.filter((t: any) => {
              const st = (t.status || '').toLowerCase();
              return st === 'submitted' || st === 'pending';
            }).length;
            setPendingTimesheetsCount(pending);
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard shifts/timesheets', err);
      } finally {
        if (isMounted) setShiftsLoading(false);
      }
    }

    loadDeliveryData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Factual participant status check
  const hasParticipantStatus = participants.some(
    (p) => typeof p.status === 'string' && p.status.trim() !== ''
  );
  const activeParticipantsCount = hasParticipantStatus
    ? participants.filter((p) => (p.status || '').toLowerCase() === 'active').length
    : participants.length;
  const participantKpiLabel = hasParticipantStatus ? 'Active Participants' : 'Participants';

  // Factual live compliance calculations
  const staffCount = staff.length;
  const hasExpiryData = staff.some(
    (s) => s.ndisScreeningExpiry || s.ndis_screening_expiry
  );
  const clearedStaffCount = staff.filter((s) => {
    const expiry = s.ndisScreeningExpiry || s.ndis_screening_expiry;
    if (expiry) {
      const expiryTime = new Date(expiry).getTime();
      return !isNaN(expiryTime) && expiryTime > Date.now();
    }
    const scr = (s.ndisScreening || s.ndis_screening || '').toLowerCase().trim();
    return scr === 'verified' || scr === 'cleared' || scr === 'current';
  }).length;

  const clearedStaffPct =
    staffCount > 0 ? Math.round((clearedStaffCount / staffCount) * 100) : 0;

  const activeAgreements = agreements.filter(
    (a) => a.status === 'active' || a.status === 'executed'
  ).length;

  const pendingAgreements = agreements.filter(
    (a) =>
      a.status === 'draft' ||
      a.status === 'pending_signature' ||
      a.status === 'in_review'
  ).length;

  const attentionTasksCount =
    (countNew > 0 ? 1 : 0) +
    (pendingAgreements > 0 ? 1 : 0) +
    (pendingTimesheetsCount > 0 ? 1 : 0) +
    (staffCount > 0 && staffCount > clearedStaffCount ? 1 : 0);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header-row">
        <h1 className="page-title">Your care operations, at a glance</h1>
        <p className="page-subtitle">
          Review incoming referrals, coordinate your team, and keep participant support moving.
        </p>
      </div>

      {/* ONE High-Priority Action Banner */}
      <div className="priority-alert-banner">
        <div className="alert-left-details">
          <div className="alert-bell-bubble" aria-hidden="true">
            🔔
          </div>
          <div className="alert-text-title">
            {countNew > 0
              ? `${countNew} new referral${countNew === 1 ? '' : 's'} waiting for review`
              : 'All intake referrals reviewed — intake pipeline active'}
          </div>
        </div>
        <button
          type="button"
          className="btn-alert-review"
          onClick={() => onSelectTab('referrals')}
        >
          <span>Review Intake</span>
          <ArrowRight size={14} strokeWidth={2.5} />
        </button>
      </div>

      {/* 4 Bright Pastel KPI Cards (Uniform Row) */}
      <div className="kpi-row-grid">
        {/* 1. Active Participants (Sky / Cyan) */}
        <div className="kpi-card cyan">
          <div className="kpi-head">
            <span className="kpi-label">{participantKpiLabel}</span>
            <Users className="kpi-icon" size={24} />
          </div>
          <div className="kpi-number">{activeParticipantsCount}</div>
          <div className="kpi-bottom-row">
            <span className="kpi-badge">
              {hasParticipantStatus && participants.length !== activeParticipantsCount
                ? `${activeParticipantsCount} of ${participants.length} Active`
                : 'Plan & Self-Managed'}
            </span>
            <button
              type="button"
              className="kpi-link"
              onClick={() => onSelectTab('participants')}
            >
              <span>Directory</span>
              <ArrowRight size={13} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* 2. New Referrals (Peach / Amber) */}
        <div className="kpi-card amber">
          <div className="kpi-head">
            <span className="kpi-label">New Referrals</span>
            <UserPlus className="kpi-icon" size={24} />
          </div>
          <div className="kpi-number">{countNew}</div>
          <div className="kpi-bottom-row">
            <span className="kpi-badge">{countNew} Awaiting Intake</span>
            <button
              type="button"
              className="kpi-link"
              onClick={() => onSelectTab('referrals')}
            >
              <span>Review</span>
              <ArrowRight size={13} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* 3. Workforce (Mint / Emerald) */}
        <div className="kpi-card mint">
          <div className="kpi-head">
            <span className="kpi-label">Workforce</span>
            <UserCheck className="kpi-icon" size={24} />
          </div>
          <div className="kpi-number">{staffCount}</div>
          <div className="kpi-bottom-row">
            <span className="kpi-badge">
              {staffCount === 0
                ? 'No workers registered'
                : hasExpiryData
                ? `${clearedStaffPct}% NDISWC Cleared`
                : clearedStaffCount > 0
                ? `${clearedStaffCount} Verified Active`
                : 'Credential review available'}
            </span>
            <button
              type="button"
              className="kpi-link"
              onClick={() => onSelectTab('staff')}
            >
              <span>Manage</span>
              <ArrowRight size={13} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* 4. Agreements (Lavender / Purple) */}
        <div className="kpi-card lavender">
          <div className="kpi-head">
            <span className="kpi-label">Active Agreements</span>
            <FileText className="kpi-icon" size={24} />
          </div>
          <div className="kpi-number">{activeAgreements}</div>
          <div className="kpi-bottom-row">
            <span className="kpi-badge">
              {pendingAgreements > 0
                ? `${pendingAgreements} Pending Review`
                : `${activeAgreements} Active in Effect`}
            </span>
            <button
              type="button"
              className="kpi-link"
              onClick={() => onSelectTab('agreements')}
            >
              <span>Agreements</span>
              <ArrowRight size={13} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Strict 65% / 35% Operational Workbench */}
      <div className="operational-workbench">
        {/* LEFT COLUMN (65%): Things Needing Attention & Upcoming Shifts */}
        <div className="workbench-left">
          {/* Section 1: Things Needing Attention */}
          <div className="white-card">
            <div className="card-header-bar">
              <h2 className="card-header-title">
                <AlertCircle size={18} color="#4F46E5" />
                Things Needing Attention
              </h2>
              {attentionTasksCount > 0 ? (
                <button
                  type="button"
                  className="card-link-muted"
                  onClick={() =>
                    onSelectTab(
                      countNew > 0
                        ? 'referrals'
                        : pendingAgreements > 0
                        ? 'agreements'
                        : pendingTimesheetsCount > 0
                        ? 'timesheets'
                        : 'staff'
                    )
                  }
                >
                  View all tasks ({attentionTasksCount})
                </button>
              ) : (
                <span style={{ fontSize: 12.5, color: '#059669', fontWeight: 600 }}>
                  All caught up
                </span>
              )}
            </div>

            {attentionTasksCount === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 4 }}>
                  All operational tasks completed
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                  No pending intake referrals, agreement drafts, timesheet approvals, or clearance alerts requiring immediate action.
                </p>
              </div>
            ) : (
              <div className="attention-list">
                {/* Intake Item */}
                {countNew > 0 && (
                  <div className="attention-item">
                    <div className="att-meta">
                      <div className="att-status-indicator indicator-amber" />
                      <div>
                        <div className="att-title">
                          Intake &amp; Onboarding: Participant Referral{countNew > 1 ? 's' : ''}
                        </div>
                        <div className="att-desc">
                          {countNew} intake document{countNew === 1 ? '' : 's'} received • Needs coordinator allocation
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-table-action"
                      onClick={() => onSelectTab('referrals')}
                    >
                      Review Intake
                    </button>
                  </div>
                )}

                {/* Agreement Item */}
                {pendingAgreements > 0 && (
                  <div className="attention-item">
                    <div className="att-meta">
                      <div className="att-status-indicator indicator-brand" />
                      <div>
                        <div className="att-title">
                          Schedule of Supports: Service Agreement Draft{pendingAgreements > 1 ? 's' : ''}
                        </div>
                        <div className="att-desc">
                          {pendingAgreements} agreement draft{pendingAgreements === 1 ? '' : 's'} awaiting coordinator or recipient sign-off
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-table-action"
                      onClick={() => onSelectTab('agreements')}
                    >
                      Open Agreements
                    </button>
                  </div>
                )}

                {/* Timesheet Approval Item */}
                {pendingTimesheetsCount > 0 && (
                  <div className="attention-item">
                    <div className="att-meta">
                      <div className="att-status-indicator indicator-amber" />
                      <div>
                        <div className="att-title">Timesheet Authorization</div>
                        <div className="att-desc">
                          {pendingTimesheetsCount} timesheet{pendingTimesheetsCount === 1 ? '' : 's'} awaiting manager billing authorization
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-table-action"
                      onClick={() => onSelectTab('timesheets')}
                    >
                      Review Timesheets
                    </button>
                  </div>
                )}

                {/* Clearance Item */}
                {staffCount > 0 && staffCount > clearedStaffCount && (
                  <div className="attention-item">
                    <div className="att-meta">
                      <div className="att-status-indicator indicator-amber" />
                      <div>
                        <div className="att-title">Worker Clearance Validation</div>
                        <div className="att-desc">
                          {hasExpiryData
                            ? `${clearedStaffCount} of ${staffCount} active support workers verified with valid NDISWC`
                            : `${staffCount - clearedStaffCount} worker${staffCount - clearedStaffCount === 1 ? '' : 's'} require credential review`}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-table-action"
                      onClick={() => onSelectTab('staff')}
                    >
                      View Workers
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 2: Upcoming Shifts */}
          <div className="white-card">
            <div className="card-header-bar">
              <h2 className="card-header-title">
                <CalendarClock size={18} color="#0D9488" />
                Upcoming Shifts &amp; Service Delivery
              </h2>
              <button
                type="button"
                className="card-link-muted"
                onClick={() => onSelectTab('workforce')}
              >
                Open Roster →
              </button>
            </div>

            {shiftsLoading ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '16px 0' }}>
                Loading live roster shifts...
              </p>
            ) : upcomingShifts.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 12px' }}>
                  No upcoming shifts currently scheduled.
                </p>
                <button
                  type="button"
                  className="btn-table-action"
                  onClick={() => onSelectTab('workforce')}
                >
                  Create Shift in Roster
                </button>
              </div>
            ) : (
              <table className="data-table-simple">
                <thead>
                  <tr>
                    <th>Participant</th>
                    <th>Support Worker</th>
                    <th>Region</th>
                    <th>Scheduled Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingShifts.slice(0, 5).map((shift: any) => {
                    const participantName =
                      shift.participant?.full_name ||
                      participants.find((p) => p.id === shift.participant_id)?.name ||
                      shift.participant_name ||
                      'Participant';

                    const workerName =
                      shift.assignments?.[0]?.staff?.full_name ||
                      staff.find((s) => s.id === shift.staff_id || s.id === shift.assignments?.[0]?.staff_id)?.name ||
                      shift.worker_name ||
                      shift.assigned_worker?.name ||
                      'Unassigned';

                    const startTime = shift.start_time ? new Date(shift.start_time) : null;
                    const formattedTime = startTime
                      ? `${startTime.toLocaleDateString('en-AU', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}, ${startTime.toLocaleTimeString('en-AU', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}`
                      : 'Scheduled';

                    const locationText =
                      shift.location_suburb ||
                      shift.location_address ||
                      'Location not recorded';

                    const isConfirmed = shift.status === 'confirmed' || shift.status === 'completed';

                    return (
                      <tr key={shift.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-heading)' }}>
                          {participantName}
                        </td>
                        <td>{workerName}</td>
                        <td>{locationText}</td>
                        <td>{formattedTime}</td>
                        <td>
                          <span
                            className={`pill-semantic ${
                              isConfirmed ? 'pill-mint' : 'pill-amber'
                            }`}
                          >
                            {shift.status ? shift.status.charAt(0).toUpperCase() + shift.status.slice(1) : 'Scheduled'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (35%): Delivery & Billing */}
        <div className="workbench-right">
          <div className="white-card">
            <div className="card-header-bar">
              <h2 className="card-header-title">Delivery &amp; Billing</h2>
              <button
                type="button"
                className="card-link-muted"
                onClick={() => onSelectTab('invoicing')}
              >
                Invoicing →
              </button>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
              Real-time metrics derived from verified shift logs and claims.
            </p>

            {/* Financial Metric Grid */}
            <div className="billing-grid-stats">
              {/* Delivered Hours */}
              <div className="billing-stat-box">
                <div className="stat-label-tiny">Delivered Hours</div>
                <div className="stat-value-prominent">
                  {(financeMetrics?.delivered_hours_mtd || 0).toFixed(1)}{' '}
                  <span style={{ fontSize: 13, fontWeight: 500 }}>hrs</span>
                </div>
                <div className="stat-meta-note">Verified shift logs</div>
              </div>

              {/* Gross Invoiced */}
              <div className="billing-stat-box">
                <div className="stat-label-tiny">Invoiced (MTD)</div>
                <div className="stat-value-prominent">
                  $
                  {(financeMetrics?.gross_invoiced_mtd || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <div className="stat-meta-note success">Invoices issued</div>
              </div>

              {/* Paid Claims */}
              <div className="billing-stat-box">
                <div className="stat-label-tiny">Paid Claims</div>
                <div className="stat-value-prominent">
                  $
                  {(financeMetrics?.paid_claims_mtd || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <div className="stat-meta-note">Payments recorded</div>
              </div>

              {/* Unbilled Value */}
              <div
                className="billing-stat-box"
                style={{ background: 'var(--status-rose-bg)', borderColor: '#FECDD3' }}
              >
                <div className="stat-label-tiny" style={{ color: '#9F1239' }}>
                  Unbilled Value
                </div>
                <div className="stat-value-prominent" style={{ color: 'var(--status-rose)' }}>
                  $
                  {(financeMetrics?.unbilled_amount || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <div className="stat-meta-note danger">
                  {(financeMetrics?.unbilled_hours || 0).toFixed(1)} hrs awaiting billing
                </div>
              </div>
            </div>

            {/* Timesheets Approval Prompt */}
            <div className="ts-alert-strip">
              <div className="ts-left">
                <Clock size={16} color="#64748B" />
                <span>Timesheets awaiting approval</span>
              </div>
              <span className="nav-counter">{pendingTimesheetsCount}</span>
            </div>

            {/* Action Stack */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                type="button"
                className="btn btn-surface"
                style={{ justifyContent: 'center', width: '100%' }}
                onClick={() => onSelectTab('timesheets')}
              >
                Review Timesheets
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ justifyContent: 'center', width: '100%' }}
                onClick={() => onSelectTab('invoicing')}
              >
                Generate Invoices
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
