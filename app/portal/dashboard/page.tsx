'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  FileText,
  ArrowLeft,
  User,
  LogOut,
  MapPin,
  ChevronRight,
  ShieldCheck,
  Target,
  TrendingUp,
  Heart,
  AlertTriangle,
  RefreshCw,
  Star,
  BookOpen,
  DollarSign,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

/* --─ Types --─ */
interface ParticipantProfile {
  id: string;
  reference_number: string;
  full_name: string;
  ndis_number?: string;
  phone?: string;
  email?: string;
  suburb?: string;
  funding_type?: string;
  plan_manager_name?: string;
  support_coordinator_name?: string;
  support_coordinator_phone?: string;
  allocated_weekly_hours?: number;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  medical_alert?: string;
  communication_preferences?: string;
  status?: string;
}

interface Goal {
  id: string;
  participant_id: string;
  goal_title: string;
  goal_description?: string;
  category: string;
  status: 'active' | 'achieved' | 'paused' | 'discontinued';
  target_date?: string;
  achieved_date?: string;
  review_date?: string;
  priority: number;
  ndis_domain?: string;
  created_at: string;
}

interface UpcomingShift {
  id: string;
  shift_reference?: string;
  service_type?: string;
  scheduled_start: string;
  scheduled_end: string;
  status?: string;
  worker_name?: string;
  location?: string;
}

interface ActiveSupportPlan {
  id: string;
  plan_title: string;
  version: number;
  status: string;
  primary_disability?: string;
  secondary_conditions?: string;
  communication_method?: string;
  language_preference?: string;
  morning_routine?: string;
  personal_care_needs?: string;
  mobility_aids?: string;
  dietary_requirements?: string;
  plan_start_date?: string;
  plan_end_date?: string;
  review_date?: string;
}

type TabType = 'overview' | 'goals' | 'funding' | 'schedule' | 'documents' | 'support';

const GOAL_CATEGORY_COLOURS: Record<string, string> = {
  'Daily Living': '#3B82F6',
  'Community Participation': '#8B5CF6',
  'Employment': '#F59E0B',
  'Health & Wellbeing': '#10B981',
  'Social': '#EC4899',
  'Capacity Building': '#6366F1',
  'General': '#6B7280',
};

const GOAL_STATUS_LABELS: Record<string, { label: string; colour: string }> = {
  active: { label: 'In Progress', colour: '#3B82F6' },
  achieved: { label: 'Achieved ✓', colour: '#10B981' },
  paused: { label: 'On Hold', colour: '#F59E0B' },
  discontinued: { label: 'Discontinued', colour: '#9CA3AF' },
};

