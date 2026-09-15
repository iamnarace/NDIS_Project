'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Users,
  UserCheck,
  Search,
  Filter,
  Plus,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Phone,
  Mail,
  MapPin,
  FileText,
  Download,
  ExternalLink,
  Edit3,
  Archive,
  Eye,
  Trash2,
  Shield,
  ShieldCheck,
  MessageSquare,
  ChevronRight,
  Send,
  X,
  Loader2,
  UserPlus,
  AlertTriangle,
  Info,
  Layers,
  Settings as SettingsIcon,
  Sparkles
} from 'lucide-react';
import { RECRUITMENT_SERVICE_AREAS, getRecruitmentAreaName } from '@/lib/regions';

interface Vacancy {
  id: string;
  reference_number: string;
  slug: string;
  title: string;
  category: string;
  short_summary: string;
  about_role: string;
  responsibilities: string[];
  essential_criteria: string[];
  desirable_criteria: string[];
  service_area_ids: string[];
  location_notes?: string;
  employment_basis: string[];
  engagement_relationship: 'employee' | 'contractor';
  positions_count: number;
  driver_licence_required: boolean;
  vehicle_required: boolean;
  ndiswc_required: boolean;
  police_check_required: boolean;
  first_aid_required: boolean;
  cpr_required: boolean;
  child_related_role: boolean;
  qualification_required: boolean;
  other_requirements: string[];
  pay_display_mode: 'hidden' | 'award_text' | 'custom_text';
  pay_public_text?: string;
  status: 'draft' | 'published' | 'closed' | 'archived';
  featured: boolean;
  opens_at?: string;
  closes_at?: string;
  published_at?: string;
  created_at: string;
  applications_count?: number;
}

interface Application {
  id: string;
  reference_number: string;
  application_type: 'vacancy' | 'eoi';
  vacancy_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  suburb: string;
  postcode: string;
  preferred_service_area_ids: string[];
  employment_preferences: string[];
  work_rights_status: string;
  earliest_start_date?: string;
  experience_summary?: string;
  qualification_summary?: string;
  driver_licence_status?: string;
  vehicle_access_status?: string;
  ndiswc_status_declared?: string;
  police_check_status_declared?: string;
  first_aid_status_declared?: string;
  cpr_status_declared?: string;
  wwcc_status_declared?: string;
  availability?: any;
  availability_notes?: string;
  motivation?: string;
  stage: 'new' | 'reviewing' | 'shortlisted' | 'interview' | 'reference_check' | 'offer' | 'hired' | 'unsuccessful' | 'withdrawn';
  source: string;
  submitted_at: string;
  retention_until?: string;
  converted_staff_id?: string;
  hired_at?: string;
  decision_at?: string;
  created_at: string;
  job_vacancies?: {
    id: string;
    reference_number: string;
    title: string;
    status: string;
  };
}

interface ApplicationDetail extends Application {
  files: Array<{
    id: string;
    file_kind: string;
    file_name: string;
    file_size: number;
    mime_type: string;
    created_at: string;
    download_url?: string;
  }>;
  events: Array<{
    id: string;
    event_type: string;
    from_stage?: string;
    to_stage?: string;
    note?: string;
    actor: string;
    created_at: string;
  }>;
  interviews: Array<{
    id: string;
    interview_type: string;
    scheduled_at: string;
    timezone: string;
    interviewer?: string;
    location_or_link?: string;
    status: string;
    notes?: string;
    outcome?: string;
  }>;
  references: Array<{
    id: string;
    referee_name: string;
    relationship: string;
    organisation?: string;
    phone?: string;
    email?: string;
    status: string;
    checked_at?: string;
    notes?: string;
    outcome?: string;
  }>;
  linked_staff?: {
    id: string;
    reference_number: string;
    full_name: string;
    status: string;
    lifecycle_stage: string;
    is_rosterable: boolean;
    employment_basis?: string;
  } | null;
}

interface KPIs {
  open_vacancies: number;
  new_applications: number;
  shortlisted: number;
  interviews: number;
  offers: number;
  hired_last_30_days: number;
  retention_review_due: number;
  total_applications: number;
}

const STAGE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: 'New Inbound', color: '#0284C7', bg: '#E0F2FE' },
  reviewing: { label: 'Reviewing', color: '#D97706', bg: '#FEF3C7' },
  shortlisted: { label: 'Shortlisted', color: '#7C3AED', bg: '#EDE9FE' },
  interview: { label: 'Interview', color: '#2563EB', bg: '#DBEAFE' },
  reference_check: { label: 'Reference Check', color: '#0D9488', bg: '#CCFBF1' },
  offer: { label: 'Offer', color: '#059669', bg: '#D1FAE5' },
  hired: { label: 'Hired & Linked', color: '#16A34A', bg: '#DCFCE7' },
  unsuccessful: { label: 'Unsuccessful', color: '#64748B', bg: '#F1F5F9' },
  withdrawn: { label: 'Withdrawn', color: '#94A3B8', bg: '#F8FAFC' }
};

