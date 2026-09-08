'use client';

import LoadingRows from '@/components/ui/LoadingRows';

import DialogPanel from '@/components/ui/DialogPanel';

import { notify } from '@/components/ui/ProductFeedback';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, Clock, User, CheckCircle2, AlertTriangle, 
  XCircle, Filter, Search, Check, Edit3, ArrowRight, Eye, RefreshCw
} from 'lucide-react';

interface TimesheetEntry {
  id: string;
  timesheet_id: string;
  shift_id?: string;
  staff_id: string;
  participant_id?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  actual_start?: string;
  actual_end?: string;
  break_minutes: number;
  actual_hours: number;
  travel_minutes: number;
  kilometres: number;
  variance_minutes: number;
  status: string;
  manager_note?: string;
  shift?: { id: string; shift_reference: string; service_type: string; location_suburb?: string };
  participant?: { id: string; full_name: string; reference_number?: string };
}

interface Timesheet {
  id: string;
  staff_id: string;
  week_start: string;
  week_end: string;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected' | 'Adjusted' | 'Exported';
  submitted_at?: string;
  approved_at?: string;
  notes?: string;
  staff?: { id: string; full_name: string; role: string; reference_number?: string; email?: string; phone?: string };
  entries?: TimesheetEntry[];
}

export default function TimesheetsTab() {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedTimesheet, setSelectedTimesheet] = useState<Timesheet | null>(null);
  const [adjustingEntry, setAdjustingEntry] = useState<TimesheetEntry | null>(null);
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustHours, setAdjustHours] = useState<number>(0);
  const [adjustBreak, setAdjustBreak] = useState<number>(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const loadTimesheets = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      let url = '/api/workforce/timesheets?';
      if (statusFilter !== 'all') url += `status=${statusFilter}&`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Unable to load records');
      if (res.ok) {
        const data = await res.json();
        setTimesheets(data.timesheets || []);
      }
    } catch (err) {
      setLoadError(true);
      console.error('Failed to load timesheets:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadTimesheets();
  }, [loadTimesheets]);

  async function handleApprove(timesheetId: string) {
    if (!confirm('Approve this timesheet? Linked service records will become Ready for Billing.')) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/workforce/timesheets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', timesheet_id: timesheetId }),
      });
      if (res.ok) {
        setNotice('Timesheet approved and service records moved to Ready for billing.');
        loadTimesheets();
        if (selectedTimesheet?.id === timesheetId) setSelectedTimesheet(null);
      } else {
        const d = await res.json();
        notify('Error: ' + (d.error || 'Failed to approve'));
      }
    } catch {
      notify('Network error during timesheet approval.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject(timesheetId: string) {
    const reason = prompt('Please enter rejection reason:');
    if (!reason) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/workforce/timesheets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', timesheet_id: timesheetId, manager_note: reason }),
      });
      if (res.ok) {
        setNotice('Timesheet rejected.');
        loadTimesheets();
        if (selectedTimesheet?.id === timesheetId) setSelectedTimesheet(null);
      } else {
        const d = await res.json();
        notify('Error: ' + (d.error || 'Failed to reject'));
      }
    } catch {
      notify('Network error during timesheet rejection.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleBatchApproveClean() {
    const cleanIds = timesheets
      .filter((t) => t.status === 'Submitted')
      .map((t) => t.id);

    if (cleanIds.length === 0) {
      notify('No submitted timesheets awaiting approval.');
      return;
    }

    if (!confirm(`Batch approve ${cleanIds.length} submitted timesheets?`)) return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/workforce/timesheets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'batch_approve', timesheet_ids: cleanIds }),
      });
      if (res.ok) {
        setNotice(`Successfully batch-approved ${cleanIds.length} timesheets.`);
        loadTimesheets();
      } else {
        const d = await res.json();
        notify('Error: ' + (d.error || 'Batch approval failed'));
      }
    } catch {
      notify('Network error during batch approval.');
    } finally {
      setActionLoading(false);
    }
  }

  function startAdjust(entry: TimesheetEntry) {
    setAdjustingEntry(entry);
    setAdjustHours(entry.actual_hours);
    setAdjustBreak(entry.break_minutes || 0);
    setAdjustReason('');
  }

  async function handleSaveAdjustment(e: React.FormEvent) {
    e.preventDefault();
    if (!adjustingEntry) return;
    if (!adjustReason.trim()) {
      notify('A mandatory reason is required for manual hours adjustment.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/workforce/timesheets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'adjust_entry',
          entry_id: adjustingEntry.id,
          reason: adjustReason,
          updates: {
            actual_hours: adjustHours,
            break_minutes: adjustBreak,
          },
        }),
      });

      if (res.ok) {
        setNotice('Hours adjusted and audit log created.');
        setAdjustingEntry(null);
        loadTimesheets();
      } else {
        const d = await res.json();
        notify('Error: ' + (d.error || 'Adjustment failed'));
      }
    } catch {
      notify('Network error during hours adjustment.');
    } finally {
      setActionLoading(false);
    }
  }

  const filtered = timesheets.filter((t) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      t.staff?.full_name?.toLowerCase().includes(q) ||
      t.staff?.reference_number?.toLowerCase().includes(q) ||
      t.week_start?.includes(q)
    );
  });

  const statusColors: Record<string, { bg: string; text: string }> = {
    Draft: { bg: 'var(--oc-subtle)', text: 'var(--oc-secondary)' },
    Submitted: { bg: '#FEF3C7', text: '#B45309' },
    Approved: { bg: '#ECFDF5', text: '#065F46' },
    Rejected: { bg: 'var(--oc-danger-soft)', text: 'var(--oc-danger)' },
    Adjusted: { bg: 'var(--oc-info-soft)', text: 'var(--oc-accent)' },
    Exported: { bg: '#F5F3FF', text: '#6D28D9' },
  };

  return (
    <div className="crmTabPanel">
      <div className="crmPanelHeader">
        <div>
          <h2 className="crmPanelTitle">Timesheets</h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--oc-muted)' }}>
            Weekly support worker hours, break deductions, mileage variance, and manager billing authorization.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleBatchApproveClean}
            disabled={actionLoading}
            className="vsBtnBlack"
            style={{ padding: '8px 16px', fontSize: '0.82rem' }}
          >
            <CheckCircle2 size={14} style={{ marginRight: 6 }} />
            Batch Approve Submitted
          </button>
        </div>
      </div>

      {notice && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '10px 16px', borderRadius: 10, marginBottom: 16, fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
          <span>? {notice}</span>
          <button onClick={() => setNotice(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>&times;</button>
        </div>
      )}

      {/* Filters Bar */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 360 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--oc-muted)' }} />
          <input aria-label="Search support worker..."
            type="text"
            placeholder="Search support worker..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="crmSearchInput"
            style={{ width: '100%', paddingLeft: 34, height: 38, borderRadius: 8, border: '1px solid var(--oc-border)', fontSize: '0.85rem' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--oc-muted)', fontWeight: 600 }}>Status:</span>
          <select className="ocField" aria-label="All Statuses"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ height: 38, borderRadius: 8, border: '1px solid var(--oc-border)', padding: '0 10px', fontSize: '0.85rem', background: '#FFF' }}
          >
            <option value="all">All Statuses</option>
            <option value="Submitted">Submitted (Pending Review)</option>
            <option value="Approved">Approved</option>
            <option value="Adjusted">Adjusted</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Timesheets Summary Table */}
      <div className="crmTableWrapper">
        <table className="crmTable">
          <thead>
            <tr>
              <th>Support Worker</th>
              <th>Week Period</th>
              <th className="ocNumeric">Shifts</th>
              <th className="ocNumeric">Actual Hours</th>
              <th className="ocNumeric">Variance</th>
              <th>Travel / Kms</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loadError ? (<tr><td colSpan={8}><div className="ocEmpty" role="alert"><strong>Unable to load timesheets</strong><p>Check your connection and try again.</p><button type="button" className="ocTextButton" onClick={loadTimesheets}>Try again</button></div></td></tr>) : loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 30, color: 'var(--oc-muted)' }}><LoadingRows label="Loading timesheets" /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--oc-muted)' }}><div className="ocEmpty"><strong>No timesheets to review</strong><p>Submitted worker hours will appear here. Try another filter if you expected a record.</p></div></td></tr>
            ) : (
              filtered.map((ts) => {
                const entries = ts.entries || [];
                const totalActualHours = entries.reduce((acc, e) => acc + Number(e.actual_hours || 0), 0);
                const totalVarianceMin = entries.reduce((acc, e) => acc + Number(e.variance_minutes || 0), 0);
                const totalKm = entries.reduce((acc, e) => acc + Number(e.kilometres || 0), 0);
                const totalTravelMin = entries.reduce((acc, e) => acc + Number(e.travel_minutes || 0), 0);
                const st = statusColors[ts.status] || { bg: 'var(--oc-subtle)', text: 'var(--oc-secondary)' };

                return (
                  <tr key={ts.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--oc-text)', fontSize: '0.88rem' }}>
                        {ts.staff?.full_name || 'Support Worker'}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--oc-muted)' }}>
                        {ts.staff?.reference_number || 'STF'} &bull; {ts.staff?.role || 'Worker'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--oc-secondary)' }}>
                        {new Date(ts.week_start).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                        {' � '}
                        {new Date(ts.week_end).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                      </div>
                    </td>
                    <td className="ocNumeric">
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{entries.length} shifts</span>
                    </td>
                    <td className="ocNumeric">
                      <strong style={{ fontSize: '0.9rem', color: 'var(--oc-text)' }}>{totalActualHours.toFixed(2)} hrs</strong>
                    </td>
                    <td className="ocNumeric">
                      <span style={{
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: totalVarianceMin > 0 ? 'var(--oc-success)' : totalVarianceMin < 0 ? 'var(--oc-danger)' : 'var(--oc-muted)',
                      }}>
                        {totalVarianceMin > 0 ? `+${(totalVarianceMin / 60).toFixed(1)}h` : totalVarianceMin < 0 ? `${(totalVarianceMin / 60).toFixed(1)}h` : '0h (On-time)'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--oc-secondary)' }}>
                        {totalKm > 0 ? `${totalKm} km` : '0 km'}
                        {totalTravelMin > 0 ? ` (${totalTravelMin}m)` : ''}
                      </div>
                    </td>
                    <td>
                      <span style={{ background: st.bg, color: st.text, padding: '3px 10px', borderRadius: 12, fontSize: '0.8125rem', fontWeight: 600 }}>
                        {ts.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          onClick={() => setSelectedTimesheet(ts)}
                          title="Inspect Entries"
                          style={{ background: 'var(--oc-subtle)', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', color: 'var(--oc-secondary)', fontSize: '0.8125rem', fontWeight: 600 }}
                        >
                          <Eye size={13} style={{ marginRight: 4, verticalAlign: -2 }} /> Inspect
                        </button>
                        {ts.status === 'Submitted' && (
                          <>
                            <button
                              onClick={() => handleApprove(ts.id)}
                              disabled={actionLoading}
                              title="Approve Timesheet"
                              style={{ background: '#ECFDF5', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', color: '#065F46', fontSize: '0.8125rem', fontWeight: 600 }}
                            >
                              <Check size={13} style={{ marginRight: 4, verticalAlign: -2 }} /> Approve
                            </button>
                            <button
                              onClick={() => handleReject(ts.id)}
                              disabled={actionLoading}
                              title="Reject Timesheet"
                              style={{ background: 'var(--oc-danger-soft)', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', color: 'var(--oc-danger)', fontSize: '0.8125rem', fontWeight: 600 }}
                            >
                              <XCircle size={13} style={{ marginRight: 4, verticalAlign: -2 }} /> Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Inspect Entries Modal */}
      {selectedTimesheet && (
        <div className="crmModalBackdrop" onClick={() => setSelectedTimesheet(null)}>
          <DialogPanel onClose={() => setSelectedTimesheet(null)} label="Timesheet Details:" className="crmModalCard" style={{ maxWidth: 780 }} onClick={(e) => e.stopPropagation()}>
            <div className="crmModalHeader">
              <div>
                <h3 className="crmModalTitle">
                  Timesheet Details: {selectedTimesheet.staff?.full_name}
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: 'var(--oc-muted)' }}>
                  Week {selectedTimesheet.week_start} to {selectedTimesheet.week_end} &bull; Status: <strong>{selectedTimesheet.status}</strong>
                </p>
              </div>
              <button aria-label="Close dialog" className="crmModalCloseBtn" onClick={() => setSelectedTimesheet(null)}>&times;</button>
            </div>

            <div className="crmModalBody">
              <div className="crmTableWrapper" style={{ marginBottom: 16 }}>
                <table className="crmTable">
                  <thead>
                    <tr>
                      <th>Shift / Participant</th>
                      <th>Actual Times</th>
                      <th>Break</th>
                      <th>Actual Hrs</th>
                      <th className="ocNumeric">Variance</th>
                      <th>Travel</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedTimesheet.entries || []).map((entry) => (
                      <tr key={entry.id}>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--oc-text)' }}>
                            {entry.participant?.full_name || 'Participant'}
                          </div>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--oc-muted)' }}>
                            {entry.shift?.shift_reference || 'Shift'} &bull; {entry.shift?.service_type || 'Support'}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.8125rem' }}>
                            {entry.actual_start ? new Date(entry.actual_start).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }) : '-'}
                            {' � '}
                            {entry.actual_end ? new Date(entry.actual_end).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </div>
                        </td>
                        <td>{entry.break_minutes || 0} mins</td>
                        <td><strong>{entry.actual_hours}h</strong></td>
                        <td className="ocNumeric">
                          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: entry.variance_minutes > 0 ? 'var(--oc-success)' : entry.variance_minutes < 0 ? 'var(--oc-danger)' : 'var(--oc-muted)' }}>
                            {entry.variance_minutes > 0 ? `+${(entry.variance_minutes / 60).toFixed(1)}h` : `${(entry.variance_minutes / 60).toFixed(1)}h`}
                          </span>
                        </td>
                        <td>{entry.kilometres || 0} km</td>
                        <td>
                          <button
                            onClick={() => startAdjust(entry)}
                            style={{ background: 'var(--oc-info-soft)', border: 'none', borderRadius: 4, padding: '4px 8px', fontSize: '0.8125rem', color: 'var(--oc-accent)', fontWeight: 600, cursor: 'pointer' }}
                          >
                            Adjust
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="crmModalFooter" style={{ display: 'flex', justifyContent: 'space-between', padding: 16 }}>
              <div>
                {selectedTimesheet.status === 'Submitted' && (
                  <button
                    onClick={() => handleReject(selectedTimesheet.id)}
                    style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #FECACA', background: 'var(--oc-danger-soft)', color: 'var(--oc-danger)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    Reject Timesheet
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setSelectedTimesheet(null)}
                  style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--oc-border)', background: '#FFF', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Close
                </button>
                {selectedTimesheet.status === 'Submitted' && (
                  <button
                    onClick={() => handleApprove(selectedTimesheet.id)}
                    style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: 'var(--oc-accent)', color: '#FFF', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    Approve & Move to Ready for Billing
                  </button>
                )}
              </div>
            </div>
          </DialogPanel>
        </div>
      )}

      {/* Adjust Entry Modal */}
      {adjustingEntry && (
        <div className="crmModalBackdrop" onClick={() => setAdjustingEntry(null)}>
          <DialogPanel onClose={() => setAdjustingEntry(null)} label="Manual Hours Adjustment" className="crmModalCard" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
            <div className="crmModalHeader">
              <div>
                <h3 className="crmModalTitle">Manual Hours Adjustment</h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: 'var(--oc-danger)' }}>
                  * Any manual adjustment requires a documented reason and records the change in the activity history.
                </p>
              </div>
              <button aria-label="Close dialog" className="crmModalCloseBtn" onClick={() => setAdjustingEntry(null)}>&times;</button>
            </div>

            <form onSubmit={handleSaveAdjustment}>
              <div className="crmModalBody" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="ocFormGrid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 4 }}>
                      Adjusted Actual Hours *
                    </label>
                    <input className="ocField" aria-label="Adjusted Actual Hours *"
                      type="number"
                      step="0.05"
                      min="0.1"
                      value={adjustHours}
                      onChange={(e) => setAdjustHours(Number(e.target.value))}
                      required
                      style={{ width: '100%', borderRadius: 8, border: '1px solid var(--oc-border)', padding: 8, fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 4 }}>
                      Break Minutes
                    </label>
                    <input className="ocField" aria-label="Break Minutes"
                      type="number"
                      min="0"
                      value={adjustBreak}
                      onChange={(e) => setAdjustBreak(Number(e.target.value))}
                      style={{ width: '100%', borderRadius: 8, border: '1px solid var(--oc-border)', padding: 8, fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--oc-danger)', marginBottom: 4 }}>
                    Mandatory Reason for Adjustment *
                  </label>
                  <textarea className="ocField" aria-label="Mandatory Reason for Adjustment *"
                    rows={3}
                    placeholder="e.g. Worker forgot to end shift on time, corrected by mutual agreement with coordinator"
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    required
                    style={{ width: '100%', borderRadius: 8, border: '1px solid #FCA5A5', background: 'var(--oc-danger-soft)', padding: 10, fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div className="crmModalFooter" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: 16 }}>
                <button
                  type="button"
                  onClick={() => setAdjustingEntry(null)}
                  style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--oc-border)', background: '#FFF', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: 'var(--oc-info)', color: '#FFF', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  {actionLoading ? 'Saving...' : 'Save & Adjust Service Record'}
                </button>
              </div>
            </form>
          </DialogPanel>
        </div>
      )}
    </div>
  );
}
