'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Users, UserCheck, FileText, Phone, Mail, MapPin, Calendar, 
  CheckCircle2, Clock, AlertCircle, ArrowRight, Search, Filter, 
  Plus, Shield, Sparkles, RefreshCw, ExternalLink, Lock, LogOut,
  Columns, List, UserPlus, FileCheck, MessageSquare, History, Check
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
  name: string;
  role: string;
  phone: string;
  email: string;
  suburbs: string[];
  ndisScreening: string;
  wwcc: string;
  firstAid: string;
  status: string;
}

interface Activity {
  id: string;
  activity_type: string;
  title: string;
  description: string;
  author_name: string;
  created_at: string;
}

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

  const [tab, setTab] = useState<'referrals' | 'participants' | 'staff'>('referrals');
  const [viewMode, setViewMode] = useState<'pipeline' | 'table'>('pipeline');
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);

  // Activity Timeline State
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteType, setNewNoteType] = useState<'note' | 'call' | 'email' | 'meeting'>('note');
  const [noteSaving, setNoteSaving] = useState(false);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (selectedReferral) {
      loadActivities(selectedReferral.id);
    } else {
      setActivities([]);
    }
  }, [selectedReferral]);

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

  async function loadActivities(referralId: string) {
    setActivitiesLoading(true);
    try {
      const res = await fetch(`/api/crm/activities?referralId=${encodeURIComponent(referralId)}`);
      if (res.ok) {
        setActivities(await res.json());
      }
    } catch (err) {
      console.error('Failed to load activities', err);
    } finally {
      setActivitiesLoading(false);
    }
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!newNoteText.trim() || !selectedReferral) return;
    setNoteSaving(true);
    try {
      const res = await fetch('/api/crm/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referralId: selectedReferral.id,
          activityType: newNoteType,
          title: newNoteType === 'call' ? 'Phone Call Logged' : newNoteType === 'email' ? 'Email Follow-up' : 'Staff Case Note',
          description: newNoteText.trim(),
          authorName: 'Opus Staff'
        })
      });
      if (res.ok) {
        setNewNoteText('');
        loadActivities(selectedReferral.id);
        setStatusNotice('Activity note added to timeline.');
        setTimeout(() => setStatusNotice(''), 3000);
      }
    } catch (err) {
      console.error('Failed to save activity', err);
    } finally {
      setNoteSaving(false);
    }
  }

  async function handleConvertToParticipant(referral: Referral) {
    if (converting) return;
    setConverting(true);
    setStatusNotice('');
    try {
      const res = await fetch('/api/crm/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referralId: referral.id,
          allocatedHours: 12
        })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setStatusNotice(`✓ Successfully converted ${referral.participantName || referral.name} to active participant!`);
        setTimeout(() => setStatusNotice(''), 4000);
        loadAllData();
        if (selectedReferral?.id === referral.id) {
          setSelectedReferral(prev => prev ? { ...prev, status: 'accepted' } : null);
          loadActivities(referral.id);
        }
      } else {
        setStatusNotice(data.message || 'Failed to convert referral.');
      }
    } catch (err) {
      setStatusNotice('Connection error during conversion.');
    } finally {
      setConverting(false);
    }
  }

  async function handleStatusChange(id: string, newStatus: Referral['status']) {
    setStatusNotice('');
    try {
      const res = await fetch('/api/referral', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setReferrals(prev =>
          prev.map(r => (r.id === id ? { ...r, status: newStatus } : r))
        );
        if (selectedReferral?.id === id) {
          setSelectedReferral(prev => prev ? { ...prev, status: newStatus } : null);
          loadActivities(id);
        }
        setStatusNotice('Referral status updated.');
        setTimeout(() => setStatusNotice(''), 3000);
      } else {
        setStatusNotice('Failed to update referral status.');
      }
    } catch (err) {
      setStatusNotice('Connection error while updating status.');
    }
  }

  const filteredReferrals = referrals.filter(r => {
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchesSearch = 
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.participantName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.suburb?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.referenceNumber && r.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const countNew = referrals.filter(r => r.status === 'new').length;

  if (isAuth === null) {
    return (
      <div className="crmLoginWrap">
        <div className="crmLoginCard">
          <RefreshCw size={32} className="spin" style={{ color: '#0284c7', margin: '0 auto 16px', display: 'block' }} />
          <p style={{ color: '#64748b', fontSize: '15px', fontWeight: 500 }}>Verifying secure administrator session...</p>
        </div>
      </div>
    );
  }

  if (!isAuth) {
    return (
      <div className="crmLoginWrap">
        <div className="crmLoginCard">
          <div className="crmLoginBrand">
            <Link href="/">
              <Image
                src="/brand/Opus_Care_Logo_Transparent.png"
                alt="Opus Care Support Services"
                width={190}
                height={50}
                className="crmLogo"
                style={{ margin: '0 auto 16px', display: 'block' }}
              />
            </Link>
            <div className="crmLoginBadge">
              <Shield size={14} />
              <span>Restricted Admin Portal</span>
            </div>
            <h2 className="crmLoginTitle">NDIS Operations Login</h2>
            <p className="crmLoginSub">
              Authorized Opus Care staff & management access only. Participant PII & records are protected under the Australian Privacy Act.
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
                  placeholder="Enter Opus Admin Access Key..."
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
    <div className="crmRoot">
      {/* Top CRM Header Bar */}
      <header className="crmHeader">
        <div className="crmHeaderContainer">
          <div className="crmBrandGroup">
            <Link href="/">
              <Image
                src="/brand/Opus_Care_Logo_Transparent.png"
                alt="Opus Care"
                width={160}
                height={42}
                className="crmLogo"
              />
            </Link>
            <span className="crmBadge">NDIS Operations CRM</span>
          </div>

          <div className="crmHeaderActions">
            <button onClick={loadAllData} className="crmRefreshBtn" title="Refresh data">
              <RefreshCw size={16} /> <span>Refresh</span>
            </button>
            <Link href="/" className="crmPublicSiteBtn">
              <span>View Public Website</span> <ExternalLink size={14} />
            </Link>
            <button onClick={handleLogout} className="crmSignOutBtn" title="Sign out of Admin CRM">
              <LogOut size={15} /> <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {statusNotice && (
        <div style={{
          background: '#ecfdf5',
          color: '#065f46',
          borderBottom: '1px solid #a7f3d0',
          padding: '10px 24px',
          textAlign: 'center',
          fontSize: '0.875rem',
          fontWeight: 600
        }}>
          {statusNotice}
        </div>
      )}

      {/* Main CRM Body */}
      <main className="crmMainContainer">
        
        {/* Metric Cards Row */}
        <div className="crmMetricsRow">
          <div className="crmMetricCard">
            <span className="metricCardLabel">Total Inbound Referrals</span>
            <strong className="metricCardVal">{referrals.length}</strong>
            <small className="metricCardSub">Pipeline records</small>
          </div>
          <div className="crmMetricCard highlight">
            <span className="metricCardLabel">New / Uncontacted</span>
            <strong className="metricCardVal">{countNew}</strong>
            <small className="metricCardSub">Requires prompt follow-up</small>
          </div>
          <div className="crmMetricCard">
            <span className="metricCardLabel">Active Participants</span>
            <strong className="metricCardVal">{participants.length}</strong>
            <small className="metricCardSub">Receiving NDIS support</small>
          </div>
          <div className="crmMetricCard">
            <span className="metricCardLabel">Support Staff on Roster</span>
            <strong className="metricCardVal">{staff.length}</strong>
            <small className="metricCardSub">Northern Rivers cleared</small>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="crmTabsNav">
          <button
            onClick={() => setTab('referrals')}
            className={`crmTabBtn ${tab === 'referrals' ? 'active' : ''}`}
          >
            <FileText size={18} />
            <span>Referrals Pipeline</span>
            {countNew > 0 && <span className="crmTabBadge">{countNew}</span>}
          </button>
          <button
            onClick={() => setTab('participants')}
            className={`crmTabBtn ${tab === 'participants' ? 'active' : ''}`}
          >
            <Users size={18} />
            <span>Participants Directory ({participants.length})</span>
          </button>
          <button
            onClick={() => setTab('staff')}
            className={`crmTabBtn ${tab === 'staff' ? 'active' : ''}`}
          >
            <UserCheck size={18} />
            <span>Staff &amp; Workers ({staff.length})</span>
          </button>
        </div>

        {/* TAB 1: REFERRALS PIPELINE */}
        {tab === 'referrals' && (
          <div className="crmTabPanel">
            {/* Filter & View Mode Toolbar */}
            <div className="crmToolbar">
              <div className="crmSearchWrap">
                <Search size={16} className="crmSearchIcon" />
                <input
                  type="text"
                  placeholder="Search by participant, ref number, or suburb..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="crmSearchInput"
                />
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {/* View Switcher: Pipeline (Kanban) vs Table */}
                <div className="crmViewToggleGroup">
                  <button
                    type="button"
                    onClick={() => setViewMode('pipeline')}
                    className={`crmViewToggleBtn ${viewMode === 'pipeline' ? 'active' : ''}`}
                  >
                    <Columns size={15} />
                    <span>Pipeline</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`crmViewToggleBtn ${viewMode === 'table' ? 'active' : ''}`}
                  >
                    <List size={15} />
                    <span>Table</span>
                  </button>
                </div>

                <div className="crmFilterGroup">
                  <Filter size={16} />
                  <span>Filter:</span>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="crmSelect"
                  >
                    <option value="all">All Stages ({referrals.length})</option>
                    <option value="new">New ({referrals.filter(r => r.status === 'new').length})</option>
                    <option value="contacted">Contacted ({referrals.filter(r => r.status === 'contacted').length})</option>
                    <option value="assessment">Assessment ({referrals.filter(r => r.status === 'assessment').length})</option>
                    <option value="agreement_sent">Agreement Sent ({referrals.filter(r => r.status === 'agreement_sent').length})</option>
                    <option value="accepted">Active Participant ({referrals.filter(r => r.status === 'accepted' || (r.status as any) === 'active').length})</option>
                  </select>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="crmLoadingState">Loading referrals from database...</div>
            ) : filteredReferrals.length === 0 ? (
              <div className="crmEmptyState">No referrals match your filter criteria.</div>
            ) : viewMode === 'pipeline' ? (
              /* KANBAN BOARD VIEW */
              <div className="crmKanbanContainer">
                {PIPELINE_STAGES.map((stage) => {
                  const stageReferrals = filteredReferrals.filter(
                    r => r.status === stage.id || (stage.id === 'accepted' && (r.status as any) === 'active')
                  );
                  return (
                    <div key={stage.id} className="crmKanbanCol">
                      <div className="crmKanbanColHeader">
                        <span className="crmKanbanColTitle">
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: stage.color }} />
                          {stage.label}
                        </span>
                        <span className="crmKanbanBadge" style={{ background: stage.bg, color: stage.color }}>
                          {stageReferrals.length}
                        </span>
                      </div>

                      <div className="crmKanbanCardsList">
                        {stageReferrals.map((ref) => (
                          <div
                            key={ref.id}
                            onClick={() => setSelectedReferral(ref)}
                            className="crmKanbanCard"
                            style={{ borderLeftColor: stage.color }}
                          >
                            <div className="crmKanbanCardHeader">
                              <span className="crmKanbanRefNumber">{ref.referenceNumber || ref.id}</span>
                              <span className="crmKanbanCardDate">
                                {new Date(ref.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                              </span>
                            </div>

                            <div className="crmKanbanParticipantName">
                              {ref.participantName || ref.name}
                            </div>

                            <div className="crmKanbanCardDetails">
                              <span><MapPin size={12} /> {ref.suburb}</span>
                              <span><Users size={12} /> {ref.name} ({ref.role})</span>
                            </div>

                            <div className="crmKanbanCardFooter">
                              <span className="crmFundingTagMini">{ref.funding}</span>
                              <small style={{ color: '#64748b', fontSize: '0.725rem' }}>View details →</small>
                            </div>
                          </div>
                        ))}

                        {stageReferrals.length === 0 && (
                          <div style={{ padding: '24px 12px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
                            No referrals in this stage
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* TABLE / LIST VIEW */
              <div className="crmTableWrapper">
                <table className="crmTable">
                  <thead>
                    <tr>
                      <th>Ref ID &amp; Date</th>
                      <th>Contact / Role</th>
                      <th>Participant Name</th>
                      <th>Location</th>
                      <th>Funding &amp; Services</th>
                      <th>Stage</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReferrals.map((ref) => (
                      <tr key={ref.id} className={ref.status === 'new' ? 'rowNew' : ''}>
                        <td>
                          <span className="refIdTag">{ref.referenceNumber || ref.id}</span>
                          <small className="refDate">
                            {new Date(ref.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                          </small>
                        </td>
                        <td>
                          <strong>{ref.name}</strong>
                          <span className="refRolePill">{ref.role}</span>
                          <div className="refContactMini">
                            <a href={`tel:${ref.phone}`}>{ref.phone}</a>
                          </div>
                        </td>
                        <td>
                          <strong className="partName">{ref.participantName || ref.name}</strong>
                        </td>
                        <td>
                          <span className="suburbBadge"><MapPin size={13} /> {ref.suburb}</span>
                        </td>
                        <td>
                          <div className="fundingPillMini">{ref.funding}</div>
                          <small className="servicesSnippet">{ref.services}</small>
                        </td>
                        <td>
                          <select
                            value={ref.status}
                            onChange={(e) => handleStatusChange(ref.id, e.target.value as any)}
                            className={`crmStatusSelect status_${ref.status}`}
                          >
                            <option value="new">🟢 New Referral</option>
                            <option value="contacted">🟡 Contacted</option>
                            <option value="assessment">🟣 Assessment</option>
                            <option value="agreement_sent">📄 Agreement Sent</option>
                            <option value="accepted">✅ Active Participant</option>
                            <option value="closed">⚪ Closed</option>
                          </select>
                        </td>
                        <td>
                          <button
                            onClick={() => setSelectedReferral(ref)}
                            className="crmViewBtn"
                          >
                            Details
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

        {/* TAB 2: PARTICIPANTS DIRECTORY */}
        {tab === 'participants' && (
          <div className="crmTabPanel">
            <div className="crmPanelHeader">
              <div>
                <h3>Active Participant Directory</h3>
                <p>Track active NDIS participants, NDIS numbers, plan types, and assigned workers.</p>
              </div>
            </div>

            <div className="crmTableWrapper">
              <table className="crmTable">
                <thead>
                  <tr>
                    <th>Participant ID &amp; Name</th>
                    <th>NDIS Number</th>
                    <th>Location</th>
                    <th>Funding Model</th>
                    <th>Weekly Hours</th>
                    <th>Worker Assigned</th>
                    <th>Nominee / Coordinator</th>
                    <th>Service Agreement</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <strong>{p.name}</strong>
                        <small className="refIdTag">{p.referenceNumber || p.id}</small>
                      </td>
                      <td><code>{p.ndisNumber}</code></td>
                      <td><MapPin size={13} /> {p.suburb}</td>
                      <td><span className="fundingPillMini">{p.fundingType}</span></td>
                      <td><strong>{p.allocatedHours} hrs/wk</strong></td>
                      <td><span className="workerPill"><UserCheck size={14} /> {p.workerAssigned}</span></td>
                      <td><small>{p.contactPerson}</small></td>
                      <td>
                        <Link 
                          href="/documents/service-agreement"
                          className="crmActionBtnAgreement"
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                        >
                          <FileCheck size={13} /> <span>Agreement</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: STAFF & WORKERS DIRECTORY */}
        {tab === 'staff' && (
          <div className="crmTabPanel">
            <div className="crmPanelHeader">
              <div>
                <h3>Support Worker Directory &amp; Clearances</h3>
                <p>Monitor NDIS Worker Screening Check (NWSC), WWCC, and regional coverage.</p>
              </div>
            </div>

            <div className="crmTableWrapper">
              <table className="crmTable">
                <thead>
                  <tr>
                    <th>Staff Name &amp; Role</th>
                    <th>Contact Info</th>
                    <th>Suburbs Serviced</th>
                    <th>NDIS Screening Status</th>
                    <th>WWCC Check</th>
                    <th>First Aid</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <strong>{s.name}</strong>
                        <small className="refRolePill">{s.role}</small>
                      </td>
                      <td>
                        <div><Phone size={13} /> {s.phone}</div>
                        <div><Mail size={13} /> {s.email}</div>
                      </td>
                      <td>
                        <div className="staffSuburbsWrap">
                          {s.suburbs.map((sub, i) => (
                            <span key={i} className="miniSuburbChip">{sub}</span>
                          ))}
                        </div>
                      </td>
                      <td><span className="checkPassPill">✓ {s.ndisScreening}</span></td>
                      <td><code>{s.wwcc}</code></td>
                      <td><small>{s.firstAid}</small></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* REFERRAL DETAIL DRAWER & TIMELINE (Atomic CRM Inspired) */}
      {selectedReferral && (
        <div className="crmModalOverlay" onClick={() => setSelectedReferral(null)}>
          <div className="crmModalBox" style={{ maxWidth: 680 }} onClick={(e) => e.stopPropagation()}>
            <div className="crmModalHeader">
              <div>
                <span className="refIdTag">{selectedReferral.referenceNumber || selectedReferral.id}</span>
                <h3>{selectedReferral.participantName || selectedReferral.name}</h3>
                <small style={{ color: '#64748b' }}>Submitted {new Date(selectedReferral.createdAt).toLocaleString('en-AU')}</small>
              </div>
              <button onClick={() => setSelectedReferral(null)} className="crmModalClose">✕</button>
            </div>

            {/* Quick Action Toolbar */}
            <div className="crmModalActionHeader">
              {selectedReferral.status !== 'accepted' && (selectedReferral.status as any) !== 'active' && (
                <button
                  type="button"
                  onClick={() => handleConvertToParticipant(selectedReferral)}
                  disabled={converting}
                  className="crmActionBtnConvert"
                >
                  <UserPlus size={15} />
                  <span>{converting ? 'Converting...' : 'Convert to Active Participant'}</span>
                </button>
              )}

              <Link
                href="/documents/service-agreement"
                className="crmActionBtnAgreement"
                target="_blank"
              >
                <FileCheck size={15} />
                <span>Generate Service Agreement</span>
              </Link>

              <a href={`tel:${selectedReferral.phone}`} className="crmActionBtnAgreement">
                <Phone size={14} />
                <span>Call ({selectedReferral.phone})</span>
              </a>

              <a href={`mailto:${selectedReferral.email}`} className="crmActionBtnAgreement">
                <Mail size={14} />
                <span>Email</span>
              </a>
            </div>

            <div className="crmModalBody">
              {/* Participant & Referral Details Grid */}
              <div className="crmDetailGrid">
                <div>
                  <label>Contact Person / Referrer:</label>
                  <p>{selectedReferral.name} ({selectedReferral.role})</p>
                </div>
                <div>
                  <label>Location / Suburb:</label>
                  <p>{selectedReferral.suburb}</p>
                </div>
                <div>
                  <label>NDIS Funding Model:</label>
                  <p>{selectedReferral.funding}</p>
                </div>
                <div>
                  <label>Services Requested:</label>
                  <p>{selectedReferral.services}</p>
                </div>
                <div className="fullCol">
                  <label>Schedule Preference:</label>
                  <p>{selectedReferral.schedulePreference}</p>
                </div>
                <div className="fullCol">
                  <label>Referral Message &amp; Goals:</label>
                  <div className="modalMessageNote">
                    {selectedReferral.message}
                  </div>
                </div>
              </div>

              {/* Stage Progression Buttons */}
              <div className="modalStatusAction">
                <label>Update Intake Pipeline Stage:</label>
                <div className="statusBtnGroup">
                  {PIPELINE_STAGES.map((st) => (
                    <button
                      key={st.id}
                      onClick={() => handleStatusChange(selectedReferral.id, st.id as any)}
                      className={`statusPillBtn ${selectedReferral.status === st.id ? 'active' : ''}`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Activity History & Case Notes (Atomic CRM Pattern) */}
              <div className="crmTimelineSection">
                <div className="crmTimelineHeader">
                  <History size={16} color="#0284c7" />
                  <span>Activity History &amp; Case Notes</span>
                </div>

                {/* Add Activity Form */}
                <form onSubmit={handleAddNote} className="crmAddActivityBox">
                  <div className="crmActivityTypePicker">
                    {(['note', 'call', 'email', 'meeting'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setNewNoteType(type)}
                        className={`crmTypeBtn ${newNoteType === type ? 'active' : ''}`}
                      >
                        {type === 'note' && '📝 Case Note'}
                        {type === 'call' && '📞 Call Log'}
                        {type === 'email' && '✉️ Email'}
                        {type === 'meeting' && '🤝 Meeting'}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={2}
                    placeholder="Type details of call, shift preference, or intake note..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    className="crmNoteTextarea"
                  />

                  <button
                    type="submit"
                    disabled={noteSaving || !newNoteText.trim()}
                    className="crmSaveNoteBtn"
                  >
                    <MessageSquare size={13} />
                    <span>{noteSaving ? 'Saving...' : 'Add to Timeline'}</span>
                  </button>
                </form>

                {/* Timeline Feed */}
                {activitiesLoading ? (
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem', padding: '12px 0' }}>Loading activity history...</div>
                ) : activities.length === 0 ? (
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem', padding: '10px 0' }}>
                    No case notes or call logs recorded yet. Use the form above to add the first entry.
                  </div>
                ) : (
                  <div className="crmTimelineFeed">
                    {activities.map((act) => (
                      <div key={act.id} className="crmTimelineItem">
                        <div className="crmTimelineItemTitle">{act.title}</div>
                        <div className="crmTimelineItemMeta">
                          Logged by {act.author_name} · {new Date(act.created_at).toLocaleString('en-AU')}
                        </div>
                        {act.description && (
                          <div className="crmTimelineItemDesc">{act.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