export default function RecruitmentTab({
  onSelectTab
}: {
  onSelectTab?: (tab: string, extra?: any) => void;
}) {
  const [activeSubTab, setActiveSubTab] = useState<'applications' | 'vacancies' | 'eoi' | 'pipeline' | 'settings'>('applications');
  const [loading, setLoading] = useState(true);
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [kpis, setKpis] = useState<KPIs>({
    open_vacancies: 0,
    new_applications: 0,
    shortlisted: 0,
    interviews: 0,
    offers: 0,
    hired_last_30_days: 0,
    retention_review_due: 0,
    total_applications: 0
  });

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [vacancyFilter, setVacancyFilter] = useState('all');

  // Selected Candidate Drawer
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [appDetail, setAppDetail] = useState<ApplicationDetail | null>(null);
  const [appDetailLoading, setAppDetailLoading] = useState(false);
  const [candidateDrawerTab, setCandidateDrawerTab] = useState<'overview' | 'documents' | 'timeline' | 'interviews' | 'references' | 'notes'>('overview');

  // New Note state
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // New Interview state
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [interviewForm, setInterviewForm] = useState({
    interview_type: 'phone',
    scheduled_at: '',
    interviewer: 'Managing Director',
    location_or_link: '',
    notes: '',
    update_stage_to_interview: true
  });

  // New Reference Check state
  const [showRefModal, setShowRefModal] = useState(false);
  const [refForm, setRefForm] = useState({
    referee_name: '',
    relationship: 'Previous Supervisor',
    organisation: '',
    phone: '',
    email: '',
    applicant_consent_confirmed: true,
    notes: '',
    outcome: 'progress'
  });

  // Hire Modal state
  const [showHireModal, setShowHireModal] = useState(false);
  const [hireForm, setHireForm] = useState({
    role: 'Disability Support Worker',
    engagement_type: 'employee',
    employment_basis: 'casual',
    employment_start_date: '',
    suburbs: [] as string[],
    hourly_rate: '',
    link_existing_staff_id: ''
  });
  const [hiring, setHiring] = useState(false);
  const [hireDuplicate, setHireDuplicate] = useState<any | null>(null);
  const [hireResult, setHireResult] = useState<any | null>(null);

  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);

  const handleDownloadFile = async (appId: string, fileId: string) => {
    setDownloadingFileId(fileId);
    try {
      const res = await fetch(`/api/crm/recruitment/applications/${appId}/files/${fileId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.download_url) {
          window.open(data.download_url, '_blank', 'noopener,noreferrer');
        }
      }
    } catch (err) {
      console.error('Failed to get download URL:', err);
    }
    setDownloadingFileId(null);
  };

  // Vacancy Drawer state
  const [showVacancyDrawer, setShowVacancyDrawer] = useState(false);
  const [editingVacancyId, setEditingVacancyId] = useState<string | null>(null);
  const [vacancyForm, setVacancyForm] = useState({
    title: '',
    category: 'Direct Support',
    short_summary: '',
    about_role: '',
    responsibilities: ['Provide respectful person-centred daily support', 'Support community access and social routines', 'Complete accurate shift records and progress notes'],
    essential_criteria: ['Valid Australian work rights', 'Reliable attendance and professional boundaries', 'Ability to travel to scheduled service locations'],
    desirable_criteria: ['Previous disability or community support experience', 'Relevant Certificate III/IV qualification'],
    service_area_ids: ['coffs-coast'],
    location_notes: '',
    employment_basis: ['casual'],
    engagement_relationship: 'employee',
    positions_count: 1,
    driver_licence_required: true,
    vehicle_required: true,
    ndiswc_required: true,
    police_check_required: true,
    first_aid_required: true,
    cpr_required: true,
    child_related_role: false,
    qualification_required: false,
    pay_display_mode: 'award_text',
    pay_public_text: '',
    status: 'draft',
    featured: false,
    opens_at: '',
    closes_at: ''
  });
  const [savingVacancy, setSavingVacancy] = useState(false);

  // Owner settings state
  const [ownerConfig, setOwnerConfig] = useState({
    careers_email: 'careers@opuscare.com.au',
    recruitment_retention_months: 12
  });
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSavedNotice, setConfigSavedNotice] = useState(false);

  // Load All Data
  const loadRecruitmentData = useCallback(async () => {
    setLoading(true);
    try {
      const [vacRes, appRes, configRes] = await Promise.all([
        fetch('/api/crm/recruitment/vacancies'),
        fetch('/api/crm/recruitment/applications'),
        fetch('/api/crm/provider-config')
      ]);

      if (vacRes.ok) {
        const vData = await vacRes.json();
        setVacancies(vData.vacancies || []);
      }
      if (appRes.ok) {
        const aData = await appRes.json();
        setApplications(aData.applications || []);
        if (aData.kpis) setKpis(aData.kpis);
      }
      if (configRes.ok) {
        const cData = await configRes.json();
        setOwnerConfig({
          careers_email: cData.careers_email || 'careers@opuscare.com.au',
          recruitment_retention_months: cData.recruitment_retention_months || 12
        });
      }
    } catch (err) {
      console.error('Failed to load recruitment CRM data:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadRecruitmentData();
  }, [loadRecruitmentData]);

  // Load Single Candidate Detail
  const loadAppDetail = async (id: string) => {
    setAppDetailLoading(true);
    try {
      const res = await fetch(`/api/crm/recruitment/applications/${id}`);
      if (res.ok) {
        const data = await res.json();
        setAppDetail(data.application);
      }
    } catch (err) {
      console.error('Failed to load candidate detail:', err);
    }
    setAppDetailLoading(false);
  };

  const handleSelectApplication = (id: string) => {
    setSelectedAppId(id);
    setCandidateDrawerTab('overview');
    loadAppDetail(id);
  };

  // Stage change
  const handleStageChange = async (appId: string, toStage: string, note?: string) => {
    try {
      const res = await fetch(`/api/crm/recruitment/applications/${appId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: toStage, note })
      });
      if (res.ok) {
        loadRecruitmentData();
        if (selectedAppId === appId) loadAppDetail(appId);
      }
    } catch (err) {
      console.error('Failed to update stage:', err);
    }
  };

  // Add internal note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppId || !newNote.trim()) return;
    setAddingNote(true);
    try {
      const res = await fetch(`/api/crm/recruitment/applications/${selectedAppId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote.trim() })
      });
      if (res.ok) {
        setNewNote('');
        loadAppDetail(selectedAppId);
      }
    } catch (err) {
      console.error('Failed to add note:', err);
    }
    setAddingNote(false);
  };

  // Schedule Interview
  const handleCreateInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppId || !interviewForm.scheduled_at) return;
    try {
      const res = await fetch(`/api/crm/recruitment/applications/${selectedAppId}/interviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(interviewForm)
      });
      if (res.ok) {
        setShowInterviewModal(false);
        loadAppDetail(selectedAppId);
        loadRecruitmentData();
      }
    } catch (err) {
      console.error('Failed to schedule interview:', err);
    }
  };

  // Add Reference Check
  const handleCreateReference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppId || !refForm.referee_name) return;
    try {
      const res = await fetch(`/api/crm/recruitment/applications/${selectedAppId}/references`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(refForm)
      });
      if (res.ok) {
        setShowRefModal(false);
        loadAppDetail(selectedAppId);
      }
    } catch (err) {
      console.error('Failed to add reference check:', err);
    }
  };

  // Open Hire Modal
  const handleOpenHireModal = (app: ApplicationDetail) => {
    setHireDuplicate(null);
    setHireResult(null);
    setHireForm({
      role: app.job_vacancies?.title || 'Disability Support Worker',
      engagement_type: 'employee',
      employment_basis: app.employment_preferences?.[0] === 'part_time' ? 'part_time' : 'casual',
      employment_start_date: app.earliest_start_date || '',
      suburbs: app.preferred_service_area_ids || [],
      hourly_rate: '',
      link_existing_staff_id: ''
    });
    setShowHireModal(true);
  };

  // Execute Candidate Hire
  const handleExecuteHire = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedAppId) return;
    setHiring(true);
    setHireDuplicate(null);

    try {
      const res = await fetch(`/api/crm/recruitment/applications/${selectedAppId}/hire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hireForm)
      });

      const result = await res.json();

      if (res.status === 409 && result.duplicate_found) {
        setHireDuplicate(result.existing_staff);
        setHiring(false);
        return;
      }

      if (res.ok && result.ok) {
        setHireResult(result);
        loadAppDetail(selectedAppId);
        loadRecruitmentData();
      }
    } catch (err) {
      console.error('Failed to hire candidate:', err);
    }
    setHiring(false);
  };

  // Purge Application
  const handlePurgeApplication = async (appId: string) => {
    if (!confirm('Are you sure you want to permanently purge this candidate application and delete all private CV files? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/crm/recruitment/applications/${appId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm_purge: true })
      });
      if (res.ok) {
        setSelectedAppId(null);
        setAppDetail(null);
        loadRecruitmentData();
      }
    } catch (err) {
      console.error('Failed to purge application:', err);
    }
  };

  // Vacancy Drawer open
  const handleOpenVacancyDrawer = (vac?: Vacancy) => {
    if (vac) {
      setEditingVacancyId(vac.id);
      setVacancyForm({
        title: vac.title,
        category: vac.category || 'Direct Support',
        short_summary: vac.short_summary,
        about_role: vac.about_role,
        responsibilities: vac.responsibilities || [],
        essential_criteria: vac.essential_criteria || [],
        desirable_criteria: vac.desirable_criteria || [],
        service_area_ids: vac.service_area_ids || [],
        location_notes: vac.location_notes || '',
        employment_basis: vac.employment_basis || ['casual'],
        engagement_relationship: vac.engagement_relationship || 'employee',
        positions_count: vac.positions_count || 1,
        driver_licence_required: vac.driver_licence_required,
        vehicle_required: vac.vehicle_required,
        ndiswc_required: vac.ndiswc_required,
        police_check_required: vac.police_check_required,
        first_aid_required: vac.first_aid_required,
        cpr_required: vac.cpr_required,
        child_related_role: vac.child_related_role,
        qualification_required: vac.qualification_required,
        pay_display_mode: vac.pay_display_mode,
        pay_public_text: vac.pay_public_text || '',
        status: vac.status,
        featured: vac.featured,
        opens_at: vac.opens_at ? vac.opens_at.slice(0, 10) : '',
        closes_at: vac.closes_at ? vac.closes_at.slice(0, 10) : ''
      });
    } else {
      setEditingVacancyId(null);
      setVacancyForm({
        title: '',
        category: 'Direct Support',
        short_summary: '',
        about_role: '',
        responsibilities: ['Provide respectful person-centred daily support', 'Support community access and social routines', 'Complete accurate shift records and progress notes'],
        essential_criteria: ['Valid Australian work rights', 'Reliable attendance and professional boundaries', 'Ability to travel to scheduled service locations'],
        desirable_criteria: ['Previous disability or community support experience', 'Relevant Certificate III/IV qualification'],
        service_area_ids: ['coffs-coast'],
        location_notes: '',
        employment_basis: ['casual'],
        engagement_relationship: 'employee',
        positions_count: 1,
        driver_licence_required: true,
        vehicle_required: true,
        ndiswc_required: true,
        police_check_required: true,
        first_aid_required: true,
        cpr_required: true,
        child_related_role: false,
        qualification_required: false,
        pay_display_mode: 'award_text',
        pay_public_text: '',
        status: 'draft',
        featured: false,
        opens_at: '',
        closes_at: ''
      });
    }
    setShowVacancyDrawer(true);
  };

  // Save Vacancy
  const handleSaveVacancy = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingVacancy(true);
    try {
      const url = editingVacancyId
        ? `/api/crm/recruitment/vacancies/${editingVacancyId}`
        : '/api/crm/recruitment/vacancies';
      const method = editingVacancyId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vacancyForm)
      });

      if (res.ok) {
        setShowVacancyDrawer(false);
        loadRecruitmentData();
      }
    } catch (err) {
      console.error('Failed to save vacancy:', err);
    }
    setSavingVacancy(false);
  };

  // Save Owner Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    setConfigSavedNotice(false);
    try {
      const res = await fetch('/api/crm/provider-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ownerConfig)
      });
      if (res.ok) {
        setConfigSavedNotice(true);
        setTimeout(() => setConfigSavedNotice(false), 4000);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
    setSavingConfig(false);
  };

  // Filtered Applications
  const filteredApps = applications.filter(app => {
    if (activeSubTab === 'eoi' && app.application_type !== 'eoi') return false;
    if (activeSubTab === 'applications' && app.application_type === 'eoi') {
      // Show all in applications tab or only vacancies? Spec says applications sub-tab lists all with EOI labeled
    }
    if (stageFilter !== 'all' && app.stage !== stageFilter) return false;
    if (vacancyFilter !== 'all' && app.vacancy_id !== vacancyFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const name = `${app.first_name || ''} ${app.last_name || ''}`.toLowerCase();
      const email = (app.email || '').toLowerCase();
      const phone = (app.phone || '').toLowerCase();
      const ref = (app.reference_number || '').toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q) || ref.includes(q);
    }
    return true;
  });

  return (
    <div className="crmRecruitmentTabRoot" style={{ padding: '24px 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>
            Recruitment
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#64748B' }}>
            Manage vacancies, applications and hiring handoff into the existing Opus Care workforce onboarding process.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            className="btnSecondary"
            onClick={() => setActiveSubTab('settings')}
            style={{ fontSize: '0.85rem' }}
          >
            <SettingsIcon size={15} />
            <span>Recruitment Settings</span>
          </button>
          <button
            type="button"
            className="btnPrimary"
            onClick={() => handleOpenVacancyDrawer()}
            style={{ fontSize: '0.85rem' }}
          >
            <Plus size={16} />
            <span>Create Vacancy</span>
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 14,
        marginBottom: 28
      }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '16px 18px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Open Vacancies</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', marginTop: 4 }}>{kpis.open_vacancies}</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '16px 18px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0284C7', textTransform: 'uppercase' }}>New Applications</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0284C7', marginTop: 4 }}>{kpis.new_applications}</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '16px 18px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#7C3AED', textTransform: 'uppercase' }}>Shortlisted</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#7C3AED', marginTop: 4 }}>{kpis.shortlisted}</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '16px 18px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2563EB', textTransform: 'uppercase' }}>Interviews</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2563EB', marginTop: 4 }}>{kpis.interviews}</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '16px 18px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#059669', textTransform: 'uppercase' }}>Offers</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669', marginTop: 4 }}>{kpis.offers}</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '16px 18px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#16A34A', textTransform: 'uppercase' }}>Hired (30d)</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#16A34A', marginTop: 4 }}>{kpis.hired_last_30_days}</div>
        </div>

        {kpis.retention_review_due > 0 && (
          <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 14, padding: '16px 18px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#D97706', textTransform: 'uppercase' }}>Retention Review</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#D97706', marginTop: 4 }}>{kpis.retention_review_due}</div>
          </div>
        )}
      </div>

      {/* SUB-TABS NAVIGATION */}
      <div style={{
        display: 'flex',
        gap: 8,
        borderBottom: '1px solid #E2E8F0',
        marginBottom: 24
      }}>
        {[
          { id: 'applications', label: 'Applications', count: applications.length },
          { id: 'vacancies', label: 'Vacancies', count: vacancies.length },
          { id: 'eoi', label: 'Expression of Interest', count: applications.filter(a => a.application_type === 'eoi').length },
          { id: 'pipeline', label: 'Pipeline Board' },
          { id: 'settings', label: 'Settings' }
        ].map(st => (
          <button
            key={st.id}
            type="button"
            onClick={() => setActiveSubTab(st.id as any)}
            style={{
              padding: '10px 18px',
              fontSize: '0.875rem',
              fontWeight: activeSubTab === st.id ? 700 : 500,
              color: activeSubTab === st.id ? '#0284C7' : '#64748B',
              borderBottom: activeSubTab === st.id ? '2px solid #0284C7' : '2px solid transparent',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span>{st.label}</span>
            {st.count !== undefined && (
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                background: activeSubTab === st.id ? '#E0F2FE' : '#F1F5F9',
                color: activeSubTab === st.id ? '#0284C7' : '#64748B',
                padding: '2px 8px',
                borderRadius: 9999
              }}>
                {st.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ════════ SUB-TAB 1: VACANCIES ════════ */}
      {activeSubTab === 'vacancies' && (
        <div>
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 16,
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: 600 }}>
                  <th style={{ padding: '14px 18px' }}>Ref / Title</th>
                  <th style={{ padding: '14px 18px' }}>Category</th>
                  <th style={{ padding: '14px 18px' }}>Service Areas</th>
                  <th style={{ padding: '14px 18px' }}>Basis</th>
                  <th style={{ padding: '14px 18px' }}>Status</th>
                  <th style={{ padding: '14px 18px' }}>Applications</th>
                  <th style={{ padding: '14px 18px' }}>Closing Date</th>
                  <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vacancies.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: '#64748B' }}>
                      <Briefcase size={32} style={{ margin: '0 auto 12px', color: '#94A3B8' }} />
                      <div style={{ fontWeight: 600, fontSize: '1rem', color: '#0F172A' }}>No vacancies created yet</div>
                      <p style={{ fontSize: '0.85rem', marginTop: 4 }}>
                        Click &quot;Create Vacancy&quot; above to create a draft role. Vacancies will remain draft until explicitly published.
                      </p>
                    </td>
                  </tr>
                ) : (
                  vacancies.map(vac => (
                    <tr key={vac.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A' }}>{vac.title}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{vac.reference_number}</div>
                      </td>
                      <td style={{ padding: '14px 18px', color: '#475569' }}>{vac.category || 'Direct Support'}</td>
                      <td style={{ padding: '14px 18px', color: '#475569' }}>
                        {vac.service_area_ids?.map(id => getRecruitmentAreaName(id)).join(', ') || 'Northern NSW'}
                      </td>
                      <td style={{ padding: '14px 18px', color: '#475569', textTransform: 'capitalize' }}>
                        {vac.employment_basis?.join(' / ').replace(/_/g, ' ') || 'Casual'}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          display: 'inline-block',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 6,
                          textTransform: 'uppercase',
                          background: vac.status === 'published' ? '#ECFDF5' : vac.status === 'draft' ? '#FEF3C7' : '#F1F5F9',
                          color: vac.status === 'published' ? '#059669' : vac.status === 'draft' ? '#D97706' : '#64748B'
                        }}>
                          {vac.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: 600, color: '#0F172A' }}>
                        {vac.applications_count || 0}
                      </td>
                      <td style={{ padding: '14px 18px', color: '#64748B' }}>
                        {vac.closes_at ? new Date(vac.closes_at).toLocaleDateString('en-AU') : 'Open until filled'}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          {vac.status === 'published' && (
                            <Link
                              href={`/careers/${vac.slug}`}
                              target="_blank"
                              className="btnSecondary"
                              style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                              title="Preview Public Page"
                            >
                              <ExternalLink size={13} />
                              <span>View</span>
                            </Link>
                          )}
                          <button
                            type="button"
                            className="btnSecondary"
                            onClick={() => handleOpenVacancyDrawer(vac)}
                            style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                          >
                            <Edit3 size={13} />
                            <span>Edit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════════ SUB-TAB 2: APPLICATIONS & EOI ════════ */}
      {(activeSubTab === 'applications' || activeSubTab === 'eoi') && (
        <div>
          {/* Filters Bar */}
          <div style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            marginBottom: 18,
            flexWrap: 'wrap'
          }}>
            <div style={{ position: 'relative', minWidth: 260, flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Search candidates by name, email, phone, reference..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 36px',
                  border: '1px solid #CBD5E1',
                  borderRadius: 10,
                  fontSize: '0.875rem'
                }}
              />
            </div>

            <select
              value={stageFilter}
              onChange={e => setStageFilter(e.target.value)}
              style={{
                padding: '10px 14px',
                border: '1px solid #CBD5E1',
                borderRadius: 10,
                fontSize: '0.875rem',
                background: '#FFFFFF'
              }}
            >
              <option value="all">All Stages</option>
              <option value="new">New Inbound</option>
              <option value="reviewing">Reviewing</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interview">Interview</option>
              <option value="reference_check">Reference Check</option>
              <option value="offer">Offer</option>
              <option value="hired">Hired &amp; Linked</option>
              <option value="unsuccessful">Unsuccessful</option>
              <option value="withdrawn">Withdrawn</option>
            </select>

            <select
              value={vacancyFilter}
              onChange={e => setVacancyFilter(e.target.value)}
              style={{
                padding: '10px 14px',
                border: '1px solid #CBD5E1',
                borderRadius: 10,
                fontSize: '0.875rem',
                background: '#FFFFFF'
              }}
            >
              <option value="all">All Vacancies / EOI</option>
              {vacancies.map(v => (
                <option key={v.id} value={v.id}>{v.title} ({v.reference_number})</option>
              ))}
            </select>
          </div>

          {/* Applications Table */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 16,
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: 600 }}>
                  <th style={{ padding: '14px 18px' }}>Ref / Applicant</th>
                  <th style={{ padding: '14px 18px' }}>Role / Vacancy</th>
                  <th style={{ padding: '14px 18px' }}>Location</th>
                  <th style={{ padding: '14px 18px' }}>Preferred Areas</th>
                  <th style={{ padding: '14px 18px' }}>Stage</th>
                  <th style={{ padding: '14px 18px' }}>Submitted</th>
                  <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApps.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: '#64748B' }}>
                      <Users size={32} style={{ margin: '0 auto 12px', color: '#94A3B8' }} />
                      <div style={{ fontWeight: 600, fontSize: '1rem', color: '#0F172A' }}>No applications match your filter</div>
                      <p style={{ fontSize: '0.85rem', marginTop: 4 }}>
                        Public submissions and Expressions of Interest from the website will appear here in real-time.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredApps.map(app => {
                    const st = STAGE_CONFIG[app.stage] || STAGE_CONFIG.new;
                    return (
                      <tr
                        key={app.id}
                        onClick={() => handleSelectApplication(app.id)}
                        style={{
                          borderBottom: '1px solid #F1F5F9',
                          cursor: 'pointer',
                          background: selectedAppId === app.id ? '#F0F9FF' : 'transparent',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: 700, color: '#0F172A' }}>{app.first_name} {app.last_name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{app.reference_number} · {app.email}</div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          {app.application_type === 'eoi' ? (
                            <span style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: '#7C3AED',
                              background: '#EDE9FE',
                              padding: '3px 8px',
                              borderRadius: 6
                            }}>
                              Expression of Interest
                            </span>
                          ) : (
                            <div style={{ color: '#0F172A', fontWeight: 600 }}>
                              {app.job_vacancies?.title || 'Vacancy Role'}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '14px 18px', color: '#475569' }}>
                          {app.suburb}, NSW {app.postcode}
                        </td>
                        <td style={{ padding: '14px 18px', color: '#475569', fontSize: '0.8rem' }}>
                          {app.preferred_service_area_ids?.slice(0, 2).map(id => getRecruitmentAreaName(id)).join(', ') || 'All'}
                          {app.preferred_service_area_ids?.length > 2 && ` +${app.preferred_service_area_ids.length - 2}`}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{
                            display: 'inline-block',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '3px 10px',
                            borderRadius: 6,
                            background: st.bg,
                            color: st.color
                          }}>
                            {st.label}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', color: '#64748B', fontSize: '0.8rem' }}>
                          {new Date(app.submitted_at).toLocaleDateString('en-AU')}
                        </td>
                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btnSecondary"
                            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectApplication(app.id);
                            }}
                          >
                            <span>Open 360</span>
                            <ChevronRight size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════════ SUB-TAB 4: PIPELINE BOARD ════════ */}
      {activeSubTab === 'pipeline' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
          overflowX: 'auto',
          paddingBottom: 24
        }}>
          {['new', 'reviewing', 'shortlisted', 'interview', 'reference_check', 'offer', 'hired'].map(stageKey => {
            const st = STAGE_CONFIG[stageKey];
            const stageApps = applications.filter(a => a.stage === stageKey);

            return (
              <div
                key={stageKey}
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: 16,
                  padding: 16,
                  minHeight: 400
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 14,
                  paddingBottom: 10,
                  borderBottom: `2px solid ${st.color}`
                }}>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0F172A' }}>{st.label}</span>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: st.bg,
                    color: st.color,
                    padding: '2px 8px',
                    borderRadius: 9999
                  }}>
                    {stageApps.length}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {stageApps.map(app => (
                    <div
                      key={app.id}
                      onClick={() => handleSelectApplication(app.id)}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: 12,
                        padding: 14,
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F172A' }}>
                        {app.first_name} {app.last_name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>
                        {app.reference_number} · {app.suburb}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#0284C7', fontWeight: 600, marginTop: 6 }}>
                        {app.application_type === 'eoi' ? 'Expression of Interest' : (app.job_vacancies?.title || 'Vacancy')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ════════ SUB-TAB 5: OWNER SETTINGS ════════ */}
      {activeSubTab === 'settings' && (
        <div style={{ maxWidth: 640 }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: 28 }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
              Careers &amp; Recruitment Configuration
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: 24 }}>
              Owner self-service settings for candidate email notifications and applicant data retention.
            </p>

            {configSavedNotice && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 14px',
                background: '#ECFDF5',
                border: '1px solid #A7F3D0',
                borderRadius: 8,
                color: '#065F46',
                fontSize: '0.875rem',
                fontWeight: 600,
                marginBottom: 18
              }}>
                <CheckCircle2 size={16} />
                <span>Recruitment configuration saved successfully.</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings}>
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Careers Destination Email
                </label>
                <input
                  type="email"
                  required
                  value={ownerConfig.careers_email}
                  onChange={e => setOwnerConfig(c => ({ ...c, careers_email: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #CBD5E1', borderRadius: 8 }}
                />
                <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 4, display: 'block' }}>
                  Alerts for new applications and expressions of interest will be delivered here.
                </span>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Candidate Retention Policy (Months)
                </label>
                <input
                  type="number"
                  min={1}
                  max={84}
                  required
                  value={ownerConfig.recruitment_retention_months}
                  onChange={e => setOwnerConfig(c => ({ ...c, recruitment_retention_months: Number(e.target.value) }))}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #CBD5E1', borderRadius: 8 }}
                />
                <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 4, display: 'block' }}>
                  Opus Care internal business policy for candidate review retention (Default: 12 months).
                </span>
              </div>

              <button type="submit" className="btnPrimary" disabled={savingConfig}>
                {savingConfig ? 'Saving...' : 'Save Settings'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ════════ CANDIDATE 360 DRAWER ════════ */}
      {selectedAppId && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: 680,
          background: '#FFFFFF',
          boxShadow: '-10px 0 30px rgba(15, 23, 42, 0.15)',
          zIndex: 900,
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid #E2E8F0'
        }}>
          {/* Drawer Header */}
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            background: '#F8FAFC'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  {appDetail?.first_name} {appDetail?.last_name}
                </h2>
                {appDetail && (
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 6,
                    background: STAGE_CONFIG[appDetail.stage]?.bg || '#E0F2FE',
                    color: STAGE_CONFIG[appDetail.stage]?.color || '#0284C7'
                  }}>
                    {STAGE_CONFIG[appDetail.stage]?.label || appDetail.stage}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                {appDetail?.reference_number} · {appDetail?.application_type === 'eoi' ? 'Expression of Interest' : appDetail?.job_vacancies?.title}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              {appDetail && appDetail.stage !== 'hired' && (
                <button
                  type="button"
                  className="btnPrimary"
                  onClick={() => handleOpenHireModal(appDetail)}
                  style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                >
                  <UserCheck size={15} />
                  <span>Hire Candidate</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedAppId(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 6,
                  color: '#64748B'
                }}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Drawer Tabs */}
          <div style={{
            display: 'flex',
            gap: 6,
            padding: '0 24px',
            borderBottom: '1px solid #E2E8F0',
            background: '#F8FAFC'
          }}>
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'documents', label: 'Documents', count: appDetail?.files?.length },
              { id: 'timeline', label: 'Timeline', count: appDetail?.events?.length },
              { id: 'interviews', label: 'Interviews', count: appDetail?.interviews?.length },
              { id: 'references', label: 'References', count: appDetail?.references?.length },
              { id: 'notes', label: 'Notes' }
            ].map(dt => (
              <button
                key={dt.id}
                type="button"
                onClick={() => setCandidateDrawerTab(dt.id as any)}
                style={{
                  padding: '10px 14px',
                  fontSize: '0.825rem',
                  fontWeight: candidateDrawerTab === dt.id ? 700 : 500,
                  color: candidateDrawerTab === dt.id ? '#0284C7' : '#64748B',
                  borderBottom: candidateDrawerTab === dt.id ? '2px solid #0284C7' : '2px solid transparent',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <span>{dt.label}</span>
                {dt.count !== undefined && dt.count > 0 && (
                  <span style={{ marginLeft: 4, fontSize: '0.7rem', opacity: 0.7 }}>({dt.count})</span>
                )}
              </button>
            ))}
          </div>

          {/* Drawer Body Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
            {appDetailLoading ? (
              <div style={{ textAlign: 'center', padding: 48, color: '#64748B' }}>
                <Loader2 size={24} className="spinner" style={{ margin: '0 auto 12px' }} />
                <span>Loading candidate profile...</span>
              </div>
            ) : appDetail ? (
              <div>
                {/* 1. OVERVIEW TAB */}
                {candidateDrawerTab === 'overview' && (
                  <div>
                    {/* Move Stage Selector */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: 14,
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: 12,
                      marginBottom: 20
                    }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Pipeline Stage:</span>
                      <select
                        value={appDetail.stage}
                        onChange={e => handleStageChange(appDetail.id, e.target.value)}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          border: '1px solid #CBD5E1',
                          borderRadius: 8,
                          fontSize: '0.85rem',
                          background: '#FFFFFF',
                          fontWeight: 600
                        }}
                      >
                        <option value="new">New Inbound</option>
                        <option value="reviewing">Reviewing</option>
                        <option value="shortlisted">Shortlisted</option>
                        <option value="interview">Interview</option>
                        <option value="reference_check">Reference Check</option>
                        <option value="offer">Offer</option>
                        <option value="hired">Hired &amp; Linked</option>
                        <option value="unsuccessful">Unsuccessful</option>
                        <option value="withdrawn">Withdrawn</option>
                      </select>
                    </div>

                    {/* Linked Staff Handoff Banner */}
                    {appDetail.linked_staff && (
                      <div style={{
                        background: '#ECFDF5',
                        border: '1px solid #A7F3D0',
                        borderRadius: 12,
                        padding: 16,
                        marginBottom: 20
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#065F46', fontWeight: 700, fontSize: '0.9rem' }}>
                          <CheckCircle2 size={18} />
                          <span>Hired &amp; Linked to Staff {appDetail.linked_staff.reference_number}</span>
                        </div>
                        <p style={{ fontSize: '0.825rem', color: '#047857', marginTop: 4 }}>
                          Worker status: <strong>{appDetail.linked_staff.status}</strong> · Lifecycle: <strong>{appDetail.linked_staff.lifecycle_stage}</strong> · Rosterable: <strong>{appDetail.linked_staff.is_rosterable ? 'Yes' : 'No (Fail-Closed)'}</strong>
                        </p>
                        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                          {onSelectTab && (
                            <>
                              <button
                                type="button"
                                className="btnSecondary"
                                onClick={() => onSelectTab('staff', { staffId: appDetail.linked_staff?.id })}
                                style={{ padding: '6px 12px', fontSize: '0.75rem', background: '#FFFFFF' }}
                              >
                                Worker 360
                              </button>
                              <button
                                type="button"
                                className="btnSecondary"
                                onClick={() => onSelectTab('agreements', { staffId: appDetail.linked_staff?.id })}
                                style={{ padding: '6px 12px', fontSize: '0.75rem', background: '#FFFFFF' }}
                              >
                                Generate Agreement
                              </button>
                              <button
                                type="button"
                                className="btnSecondary"
                                onClick={() => onSelectTab('compliance', { staffId: appDetail.linked_staff?.id })}
                                style={{ padding: '6px 12px', fontSize: '0.75rem', background: '#FFFFFF' }}
                              >
                                Compliance Onboarding
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Contact Details */}
                    <div style={{ marginBottom: 20 }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>Contact &amp; Location</h4>
                      <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: '0.85rem' }}>
                          <div><span style={{ color: '#64748B' }}>Email:</span> <strong>{appDetail.email}</strong></div>
                          <div><span style={{ color: '#64748B' }}>Phone:</span> <strong>{appDetail.phone}</strong></div>
                          <div><span style={{ color: '#64748B' }}>Suburb:</span> <strong>{appDetail.suburb}, NSW {appDetail.postcode}</strong></div>
                          <div><span style={{ color: '#64748B' }}>Work Rights:</span> <strong>{appDetail.work_rights_status}</strong></div>
                          <div><span style={{ color: '#64748B' }}>Earliest Start:</span> <strong>{appDetail.earliest_start_date || 'Immediate'}</strong></div>
                        </div>
                      </div>
                    </div>

                    {/* Unverified Declarations Notice */}
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Applicant Self-Declarations</h4>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, background: '#FEF3C7', color: '#D97706', padding: '2px 8px', borderRadius: 6 }}>
                          STATUS-ONLY / UNVERIFIED
                        </span>
                      </div>
                      <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: '0.825rem' }}>
                          <div><span style={{ color: '#64748B' }}>NDISWC:</span> <strong>{appDetail.ndiswc_status_declared || 'Not declared'}</strong></div>
                          <div><span style={{ color: '#64748B' }}>Police Check:</span> <strong>{appDetail.police_check_status_declared || 'Not declared'}</strong></div>
                          <div><span style={{ color: '#64748B' }}>First Aid:</span> <strong>{appDetail.first_aid_status_declared || 'Not declared'}</strong></div>
                          <div><span style={{ color: '#64748B' }}>CPR:</span> <strong>{appDetail.cpr_status_declared || 'Not declared'}</strong></div>
                          <div><span style={{ color: '#64748B' }}>Driver Licence:</span> <strong>{appDetail.driver_licence_status || 'Not declared'}</strong></div>
                          <div><span style={{ color: '#64748B' }}>Vehicle Access:</span> <strong>{appDetail.vehicle_access_status || 'Not declared'}</strong></div>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: 10, borderTop: '1px solid #E2E8F0', paddingTop: 8 }}>
                          Declarations are self-reported by candidate. Verified compliance evidence is required during formal onboarding before roster readiness.
                        </div>
                      </div>
                    </div>

                    {/* Experience & Motivation */}
                    {appDetail.experience_summary && (
                      <div style={{ marginBottom: 16 }}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>Relevant Experience</h4>
                        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, fontSize: '0.85rem', lineHeight: 1.6 }}>
                          {appDetail.experience_summary}
                        </div>
                      </div>
                    )}

                    {appDetail.motivation && (
                      <div style={{ marginBottom: 16 }}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>Motivation &amp; Values</h4>
                        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, fontSize: '0.85rem', lineHeight: 1.6 }}>
                          {appDetail.motivation}
                        </div>
                      </div>
                    )}

                    {/* Purge Action */}
                    <div style={{ marginTop: 32, paddingTop: 18, borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                        Retention policy review: {appDetail.retention_until ? new Date(appDetail.retention_until).toLocaleDateString('en-AU') : '12 months'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handlePurgeApplication(appDetail.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#DC2626',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        <Trash2 size={13} />
                        <span>Purge Application</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. DOCUMENTS TAB */}
                {candidateDrawerTab === 'documents' && (
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>
                      Application Files (Private Storage)
                    </h4>
                    {appDetail.files.length === 0 ? (
                      <p style={{ color: '#64748B', fontSize: '0.85rem' }}>No documents uploaded with this application.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {appDetail.files.map(f => (
                          <div
                            key={f.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: 14,
                              background: '#F8FAFC',
                              border: '1px solid #E2E8F0',
                              borderRadius: 10
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <FileText size={20} className="textEmerald" />
                              <div>
                                <strong style={{ fontSize: '0.875rem', color: '#0F172A' }}>{f.file_name}</strong>
                                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                                  {f.file_kind.toUpperCase()} · {(f.file_size / (1024 * 1024)).toFixed(2)} MB
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDownloadFile(appDetail.id, f.id)}
                              disabled={downloadingFileId === f.id}
                              className="btnSecondary"
                              style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                            >
                              <Download size={13} />
                              <span>{downloadingFileId === f.id ? 'Opening...' : 'Download'}</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. TIMELINE TAB */}
                {candidateDrawerTab === 'timeline' && (
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A', marginBottom: 14 }}>
                      Immutable Audit Trail
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {appDetail.events.map(ev => (
                        <div
                          key={ev.id}
                          style={{
                            padding: 12,
                            background: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            borderRadius: 10,
                            fontSize: '0.825rem'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <strong style={{ color: '#0F172A' }}>{ev.event_type.replace(/_/g, ' ').toUpperCase()}</strong>
                            <span style={{ color: '#64748B' }}>{new Date(ev.created_at).toLocaleString('en-AU')}</span>
                          </div>
                          <div style={{ color: '#334155' }}>{ev.note || 'No notes'}</div>
                          <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: 4 }}>Actor: {ev.actor}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. INTERVIEWS TAB */}
                {candidateDrawerTab === 'interviews' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Interviews</h4>
                      <button
                        type="button"
                        className="btnPrimary"
                        onClick={() => setShowInterviewModal(true)}
                        style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                      >
                        <Plus size={13} />
                        <span>Schedule Interview</span>
                      </button>
                    </div>

                    {appDetail.interviews.length === 0 ? (
                      <p style={{ color: '#64748B', fontSize: '0.85rem' }}>No interviews scheduled yet.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {appDetail.interviews.map(inv => (
                          <div key={inv.id} style={{ padding: 14, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <strong style={{ fontSize: '0.875rem' }}>{inv.interview_type.toUpperCase()} INTERVIEW</strong>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284C7' }}>{inv.status}</span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: 4 }}>
                              {new Date(inv.scheduled_at).toLocaleString('en-AU')} · Interviewer: {inv.interviewer || 'Managing Director'}
                            </div>
                            {inv.notes && <div style={{ fontSize: '0.8rem', color: '#334155', marginTop: 6 }}>Notes: {inv.notes}</div>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 5. REFERENCES TAB */}
                {candidateDrawerTab === 'references' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Reference Checks</h4>
                      <button
                        type="button"
                        className="btnPrimary"
                        onClick={() => setShowRefModal(true)}
                        style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                      >
                        <Plus size={13} />
                        <span>Add Referee</span>
                      </button>
                    </div>

                    {appDetail.references.length === 0 ? (
                      <p style={{ color: '#64748B', fontSize: '0.85rem' }}>No referee records added yet.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {appDetail.references.map(ref => (
                          <div key={ref.id} style={{ padding: 14, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <strong style={{ fontSize: '0.875rem' }}>{ref.referee_name} ({ref.relationship})</strong>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: ref.status === 'completed' ? '#059669' : '#D97706' }}>
                                {ref.status.toUpperCase()}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: 4 }}>
                              {ref.organisation && `${ref.organisation} · `}{ref.phone || ref.email || ''}
                            </div>
                            {ref.notes && <div style={{ fontSize: '0.8rem', color: '#334155', marginTop: 6 }}>Notes: {ref.notes}</div>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 6. NOTES TAB */}
                {candidateDrawerTab === 'notes' && (
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>Internal Hiring Notes</h4>
                    <form onSubmit={handleAddNote} style={{ marginBottom: 20 }}>
                      <textarea
                        rows={3}
                        required
                        placeholder="Add an internal observation, interview feedback or qualification check note..."
                        value={newNote}
                        onChange={e => setNewNote(e.target.value)}
                        style={{ width: '100%', padding: 12, border: '1px solid #CBD5E1', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8 }}
                      />
                      <button type="submit" className="btnPrimary" disabled={addingNote} style={{ fontSize: '0.8rem', padding: '8px 14px' }}>
                        {addingNote ? 'Saving Note...' : 'Add Note'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ════════ HIRE CANDIDATE MODAL ════════ */}
      {showHireModal && appDetail && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 20,
            maxWidth: 580,
            width: '100%',
            padding: 32,
            boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)'
          }}>
            {hireResult ? (
              /* Success Handoff Card */
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: '#ECFDF5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}>
                  <CheckCircle2 size={36} />
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
                  Candidate Hired &amp; Staff Record Created
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: 20 }}>
                  <strong>{appDetail.first_name} {appDetail.last_name}</strong> has been created as <strong>{hireResult.staff_reference}</strong> with explicit fail-closed governance status (Status: pending, Rosterable: false).
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
                  {onSelectTab && (
                    <>
                      <button
                        type="button"
                        className="btnPrimary"
                        onClick={() => {
                          setShowHireModal(false);
                          setSelectedAppId(null);
                          onSelectTab('agreements', { staffId: hireResult.staff_id });
                        }}
                      >
                        Generate Employment Agreement &rarr;
                      </button>
                      <button
                        type="button"
                        className="btnSecondary"
                        onClick={() => {
                          setShowHireModal(false);
                          setSelectedAppId(null);
                          onSelectTab('compliance', { staffId: hireResult.staff_id });
                        }}
                      >
                        Verify Worker Compliance Credentials &rarr;
                      </button>
                      <button
                        type="button"
                        className="btnSecondary"
                        onClick={() => {
                          setShowHireModal(false);
                          setSelectedAppId(null);
                          onSelectTab('staff', { staffId: hireResult.staff_id });
                        }}
                      >
                        Open Worker 360 &rarr;
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => { setShowHireModal(false); setSelectedAppId(null); }}
                    style={{ background: 'transparent', border: 'none', color: '#64748B', fontSize: '0.85rem', cursor: 'pointer', marginTop: 10 }}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              /* Hire Form */
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    Hire Candidate: {appDetail.first_name} {appDetail.last_name}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowHireModal(false)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Duplicate Warning */}
                {hireDuplicate && (
                  <div style={{
                    background: '#FEF3C7',
                    border: '1px solid #FDE68A',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 20
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#D97706', fontWeight: 700, fontSize: '0.875rem' }}>
                      <AlertTriangle size={16} />
                      <span>Existing Worker Record Found ({hireDuplicate.reference_number})</span>
                    </div>
                    <p style={{ fontSize: '0.825rem', color: '#92400E', marginTop: 4 }}>
                      A worker with email {hireDuplicate.email} is already in the workforce directory. You can link this recruitment application directly to the existing worker record instead of creating a duplicate.
                    </p>
                    <button
                      type="button"
                      className="btnPrimary"
                      style={{ marginTop: 10, fontSize: '0.8rem', padding: '6px 14px' }}
                      onClick={() => {
                        setHireForm(f => ({ ...f, link_existing_staff_id: hireDuplicate.id }));
                        handleExecuteHire();
                      }}
                    >
                      Link to {hireDuplicate.reference_number} ({hireDuplicate.full_name})
                    </button>
                  </div>
                )}

                <form onSubmit={handleExecuteHire}>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                      Role Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={hireForm.role}
                      onChange={e => setHireForm(f => ({ ...f, role: e.target.value }))}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: '0.875rem' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                        Engagement Type *
                      </label>
                      <select
                        value={hireForm.engagement_type}
                        onChange={e => setHireForm(f => ({ ...f, engagement_type: e.target.value }))}
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: '0.875rem' }}
                      >
                        <option value="employee">Employee (PAYG)</option>
                        <option value="contractor">Contractor (ABN)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                        Employment Basis
                      </label>
                      <select
                        disabled={hireForm.engagement_type === 'contractor'}
                        value={hireForm.employment_basis}
                        onChange={e => setHireForm(f => ({ ...f, employment_basis: e.target.value }))}
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: '0.875rem' }}
                      >
                        <option value="casual">Casual</option>
                        <option value="part_time">Part-Time</option>
                        <option value="full_time">Full-Time</option>
                        <option value="fixed_term">Fixed-Term</option>
                        {hireForm.engagement_type === 'contractor' && <option value="not_applicable">Not Applicable</option>}
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                      Planned Start Date
                    </label>
                    <input
                      type="date"
                      value={hireForm.employment_start_date}
                      onChange={e => setHireForm(f => ({ ...f, employment_start_date: e.target.value }))}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: '0.875rem' }}
                    />
                  </div>

                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                      Approved Service Areas
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      {RECRUITMENT_SERVICE_AREAS.map(area => (
                        <label key={area.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#334155' }}>
                          <input
                            type="checkbox"
                            checked={hireForm.suburbs.includes(area.id)}
                            onChange={e => {
                              const next = e.target.checked
                                ? [...hireForm.suburbs, area.id]
                                : hireForm.suburbs.filter(id => id !== area.id);
                              setHireForm(f => ({ ...f, suburbs: next }));
                            }}
                          />
                          <span>{area.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: 10,
                    padding: 12,
                    marginBottom: 20,
                    fontSize: '0.8rem',
                    color: '#64748B'
                  }}>
                    <ShieldCheck size={16} className="textEmerald" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                    <strong>Fail-Closed Staff Creation:</strong> New worker record is created with status <em>pending</em>, lifecycle <em>onboarding</em> and rosterable <em>false</em>. Credential documents will remain unverified until inspected.
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button
                      type="button"
                      className="btnSecondary"
                      onClick={() => setShowHireModal(false)}
                      disabled={hiring}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btnPrimary"
                      disabled={hiring}
                    >
                      {hiring ? 'Processing Hire...' : 'Confirm & Complete Hire'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════ VACANCY EDITOR DRAWER ════════ */}
      {showVacancyDrawer && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: 640,
          background: '#FFFFFF',
          boxShadow: '-10px 0 30px rgba(15, 23, 42, 0.15)',
          zIndex: 900,
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid #E2E8F0'
        }}>
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#F8FAFC'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              {editingVacancyId ? 'Edit Vacancy' : 'Create New Vacancy'}
            </h3>
            <button
              type="button"
              onClick={() => setShowVacancyDrawer(false)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSaveVacancy} style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                Job Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Disability Support Worker"
                value={vacancyForm.title}
                onChange={e => setVacancyForm(v => ({ ...v, title: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: '0.875rem' }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                Short Summary *
              </label>
              <input
                type="text"
                required
                placeholder="One sentence overview for cards and listings..."
                value={vacancyForm.short_summary}
                onChange={e => setVacancyForm(v => ({ ...v, short_summary: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: '0.875rem' }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                About the Role *
              </label>
              <textarea
                rows={4}
                required
                placeholder="Detailed role description..."
                value={vacancyForm.about_role}
                onChange={e => setVacancyForm(v => ({ ...v, about_role: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: '0.875rem' }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                Service Areas *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {RECRUITMENT_SERVICE_AREAS.map(area => (
                  <label key={area.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#334155' }}>
                    <input
                      type="checkbox"
                      checked={vacancyForm.service_area_ids.includes(area.id)}
                      onChange={e => {
                        const next = e.target.checked
                          ? [...vacancyForm.service_area_ids, area.id]
                          : vacancyForm.service_area_ids.filter(id => id !== area.id);
                        setVacancyForm(v => ({ ...v, service_area_ids: next }));
                      }}
                    />
                    <span>{area.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Publication Status *
                </label>
                <select
                  value={vacancyForm.status}
                  onChange={e => setVacancyForm(v => ({ ...v, status: e.target.value as any }))}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: '0.875rem' }}
                >
                  <option value="draft">Draft (Private)</option>
                  <option value="published">Published (Public)</option>
                  <option value="closed">Closed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Pay Display Mode
                </label>
                <select
                  value={vacancyForm.pay_display_mode}
                  onChange={e => setVacancyForm(v => ({ ...v, pay_display_mode: e.target.value as any }))}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: '0.875rem' }}
                >
                  <option value="award_text">Award Standard Text</option>
                  <option value="custom_text">Custom Pay Note</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
              <button
                type="button"
                className="btnSecondary"
                onClick={() => setShowVacancyDrawer(false)}
                disabled={savingVacancy}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btnPrimary"
                disabled={savingVacancy}
              >
                {savingVacancy ? 'Saving...' : (editingVacancyId ? 'Update Vacancy' : 'Create Vacancy')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ════════ SCHEDULE INTERVIEW MODAL ════════ */}
      {showInterviewModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{ background: '#FFFFFF', borderRadius: 16, maxWidth: 480, width: '100%', padding: 24 }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', marginBottom: 16 }}>Schedule Interview</h4>
            <form onSubmit={handleCreateInterview}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>Type</label>
                <select
                  value={interviewForm.interview_type}
                  onChange={e => setInterviewForm(f => ({ ...f, interview_type: e.target.value }))}
                  style={{ width: '100%', padding: 8, border: '1px solid #CBD5E1', borderRadius: 6 }}
                >
                  <option value="phone">Phone Screening</option>
                  <option value="video">Video Call (Zoom/Teams)</option>
                  <option value="in_person">In-Person Interview</option>
                </select>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>Date &amp; Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={interviewForm.scheduled_at}
                  onChange={e => setInterviewForm(f => ({ ...f, scheduled_at: e.target.value }))}
                  style={{ width: '100%', padding: 8, border: '1px solid #CBD5E1', borderRadius: 6 }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>Interviewer</label>
                <input
                  type="text"
                  value={interviewForm.interviewer}
                  onChange={e => setInterviewForm(f => ({ ...f, interviewer: e.target.value }))}
                  style={{ width: '100%', padding: 8, border: '1px solid #CBD5E1', borderRadius: 6 }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" className="btnSecondary" onClick={() => setShowInterviewModal(false)}>Cancel</button>
                <button type="submit" className="btnPrimary">Confirm Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════ ADD REFEREE MODAL ════════ */}
      {showRefModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{ background: '#FFFFFF', borderRadius: 16, maxWidth: 480, width: '100%', padding: 24 }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', marginBottom: 16 }}>Add Referee Record</h4>
            <form onSubmit={handleCreateReference}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>Referee Name *</label>
                <input
                  type="text"
                  required
                  value={refForm.referee_name}
                  onChange={e => setRefForm(f => ({ ...f, referee_name: e.target.value }))}
                  style={{ width: '100%', padding: 8, border: '1px solid #CBD5E1', borderRadius: 6 }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>Relationship *</label>
                <input
                  type="text"
                  required
                  value={refForm.relationship}
                  onChange={e => setRefForm(f => ({ ...f, relationship: e.target.value }))}
                  style={{ width: '100%', padding: 8, border: '1px solid #CBD5E1', borderRadius: 6 }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>Phone</label>
                  <input
                    type="tel"
                    value={refForm.phone}
                    onChange={e => setRefForm(f => ({ ...f, phone: e.target.value }))}
                    style={{ width: '100%', padding: 8, border: '1px solid #CBD5E1', borderRadius: 6 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>Organisation</label>
                  <input
                    type="text"
                    value={refForm.organisation}
                    onChange={e => setRefForm(f => ({ ...f, organisation: e.target.value }))}
                    style={{ width: '100%', padding: 8, border: '1px solid #CBD5E1', borderRadius: 6 }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" className="btnSecondary" onClick={() => setShowRefModal(false)}>Cancel</button>
                <button type="submit" className="btnPrimary">Save Referee</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
