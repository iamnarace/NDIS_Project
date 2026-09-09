'use client';

import LoadingRows from '@/components/ui/LoadingRows';

import DialogPanel from '@/components/ui/DialogPanel';

import { notify } from '@/components/ui/ProductFeedback';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FormDrawer,
  DrawerHeader,
  FormSection,
  FormField,
  FormInput,
  FormTextarea,
  StickyFormFooter,
} from '@/components/admin/forms';
import { 
  FileText, Search, Filter, AlertTriangle, CheckCircle2, 
  Calendar, User, Clock, Target, Edit3, X, Check, Eye
} from 'lucide-react';

interface ProgressNote {
  id: string;
  shift_id: string;
  participant_id: string;
  staff_id: string;
  service_date?: string;
  note_text: string;
  support_delivered?: string;
  participant_response?: string;
  outcomes_observed?: string;
  concerns?: string;
  follow_up_required: boolean;
  follow_up_notes?: string;
  incident_occurred: boolean;
  incident_id?: string;
  created_at: string;
  updated_at?: string;
  staff?: { id: string; full_name: string; role: string; reference_number?: string };
  participant?: { id: string; full_name: string; reference_number?: string };
  incident?: { id: string; incident_reference: string; severity: string; status: string };
  shift?: { id: string; shift_reference: string; service_type: string; start_time: string; end_time: string };
  goals?: Array<{
    id: string;
    goal_id: string;
    progress_rating: string;
    worker_comment?: string;
    goal?: { id: string; goal_title: string; category: string };
  }>;
}

