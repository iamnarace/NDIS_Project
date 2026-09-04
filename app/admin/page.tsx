'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Users, UserCheck, FileText, Phone, Mail, MapPin, Calendar, 
  CheckCircle2, Clock, AlertCircle, ArrowRight, Search, Filter, 
  Plus, Shield, Sparkles, RefreshCw, ExternalLink 
} from 'lucide-react';

interface Referral {
  id: string;
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
  status: 'new' | 'contacted' | 'agreement_sent' | 'active' | 'archived';
  createdAt: string;
}

interface Participant {
  id: string;
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

export default function AdminCrmPage() {
  const [tab, setTab] = useState<'referrals' | 'participants' | 'staff'>('referrals');
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

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

  async function handleStatusChange(id: string, newStatus: Referral['status']) {
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
        }
      }
    } catch (err) {
      alert('Failed to update referral status');
    }
  }

  const filteredReferrals = referrals.filter(r => {
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchesSearch = 
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.participantName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.suburb?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const countNew = referrals.filter(r => r.status === 'new').length;

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
          </div>
        </div>
      </header>

      {/* Main CRM Body */}
      <main className="crmMainContainer">
        
        {/* Metric Cards Row */}
        <div className="crmMetricsRow">
          <div className="crmMetricCard">
            <span className="metricCardLabel">Total Inbound Referrals</span>
            <strong className="metricCardVal">{referrals.length}</strong>
            <small className="metricCardSub">Lifetime submissions</small>
          </div>
          <div className="crmMetricCard highlight">
            <span className="metricCardLabel">New / Uncontacted</span>
            <strong className="metricCardVal">{countNew}</strong>
            <small className="metricCardSub">Requires prompt follow-up</small>
          </div>
          <div className="crmMetricCard">
            <span className="metricCardLabel">Active Participants</span>
            <strong className="metricCardVal">{participants.length}</strong>
            <small className="metricCardSub">Currently receiving support</small>
          </div>
          <div className="crmMetricCard">
            <span className="metricCardLabel">Cleared Support Workers</span>
            <strong className="metricCardVal">{staff.length}</strong>
            <small className="metricCardSub">Available on Northern Rivers roster</small>
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
            {/* Filter & Search Toolbar */}
            <div className="crmToolbar">
              <div className="crmSearchWrap">
                <Search size={16} className="crmSearchIcon" />
                <input
                  type="text"
                  placeholder="Search by participant name, suburb, or contact..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="crmSearchInput"
                />
              </div>

              <div className="crmFilterGroup">
                <Filter size={16} />
                <span>Status:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="crmSelect"
                >
                  <option value="all">All Statuses ({referrals.length})</option>
                  <option value="new">New ({referrals.filter(r => r.status === 'new').length})</option>
                  <option value="contacted">Contacted ({referrals.filter(r => r.status === 'contacted').length})</option>
                  <option value="agreement_sent">Agreement Sent ({referrals.filter(r => r.status === 'agreement_sent').length})</option>
                  <option value="active">Active Participant ({referrals.filter(r => r.status === 'active').length})</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            {/* Referrals Table / Card List */}
            {loading ? (
              <div className="crmLoadingState">Loading referrals from database...</div>
            ) : filteredReferrals.length === 0 ? (
              <div className="crmEmptyState">No referrals match your filter criteria.</div>
            ) : (
              <div className="crmTableWrapper">
                <table className="crmTable">
                  <thead>
                    <tr>
                      <th>Ref ID &amp; Date</th>
                      <th>Contact / Role</th>
                      <th>Participant Name</th>
                      <th>Location</th>
                      <th>Funding &amp; Services</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReferrals.map((ref) => (
                      <tr key={ref.id} className={ref.status === 'new' ? 'rowNew' : ''}>
                        <td>
                          <span className="refIdTag">{ref.id}</span>
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
                            <option value="agreement_sent">📄 Agreement Sent</option>
                            <option value="active">✅ Active Client</option>
                            <option value="archived">⚪ Archived</option>
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
                <p>Track NDIS plan types, allocated weekly hours, and support staff assigned.</p>
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
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <strong>{p.name}</strong>
                        <small className="refIdTag">{p.id}</small>
                      </td>
                      <td><code>{p.ndisNumber}</code></td>
                      <td><MapPin size={13} /> {p.suburb}</td>
                      <td><span className="fundingPillMini">{p.fundingType}</span></td>
                      <td><strong>{p.allocatedHours} hrs/wk</strong></td>
                      <td><span className="workerPill"><UserCheck size={14} /> {p.workerAssigned}</span></td>
                      <td><small>{p.contactPerson}</small></td>
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

      {/* Referral Detail Modal */}
      {selectedReferral && (
        <div className="crmModalOverlay" onClick={() => setSelectedReferral(null)}>
          <div className="crmModalBox" onClick={(e) => e.stopPropagation()}>
            <div className="crmModalHeader">
              <div>
                <span className="refIdTag">{selectedReferral.id}</span>
                <h3>Referral Details: {selectedReferral.participantName || selectedReferral.name}</h3>
              </div>
              <button onClick={() => setSelectedReferral(null)} className="crmModalClose">✕</button>
            </div>

            <div className="crmModalBody">
              <div className="crmDetailGrid">
                <div>
                  <label>Contact Person:</label>
                  <p>{selectedReferral.name} ({selectedReferral.role})</p>
                </div>
                <div>
                  <label>Phone:</label>
                  <p><a href={`tel:${selectedReferral.phone}`}>{selectedReferral.phone}</a></p>
                </div>
                <div>
                  <label>Email:</label>
                  <p><a href={`mailto:${selectedReferral.email}`}>{selectedReferral.email}</a></p>
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

              <div className="modalStatusAction">
                <label>Update Intake Status:</label>
                <div className="statusBtnGroup">
                  {(['new', 'contacted', 'agreement_sent', 'active', 'archived'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => handleStatusChange(selectedReferral.id, st)}
                      className={`statusPillBtn ${selectedReferral.status === st ? 'active' : ''}`}
                    >
                      {st.replace('_', ' ').toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
