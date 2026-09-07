'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Clock, 
  FileText, 
  ArrowLeft, 
  User, 
  Download, 
  DollarSign, 
  Bell, 
  LogOut,
  MapPin,
  ChevronRight,
  ShieldCheck,
  Check,
  ArrowRight
} from 'lucide-react';

interface InvoiceItem {
  id: string;
  invoiceNum: string;
  date: string;
  workerName: string;
  hours: number;
  rate: number;
  total: number;
  category: string;
  status: 'pending' | 'approved' | 'queried';
}

const INITIAL_INVOICES: InvoiceItem[] = [
  {
    id: '1',
    invoiceNum: 'INV-2026-089',
    date: '4 Sep 2026',
    workerName: 'Liam Patterson',
    hours: 4.0,
    rate: 65.47,
    total: 261.88,
    category: 'Core - Assistance with Daily Living',
    status: 'pending'
  },
  {
    id: '2',
    invoiceNum: 'INV-2026-088',
    date: '2 Sep 2026',
    workerName: 'Liam Patterson',
    hours: 3.5,
    rate: 65.47,
    total: 229.15,
    category: 'Core - Community Access & Outings',
    status: 'pending'
  },
  {
    id: '3',
    invoiceNum: 'INV-2026-085',
    date: '28 Aug 2026',
    workerName: 'Sarah Jenkins',
    hours: 2.0,
    rate: 74.60,
    total: 149.20,
    category: 'Capacity Building - Life Skills',
    status: 'approved'
  }
];