/* --─ Component --─ */
export default function ParticipantDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [participant, setParticipant] = useState<ParticipantProfile | null>(null);
  const [profileName, setProfileName] = useState('');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [activePlan, setActivePlan] = useState<ActiveSupportPlan | null>(null);
  const [upcomingShifts, setUpcomingShifts] = useState<UpcomingShift[]>([]);
  const [fundingPeriods, setFundingPeriods] = useState<any[]>([]);
  const [error, setError] = useState('');

  /* --─ Load Data --─ */
  const loadPortalData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      // Load profile + participant via API (validates session server-side)
      const meRes = await fetch('/api/portal/me');
      if (meRes.status === 401) {
        router.push('/portal?reason=session_expired');
        return;
      }
      if (!meRes.ok) {
        setError('Failed to load your profile. Please try again.');
        setIsLoading(false);
        return;
      }
      const meData = await meRes.json();
      setProfileName(meData.profile?.full_name || meData.user?.email || 'Participant');
      setParticipant(meData.participant || null);

      // Load goals, shifts, support plans, and funding
      if (meData.participant?.id) {
        const goalsRes = await fetch(`/api/portal/participant/goals?participant_id=${meData.participant.id}`);
        if (goalsRes.ok) {
          const goalsData = await goalsRes.json();
          setGoals(goalsData.goals || []);
        }

        // Load upcoming shifts via existing workforce API
        const shiftsRes = await fetch(`/api/workforce/shifts?participant_id=${meData.participant.id}&upcoming=true`);
        if (shiftsRes.ok) {
          const shiftsData = await shiftsRes.json();
          setUpcomingShifts(shiftsData.shifts || []);
        }

        // Load active support plan
        const plansRes = await fetch(`/api/portal/participant/support-plans?participant_id=${meData.participant.id}`);
        if (plansRes.ok) {
          const plansData = await plansRes.json();
          const active = (plansData.plans || []).find((p: any) => p.status === 'active') || plansData.plans?.[0] || null;
          setActivePlan(active);
        }

        // Load live tracked funding
        const fundingRes = await fetch(`/api/portal/participant/funding?participant_id=${meData.participant.id}`);
        if (fundingRes.ok) {
          const fundingData = await fundingRes.json();
          setFundingPeriods(fundingData.periods || []);
        }
      }
    } catch (err) {
      console.error('Portal dashboard load error:', err);
      setError('Unable to load your dashboard. Please refresh.');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadPortalData();
  }, [loadPortalData]);

  /* --─ Sign Out --─ */
  const handleSignOut = async () => {
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push('/portal');
  };

  /* --─ Derived Stats --─ */
  const activeGoals = goals.filter((g) => g.status === 'active').length;
  const achievedGoals = goals.filter((g) => g.status === 'achieved').length;
  const nextShift = upcomingShifts[0] ?? null;

  /* --─ Loading State --─ */
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F1F5F9',
        gap: 16,
      }}>
        <RefreshCw size={32} style={{ color: '#3B82F6', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#64748B', fontSize: '0.95rem', margin: 0 }}>Loading your dashboard…</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  /* --─ Error State --─ */
  if (error && !participant) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F1F5F9',
        gap: 16,
        padding: '0 16px',
        textAlign: 'center',
      }}>
        <AlertTriangle size={40} style={{ color: '#EF4444' }} />
        <p style={{ color: '#374151', fontSize: '1rem', margin: 0 }}>{error}</p>
        <button
          onClick={loadPortalData}
          style={{
            background: '#3B82F6', color: '#fff', border: 'none',
            borderRadius: 8, padding: '10px 20px', cursor: 'pointer',
            fontSize: '0.9rem', fontWeight: 600,
          }}
        >
          Try Again
        </button>
        <button
          onClick={handleSignOut}
          style={{
            background: 'none', color: '#6B7280', border: 'none',
            cursor: 'pointer', fontSize: '0.85rem',
          }}
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F1F5F9', fontFamily: 'var(--font-source-sans)' }}>
      {/* -- Top Header -- */}
      <header style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        padding: '0 20px',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/">
            <Image
              src="/brand/Opus_Care_Logo_Transparent.png"
              alt="Opus Care"
              width={130}
              height={36}
              priority
              style={{ objectFit: 'contain' }}
            />
          </Link>
          <span style={{
            background: '#EFF6FF',
            color: '#3B82F6',
            borderRadius: 20,
            padding: '2px 10px',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
          }}>
            PARTICIPANT PORTAL
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '0.88rem', color: '#374151', fontWeight: 500 }}>
            {profileName}
          </span>
          <button
            onClick={handleSignOut}
            title="Sign out"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: '1px solid #E2E8F0',
              borderRadius: 8, padding: '6px 12px',
              cursor: 'pointer', color: '#6B7280', fontSize: '0.82rem',
              fontWeight: 500, transition: 'all 0.15s',
            }}
          >
            <LogOut size={14} />
            <span>Sign out</span>
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>

        {/* -- Welcome Banner -- */}
        <div style={{
          background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
          borderRadius: 16,
          padding: '24px 28px',
          color: '#FFFFFF',
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <div>
            <h1 style={{ margin: '0 0 4px', fontSize: '1.4rem', fontWeight: 700 }}>
              Welcome back, {participant?.full_name?.split(' ')[0] || profileName}
            </h1>
            <p style={{ margin: 0, opacity: 0.85, fontSize: '0.9rem' }}>
              {participant?.reference_number && `Ref: ${participant.reference_number} · `}
              {participant?.funding_type || 'NDIS Participant'} ·{' '}
              <ShieldCheck size={14} style={{ verticalAlign: 'middle' }} /> Verified
            </p>
          </div>
          {participant?.status === 'active' && (
            <div style={{
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 12,
              padding: '10px 16px',
              textAlign: 'center',
              backdropFilter: 'blur(4px)',
            }}>
              <div style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: 2 }}>NDIS Plan</div>
              <div style={{ fontSize: '1rem', fontWeight: 700 }}>Active</div>
              {participant?.allocated_weekly_hours && (
                <div style={{ fontSize: '0.78rem', opacity: 0.85 }}>
                  {participant.allocated_weekly_hours} hrs/week
                </div>
              )}
            </div>
          )}
        </div>

        {/* -- Emergency Alert (if medical_alert set) -- */}
        {participant?.medical_alert && (
          <div style={{
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: 10,
            padding: '12px 16px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
          }}>
            <AlertTriangle size={18} style={{ color: '#EF4444', flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#991B1B', marginBottom: 2 }}>
                Medical Alert
              </div>
              <div style={{ fontSize: '0.85rem', color: '#B91C1C' }}>{participant.medical_alert}</div>
            </div>
          </div>
        )}

        {/* -- KPI Strip -- */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}>
          {[
            { icon: <Target size={20} />, label: 'Active Goals', value: activeGoals, colour: '#3B82F6', bg: '#EFF6FF' },
            { icon: <Star size={20} />, label: 'Goals Achieved', value: achievedGoals, colour: '#10B981', bg: '#F0FDF4' },
            { icon: <Calendar size={20} />, label: 'Upcoming Shifts', value: upcomingShifts.length, colour: '#8B5CF6', bg: '#F5F3FF' },
            { icon: <Clock size={20} />, label: 'Weekly Hours', value: participant?.allocated_weekly_hours ?? '—', colour: '#F59E0B', bg: '#FFFBEB' },
          ].map((kpi, idx) => (
            <div key={idx} style={{
              background: '#FFFFFF',
              borderRadius: 12,
              padding: '16px',
              border: '1px solid #F1F5F9',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: kpi.bg, display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: kpi.colour, marginBottom: 10,
              }}>
                {kpi.icon}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', lineHeight: 1 }}>
                {kpi.value}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: 4 }}>{kpi.label}</div>
            </div>
          ))}
        </div>

        {/* -- Tab Navigation -- */}
        <div style={{
          display: 'flex', gap: 4, background: '#FFFFFF',
          borderRadius: 10, padding: 4, marginBottom: 20,
          border: '1px solid #E2E8F0',
          overflowX: 'auto',
        }}>
          {([
            { id: 'overview', label: 'Overview', icon: <User size={15} /> },
            { id: 'funding', label: 'Funding & Budgets', icon: <DollarSign size={15} /> },
            { id: 'goals', label: `Goals (${goals.length})`, icon: <Target size={15} /> },
            { id: 'schedule', label: 'Schedule', icon: <Calendar size={15} /> },
            { id: 'documents', label: 'Documents', icon: <FileText size={15} /> },
            { id: 'support', label: 'Support Info', icon: <Heart size={15} /> },
          ] as { id: TabType; label: string; icon: React.ReactNode }[]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 7, border: 'none',
                cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500,
                transition: 'all 0.15s', whiteSpace: 'nowrap',
                background: activeTab === tab.id ? '#1E40AF' : 'transparent',
                color: activeTab === tab.id ? '#FFFFFF' : '#6B7280',
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* -- Tab: Overview -- */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
            {/* Profile Card */}
            <div style={{ background: '#FFFFFF', borderRadius: 12, padding: 20, border: '1px solid #F1F5F9', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, fontWeight: 600, fontSize: '0.95rem', color: '#111827' }}>
                <User size={18} style={{ color: '#3B82F6' }} /> My Details
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                {[
                  { label: 'Full Name', value: participant?.full_name },
                  { label: 'NDIS Number', value: participant?.ndis_number || 'Not recorded' },
                  { label: 'Phone', value: participant?.phone || 'Not recorded' },
                  { label: 'Email', value: participant?.email || 'Not recorded' },
                  { label: 'Suburb', value: participant?.suburb },
                  { label: 'Funding Type', value: participant?.funding_type },
                  { label: 'Plan Manager', value: participant?.plan_manager_name || 'Not assigned' },
                  { label: 'Support Coordinator', value: participant?.support_coordinator_name || 'Not assigned' },
                ].map((field, idx) => field.value ? (
                  <div key={idx}>
                    <div style={{ fontSize: '0.73rem', color: '#9CA3AF', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {field.label}
                    </div>
                    <div style={{ fontSize: '0.88rem', color: '#374151', fontWeight: 500 }}>{field.value}</div>
                  </div>
                ) : null)}
              </div>
            </div>

            {/* Emergency Contact */}
            <div style={{ background: '#FFF7ED', borderRadius: 12, padding: 20, border: '1px solid #FED7AA', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, fontWeight: 600, fontSize: '0.95rem', color: '#92400E' }}>
                <AlertTriangle size={18} style={{ color: '#F59E0B' }} /> Emergency Contact
              </div>
              {participant?.emergency_contact_name ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#374151' }}>
                    {participant.emergency_contact_name}
                    {participant.emergency_contact_relation && (
                      <span style={{ fontWeight: 400, color: '#6B7280', marginLeft: 6, fontSize: '0.85rem' }}>
                        ({participant.emergency_contact_relation})
                      </span>
                    )}
                  </div>
                  {participant.emergency_contact_phone && (
                    <a href={`tel:${participant.emergency_contact_phone}`} style={{ color: '#1E40AF', fontWeight: 600, textDecoration: 'none', fontSize: '1rem' }}>
                      📞 {participant.emergency_contact_phone}
                    </a>
                  )}
                </div>
              ) : (
                <p style={{ color: '#9CA3AF', fontSize: '0.85rem', margin: 0 }}>Not recorded. Contact Opus Care to update.</p>
              )}
            </div>

            {/* Next Shift */}
            <div style={{ background: '#F5F3FF', borderRadius: 12, padding: 20, border: '1px solid #DDD6FE', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, fontWeight: 600, fontSize: '0.95rem', color: '#4C1D95' }}>
                <Calendar size={18} style={{ color: '#8B5CF6' }} /> Next Scheduled Support
              </div>
              {nextShift ? (
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                    {nextShift.service_type || 'Support Session'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: 4 }}>
                    {new Date(nextShift.scheduled_start).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#6B7280' }}>
                    {new Date(nextShift.scheduled_start).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                    {' – '}
                    {new Date(nextShift.scheduled_end).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {nextShift.worker_name && (
                    <div style={{ marginTop: 8, fontSize: '0.82rem', color: '#7C3AED', fontWeight: 500 }}>
                      Worker: {nextShift.worker_name}
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ color: '#9CA3AF', fontSize: '0.85rem', margin: 0 }}>
                  No upcoming shifts scheduled. Contact Opus Care to arrange support.
                </p>
              )}
            </div>

            {/* Live Tracked Funding Utilisation Card */}
            <div style={{ background: '#FFFFFF', borderRadius: 12, padding: 20, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
                    <DollarSign size={18} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>
                      Opus Care Tracked Budget Utilisation
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B' }}>
                      Delivered services and invoiced supports tracked against your active NDIS agreement
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('funding')}
                  style={{
                    background: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE',
                    borderRadius: 6, padding: '5px 12px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  View Breakdown &rarr;
                </button>
              </div>

              {fundingPeriods.length === 0 ? (
                <div style={{ background: '#F8FAFC', borderRadius: 8, padding: 16, textAlign: 'center', color: '#64748B', fontSize: '0.85rem' }}>
                  No active funding period allocated yet. Once your Service Agreement and Support Schedule are sealed, tracked utilisation will be displayed here.
                </div>
              ) : (
                fundingPeriods.map((period: any) => (
                  <div key={period.id} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                      <div style={{ background: '#F8FAFC', borderRadius: 8, padding: '10px 12px', border: '1px solid #F1F5F9' }}>
                        <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Total Budget</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', marginTop: 2 }}>
                          ${(period.total_budget || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div style={{ background: '#F8FAFC', borderRadius: 8, padding: '10px 12px', border: '1px solid #F1F5F9' }}>
                        <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Delivered to Date</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0284C7', marginTop: 2 }}>
                          ${(period.total_delivered || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div style={{ background: '#F8FAFC', borderRadius: 8, padding: '10px 12px', border: '1px solid #F1F5F9' }}>
                        <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Invoiced</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#16A34A', marginTop: 2 }}>
                          ${(period.total_invoiced || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div style={{ background: '#F8FAFC', borderRadius: 8, padding: '10px 12px', border: '1px solid #F1F5F9' }}>
                        <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Remaining Tracked</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#059669', marginTop: 2 }}>
                          ${(period.total_remaining || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>

                    {/* Overall Progress Bar */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                        <span>Overall Opus Care Utilisation</span>
                        <span>{(period.overall_pct || 0).toFixed(1)}%</span>
                      </div>
                      <div style={{ height: 8, background: '#E2E8F0', borderRadius: 9999, overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${Math.min(period.overall_pct || 0, 100)}%`,
                            background: period.overall_pct > 90 ? '#E11D48' : period.overall_pct > 75 ? '#F59E0B' : '#2563EB',
                            borderRadius: 9999,
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* -- Tab: Funding & Budgets -- */}
        {activeTab === 'funding' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#FFFFFF', borderRadius: 12, padding: 20, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h2 style={{ margin: '0 0 4px', fontSize: '1.2rem', fontWeight: 700, color: '#0F172A' }}>
                    Funding Tracking & Budgets
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B' }}>
                    Live visibility into Core, Capacity Building, and Capital budgets delivered by Opus Care.
                  </p>
                </div>
              </div>

              {fundingPeriods.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8' }}>
                  <DollarSign size={40} style={{ color: '#CBD5E1', marginBottom: 10 }} />
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748B' }}>
                    No active funding periods recorded yet. Please contact your Opus Care coordinator.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {fundingPeriods.map((period: any) => (
                    <div key={period.id} style={{ border: '1px solid #E2E8F0', borderRadius: 10, padding: 18, background: '#FAFAFA' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <strong style={{ fontSize: '1rem', color: '#0F172A' }}>
                            Plan Period: {new Date(period.plan_start).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })} – {new Date(period.plan_end).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </strong>
                          <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 2 }}>
                            Total Agreement Value: ${(period.total_budget || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                        <span style={{ background: '#EFF6FF', color: '#1E40AF', padding: '3px 12px', borderRadius: 9999, fontSize: '0.78rem', fontWeight: 700 }}>
                          {(period.overall_pct || 0).toFixed(1)}% Utilised
                        </span>
                      </div>

                      {/* Category Breakdown */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {(period.budgets || []).map((b: any) => {
                          const catColors: Record<string, string> = {
                            Core: '#2563EB',
                            'Capacity Building': '#7C3AED',
                            Capital: '#0D9488',
                          };
                          const barColor = catColors[b.support_category] || '#2563EB';
                          return (
                            <div key={b.id || b.support_category} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: '12px 14px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0F172A' }}>
                                  {b.support_category} Supports
                                </span>
                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
                                  ${(b.delivered_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} / ${(b.budget_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                              <div style={{ height: 6, background: '#F1F5F9', borderRadius: 9999, overflow: 'hidden', marginBottom: 6 }}>
                                <div style={{ height: '100%', width: `${Math.min(b.utilised_pct || 0, 100)}%`, background: barColor, borderRadius: 9999 }} />
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748B' }}>
                                <span>Invoiced: ${(b.invoiced_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                <span>Remaining: ${(b.remaining_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} ({(b.utilised_pct || 0).toFixed(1)}%)</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Informative Note */}
              <div style={{ marginTop: 18, background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '12px 16px', fontSize: '0.8rem', color: '#1E40AF', lineHeight: 1.5 }}>
                <strong>Opus Care Tracked Utilisation Notice:</strong> This breakdown reflects support delivered and invoiced directly through Opus Care. Official overall NDIS plan balances (including services provided by third parties or plan management fees) are maintained within the NDIA myplace / PACE portal.
              </div>
            </div>
          </div>
        )}
        {activeTab === 'goals' && (
          <div>
            {goals.length === 0 ? (
              <div style={{
                background: '#FFFFFF', borderRadius: 12, padding: '48px 24px',
                textAlign: 'center', border: '1px solid #F1F5F9',
              }}>
                <Target size={40} style={{ color: '#CBD5E1', marginBottom: 12 }} />
                <p style={{ color: '#94A3B8', margin: 0, fontSize: '0.95rem' }}>
                  No goals have been added yet. Your support team will add goals to your plan.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {goals.map((goal) => {
                  const statusInfo = GOAL_STATUS_LABELS[goal.status] || { label: goal.status, colour: '#6B7280' };
                  const catColour = GOAL_CATEGORY_COLOURS[goal.category] || '#6B7280';
                  return (
                    <div key={goal.id} style={{
                      background: '#FFFFFF', borderRadius: 12, padding: 20,
                      border: '1px solid #F1F5F9', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                      borderLeft: `4px solid ${catColour}`,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '1rem', color: '#111827', marginBottom: 4 }}>
                            {goal.goal_title}
                          </div>
                          {goal.goal_description && (
                            <p style={{ color: '#6B7280', fontSize: '0.87rem', margin: '0 0 8px' }}>
                              {goal.goal_description}
                            </p>
                          )}
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{
                              display: 'inline-block', borderRadius: 20, padding: '2px 10px',
                              fontSize: '0.75rem', fontWeight: 600, background: `${catColour}18`, color: catColour,
                            }}>
                              {goal.category}
                            </span>
                            {goal.ndis_domain && (
                              <span style={{
                                display: 'inline-block', borderRadius: 20, padding: '2px 10px',
                                fontSize: '0.75rem', fontWeight: 500, background: '#F3F4F6', color: '#6B7280',
                              }}>
                                {goal.ndis_domain}
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{
                            display: 'inline-block', borderRadius: 20, padding: '4px 12px',
                            fontSize: '0.78rem', fontWeight: 700,
                            background: `${statusInfo.colour}18`, color: statusInfo.colour,
                          }}>
                            {statusInfo.label}
                          </span>
                          {goal.target_date && (
                            <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: 6 }}>
                              Target: {new Date(goal.target_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* -- Tab: Schedule -- */}
        {activeTab === 'schedule' && (
          <div>
            {upcomingShifts.length === 0 ? (
              <div style={{
                background: '#FFFFFF', borderRadius: 12, padding: '48px 24px',
                textAlign: 'center', border: '1px solid #F1F5F9',
              }}>
                <Calendar size={40} style={{ color: '#CBD5E1', marginBottom: 12 }} />
                <p style={{ color: '#94A3B8', margin: 0 }}>No upcoming scheduled supports.</p>
                <p style={{ color: '#94A3B8', margin: '8px 0 0', fontSize: '0.85rem' }}>
                  Contact Opus Care at{' '}
                  <a href="mailto:support@opuscare.com.au" style={{ color: '#3B82F6' }}>
                    support@opuscare.com.au
                  </a>{' '}
                  to arrange your support schedule.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {upcomingShifts.map((shift) => (
                  <div key={shift.id} style={{
                    background: '#FFFFFF', borderRadius: 12, padding: '16px 20px',
                    border: '1px solid #F1F5F9', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#111827', marginBottom: 4 }}>
                        {shift.service_type || 'Support Session'}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#6B7280', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={13} />
                          {new Date(shift.scheduled_start).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={13} />
                          {new Date(shift.scheduled_start).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                          {' – '}
                          {new Date(shift.scheduled_end).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {shift.location && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <MapPin size={13} /> {shift.location}
                          </span>
                        )}
                      </div>
                      {shift.worker_name && (
                        <div style={{ marginTop: 6, fontSize: '0.82rem', color: '#8B5CF6', fontWeight: 500 }}>
                          Worker: {shift.worker_name}
                        </div>
                      )}
                    </div>
                    <span style={{
                      padding: '4px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600,
                      background: shift.status === 'confirmed' ? '#F0FDF4' : '#FFF7ED',
                      color: shift.status === 'confirmed' ? '#16A34A' : '#D97706',
                    }}>
                      {shift.status === 'confirmed' ? '✓ Confirmed' : shift.status || 'Scheduled'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* -- Tab: Documents -- */}
        {activeTab === 'documents' && (
          <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '32px 24px', textAlign: 'center', border: '1px solid #F1F5F9' }}>
            <FileText size={40} style={{ color: '#CBD5E1', marginBottom: 12 }} />
            <h3 style={{ color: '#374151', margin: '0 0 8px', fontSize: '1rem' }}>Document access coming soon</h3>
            <p style={{ color: '#94A3B8', fontSize: '0.88rem', margin: '0 0 16px' }}>
              Your service agreements, progress notes and plans will appear here.
            </p>
            <a href="mailto:support@opuscare.com.au?subject=Document Request" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#3B82F6', color: '#fff', borderRadius: 8,
              padding: '9px 18px', fontSize: '0.88rem', fontWeight: 600,
              textDecoration: 'none',
            }}>
              Request a document
            </a>
          </div>
        )}

        {/* -- Tab: Support Info -- */}
        {activeTab === 'support' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Active Support Plan Card */}
            <div style={{ background: '#FFFFFF', borderRadius: 12, padding: 20, border: '1px solid #BBF7D0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontWeight: 600, fontSize: '0.98rem', color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={18} style={{ color: '#16A34A' }} /> Active Support Plan
                </div>
                {activePlan && (
                  <span style={{ background: '#F0FDF4', color: '#16A34A', borderRadius: 20, padding: '2px 10px', fontSize: '0.75rem', fontWeight: 700 }}>
                    Version {activePlan.version} &bull; Active
                  </span>
                )}
              </div>

              {activePlan ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: '0.73rem', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Plan Title</div>
                    <div style={{ fontSize: '0.88rem', color: '#374151', fontWeight: 500 }}>{activePlan.plan_title}</div>
                  </div>
                  {activePlan.primary_disability && (
                    <div>
                      <div style={{ fontSize: '0.73rem', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Primary Disability</div>
                      <div style={{ fontSize: '0.88rem', color: '#374151', fontWeight: 500 }}>{activePlan.primary_disability}</div>
                    </div>
                  )}
                  {activePlan.communication_method && (
                    <div>
                      <div style={{ fontSize: '0.73rem', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Communication Method</div>
                      <div style={{ fontSize: '0.88rem', color: '#374151', fontWeight: 500 }}>{activePlan.communication_method}</div>
                    </div>
                  )}
                  {activePlan.dietary_requirements && (
                    <div>
                      <div style={{ fontSize: '0.73rem', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Dietary Requirements</div>
                      <div style={{ fontSize: '0.88rem', color: '#374151', fontWeight: 500 }}>{activePlan.dietary_requirements}</div>
                    </div>
                  )}
                  {activePlan.mobility_aids && (
                    <div>
                      <div style={{ fontSize: '0.73rem', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Mobility Aids</div>
                      <div style={{ fontSize: '0.88rem', color: '#374151', fontWeight: 500 }}>{activePlan.mobility_aids}</div>
                    </div>
                  )}
                  {activePlan.review_date && (
                    <div>
                      <div style={{ fontSize: '0.73rem', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Next Plan Review</div>
                      <div style={{ fontSize: '0.88rem', color: '#374151', fontWeight: 500 }}>
                        {new Date(activePlan.review_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ color: '#6B7280', fontSize: '0.88rem', margin: 0 }}>
                  Your active support plan is currently being finalised by your Opus Care coordinator.
                </p>
              )}
            </div>

            {/* Communication preferences */}
            {participant?.communication_preferences && (
              <div style={{ background: '#FFFFFF', borderRadius: 12, padding: 20, border: '1px solid #F1F5F9', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div style={{ fontWeight: 600, marginBottom: 8, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BookOpen size={18} style={{ color: '#3B82F6' }} /> Communication Preferences
                </div>
                <p style={{ color: '#374151', fontSize: '0.9rem', margin: 0 }}>
                  {participant.communication_preferences}
                </p>
              </div>
            )}

            {/* Support Coordinator */}
            <div style={{ background: '#FFFFFF', borderRadius: 12, padding: 20, border: '1px solid #F1F5F9', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ fontWeight: 600, marginBottom: 12, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={18} style={{ color: '#10B981' }} /> Your Support Team
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Support Coordinator</div>
                  <div style={{ fontWeight: 500, color: '#374151' }}>{participant?.support_coordinator_name || 'Not assigned'}</div>
                  {participant?.support_coordinator_phone && (
                    <a href={`tel:${participant.support_coordinator_phone}`} style={{ color: '#3B82F6', fontSize: '0.88rem' }}>
                      {participant.support_coordinator_phone}
                    </a>
                  )}
                </div>
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 10 }}>
                  <div style={{ fontSize: '0.75rem', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Plan Manager</div>
                  <div style={{ fontWeight: 500, color: '#374151' }}>{participant?.plan_manager_name || 'Not assigned'}</div>
                </div>
              </div>
            </div>

            {/* Help / Contact */}
            <div style={{ background: '#EFF6FF', borderRadius: 12, padding: 20, border: '1px solid #BFDBFE' }}>
              <div style={{ fontWeight: 600, marginBottom: 8, color: '#1E40AF' }}>Need help?</div>
              <p style={{ color: '#374151', fontSize: '0.88rem', margin: '0 0 12px' }}>
                Contact Opus Care for any questions about your supports, schedule, or plan.
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <a href="tel:1800OPUSCARE" style={{
                  background: '#1E40AF', color: '#fff', borderRadius: 8,
                  padding: '8px 16px', fontSize: '0.85rem', fontWeight: 600,
                  textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
                }}>
                  📞 Call us
                </a>
                <a href="mailto:support@opuscare.com.au" style={{
                  background: '#FFFFFF', color: '#1E40AF', border: '1px solid #BFDBFE',
                  borderRadius: 8, padding: '8px 16px', fontSize: '0.85rem', fontWeight: 600,
                  textDecoration: 'none',
                }}>
                  ✉️ Email support
                </a>
              </div>
            </div>
          </div>
        )}

        {/* -- Footer -- */}
        <div style={{
          marginTop: 32, paddingTop: 16, borderTop: '1px solid #E2E8F0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 8,
          fontSize: '0.78rem', color: '#94A3B8',
        }}>
          <span>© 2026 Opus Care Support Services. Australian Privacy Act compliant.</span>
          <button
            onClick={handleSignOut}
            style={{
              background: 'none', border: 'none', color: '#94A3B8',
              cursor: 'pointer', fontSize: '0.78rem', display: 'flex',
              alignItems: 'center', gap: 4,
            }}
          >
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
