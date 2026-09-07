'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Users, UserCheck, FileText, Phone, Mail, MapPin, Calendar, 
  CheckCircle2, Clock, AlertCircle, ArrowRight, Search, Filter, 
  Plus, Shield, Sparkles, RefreshCw, ExternalLink, Lock, LogOut,
  Columns, List, UserPlus, FileCheck, MessageSquare, History, Check,
  UploadCloud, FileDown, FolderLock, CalendarClock, AlertTriangle,
  LayoutDashboard, Receipt, Calculator, Award, Settings, ChevronLeft,
  ChevronRight, TrendingUp, DollarSign, Activity, FileSpreadsheet,
  Layers, ShieldAlert, Sparkle, Eye, BookOpen, GraduationCap, ClipboardCheck, Upload, Trophy
} from 'lucide-react';

interface Referral {
  id: string;
  referenceNumber?: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  participantName: string;
  suburb: string;
  funding: string;
  services: string;
  schedulePreference: string;
  message: string;
  status: 'new' | 'contacted' | 'assessment' | 'agreement_sent' | 'accepted' | 'closed' | 'archived';
  createdAt: string;
}

interface Participant {
  id: string;
  referenceNumber?: string;
  name: string;
  ndisNumber: string;
  fundingType: string;
  planManager: string;
  suburb: string;
  allocatedHours: number;
  primaryService: string;
  status: string;
  workerAssigned: string;
  contactPerson: string;
}

interface Staff {
  id: string;
  referenceNumber?: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  suburbs: string[];
  ndisScreening: string;
  ndisScreeningExpiry?: string;
  wwcc: string;
  wwccExpiry?: string;
  policeCheckDate?: string;
  firstAid: string;
  firstAidExpiry?: string;
  cprExpiry?: string;
  hourlyRate?: number;
  status: string;
}

interface ActivityItem {
  id: string;
  activity_type: string;
  title: string;
  description: string;
  author_name: string;
  created_at: string;
}

interface CrmDocument {
  id: string;
  owner_type: string;
  owner_id: string;
  file_name: string;
  file_size?: number;
  storage_path: string;
  category: string;
  expiry_date?: string;
  notes?: string;
  uploaded_by?: string;
  created_at: string;
  downloadUrl?: string;
}


interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
}

interface TrainingCourse {
  id: string;
  title: string;
  description?: string;
  course_type: 'read_acknowledge' | 'read_quiz' | 'external_cert';
  material_type: string;
  material_url?: string;
  quiz_questions?: QuizQuestion[];
  pass_mark_pct: number;
  validity_months?: number;
  is_mandatory: boolean;
  certificate_enabled: boolean;
  max_attempts?: number;
  is_active: boolean;
  created_at: string;
}

interface TrainingAssignment {
  id: string;
  course_id: string;
  staff_id: string;
  staff_name?: string;
  due_date?: string;
  training_courses?: TrainingCourse;
}


interface ExternalCourse {
  id: string;
  title: string;
  provider: string;
  category: string;
  description: string;
  cost: string;
  certificate_type: string;
  target_audience: string;
  duration_text?: string;
  url: string;
  last_verified?: string;
}

interface TrainingCompletion {
  id: string;
  course_id: string;
  staff_id: string;
  completed_at: string;
  quiz_score_pct?: number;
  passed: boolean;
  expires_at?: string;
  certificate_id?: string;
  cert_download_url?: string;
}


type TabType = 'dashboard' | 'referrals' | 'agreements' | 'participants' | 'invoicing' | 'quotes' | 'staff' | 'compliance' | 'settings';

const PIPELINE_STAGES = [
  { id: 'new', label: 'New Inbound', color: '#0284C7', bg: '#E0F2FE' },
  { id: 'contacted', label: 'Contacted', color: '#D97706', bg: '#FEF3C7' },
  { id: 'assessment', label: 'Assessment', color: '#7C3AED', bg: '#EDE9FE' },
  { id: 'agreement_sent', label: 'Agreement Sent', color: '#2563EB', bg: '#DBEAFE' },
  { id: 'accepted', label: 'Active / Enrolled', color: '#059669', bg: '#D1FAE5' },
] as const;

