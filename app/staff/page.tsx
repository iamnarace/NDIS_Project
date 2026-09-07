'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  GraduationCap, BookOpen, CheckCircle2, Clock, AlertCircle,
  Upload, ExternalLink, LogOut, Award, ChevronRight, AlertTriangle,
  Globe, Shield, Sparkles, Filter, Check, FileText, Download, UserCheck
} from 'lucide-react';

/* ── Types ─────────────────────────────────────────────────── */
interface QuizQuestion { question: string; options: string[]; correct_index: number; }
interface TrainingCourse {
  id: string; title: string; description?: string;
  course_type: 'read_acknowledge' | 'read_quiz' | 'external_cert';
  material_type: string; material_url?: string;
  quiz_questions?: QuizQuestion[]; pass_mark_pct: number;
  validity_months?: number; is_mandatory: boolean;
  certificate_enabled: boolean; max_attempts?: number; is_active: boolean;
}
interface TrainingAssignment {
  id: string; course_id: string; staff_id: string; due_date?: string;
  training_courses?: TrainingCourse;
}
interface TrainingCompletion {
  id: string; course_id: string; staff_id: string; completed_at: string;
  quiz_score_pct?: number; passed: boolean; expires_at?: string;
  certificate_id?: string; cert_download_url?: string;
  cert_file_name?: string; external_issuer?: string; external_expiry_date?: string;
  notes?: string;
  training_courses?: { title?: string; course_type?: string };
}
interface TrainingAttempt { id: string; course_id: string; score_pct: number; passed: boolean; attempted_at: string; }

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

/* ── Status helper ──────────────────────────────────────────── */
function getStatus(
  completion: TrainingCompletion | undefined,
  assignment: TrainingAssignment | undefined
): { label: string; color: string; bg: string; icon: React.ReactNode } {
  const now = new Date();
  if (completion) {
    const expDateStr = completion.expires_at || completion.external_expiry_date;
    if (expDateStr) {
      const d = Math.ceil((new Date(expDateStr).getTime() - now.getTime()) / 86400000);
      if (d < 0) return { label: 'Expired', color: '#DC2626', bg: '#FEE2E2', icon: <AlertCircle size={14}/> };
      if (d <= 30) return { label: 'Expiring Soon', color: '#D97706', bg: '#FEF3C7', icon: <AlertTriangle size={14}/> };
    }
    return { label: 'Complete', color: '#059669', bg: '#D1FAE5', icon: <CheckCircle2 size={14}/> };
  }
  if (assignment?.due_date) {
    const d = Math.ceil((new Date(assignment.due_date).getTime() - now.getTime()) / 86400000);
    if (d < 0) return { label: 'Overdue', color: '#DC2626', bg: '#FEE2E2', icon: <AlertCircle size={14}/> };
    if (d <= 7) return { label: 'Due Soon', color: '#D97706', bg: '#FEF3C7', icon: <AlertTriangle size={14}/> };
  }
  return { label: 'Not Started', color: '#64748B', bg: '#F1F5F9', icon: <Clock size={14}/> };
}

/* ── Demo staff identity ────────────────────────────────────── */
const DEMO_STAFF = { id: 'STF-001', name: 'James Wilson', role: 'Disability Support Worker' };

const EXTERNAL_CATEGORIES = [
  'All',
  'NDIS Essentials',
  'Safeguarding',
  'Support Practice',
  'Behaviour & Trauma',
  'Leadership',
  'Optional Specialist Learning'
];