export default function ProgressNotesTab() {
  const [notes, setNotes] = useState<ProgressNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');
  const [incidentFilter, setIncidentFilter] = useState('all');
  const [followUpFilter, setFollowUpFilter] = useState('all');
  const [selectedNote, setSelectedNote] = useState<ProgressNote | null>(null);
  const [editingNote, setEditingNote] = useState<ProgressNote | null>(null);
  const [editReason, setEditReason] = useState('');
  const [editForm, setEditForm] = useState({
    support_delivered: '',
    participant_response: '',
    outcomes_observed: '',
    concerns: '',
    follow_up_required: false,
    follow_up_notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      let url = '/api/workforce/shifts/progress-notes?';
      if (incidentFilter === 'yes') url += 'incident_flag=true&';
      if (incidentFilter === 'no') url += 'incident_flag=false&';
      if (followUpFilter === 'yes') url += 'follow_up_required=true&';
      if (followUpFilter === 'no') url += 'follow_up_required=false&';

      const res = await fetch(url);
      if (!res.ok) throw new Error('Unable to load records');
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes || []);
      }
    } catch (err) {
      setLoadError(true);
      console.error('Failed to load progress notes:', err);
    } finally {
      setLoading(false);
    }
  }, [incidentFilter, followUpFilter]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  function startEdit(note: ProgressNote) {
    setEditingNote(note);
    setEditReason('');
    setEditForm({
      support_delivered: note.support_delivered || note.note_text || '',
      participant_response: note.participant_response || '',
      outcomes_observed: note.outcomes_observed || '',
      concerns: note.concerns || '',
      follow_up_required: Boolean(note.follow_up_required),
      follow_up_notes: note.follow_up_notes || '',
    });
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingNote) return;
    if (!editReason.trim()) {
      notify('Please provide a reason for editing this clinical record (required for audit compliance).');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/workforce/shifts/progress-notes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingNote.id,
          reason: editReason,
          ...editForm,
          note_text: editForm.support_delivered,
        }),
      });

      if (res.ok) {
        setNotice('Progress note updated and audit event logged.');
        setEditingNote(null);
        loadNotes();
      } else {
        const err = await res.json();
        notify('Error: ' + (err.error || 'Failed to update progress note'));
      }
    } catch {
      notify('Network error while saving progress note edit.');
    } finally {
      setSaving(false);
    }
  }

  const filtered = notes.filter((n) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      n.participant?.full_name?.toLowerCase().includes(q) ||
      n.staff?.full_name?.toLowerCase().includes(q) ||
      n.shift?.shift_reference?.toLowerCase().includes(q) ||
      n.note_text?.toLowerCase().includes(q) ||
      n.support_delivered?.toLowerCase().includes(q)
    );
  });

  const ratingBadges: Record<string, { bg: string; text: string }> = {
    'Not Addressed': { bg: 'var(--oc-subtle)', text: 'var(--oc-secondary)' },
    'Maintained': { bg: 'var(--oc-info-soft)', text: 'var(--oc-accent)' },
    'Some Progress': { bg: '#FEF3C7', text: '#B45309' },
    'Significant Progress': { bg: '#ECFDF5', text: '#065F46' },
    'Goal Achieved': { bg: '#FAF5FF', text: '#6B21A8' },
  };

  return (
    <div className="crmTabPanel">
      <div className="crmPanelHeader">
        <div>
          <h2 className="crmPanelTitle">Progress notes</h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--oc-muted)' }}>
            Auditable shift service records, participant responses, goal progress ratings, and clinical follow-ups.
          </p>
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
          <input aria-label="Search participant, worker, notes..."
            type="text"
            placeholder="Search participant, worker, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="crmSearchInput"
            style={{ width: '100%', paddingLeft: 34, height: 38, borderRadius: 8, border: '1px solid var(--oc-border)', fontSize: '0.85rem' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--oc-muted)', fontWeight: 600 }}>Incident Flag:</span>
          <select className="ocField" aria-label="All"
            value={incidentFilter}
            onChange={(e) => setIncidentFilter(e.target.value)}
            style={{ height: 38, borderRadius: 8, border: '1px solid var(--oc-border)', padding: '0 10px', fontSize: '0.85rem', background: '#FFF' }}
          >
            <option value="all">All</option>
            <option value="yes">Incident Occurred</option>
            <option value="no">Clean Shifts Only</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--oc-muted)', fontWeight: 600 }}>Follow-up:</span>
          <select className="ocField" aria-label="All"
            value={followUpFilter}
            onChange={(e) => setFollowUpFilter(e.target.value)}
            style={{ height: 38, borderRadius: 8, border: '1px solid var(--oc-border)', padding: '0 10px', fontSize: '0.85rem', background: '#FFF' }}
          >
            <option value="all">All</option>
            <option value="yes">Follow-up Required</option>
            <option value="no">No Follow-up</option>
          </select>
        </div>
      </div>

      {/* Notes Table */}
      <div className="crmTableWrapper">
        <table className="crmTable">
          <thead>
            <tr>
              <th>Date / Shift</th>
              <th>Participant</th>
              <th>Support Worker</th>
              <th>Support Delivered & Outcomes</th>
              <th>Goals Supported</th>
              <th>Flags</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loadError ? (<tr><td colSpan={7}><div className="ocEmpty" role="alert"><strong>Unable to load progress notes</strong><p>Check your connection and try again.</p><button type="button" className="ocTextButton" onClick={loadNotes}>Try again</button></div></td></tr>) : loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 30, color: 'var(--oc-muted)' }}><LoadingRows label="Loading progress notes" /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--oc-muted)' }}><div className="ocEmpty"><strong>No matching progress notes</strong><p>Try changing the filters, or return after a worker submits a shift note.</p></div></td></tr>
            ) : (
              filtered.map((note) => (
                <tr key={note.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--oc-text)', fontSize: '0.85rem' }}>
                      {note.service_date ? new Date(note.service_date).toLocaleDateString('en-AU') : new Date(note.created_at).toLocaleDateString('en-AU')}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--oc-muted)', fontFamily: 'monospace' }}>
                      {note.shift?.shift_reference || 'Ad-hoc'}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--oc-text)', fontSize: '0.85rem' }}>
                      {note.participant?.full_name || 'Participant'}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--oc-muted)' }}>
                      {note.participant?.reference_number || ''}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--oc-text)', fontSize: '0.85rem' }}>
                      {note.staff?.full_name || 'Worker'}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--oc-muted)' }}>
                      {note.staff?.role || 'Support Worker'}
                    </div>
                  </td>
                  <td style={{ maxWidth: 320 }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--oc-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {note.support_delivered || note.note_text}
                    </div>
                    {note.outcomes_observed && (
                      <div style={{ fontSize: '0.8125rem', color: '#059669', marginTop: 3 }}>
                        <strong>Outcome:</strong> {note.outcomes_observed}
                      </div>
                    )}
                  </td>
                  <td style={{ maxWidth: 220 }}>
                    {Array.isArray(note.goals) && note.goals.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {note.goals.map((g) => {
                          const badge = ratingBadges[g.progress_rating] || { bg: 'var(--oc-subtle)', text: 'var(--oc-secondary)' };
                          return (
                            <div key={g.id} style={{ fontSize: '0.8125rem' }}>
                              <span style={{ fontWeight: 600 }}>{g.goal?.goal_title || 'Goal'}:</span>{' '}
                              <span style={{ background: badge.bg, color: badge.text, padding: '1px 6px', borderRadius: 4, fontWeight: 600, fontSize: '0.8125rem' }}>
                                {g.progress_rating}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.8125rem', color: 'var(--oc-muted)' }}>None linked</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {note.incident_occurred && (
                        <span style={{ background: 'var(--oc-danger-soft)', color: 'var(--oc-danger)', border: '1px solid #FECACA', padding: '2px 8px', borderRadius: 12, fontSize: '0.8125rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <AlertTriangle size={11} /> Incident Flagged
                        </span>
                      )}
                      {note.follow_up_required && (
                        <span style={{ background: 'var(--oc-warning-soft)', color: '#B45309', border: '1px solid #FDE68A', padding: '2px 8px', borderRadius: 12, fontSize: '0.8125rem', fontWeight: 600 }}>
                          Follow-up Needed
                        </span>
                      )}
                      {!note.incident_occurred && !note.follow_up_required && (
                        <span style={{ background: 'var(--oc-success-soft)', color: 'var(--oc-success)', padding: '2px 8px', borderRadius: 12, fontSize: '0.8125rem', fontWeight: 600 }}>
                          Normal Shift
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <button
                        onClick={() => setSelectedNote(note)}
                        title="View Full Note"
                        style={{ background: 'var(--oc-subtle)', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', color: 'var(--oc-secondary)', fontSize: '0.8125rem', fontWeight: 600 }}
                      >
                        <Eye size={13} style={{ marginRight: 4, verticalAlign: -2 }} /> View
                      </button>
                      <button
                        onClick={() => startEdit(note)}
                        title="Edit Note (Audit logged)"
                        style={{ background: 'var(--oc-info-soft)', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', color: 'var(--oc-accent)', fontSize: '0.8125rem', fontWeight: 600 }}
                      >
                        <Edit3 size={13} style={{ marginRight: 4, verticalAlign: -2 }} /> Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Note Details Drawer */}
      <FormDrawer
        isOpen={!!selectedNote}
        onClose={() => setSelectedNote(null)}
      >
        {selectedNote && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <DrawerHeader
              title="Shift Progress Note"
              description={`Reference: ${selectedNote.shift?.shift_reference || 'Shift'} • Date: ${selectedNote.service_date}`}
              badge={<span className="refIdTag">CLINICAL NOTE</span>}
              onClose={() => setSelectedNote(null)}
            />

            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, background: 'var(--oc-background)', padding: 16, borderRadius: 10, border: '1px solid var(--oc-border)' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--oc-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Participant</span>
                  <div style={{ fontWeight: 600, color: 'var(--oc-text)', marginTop: 2 }}>{selectedNote.participant?.full_name}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--oc-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Support Worker</span>
                  <div style={{ fontWeight: 600, color: 'var(--oc-text)', marginTop: 2 }}>{selectedNote.staff?.full_name}</div>
                </div>
              </div>

              <FormSection title="1. Support Delivered">
                <div style={{ background: 'var(--oc-background)', padding: 14, borderRadius: 10, fontSize: '0.88rem', color: 'var(--oc-secondary)', lineHeight: 1.6, border: '1px solid var(--oc-border)' }}>
                  {selectedNote.support_delivered || selectedNote.note_text}
                </div>
              </FormSection>

              {selectedNote.participant_response && (
                <FormSection title="2. Participant Response">
                  <div style={{ background: 'var(--oc-background)', padding: 14, borderRadius: 10, fontSize: '0.88rem', color: 'var(--oc-secondary)', border: '1px solid var(--oc-border)' }}>
                    {selectedNote.participant_response}
                  </div>
                </FormSection>
              )}

              {selectedNote.outcomes_observed && (
                <FormSection title="3. Outcomes Observed">
                  <div style={{ background: 'var(--oc-background)', padding: 14, borderRadius: 10, fontSize: '0.88rem', color: 'var(--oc-secondary)', border: '1px solid var(--oc-border)' }}>
                    {selectedNote.outcomes_observed}
                  </div>
                </FormSection>
              )}

              {selectedNote.concerns && (
                <FormSection title="Clinical Concerns / Observations">
                  <div style={{ background: 'var(--oc-danger-soft)', border: '1px solid #FECACA', padding: 14, borderRadius: 10, fontSize: '0.88rem', color: '#991B1B' }}>
                    {selectedNote.concerns}
                  </div>
                </FormSection>
              )}

              {/* Goals list */}
              {selectedNote.goals && selectedNote.goals.length > 0 && (
                <FormSection title={`NDIS Goals Supported (${selectedNote.goals.length})`}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {selectedNote.goals.map((g) => (
                      <div key={g.id} style={{ border: '1px solid var(--oc-border)', borderRadius: 10, padding: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{g.goal?.goal_title}</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, background: 'var(--oc-info-soft)', color: 'var(--oc-accent)', padding: '2px 8px', borderRadius: 4 }}>
                            {g.progress_rating}
                          </span>
                        </div>
                        {g.worker_comment && (
                          <div style={{ fontSize: '0.8125rem', color: 'var(--oc-muted)', marginTop: 6 }}>{g.worker_comment}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </FormSection>
              )}

              {selectedNote.follow_up_required && (
                <div style={{ background: 'var(--oc-warning-soft)', border: '1px solid #FDE68A', padding: 14, borderRadius: 10 }}>
                  <strong style={{ color: '#B45309', fontSize: '0.85rem' }}>Follow-up Action Required:</strong>
                  <p style={{ margin: '4px 0 0', color: '#92400E', fontSize: '0.85rem' }}>{selectedNote.follow_up_notes || 'Action indicated by worker'}</p>
                </div>
              )}
            </div>

            <div className="drawer-footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setSelectedNote(null)}
                className="canonical-btn canonical-btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </FormDrawer>

      {/* Edit Note Drawer (with required reason for audit event) */}
      <FormDrawer
        isOpen={!!editingNote}
        onClose={() => setEditingNote(null)}
      >
        <DrawerHeader
          title="Edit Progress Note"
          description="Edits are tracked in the Opus Care compliance audit trail with before/after values."
          badge={<span style={{ background: '#FEE2E2', color: '#B91C1C', fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: 6 }}>AUDIT TRAIL</span>}
          onClose={() => setEditingNote(null)}
        />

        <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 73px)' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <FormSection title="Clinical Content">
              <FormField label="Support Delivered / Note Text" required>
                <FormTextarea
                  rows={3}
                  value={editForm.support_delivered}
                  onChange={(e) => setEditForm({ ...editForm, support_delivered: e.target.value })}
                  required
                />
              </FormField>

              <FormField label="Participant Response">
                <FormInput
                  type="text"
                  value={editForm.participant_response}
                  onChange={(e) => setEditForm({ ...editForm, participant_response: e.target.value })}
                />
              </FormField>

              <FormField label="Outcomes Observed">
                <FormInput
                  type="text"
                  value={editForm.outcomes_observed}
                  onChange={(e) => setEditForm({ ...editForm, outcomes_observed: e.target.value })}
                />
              </FormField>

              <FormField label="Concerns / Observations">
                <FormInput
                  type="text"
                  value={editForm.concerns}
                  onChange={(e) => setEditForm({ ...editForm, concerns: e.target.value })}
                />
              </FormField>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <input
                  type="checkbox"
                  id="editFollowUp"
                  checked={editForm.follow_up_required}
                  onChange={(e) => setEditForm({ ...editForm, follow_up_required: e.target.checked })}
                />
                <label htmlFor="editFollowUp" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--oc-text)' }}>
                  Follow-up Required
                </label>
              </div>

              {editForm.follow_up_required && (
                <FormField label="Follow-up Notes">
                  <FormInput
                    type="text"
                    value={editForm.follow_up_notes}
                    onChange={(e) => setEditForm({ ...editForm, follow_up_notes: e.target.value })}
                  />
                </FormField>
              )}
            </FormSection>

            <FormSection title="Audit & Compliance Justification">
              <FormField label="Reason for Clinical Revision" hint="Immutable audit log entry will be created" required>
                <FormInput
                  type="text"
                  placeholder="e.g. Corrected spelling of activity, added missing outcome"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  required
                  style={{ border: '1px solid #FCA5A5', background: 'var(--oc-danger-soft)' }}
                />
              </FormField>
            </FormSection>
          </div>

          <StickyFormFooter
            cancelLabel="Cancel"
            onCancel={() => setEditingNote(null)}
            primaryLabel={saving ? 'Saving...' : 'Save & Record Audit Event'}
            loading={saving}
          />
        </form>
      </FormDrawer>
    </div>
  );
}
