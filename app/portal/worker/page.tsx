'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Calendar,
  Clock,
  MapPin,
  AlertTriangle,
  FileText,
  CheckCircle2,
  AlertCircle,
  Plus,
  Send,
  LogOut,
  ChevronRight,
  ExternalLink,
  Search,
  Car,
  Navigation,
  Target,
  Check,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface AssignedShift {
  id: string;
  shift_reference: string;
  participant_id: string;
  service_type: string;
  start_time: string;
  end_time: string;
  hours: number;
  location_suburb: string;
  location_address?: string;
  special_instructions?: string;
  status: string;
  participant?: {
    id: string;
    reference_number: string;
    full_name: string;
  };
}

interface WorkerIncident {
  id: string;
  incident_reference: string;
  participant_id: string;
  incident_at: string;
  category: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string;
  status: string;
  created_at: string;
  participant?: {
    id: string;
    full_name: string;
    reference_number: string;
  };
}

function WorkerPortalContent() {
  const router = useRouter();
  const [tab, setTab] = useState<'shifts' | 'timesheets' | 'report_incident' | 'my_incidents'>('shifts');
  const [isLoading, setIsLoading] = useState(true);
  const [workerName, setWorkerName] = useState('');
  const [workerStaffId, setWorkerStaffId] = useState('');
  const [shifts, setShifts] = useState<AssignedShift[]>([]);
  const [incidents, setIncidents] = useState<WorkerIncident[]>([]);
  const [statusNotice, setStatusNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Timesheets tab state
  const [timesheets, setTimesheets] = useState<any[]>([]);
  const [timesheetsLoading, setTimesheetsLoading] = useState(false);
  const [expandedTimesheetId, setExpandedTimesheetId] = useState<string | null>(null);

  // Shift completion & progress note modal state
  const [activeShiftForNote, setActiveShiftForNote] = useState<AssignedShift | null>(null);
  const [actualStart, setActualStart] = useState('');
  const [actualEnd, setActualEnd] = useState('');
  const [breakMinutes, setBreakMinutes] = useState(0);
  const [noteText, setNoteText] = useState('');
  const [supportDelivered, setSupportDelivered] = useState('');
  const [participantResponse, setParticipantResponse] = useState('');
  const [outcomesObserved, setOutcomesObserved] = useState('');
  const [concerns, setConcerns] = useState('');
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [incidentOccurred, setIncidentOccurred] = useState(false);
  const [travelType, setTravelType] = useState<'none' | 'provider_travel_to' | 'travel_with_participant' | 'participant_transport'>('none');
  const [travelMinutes, setTravelMinutes] = useState(0);
  const [kilometres, setKilometres] = useState(0);
  const [participantGoals, setParticipantGoals] = useState<Array<{
    id: string;
    goal_title: string;
    category: string;
    progress_rating: string;
    worker_comment: string;
  }>>([]);
  const [loadingGoals, setLoadingGoals] = useState(false);
  const [submittingNote, setSubmittingNote] = useState(false);

  // Incident form state
  const [incidentForm, setIncidentForm] = useState({
    participant_id: '',
    shift_id: '',
    incident_at: new Date().toISOString().slice(0, 16),
    location: '',
    category: 'injury',
    severity: 'Medium' as 'Low' | 'Medium' | 'High' | 'Critical',
    description: '',
    immediate_actions_taken: '',
    injury_or_harm_details: '',
    emergency_services_contacted: false,
    emergency_services_details: '',
    witnesses: '',
    attachment_urls_text: '',
  });
  const [submittingIncident, setSubmittingIncident] = useState(false);

  const loadTimesheets = useCallback(async (staffId?: string) => {
    const id = staffId || workerStaffId;
    if (!id) return;
    setTimesheetsLoading(true);
    try {
      const res = await fetch(`/api/workforce/timesheets?staff_id=${id}`);
      if (res.ok) {
        const data = await res.json();
        setTimesheets(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Worker timesheets load error:', err);
    } finally {
      setTimesheetsLoading(false);
    }
  }, [workerStaffId]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const meRes = await fetch('/api/portal/me');
      if (meRes.status === 401) {
        router.push('/portal?reason=session_expired');
        return;
      }
      const meData = await meRes.json();
      setWorkerName(meData.profile?.full_name || meData.staffMember?.name || 'Support Worker');
      const staffId = meData.staffMember?.id || '';
      setWorkerStaffId(staffId);

      // Load worker's assigned shifts
      const staffParam = staffId ? `&staff_id=${staffId}` : '';
      const shiftsRes = await fetch(`/api/workforce/shifts?status=all${staffParam}`);
      if (shiftsRes.ok) {
        const shiftsData = await shiftsRes.json();
        setShifts(Array.isArray(shiftsData) ? shiftsData : []);
      }

      // Load incidents reported by this worker
      const incRes = await fetch('/api/safeguarding/incidents');
      if (incRes.ok) {
        const incData = await incRes.json();
        setIncidents(incData.incidents || []);
      }

      // Load worker timesheets
      if (staffId) {
        loadTimesheets(staffId);
      }
    } catch (err) {
      console.error('Worker portal load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [router, loadTimesheets]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open complete shift modal with active goals
  async function openCompleteShiftModal(shift: AssignedShift) {
    setActiveShiftForNote(shift);
    setNoteText('');
    setSupportDelivered('');
    setParticipantResponse('');
    setOutcomesObserved('');
    setConcerns('');
    setFollowUpRequired(false);
    setFollowUpNotes('');
    setIncidentOccurred(false);
    setTravelType('none');
    setTravelMinutes(0);
    setKilometres(0);
    setBreakMinutes(0);

    // Format local datetime strings YYYY-MM-DDTHH:mm
    if (shift.start_time) {
      try {
        const d = new Date(shift.start_time);
        const pad = (n: number) => n < 10 ? '0' + n : n;
        const local = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        setActualStart(local);
      } catch {
        setActualStart('');
      }
    } else {
      setActualStart('');
    }

    if (shift.end_time) {
      try {
        const d = new Date(shift.end_time);
        const pad = (n: number) => n < 10 ? '0' + n : n;
        const local = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        setActualEnd(local);
      } catch {
        setActualEnd('');
      }
    } else {
      setActualEnd('');
    }

    // Load active participant goals
    setLoadingGoals(true);
    try {
      const res = await fetch(`/api/client/goals?participant_id=${shift.participant_id}`);
      if (res.ok) {
        const data = await res.json();
        const active = (data.goals || []).filter((g: any) => g.status === 'active').map((g: any) => ({
          id: g.id,
          goal_title: g.goal_title,
          category: g.category,
          progress_rating: 'Not Addressed',
          worker_comment: '',
        }));
        setParticipantGoals(active);
      } else {
        setParticipantGoals([]);
      }
    } catch {
      setParticipantGoals([]);
    } finally {
      setLoadingGoals(false);
    }
  }

  // Open incident form prefilled from shift and progress note
  function openIncidentFromShift(shift: AssignedShift, initialContext: string = '') {
    setIncidentForm({
      participant_id: shift.participant_id,
      shift_id: shift.id,
      incident_at: shift.start_time ? new Date(shift.start_time).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      location: shift.location_suburb || 'Participant home',
      category: 'behaviour_of_concern',
      severity: 'High',
      description: initialContext ? `Context from shift: ${initialContext}` : '',
      immediate_actions_taken: '',
      injury_or_harm_details: '',
      emergency_services_contacted: false,
      emergency_services_details: '',
      witnesses: '',
      attachment_urls_text: '',
    });
    setTab('report_incident');
    setActiveShiftForNote(null);
  }

  // Submit complete shift and record progress note
  async function submitCompleteShift(e: React.FormEvent) {
    e.preventDefault();
    if (!activeShiftForNote || !noteText.trim()) return;

    setSubmittingNote(true);
    setStatusNotice(null);

    try {
      const goalsPayload = participantGoals
        .filter(g => g.progress_rating && g.progress_rating !== 'Not Addressed')
        .map(g => ({
          goal_id: g.id,
          progress_rating: g.progress_rating,
          worker_comment: g.worker_comment || undefined,
        }));

      const travelPayload = travelType !== 'none' && (Number(travelMinutes) > 0 || Number(kilometres) > 0)
        ? {
            travel_type: travelType,
            travel_minutes: Number(travelMinutes) || 0,
            kilometres: Number(kilometres) || 0,
          }
        : undefined;

      const payload = {
        shift_id: activeShiftForNote.id,
        participant_id: activeShiftForNote.participant_id,
        staff_id: workerStaffId || undefined,
        actual_start: actualStart ? new Date(actualStart).toISOString() : undefined,
        actual_end: actualEnd ? new Date(actualEnd).toISOString() : undefined,
        break_minutes: Number(breakMinutes) || 0,
        note_text: noteText,
        support_delivered: supportDelivered || undefined,
        participant_response: participantResponse || undefined,
        outcomes_observed: outcomesObserved || undefined,
        concerns: concerns || undefined,
        follow_up_required: followUpRequired,
        follow_up_notes: followUpRequired ? followUpNotes : undefined,
        incident_occurred: incidentOccurred,
        goals: goalsPayload,
        travel: travelPayload,
      };

      const res = await fetch('/api/workforce/shifts/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setStatusNotice({
          type: 'success',
          text: `Shift ${activeShiftForNote.shift_reference} completed. Progress note, timesheet entry, and service record generated for manager approval.`,
        });

        const completedShift = activeShiftForNote;
        const noteContext = noteText;
        setActiveShiftForNote(null);

        // Refresh shifts and timesheets
        loadData();

        if (incidentOccurred) {
          openIncidentFromShift(completedShift, noteContext);
        }
      } else {
        setStatusNotice({
          type: 'error',
          text: data.error || 'Failed to complete shift and record notes.',
        });
      }
    } catch (err: any) {
      setStatusNotice({ type: 'error', text: err.message || 'Network error completing shift.' });
    } finally {
      setSubmittingNote(false);
    }
  }

  // Submit Incident Report
  async function submitIncidentReport(e: React.FormEvent) {
    e.preventDefault();
    if (!incidentForm.participant_id || !incidentForm.description.trim()) {
      setStatusNotice({ type: 'error', text: 'Participant and incident description are required.' });
      return;
    }

    setSubmittingIncident(true);
    setStatusNotice(null);

    try {
      const attachments = incidentForm.attachment_urls_text
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);

      const res = await fetch('/api/safeguarding/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...incidentForm,
          worker_id: workerStaffId || undefined,
          attachment_urls: attachments,
        }),
      });

      const data = await res.json();
      if (res.ok && data.incident) {
        setStatusNotice({
          type: 'success',
          text: `Incident ${data.incident.incident_reference} reported successfully. Opus Care operations has been notified.`,
        });
        // Reset form
        setIncidentForm({
          participant_id: '',
          shift_id: '',
          incident_at: new Date().toISOString().slice(0, 16),
          location: '',
          category: 'injury',
          severity: 'Medium',
          description: '',
          immediate_actions_taken: '',
          injury_or_harm_details: '',
          emergency_services_contacted: false,
          emergency_services_details: '',
          witnesses: '',
          attachment_urls_text: '',
        });
        // Reload incidents list
        const incRes = await fetch('/api/safeguarding/incidents');
        if (incRes.ok) {
          const incData = await incRes.json();
          setIncidents(incData.incidents || []);
        }
        setTab('my_incidents');
      } else {
        setStatusNotice({ type: 'error', text: data.error || 'Failed to submit incident report.' });
      }
    } catch {
      setStatusNotice({ type: 'error', text: 'Network error submitting incident report.' });
    } finally {
      setSubmittingIncident(false);
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    router.push('/portal');
  }

  const severityColours: Record<string, { bg: string; text: string; border: string }> = {
    Low: { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' },
    Medium: { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' },
    High: { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
    Critical: { bg: '#450A0A', text: '#FFFFFF', border: '#991B1B' },
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', color: '#1E293B', fontFamily: 'Source Sans 3, system-ui, sans-serif' }}>
      {/* Top Navigation */}
      <header style={{
        background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64,
        position: 'sticky', top: 0, zIndex: 30,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Image src="/logo.png" alt="Opus Care" width={120} height={32} style={{ objectFit: 'contain' }} priority />
          <span style={{ background: '#EFF6FF', color: '#1E40AF', padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600 }}>
            Support Worker Portal
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: '0.88rem', color: '#475569' }}>
            Logged in as <strong>{workerName}</strong>
          </span>
          <button
            onClick={handleSignOut}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#F1F5F9', border: 'none', borderRadius: 8, padding: '7px 14px',
              fontSize: '0.82rem', fontWeight: 600, color: '#475569', cursor: 'pointer',
            }}
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>
        {/* Banner Alert if any */}
        {statusNotice && (
          <div style={{
            background: statusNotice.type === 'success' ? '#F0FDF4' : '#FEF2F2',
            border: `1px solid ${statusNotice.type === 'success' ? '#BBF7D0' : '#FECACA'}`,
            color: statusNotice.type === 'success' ? '#166534' : '#991B1B',
            padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: '0.88rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span>{statusNotice.text}</span>
            <button onClick={() => setStatusNotice(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>&times;</button>
          </div>
        )}

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #E2E8F0', paddingBottom: 12, marginBottom: 24 }}>
          <button
            onClick={() => setTab('shifts')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 18px', borderRadius: 8, fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer',
              background: tab === 'shifts' ? '#1E40AF' : '#FFFFFF',
              color: tab === 'shifts' ? '#FFFFFF' : '#64748B',
              border: tab === 'shifts' ? 'none' : '1px solid #E2E8F0',
            }}
          >
            <Calendar size={16} /> My Shifts & Progress Notes
          </button>
          <button
            onClick={() => setTab('timesheets')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 18px', borderRadius: 8, fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer',
              background: tab === 'timesheets' ? '#1E40AF' : '#FFFFFF',
              color: tab === 'timesheets' ? '#FFFFFF' : '#64748B',
              border: tab === 'timesheets' ? 'none' : '1px solid #E2E8F0',
            }}
          >
            <Clock size={16} /> My Timesheets ({timesheets.length})
          </button>
          <button
            onClick={() => setTab('report_incident')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 18px', borderRadius: 8, fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer',
              background: tab === 'report_incident' ? '#DC2626' : '#FFFFFF',
              color: tab === 'report_incident' ? '#FFFFFF' : '#64748B',
              border: tab === 'report_incident' ? 'none' : '1px solid #E2E8F0',
            }}
          >
            <AlertTriangle size={16} /> Report Incident
          </button>
          <button
            onClick={() => setTab('my_incidents')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 18px', borderRadius: 8, fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer',
              background: tab === 'my_incidents' ? '#1E40AF' : '#FFFFFF',
              color: tab === 'my_incidents' ? '#FFFFFF' : '#64748B',
              border: tab === 'my_incidents' ? 'none' : '1px solid #E2E8F0',
            }}
          >
            <Shield size={16} /> My Reported Incidents ({incidents.length})
          </button>
        </div>

        {/* TAB 1: SHIFTS & PROGRESS NOTES */}
        {tab === 'shifts' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 4px', color: '#0F172A' }}>Assigned Shifts</h2>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>
                  Record shift progress notes and flag any safeguarding incidents immediately.
                </p>
              </div>
            </div>

            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#94A3B8' }}>Loading shifts…</div>
            ) : shifts.length === 0 ? (
              <div style={{ background: '#FFFFFF', padding: '48px 24px', borderRadius: 12, textAlign: 'center', border: '1px solid #E2E8F0' }}>
                <Calendar size={40} style={{ color: '#CBD5E1', marginBottom: 12 }} />
                <h3 style={{ margin: '0 0 6px', color: '#334155' }}>No assigned shifts found</h3>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748B' }}>
                  Your assigned shifts from the Opus Care roster will appear here.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {shifts.map((shift) => (
                  <div
                    key={shift.id}
                    style={{
                      background: '#FFFFFF', borderRadius: 10, padding: 18, border: '1px solid #E2E8F0',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14,
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: '1rem', color: '#0F172A' }}>
                          {shift.participant?.full_name || 'Participant'}
                        </span>
                        <span style={{ background: '#F1F5F9', color: '#475569', borderRadius: 4, padding: '2px 8px', fontSize: '0.75rem', fontWeight: 600 }}>
                          {shift.shift_reference}
                        </span>
                        <span style={{ background: '#EFF6FF', color: '#2563EB', borderRadius: 4, padding: '2px 8px', fontSize: '0.75rem' }}>
                          {shift.service_type || 'Core Support'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: '0.84rem', color: '#64748B' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={13} />
                          {new Date(shift.start_time).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}{' '}
                          {new Date(shift.start_time).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })} –{' '}
                          {new Date(shift.end_time).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })} ({shift.hours || 0}h)
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={13} /> {shift.location_suburb || 'Yamba NSW'}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        onClick={() => openCompleteShiftModal(shift)}
                        style={{
                          background: shift.status === 'completed' ? '#0D9488' : '#1E40AF', color: '#FFFFFF', border: 'none', borderRadius: 8,
                          padding: '8px 16px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 6,
                        }}
                      >
                        <CheckCircle2 size={15} /> {shift.status === 'completed' ? 'Shift Completed' : 'Complete Shift & Note'}
                      </button>
                      <button
                        onClick={() => openIncidentFromShift(shift)}
                        style={{
                          background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 8,
                          padding: '8px 16px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 6,
                        }}
                      >
                        <AlertTriangle size={15} /> Report Incident
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: MY TIMESHEETS */}
        {tab === 'timesheets' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 4px', color: '#0F172A' }}>My Weekly Timesheets</h2>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>
                  Weekly timesheets automatically compiled from your completed shifts and submitted for manager approval.
                </p>
              </div>
              <button
                onClick={() => loadTimesheets()}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, background: '#FFFFFF',
                  border: '1px solid #CBD5E1', borderRadius: 8, padding: '7px 14px',
                  fontSize: '0.82rem', fontWeight: 600, color: '#475569', cursor: 'pointer',
                }}
              >
                <RefreshCw size={14} /> Refresh
              </button>
            </div>

            {timesheetsLoading ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#94A3B8' }}>Loading timesheets…</div>
            ) : timesheets.length === 0 ? (
              <div style={{ background: '#FFFFFF', padding: '48px 24px', borderRadius: 12, textAlign: 'center', border: '1px solid #E2E8F0' }}>
                <Clock size={40} style={{ color: '#CBD5E1', marginBottom: 12 }} />
                <h3 style={{ margin: '0 0 6px', color: '#334155' }}>No timesheet submissions found</h3>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748B' }}>
                  When you complete shifts and submit progress notes, your weekly hours and travel will automatically appear here.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {timesheets.map((ts: any) => {
                  const statusColors: Record<string, { bg: string; text: string; border: string }> = {
                    Approved: { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' },
                    Submitted: { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' },
                    Draft: { bg: '#F8FAFC', text: '#64748B', border: '#E2E8F0' },
                    Rejected: { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
                    Adjusted: { bg: '#FAF5FF', text: '#7C3AED', border: '#E9D5FF' },
                    Exported: { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' },
                  };
                  const col = statusColors[ts.status] || statusColors.Draft;
                  const isExpanded = expandedTimesheetId === ts.id;
                  const totalHrs = (ts.entries || []).reduce((acc: number, e: any) => acc + (Number(e.actual_hours) || 0), 0);
                  const totalKm = (ts.entries || []).reduce((acc: number, e: any) => acc + (Number(e.kilometres) || 0), 0);

                  return (
                    <div key={ts.id} style={{ background: '#FFFFFF', borderRadius: 10, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                      <div
                        onClick={() => setExpandedTimesheetId(isExpanded ? null : ts.id)}
                        style={{
                          padding: 18, display: 'flex', justifyContent: 'space-between',
                          alignItems: 'center', flexWrap: 'wrap', gap: 14, cursor: 'pointer',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                            <strong style={{ fontSize: '1rem', color: '#0F172A' }}>
                              Week: {new Date(ts.week_start).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })} – {new Date(ts.week_end).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </strong>
                            <span style={{ background: col.bg, color: col.text, border: `1px solid ${col.border}`, borderRadius: 9999, padding: '2px 10px', fontSize: '0.75rem', fontWeight: 700 }}>
                              {ts.status}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: 16, fontSize: '0.84rem', color: '#64748B' }}>
                            <span><strong>{totalHrs.toFixed(2)}</strong> Total Hours</span>
                            <span>&bull;</span>
                            <span><strong>{ts.entries?.length || 0}</strong> Shifts</span>
                            {totalKm > 0 && (
                              <>
                                <span>&bull;</span>
                                <span><strong>{totalKm}</strong> km Travel</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {ts.notes && (
                            <span style={{ fontSize: '0.78rem', color: '#64748B', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              Note: {ts.notes}
                            </span>
                          )}
                          <button
                            type="button"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                          >
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Entries Breakdown */}
                      {isExpanded && (
                        <div style={{ borderTop: '1px solid #E2E8F0', background: '#F8FAFC', padding: '14px 18px' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Shift Entries Breakdown
                          </div>
                          {(ts.entries || []).length === 0 ? (
                            <div style={{ fontSize: '0.82rem', color: '#94A3B8' }}>No shift entries recorded for this week.</div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {ts.entries.map((entry: any) => (
                                <div key={entry.id} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                                  <div>
                                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#0F172A' }}>
                                      {entry.participant?.full_name || 'Participant'}
                                      <span style={{ marginLeft: 8, fontSize: '0.75rem', color: '#64748B', fontWeight: 400 }}>
                                        ({entry.shift?.shift_reference || 'Shift'})
                                      </span>
                                    </div>
                                    <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 2 }}>
                                      {entry.actual_start ? new Date(entry.actual_start).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' }) : 'N/A'}:{' '}
                                      {entry.actual_start ? new Date(entry.actual_start).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }) : ''} –{' '}
                                      {entry.actual_end ? new Date(entry.actual_end).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }) : ''}
                                      {entry.break_minutes > 0 ? ` (Break: ${entry.break_minutes}m)` : ''}
                                    </div>
                                  </div>
                                  <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0F172A' }}>
                                      {Number(entry.actual_hours || 0).toFixed(2)} hrs
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: entry.variance_minutes > 0 ? '#DC2626' : '#16A34A' }}>
                                      {entry.variance_minutes > 0 ? `+${entry.variance_minutes}m variance` : entry.variance_minutes < 0 ? `${entry.variance_minutes}m variance` : 'On schedule'}
                                      {entry.kilometres > 0 ? ` &bull; ${entry.kilometres}km` : ''}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* COMPLETE SHIFT & CLINICAL PROGRESS NOTE MODAL */}
        {activeShiftForNote && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16,
          }}>
            <div style={{
              background: '#FFFFFF', borderRadius: 14, width: '100%', maxWidth: 680, maxHeight: '92vh',
              overflowY: 'auto', padding: 26, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid #E2E8F0', paddingBottom: 14 }}>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>
                    Complete Shift & Record Clinical Delivery
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748B' }}>
                    Participant: <strong>{activeShiftForNote.participant?.full_name}</strong> &bull; Shift: <strong>{activeShiftForNote.shift_reference}</strong>
                  </p>
                </div>
                <button
                  onClick={() => setActiveShiftForNote(null)}
                  style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#94A3B8' }}
                >
                  &times;
                </button>
              </div>

              <form onSubmit={submitCompleteShift} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* 1. Actual Shift Hours & Break */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1E293B', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={15} color="#2563EB" /> 1. Actual Shift Hours & Break
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Actual Start</label>
                      <input
                        type="datetime-local"
                        required
                        value={actualStart}
                        onChange={(e) => setActualStart(e.target.value)}
                        style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: 8, padding: '7px 10px', fontSize: '0.82rem', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Actual Finish</label>
                      <input
                        type="datetime-local"
                        required
                        value={actualEnd}
                        onChange={(e) => setActualEnd(e.target.value)}
                        style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: 8, padding: '7px 10px', fontSize: '0.82rem', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Break (Minutes)</label>
                      <input
                        type="number"
                        min="0"
                        value={breakMinutes}
                        onChange={(e) => setBreakMinutes(Number(e.target.value) || 0)}
                        style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: 8, padding: '7px 10px', fontSize: '0.82rem', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Clinical Notes & Observations */}
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1E293B', display: 'block', marginBottom: 4 }}>
                    Progress Summary / Shift Narrative *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Describe activities supported, participant engagement, daily routine, and overall shift narrative..."
                    style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: 8, padding: '9px 12px', fontSize: '0.85rem', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Support Delivered</label>
                    <input
                      type="text"
                      value={supportDelivered}
                      onChange={(e) => setSupportDelivered(e.target.value)}
                      placeholder="e.g. Personal care, meal prep, community access"
                      style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: 8, padding: '8px 10px', fontSize: '0.82rem', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Participant Response</label>
                    <input
                      type="text"
                      value={participantResponse}
                      onChange={(e) => setParticipantResponse(e.target.value)}
                      placeholder="e.g. Engaged, positive mood, expressed choices"
                      style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: 8, padding: '8px 10px', fontSize: '0.82rem', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Outcomes Observed</label>
                    <input
                      type="text"
                      value={outcomesObserved}
                      onChange={(e) => setOutcomesObserved(e.target.value)}
                      placeholder="e.g. Prepared dinner independently, completed shopping"
                      style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: 8, padding: '8px 10px', fontSize: '0.82rem', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Concerns / Variations</label>
                    <input
                      type="text"
                      value={concerns}
                      onChange={(e) => setConcerns(e.target.value)}
                      placeholder="e.g. Mild fatigue noted towards end of shift"
                      style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: 8, padding: '8px 10px', fontSize: '0.82rem', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Follow up toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    id="followUpCheck"
                    checked={followUpRequired}
                    onChange={(e) => setFollowUpRequired(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: '#2563EB' }}
                  />
                  <label htmlFor="followUpCheck" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                    Operational or Care Follow-Up Required by Management
                  </label>
                </div>
                {followUpRequired && (
                  <div>
                    <input
                      type="text"
                      value={followUpNotes}
                      onChange={(e) => setFollowUpNotes(e.target.value)}
                      placeholder="Specify follow-up action required (e.g. Restock supplies, notify OT, call GP)..."
                      style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: 8, padding: '8px 10px', fontSize: '0.82rem', boxSizing: 'border-box' }}
                    />
                  </div>
                )}

                {/* 3. NDIS Goals Supported */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1E293B', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Target size={15} color="#0D9488" /> 2. NDIS Goals Progress
                  </div>
                  {loadingGoals ? (
                    <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Loading active goals…</div>
                  ) : participantGoals.length === 0 ? (
                    <div style={{ fontSize: '0.8rem', color: '#64748B' }}>No active goals found for this participant.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {participantGoals.map((g, idx) => (
                        <div key={g.id} style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 8, padding: '10px 12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <span style={{ fontWeight: 600, fontSize: '0.82rem', color: '#0F172A' }}>{g.goal_title}</span>
                            <span style={{ fontSize: '0.72rem', background: '#F1F5F9', color: '#64748B', padding: '2px 8px', borderRadius: 4 }}>{g.category}</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8 }}>
                            <select
                              value={g.progress_rating}
                              onChange={(e) => {
                                const next = [...participantGoals];
                                next[idx].progress_rating = e.target.value;
                                setParticipantGoals(next);
                              }}
                              style={{ border: '1px solid #CBD5E1', borderRadius: 6, padding: '6px 8px', fontSize: '0.78rem' }}
                            >
                              <option value="Not Addressed">Not Addressed</option>
                              <option value="Regressed">Regressed</option>
                              <option value="Maintained">Maintained</option>
                              <option value="Progress Made">Progress Made</option>
                              <option value="Goal Achieved">Goal Achieved</option>
                            </select>
                            <input
                              type="text"
                              value={g.worker_comment}
                              onChange={(e) => {
                                const next = [...participantGoals];
                                next[idx].worker_comment = e.target.value;
                                setParticipantGoals(next);
                              }}
                              placeholder="Worker observation for this goal..."
                              style={{ border: '1px solid #CBD5E1', borderRadius: 6, padding: '6px 8px', fontSize: '0.78rem' }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Travel & Kilometres */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1E293B', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Car size={15} color="#7C3AED" /> 3. Worker Travel & Participant Transport
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Travel Type</label>
                      <select
                        value={travelType}
                        onChange={(e) => setTravelType(e.target.value as any)}
                        style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: 8, padding: '7px 10px', fontSize: '0.82rem', boxSizing: 'border-box' }}
                      >
                        <option value="none">No Travel Incurred</option>
                        <option value="provider_travel_to">Provider Travel to Participant</option>
                        <option value="travel_with_participant">Travel with Participant</option>
                        <option value="participant_transport">Activity-Based Transport</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Travel Time (Min)</label>
                      <input
                        type="number"
                        min="0"
                        disabled={travelType === 'none'}
                        value={travelMinutes}
                        onChange={(e) => setTravelMinutes(Number(e.target.value) || 0)}
                        style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: 8, padding: '7px 10px', fontSize: '0.82rem', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Kilometres (km)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        disabled={travelType === 'none'}
                        value={kilometres}
                        onChange={(e) => setKilometres(Number(e.target.value) || 0)}
                        style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: 8, padding: '7px 10px', fontSize: '0.82rem', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Incident Toggle */}
                <div style={{
                  background: incidentOccurred ? '#FEF2F2' : '#F8FAFC',
                  border: `1px solid ${incidentOccurred ? '#FECACA' : '#E2E8F0'}`,
                  borderRadius: 10, padding: 14,
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={incidentOccurred}
                      onChange={(e) => setIncidentOccurred(e.target.checked)}
                      style={{ width: 18, height: 18, accentColor: '#DC2626' }}
                    />
                    <div>
                      <strong style={{ fontSize: '0.88rem', color: incidentOccurred ? '#DC2626' : '#1E293B' }}>
                        An incident or near-miss occurred on this shift
                      </strong>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        If checked, you will be prompted to submit a prefilled Incident Report after saving this note.
                      </div>
                    </div>
                  </label>
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => setActiveShiftForNote(null)}
                    style={{ background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingNote || !noteText.trim()}
                    style={{ background: '#1E40AF', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer' }}
                  >
                    {submittingNote ? 'Submitting…' : 'Complete Shift & Save Record'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: REPORT INCIDENT FORM */}
        {tab === 'report_incident' && (
          <div style={{ background: '#FFFFFF', borderRadius: 12, padding: 24, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: 16, marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 4px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={20} style={{ color: '#DC2626' }} /> Structured Incident Report
              </h2>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>
                Complete all known facts accurately. Opus Care management will review and conduct an official investigation.
              </p>
            </div>

            <form onSubmit={submitIncidentReport} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Row 1: Participant & Shift */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>
                    Participant *
                  </label>
                  <select
                    required
                    value={incidentForm.participant_id}
                    onChange={(e) => setIncidentForm(prev => ({ ...prev, participant_id: e.target.value }))}
                    style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: 8, padding: '9px 12px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  >
                    <option value="">— Select Participant —</option>
                    {/* Unique participants from assigned shifts */}
                    {Array.from(new Set(shifts.map(s => s.participant_id))).map(pid => {
                      const s = shifts.find(item => item.participant_id === pid);
                      return (
                        <option key={pid} value={pid}>
                          {s?.participant?.full_name || pid}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>
                    Date & Time of Incident *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={incidentForm.incident_at}
                    onChange={(e) => setIncidentForm(prev => ({ ...prev, incident_at: e.target.value }))}
                    style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: 8, padding: '9px 12px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Participant residence, community center"
                    value={incidentForm.location}
                    onChange={(e) => setIncidentForm(prev => ({ ...prev, location: e.target.value }))}
                    style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: 8, padding: '9px 12px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Row 2: Category & Severity */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>
                    Category *
                  </label>
                  <select
                    value={incidentForm.category}
                    onChange={(e) => setIncidentForm(prev => ({ ...prev, category: e.target.value }))}
                    style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: 8, padding: '9px 12px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  >
                    <option value="injury">Physical Injury / Harm</option>
                    <option value="medication_error">Medication Error / Missed Dose</option>
                    <option value="behaviour_of_concern">Behaviour of Concern / Distress</option>
                    <option value="allegation_abuse_neglect">Allegation of Abuse, Neglect or Exploitation</option>
                    <option value="property_damage">Property Damage</option>
                    <option value="near_miss">Near Miss / Environmental Hazard</option>
                    <option value="other">Other Incident</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>
                    Severity Level *
                  </label>
                  <select
                    value={incidentForm.severity}
                    onChange={(e) => setIncidentForm(prev => ({ ...prev, severity: e.target.value as any }))}
                    style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: 8, padding: '9px 12px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  >
                    <option value="Low">Low — Minor bump, near miss, no injury</option>
                    <option value="Medium">Medium — First aid applied, temporary distress</option>
                    <option value="High">High — Medical attention required, severe behavioural event</option>
                    <option value="Critical">Critical — Emergency services, hospitalisation, serious allegation</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>
                  Detailed Incident Description (Facts Only) *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="State what happened clearly and objectively. Include what was observed, who was present, and what occurred before and after."
                  value={incidentForm.description}
                  onChange={(e) => setIncidentForm(prev => ({ ...prev, description: e.target.value }))}
                  style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: 8, padding: '10px 12px', fontSize: '0.88rem', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>

              {/* Immediate Actions */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>
                    Immediate Actions Taken
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Applied cold pack, provided reassurance, moved to quiet area..."
                    value={incidentForm.immediate_actions_taken}
                    onChange={(e) => setIncidentForm(prev => ({ ...prev, immediate_actions_taken: e.target.value }))}
                    style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: 8, padding: '9px 12px', fontSize: '0.88rem', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>
                    Injury or Harm Details (if any)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe any visible scratch, bruise, swelling, pain level, or psychological distress..."
                    value={incidentForm.injury_or_harm_details}
                    onChange={(e) => setIncidentForm(prev => ({ ...prev, injury_or_harm_details: e.target.value }))}
                    style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: 8, padding: '9px 12px', fontSize: '0.88rem', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Emergency Services */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 14 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 8 }}>
                  <input
                    type="checkbox"
                    checked={incidentForm.emergency_services_contacted}
                    onChange={(e) => setIncidentForm(prev => ({ ...prev, emergency_services_contacted: e.target.checked }))}
                    style={{ width: 18, height: 18 }}
                  />
                  <strong style={{ fontSize: '0.88rem', color: '#0F172A' }}>
                    Emergency services were contacted (Ambulance 000, Police, Fire)
                  </strong>
                </label>
                {incidentForm.emergency_services_contacted && (
                  <input
                    type="text"
                    placeholder="CAD/Job Number, attending officers/paramedics, hospital destination..."
                    value={incidentForm.emergency_services_details}
                    onChange={(e) => setIncidentForm(prev => ({ ...prev, emergency_services_details: e.target.value }))}
                    style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: 6, padding: '8px 10px', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                )}
              </div>

              {/* Witnesses & Attachments */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>
                    Witnesses (Names & Roles)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe (Co-worker), Jane Smith (Family member)"
                    value={incidentForm.witnesses}
                    onChange={(e) => setIncidentForm(prev => ({ ...prev, witnesses: e.target.value }))}
                    style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: 8, padding: '9px 12px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>
                    Evidence / Document Links (One per line)
                  </label>
                  <input
                    type="text"
                    placeholder="URL to photo, medical report, or document"
                    value={incidentForm.attachment_urls_text}
                    onChange={(e) => setIncidentForm(prev => ({ ...prev, attachment_urls_text: e.target.value }))}
                    style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: 8, padding: '9px 12px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid #E2E8F0', paddingTop: 16 }}>
                <button
                  type="button"
                  onClick={() => setTab('shifts')}
                  style={{ background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingIncident}
                  style={{
                    background: '#DC2626', color: '#FFFFFF', border: 'none', borderRadius: 8,
                    padding: '10px 24px', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                >
                  <Send size={16} /> {submittingIncident ? 'Submitting…' : 'Submit Official Incident Report'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: MY REPORTED INCIDENTS */}
        {tab === 'my_incidents' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 4px', color: '#0F172A' }}>My Reported Incidents</h2>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>
                  Live submission status of reports you have submitted.
                </p>
              </div>
              <button
                onClick={() => setTab('report_incident')}
                style={{
                  background: '#DC2626', color: '#FFFFFF', border: 'none', borderRadius: 8,
                  padding: '8px 16px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <Plus size={15} /> New Incident Report
              </button>
            </div>

            {incidents.length === 0 ? (
              <div style={{ background: '#FFFFFF', padding: '48px 24px', borderRadius: 12, textAlign: 'center', border: '1px solid #E2E8F0' }}>
                <CheckCircle2 size={40} style={{ color: '#16A34A', marginBottom: 12 }} />
                <h3 style={{ margin: '0 0 6px', color: '#334155' }}>No incidents reported</h3>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748B' }}>
                  You have not submitted any incident reports.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {incidents.map(inc => {
                  const sevStyle = severityColours[inc.severity] || severityColours.Low;
                  return (
                    <div
                      key={inc.id}
                      style={{
                        background: '#FFFFFF', borderRadius: 10, padding: 18, border: '1px solid #E2E8F0',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, flexWrap: 'wrap', gap: 10 }}>
                        <div>
                          <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '1rem', marginRight: 10 }}>
                            {inc.incident_reference}
                          </span>
                          <span style={{
                            background: sevStyle.bg, color: sevStyle.text, border: `1px solid ${sevStyle.border}`,
                            borderRadius: 20, padding: '2px 10px', fontSize: '0.75rem', fontWeight: 700, marginRight: 8,
                          }}>
                            {inc.severity} Severity
                          </span>
                          <span style={{ background: '#F1F5F9', color: '#475569', borderRadius: 20, padding: '2px 10px', fontSize: '0.75rem', fontWeight: 600 }}>
                            {inc.category}
                          </span>
                        </div>
                        <span style={{
                          background: inc.status === 'Closed' ? '#F0FDF4' : '#EFF6FF',
                          color: inc.status === 'Closed' ? '#16A34A' : '#1E40AF',
                          borderRadius: 20, padding: '4px 12px', fontSize: '0.78rem', fontWeight: 600,
                        }}>
                          Status: {inc.status}
                        </span>
                      </div>

                      <p style={{ margin: '0 0 10px', fontSize: '0.88rem', color: '#334155' }}>
                        {inc.description}
                      </p>

                      <div style={{ display: 'flex', gap: 16, fontSize: '0.78rem', color: '#94A3B8' }}>
                        <span>Participant: <strong>{inc.participant?.full_name || 'Participant'}</strong></span>
                        <span>Date: {new Date(inc.incident_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function WorkerPortalPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>Loading worker portal…</div>}>
      <WorkerPortalContent />
    </Suspense>
  );
}
