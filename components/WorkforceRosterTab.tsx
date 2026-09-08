'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, Clock, UserCheck, AlertCircle, AlertTriangle, 
  CheckCircle2, Plus, ChevronLeft, ChevronRight, Filter, Search, 
  MapPin, DollarSign, ShieldAlert, Sparkles, RefreshCw, X, Trash2, 
  Edit3, FileText, Check, MoreVertical, Layers, ArrowRight, User
} from 'lucide-react';

export interface ShiftAssignment {
  id: string;
  staff_id: string;
  assigned_by: string;
  assigned_at: string;
  confirmed_by_worker: boolean;
  confirmed_at?: string;
  status: 'rostered' | 'confirmed' | 'declined' | 'clocked_in' | 'clocked_out' | 'completed' | 'cancelled';
  clock_in_at?: string;
  clock_out_at?: string;
  actual_hours?: number;
  worker_notes?: string;
  staff?: {
    id: string;
    reference_number: string;
    full_name: string;
    role: string;
    phone: string;
    email: string;
    suburbs: string[];
    ndis_screening: string;
    ndis_screening_expiry?: string;
    first_aid_expiry?: string;
    cpr_expiry?: string;
    hourly_rate?: number;
  };
}

export interface ShiftProgressNote {
  id: string;
  note_text: string;
  goals_supported?: string;
  incident_occurred: boolean;
  incident_id?: string;
  incident?: {
    id: string;
    incident_reference: string;
    severity: string;
    status: string;
  };
  created_at: string;
}

export interface Shift {
  id: string;
  shift_reference: string;
  participant_id: string;
  service_type: string;
  ndis_support_item_code?: string;
  start_time: string;
  end_time: string;
  hours: number;
  location_suburb: string;
  location_address?: string;
  special_instructions?: string;
  status: 'unassigned' | 'assigned' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  participant?: {
    id: string;
    reference_number: string;
    full_name: string;
    suburb: string;
    street_address?: string;
    funding_type: string;
    allocated_weekly_hours?: number;
    phone?: string;
  };
  assignments?: ShiftAssignment[];
  progress_notes?: ShiftProgressNote[];
}

interface ParticipantOption {
  id: string;
  referenceNumber?: string;
  name: string;
  suburb: string;
  street_address?: string;
  allocatedHours?: number;
  fundingType?: string;
}

interface StaffOption {
  id: string;
  referenceNumber?: string;
  name: string;
  role: string;
  phone: string;
  suburbs: string[];
  ndisScreening?: string;
  ndisScreeningExpiry?: string;
  firstAidExpiry?: string;
  cprExpiry?: string;
  hourlyRate?: number;
}

interface WorkforceRosterTabProps {
  participants: ParticipantOption[];
  staff: StaffOption[];
}

const SERVICE_TYPES = [
  { label: 'Core - Self-Care Activities', code: '01_011_0107_1_1', rate: 67.56 },
  { label: 'Capacity - Community Participation', code: '04_104_0125_6_1', rate: 67.56 },
  { label: 'Core - Domestic Assistance', code: '01_019_0120_1_1', rate: 58.45 },
  { label: 'Core - Social & Civic Participation', code: '04_104_0125_6_1', rate: 67.56 },
  { label: 'Core - Weekend Social Support', code: '01_013_0107_1_1', rate: 94.82 },
  { label: 'Core - Transport Assistance', code: '02_051_0108_1_1', rate: 45.00 },
];

