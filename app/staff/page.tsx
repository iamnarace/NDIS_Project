'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  GraduationCap, BookOpen, CheckCircle2, Clock, AlertCircle,
  Upload, ExternalLink, LogOut, Award, ChevronRight, AlertTriangle
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
}
interface TrainingAttempt { id: string; course_id: string; score_pct: number; passed: boolean; attempted_at: string; }

/* ── Status helper ──────────────────────────────────────────── */
function getStatus(
  completion: TrainingCompletion | undefined,
  assignment: TrainingAssignment | undefined
): { label: string; color: string; bg: string; icon: React.ReactNode } {
  const now = new Date();
  if (completion) {
    if (completion.expires_at) {
      const d = Math.ceil((new Date(completion.expires_at).getTime() - now.getTime()) / 86400000);
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

/* ── Demo staff identity (replace with real auth later) ──── */
const DEMO_STAFF = { id: 'STF-001', name: 'James Wilson', role: 'Disability Support Worker' };

/* ══════════════════════════════════════════════════════════════ */
export default function StaffTrainingPage() {
  const [staffId] = useState(DEMO_STAFF.id);
  const [staffName] = useState(DEMO_STAFF.name);

  const [assignments, setAssignments] = useState<TrainingAssignment[]>([]);
  const [completions, setCompletions] = useState<TrainingCompletion[]>([]);
  const [attempts, setAttempts] = useState<TrainingAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  // Active training flow
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [flowStep, setFlowStep] = useState<'material' | 'ack' | 'quiz' | 'result' | 'cert_upload'>('material');
  const [acknowledged, setAcknowledged] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizPage, setQuizPage] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<{ passed: boolean; score: number; certId?: string } | null>(null);

  // External cert upload
  const [extIssuer, setExtIssuer] = useState('');
  const [extExpiry, setExtExpiry] = useState('');
  const [extFile, setExtFile] = useState<File | null>(null);
  const [uploadingCert, setUploadingCert] = useState(false);
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
      const [aRes, cRes, atRes] = await Promise.all([
        fetch('/api/training/assignments?staff_id=' + staffId),
        fetch('/api/training/completions?staff_id=' + staffId),
        fetch('/api/training/attempts?staff_id=' + staffId),
      ]);
      if (aRes.ok) setAssignments(await aRes.json());
      if (cRes.ok) setCompletions(await cRes.json());
      if (atRes.ok) setAttempts(await atRes.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
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
      setFlowStep('cert_upload'); // show cert / re-upload for external
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
      if (res.ok) { await loadData(); setFlowStep('result'); setLastResult({ passed: true, score: 100 }); }
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
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
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  }

  async function handleExternalCertUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!activeCourseId || !extFile) return;
    setUploadingCert(true);
    try {
      const fd = new FormData();
      fd.append('file', extFile);
      fd.append('course_id', activeCourseId);
      fd.append('assignment_id', activeAssignment?.id ?? '');
      fd.append('staff_id', staffId);
      fd.append('staff_name', staffName);
      fd.append('external_issuer', extIssuer);
      fd.append('external_expiry_date', extExpiry);
      const res = await fetch('/api/training/completions', { method: 'PATCH', body: fd });
      if (res.ok) { await loadData(); setActiveCourseId(null); }
    } catch (e) { console.error(e); }
    finally { setUploadingCert(false); }
  }

  // Count for compliance summary
  const mandatory = assignments.filter(a => a.training_courses?.is_mandatory);
  const mandatoryDone = mandatory.filter(a => completions.some(c => c.course_id === a.course_id && c.passed));
  const compliancePct = mandatory.length > 0 ? Math.round((mandatoryDone.length / mandatory.length) * 100) : 100;

  return (
    <div className="portalDashWrap">
      {/* Top Bar */}
      <header className="portalDashNav">
        <div className="shell portalDashNavInner">
          <div className="portalNavBrand">
            <Link href="/"><Image src="/brand/Opus_Care_Logo_Transparent.png" alt="Opus Care" width={160} height={44} className="portalNavLogo"/></Link>
            <span className="portalBadgeParticipant" style={{ background: '#7C3AED', color: '#fff' }}>STAFF TRAINING PORTAL</span>
          </div>
          <div className="portalNavActions">
            <Link href="/admin" className="portalStaffLink"><span>Staff CRM</span><ChevronRight size={14}/></Link>
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

          {/* Compliance Summary Bar */}
          <div className="portalWelcomeRow" style={{ marginBottom: 24 }}>
            <div>
              <h1 className="portalWelcomeTitle">My Training &amp; Compliance</h1>
              <p className="portalWelcomeSub">Complete assigned training, upload certificates, and track your compliance status.</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: 4 }}>Mandatory Compliance</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 120, height: 10, background: '#F1F5F9', borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{ width: compliancePct + '%', height: '100%', borderRadius: 5,
                    background: compliancePct === 100 ? '#059669' : compliancePct >= 60 ? '#D97706' : '#DC2626' }}/>
                </div>
                <span style={{ fontWeight: 700, fontSize: '1.1rem',
                  color: compliancePct === 100 ? '#059669' : compliancePct >= 60 ? '#D97706' : '#DC2626' }}>
                  {compliancePct}%
                </span>
              </div>
            </div>
          </div>

          {loading && <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>Loading your training...</div>}

          {/* Training List */}
          {!loading && !activeCourseId && (
            <div className="portalSectionBlock">
              <div className="portalBlockHead">
                <div>
                  <h3>Assigned Training Modules</h3>
                  <p>Click Start or Continue to begin a training module.</p>
                </div>
              </div>

              {assignments.length === 0 && (
                <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>
                  <GraduationCap size={40} style={{ opacity: 0.3, marginBottom: 8 }}/>
                  <p>No training has been assigned yet. Check back soon.</p>
                </div>
              )}

              <div className="portalInvoicesTableWrap">
                <table className="portalTable">
                  <thead><tr>
                    <th>Course</th><th>Type</th><th>Status</th><th>Due / Expiry</th><th>Actions</th>
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
                        : a.due_date ? 'Due ' + new Date(a.due_date).toLocaleDateString('en-AU') : 'No deadline';

                      return (
                        <tr key={a.id}>
                          <td>
                            <strong>{course.title}</strong>
                            {course.description && <div style={{ fontSize: '0.8rem', color: '#64748B' }}>{course.description}</div>}
                            {course.is_mandatory && <span style={{ fontSize: '0.72rem', color: '#DC2626', fontWeight: 700, marginTop: 2, display: 'block' }}>MANDATORY</span>}
                          </td>
                          <td><span style={{ padding: '3px 8px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
                            background: course.course_type === 'read_acknowledge' ? '#DBEAFE' : course.course_type === 'read_quiz' ? '#EDE9FE' : '#D1FAE5',
                            color: course.course_type === 'read_acknowledge' ? '#1D4ED8' : course.course_type === 'read_quiz' ? '#7C3AED' : '#059669' }}>
                            {course.course_type === 'read_acknowledge' ? 'Read & Ack' : course.course_type === 'read_quiz' ? 'Quiz' : 'Ext. Cert'}
                          </span></td>
                          <td><span style={{ padding: '3px 8px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4, background: st.bg, color: st.color }}>
                            {st.icon} {st.label}
                          </span></td>
                          <td style={{ fontSize: '0.85rem', color: '#64748B' }}>{dateLabel}</td>
                          <td>
                            {completion && course.certificate_enabled && completion.certificate_id && (
                              <a href={'/api/training/certificate?completion_id=' + completion.id} target="_blank" rel="noopener noreferrer"
                                className="actionBtn approve" style={{ textDecoration: 'none', display: 'inline-block', marginRight: 6 }}>
                                <Award size={12}/> Certificate
                              </a>
                            )}
                            {completion && course.course_type === 'external_cert' && (
                              <button className="actionBtn approve" onClick={() => openCourse(a.course_id)}>Upload Renewal</button>
                            )}
                            {!completion && !maxReached && (
                              <button className="actionBtn approve" onClick={() => openCourse(a.course_id)}>
                                {attempts.some(x => x.course_id === a.course_id) ? 'Retry' : 'Start'}
                              </button>
                            )}
                            {maxReached && <span style={{ fontSize: '0.8rem', color: '#DC2626' }}>Max attempts reached</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: 8 }}>
                NDIS Commission and other accredited training must be completed on the official portal.
                Upload your certificate above for our records.
              </p>
            </div>
          )}

          {/* ── Active Training Flow ── */}
          {!loading && activeCourseId && activeCourse && (
            <div className="portalSectionBlock">
              <button onClick={() => setActiveCourseId(null)} style={{ border: 'none', background: 'none', color: '#0284C7', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', marginBottom: 16, padding: 0 }}>
                ← Back to My Training
              </button>

              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0F172A' }}>{activeCourse.title}</h3>
                {activeCourse.description && <p style={{ color: '#64748B', marginTop: 4 }}>{activeCourse.description}</p>}
              </div>

              {/* Step: View Material */}
              {flowStep === 'material' && (
                <div>
                  <div style={{ background: '#F8FAFC', border: '1px solid #EEF2F6', borderRadius: 12, padding: 24, marginBottom: 20 }}>
                    <p style={{ fontWeight: 600, marginBottom: 12 }}>Step 1: Review the training material</p>
                    {activeCourse.material_url && (
                      <a href={activeCourse.material_url} target="_blank" rel="noopener noreferrer"
                        className="actionBtn approve" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <ExternalLink size={14}/> Open {activeCourse.material_type.toUpperCase()} Material
                      </a>
                    )}
                  </div>
                  <button className="heroPillBtn filled sm" onClick={() => setFlowStep(activeCourse.course_type === 'read_quiz' ? 'ack' : 'ack')}>
                    I have reviewed the material →
                  </button>
                </div>
              )}

              {/* Step: Acknowledge */}
              {flowStep === 'ack' && activeCourse.course_type === 'read_acknowledge' && (
                <div>
                  <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: 24, marginBottom: 20 }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                      <input type="checkbox" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)}
                        style={{ marginTop: 3, width: 18, height: 18 }}/>
                      <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>
                        I confirm that I have read and understood the content of <strong>{activeCourse.title}</strong>,
                        and I agree to apply this knowledge in my work as a support worker.
                      </span>
                    </label>
                  </div>
                  <button disabled={!acknowledged || submitting} onClick={handleAcknowledge}
                    className="heroPillBtn filled sm" style={{ opacity: acknowledged ? 1 : 0.5 }}>
                    {submitting ? 'Recording...' : 'Mark as Complete ✓'}
                  </button>
                </div>
              )}

              {/* Step: Acknowledge before quiz */}
              {flowStep === 'ack' && activeCourse.course_type === 'read_quiz' && (
                <div>
                  <div style={{ background: '#EEF2F6', borderRadius: 12, padding: 20, marginBottom: 20 }}>
                    <p style={{ fontWeight: 600, marginBottom: 4 }}>Ready to take the quiz?</p>
                    <p style={{ fontSize: '0.88rem', color: '#64748B' }}>
                      Pass mark: <strong>{activeCourse.pass_mark_pct}%</strong>
                      {activeCourse.max_attempts && <span> · Max attempts: {activeCourse.max_attempts}</span>}
                    </p>
                  </div>
                  <button onClick={() => setFlowStep('quiz')} className="heroPillBtn filled sm">
                    Start Quiz ({(activeCourse.quiz_questions ?? []).length} questions) →
                  </button>
                </div>
              )}

              {/* Step: Quiz */}
              {flowStep === 'quiz' && activeCourse.quiz_questions && (
                <div>
                  {(() => {
                    const questions = activeCourse.quiz_questions ?? [];
                    const q = questions[quizPage];
                    if (!q) return null;
                    return (
                      <div style={{ maxWidth: 640 }}>
                        <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginBottom: 8 }}>
                          Question {quizPage + 1} of {questions.length}
                        </div>
                        <div style={{ background: '#F8FAFC', border: '1px solid #EEF2F6', borderRadius: 12, padding: 24, marginBottom: 20 }}>
                          <p style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 20 }}>{q.question}</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {q.options.map((opt, oi) => (
                              <label key={oi} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                                border: '1.5px solid', borderRadius: 8, cursor: 'pointer',
                                borderColor: quizAnswers[quizPage] === oi ? '#0284C7' : '#E2E8F0',
                                background: quizAnswers[quizPage] === oi ? '#EFF6FF' : '#fff' }}>
                                <input type="radio" name={'q' + quizPage} checked={quizAnswers[quizPage] === oi}
                                  onChange={() => setQuizAnswers(p => ({ ...p, [quizPage]: oi }))}/>
                                <span style={{ fontSize: '0.95rem' }}>{opt}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                          {quizPage > 0 && (
                            <button onClick={() => setQuizPage(p => p - 1)} className="crmViewBtn">← Back</button>
                          )}
                          {quizPage < questions.length - 1 ? (
                            <button onClick={() => setQuizPage(p => p + 1)} disabled={quizAnswers[quizPage] === undefined}
                              className="heroPillBtn filled sm" style={{ opacity: quizAnswers[quizPage] !== undefined ? 1 : 0.5 }}>
                              Next Question →
                            </button>
                          ) : (
                            <button onClick={handleQuizSubmit}
                              disabled={submitting || Object.keys(quizAnswers).length < questions.length}
                              className="heroPillBtn filled sm">
                              {submitting ? 'Submitting...' : 'Submit Quiz'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Step: Result */}
              {flowStep === 'result' && lastResult && (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  {lastResult.passed ? (
                    <>
                      <CheckCircle2 size={64} style={{ color: '#059669', marginBottom: 16 }}/>
                      <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#059669' }}>
                        {activeCourse.course_type === 'read_acknowledge' ? 'Acknowledged & Complete!' : 'Quiz Passed!'}
                      </h3>
                      {lastResult.score < 100 && <p style={{ color: '#64748B', marginTop: 8 }}>Score: {lastResult.score}%</p>}
                      {lastResult.certId && (
                        <p style={{ color: '#64748B', marginTop: 4, fontSize: '0.88rem' }}>
                          Certificate ID: <strong>{lastResult.certId}</strong>
                        </p>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 24 }}>
                        {lastResult.certId && (
                          <a href={'/api/training/certificate?completion_id=' + (completions.find(c => c.course_id === activeCourseId)?.id ?? '')}
                            target="_blank" rel="noopener noreferrer" className="actionBtn approve"
                            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <Award size={14}/> View Certificate
                          </a>
                        )}
                        <button onClick={() => setActiveCourseId(null)} className="crmViewBtn">Back to My Training</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 64, marginBottom: 16 }}>📝</div>
                      <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#DC2626' }}>Not Passed — Try Again</h3>
                      <p style={{ color: '#64748B', marginTop: 8 }}>
                        Your score: <strong>{lastResult.score}%</strong> · Pass mark: <strong>{activeCourse.pass_mark_pct}%</strong>
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 24 }}>
                        <button onClick={() => { setFlowStep('quiz'); setQuizAnswers({}); setQuizPage(0); }} className="heroPillBtn filled sm">
                          Try Again
                        </button>
                        <button onClick={() => setActiveCourseId(null)} className="crmViewBtn">Back</button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Step: External certificate upload */}
              {flowStep === 'cert_upload' && (
                <div style={{ maxWidth: 520 }}>
                  <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: 16, marginBottom: 20, fontSize: '0.88rem', color: '#1E40AF' }}>
                    <strong>External Certificate Upload</strong><br/>
                    Upload your certificate from the official issuing body (e.g. NDIS Commission, First Aid provider).
                    This is for tracking only — the original training was completed externally.
                  </div>
                  {activeCompletion && (
                    <div style={{ background: '#D1FAE5', border: '1px solid #A7F3D0', borderRadius: 10, padding: 12, marginBottom: 20, fontSize: '0.88rem', color: '#065F46' }}>
                      Currently recorded: Issued by {activeCompletion.cert_file_name ?? 'On file'}
                      {activeCompletion.expires_at && ' · Expires ' + new Date(activeCompletion.expires_at).toLocaleDateString('en-AU')}
                    </div>
                  )}
                  <form onSubmit={handleExternalCertUpload}>
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Certificate File (PDF) *</label>
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" ref={fileRef} required
                        onChange={e => setExtFile(e.target.files?.[0] ?? null)}
                        style={{ fontSize: '0.88rem' }}/>
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Issuing Organisation</label>
                      <input value={extIssuer} onChange={e => setExtIssuer(e.target.value)} placeholder="e.g. St John Ambulance"
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: '0.9rem' }}/>
                    </div>
                    <div style={{ marginBottom: 20 }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Certificate Expiry Date *</label>
                      <input type="date" value={extExpiry} onChange={e => setExtExpiry(e.target.value)} required
                        style={{ padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: '0.9rem' }}/>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button type="submit" disabled={uploadingCert} className="heroPillBtn filled sm">
                        <Upload size={14}/> {uploadingCert ? 'Uploading...' : 'Upload Certificate'}
                      </button>
                      <button type="button" onClick={() => setActiveCourseId(null)} className="crmViewBtn">Cancel</button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