export default function AdminCrmPage() {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);
  const [adminKey, setAdminKey] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [statusNotice, setStatusNotice] = useState('');

  const [tab, setTab] = useState<TabType>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<'pipeline' | 'table'>('pipeline');
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Selected Records
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [drawerTab, setDrawerTab] = useState<'overview' | 'documents' | 'timeline'>('overview');

  // Activity Timeline State
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteType, setNewNoteType] = useState<'note' | 'call' | 'email' | 'meeting'>('note');
  const [noteSaving, setNoteSaving] = useState(false);
  const [converting, setConverting] = useState(false);

  // Document Vault State
  const [documents, setDocuments] = useState<CrmDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('service_agreement');
  const [uploadExpiry, setUploadExpiry] = useState('');
  const [uploadNotes, setUploadNotes] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ── Training & Compliance State ──────────────────────────────────────────
  const [trainingCourses, setTrainingCourses] = useState<TrainingCourse[]>([]);
  const [trainingAssignments, setTrainingAssignments] = useState<TrainingAssignment[]>([]);
  const [trainingComplianceMap, setTrainingComplianceMap] = useState<Record<string, TrainingCompletion[]>>({});
  const [trainingLoading, setTrainingLoading] = useState(false);
  const [trainingTab, setTrainingTab] = useState<'courses' | 'assign' | 'external' | 'report'>('courses');
  const [externalCourses, setExternalCourses] = useState<ExternalCourse[]>([]);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title: '', description: '', course_type: 'read_acknowledge',
    material_type: 'none', material_url: '', pass_mark_pct: 80,
    validity_months: '', is_mandatory: false, certificate_enabled: true,
    max_attempts: '', quiz_questions: [] as QuizQuestion[],
  });
  const [savingCourse, setSavingCourse] = useState(false);
  const [assignCourseId, setAssignCourseId] = useState('');
  const [assignStaffIds, setAssignStaffIds] = useState<string[]>([]);
  const [assignDueDate, setAssignDueDate] = useState('');
  const [assigning, setAssigning] = useState(false);


  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tab === 'compliance') {
      loadTrainingData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);



  // When selected record changes, load their timeline & documents
  useEffect(() => {
    if (selectedReferral) {
      loadActivities({ referralId: selectedReferral.id });
      loadDocuments('referral', selectedReferral.id);
    } else if (selectedParticipant) {
      loadActivities({ participantId: selectedParticipant.id });
      loadDocuments('participant', selectedParticipant.id);
    } else if (selectedStaff) {
      loadDocuments('staff', selectedStaff.id);
    } else {
      setActivities([]);
      setDocuments([]);
      setDrawerTab('overview');
    }
  }, [selectedReferral, selectedParticipant, selectedStaff]);

  async function checkAuth() {
    try {
      const res = await fetch('/api/admin/auth');
      const data = await res.json();
      if (data.authenticated) {
        setIsAuth(true);
        loadAllData();
      } else {
        setIsAuth(false);
        setLoading(false);
      }
    } catch {
      setIsAuth(false);
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!adminKey.trim()) {
      setAuthError('Please enter the Admin Access Key.');
      return;
    }
    setAuthSubmitting(true);
    setAuthError('');
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminKey.trim() })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setIsAuth(true);
        setAuthError('');
        loadAllData();
      } else {
        setAuthError(data.message || 'Incorrect Admin Access Key.');
      }
    } catch {
      setAuthError('Failed to connect to authentication service.');
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' });
    } catch {}
    setIsAuth(false);
    setReferrals([]);
    setParticipants([]);
    setStaff([]);
  }

  async function loadAllData() {
    setLoading(true);
    try {
      const [refRes, partRes, staffRes] = await Promise.all([
        fetch('/api/referral'),
        fetch('/api/crm/participants'),
        fetch('/api/crm/staff'),
      ]);
      if (refRes.ok) setReferrals(await refRes.json());
      if (partRes.ok) setParticipants(await partRes.json());
      if (staffRes.ok) setStaff(await staffRes.json());
    } catch (err) {
      console.error('Failed to load CRM data', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadActivities(params: { referralId?: string; participantId?: string }) {
    setActivitiesLoading(true);
    try {
      const query = params.referralId
        ? `referralId=${encodeURIComponent(params.referralId)}`
        : `participantId=${encodeURIComponent(params.participantId || '')}`;
      const res = await fetch(`/api/crm/activities?${query}`);
      if (res.ok) {
        setActivities(await res.json());
      }
    } catch (err) {
      console.error('Failed to load activities', err);
    } finally {
      setActivitiesLoading(false);
    }
  }

  async function loadDocuments(ownerType: string, ownerId: string) {
    setDocsLoading(true);
    try {
      const res = await fetch(`/api/crm/documents?ownerType=${ownerType}&ownerId=${encodeURIComponent(ownerId)}`);
      if (res.ok) {
        setDocuments(await res.json());
      }
    } catch (err) {
      console.error('Failed to load documents', err);
    } finally {
      setDocsLoading(false);
    }
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    setNoteSaving(true);
    try {
      const body: any = {
        activityType: newNoteType,
        title: `${newNoteType.toUpperCase()}: ${newNoteText.trim().slice(0, 40)}...`,
        description: newNoteText.trim(),
        authorName: 'Opus Admin',
      };
      if (selectedReferral) body.referralId = selectedReferral.id;
      if (selectedParticipant) body.participantId = selectedParticipant.id;

      const res = await fetch('/api/crm/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setNewNoteText('');
        if (selectedReferral) loadActivities({ referralId: selectedReferral.id });
        if (selectedParticipant) loadActivities({ participantId: selectedParticipant.id });
      }
    } catch (err) {
      console.error('Failed to add note', err);
    } finally {
      setNoteSaving(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const ownerType = selectedReferral ? 'referral' : selectedParticipant ? 'participant' : selectedStaff ? 'staff' : '';
    const ownerId = selectedReferral?.id || selectedParticipant?.id || selectedStaff?.id || '';
    if (!ownerType || !ownerId) return;

    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('ownerType', ownerType);
      formData.append('ownerId', ownerId);
      formData.append('category', uploadCategory);
      formData.append('expiryDate', uploadExpiry);
      formData.append('notes', uploadNotes);
      formData.append('uploadedBy', 'Opus Admin');

      const res = await fetch('/api/crm/documents', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setUploadNotes('');
        setUploadExpiry('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        loadDocuments(ownerType, ownerId);
        setStatusNotice(`Document "${file.name}" securely stored in vault.`);
        setTimeout(() => setStatusNotice(''), 4000);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to upload document');
      }
    } catch (err) {
      console.error('Failed to upload file', err);
      alert('Upload error');
    } finally {
      setUploadingDoc(false);
    }
  }

  async function handleConvertToParticipant(referral: Referral) {
    if (!confirm(`Convert referral "${referral.participantName}" to active NDIS Participant?`)) return;

    setConverting(true);
    try {
      const res = await fetch('/api/crm/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralId: referral.id })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setStatusNotice(`Referral successfully converted to Participant (${data.participant.name})!`);
        loadAllData();
        setSelectedReferral(null);
        setTab('participants');
        setTimeout(() => setStatusNotice(''), 5000);
      } else {
        alert(data.error || 'Failed to convert referral');
      }
    } catch (err) {
      console.error('Failed conversion', err);
      alert('Network error during conversion');
    } finally {
      setConverting(false);
    }
  }


  async function loadTrainingData() {
    setTrainingLoading(true);
    try {
      const [coursesRes, assignRes] = await Promise.all([
        fetch('/api/training/courses?active=false'),
        fetch('/api/training/assignments'),
      ]);
      if (coursesRes.ok) setTrainingCourses(await coursesRes.json());
      if (assignRes.ok) {
        const assignments: TrainingAssignment[] = await assignRes.json();
        setTrainingAssignments(assignments);
      }
      // Load completions for compliance map (per staff)
      const compRes = await fetch('/api/training/completions');
      if (compRes.ok) {
        const completions: TrainingCompletion[] = await compRes.json();
        const map: Record<string, TrainingCompletion[]> = {};
        completions.forEach((c) => {
          if (!map[c.staff_id]) map[c.staff_id] = [];
          map[c.staff_id].push(c);
        });
        setTrainingComplianceMap(map);
      }
    } catch (err) {
      console.error('Failed to load training data', err);
    } finally {
      setTrainingLoading(false);
    }
  }

  async function handleCreateCourse(e: React.FormEvent) {
    e.preventDefault();
    setSavingCourse(true);
    try {
      const body = {
        ...newCourse,
        validity_months: newCourse.validity_months ? Number(newCourse.validity_months) : null,
        max_attempts: newCourse.max_attempts ? Number(newCourse.max_attempts) : null,
        quiz_questions: newCourse.course_type === 'read_quiz' ? newCourse.quiz_questions : null,
      };
      const res = await fetch('/api/training/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setShowCourseForm(false);
        setNewCourse({ title: '', description: '', course_type: 'read_acknowledge', material_type: 'none',
          material_url: '', pass_mark_pct: 80, validity_months: '', is_mandatory: false,
          certificate_enabled: true, max_attempts: '', quiz_questions: [] });
        loadTrainingData();
        setStatusNotice('Course created successfully.');
        setTimeout(() => setStatusNotice(''), 4000);
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to create course');
      }
    } catch (err) {
      console.error('Create course error:', err);
    } finally {
      setSavingCourse(false);
    }
  }

  async function handleAssignCourse(e: React.FormEvent) {
    e.preventDefault();
    if (!assignCourseId || assignStaffIds.length === 0) {
      alert('Select a course and at least one staff member.');
      return;
    }
    setAssigning(true);
    try {
      const res = await fetch('/api/training/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: assignCourseId, staff_id: assignStaffIds, due_date: assignDueDate || null }),
      });
      if (res.ok) {
        loadTrainingData();
        setStatusNotice(`Course assigned to ${assignStaffIds.length} worker(s).`);
        setTimeout(() => setStatusNotice(''), 4000);
        setAssignStaffIds([]);
        setAssignDueDate('');
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to assign course');
      }
    } catch (err) {
      console.error('Assign error:', err);
    } finally {
      setAssigning(false);
    }
  }

  // Compute compliance status for a staff member + course
  function getTrainingStatus(staffId: string, courseId: string, dueDate?: string): {
    label: string; color: string; bg: string;
  } {
    const completions = trainingComplianceMap[staffId] ?? [];
    const c = completions.find((x) => x.course_id === courseId);
    const now = new Date();
    if (c) {
      if (c.expires_at) {
        const exp = new Date(c.expires_at);
        const daysToExp = Math.ceil((exp.getTime() - now.getTime()) / 86400000);
        if (daysToExp < 0) return { label: 'Expired', color: '#DC2626', bg: '#FEE2E2' };
        if (daysToExp <= 30) return { label: 'Expiring Soon', color: '#D97706', bg: '#FEF3C7' };
      }
      return { label: 'Complete', color: '#059669', bg: '#D1FAE5' };
    }
    if (dueDate) {
      const due = new Date(dueDate);
      const daysOverdue = Math.ceil((now.getTime() - due.getTime()) / 86400000);
      if (daysOverdue > 0) return { label: 'Overdue', color: '#DC2626', bg: '#FEE2E2' };
      if (daysOverdue > -7) return { label: 'Due Soon', color: '#D97706', bg: '#FEF3C7' };
    }
    return { label: 'Not Started', color: '#64748B', bg: '#F1F5F9' };
  }


  async function handleStatusChange(id: string, newStatus: Referral['status']) {
    try {
      const res = await fetch('/api/referral', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      if (res.ok) {
        setReferrals(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
        if (selectedReferral && selectedReferral.id === id) {
          setSelectedReferral({ ...selectedReferral, status: newStatus });
        }
      }
    } catch (err) {
      console.error('Failed to update status', err);
    }
  }

  // Calculate dynamic metrics for IDURAR widgets
  const countNew = referrals.filter(r => r.status === 'new').length;
  const countContacted = referrals.filter(r => r.status === 'contacted').length;
  const countAssessment = referrals.filter(r => r.status === 'assessment').length;
  const countAgreements = referrals.filter(r => r.status === 'agreement_sent').length;
  const countActive = referrals.filter(r => r.status === 'accepted').length;

  const totalRefs = referrals.length || 1;
  const pctNew = Math.round((countNew / totalRefs) * 100) || 25;
  const pctContacted = Math.round((countContacted / totalRefs) * 100) || 25;
  const pctAssessment = Math.round((countAssessment / totalRefs) * 100) || 20;
  const pctAgreements = Math.round((countAgreements / totalRefs) * 100) || 15;
  const pctActive = Math.round((countActive / totalRefs) * 100) || 15;

  // Filtered referrals
  const filteredReferrals = referrals.filter(r => {
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      r.participantName?.toLowerCase().includes(q) ||
      r.name?.toLowerCase().includes(q) ||
      r.suburb?.toLowerCase().includes(q) ||
      r.funding?.toLowerCase().includes(q) ||
      r.referenceNumber?.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const filteredParticipants = participants.filter(p => {
    const q = searchQuery.toLowerCase();
    return !q ||
      p.name?.toLowerCase().includes(q) ||
      p.ndisNumber?.toLowerCase().includes(q) ||
      p.suburb?.toLowerCase().includes(q) ||
      p.planManager?.toLowerCase().includes(q) ||
      p.workerAssigned?.toLowerCase().includes(q);
  });

  const filteredStaff = staff.filter(s => {
    const q = searchQuery.toLowerCase();
    return !q ||
      s.name?.toLowerCase().includes(q) ||
      s.role?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.suburbs?.some(sub => sub.toLowerCase().includes(q));
  });

  // Circular gauge calculations
  const gaugePercent = 85;
  const strokeDashoffset = 314 - (314 * gaugePercent) / 100;

  if (isAuth === null) {
    return (
      <div className="crmLoginWrap">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <RefreshCw size={28} className="spin" style={{ color: '#0284C7' }} />
          <span style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 600 }}>
            Verifying Opus Admin Security Session...
          </span>
        </div>
      </div>
    );
  }

  if (isAuth === false) {
    return (
      <div className="crmLoginWrap">
        <div className="crmLoginCard">
          <div className="crmLoginBrand">
            <span className="crmLoginBadge">
              <Shield size={14} /> Operations Security Gate
            </span>
            <h1 className="crmLoginTitle">Opus Care CRM/ERP</h1>
            <p className="crmLoginSub">
              Enter authorized administrator access key to open the operations management dashboard.
            </p>
          </div>

          <form onSubmit={handleLogin} className="crmLoginForm">
            {authError && (
              <div className="crmLoginError">
                <AlertCircle size={16} />
                <span>{authError}</span>
              </div>
            )}

            <div className="crmLoginField">
              <label htmlFor="adminKey">Admin Access Key</label>
              <div className="crmInputWithIcon">
                <Lock size={16} className="crmFieldIcon" />
                <input
                  id="adminKey"
                  type="password"
                  placeholder="Enter Opus Admin Key..."
                  value={adminKey}
                  onChange={(e) => {
                    setAdminKey(e.target.value);
                    if (authError) setAuthError('');
                  }}
                  className="crmKeyInput"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authSubmitting}
              className="crmLoginSubmitBtn"
            >
              {authSubmitting ? (
                <>
                  <RefreshCw size={16} className="spin" />
                  <span>Verifying Key...</span>
                </>
              ) : (
                <>
                  <span>Unlock Admin CRM</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="crmLoginFooter">
            <Link href="/" className="crmBackHomeLink">
              ← Return to Public Website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="crmAppContainer">
      {/* Permanent Left Sidebar (IDURAR Style) */}
      <aside className={`crmSidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <Link href="/" className="crmSidebarHeader" title="Return to Opus Care Home">
          <div className="crmBrandCrest">
            <Shield size={20} />
          </div>
          {!sidebarCollapsed && (
            <div className="crmBrandMeta">
              <span className="crmBrandMetaTitle">OPUS CARE</span>
              <span className="crmBrandMetaSub">CRM / ERP</span>
            </div>
          )}
        </Link>

        {/* Sidebar Navigation */}
        <nav className="crmSidebarNav">
          <button
            onClick={() => setTab('dashboard')}
            className={`crmNavItem ${tab === 'dashboard' ? 'active' : ''}`}
            title="Dashboard Overview"
          >
            <LayoutDashboard size={18} />
            {!sidebarCollapsed && <span>Dashboard</span>}
          </button>

          <button
            onClick={() => setTab('referrals')}
            className={`crmNavItem ${tab === 'referrals' ? 'active' : ''}`}
            title="Inbound Referrals & Leads"
          >
            <UserPlus size={18} />
            {!sidebarCollapsed && <span>Referrals</span>}
            {!sidebarCollapsed && countNew > 0 && (
              <span className="crmNavBadge">{countNew}</span>
            )}
          </button>

          <button
            onClick={() => setTab('agreements')}
            className={`crmNavItem ${tab === 'agreements' ? 'active' : ''}`}
            title="Service Agreements & Offers"
          >
            <FileText size={18} />
            {!sidebarCollapsed && <span>Agreements</span>}
          </button>

          <button
            onClick={() => setTab('participants')}
            className={`crmNavItem ${tab === 'participants' ? 'active' : ''}`}
            title="Participants & Customers"
          >
            <Users size={18} />
            {!sidebarCollapsed && <span>Participants</span>}
            {!sidebarCollapsed && (
              <span className="crmNavCountPill">{participants.length}</span>
            )}
          </button>

          <button
            onClick={() => setTab('invoicing')}
            className={`crmNavItem ${tab === 'invoicing' ? 'active' : ''}`}
            title="Invoicing & PACE Claims"
          >
            <Receipt size={18} />
            {!sidebarCollapsed && <span>Invoicing</span>}
          </button>

          <button
            onClick={() => setTab('quotes')}
            className={`crmNavItem ${tab === 'quotes' ? 'active' : ''}`}
            title="Quotes & Service Plans"
          >
            <Calculator size={18} />
            {!sidebarCollapsed && <span>Quotes</span>}
          </button>

          <button
            onClick={() => setTab('staff')}
            className={`crmNavItem ${tab === 'staff' ? 'active' : ''}`}
            title="Support Workers & Clearances"
          >
            <UserCheck size={18} />
            {!sidebarCollapsed && <span>Workers</span>}
            {!sidebarCollapsed && (
              <span className="crmNavCountPill">{staff.length}</span>
            )}
          </button>

          <button
            onClick={() => setTab('compliance')}
            className={`crmNavItem ${tab === 'compliance' ? 'active' : ''}`}
            title="Compliance & Audit Register"
          >
            <GraduationCap size={18} />
            {!sidebarCollapsed && <span>Training</span>}
          </button>

          <button
            onClick={() => setTab('settings')}
            className={`crmNavItem ${tab === 'settings' ? 'active' : ''}`}
            title="Settings & System Diagnostics"
          >
            <Settings size={18} />
            {!sidebarCollapsed && <span>Settings</span>}
          </button>
        </nav>

        {/* Sidebar Footer with Collapse Toggle */}
        <div className="crmSidebarFooter">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="crmCollapseBtn"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
          {!sidebarCollapsed && (
            <span className="crmVersionTag">v2.4 Enterprise</span>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="crmMainWrapper">
        {/* Top Header Bar */}
        <header className="crmTopBar">
          <div className="crmTopBarLeft">
            <div>
              <div className="crmBreadcrumb">
                Opus Operations / {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </div>
              <h1 className="crmPageTitle">
                {tab === 'dashboard' && 'Operations Overview'}
                {tab === 'referrals' && 'Referrals & Intake Pipeline'}
                {tab === 'agreements' && 'Service Agreements & Onboarding'}
                {tab === 'participants' && 'Participants 360° Directory'}
                {tab === 'invoicing' && 'NDIS PACE Invoicing & Line Items'}
                {tab === 'quotes' && 'Quotes & Budget Estimator'}
                {tab === 'staff' && 'Support Workers & Compliance Register'}
                {tab === 'compliance' && 'NDIS Practice Standards & Safeguards'}
                {tab === 'settings' && 'System Health & Security Gate'}
              </h1>
            </div>
          </div>

          <div className="crmTopBarRight">
            <div className="crmLiveSyncPill" title="Connected to Supabase Sydney (ap-southeast-2)">
              <span className="crmLiveDot" />
              <span>Supabase Live</span>
            </div>

            <div className="crmRegionPill">
              <span>🇦🇺</span>
              <span>English (NDIS)</span>
            </div>

            <div className="crmUserPill">
              <div className="crmUserAvatar">OA</div>
              <span>Opus Admin</span>
            </div>

            <button
              onClick={handleLogout}
              className="crmTopSignOutBtn"
              title="Sign Out of Operations CRM"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Status Notice Banner */}
        {statusNotice && (
          <div style={{
            background: '#ECFDF5',
            color: '#065F46',
            borderBottom: '1px solid #A7F3D0',
            padding: '10px 32px',
            fontSize: '0.85rem',
            fontWeight: 600
          }}>
            {statusNotice}
          </div>
        )}

        {/* Main Body */}
        <main className="crmBody">
          {/* TAB 0: DASHBOARD (IDURAR STYLE) */}
          {tab === 'dashboard' && (
            <div>
              {/* Row 1: Top 4 KPI Metric Cards */}
              <div className="crmIdurarCardsGrid">
                {/* Card 1: Invoicing */}
                <div className="crmIdurarCard" onClick={() => setTab('invoicing')} style={{ cursor: 'pointer' }}>
                  <h3 className="crmIdurarCardTitle">Invoice</h3>
                  <div className="crmIdurarCardBottom">
                    <span className="crmIdurarCardSub">This Month</span>
                    <span className="crmIdurarPill teal">$ 48,250.00</span>
                  </div>
                </div>

                {/* Card 2: Intake Leads */}
                <div className="crmIdurarCard" onClick={() => setTab('referrals')} style={{ cursor: 'pointer' }}>
                  <h3 className="crmIdurarCardTitle">Quote / Leads</h3>
                  <div className="crmIdurarCardBottom">
                    <span className="crmIdurarCardSub">This Month</span>
                    <span className="crmIdurarPill purple">{referrals.length} Referrals</span>
                  </div>
                </div>

                {/* Card 3: Delivered Hours */}
                <div className="crmIdurarCard" onClick={() => setTab('participants')} style={{ cursor: 'pointer' }}>
                  <h3 className="crmIdurarCardTitle">Payment / Hours</h3>
                  <div className="crmIdurarCardBottom">
                    <span className="crmIdurarCardSub">This Month</span>
                    <span className="crmIdurarPill green">1,850.00 hrs</span>
                  </div>
                </div>

                {/* Card 4: Action Items */}
                <div className="crmIdurarCard" onClick={() => setTab('referrals')} style={{ cursor: 'pointer' }}>
                  <h3 className="crmIdurarCardTitle">Due Balance</h3>
                  <div className="crmIdurarCardBottom">
                    <span className="crmIdurarCardSub">Action Needed</span>
                    <span className="crmIdurarPill coral">{countNew} Pending</span>
                  </div>
                </div>
              </div>

              {/* Row 2: IDURAR Previews Grid (3 Previews + 1 Donut Gauge) */}
              <div className="crmIdurarPreviewGrid">
                {/* 3 Status Columns in One Multi-Card */}
                <div className="crmPreviewMultiCard">
                  {/* Column 1: Invoices / Referrals Preview */}
                  <div className="crmPreviewColumn">
                    <h4 className="crmPreviewColumnTitle">Referrals Preview</h4>
                    <div className="crmPreviewList">
                      <div className="crmPreviewRow">
                        <div className="crmPreviewRowMeta">
                          <span className="crmPreviewLabel">New Intake</span>
                          <span className="crmPreviewPct">{pctNew}%</span>
                        </div>
                        <div className="crmProgressBarTrack">
                          <div className="crmProgressBarFill slate" style={{ width: `${pctNew}%` }} />
                        </div>
                      </div>

                      <div className="crmPreviewRow">
                        <div className="crmPreviewRowMeta">
                          <span className="crmPreviewLabel">Contacted</span>
                          <span className="crmPreviewPct">{pctContacted}%</span>
                        </div>
                        <div className="crmProgressBarTrack">
                          <div className="crmProgressBarFill amber" style={{ width: `${pctContacted}%` }} />
                        </div>
                      </div>

                      <div className="crmPreviewRow">
                        <div className="crmPreviewRowMeta">
                          <span className="crmPreviewLabel">Assessment</span>
                          <span className="crmPreviewPct">{pctAssessment}%</span>
                        </div>
                        <div className="crmProgressBarTrack">
                          <div className="crmProgressBarFill blue" style={{ width: `${pctAssessment}%` }} />
                        </div>
                      </div>

                      <div className="crmPreviewRow">
                        <div className="crmPreviewRowMeta">
                          <span className="crmPreviewLabel">Agreement Sent</span>
                          <span className="crmPreviewPct">{pctAgreements}%</span>
                        </div>
                        <div className="crmProgressBarTrack">
                          <div className="crmProgressBarFill teal" style={{ width: `${pctAgreements}%` }} />
                        </div>
                      </div>

                      <div className="crmPreviewRow">
                        <div className="crmPreviewRowMeta">
                          <span className="crmPreviewLabel">Active / Enrolled</span>
                          <span className="crmPreviewPct">{pctActive}%</span>
                        </div>
                        <div className="crmProgressBarTrack">
                          <div className="crmProgressBarFill green" style={{ width: `${pctActive}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Service Agreements Preview */}
                  <div className="crmPreviewColumn">
                    <h4 className="crmPreviewColumnTitle">Quotes Preview</h4>
                    <div className="crmPreviewList">
                      <div className="crmPreviewRow">
                        <div className="crmPreviewRowMeta">
                          <span className="crmPreviewLabel">Draft</span>
                          <span className="crmPreviewPct">25%</span>
                        </div>
                        <div className="crmProgressBarTrack">
                          <div className="crmProgressBarFill slate" style={{ width: '25%' }} />
                        </div>
                      </div>

                      <div className="crmPreviewRow">
                        <div className="crmPreviewRowMeta">
                          <span className="crmPreviewLabel">Pending Review</span>
                          <span className="crmPreviewPct">20%</span>
                        </div>
                        <div className="crmProgressBarTrack">
                          <div className="crmProgressBarFill amber" style={{ width: '20%' }} />
                        </div>
                      </div>

                      <div className="crmPreviewRow">
                        <div className="crmPreviewRowMeta">
                          <span className="crmPreviewLabel">Sent to Client</span>
                          <span className="crmPreviewPct">40%</span>
                        </div>
                        <div className="crmProgressBarTrack">
                          <div className="crmProgressBarFill blue" style={{ width: '40%' }} />
                        </div>
                      </div>

                      <div className="crmPreviewRow">
                        <div className="crmPreviewRowMeta">
                          <span className="crmPreviewLabel">Declined</span>
                          <span className="crmPreviewPct">0%</span>
                        </div>
                        <div className="crmProgressBarTrack">
                          <div className="crmProgressBarFill coral" style={{ width: '0%' }} />
                        </div>
                      </div>

                      <div className="crmPreviewRow">
                        <div className="crmPreviewRowMeta">
                          <span className="crmPreviewLabel">Accepted</span>
                          <span className="crmPreviewPct">15%</span>
                        </div>
                        <div className="crmProgressBarTrack">
                          <div className="crmProgressBarFill green" style={{ width: '15%' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Column 3: Worker Compliance Preview */}
                  <div className="crmPreviewColumn">
                    <h4 className="crmPreviewColumnTitle">Offers Preview</h4>
                    <div className="crmPreviewList">
                      <div className="crmPreviewRow">
                        <div className="crmPreviewRowMeta">
                          <span className="crmPreviewLabel">NDIS Screening</span>
                          <span className="crmPreviewPct">100%</span>
                        </div>
                        <div className="crmProgressBarTrack">
                          <div className="crmProgressBarFill green" style={{ width: '100%' }} />
                        </div>
                      </div>

                      <div className="crmPreviewRow">
                        <div className="crmPreviewRowMeta">
                          <span className="crmPreviewLabel">WWCC Verified</span>
                          <span className="crmPreviewPct">100%</span>
                        </div>
                        <div className="crmProgressBarTrack">
                          <div className="crmProgressBarFill green" style={{ width: '100%' }} />
                        </div>
                      </div>

                      <div className="crmPreviewRow">
                        <div className="crmPreviewRowMeta">
                          <span className="crmPreviewLabel">First Aid &amp; CPR</span>
                          <span className="crmPreviewPct">90%</span>
                        </div>
                        <div className="crmProgressBarTrack">
                          <div className="crmProgressBarFill blue" style={{ width: '90%' }} />
                        </div>
                      </div>

                      <div className="crmPreviewRow">
                        <div className="crmPreviewRowMeta">
                          <span className="crmPreviewLabel">Police Clearance</span>
                          <span className="crmPreviewPct">100%</span>
                        </div>
                        <div className="crmProgressBarTrack">
                          <div className="crmProgressBarFill green" style={{ width: '100%' }} />
                        </div>
                      </div>

                      <div className="crmPreviewRow">
                        <div className="crmPreviewRowMeta">
                          <span className="crmPreviewLabel">Fully Compliant</span>
                          <span className="crmPreviewPct">95%</span>
                        </div>
                        <div className="crmProgressBarTrack">
                          <div className="crmProgressBarFill green" style={{ width: '95%' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Circular Gauge Card (Right) */}
                <div className="crmGaugeCard">
                  <h4 className="crmGaugeTitle">Customer Preview</h4>
                  <div className="crmGaugeSvgWrap">
                    <svg width="130" height="130" viewBox="0 0 120 120">
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        stroke="#EEF2F6"
                        strokeWidth="10"
                        fill="none"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        stroke="#0284C7"
                        strokeWidth="10"
                        fill="none"
                        strokeDasharray="314"
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        transform="rotate(-90 60 60)"
                        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                      />
                    </svg>
                    <span className="crmGaugeNumber">{gaugePercent}%</span>
                  </div>
                  <span className="crmGaugeSubtitle">New Customer This Month</span>
                  <div className="crmGaugeGrowth">
                    <TrendingUp size={14} />
                    <span>Active Customer &uarr; 45.00%</span>
                  </div>
                </div>
              </div>

              {/* Row 3: Quick Actions & Live Feed */}
              <div className="crmDashboardLowerGrid">
                {/* Fast Action Shortcuts */}
                <div className="crmCardSection">
                  <h3 className="crmSectionTitle">
                    <Sparkles size={16} style={{ color: '#0284C7' }} />
                    <span>Quick Operations Actions</span>
                  </h3>
                  <div className="crmQuickActionsGrid">
                    <button
                      onClick={() => setTab('referrals')}
                      className="crmQuickActionBtn"
                    >
                      <div className="crmQuickActionIconWrap">
                        <UserPlus size={18} />
                      </div>
                      <div>
                        <div>New Intake Referral</div>
                        <small style={{ color: '#64748B', fontWeight: 400 }}>Review incoming submissions</small>
                      </div>
                    </button>

                    <button
                      onClick={() => setTab('agreements')}
                      className="crmQuickActionBtn"
                    >
                      <div className="crmQuickActionIconWrap">
                        <FileText size={18} />
                      </div>
                      <div>
                        <div>Create Service Agreement</div>
                        <small style={{ color: '#64748B', fontWeight: 400 }}>Pre-fill NDIS 2024/25 rates</small>
                      </div>
                    </button>

                    <button
                      onClick={() => setTab('staff')}
                      className="crmQuickActionBtn"
                    >
                      <div className="crmQuickActionIconWrap">
                        <UserCheck size={18} />
                      </div>
                      <div>
                        <div>Verify Worker Clearance</div>
                        <small style={{ color: '#64748B', fontWeight: 400 }}>NWSC, WWCC &amp; First Aid</small>
                      </div>
                    </button>

                    <button
                      onClick={() => setTab('invoicing')}
                      className="crmQuickActionBtn"
                    >
                      <div className="crmQuickActionIconWrap">
                        <Receipt size={18} />
                      </div>
                      <div>
                        <div>Generate PACE Claim</div>
                        <small style={{ color: '#64748B', fontWeight: 400 }}>Export line items batch</small>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Live Activity Stream */}
                <div className="crmCardSection">
                  <h3 className="crmSectionTitle">
                    <History size={16} style={{ color: '#0284C7' }} />
                    <span>Operations Timeline</span>
                  </h3>
                  <div className="crmLiveFeedList">
                    <div className="crmLiveFeedItem">
                      <div className="crmFeedIconBadge">
                        <CheckCircle2 size={14} style={{ color: '#10B981' }} />
                      </div>
                      <div className="crmFeedContent">
                        <p className="crmFeedTitle">Supabase Sydney Connected</p>
                        <span className="crmFeedTime">Cloud database active • ap-southeast-2</span>
                      </div>
                    </div>

                    <div className="crmLiveFeedItem">
                      <div className="crmFeedIconBadge">
                        <FolderLock size={14} style={{ color: '#0284C7' }} />
                      </div>
                      <div className="crmFeedContent">
                        <p className="crmFeedTitle">Document Vault Ready</p>
                        <span className="crmFeedTime">AES-256 private bucket crm-documents</span>
                      </div>
                    </div>

                    <div className="crmLiveFeedItem">
                      <div className="crmFeedIconBadge">
                        <Mail size={14} style={{ color: '#F59E0B' }} />
                      </div>
                      <div className="crmFeedContent">
                        <p className="crmFeedTitle">Resend Inbound Webhook</p>
                        <span className="crmFeedTime">Forwarding to owner email active</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: REFERRALS PIPELINE */}
          {tab === 'referrals' && (
            <div className="crmTabPanel">
              <div className="crmPanelHeader">
                <div>
                  <h2 className="crmPanelTitle">Referrals &amp; Intake Pipeline</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                    Track incoming NDIS participant referrals through the stages of intake, assessment, and agreement signing.
                  </p>
                </div>
                <div className="crmViewToggleGroup">
                  <button
                    onClick={() => setViewMode('pipeline')}
                    className={`crmViewToggleBtn ${viewMode === 'pipeline' ? 'active' : ''}`}
                  >
                    <Columns size={15} />
                    <span>Kanban</span>
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`crmViewToggleBtn ${viewMode === 'table' ? 'active' : ''}`}
                  >
                    <List size={15} />
                    <span>Table</span>
                  </button>
                </div>
              </div>

              {/* Filter Toolbar */}
              <div className="crmToolbar">
                <div className="crmSearchWrap">
                  <Search size={15} className="crmSearchIcon" />
                  <input
                    type="text"
                    placeholder="Search by participant, referrer, suburb, funding..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="crmSearchInput"
                  />
                </div>

                <div className="crmFilterGroup">
                  <Filter size={15} />
                  <span>Stage:</span>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="crmSelect"
                  >
                    <option value="all">All Stages ({referrals.length})</option>
                    <option value="new">New Inbound ({countNew})</option>
                    <option value="contacted">Contacted ({countContacted})</option>
                    <option value="assessment">Assessment ({countAssessment})</option>
                    <option value="agreement_sent">Agreement Sent ({countAgreements})</option>
                    <option value="accepted">Active / Enrolled ({countActive})</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748B' }}>
                  <RefreshCw size={24} className="spin" style={{ margin: '0 auto 12px', display: 'block', color: '#0284C7' }} />
                  <span>Loading live referrals from Supabase...</span>
                </div>
              ) : viewMode === 'pipeline' ? (
                /* KANBAN BOARD */
                <div className="crmKanbanContainer">
                  {PIPELINE_STAGES.map((col) => {
                    const colReferrals = filteredReferrals.filter(r => r.status === col.id);
                    return (
                      <div key={col.id} className="crmKanbanCol">
                        <div className="crmKanbanColHeader">
                          <div className="crmKanbanColTitle">
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                            <span>{col.label}</span>
                          </div>
                          <span
                            className="crmKanbanBadge"
                            style={{ background: col.bg, color: col.color }}
                          >
                            {colReferrals.length}
                          </span>
                        </div>

                        <div className="crmKanbanCardsList">
                          {colReferrals.map((item) => (
                            <div
                              key={item.id}
                              className="crmKanbanCard"
                              onClick={() => setSelectedReferral(item)}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                                <strong style={{ fontSize: '0.92rem', color: '#0F172A' }}>
                                  {item.participantName}
                                </strong>
                                <span className="refIdTag">
                                  {item.referenceNumber || `#${item.id.slice(0, 6)}`}
                                </span>
                              </div>

                              <div style={{ fontSize: '0.8rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                                <MapPin size={12} />
                                <span>{item.suburb || 'Northern Rivers'}</span>
                                <span style={{ margin: '0 4px' }}>&bull;</span>
                                <span style={{ color: '#15803D', fontWeight: 600 }}>{item.funding}</span>
                              </div>

                              <div style={{ fontSize: '0.78rem', color: '#475569', background: '#F8FAFC', padding: '6px 8px', borderRadius: 6, marginBottom: 8 }}>
                                <strong>Services:</strong> {item.services || 'General Support'}
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#94A3B8' }}>
                                <span>Ref: {item.name}</span>
                                <span>{new Date(item.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</span>
                              </div>
                            </div>
                          ))}

                          {colReferrals.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '30px 10px', color: '#94A3B8', fontSize: '0.8rem' }}>
                              No referrals in this stage
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* TABLE VIEW */
                <div className="crmTableWrapper">
                  <table className="crmTable">
                    <thead>
                      <tr>
                        <th>Reference</th>
                        <th>Participant</th>
                        <th>Location</th>
                        <th>Funding</th>
                        <th>Referrer</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReferrals.map((r) => (
                        <tr key={r.id} className={r.status === 'new' ? 'rowNew' : ''}>
                          <td>
                            <span className="refIdTag">
                              {r.referenceNumber || `#${r.id.slice(0, 6)}`}
                            </span>
                            <span className="refDate">
                              {new Date(r.createdAt).toLocaleDateString('en-AU')}
                            </span>
                          </td>
                          <td>
                            <strong className="partName">{r.participantName}</strong>
                            <span className="servicesSnippet">{r.services}</span>
                          </td>
                          <td>
                            <span className="suburbBadge">
                              <MapPin size={12} />
                              {r.suburb || 'Northern Rivers'}
                            </span>
                          </td>
                          <td>
                            <span className="fundingPillMini">{r.funding}</span>
                          </td>
                          <td>
                            <div>{r.name}</div>
                            <div className="refContactMini">
                              <a href={`tel:${r.phone}`}>{r.phone}</a>
                            </div>
                          </td>
                          <td>
                            <select
                              value={r.status}
                              onChange={(e) => handleStatusChange(r.id, e.target.value as any)}
                              className={`crmStatusSelect status_${r.status}`}
                            >
                              <option value="new">New Inbound</option>
                              <option value="contacted">Contacted</option>
                              <option value="assessment">Assessment</option>
                              <option value="agreement_sent">Agreement Sent</option>
                              <option value="accepted">Active / Enrolled</option>
                            </select>
                          </td>
                          <td>
                            <button
                              onClick={() => setSelectedReferral(r)}
                              className="crmViewBtn"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SERVICE AGREEMENTS */}
          {tab === 'agreements' && (
            <div className="crmTabPanel">
              <div className="crmPanelHeader">
                <div>
                  <h2 className="crmPanelTitle">Service Agreements &amp; Pricing Arrangements</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                    Generate, track, and execute official NDIS Service Agreements configured with 2024/25 Pricing Schedules.
                  </p>
                </div>
                <button
                  onClick={() => alert('Agreement generator template opened.')}
                  className="headerCtaBtn"
                  style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                >
                  <Plus size={15} /> <span>New Service Agreement</span>
                </button>
              </div>

              {/* Service Agreement Pricing Reference Table */}
              <div className="crmTableWrapper" style={{ marginBottom: 24 }}>
                <table className="crmTable">
                  <thead>
                    <tr>
                      <th>Line Item Code</th>
                      <th>Support Item Description</th>
                      <th>Category</th>
                      <th>NSW / QLD Price Limit</th>
                      <th>Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><span className="refIdTag">01_011_0107_1_1</span></td>
                      <td><strong>Assistance with Self-Care Activities - Standard - Weekday Daytime</strong></td>
                      <td><span className="fundingPillMini">Core Supports</span></td>
                      <td><strong style={{ color: '#0F172A' }}>$67.56</strong></td>
                      <td>Hour</td>
                    </tr>
                    <tr>
                      <td><span className="refIdTag">01_015_0107_1_1</span></td>
                      <td><strong>Assistance with Self-Care Activities - Standard - Weekday Evening</strong></td>
                      <td><span className="fundingPillMini">Core Supports</span></td>
                      <td><strong style={{ color: '#0F172A' }}>$74.44</strong></td>
                      <td>Hour</td>
                    </tr>
                    <tr>
                      <td><span className="refIdTag">01_013_0107_1_1</span></td>
                      <td><strong>Assistance with Self-Care Activities - Saturday</strong></td>
                      <td><span className="fundingPillMini">Core Supports</span></td>
                      <td><strong style={{ color: '#0F172A' }}>$95.07</strong></td>
                      <td>Hour</td>
                    </tr>
                    <tr>
                      <td><span className="refIdTag">01_014_0107_1_1</span></td>
                      <td><strong>Assistance with Self-Care Activities - Sunday</strong></td>
                      <td><span className="fundingPillMini">Core Supports</span></td>
                      <td><strong style={{ color: '#0F172A' }}>$122.59</strong></td>
                      <td>Hour</td>
                    </tr>
                    <tr>
                      <td><span className="refIdTag">04_104_0125_6_1</span></td>
                      <td><strong>Access Community, Social and Rec Activities - Standard - Weekday Daytime</strong></td>
                      <td><span className="fundingPillMini">Capacity Building</span></td>
                      <td><strong style={{ color: '#0F172A' }}>$67.56</strong></td>
                      <td>Hour</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: PARTICIPANTS DIRECTORY */}
          {tab === 'participants' && (
            <div className="crmTabPanel">
              <div className="crmPanelHeader">
                <div>
                  <h2 className="crmPanelTitle">Participants 360° Directory</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                    Comprehensive participant profiles, NDIS numbers, funding models, assigned support workers, and document vault.
                  </p>
                </div>
                <button
                  onClick={() => alert('Add Participant modal: you can also convert any Referral directly.')}
                  className="headerCtaBtn"
                  style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                >
                  <Plus size={15} /> <span>Add Participant</span>
                </button>
              </div>

              <div className="crmTableWrapper">
                <table className="crmTable">
                  <thead>
                    <tr>
                      <th>Participant Name</th>
                      <th>NDIS Number</th>
                      <th>Funding Type</th>
                      <th>Plan Manager</th>
                      <th>Suburb</th>
                      <th>Allocated Hours</th>
                      <th>Support Worker</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredParticipants.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <strong className="partName">{p.name}</strong>
                          <span className="servicesSnippet">{p.primaryService}</span>
                        </td>
                        <td>
                          <span className="refIdTag">{p.ndisNumber}</span>
                        </td>
                        <td>
                          <span className="fundingPillMini">{p.fundingType}</span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.85rem', color: '#475569' }}>{p.planManager || 'Self-Managed'}</span>
                        </td>
                        <td>
                          <span className="suburbBadge"><MapPin size={12} /> {p.suburb}</span>
                        </td>
                        <td>
                          <strong style={{ color: '#0F172A' }}>{p.allocatedHours || 15} hrs/wk</strong>
                        </td>
                        <td>
                          <span className="workerPill"><UserCheck size={14} /> {p.workerAssigned || 'Unassigned'}</span>
                        </td>
                        <td>
                          <button
                            onClick={() => setSelectedParticipant(p)}
                            className="crmViewBtn"
                          >
                            Profile &amp; Vault
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredParticipants.length === 0 && (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                          No participant records found. Convert referrals to populate this directory.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: INVOICING & PACE CLAIMS */}
          {tab === 'invoicing' && (
            <div className="crmTabPanel">
              <div className="crmPanelHeader">
                <div>
                  <h2 className="crmPanelTitle">NDIS PACE Invoicing &amp; Line Items</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                    Generate compliant NDIS tax invoices with verified support catalogue line items ready for Plan Managers or PACE self-claims.
                  </p>
                </div>
                <button
                  onClick={() => alert('Batch export CSV generated.')}
                  className="crmViewBtn"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <FileSpreadsheet size={15} /> <span>Export PACE Batch</span>
                </button>
              </div>

              <div className="crmIdurarCardsGrid" style={{ marginBottom: 20 }}>
                <div className="crmIdurarCard">
                  <h3 className="crmIdurarCardTitle">Delivered Hours (Sept)</h3>
                  <div className="crmIdurarCardBottom">
                    <span className="crmIdurarCardSub">Total Service Delivered</span>
                    <span className="crmIdurarPill teal">1,850.00 hrs</span>
                  </div>
                </div>
                <div className="crmIdurarCard">
                  <h3 className="crmIdurarCardTitle">Gross Invoiced</h3>
                  <div className="crmIdurarCardBottom">
                    <span className="crmIdurarCardSub">NDIS Rate Limit $67.56/hr</span>
                    <span className="crmIdurarPill green">$ 48,250.00</span>
                  </div>
                </div>
                <div className="crmIdurarCard">
                  <h3 className="crmIdurarCardTitle">Paid Claims</h3>
                  <div className="crmIdurarCardBottom">
                    <span className="crmIdurarCardSub">Processed by Plan Managers</span>
                    <span className="crmIdurarPill green">$ 44,600.00</span>
                  </div>
                </div>
                <div className="crmIdurarCard">
                  <h3 className="crmIdurarCardTitle">Outstanding</h3>
                  <div className="crmIdurarCardBottom">
                    <span className="crmIdurarCardSub">Awaiting remittance</span>
                    <span className="crmIdurarPill coral">$ 3,650.00</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: QUOTES & BUDGETS */}
          {tab === 'quotes' && (
            <div className="crmTabPanel">
              <div className="crmPanelHeader">
                <div>
                  <h2 className="crmPanelTitle">Quotes &amp; Service Plan Estimator</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                    Calculate estimated weekly and annual funding burn rates based on participant support schedules.
                  </p>
                </div>
              </div>
              <div style={{ background: '#F8FAFC', border: '1px solid #EEF2F6', borderRadius: 12, padding: 24 }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '1rem', color: '#0F172A' }}>Service Budget Formula</h4>
                <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.6 }}>
                  NDIS Standard Core Hourly Rate (NSW/QLD Non-Remote): <strong>$67.56 / hr</strong>.<br />
                  For a participant requiring <strong>15 hours / week</strong> of standard weekday assistance:<br />
                  &bull; Weekly Budget: 15 hrs &times; $67.56 = <strong>$1,013.40 / week</strong><br />
                  &bull; 12-Month Plan Budget: 52 weeks &times; $1,013.40 = <strong>$52,696.80</strong>
                </p>
              </div>
            </div>
          )}

          {/* TAB 6: SUPPORT WORKERS & CLEARANCES */}
          {tab === 'staff' && (
            <div className="crmTabPanel">
              <div className="crmPanelHeader">
                <div>
                  <h2 className="crmPanelTitle">Support Workers &amp; Compliance Clearances</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                    Monitor support worker qualifications, NDIS Worker Screening Check (NWSC), WWCC, and First Aid certificates.
                  </p>
                </div>
                <button
                  onClick={() => alert('Worker registration modal')}
                  className="headerCtaBtn"
                  style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                >
                  <Plus size={15} /> <span>Register Support Worker</span>
                </button>
              </div>

              <div className="crmTableWrapper">
                <table className="crmTable">
                  <thead>
                    <tr>
                      <th>Worker Name</th>
                      <th>Role</th>
                      <th>Service Suburbs</th>
                      <th>NDIS Screening (NWSC)</th>
                      <th>WWCC</th>
                      <th>First Aid / CPR</th>
                      <th>Police Check</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStaff.map((s) => (
                      <tr key={s.id}>
                        <td>
                          <strong className="partName">{s.name}</strong>
                          <div className="refContactMini"><a href={`tel:${s.phone}`}>{s.phone}</a></div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>{s.role}</span>
                        </td>
                        <td>
                          <div className="staffSuburbsWrap">
                            {s.suburbs?.map((sub, i) => (
                              <span key={i} className="miniSuburbChip">{sub}</span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <span className="checkPassPill">{s.ndisScreening}</span>
                        </td>
                        <td>
                          <span className="checkPassPill">{s.wwcc}</span>
                        </td>
                        <td>
                          <span className="checkPassPill">{s.firstAid}</span>
                        </td>
                        <td>
                          <span className="checkPassPill">Verified</span>
                        </td>
                        <td>
                          <button
                            onClick={() => setSelectedStaff(s)}
                            className="crmViewBtn"
                          >
                            Clearances
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredStaff.length === 0 && (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                          No support worker records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: TRAINING & COMPLIANCE MANAGEMENT */}
          {tab === 'compliance' && (
            <div className="crmTabPanel">
              <div className="crmPanelHeader">
                <div>
                  <h2 className="crmPanelTitle">Training &amp; Compliance Management</h2>
                  <p style={{ margin:'4px 0 0', fontSize:'0.85rem', color:'#64748B' }}>
                    Create courses, assign to workers, track quiz results and mandatory compliance percentage.
                  </p>
                </div>
                <button onClick={() => { setShowCourseForm(true); setTrainingTab('courses'); }}
                  className="crmViewBtn" style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <BookOpen size={15}/> <span>New Course</span>
                </button>
              </div>

              <div style={{ display:'flex', gap:8, borderBottom:'1px solid #EEF2F6', marginBottom:24 }}>
                {(['courses','assign','external','report'] as const).map(t => (
                  <button key={t} onClick={() => setTrainingTab(t)} style={{
                    padding:'10px 18px', border:'none', background:'none', cursor:'pointer',
                    borderBottom: trainingTab===t ? '2px solid #0284C7' : '2px solid transparent',
                    color: trainingTab===t ? '#0284C7' : '#64748B', fontWeight:600, fontSize:'0.85rem' }}>
                    {t === 'courses' ? 'Course Library' : t === 'assign' ? 'Assign to Staff' : t === 'external' ? 'External Training Library' : 'Compliance Report'}
                  </button>
                ))}
              </div>

              {trainingLoading && <div style={{padding:40,textAlign:'center',color:'#94A3B8'}}>Loading...</div>}

              {!trainingLoading && trainingTab === 'courses' && (
                <>
                  {showCourseForm && (
                    <div style={{background:'#F8FAFC',border:'1px solid #EEF2F6',borderRadius:12,padding:24,marginBottom:24}}>
                      <h3 style={{fontSize:'1rem',fontWeight:700,color:'#0F172A',marginBottom:16}}>New Course</h3>
                      <form onSubmit={handleCreateCourse}>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
                          <div>
                            <label style={{fontSize:'0.8rem',fontWeight:600,color:'#374151',display:'block',marginBottom:4}}>Title *</label>
                            <input value={newCourse.title} onChange={e=>setNewCourse(p=>({...p,title:e.target.value}))}
                              placeholder="e.g. NDIS Code of Conduct" required
                              style={{width:'100%',padding:'8px 12px',border:'1px solid #D1D5DB',borderRadius:6,fontSize:'0.9rem'}}/>
                          </div>
                          <div>
                            <label style={{fontSize:'0.8rem',fontWeight:600,color:'#374151',display:'block',marginBottom:4}}>Type *</label>
                            <select value={newCourse.course_type}
                              onChange={e=>setNewCourse(p=>({...p,course_type:e.target.value as "read_acknowledge"|"read_quiz"|"external_cert"}))}
                              style={{width:'100%',padding:'8px 12px',border:'1px solid #D1D5DB',borderRadius:6,fontSize:'0.9rem'}}>
                              <option value="read_acknowledge">Read &amp; Acknowledge</option>
                              <option value="read_quiz">Read + Quiz</option>
                              <option value="external_cert">External Certificate Upload</option>
                            </select>
                          </div>
                          <div>
                            <label style={{fontSize:'0.8rem',fontWeight:600,color:'#374151',display:'block',marginBottom:4}}>Material</label>
                            <select value={newCourse.material_type} onChange={e=>setNewCourse(p=>({...p,material_type:e.target.value}))}
                              style={{width:'100%',padding:'8px 12px',border:'1px solid #D1D5DB',borderRadius:6,fontSize:'0.9rem'}}>
                              <option value="none">No Material</option>
                              <option value="pdf">PDF</option>
                              <option value="ppt">PowerPoint</option>
                              <option value="link">External Link</option>
                            </select>
                          </div>
                          <div>
                            <label style={{fontSize:'0.8rem',fontWeight:600,color:'#374151',display:'block',marginBottom:4}}>Material URL</label>
                            <input value={newCourse.material_url} onChange={e=>setNewCourse(p=>({...p,material_url:e.target.value}))}
                              placeholder="https://..." type="url"
                              style={{width:'100%',padding:'8px 12px',border:'1px solid #D1D5DB',borderRadius:6,fontSize:'0.9rem'}}/>
                          </div>
                          <div>
                            <label style={{fontSize:'0.8rem',fontWeight:600,color:'#374151',display:'block',marginBottom:4}}>Pass Mark %</label>
                            <input type="number" min="1" max="100" value={newCourse.pass_mark_pct}
                              onChange={e=>setNewCourse(p=>({...p,pass_mark_pct:Number(e.target.value)}))}
                              style={{width:'100%',padding:'8px 12px',border:'1px solid #D1D5DB',borderRadius:6,fontSize:'0.9rem'}}/>
                          </div>
                          <div>
                            <label style={{fontSize:'0.8rem',fontWeight:600,color:'#374151',display:'block',marginBottom:4}}>Validity (months)</label>
                            <input type="number" min="1" value={newCourse.validity_months}
                              onChange={e=>setNewCourse(p=>({...p,validity_months:e.target.value}))} placeholder="blank = no expiry"
                              style={{width:'100%',padding:'8px 12px',border:'1px solid #D1D5DB',borderRadius:6,fontSize:'0.9rem'}}/>
                          </div>
                          <div>
                            <label style={{fontSize:'0.8rem',fontWeight:600,color:'#374151',display:'block',marginBottom:4}}>Max Attempts</label>
                            <input type="number" min="1" value={newCourse.max_attempts}
                              onChange={e=>setNewCourse(p=>({...p,max_attempts:e.target.value}))} placeholder="blank = unlimited"
                              style={{width:'100%',padding:'8px 12px',border:'1px solid #D1D5DB',borderRadius:6,fontSize:'0.9rem'}}/>
                          </div>
                          <div style={{display:'flex',gap:16,alignItems:'center',paddingTop:22}}>
                            <label style={{display:'flex',alignItems:'center',gap:6,fontSize:'0.85rem',cursor:'pointer'}}>
                              <input type="checkbox" checked={newCourse.is_mandatory} onChange={e=>setNewCourse(p=>({...p,is_mandatory:e.target.checked}))}/> Mandatory
                            </label>
                            <label style={{display:'flex',alignItems:'center',gap:6,fontSize:'0.85rem',cursor:'pointer'}}>
                              <input type="checkbox" checked={newCourse.certificate_enabled} onChange={e=>setNewCourse(p=>({...p,certificate_enabled:e.target.checked}))}/> Issue Certificate
                            </label>
                          </div>
                        </div>
                        <div style={{marginBottom:16}}>
                          <label style={{fontSize:'0.8rem',fontWeight:600,color:'#374151',display:'block',marginBottom:4}}>Description</label>
                          <textarea value={newCourse.description} onChange={e=>setNewCourse(p=>({...p,description:e.target.value}))}
                            rows={2} placeholder="Brief course description..."
                            style={{width:'100%',padding:'8px 12px',border:'1px solid #D1D5DB',borderRadius:6,fontSize:'0.9rem',resize:'vertical'}}/>
                        </div>
                        {newCourse.course_type === 'read_quiz' && (
                          <div style={{marginBottom:16}}>
                            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                              <strong style={{fontSize:'0.85rem',color:'#374151'}}>Quiz Questions ({newCourse.quiz_questions.length})</strong>
                              <button type="button" className="crmViewBtn" style={{fontSize:'0.8rem',padding:'4px 12px'}}
                                onClick={()=>setNewCourse(p=>({...p,quiz_questions:[...p.quiz_questions,{question:'',options:['','','',''],correct_index:0}]}))}>
                                + Add Question
                              </button>
                            </div>
                            {newCourse.quiz_questions.map((q,qi)=>(
                              <div key={qi} style={{background:'#fff',border:'1px solid #E2E8F0',borderRadius:8,padding:16,marginBottom:12}}>
                                <div style={{display:'flex',gap:8,marginBottom:8}}>
                                  <span style={{fontWeight:700,color:'#0284C7',minWidth:28}}>Q{qi+1}</span>
                                  <input value={q.question} placeholder="Question..." style={{flex:1,padding:'6px 10px',border:'1px solid #D1D5DB',borderRadius:4,fontSize:'0.88rem'}}
                                    onChange={e=>{const qs=[...newCourse.quiz_questions];qs[qi]={...qs[qi],question:e.target.value};setNewCourse(p=>({...p,quiz_questions:qs}));}}/>
                                  <button type="button" onClick={()=>setNewCourse(p=>({...p,quiz_questions:p.quiz_questions.filter((_,i)=>i!==qi)}))}
                                    style={{border:'none',background:'#FEE2E2',color:'#DC2626',borderRadius:4,padding:'4px 8px',cursor:'pointer'}}>Remove</button>
                                </div>
                                {q.options.map((opt,oi)=>(
                                  <div key={oi} style={{display:'flex',gap:8,alignItems:'center',marginBottom:6,paddingLeft:36}}>
                                    <input type="radio" name={'correct-'+qi} checked={q.correct_index===oi} title="Correct answer"
                                      onChange={()=>{const qs=[...newCourse.quiz_questions];qs[qi]={...qs[qi],correct_index:oi};setNewCourse(p=>({...p,quiz_questions:qs}));}}/>
                                    <input value={opt} placeholder={'Option '+(oi+1)} style={{flex:1,padding:'5px 8px',border:'1px solid #D1D5DB',borderRadius:4,fontSize:'0.85rem'}}
                                      onChange={e=>{const qs=[...newCourse.quiz_questions];const opts=[...qs[qi].options];opts[oi]=e.target.value;qs[qi]={...qs[qi],options:opts};setNewCourse(p=>({...p,quiz_questions:qs}));}}/>
                                    {q.correct_index===oi&&<span style={{fontSize:'0.75rem',color:'#059669',fontWeight:600}}>Correct</span>}
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                        <div style={{display:'flex',gap:10}}>
                          <button type="submit" disabled={savingCourse} className="crmViewBtn" style={{background:'#0284C7',color:'#fff',border:'none'}}>
                            {savingCourse?'Saving...':'Create Course'}
                          </button>
                          <button type="button" onClick={()=>setShowCourseForm(false)} className="crmViewBtn">Cancel</button>
                        </div>
                      </form>
                    </div>
                  )}
                  <div className="crmTableWrapper">
                    <table className="crmTable">
                      <thead><tr><th>Title</th><th>Type</th><th>Material</th><th>Pass Mark</th><th>Validity</th><th>Mandatory</th><th>Status</th></tr></thead>
                      <tbody>
                        {trainingCourses.length===0&&(<tr><td colSpan={7} style={{textAlign:'center',padding:40,color:'#94A3B8'}}>No courses yet. Click New Course to get started.</td></tr>)}
                        {trainingCourses.map(c=>(
                          <tr key={c.id}>
                            <td><strong>{c.title}</strong>{c.description&&<div style={{fontSize:'0.8rem',color:'#64748B',marginTop:2}}>{c.description}</div>}</td>
                            <td><span style={{padding:'3px 10px',borderRadius:20,fontSize:'0.78rem',fontWeight:600,
                              background:c.course_type==='read_acknowledge'?'#DBEAFE':c.course_type==='read_quiz'?'#EDE9FE':'#D1FAE5',
                              color:c.course_type==='read_acknowledge'?'#1D4ED8':c.course_type==='read_quiz'?'#7C3AED':'#059669'}}>
                              {c.course_type==='read_acknowledge'?'Read & Ack':c.course_type==='read_quiz'?'Quiz':'Ext. Cert'}
                            </span></td>
                            <td>{c.material_url?(<a href={c.material_url} target="_blank" rel="noopener noreferrer" style={{color:'#0284C7',textDecoration:'underline',fontSize:'0.85rem'}}>{c.material_type.toUpperCase()}</a>):<span style={{color:'#CBD5E1'}}>None</span>}</td>
                            <td>{c.course_type==='read_quiz'?c.pass_mark_pct+'%':'—'}</td>
                            <td>{c.validity_months?c.validity_months+' mo':'No expiry'}</td>
                            <td>{c.is_mandatory?<span style={{color:'#DC2626',fontWeight:700}}>Required</span>:<span style={{color:'#64748B'}}>Optional</span>}</td>
                            <td><span style={{padding:'3px 10px',borderRadius:20,fontSize:'0.78rem',fontWeight:600,
                              background:c.is_active?'#D1FAE5':'#F1F5F9',color:c.is_active?'#059669':'#64748B'}}>
                              {c.is_active?'Active':'Inactive'}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {!trainingLoading && trainingTab === 'assign' && (
                <div>
                  <div style={{maxWidth:620,marginBottom:32}}>
                    <form onSubmit={handleAssignCourse}>
                      <div style={{marginBottom:16}}>
                        <label style={{fontSize:'0.85rem',fontWeight:600,color:'#374151',display:'block',marginBottom:4}}>Course *</label>
                        <select value={assignCourseId} onChange={e=>setAssignCourseId(e.target.value)} required
                          style={{width:'100%',padding:'10px 12px',border:'1px solid #D1D5DB',borderRadius:8,fontSize:'0.9rem'}}>
                          <option value="">Choose a course</option>
                          {trainingCourses.filter(c=>c.is_active).map(c=><option key={c.id} value={c.id}>{c.title}</option>)}
                        </select>
                      </div>
                      <div style={{marginBottom:16}}>
                        <label style={{fontSize:'0.85rem',fontWeight:600,color:'#374151',display:'block',marginBottom:4}}>Staff Members *</label>
                        <div style={{border:'1px solid #D1D5DB',borderRadius:8,maxHeight:220,overflowY:'auto',padding:8}}>
                          {staff.length===0&&<p style={{color:'#94A3B8',fontSize:'0.85rem',padding:8}}>No staff loaded.</p>}
                          {staff.map(s=>(
                            <label key={s.id} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 8px',cursor:'pointer',borderRadius:4,
                              background:assignStaffIds.includes(s.id)?'#EFF6FF':'transparent'}}>
                              <input type="checkbox" checked={assignStaffIds.includes(s.id)}
                                onChange={e=>setAssignStaffIds(p=>e.target.checked?[...p,s.id]:p.filter(id=>id!==s.id))}/>
                              <span style={{fontWeight:600,fontSize:'0.88rem'}}>{s.name}</span>
                              <span style={{fontSize:'0.8rem',color:'#64748B'}}>{s.role}</span>
                            </label>
                          ))}
                        </div>
                        {assignStaffIds.length>0&&<p style={{fontSize:'0.8rem',color:'#0284C7',marginTop:4}}>{assignStaffIds.length} selected</p>}
                      </div>
                      <div style={{marginBottom:20}}>
                        <label style={{fontSize:'0.85rem',fontWeight:600,color:'#374151',display:'block',marginBottom:4}}>Due Date</label>
                        <input type="date" value={assignDueDate} onChange={e=>setAssignDueDate(e.target.value)}
                          style={{padding:'10px 12px',border:'1px solid #D1D5DB',borderRadius:8,fontSize:'0.9rem'}}/>
                      </div>
                      <button type="submit" disabled={assigning} className="crmViewBtn" style={{background:'#059669',color:'#fff',border:'none',padding:'10px 24px'}}>
                        {assigning?'Assigning...':'Assign to '+(assignStaffIds.length||0)+' Worker(s)'}
                      </button>
                    </form>
                  </div>
                  {trainingAssignments.length>0&&(
                    <div>
                      <h4 style={{fontSize:'0.9rem',fontWeight:700,color:'#0F172A',marginBottom:12}}>All Assignments ({trainingAssignments.length})</h4>
                      <div className="crmTableWrapper">
                        <table className="crmTable">
                          <thead><tr><th>Course</th><th>Staff</th><th>Due Date</th></tr></thead>
                          <tbody>
                            {trainingAssignments.map(a=>(
                              <tr key={a.id}>
                                <td>{a.training_courses?.title??'Unknown'}</td>
                                <td style={{fontWeight:600}}>{a.staff_name??a.staff_id}</td>
                                <td style={{color:'#64748B'}}>{a.due_date??'No due date'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

                            {!trainingLoading && trainingTab === 'external' && (
                <div>
                  <div className="crmPanelHeader" style={{ marginBottom: 16 }}>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>
                        Curated Free External Training Directory ({externalCourses.length})
                      </h3>
                      <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748B' }}>
                        Authoritative free courses from the NDIS Commission, NSW Ageing &amp; Disability Commission, and universities.
                      </p>
                    </div>
                  </div>

                  <div className="crmTableWrapper">
                    <table className="crmTable">
                      <thead><tr>
                        <th>Course / Resource</th>
                        <th>Provider</th>
                        <th>Category</th>
                        <th>Target Audience</th>
                        <th>Certification</th>
                        <th>Duration</th>
                        <th>Link</th>
                      </tr></thead>
                      <tbody>
                        {externalCourses.length === 0 && (
                          <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>
                            No external training loaded.
                          </td></tr>
                        )}
                        {externalCourses.map(ext => (
                          <tr key={ext.id}>
                            <td>
                              <strong>{ext.title}</strong>
                              <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 2 }}>{ext.description}</div>
                            </td>
                            <td style={{ fontSize: '0.85rem', fontWeight: 600 }}>{ext.provider}</td>
                            <td>
                              <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600, background: '#F1F5F9', color: '#475569' }}>
                                {ext.category}
                              </span>
                            </td>
                            <td style={{ fontSize: '0.82rem' }}>{ext.target_audience}</td>
                            <td>
                              <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600, background: '#EDE9FE', color: '#6D28D9' }}>
                                {ext.certificate_type}
                              </span>
                            </td>
                            <td style={{ fontSize: '0.82rem', color: '#64748B' }}>{ext.duration_text || 'Self-paced'}</td>
                            <td>
                              <a
                                href={ext.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="crmViewBtn"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none', fontSize: '0.78rem' }}
                              >
                                <span>Open Course</span>
                                <ExternalLink size={12}/>
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {!trainingLoading && trainingTab === 'report' && (
                <div>
                  <div className="crmTableWrapper" style={{overflowX:'auto'}}>
                    <table className="crmTable" style={{minWidth:900}}>
                      <thead><tr>
                        <th>Staff Member</th>
                        {trainingCourses.filter(c=>c.is_active).map(c=>(
                          <th key={c.id} style={{fontSize:'0.75rem',textAlign:'center'}}>
                            {c.title}{c.is_mandatory&&<span style={{color:'#DC2626'}}>*</span>}
                          </th>
                        ))}
                        <th>Mandatory %</th>
                      </tr></thead>
                      <tbody>
                        {staff.length===0&&<tr><td colSpan={99} style={{textAlign:'center',padding:40,color:'#94A3B8'}}>No staff records.</td></tr>}
                        {staff.map(s=>{
                          const ac=trainingCourses.filter(c=>c.is_active);
                          const mc=ac.filter(c=>c.is_mandatory);
                          const done=mc.filter(c=>{
                            const a=trainingAssignments.find(x=>x.course_id===c.id&&x.staff_id===s.id);
                            return a&&getTrainingStatus(s.id,c.id,a.due_date).label==='Complete';
                          }).length;
                          const pct=mc.length>0?Math.round((done/mc.length)*100):100;
                          return (
                            <tr key={s.id}>
                              <td><strong style={{fontSize:'0.88rem'}}>{s.name}</strong><div style={{fontSize:'0.78rem',color:'#64748B'}}>{s.role}</div></td>
                              {ac.map(c=>{
                                const a=trainingAssignments.find(x=>x.course_id===c.id&&x.staff_id===s.id);
                                if(!a) return <td key={c.id} style={{textAlign:'center'}}><span style={{color:'#CBD5E1',fontSize:'0.8rem'}}>—</span></td>;
                                const st=getTrainingStatus(s.id,c.id,a.due_date);
                                return <td key={c.id} style={{textAlign:'center'}}>
                                  <span style={{padding:'2px 8px',borderRadius:20,fontSize:'0.75rem',fontWeight:600,background:st.bg,color:st.color}}>{st.label}</span>
                                </td>;
                              })}
                              <td>
                                <div style={{display:'flex',alignItems:'center',gap:8}}>
                                  <div style={{flex:1,height:8,background:'#F1F5F9',borderRadius:4,overflow:'hidden',minWidth:60}}>
                                    <div style={{width:pct+'%',height:'100%',borderRadius:4,background:pct===100?'#059669':pct>=60?'#D97706':'#DC2626'}}/>
                                  </div>
                                  <span style={{fontSize:'0.82rem',fontWeight:700,minWidth:36,color:pct===100?'#059669':pct>=60?'#D97706':'#DC2626'}}>{pct}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <p style={{fontSize:'0.75rem',color:'#94A3B8',marginTop:8}}>* Mandatory. Compliance % counts mandatory courses only.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 8: SETTINGS */}
          {tab === 'settings' && (
            <div className="crmTabPanel">
              <div className="crmPanelHeader">
                <div>
                  <h2 className="crmPanelTitle">System Settings &amp; Diagnostics</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                    Infrastructure connectivity, database security status, and operations keys.
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #EEF2F6', borderRadius: 12, padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span className="crmLiveDot" />
                    <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>Supabase PostgreSQL 17</strong>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '0 0 12px' }}>
                    Host: Sydney (ap-southeast-2)<br />
                    Tables: 9 initialized with RLS
                  </p>
                  <span className="crmLiveSyncPill">Connected Live</span>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #EEF2F6', borderRadius: 12, padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <FolderLock size={16} style={{ color: '#0284C7' }} />
                    <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>Private Document Vault</strong>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '0 0 12px' }}>
                    Bucket: crm-documents<br />
                    Security: AES-256 with signed URLs
                  </p>
                  <span className="crmLiveSyncPill">Encrypted &amp; Ready</span>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #EEF2F6', borderRadius: 12, padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Mail size={16} style={{ color: '#0284C7' }} />
                    <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>Resend Inbound Webhook</strong>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '0 0 12px' }}>
                    Route: /api/email/inbound<br />
                    Status: Verified &amp; Forwarding
                  </p>
                  <span className="crmLiveSyncPill">Active</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* DETAIL MODAL / DRAWER (Referral, Participant, or Staff) */}
      {(selectedReferral || selectedParticipant || selectedStaff) && (
        <div className="crmModalOverlay" onClick={() => {
          setSelectedReferral(null);
          setSelectedParticipant(null);
          setSelectedStaff(null);
        }}>
          <div className="crmModalBox" onClick={(e) => e.stopPropagation()}>
            <div className="crmModalHeader">
              <div>
                <span className="refIdTag">
                  {selectedReferral?.referenceNumber || selectedParticipant?.referenceNumber || selectedStaff?.referenceNumber || 'RECORD DETAILS'}
                </span>
                <h3>
                  {selectedReferral?.participantName || selectedParticipant?.name || selectedStaff?.name}
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedReferral(null);
                  setSelectedParticipant(null);
                  setSelectedStaff(null);
                }}
                className="crmModalClose"
              >
                &times;
              </button>
            </div>

            {/* Modal Drawer Tabs */}
            <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid #EEF2F6', padding: '0 24px' }}>
              <button
                onClick={() => setDrawerTab('overview')}
                style={{
                  padding: '12px 0',
                  border: 'none',
                  background: 'none',
                  borderBottom: `2px solid ${drawerTab === 'overview' ? '#0284C7' : 'transparent'}`,
                  color: drawerTab === 'overview' ? '#0284C7' : '#64748B',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                Overview
              </button>

              <button
                onClick={() => setDrawerTab('documents')}
                style={{
                  padding: '12px 0',
                  border: 'none',
                  background: 'none',
                  borderBottom: `2px solid ${drawerTab === 'documents' ? '#0284C7' : 'transparent'}`,
                  color: drawerTab === 'documents' ? '#0284C7' : '#64748B',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <FolderLock size={15} />
                <span>Document Vault ({documents.length})</span>
              </button>

              {(selectedReferral || selectedParticipant) && (
                <button
                  onClick={() => setDrawerTab('timeline')}
                  style={{
                    padding: '12px 0',
                    border: 'none',
                    background: 'none',
                    borderBottom: `2px solid ${drawerTab === 'timeline' ? '#0284C7' : 'transparent'}`,
                    color: drawerTab === 'timeline' ? '#0284C7' : '#64748B',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <History size={15} />
                  <span>Activity Timeline ({activities.length})</span>
                </button>
              )}
            </div>

            <div className="crmModalBody">
              {/* DRAWER TAB 1: OVERVIEW */}
              {drawerTab === 'overview' && (
                <div>
                  {selectedReferral && (
                    <>
                      <div className="crmDetailGrid">
                        <div>
                          <label>Participant Name</label>
                          <p>{selectedReferral.participantName}</p>
                        </div>
                        <div>
                          <label>Funding Scheme</label>
                          <p><span className="fundingPillMini">{selectedReferral.funding}</span></p>
                        </div>
                        <div>
                          <label>Referrer / Contact</label>
                          <p>{selectedReferral.name} ({selectedReferral.role})</p>
                        </div>
                        <div>
                          <label>Contact Details</label>
                          <p>
                            <a href={`tel:${selectedReferral.phone}`} style={{ color: '#0284C7', textDecoration: 'none' }}>
                              {selectedReferral.phone}
                            </a>
                            <br />
                            <a href={`mailto:${selectedReferral.email}`} style={{ color: '#64748B', fontSize: '0.85rem' }}>
                              {selectedReferral.email}
                            </a>
                          </p>
                        </div>
                        <div>
                          <label>Location / Suburb</label>
                          <p>{selectedReferral.suburb || 'Northern Rivers, NSW'}</p>
                        </div>
                        <div>
                          <label>Schedule Preference</label>
                          <p>{selectedReferral.schedulePreference || 'Standard daytime'}</p>
                        </div>
                        <div className="fullCol">
                          <label>Requested Services</label>
                          <p>{selectedReferral.services}</p>
                        </div>
                        <div className="fullCol">
                          <label>Referral Message / Clinical Notes</label>
                          <div className="modalMessageNote">
                            {selectedReferral.message || 'No additional message provided.'}
                          </div>
                        </div>
                      </div>

                      {/* Convert to Participant Action */}
                      {selectedReferral.status !== 'accepted' && (
                        <div style={{ marginTop: 20, padding: 16, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <strong style={{ color: '#166534', fontSize: '0.9rem' }}>Enrol as Active Participant?</strong>
                            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#15803D' }}>
                              Creates official Participant record and links all documents &amp; history.
                            </p>
                          </div>
                          <button
                            onClick={() => handleConvertToParticipant(selectedReferral)}
                            disabled={converting}
                            className="headerCtaBtn"
                            style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                          >
                            {converting ? 'Converting...' : 'Convert to Participant'}
                          </button>
                        </div>
                      )}

                      {/* Status Selector */}
                      <div className="modalStatusAction">
                        <label>Update Intake Stage</label>
                        <div className="statusBtnGroup">
                          {PIPELINE_STAGES.map((s) => (
                            <button
                              key={s.id}
                              onClick={() => handleStatusChange(selectedReferral.id, s.id as any)}
                              className={`statusPillBtn ${selectedReferral.status === s.id ? 'active' : ''}`}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {selectedParticipant && (
                    <div className="crmDetailGrid">
                      <div>
                        <label>Participant Name</label>
                        <p>{selectedParticipant.name}</p>
                      </div>
                      <div>
                        <label>NDIS Number</label>
                        <p><span className="refIdTag">{selectedParticipant.ndisNumber}</span></p>
                      </div>
                      <div>
                        <label>Funding Type</label>
                        <p><span className="fundingPillMini">{selectedParticipant.fundingType}</span></p>
                      </div>
                      <div>
                        <label>Plan Manager</label>
                        <p>{selectedParticipant.planManager || 'Self-Managed'}</p>
                      </div>
                      <div>
                        <label>Suburb</label>
                        <p>{selectedParticipant.suburb}</p>
                      </div>
                      <div>
                        <label>Allocated Hours</label>
                        <p>{selectedParticipant.allocatedHours || 15} hours / week</p>
                      </div>
                      <div className="fullCol">
                        <label>Assigned Support Worker</label>
                        <p>{selectedParticipant.workerAssigned || 'Unassigned - assign in roster'}</p>
                      </div>
                    </div>
                  )}

                  {selectedStaff && (
                    <div className="crmDetailGrid">
                      <div>
                        <label>Worker Name</label>
                        <p>{selectedStaff.name}</p>
                      </div>
                      <div>
                        <label>Role</label>
                        <p>{selectedStaff.role}</p>
                      </div>
                      <div>
                        <label>Phone</label>
                        <p><a href={`tel:${selectedStaff.phone}`} style={{ color: '#0284C7' }}>{selectedStaff.phone}</a></p>
                      </div>
                      <div>
                        <label>Email</label>
                        <p><a href={`mailto:${selectedStaff.email}`} style={{ color: '#64748B' }}>{selectedStaff.email}</a></p>
                      </div>
                      <div>
                        <label>NDIS Worker Screening (NWSC)</label>
                        <p><span className="checkPassPill">{selectedStaff.ndisScreening}</span></p>
                      </div>
                      <div>
                        <label>Working With Children (WWCC)</label>
                        <p><span className="checkPassPill">{selectedStaff.wwcc}</span></p>
                      </div>
                      <div>
                        <label>First Aid / CPR</label>
                        <p><span className="checkPassPill">{selectedStaff.firstAid}</span></p>
                      </div>
                      <div>
                        <label>Hourly Pay Rate</label>
                        <p>${selectedStaff.hourlyRate || 38.50} / hr (SCHADS Award)</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* DRAWER TAB 2: DOCUMENT VAULT */}
              {drawerTab === 'documents' && (
                <div>
                  <div style={{ marginBottom: 20, padding: 16, background: '#F8FAFC', border: '1px solid #EEF2F6', borderRadius: 10 }}>
                    <h4 style={{ margin: '0 0 8px', fontSize: '0.92rem', color: '#0F172A' }}>
                      Upload to Encrypted Vault (AES-256)
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', marginBottom: 4 }}>Document Category</label>
                        <select
                          value={uploadCategory}
                          onChange={(e) => setUploadCategory(e.target.value)}
                          className="crmSelect"
                          style={{ width: '100%' }}
                        >
                          <option value="service_agreement">Service Agreement</option>
                          <option value="ndis_plan">NDIS Support Plan</option>
                          <option value="risk_assessment">Risk Assessment</option>
                          <option value="police_check">National Police Check</option>
                          <option value="wwcc">WWCC Certificate</option>
                          <option value="first_aid">First Aid / CPR Certificate</option>
                          <option value="other">Other / General Note</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', marginBottom: 4 }}>Expiry Date (if applicable)</label>
                        <input
                          type="date"
                          value={uploadExpiry}
                          onChange={(e) => setUploadExpiry(e.target.value)}
                          className="crmSearchInput"
                          style={{ padding: '7px 10px' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        disabled={uploadingDoc}
                        style={{ fontSize: '0.85rem' }}
                      />
                      {uploadingDoc && (
                        <span style={{ fontSize: '0.8rem', color: '#0284C7', fontWeight: 600 }}>
                          Encrypting &amp; uploading...
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Document List */}
                  {docsLoading ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: '#64748B' }}>
                      <RefreshCw size={20} className="spin" style={{ margin: '0 auto 8px', display: 'block' }} />
                      <span>Loading vault documents...</span>
                    </div>
                  ) : documents.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: '#94A3B8', fontSize: '0.85rem' }}>
                      No documents in vault yet. Choose a file above to upload securely.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {documents.map((doc) => (
                        <div
                          key={doc.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 14px',
                            background: '#FFFFFF',
                            border: '1px solid #EEF2F6',
                            borderRadius: 8
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <FileText size={16} style={{ color: '#0284C7' }} />
                              <strong style={{ fontSize: '0.88rem', color: '#0F172A' }}>{doc.file_name}</strong>
                              <span className="refIdTag" style={{ fontSize: '0.7rem' }}>{doc.category}</span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: 4 }}>
                              Uploaded {new Date(doc.created_at).toLocaleDateString('en-AU')} &bull; {doc.uploaded_by || 'Admin'}
                            </div>
                          </div>
                          {doc.downloadUrl && (
                            <a
                              href={doc.downloadUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="crmViewBtn"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
                            >
                              <FileDown size={14} /> <span>Download</span>
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* DRAWER TAB 3: ACTIVITY TIMELINE */}
              {drawerTab === 'timeline' && (
                <div>
                  {/* Add Note Form */}
                  <form onSubmit={handleAddNote} style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <select
                        value={newNoteType}
                        onChange={(e) => setNewNoteType(e.target.value as any)}
                        className="crmSelect"
                        style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                      >
                        <option value="note">Internal Note</option>
                        <option value="call">Phone Call</option>
                        <option value="email">Email</option>
                        <option value="meeting">Meeting</option>
                      </select>
                    </div>
                    <textarea
                      placeholder="Write an operational note or log contact..."
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      rows={3}
                      className="crmSearchInput"
                      style={{ width: '100%', resize: 'vertical', borderRadius: 8 }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                      <button
                        type="submit"
                        disabled={noteSaving || !newNoteText.trim()}
                        className="headerCtaBtn"
                        style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                      >
                        {noteSaving ? 'Saving...' : 'Post to Timeline'}
                      </button>
                    </div>
                  </form>

                  {/* Timeline Feed */}
                  {activitiesLoading ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: '#64748B' }}>
                      <RefreshCw size={20} className="spin" style={{ margin: '0 auto 8px', display: 'block' }} />
                      <span>Loading timeline history...</span>
                    </div>
                  ) : activities.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: '#94A3B8', fontSize: '0.85rem' }}>
                      No activity logged yet. Add your first note above.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {activities.map((act) => (
                        <div
                          key={act.id}
                          style={{
                            display: 'flex',
                            gap: 12,
                            padding: '12px 14px',
                            background: '#F8FAFC',
                            border: '1px solid #EEF2F6',
                            borderRadius: 8
                          }}
                        >
                          <div style={{ marginTop: 2 }}>
                            {act.activity_type === 'call' && <Phone size={16} style={{ color: '#0284C7' }} />}
                            {act.activity_type === 'email' && <Mail size={16} style={{ color: '#F59E0B' }} />}
                            {act.activity_type === 'meeting' && <Calendar size={16} style={{ color: '#10B981' }} />}
                            {act.activity_type === 'note' && <MessageSquare size={16} style={{ color: '#6D28D9' }} />}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <strong style={{ fontSize: '0.85rem', color: '#0F172A' }}>{act.title}</strong>
                              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                                {new Date(act.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#475569', lineHeight: 1.5 }}>
                              {act.description}
                            </p>
                            <span style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'inline-block', marginTop: 4 }}>
                              Logged by {act.author_name}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