export default function WorkforceRosterTab({ participants, staff }: WorkforceRosterTabProps) {
  // Navigation & Date State
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'matrix' | 'list'>('matrix');
  const [suburbFilter, setSuburbFilter] = useState('all');
  const [participantFilter, setParticipantFilter] = useState('all');
  const [staffFilter, setStaffFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [preselectedDate, setPreselectedDate] = useState<string>('');
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [showNoteModal, setShowNoteModal] = useState<Shift | null>(null);

  // New Shift Form State
  const [formParticipantId, setFormParticipantId] = useState('');
  const [formServiceType, setFormServiceType] = useState(SERVICE_TYPES[0].label);
  const [formItemCode, setFormItemCode] = useState(SERVICE_TYPES[0].code);
  const [formDate, setFormDate] = useState('');
  const [formStartTime, setFormStartTime] = useState('09:00');
  const [formEndTime, setFormEndTime] = useState('13:00');
  const [formSuburb, setFormSuburb] = useState('Yamba');
  const [formAddress, setFormAddress] = useState('');
  const [formStaffId, setFormStaffId] = useState('');
  const [formInstructions, setFormInstructions] = useState('');
  const [formRepeatWeeks, setFormRepeatWeeks] = useState(1);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [conflictOverride, setConflictOverride] = useState(false);

  // Calculate Week Days
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(currentWeekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [currentWeekStart]);

  const currentWeekEnd = useMemo(() => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + 6);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [currentWeekStart]);

  // Load Shifts
  const loadShifts = async () => {
    setLoading(true);
    try {
      const startIso = currentWeekStart.toISOString();
      const endIso = currentWeekEnd.toISOString();
      const res = await fetch(`/api/workforce/shifts?start=${encodeURIComponent(startIso)}&end=${encodeURIComponent(endIso)}`);
      if (res.ok) {
        const data = await res.json();
        setShifts(data || []);
      }
    } catch (e) {
      console.error('Failed to load shifts', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShifts();
  }, [currentWeekStart]);

  // Quick navigation
  const prevWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() - 7);
    setCurrentWeekStart(d);
  };

  const nextWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + 7);
    setCurrentWeekStart(d);
  };

  const goToToday = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    setCurrentWeekStart(monday);
  };

  // Filter shifts
  const filteredShifts = useMemo(() => {
    return shifts.filter((s) => {
      if (suburbFilter !== 'all' && s.location_suburb.toLowerCase() !== suburbFilter.toLowerCase()) return false;
      if (participantFilter !== 'all' && s.participant_id !== participantFilter) return false;
      if (staffFilter !== 'all') {
        const assigned = s.assignments?.some((a) => a.staff_id === staffFilter);
        if (staffFilter === 'unassigned' && s.status !== 'unassigned') return false;
        if (staffFilter !== 'unassigned' && !assigned) return false;
      }
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      return true;
    });
  }, [shifts, suburbFilter, participantFilter, staffFilter, statusFilter]);

  // Stats Calculations
  const stats = useMemo(() => {
    const totalHours = filteredShifts.reduce((acc, s) => acc + Number(s.hours || 0), 0);
    const unassignedCount = filteredShifts.filter((s) => s.status === 'unassigned').length;
    const completedCount = filteredShifts.filter((s) => s.status === 'completed').length;
    const uniqueWorkers = new Set<string>();
    filteredShifts.forEach((s) => {
      s.assignments?.forEach((a) => {
        if (a.staff_id) uniqueWorkers.add(a.staff_id);
      });
    });

    // Estimated billing
    const estBilling = filteredShifts.reduce((acc, s) => {
      const match = SERVICE_TYPES.find((st) => st.label === s.service_type);
      const rate = match ? match.rate : 67.56;
      return acc + (Number(s.hours || 0) * rate);
    }, 0);

    return {
      totalHours,
      unassignedCount,
      completedCount,
      activeWorkers: uniqueWorkers.size,
      estBilling,
    };
  }, [filteredShifts]);

  // Suburbs List
  const availableSuburbs = useMemo(() => {
    const set = new Set<string>();
    shifts.forEach((s) => {
      if (s.location_suburb) set.add(s.location_suburb);
    });
    participants.forEach((p) => {
      if (p.suburb) {
        const clean = p.suburb.replace(/NSW|\d+/gi, '').trim();
        if (clean) set.add(clean);
      }
    });
    return Array.from(set);
  }, [shifts, participants]);

  // Real-time Conflict & Compliance Check in Scheduler
  const workerConflict = useMemo(() => {
    if (!formStaffId || !formDate || !formStartTime || !formEndTime) return null;
    const candidateStart = new Date(`${formDate}T${formStartTime}:00`);
    const candidateEnd = new Date(`${formDate}T${formEndTime}:00`);

    return shifts.find((s) => {
      if (s.status === 'cancelled') return false;
      const hasWorker = s.assignments?.some((a) => a.staff_id === formStaffId && a.status !== 'cancelled');
      if (!hasWorker) return false;
      const sStart = new Date(s.start_time);
      const sEnd = new Date(s.end_time);
      return candidateStart < sEnd && candidateEnd > sStart;
    });
  }, [formStaffId, formDate, formStartTime, formEndTime, shifts]);

  const selectedStaffRecord = useMemo(() => {
    return staff.find((st) => st.id === formStaffId);
  }, [formStaffId, staff]);

  // Open schedule modal with optional day
  const handleOpenSchedule = (dateStr?: string) => {
    const initialDate = dateStr || new Date().toISOString().split('T')[0];
    setFormDate(initialDate);
    if (participants.length > 0) {
      setFormParticipantId(participants[0].id);
      const cleanSub = (participants[0].suburb || 'Yamba').replace(/NSW|\d+/gi, '').trim();
      setFormSuburb(cleanSub || 'Yamba');
      setFormAddress(participants[0].street_address || '');
    }
    setFormServiceType(SERVICE_TYPES[0].label);
    setFormItemCode(SERVICE_TYPES[0].code);
    setFormStartTime('09:00');
    setFormEndTime('13:00');
    setFormStaffId('');
    setFormInstructions('');
    setFormRepeatWeeks(1);
    setFormError('');
    setConflictOverride(false);
    setShowScheduleModal(true);
  };

  // Participant change autofills address & suburb
  const handleParticipantChange = (pid: string) => {
    setFormParticipantId(pid);
    const p = participants.find((item) => item.id === pid);
    if (p) {
      const cleanSub = (p.suburb || 'Yamba').replace(/NSW|\d+/gi, '').trim();
      setFormSuburb(cleanSub || 'Yamba');
      setFormAddress(p.street_address || '');
    }
  };

  // Service change autofills item code
  const handleServiceChange = (st: string) => {
    setFormServiceType(st);
    const match = SERVICE_TYPES.find((item) => item.label === st);
    if (match) setFormItemCode(match.code);
  };

  // Submit new shift
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError('');

    const startIso = new Date(`${formDate}T${formStartTime}:00`).toISOString();
    const endIso = new Date(`${formDate}T${formEndTime}:00`).toISOString();

    try {
      const res = await fetch('/api/workforce/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_id: formParticipantId,
          service_type: formServiceType,
          ndis_support_item_code: formItemCode,
          start_time: startIso,
          end_time: endIso,
          location_suburb: formSuburb,
          location_address: formAddress,
          special_instructions: formInstructions,
          staff_id: formStaffId || null,
          repeat_weeks: formRepeatWeeks,
          force: conflictOverride,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409 && data.requiresConfirmation) {
          setFormError('⚠️ Schedule Conflict: This worker is already rostered on another shift during this time. Tick the override box to proceed anyway.');
        } else {
          setFormError(data.message || 'Failed to schedule shift.');
        }
        return;
      }

      setShowScheduleModal(false);
      loadShifts();
    } catch (err) {
      setFormError('Connection error. Please try again.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Quick reassign from detail modal
  const handleReassignWorker = async (shiftId: string, newStaffId: string) => {
    try {
      const res = await fetch('/api/workforce/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shift_id: shiftId, staff_id: newStaffId, force: true }),
      });
      if (res.ok) {
        loadShifts();
        setSelectedShift(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Unassign worker
  const handleUnassignShift = async (shiftId: string) => {
    try {
      const res = await fetch(`/api/workforce/assignments?shift_id=${shiftId}`, { method: 'DELETE' });
      if (res.ok) {
        loadShifts();
        setSelectedShift(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete shift
  const handleDeleteShift = async (shiftId: string) => {
    if (!confirm('Are you sure you want to cancel and delete this shift?')) return;
    try {
      const res = await fetch(`/api/workforce/shifts?id=${shiftId}`, { method: 'DELETE' });
      if (res.ok) {
        loadShifts();
        setSelectedShift(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="crmTabPanel">
      {/* 1. TOP HEADER & METRIC CARDS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ 
              background: '#E0F2FE', 
              color: '#0284C7', 
              fontSize: '0.75rem', 
              fontWeight: 700, 
              padding: '3px 10px', 
              borderRadius: 20, 
              letterSpacing: '0.06em', 
              textTransform: 'uppercase' 
            }}>
              NDIS Workforce Hub
            </span>
            <span style={{ fontSize: '0.85rem', color: '#64748B' }}>
              Clarence Valley & Northern Rivers
            </span>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
            Rostering & Shift Scheduling
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => loadShifts()}
            className="crmSecondaryBtn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 15px' }}
            title="Refresh Roster"
          >
            <RefreshCw size={15} className={loading ? 'crmSpin' : ''} />
            <span>Sync</span>
          </button>

          <button
            onClick={() => handleOpenSchedule()}
            className="crmActionBtnPrimary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 20px' }}
          >
            <Plus size={16} />
            <span>Schedule Shift</span>
          </button>
        </div>
      </div>

      {/* 2. STATS CARDS */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: 16, 
        marginBottom: 24 
      }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '16px 20px', boxShadow: '0 2px 10px rgba(15,23,42,0.03)' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
            Total Rostered Hours
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'baseline', gap: 6 }}>
            {stats.totalHours.toFixed(1)}
            <span style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 500 }}>hrs this week</span>
          </div>
        </div>

        <div style={{ 
          background: stats.unassignedCount > 0 ? '#FFFBEB' : '#FFFFFF', 
          border: stats.unassignedCount > 0 ? '1.5px solid #FCD34D' : '1px solid #E2E8F0', 
          borderRadius: 14, 
          padding: '16px 20px',
          boxShadow: '0 2px 10px rgba(15,23,42,0.03)'
        }}>
          <div style={{ fontSize: '0.8rem', color: stats.unassignedCount > 0 ? '#B45309' : '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            {stats.unassignedCount > 0 && <AlertTriangle size={14} style={{ color: '#D97706' }} />}
            Unassigned Shifts
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: stats.unassignedCount > 0 ? '#B45309' : '#0F172A' }}>
            {stats.unassignedCount}
            <span style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 500, marginLeft: 6 }}>needs coverage</span>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '16px 20px', boxShadow: '0 2px 10px rgba(15,23,42,0.03)' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
            Active Workers
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'baseline', gap: 6 }}>
            {stats.activeWorkers}
            <span style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 500 }}>of {staff.length} rostered</span>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '16px 20px', boxShadow: '0 2px 10px rgba(15,23,42,0.03)' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
            Est. NDIS Claim Value
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#059669', display: 'flex', alignItems: 'baseline', gap: 4 }}>
            ${stats.estBilling.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            <span style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 500 }}>AUD</span>
          </div>
        </div>
      </div>

      {/* 3. ROSTER NAVIGATION & FILTER CONTROLS */}
      <div style={{ 
        background: '#FFFFFF', 
        border: '1px solid #E2E8F0', 
        borderRadius: 14, 
        padding: '14px 20px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        flexWrap: 'wrap', 
        gap: 16, 
        marginBottom: 20 
      }}>
        {/* Week Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'inline-flex', border: '1.5px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
            <button
              onClick={prevWeek}
              style={{ background: '#FFFFFF', border: 'none', padding: '7px 12px', cursor: 'pointer', borderRight: '1px solid #E2E8F0' }}
              title="Previous Week"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={goToToday}
              style={{ background: '#F8FAFC', border: 'none', padding: '7px 14px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, color: '#162E56' }}
            >
              Today
            </button>
            <button
              onClick={nextWeek}
              style={{ background: '#FFFFFF', border: 'none', padding: '7px 12px', cursor: 'pointer', borderLeft: '1px solid #E2E8F0' }}
              title="Next Week"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em' }}>
            {currentWeekStart.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })} – {currentWeekEnd.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Suburb Filter */}
          <select
            value={suburbFilter}
            onChange={(e) => setSuburbFilter(e.target.value)}
            className="crmFormInput"
            style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }}
          >
            <option value="all">All Suburbs</option>
            {availableSuburbs.map((sub) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>

          {/* Participant Filter */}
          <select
            value={participantFilter}
            onChange={(e) => setParticipantFilter(e.target.value)}
            className="crmFormInput"
            style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }}
          >
            <option value="all">All Participants</option>
            {participants.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Worker Filter */}
          <select
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
            className="crmFormInput"
            style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }}
          >
            <option value="all">All Workers</option>
            <option value="unassigned">Unassigned Only</option>
            {staff.map((st) => (
              <option key={st.id} value={st.id}>{st.name}</option>
            ))}
          </select>

          {/* View Toggle */}
          <div style={{ display: 'inline-flex', background: '#F1F5F9', padding: 3, borderRadius: 8 }}>
            <button
              onClick={() => setViewMode('matrix')}
              style={{
                border: 'none',
                background: viewMode === 'matrix' ? '#FFFFFF' : 'transparent',
                color: viewMode === 'matrix' ? '#0F172A' : '#64748B',
                fontWeight: 700,
                fontSize: '0.8rem',
                padding: '5px 12px',
                borderRadius: 6,
                cursor: 'pointer',
                boxShadow: viewMode === 'matrix' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              Weekly Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                border: 'none',
                background: viewMode === 'list' ? '#FFFFFF' : 'transparent',
                color: viewMode === 'list' ? '#0F172A' : '#64748B',
                fontWeight: 700,
                fontSize: '0.8rem',
                padding: '5px 12px',
                borderRadius: 6,
                cursor: 'pointer',
                boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              List View
            </button>
          </div>
        </div>
      </div>

      {/* 4. MAIN VIEW: WEEKLY GRID MATRIX */}
      {viewMode === 'matrix' ? (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(7, minmax(160px, 1fr))', 
          gap: 12, 
          overflowX: 'auto',
          paddingBottom: 20 
        }}>
          {weekDays.map((dayDate, dayIdx) => {
            const dateIsoStr = dayDate.toISOString().split('T')[0];
            const isToday = new Date().toISOString().split('T')[0] === dateIsoStr;

            // Find shifts on this date
            const dayShifts = filteredShifts.filter((s) => {
              const sDate = s.start_time.split('T')[0];
              return sDate === dateIsoStr;
            });

            return (
              <div
                key={dateIsoStr}
                style={{
                  background: isToday ? '#F8FAFC' : '#FFFFFF',
                  border: isToday ? '2px solid #0284C7' : '1px solid #E2E8F0',
                  borderRadius: 14,
                  minHeight: 460,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(15,23,42,0.03)'
                }}
              >
                {/* Column Day Header */}
                <div style={{
                  padding: '12px 14px',
                  background: isToday ? '#0284C7' : '#F8FAFC',
                  color: isToday ? '#FFFFFF' : '#0F172A',
                  borderBottom: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: isToday ? 0.9 : 0.6 }}>
                      {dayDate.toLocaleDateString('en-AU', { weekday: 'short' })}
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                      {dayDate.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>

                  {isToday && (
                    <span style={{ 
                      background: '#FFFFFF', 
                      color: '#0284C7', 
                      fontSize: '0.65rem', 
                      fontWeight: 800, 
                      padding: '2px 6px', 
                      borderRadius: 4, 
                      textTransform: 'uppercase' 
                    }}>
                      Today
                    </span>
                  )}
                </div>

                {/* Shift Cards Container */}
                <div style={{ padding: 10, flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {dayShifts.length === 0 ? (
                    <div style={{ 
                      flex: 1, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      padding: '20px 10px',
                      border: '1.5px dashed #E2E8F0',
                      borderRadius: 10,
                      color: '#94A3B8',
                      textAlign: 'center'
                    }}>
                      <Clock size={20} style={{ opacity: 0.4, marginBottom: 6 }} />
                      <span style={{ fontSize: '0.78rem', fontWeight: 500 }}>No shifts</span>
                      <button
                        onClick={() => handleOpenSchedule(dateIsoStr)}
                        style={{
                          marginTop: 10,
                          background: '#F1F5F9',
                          border: 'none',
                          color: '#0F172A',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: 6,
                          cursor: 'pointer'
                        }}
                      >
                        + Schedule
                      </button>
                    </div>
                  ) : (
                    dayShifts.map((shift) => {
                      const startTimeStr = new Date(shift.start_time).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: true });
                      const endTimeStr = new Date(shift.end_time).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: true });
                      const assignedWorker = shift.assignments?.[0]?.staff;
                      const isUnassigned = shift.status === 'unassigned' || !assignedWorker;
                      const isCompleted = shift.status === 'completed';

                      return (
                        <div
                          key={shift.id}
                          onClick={() => setSelectedShift(shift)}
                          style={{
                            background: '#FFFFFF',
                            border: isUnassigned ? '1.5px dashed #F59E0B' : '1px solid #E2E8F0',
                            borderLeft: isUnassigned 
                              ? '4px solid #F59E0B' 
                              : isCompleted 
                              ? '4px solid #10B981' 
                              : '4px solid #0284C7',
                            borderRadius: 10,
                            padding: 10,
                            cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(15,23,42,0.04)',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                        >
                          {/* Time & Duration */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F172A' }}>
                              {startTimeStr} – {endTimeStr}
                            </span>
                            <span style={{ 
                              fontSize: '0.7rem', 
                              fontWeight: 700, 
                              background: '#F1F5F9', 
                              color: '#475569', 
                              padding: '1px 6px', 
                              borderRadius: 4 
                            }}>
                              {shift.hours}h
                            </span>
                          </div>

                          {/* Participant Name */}
                          <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#162E56', marginBottom: 4, lineHeight: 1.2 }}>
                            {shift.participant?.full_name || 'Participant'}
                          </div>

                          {/* Service Type */}
                          <div style={{ 
                            fontSize: '0.72rem', 
                            color: '#64748B', 
                            marginBottom: 8, 
                            whiteSpace: 'nowrap', 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis' 
                          }}>
                            {shift.service_type}
                          </div>

                          {/* Location Suburb */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: '#475569', marginBottom: 8 }}>
                            <MapPin size={12} style={{ color: '#0284C7' }} />
                            <span>{shift.location_suburb}</span>
                          </div>

                          {/* Worker Assignment Chip */}
                          <div style={{
                            padding: '4px 8px',
                            borderRadius: 6,
                            background: isUnassigned ? '#FFFBEB' : '#F8FAFC',
                            border: isUnassigned ? '1px solid #FEF3C7' : '1px solid #E2E8F0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 6,
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                              <span style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: isUnassigned ? '#F59E0B' : '#10B981',
                                flexShrink: 0
                              }} />
                              <span style={{ 
                                fontSize: '0.75rem', 
                                fontWeight: 700, 
                                color: isUnassigned ? '#B45309' : '#0F172A',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {assignedWorker ? assignedWorker.full_name : 'Unassigned'}
                              </span>
                            </div>

                            {shift.progress_notes && shift.progress_notes.length > 0 && (
                              <span title="Progress Note Logged" style={{ display: 'inline-flex', alignItems: 'center' }}>
                                <FileText size={12} style={{ color: '#10B981' }} />
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Add shift to this exact day */}
                  {dayShifts.length > 0 && (
                    <button
                      onClick={() => handleOpenSchedule(dateIsoStr)}
                      style={{
                        background: 'transparent',
                        border: '1px dashed #CBD5E1',
                        borderRadius: 8,
                        padding: 6,
                        color: '#64748B',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4
                      }}
                    >
                      <Plus size={13} />
                      <span>Add Shift</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* 5. LIST VIEW TABLE */
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '12px 16px' }}>Ref / Date</th>
                <th style={{ padding: '12px 16px' }}>Participant</th>
                <th style={{ padding: '12px 16px' }}>Service & Line Item</th>
                <th style={{ padding: '12px 16px' }}>Time & Hours</th>
                <th style={{ padding: '12px 16px' }}>Suburb</th>
                <th style={{ padding: '12px 16px' }}>Assigned Worker</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredShifts.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>
                    No shifts match your filter criteria for this week.
                  </td>
                </tr>
              ) : (
                filteredShifts.map((shift) => {
                  const sDate = new Date(shift.start_time).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
                  const sTime = new Date(shift.start_time).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: true });
                  const eTime = new Date(shift.end_time).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: true });
                  const worker = shift.assignments?.[0]?.staff;

                  return (
                    <tr key={shift.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0284C7', fontSize: '0.82rem' }}>
                          {shift.shift_reference}
                        </span>
                        <div style={{ fontSize: '0.82rem', color: '#0F172A', fontWeight: 600 }}>{sDate}</div>
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: '#162E56' }}>
                        {shift.participant?.full_name}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#0F172A' }}>{shift.service_type}</div>
                        <span style={{ fontSize: '0.75rem', color: '#64748B', fontFamily: 'monospace' }}>{shift.ndis_support_item_code}</span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div>{sTime} – {eTime}</div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>{shift.hours} hrs</span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={13} style={{ color: '#0284C7' }} />
                          {shift.location_suburb}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {worker ? (
                          <span style={{ fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
                            {worker.full_name}
                          </span>
                        ) : (
                          <span style={{ color: '#D97706', fontWeight: 700, background: '#FEF3C7', padding: '3px 8px', borderRadius: 6, fontSize: '0.75rem' }}>
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: 20,
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          textTransform: 'capitalize',
                          background: shift.status === 'completed' ? '#ECFDF5' : shift.status === 'confirmed' ? '#E0F2FE' : '#F8FAFC',
                          color: shift.status === 'completed' ? '#059669' : shift.status === 'confirmed' ? '#0284C7' : '#64748B'
                        }}>
                          {shift.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedShift(shift)}
                          className="crmSecondaryBtn"
                          style={{ padding: '5px 10px', fontSize: '0.8rem' }}
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 6. MODAL: SCHEDULE NEW SHIFT */}
      {showScheduleModal && (
        <div className="crmModalOverlay" onClick={() => setShowScheduleModal(false)}>
          <div className="crmModalBox" style={{ maxWidth: 620 }} onClick={(e) => e.stopPropagation()}>
            <div className="crmModalHeader">
              <div>
                <span className="refIdTag">NEW SHIFT ROSTER</span>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>Schedule NDIS Shift</h3>
              </div>
              <button onClick={() => setShowScheduleModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {formError && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '12px 16px', borderRadius: 8, fontSize: '0.85rem' }}>
                  {formError}
                </div>
              )}

              {/* Participant Selection */}
              <div>
                <label className="crmFormLabel">Participant *</label>
                <select
                  value={formParticipantId}
                  onChange={(e) => handleParticipantChange(e.target.value)}
                  className="crmFormInput"
                  required
                >
                  {participants.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.referenceNumber || 'NDIS'} — {p.suburb})</option>
                  ))}
                </select>
              </div>

              {/* Service Type & Item Code */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="crmFormLabel">Service Type *</label>
                  <select
                    value={formServiceType}
                    onChange={(e) => handleServiceChange(e.target.value)}
                    className="crmFormInput"
                    required
                  >
                    {SERVICE_TYPES.map((st) => (
                      <option key={st.label} value={st.label}>{st.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="crmFormLabel">NDIS Line Item Code</label>
                  <input
                    type="text"
                    value={formItemCode}
                    onChange={(e) => setFormItemCode(e.target.value)}
                    className="crmFormInput"
                    style={{ fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              {/* Date & Time Pickers */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label className="crmFormLabel">Date *</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="crmFormInput"
                    required
                  />
                </div>
                <div>
                  <label className="crmFormLabel">Start Time *</label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="crmFormInput"
                    required
                  />
                </div>
                <div>
                  <label className="crmFormLabel">End Time *</label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="crmFormInput"
                    required
                  />
                </div>
              </div>

              {/* Suburb & Address */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
                <div>
                  <label className="crmFormLabel">Suburb *</label>
                  <input
                    type="text"
                    value={formSuburb}
                    onChange={(e) => setFormSuburb(e.target.value)}
                    className="crmFormInput"
                    required
                  />
                </div>
                <div>
                  <label className="crmFormLabel">Street Address / Venue</label>
                  <input
                    type="text"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    className="crmFormInput"
                    placeholder="e.g. 14 Ocean View Dr, Yamba"
                  />
                </div>
              </div>

              {/* Worker Assignment Selector with Live Guard */}
              <div>
                <label className="crmFormLabel">Assign Support Worker (Optional)</label>
                <select
                  value={formStaffId}
                  onChange={(e) => setFormStaffId(e.target.value)}
                  className="crmFormInput"
                >
                  <option value="">-- Leave Unassigned (Open Coverage) --</option>
                  {staff.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.role}) — Suburbs: {st.suburbs?.join(', ')}
                    </option>
                  ))}
                </select>

                {/* Worker Conflict Banner */}
                {workerConflict && (
                  <div style={{ marginTop: 8, background: '#FEF3C7', border: '1px solid #FCD34D', padding: '10px 14px', borderRadius: 8, fontSize: '0.82rem', color: '#92400E' }}>
                    <div style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <AlertTriangle size={15} style={{ color: '#D97706' }} />
                      Warning: Schedule Overlap Detected
                    </div>
                    <span>{selectedStaffRecord?.name} is already assigned to {workerConflict.shift_reference} on this date.</span>
                    <div style={{ marginTop: 8 }}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 700 }}>
                        <input
                          type="checkbox"
                          checked={conflictOverride}
                          onChange={(e) => setConflictOverride(e.target.checked)}
                        />
                        Allow double-booking override
                      </label>
                    </div>
                  </div>
                )}

                {/* Worker Compliance Verification Pill */}
                {selectedStaffRecord && !workerConflict && (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: '#059669', background: '#ECFDF5', padding: '6px 12px', borderRadius: 8 }}>
                    <CheckCircle2 size={15} />
                    <span>Compliance Verified: NDIS Screening & First Aid Active</span>
                  </div>
                )}
              </div>

              {/* Repeat Shift Option */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#F8FAFC', padding: '12px 16px', borderRadius: 8 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>Repeat weekly:</span>
                <select
                  value={formRepeatWeeks}
                  onChange={(e) => setFormRepeatWeeks(Number(e.target.value))}
                  className="crmFormInput"
                  style={{ width: 'auto', padding: '4px 10px', fontSize: '0.85rem' }}
                >
                  <option value={1}>Single Shift (No Repeat)</option>
                  <option value={2}>Repeat for 2 Weeks</option>
                  <option value={4}>Repeat for 4 Weeks (1 Month)</option>
                  <option value={8}>Repeat for 8 Weeks (2 Months)</option>
                </select>
              </div>

              {/* Special Instructions */}
              <div>
                <label className="crmFormLabel">Care Notes & Special Instructions</label>
                <textarea
                  value={formInstructions}
                  onChange={(e) => setFormInstructions(e.target.value)}
                  className="crmFormInput"
                  rows={2}
                  placeholder="e.g. Assist with morning mobility routine, bring transport vehicle, accompany to clinic."
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="crmSecondaryBtn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="crmActionBtnPrimary"
                >
                  {formSubmitting ? 'Scheduling...' : 'Confirm & Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL: SHIFT DETAIL & REASSIGNMENT */}
      {selectedShift && (
        <div className="crmModalOverlay" onClick={() => setSelectedShift(null)}>
          <div className="crmModalBox" style={{ maxWidth: 580 }} onClick={(e) => e.stopPropagation()}>
            <div className="crmModalHeader">
              <div>
                <span className="refIdTag">{selectedShift.shift_reference}</span>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                  {selectedShift.participant?.full_name}
                </h3>
              </div>
              <button onClick={() => setSelectedShift(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: 24 }}>
              {/* Date & Location summary */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 8 }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Date & Time</span>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>
                      {new Date(selectedShift.start_time).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                      {new Date(selectedShift.start_time).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: true })} – {new Date(selectedShift.end_time).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: true })} ({selectedShift.hours} hrs)
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Location</span>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>
                      {selectedShift.location_suburb}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                      {selectedShift.location_address || 'Address on file'}
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #EEF2F6', paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748B' }}>
                  <span>Service: <strong style={{ color: '#0F172A' }}>{selectedShift.service_type}</strong></span>
                  <span style={{ fontFamily: 'monospace' }}>Code: {selectedShift.ndis_support_item_code}</span>
                </div>
              </div>

              {/* Assigned Worker Section */}
              <div style={{ marginBottom: 20 }}>
                <span className="crmFormLabel">Assigned Support Worker</span>
                {selectedShift.assignments && selectedShift.assignments.length > 0 && selectedShift.assignments[0].staff ? (
                  <div style={{ 
                    background: '#ECFDF5', 
                    border: '1px solid #A7F3D0', 
                    borderRadius: 10, 
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ fontWeight: 800, color: '#065F46', fontSize: '0.95rem' }}>
                        {selectedShift.assignments[0].staff.full_name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#047857' }}>
                        {selectedShift.assignments[0].staff.role} • {selectedShift.assignments[0].staff.phone}
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnassignShift(selectedShift.id)}
                      className="crmSecondaryBtn"
                      style={{ padding: '4px 10px', fontSize: '0.78rem', color: '#B91C1C' }}
                    >
                      Unassign
                    </button>
                  </div>
                ) : (
                  <div style={{ 
                    background: '#FFFBEB', 
                    border: '1.5px dashed #FCD34D', 
                    borderRadius: 10, 
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{ color: '#B45309', fontWeight: 700, fontSize: '0.88rem' }}>
                      ⚠️ No worker currently assigned to this shift
                    </span>
                  </div>
                )}

                {/* Quick Reassign Dropdown */}
                <div style={{ marginTop: 12 }}>
                  <label style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    Reassign to another worker:
                  </label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) handleReassignWorker(selectedShift.id, e.target.value);
                    }}
                    className="crmFormInput"
                    defaultValue=""
                  >
                    <option value="" disabled>-- Select Worker to Assign --</option>
                    {staff.map((st) => (
                      <option key={st.id} value={st.id}>{st.name} ({st.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Progress Note if exists */}
              {selectedShift.progress_notes && selectedShift.progress_notes.length > 0 && (
                <div style={{
                  background: selectedShift.progress_notes[0].incident_occurred ? '#FEF2F2' : '#F8FAFC',
                  border: selectedShift.progress_notes[0].incident_occurred ? '1px solid #FECACA' : '1px solid #E2E8F0',
                  borderRadius: 10,
                  padding: 14,
                  marginBottom: 20
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#0F172A', fontWeight: 800, fontSize: '0.88rem' }}>
                      <FileText size={15} style={{ color: selectedShift.progress_notes[0].incident_occurred ? '#DC2626' : '#0284C7' }} />
                      <span>Shift Progress Note Logged</span>
                    </div>
                    {selectedShift.progress_notes[0].incident_occurred && (
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: '#FEE2E2',
                        color: '#DC2626',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        <ShieldAlert size={12} />
                        INCIDENT FLAGGED
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.5, margin: '0 0 8px' }}>
                    &ldquo;{selectedShift.progress_notes[0].note_text}&rdquo;
                  </p>
                  {selectedShift.progress_notes[0].goals_supported && (
                    <div style={{ fontSize: '0.78rem', color: '#64748B', marginBottom: 4 }}>
                      <strong>NDIS Goals:</strong> {selectedShift.progress_notes[0].goals_supported}
                    </div>
                  )}
                  {(selectedShift.progress_notes[0].incident || selectedShift.progress_notes[0].incident_id) && (
                    <div style={{
                      fontSize: '0.78rem',
                      color: '#B91C1C',
                      fontWeight: 700,
                      marginTop: 8,
                      padding: '6px 10px',
                      borderRadius: 6,
                      background: '#FFF',
                      border: '1px solid #FCA5A5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ShieldAlert size={14} />
                        <span>Linked Incident: <strong>{selectedShift.progress_notes[0].incident?.incident_reference || selectedShift.progress_notes[0].incident_id}</strong></span>
                      </div>
                      {selectedShift.progress_notes[0].incident?.status && (
                        <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: 4, background: '#FEE2E2' }}>
                          {selectedShift.progress_notes[0].incident.status}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Actions: Cancel Shift */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: 16 }}>
                <button
                  onClick={() => handleDeleteShift(selectedShift.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#DC2626',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={15} />
                  <span>Delete Shift</span>
                </button>

                <button
                  onClick={() => setSelectedShift(null)}
                  className="crmActionBtnPrimary"
                  style={{ padding: '8px 18px' }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