export default function StaffTrainingPage() {
  const [staffId] = useState(DEMO_STAFF.id);
  const [staffName] = useState(DEMO_STAFF.name);

  // Tabs: my_training | external_library | my_certificates
  const [portalTab, setPortalTab] = useState<'my_training' | 'external_library' | 'my_certificates'>('my_training');

  const [assignments, setAssignments] = useState<TrainingAssignment[]>([]);
  const [completions, setCompletions] = useState<TrainingCompletion[]>([]);
  const [attempts, setAttempts] = useState<TrainingAttempt[]>([]);
  const [externalCourses, setExternalCourses] = useState<ExternalCourse[]>([]);
  const [selectedExtCategory, setSelectedExtCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  // Active training flow (internal)
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [flowStep, setFlowStep] = useState<'material' | 'ack' | 'quiz' | 'result' | 'cert_upload'>('material');
  const [acknowledged, setAcknowledged] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizPage, setQuizPage] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<{ passed: boolean; score: number; certId?: string } | null>(null);

  // External cert upload dialog
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadCourseTitle, setUploadCourseTitle] = useState('');
  const [uploadCourseId, setUploadCourseId] = useState('');
  const [extIssuer, setExtIssuer] = useState('');
  const [extExpiry, setExtExpiry] = useState('');
  const [extFile, setExtFile] = useState<File | null>(null);
  const [uploadingCert, setUploadingCert] = useState(false);
  const [statusNotice, setStatusNotice] = useState('');
  const fileRef = useRef<HTMLInputElement | null>(null);

  const activeCourse = assignments.find(a => a.course_id === activeCourseId)?.training_courses;
  const activeAssignment = assignments.find(a => a.course_id === activeCourseId);
  const activeCompletion = completions.find(c => c.course_id === activeCourseId);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [aRes, cRes, atRes, extRes] = await Promise.all([
        fetch('/api/training/assignments?staff_id=' + staffId),
        fetch('/api/training/completions?staff_id=' + staffId),
        fetch('/api/training/attempts?staff_id=' + staffId),
        fetch('/api/training/external')
      ]);
      if (aRes.ok) setAssignments(await aRes.json());
      if (cRes.ok) setCompletions(await cRes.json());
      if (atRes.ok) setAttempts(await atRes.json());
      if (extRes.ok) setExternalCourses(await extRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function openCourse(courseId: string) {
    const completion = completions.find(c => c.course_id === courseId);
    const course = assignments.find(a => a.course_id === courseId)?.training_courses;
    if (!course) return;
    setActiveCourseId(courseId);
    setAcknowledged(false);
    setQuizAnswers({});
    setQuizPage(0);
    setLastResult(null);
    if (completion) {
      setFlowStep('cert_upload');
    } else {
      setFlowStep(course.material_url ? 'material' : course.course_type === 'external_cert' ? 'cert_upload' : 'ack');
    }
  }

  async function handleAcknowledge() {
    if (!activeCourseId || !activeAssignment) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/training/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: activeCourseId,
          assignment_id: activeAssignment.id,
          staff_id: staffId,
          staff_name: staffName,
        }),
      });
      if (res.ok) {
        await loadData();
        setFlowStep('result');
        setLastResult({ passed: true, score: 100 });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleQuizSubmit() {
    if (!activeCourseId || !activeAssignment || !activeCourse) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/training/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: activeCourseId,
          assignment_id: activeAssignment.id,
          staff_id: staffId,
          staff_name: staffName,
          answers: quizAnswers,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        await loadData();
        setFlowStep('result');
        setLastResult({ passed: data.passed, score: data.score_pct, certId: data.completion?.certificate_id });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleExternalCertUpload(e: React.FormEvent) {
    e.preventDefault();
    const targetCourseId = uploadCourseId || activeCourseId;
    if (!targetCourseId) return;

    setUploadingCert(true);
    try {
      const fd = new FormData();
      if (extFile) fd.append('file', extFile);
      fd.append('course_id', targetCourseId);
      fd.append('staff_id', staffId);
      fd.append('staff_name', staffName);
      fd.append('external_issuer', extIssuer);
      fd.append('external_expiry_date', extExpiry);
      fd.append('notes', uploadCourseTitle ? `External Course: ${uploadCourseTitle}` : 'External Evidence');

      const res = await fetch('/api/training/completions', { method: 'PATCH', body: fd });
      if (res.ok) {
        await loadData();
        setUploadModalOpen(false);
        setActiveCourseId(null);
        setExtFile(null);
        setExtIssuer('');
        setExtExpiry('');
        setStatusNotice('Certificate evidence recorded in your compliance profile.');
        setTimeout(() => setStatusNotice(''), 4000);
      } else {
        const err = await res.json();
        alert(err.message || 'Upload failed');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUploadingCert(false);
    }
  }

  // Count for compliance summary
  const mandatory = assignments.filter(a => a.training_courses?.is_mandatory);
  const mandatoryDone = mandatory.filter(a => completions.some(c => c.course_id === a.course_id && c.passed));
  const compliancePct = mandatory.length > 0 ? Math.round((mandatoryDone.length / mandatory.length) * 100) : 100;

  // Filtered external courses
  const filteredExternal = externalCourses.filter(c =>
    selectedExtCategory === 'All' || c.category === selectedExtCategory
  );

  return (
    <div className="portalDashWrap">
      {/* Top Header */}
      <header className="portalDashNav">
        <div className="shell portalDashNavInner">
          <div className="portalNavBrand">
            <Link href="/">
              <Image src="/brand/Opus_Care_Logo_Transparent.png" alt="Opus Care" width={160} height={44} className="portalNavLogo"/>
            </Link>
            <span className="portalBadgeParticipant" style={{ background: '#7C3AED', color: '#fff' }}>STAFF TRAINING HUB</span>
          </div>
          <div className="portalNavActions">
            <Link href="/portal/dashboard" className="portalStaffLink">
              <span>Participant Portal</span>
              <ChevronRight size={14}/>
            </Link>
            <Link href="/admin" className="portalStaffLink">
              <span>Staff CRM</span>
              <ChevronRight size={14}/>
            </Link>
            <div className="portalUserPill">
              <div className="portalUserAvatar">{staffName.charAt(0)}</div>
              <div className="portalUserDetails">
                <strong>{staffName}</strong>
                <small>{DEMO_STAFF.role}</small>
              </div>
            </div>
            <Link href="/portal" className="portalLogoutBtn" title="Log Out"><LogOut size={16}/></Link>
          </div>
        </div>
      </header>

      <main className="portalDashMain">
        <div className="shell">

          {/* Status Alert Banner */}
          {statusNotice && (
            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '12px 18px', borderRadius: 8, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem' }}>
              <CheckCircle2 size={18} style={{ color: '#059669' }}/>
              <span>{statusNotice}</span>
            </div>
          )}

          {/* Welcome & Progress Bar */}
          <div className="portalWelcomeRow" style={{ marginBottom: 20 }}>
            <div>
              <h1 className="portalWelcomeTitle">Staff Training &amp; Compliance Hub</h1>
              <p className="portalWelcomeSub">
                Complete internal induction modules, explore verified free external training, and track your NDIS compliance credentials.
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: 4 }}>Mandatory Compliance</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 140, height: 10, background: '#F1F5F9', borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{ width: `${compliancePct}%`, height: '100%', borderRadius: 5,
                    background: compliancePct === 100 ? '#059669' : compliancePct >= 60 ? '#D97706' : '#DC2626' }}/>
                </div>
                <span style={{ fontWeight: 700, fontSize: '1.15rem',
                  color: compliancePct === 100 ? '#059669' : compliancePct >= 60 ? '#D97706' : '#DC2626' }}>
                  {compliancePct}%
                </span>
              </div>
            </div>
          </div>

          {/* 3 Main Hub Tabs */}
          <div className="portalNavTabsRow" style={{ marginBottom: 24 }}>
            <button
              className={`portalNavTab ${portalTab === 'my_training' ? 'active' : ''}`}
              onClick={() => { setPortalTab('my_training'); setActiveCourseId(null); }}
            >
              <BookOpen size={15} style={{ marginRight: 6, display: 'inline-block', verticalAlign: '-2px' }}/>
              My Assigned Training ({assignments.length})
            </button>
            <button
              className={`portalNavTab ${portalTab === 'external_library' ? 'active' : ''}`}
              onClick={() => { setPortalTab('external_library'); setActiveCourseId(null); }}
            >
              <Globe size={15} style={{ marginRight: 6, display: 'inline-block', verticalAlign: '-2px' }}/>
              Free External Training Library ({externalCourses.length})
            </button>
            <button
              className={`portalNavTab ${portalTab === 'my_certificates' ? 'active' : ''}`}
              onClick={() => { setPortalTab('my_certificates'); setActiveCourseId(null); }}
            >
              <Award size={15} style={{ marginRight: 6, display: 'inline-block', verticalAlign: '-2px' }}/>
              My Certificates &amp; Evidence ({completions.length})
            </button>
          </div>

          {loading && <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>Loading training data...</div>}

          {/* ═════════════════════════════════════════════════════════ */}
          {/* TAB 1: MY ASSIGNED TRAINING                              */}
          {/* ═════════════════════════════════════════════════════════ */}
          {!loading && portalTab === 'my_training' && !activeCourseId && (
            <div className="portalSectionBlock">
              <div className="portalBlockHead">
                <div>
                  <h3>Opus Care Learning Modules</h3>
                  <p>Read the module material, pass the 5-question knowledge check at ≥80%, and earn your completion certificate.</p>
                </div>
              </div>

              {assignments.length === 0 && (
                <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>
                  <GraduationCap size={40} style={{ opacity: 0.3, marginBottom: 8 }}/>
                  <p>No training has been assigned yet.</p>
                </div>
              )}

              <div className="portalInvoicesTableWrap">
                <table className="portalTable">
                  <thead><tr>
                    <th>Module Title</th>
                    <th>Format</th>
                    <th>Compliance Status</th>
                    <th>Due / Expiry</th>
                    <th>Actions</th>
                  </tr></thead>
                  <tbody>
                    {assignments.map(a => {
                      const course = a.training_courses;
                      if (!course) return null;
                      const completion = completions.find(c => c.course_id === a.course_id);
                      const st = getStatus(completion, a);
                      const attemptList = attempts.filter(x => x.course_id === a.course_id);
                      const maxReached = course.max_attempts != null && attemptList.length >= course.max_attempts && !completion;
                      const dateLabel = completion?.expires_at
                        ? 'Expires ' + new Date(completion.expires_at).toLocaleDateString('en-AU')
                        : a.due_date ? 'Due ' + new Date(a.due_date).toLocaleDateString('en-AU') : 'Ongoing';

                      return (
                        <tr key={a.id}>
                          <td>
                            <strong>{course.title}</strong>
                            {course.description && <div style={{ fontSize: '0.8rem', color: '#64748B' }}>{course.description}</div>}
                            {course.is_mandatory && (
                              <span style={{ fontSize: '0.72rem', color: '#DC2626', fontWeight: 700, marginTop: 2, display: 'inline-block', background: '#FEE2E2', padding: '1px 6px', borderRadius: 4 }}>
                                MANDATORY
                              </span>
                            )}
                          </td>
                          <td>
                            <span style={{ padding: '3px 8px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
                              background: course.course_type === 'read_acknowledge' ? '#DBEAFE' : course.course_type === 'read_quiz' ? '#EDE9FE' : '#D1FAE5',
                              color: course.course_type === 'read_acknowledge' ? '#1D4ED8' : course.course_type === 'read_quiz' ? '#7C3AED' : '#059669' }}>
                              {course.course_type === 'read_acknowledge' ? 'PDF + Read' : course.course_type === 'read_quiz' ? 'PDF + 5Q Quiz' : 'External Cert'}
                            </span>
                          </td>
                          <td>
                            <span style={{ padding: '3px 8px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4, background: st.bg, color: st.color }}>
                              {st.icon} {st.label}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.85rem', color: '#64748B' }}>{dateLabel}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              {course.material_url && (
                                <a href={course.material_url} target="_blank" rel="noopener noreferrer"
                                  className="actionBtn query" title="View Training PDF" style={{ textDecoration: 'none' }}>
                                  <FileText size={12}/> PDF
                                </a>
                              )}
                              {completion && course.certificate_enabled && completion.certificate_id && (
                                <a href={'/api/training/certificate?completion_id=' + completion.id} target="_blank" rel="noopener noreferrer"
                                  className="actionBtn approve" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  <Award size={12}/> Certificate
                                </a>
                              )}
                              {!completion && !maxReached && (
                                <button className="actionBtn approve" onClick={() => openCourse(a.course_id)}>
                                  {attempts.some(x => x.course_id === a.course_id) ? 'Retry Quiz' : 'Start Module'}
                                </button>
                              )}
                              {maxReached && <span style={{ fontSize: '0.8rem', color: '#DC2626' }}>Max attempts reached</span>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 14, marginTop: 16, fontSize: '0.8rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield size={16} style={{ color: '#0284C7', flexShrink: 0 }}/>
                <span>
                  All Opus Care learning modules include practical disability support examples, worker escalation duties, and emergency standards.
                  Internal certificates are non-accredited and verify workplace policy understanding.
                </span>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════ */}
          {/* TAB 2: FREE EXTERNAL TRAINING LIBRARY                    */}
          {/* ═════════════════════════════════════════════════════════ */}
          {!loading && portalTab === 'external_library' && (
            <div className="portalSectionBlock">
              <div className="portalBlockHead">
                <div>
                  <h3>Free External Training Library</h3>
                  <p>
                    Curated official courses from the NDIS Commission, NSW Ageing &amp; Disability Commission, and La Trobe University.
                    Complete training on the provider platform, then upload your certificate below.
                  </p>
                </div>
              </div>

              {/* Category Filter Pills */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                {EXTERNAL_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedExtCategory(cat)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 20,
                      border: '1px solid',
                      borderColor: selectedExtCategory === cat ? '#0284C7' : '#E2E8F0',
                      background: selectedExtCategory === cat ? '#0284C7' : '#fff',
                      color: selectedExtCategory === cat ? '#fff' : '#64748B',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Grid of External Course Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 18 }}>
                {filteredExternal.map(ext => (
                  <div
                    key={ext.id}
                    style={{
                      background: '#fff',
                      border: '1px solid #E2E8F0',
                      borderRadius: 12,
                      padding: 20,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                    }}
                  >
                    <div>
                      {/* Top Row: Provider & Category */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {ext.provider}
                        </span>
                        <span style={{ fontSize: '0.72rem', background: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>
                          {ext.category}
                        </span>
                      </div>

                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A', marginBottom: 8, lineHeight: 1.3 }}>
                        {ext.title}
                      </h4>

                      <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5, marginBottom: 16 }}>
                        {ext.description}
                      </p>

                      {/* Feature Pills */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                        <span style={{ fontSize: '0.75rem', background: '#DCFCE7', color: '#166534', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                          🟢 Free
                        </span>
                        <span style={{ fontSize: '0.75rem', background: '#EDE9FE', color: '#6D28D9', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                          🎓 {ext.certificate_type}
                        </span>
                        <span style={{ fontSize: '0.75rem', background: '#E0F2FE', color: '#0369A1', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                          👥 {ext.target_audience}
                        </span>
                        {ext.duration_text && (
                          <span style={{ fontSize: '0.75rem', background: '#F1F5F9', color: '#64748B', padding: '2px 8px', borderRadius: 4 }}>
                            ⏱ {ext.duration_text}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: 8, borderTop: '1px solid #F1F5F9', paddingTop: 14 }}>
                      <a
                        href={ext.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="heroPillBtn filled sm"
                        style={{ textDecoration: 'none', flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                      >
                        <span>Start Free Training</span>
                        <ExternalLink size={13}/>
                      </a>
                      <button
                        className="crmViewBtn"
                        style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        onClick={() => {
                          setUploadCourseId(ext.id);
                          setUploadCourseTitle(ext.title);
                          setExtIssuer(ext.provider);
                          setUploadModalOpen(true);
                        }}
                      >
                        <Upload size={13}/> Record Evidence
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════ */}
          {/* TAB 3: MY CERTIFICATES & EVIDENCE VAULT                  */}
          {/* ═════════════════════════════════════════════════════════ */}
          {!loading && portalTab === 'my_certificates' && (
            <div className="portalSectionBlock">
              <div className="portalBlockHead">
                <div>
                  <h3>My Training Certificates &amp; Credentials</h3>
                  <p>All verified completion records, internal certificates, and uploaded external credentials stored securely.</p>
                </div>
              </div>

              {completions.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>
                  <Award size={40} style={{ opacity: 0.3, marginBottom: 8 }}/>
                  <p>No certificates recorded yet. Complete an assigned module to earn your first certificate.</p>
                </div>
              ) : (
                <div className="portalInvoicesTableWrap">
                  <table className="portalTable">
                    <thead><tr>
                      <th>Credential / Course</th>
                      <th>Certificate ID</th>
                      <th>Issuing Body</th>
                      <th>Date Completed</th>
                      <th>Expiry</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr></thead>
                    <tbody>
                      {completions.map(c => {
                        const isInternal = !!c.certificate_id;
                        const course = assignments.find(a => a.course_id === c.course_id)?.training_courses;
                        const title = course?.title || c.notes?.replace('External Course: ', '') || 'Training Certificate';

                        return (
                          <tr key={c.id}>
                            <td>
                              <strong>{title}</strong>
                              <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                                {isInternal ? 'Opus Care Internal Certification' : 'External Accredited Credential'}
                              </div>
                            </td>
                            <td>
                              {c.certificate_id ? (
                                <code style={{ fontSize: '0.82rem', background: '#F1F5F9', padding: '2px 6px', borderRadius: 4, color: '#0F172A' }}>
                                  {c.certificate_id}
                                </code>
                              ) : (
                                <span style={{ color: '#94A3B8', fontSize: '0.8rem' }}>External on file</span>
                              )}
                            </td>
                            <td style={{ fontSize: '0.85rem' }}>
                              {c.external_issuer || 'Opus Care Support Services'}
                            </td>
                            <td style={{ fontSize: '0.85rem' }}>
                              {c.completed_at ? new Date(c.completed_at).toLocaleDateString('en-AU') : '—'}
                            </td>
                            <td style={{ fontSize: '0.85rem' }}>
                              {c.expires_at || c.external_expiry_date ? (
                                new Date(c.expires_at || c.external_expiry_date!).toLocaleDateString('en-AU')
                              ) : (
                                <span style={{ color: '#94A3B8' }}>No Expiry</span>
                              )}
                            </td>
                            <td>
                              <span style={{ padding: '3px 8px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600, background: '#D1FAE5', color: '#059669', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <CheckCircle2 size={13}/> Verified
                              </span>
                            </td>
                            <td>
                              {isInternal ? (
                                <a
                                  href={'/api/training/certificate?completion_id=' + c.id}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="actionBtn approve"
                                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                >
                                  <Award size={12}/> View Certificate
                                </a>
                              ) : (
                                <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                                  {c.cert_file_name || 'Document on file'}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════ */}
          {/* ACTIVE INTERNAL TRAINING WORKFLOW                        */}
          {/* ═════════════════════════════════════════════════════════ */}
          {!loading && activeCourseId && activeCourse && (
            <div className="portalSectionBlock">
              <button
                onClick={() => setActiveCourseId(null)}
                style={{ border: 'none', background: 'none', color: '#0284C7', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', marginBottom: 16, padding: 0 }}
              >
                ← Back to Training Modules
              </button>

              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A' }}>{activeCourse.title}</h3>
                {activeCourse.description && <p style={{ color: '#64748B', marginTop: 4 }}>{activeCourse.description}</p>}
              </div>

              {/* Step 1: Review Material */}
              {flowStep === 'material' && (
                <div>
                  <div style={{ background: '#F8FAFC', border: '1px solid #EEF2F6', borderRadius: 12, padding: 24, marginBottom: 20 }}>
                    <p style={{ fontWeight: 600, marginBottom: 12, fontSize: '0.95rem' }}>Step 1: Read and review the training module</p>
                    {activeCourse.material_url && (
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
                        <a
                          href={activeCourse.material_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="actionBtn approve"
                          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px' }}
                        >
                          <FileText size={15}/> Open Full Training PDF in New Tab
                        </a>
                      </div>
                    )}
                    {/* Embedded preview */}
                    {activeCourse.material_url && (
                      <div style={{ height: 420, border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
                        <iframe
                          src={activeCourse.material_url}
                          title={activeCourse.title}
                          style={{ width: '100%', height: '100%', border: 'none' }}
                        />
                      </div>
                    )}
                  </div>
                  <button
                    className="heroPillBtn filled sm"
                    onClick={() => setFlowStep(activeCourse.course_type === 'read_quiz' ? 'quiz' : 'ack')}
                  >
                    I have read and understood this module → Continue
                  </button>
                </div>
              )}

              {/* Step 2: Read & Acknowledge confirmation */}
              {flowStep === 'ack' && (
                <div>
                  <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: 24, marginBottom: 20 }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={acknowledged}
                        onChange={e => setAcknowledged(e.target.checked)}
                        style={{ marginTop: 3, width: 18, height: 18 }}
                      />
                      <span style={{ fontSize: '0.95rem', fontWeight: 500, lineHeight: 1.5 }}>
                        I confirm that I have read and understood the content of <strong>{activeCourse.title}</strong>,
                        and I agree to apply this knowledge, worker obligations and escalation procedures in my daily support practice.
                      </span>
                    </label>
                  </div>
                  <button
                    disabled={!acknowledged || submitting}
                    onClick={handleAcknowledge}
                    className="heroPillBtn filled sm"
                    style={{ opacity: acknowledged ? 1 : 0.5 }}
                  >
                    {submitting ? 'Recording...' : 'Mark as Complete ✓'}
                  </button>
                </div>
              )}

              {/* Step 3: Interactive Quiz (5 Questions) */}
              {flowStep === 'quiz' && activeCourse.quiz_questions && (
                <div>
                  {(() => {
                    const questions = activeCourse.quiz_questions ?? [];
                    const q = questions[quizPage];
                    if (!q) return null;
                    return (
                      <div style={{ maxWidth: 640 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>
                            Knowledge Check · Question {quizPage + 1} of {questions.length}
                          </span>
                          <span style={{ fontSize: '0.78rem', background: '#EDE9FE', color: '#6D28D9', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
                            Pass Mark: {activeCourse.pass_mark_pct}%
                          </span>
                        </div>

                        <div style={{ background: '#F8FAFC', border: '1px solid #EEF2F6', borderRadius: 12, padding: 24, marginBottom: 20 }}>
                          <p style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 20, color: '#0F172A', lineHeight: 1.4 }}>
                            {q.question}
                          </p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {q.options.map((opt, oi) => (
                              <label
                                key={oi}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 12,
                                  padding: '12px 16px',
                                  border: '1.5px solid',
                                  borderRadius: 8,
                                  cursor: 'pointer',
                                  borderColor: quizAnswers[quizPage] === oi ? '#0284C7' : '#E2E8F0',
                                  background: quizAnswers[quizPage] === oi ? '#EFF6FF' : '#fff'
                                }}
                              >
                                <input
                                  type="radio"
                                  name={'q' + quizPage}
                                  checked={quizAnswers[quizPage] === oi}
                                  onChange={() => setQuizAnswers(p => ({ ...p, [quizPage]: oi }))}
                                />
                                <span style={{ fontSize: '0.92rem', color: '#1E293B' }}>{opt}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 10 }}>
                          {quizPage > 0 && (
                            <button onClick={() => setQuizPage(p => p - 1)} className="crmViewBtn">
                              ← Previous
                            </button>
                          )}
                          {quizPage < questions.length - 1 ? (
                            <button
                              onClick={() => setQuizPage(p => p + 1)}
                              disabled={quizAnswers[quizPage] === undefined}
                              className="heroPillBtn filled sm"
                              style={{ opacity: quizAnswers[quizPage] !== undefined ? 1 : 0.5 }}
                            >
                              Next Question →
                            </button>
                          ) : (
                            <button
                              onClick={handleQuizSubmit}
                              disabled={submitting || Object.keys(quizAnswers).length < questions.length}
                              className="heroPillBtn filled sm"
                            >
                              {submitting ? 'Submitting & Evaluating...' : 'Submit Assessment'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Step 4: Assessment Result */}
              {flowStep === 'result' && lastResult && (
                <div style={{ textAlign: 'center', padding: 40, maxWidth: 540, margin: '0 auto' }}>
                  {lastResult.passed ? (
                    <>
                      <CheckCircle2 size={64} style={{ color: '#059669', marginBottom: 16 }}/>
                      <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#059669' }}>
                        Training Assessment Passed!
                      </h3>
                      <p style={{ color: '#475569', marginTop: 8, fontSize: '0.95rem' }}>
                        Score: <strong>{lastResult.score}%</strong> · Pass threshold: {activeCourse.pass_mark_pct}%
                      </p>
                      {lastResult.certId && (
                        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, margin: '16px 0', fontSize: '0.85rem', color: '#64748B' }}>
                          Certificate Number: <strong style={{ color: '#0F172A' }}>{lastResult.certId}</strong>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 24 }}>
                        <button
                          onClick={() => {
                            const comp = completions.find(c => c.course_id === activeCourseId);
                            if (comp) window.open('/api/training/certificate?completion_id=' + comp.id, '_blank');
                          }}
                          className="actionBtn approve"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px' }}
                        >
                          <Award size={14}/> View / Print Certificate
                        </button>
                        <button onClick={() => setActiveCourseId(null)} className="crmViewBtn">
                          Back to Training List
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 60, marginBottom: 16 }}>📝</div>
                      <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#DC2626' }}>
                        Assessment Score Below Pass Mark
                      </h3>
                      <p style={{ color: '#64748B', marginTop: 8 }}>
                        Your score: <strong>{lastResult.score}%</strong> · Required: <strong>{activeCourse.pass_mark_pct}%</strong>
                      </p>
                      <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: 8 }}>
                        Review the training material to reinforce the key responsibilities, then try again.
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 24 }}>
                        <button
                          onClick={() => { setFlowStep('quiz'); setQuizAnswers({}); setQuizPage(0); }}
                          className="heroPillBtn filled sm"
                        >
                          Retry Quiz
                        </button>
                        <button onClick={() => setFlowStep('material')} className="crmViewBtn">
                          Review PDF Material
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════ */}
          {/* MODAL: UPLOAD EXTERNAL CERTIFICATE EVIDENCE               */}
          {/* ═════════════════════════════════════════════════════════ */}
          {uploadModalOpen && (
            <div className="crmModalOverlay" onClick={() => setUploadModalOpen(false)}>
              <div className="crmModalBox" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
                <div className="crmModalHeader">
                  <div>
                    <span className="refIdTag">EXTERNAL EVIDENCE</span>
                    <h3 style={{ marginTop: 4 }}>Record External Training Completion</h3>
                  </div>
                  <button onClick={() => setUploadModalOpen(false)} className="crmModalClose">&times;</button>
                </div>

                <div style={{ padding: 24 }}>
                  <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: 16 }}>
                    Course: <strong style={{ color: '#0F172A' }}>{uploadCourseTitle}</strong>
                  </p>

                  <form onSubmit={handleExternalCertUpload}>
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                        Issuing Provider
                      </label>
                      <input
                        value={extIssuer}
                        onChange={e => setExtIssuer(e.target.value)}
                        placeholder="e.g. NDIS Commission, NSW ADC, St John Ambulance"
                        required
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: '0.9rem' }}
                      />
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                        Certificate / Expiry Date (if applicable)
                      </label>
                      <input
                        type="date"
                        value={extExpiry}
                        onChange={e => setExtExpiry(e.target.value)}
                        style={{ padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: '0.9rem' }}
                      />
                    </div>

                    <div style={{ marginBottom: 20 }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                        Upload Certificate File (PDF/Image)
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        ref={fileRef}
                        onChange={e => setExtFile(e.target.files?.[0] ?? null)}
                        style={{ fontSize: '0.88rem' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        type="submit"
                        disabled={uploadingCert}
                        className="heroPillBtn filled sm"
                        style={{ flex: 1 }}
                      >
                        <Upload size={14}/> {uploadingCert ? 'Recording...' : 'Submit Evidence'}
                      </button>
                      <button type="button" onClick={() => setUploadModalOpen(false)} className="crmViewBtn">
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