export default function ParticipantDashboardPage() {
  const [invoices, setInvoices] = useState<InvoiceItem[]>(INITIAL_INVOICES);
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'schedule'>('overview');

  const handleApprove = (id: string) => {
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: 'approved' } : inv));
  };

  const handleQuery = (id: string) => {
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: 'queried' } : inv));
  };

  const pendingCount = invoices.filter(inv => inv.status === 'pending').length;

  return (
    <div className="portalDashWrap">
      {/* Top Navigation Bar */}
      <header className="portalDashNav">
        <div className="shell portalDashNavInner">
          <div className="portalNavBrand">
            <Link href="/">
              <Image
                src="/brand/Opus_Care_Logo_Transparent.png"
                alt="Opus Care Portal"
                width={160}
                height={44}
                className="portalNavLogo"
              />
            </Link>
            <span className="portalBadgeParticipant">PARTICIPANT PORTAL</span>
          </div>

          <div className="portalNavActions">
            <Link href="/staff" className="portalStaffLink">
              <span>Staff Training</span>
              <ChevronRight size={14} />
            </Link>
            <Link href="/admin" className="portalStaffLink">
              <span>Switch to Staff CRM</span>
              <ChevronRight size={14} />
            </Link>
            <div className="portalUserPill">
              <div className="portalUserAvatar">SM</div>
              <div className="portalUserDetails">
                <strong>Sarah M.</strong>
                <small>Plan #43098214</small>
              </div>
            </div>
            <Link href="/portal" className="portalLogoutBtn" title="Log Out">
              <LogOut size={16} />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="portalDashMain">
        <div className="shell">
          
          {/* Welcome & Notice Bar */}
          <div className="portalWelcomeRow">
            <div>
              <h1 className="portalWelcomeTitle">Welcome, Sarah</h1>
              <p className="portalWelcomeSub">
                Here is your current NDIS support summary, live budgets, and verified shifts across Coffs Harbour &amp; Clarence Valley.
              </p>
            </div>

            <div className="portalStatusPillGreen">
              <ShieldCheck size={16} />
              <span>Plan Status: Active · Plan-Managed</span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="portalNavTabsRow">
            <button
              className={`portalNavTab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Dashboard Overview
            </button>
            <button
              className={`portalNavTab ${activeTab === 'invoices' ? 'active' : ''}`}
              onClick={() => setActiveTab('invoices')}
            >
              Shift Notes &amp; Invoices {pendingCount > 0 && <span className="tabBadgeNum">{pendingCount}</span>}
            </button>
            <button
              className={`portalNavTab ${activeTab === 'schedule' ? 'active' : ''}`}
              onClick={() => setActiveTab('schedule')}
            >
              Upcoming Roster &amp; Shifts
            </button>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <>
              {/* Live Budget Cards */}
              <div className="portalBudgetGrid">
                
                {/* Core Supports Card */}
                <div className="portalBudgetCard">
                  <div className="pBudgetTop">
                    <span className="pBudgetTag core">CORE SUPPORTS</span>
                    <span className="pBudgetPct">65% Available</span>
                  </div>
                  <div className="pBudgetAmountRow">
                    <div>
                      <span className="pBudgetLabel">Remaining Balance</span>
                      <h3 className="pBudgetVal">$18,420.00</h3>
                    </div>
                    <div className="pBudgetRight">
                      <span className="pBudgetLabel">Total Allocated</span>
                      <strong>$28,000.00</strong>
                    </div>
                  </div>
                  <div className="pBudgetBarWrap">
                    <div className="pBudgetBarFill core" style={{ width: '65%' }} />
                  </div>
                  <div className="pBudgetFooter">
                    <span>Used to date: $9,580.00</span>
                    <small>Expires 30 Jun 2027</small>
                  </div>
                </div>

                {/* Capacity Building Card */}
                <div className="portalBudgetCard">
                  <div className="pBudgetTop">
                    <span className="pBudgetTag capacity">CAPACITY BUILDING</span>
                    <span className="pBudgetPct">55% Available</span>
                  </div>
                  <div className="pBudgetAmountRow">
                    <div>
                      <span className="pBudgetLabel">Remaining Balance</span>
                      <h3 className="pBudgetVal">$8,250.00</h3>
                    </div>
                    <div className="pBudgetRight">
                      <span className="pBudgetLabel">Total Allocated</span>
                      <strong>$15,000.00</strong>
                    </div>
                  </div>
                  <div className="pBudgetBarWrap">
                    <div className="pBudgetBarFill capacity" style={{ width: '55%' }} />
                  </div>
                  <div className="pBudgetFooter">
                    <span>Used to date: $6,750.00</span>
                    <small>Expires 30 Jun 2027</small>
                  </div>
                </div>

                {/* Quick Stats Card */}
                <div className="portalBudgetCard quickStatsCard">
                  <span className="pBudgetTag stats">THIS MONTH</span>
                  <div className="quickStatsGrid">
                    <div className="qStat">
                      <strong>14.5 hrs</strong>
                      <span>Support Delivered</span>
                    </div>
                    <div className="qStat">
                      <strong>4 Shifts</strong>
                      <span>Completed</span>
                    </div>
                    <div className="qStat">
                      <strong className="textGreen">{pendingCount} Pending</strong>
                      <span>Awaiting Approval</span>
                    </div>
                    <div className="qStat">
                      <strong>1 Worker</strong>
                      <span>Primary Assigned</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Invoices Awaiting Approval Alert */}
              {pendingCount > 0 && (
                <div className="portalPendingAlertBox">
                  <div className="alertLeft">
                    <Bell size={20} className="alertBellIcon" />
                    <div>
                      <strong>You have {pendingCount} shift invoices awaiting your review</strong>
                      <p>Review shift notes and click Approve to authorise payment to your plan manager.</p>
                    </div>
                  </div>
                  <button 
                    className="heroPillBtn filled sm" 
                    onClick={() => setActiveTab('invoices')}
                  >
                    <span>Review Now</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </>
          )}

          {/* TAB 2: INVOICES & SHIFT APPROVALS */}
          {(activeTab === 'invoices' || activeTab === 'overview') && (
            <div className="portalSectionBlock">
              <div className="portalBlockHead">
                <div>
                  <h3>Shift Notes &amp; Verified Invoices</h3>
                  <p>Transparency, Empowerment &amp; Control over every dollar spent.</p>
                </div>
                <button className="portalExportBtn">
                  <Download size={14} />
                  <span>Download Statement (PDF)</span>
                </button>
              </div>

              <div className="portalInvoicesTableWrap">
                <table className="portalTable">
                  <thead>
                    <tr>
                      <th>Invoice / Date</th>
                      <th>Support Worker</th>
                      <th>Service Category</th>
                      <th>Hours &amp; Rate</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map(inv => (
                      <tr key={inv.id} className={inv.status === 'pending' ? 'rowPending' : ''}>
                        <td>
                          <strong>{inv.invoiceNum}</strong>
                          <div className="tableSubText">{inv.date}</div>
                        </td>
                        <td>
                          <div className="workerCell">
                            <div className="wAvatar">{inv.workerName.charAt(0)}</div>
                            <span>{inv.workerName}</span>
                          </div>
                        </td>
                        <td>
                          <span className="catPill">{inv.category}</span>
                        </td>
                        <td>
                          <strong>{inv.hours} hrs</strong> @ ${inv.rate.toFixed(2)}/hr
                        </td>
                        <td>
                          <strong className="totalVal">${inv.total.toFixed(2)}</strong>
                        </td>
                        <td>
                          {inv.status === 'approved' && (
                            <span className="statusTag approved">
                              <Check size={12} /> Approved
                            </span>
                          )}
                          {inv.status === 'pending' && (
                            <span className="statusTag pending">
                              Awaiting Approval
                            </span>
                          )}
                          {inv.status === 'queried' && (
                            <span className="statusTag queried">
                              Under Review
                            </span>
                          )}
                        </td>
                        <td>
                          {inv.status === 'pending' ? (
                            <div className="actionBtnGroup">
                              <button 
                                className="actionBtn approve"
                                onClick={() => handleApprove(inv.id)}
                              >
                                Approve
                              </button>
                              <button 
                                className="actionBtn query"
                                onClick={() => handleQuery(inv.id)}
                              >
                                Query
                              </button>
                            </div>
                          ) : (
                            <span className="actionDone">Verified</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: UPCOMING ROSTER & SHIFTS */}
          {activeTab === 'schedule' && (
            <div className="portalSectionBlock">
              <div className="portalBlockHead">
                <div>
                  <h3>Your Upcoming Support Roster</h3>
                  <p>Reliable, consistent support scheduled around your routine.</p>
                </div>
              </div>

              <div className="rosterGrid">
                <div className="rosterCard">
                  <div className="rosterDateBadge">
                    <span className="day">WED</span>
                    <span className="num">9</span>
                    <span className="month">SEP</span>
                  </div>
                  <div className="rosterInfo">
                    <div className="rTime">
                      <Clock size={14} /> 9:00 AM – 1:00 PM (4.0 hrs)
                    </div>
                    <h4>Community Participation &amp; Shopping</h4>
                    <p className="rWorker">Support Worker: <strong>Liam Patterson</strong></p>
                    <span className="rLoc"><MapPin size={12} /> Coffs Harbour Town Centre</span>
                  </div>
                  <div className="rosterStatusTag confirmed">Confirmed</div>
                </div>

                <div className="rosterCard">
                  <div className="rosterDateBadge">
                    <span className="day">FRI</span>
                    <span className="num">11</span>
                    <span className="month">SEP</span>
                  </div>
                  <div className="rosterInfo">
                    <div className="rTime">
                      <Clock size={14} /> 10:00 AM – 2:00 PM (4.0 hrs)
                    </div>
                    <h4>Life Skills &amp; Meal Preparation at Home</h4>
                    <p className="rWorker">Support Worker: <strong>Sarah Jenkins</strong></p>
                    <span className="rLoc"><MapPin size={12} /> Participant Home</span>
                  </div>
                  <div className="rosterStatusTag confirmed">Confirmed</div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
