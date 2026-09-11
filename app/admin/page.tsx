'use client';

import DialogPanel from '@/components/ui/DialogPanel';

import { notify } from '@/components/ui/ProductFeedback';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import WorkforceRosterTab from '@/components/WorkforceRosterTab';
import AddParticipantModal from '@/components/admin/AddParticipantModal';
import AddWorkerModal from '@/components/admin/AddWorkerModal';
import AgreementGeneratorModal from '@/components/admin/AgreementGeneratorModal';
import AgreementViewerModal from '@/components/admin/AgreementViewerModal';
import InvoicingTab from '@/components/admin/InvoicingTab';
import QuotesTab from '@/components/admin/QuotesTab';
import TimesheetsTab from '@/components/admin/TimesheetsTab';
import ProgressNotesTab from '@/components/admin/ProgressNotesTab';
import CanonicalDashboard from '@/components/admin/CanonicalDashboard';
import SuitabilityAssessmentModal from '@/components/admin/SuitabilityAssessmentModal';
import ParticipantOnboardingDrawer from '@/components/admin/ParticipantOnboardingDrawer';
import {
  FormDrawer,
  DrawerHeader,
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
  FormGrid2,
  StickyFormFooter,
} from '@/components/admin/forms';
import CrmContainer, { CrmTab } from '@/components/admin/ui/CrmContainer';
import CrmPillBar from '@/components/admin/ui/CrmPillBar';
import CrmSquircleCard from '@/components/admin/ui/CrmSquircleCard';
import CrmBentoPane from '@/components/admin/ui/CrmBentoPane';
import CrmSettingRow from '@/components/admin/ui/CrmSettingRow';

import {
  Users, UserCheck, FileText, Phone, Mail, MapPin, Calendar,
  CheckCircle2, Clock, AlertCircle, ArrowRight, Search, Filter,
  Plus, Shield, Sparkles, RefreshCw, ExternalLink, Lock, LogOut,
  Columns, List, UserPlus, FileCheck, MessageSquare, History, Check,
  UploadCloud, FileDown, FolderLock, CalendarClock, AlertTriangle,
  LayoutDashboard, Receipt, Calculator, Award, Settings, ChevronLeft,
  ChevronRight, TrendingUp, DollarSign, Activity, FileSpreadsheet,
  Layers, ShieldAlert, Sparkle, Eye, BookOpen, GraduationCap, ClipboardCheck, Upload, Trophy,
  ClipboardList, Target, Trash2, ShieldCheck
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
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  medicalAlert?: string;
  allergies?: string;
  workerInstructions?: string;
  communicationPreferences?: string;
  lifecycleStage?: string;
  isRosterable?: boolean;
  suitabilityAssessmentId?: string;
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


type TabType = 'dashboard' | 'referrals' | 'agreements' | 'participants' | 'goals' | 'support_plans' | 'risk_assessments' | 'safeguarding' | 'timesheets' | 'progress_notes' | 'invoicing' | 'quotes' | 'staff' | 'workforce' | 'compliance' | 'settings';

const PIPELINE_STAGES = [
  { id: 'new', label: 'New Inbound', color: 'var(--oc-info)', bg: '#E0F2FE' },
  { id: 'contacted', label: 'Contacted', color: 'var(--oc-warning)', bg: '#FEF3C7' },
  { id: 'assessment', label: 'Assessment', color: '#7C3AED', bg: '#EDE9FE' },
  { id: 'agreement_sent', label: 'Agreement Sent', color: 'var(--oc-info)', bg: '#DBEAFE' },
  { id: 'accepted', label: 'Active / Enrolled', color: '#059669', bg: '#D1FAE5' },
] as const;

export default function AdminCrmPage() {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);
  const [adminKey, setAdminKey] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [statusNotice, setStatusNotice] = useState('');

  const [tab, setTab] = useState<TabType>('dashboard');
  const [agreements, setAgreements] = useState<any[]>([]);
  const [agreementsLoading, setAgreementsLoading] = useState(false);
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [selectedReferralForSuitability, setSelectedReferralForSuitability] = useState<Referral | null>(null);
  const [selectedParticipantForOnboarding, setSelectedParticipantForOnboarding] = useState<Participant | null>(null);
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [showAgreementGenerator, setShowAgreementGenerator] = useState(false);
  const [selectedAgreementToView, setSelectedAgreementToView] = useState<any | null>(null);
  const [variationTarget, setVariationTarget] = useState<any | null>(null);
  const [draftAgreementTarget, setDraftAgreementTarget] = useState<any | null>(null);
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
  const [drawerTab, setDrawerTab] = useState<'overview' | 'documents' | 'timeline' | 'contacts'>('overview');

  // Governance & Provider Config State
  const [providerConfig, setProviderConfig] = useState<any>(null);
  const [providerConfigLoading, setProviderConfigLoading] = useState(false);
  const [proprietorInput, setProprietorInput] = useState('');
  const [proprietorSaving, setProprietorSaving] = useState(false);
  const [insurances, setInsurances] = useState<any[]>([]);
  const [insurancesLoading, setInsurancesLoading] = useState(false);
  const [showAddInsurance, setShowAddInsurance] = useState(false);
  const [newInsurance, setNewInsurance] = useState({
    policyType: 'Public Liability',
    insurer: '',
    policyNumber: '',
    coverageAmount: 10000000,
    commencementDate: new Date().toISOString().slice(0, 10),
    expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    notes: '',
  });
  // Participant Contacts State
  const [participantContacts, setParticipantContacts] = useState<any[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [showAddContactForm, setShowAddContactForm] = useState(false);
  const [contactSaving, setContactSaving] = useState(false);
  const [newContact, setNewContact] = useState({
    fullName: '',
    role: 'Nominee / Representative',
    relationshipLabel: '',
    phone: '',
    email: '',
    organizationName: '',
    notes: '',
  });
  const [showEditEmergency, setShowEditEmergency] = useState(false);

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

  // -- Training & Compliance State ------------------------------------------
  const [trainingCourses, setTrainingCourses] = useState<TrainingCourse[]>([]);
  const [trainingAssignments, setTrainingAssignments] = useState<TrainingAssignment[]>([]);
  const [trainingComplianceMap, setTrainingComplianceMap] = useState<Record<string, TrainingCompletion[]>>({});
  const [trainingLoading, setTrainingLoading] = useState(false);
  const [trainingLoadError, setTrainingLoadError] = useState('');
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

  // -- Phase A: Goals, Support Plans, Risk Assessments ----------------------
  const [goals, setGoals] = useState<any[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [selectedGoalParticipant, setSelectedGoalParticipant] = useState('');
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [newGoal, setNewGoal] = useState({
    goal_title: '', goal_description: '', category: 'General',
    target_date: '', review_date: '', priority: 3, ndis_domain: '',
  });
  const [savingGoal, setSavingGoal] = useState(false);

  const [supportPlans, setSupportPlans] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [selectedPlanParticipant, setSelectedPlanParticipant] = useState('');
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [newPlan, setNewPlan] = useState({
    plan_title: 'Support Plan',
    primary_disability: '',
    secondary_conditions: '',
    communication_method: 'Verbal',
    language_preference: 'English',
    morning_routine: '',
    personal_care_needs: '',
    mobility_aids: '',
    dietary_requirements: '',
    triggers_and_responses: '',
    plan_start_date: '',
    plan_end_date: '',
    review_date: '',
  });
  const [savingPlan, setSavingPlan] = useState(false);

  const [riskAssessments, setRiskAssessments] = useState<any[]>([]);
  const [risksLoading, setRisksLoading] = useState(false);
  const [selectedRiskParticipant, setSelectedRiskParticipant] = useState('');
  const [showRiskForm, setShowRiskForm] = useState(false);
  const [editingRisk, setEditingRisk] = useState<any | null>(null);
  const [newRisk, setNewRisk] = useState({
    assessment_title: 'Risk Assessment',
    overall_risk_rating: 'Low',
    review_date: '',
    falls_risk: 'Low risk of falls',
    falls_controls: 'Non-slip mats, grab rails in bathroom',
    medication_risk: 'Medication management',
    medication_controls: 'Worker prompts at scheduled medication times; blister packs',
    behaviour_risk: 'Low behavioural risk',
    behaviour_controls: 'Provide quiet environment if overwhelmed',
    community_risk: 'Community access safety',
    community_controls: 'Worker accompanied, pedestrian awareness',
  });
  const [savingRisk, setSavingRisk] = useState(false);

  // -- Phase A: Portal User Management --------------------------------------
  const [showPortalUserModal, setShowPortalUserModal] = useState(false);
  const [portalUserParticipantId, setPortalUserParticipantId] = useState('');
  const [portalUserEmail, setPortalUserEmail] = useState('');
  const [portalUserSaving, setPortalUserSaving] = useState(false);
  const [portalUserMsg, setPortalUserMsg] = useState('');

  // -- Phase B: Quality & Safeguarding State ---------------------------------
  const [safeguardingSubTab, setSafeguardingSubTab] = useState<'incidents' | 'complaints' | 'corrective_actions'>('incidents');
  const [incidentsList, setIncidentsList] = useState<any[]>([]);
  const [incidentsLoading, setIncidentsLoading] = useState(false);
  const [incidentSeverityFilter, setIncidentSeverityFilter] = useState('all');
  const [incidentStatusFilter, setIncidentStatusFilter] = useState('all');
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);

  const [complaintsList, setComplaintsList] = useState<any[]>([]);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [complaintStatusFilter, setComplaintStatusFilter] = useState('all');
  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);
  const [complaintAckTargetDays, setComplaintAckTargetDays] = useState<number>(2);

  const [actionsList, setActionsList] = useState<any[]>([]);
  const [actionsLoading, setActionsLoading] = useState(false);
  const [actionStatusFilter, setActionStatusFilter] = useState('all');
  const [showAddActionModal, setShowAddActionModal] = useState(false);
  const [newActionForm, setNewActionForm] = useState({
    source_type: 'incident',
    source_id: '',
    action_description: '',
    owner: 'Operations Manager',
    due_date: '',
    priority: 'Medium',
    notes: '',
  });

  // Complaint escalation modal
  const [showEscalateComplaintModal, setShowEscalateComplaintModal] = useState(false);
  const [escalateIncidentForm, setEscalateIncidentForm] = useState({
    category: 'other',
    severity: 'High' as 'Low' | 'Medium' | 'High' | 'Critical',
    description: '',
  });

  // -- Phase C: Live Financial Metrics --------------------------------------
  const [financeMetrics, setFinanceMetrics] = useState<{
    delivered_hours_mtd: number;
    gross_invoiced_mtd: number;
    paid_claims_mtd: number;
    outstanding_claims: number;
    unbilled_hours: number;
    unbilled_amount: number;
  } | null>(null);

  const loadFinanceMetrics = useCallback(async () => {
    try {
      const res = await fetch('/api/billing/finance-metrics');
      if (res.ok) {
        const data = await res.json();
        setFinanceMetrics(data);
      }
    } catch (err) {
      console.error('Error loading finance metrics:', err);
    }
  }, []);

  useEffect(() => {
    checkAuth();
    loadFinanceMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tab === 'dashboard') {
      loadFinanceMetrics();
    } else if (tab === 'compliance') {
      loadTrainingData();
    } else if (tab === 'agreements') {
      loadAgreements();
    } else if (tab === 'safeguarding') {
      loadIncidents();
      loadComplaints();
      loadCorrectiveActions();
    } else if (tab === 'goals' && selectedGoalParticipant) {
      loadGoals(selectedGoalParticipant);
    } else if (tab === 'support_plans' && selectedPlanParticipant) {
      loadSupportPlans(selectedPlanParticipant);
    } else if (tab === 'risk_assessments' && selectedRiskParticipant) {
      loadRiskAssessments(selectedRiskParticipant);
    } else if (tab === 'settings') {
      loadProviderConfig();
      loadInsurances();
    }
  }, [tab, selectedGoalParticipant, selectedPlanParticipant, selectedRiskParticipant, loadFinanceMetrics]);



  // When selected record changes, load their timeline & documents
  useEffect(() => {
    if (selectedReferral) {
      loadActivities({ referralId: selectedReferral.id });
      loadDocuments('referral', selectedReferral.id);
    } else if (selectedParticipant) {
      loadActivities({ participantId: selectedParticipant.id });
      loadDocuments('participant', selectedParticipant.id);
      loadParticipantContacts(selectedParticipant.id);
    } else if (selectedStaff) {
      loadActivities({ staffId: selectedStaff.id });
      loadDocuments('staff', selectedStaff.id);
    } else {
      setActivities([]);
      setDocuments([]);
      setParticipantContacts([]);
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

  // -- Phase A: Goals --------------------------------------------------------
  async function loadGoals(participantId: string) {
    setGoalsLoading(true);
    try {
      const res = await fetch(`/api/portal/participant/goals?participant_id=${participantId}`, {
        headers: { 'x-admin-key': 'OpusCare2025!Admin' },
      });
      const data = await res.json();
      setGoals(data.goals || []);
    } catch { setGoals([]); }
    setGoalsLoading(false);
  }

  async function createGoal() {
    if (!selectedGoalParticipant || !newGoal.goal_title.trim()) return;
    setSavingGoal(true);
    try {
      const res = await fetch('/api/portal/participant/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': 'OpusCare2025!Admin' },
        body: JSON.stringify({ participant_id: selectedGoalParticipant, ...newGoal }),
      });
      const data = await res.json();
      if (data.goal) {
        setGoals(prev => [data.goal, ...prev]);
        setShowGoalForm(false);
        setNewGoal({ goal_title: '', goal_description: '', category: 'General', target_date: '', review_date: '', priority: 3, ndis_domain: '' });
        setStatusNotice('Goal created successfully.');
      }
    } catch { setStatusNotice('Failed to create goal.'); }
    setSavingGoal(false);
  }

  async function updateGoalStatus(goalId: string, status: string) {
    try {
      await fetch('/api/portal/participant/goals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': 'OpusCare2025!Admin' },
        body: JSON.stringify({ id: goalId, status, ...(status === 'achieved' ? { achieved_date: new Date().toISOString().split('T')[0] } : {}) }),
      });
      setGoals(prev => prev.map(g => g.id === goalId ? { ...g, status } : g));
    } catch { setStatusNotice('Failed to update goal status.'); }
  }

  // -- Phase A: Support Plans ------------------------------------------------
  async function loadSupportPlans(participantId: string) {
    setPlansLoading(true);
    try {
      const res = await fetch(`/api/portal/participant/support-plans?participant_id=${participantId}`, {
        headers: { 'x-admin-key': 'OpusCare2025!Admin' },
      });
      const data = await res.json();
      setSupportPlans(data.plans || []);
    } catch { setSupportPlans([]); }
    setPlansLoading(false);
  }

  async function createSupportPlan() {
    if (!selectedPlanParticipant || !newPlan.plan_title.trim()) return;
    setSavingPlan(true);
    try {
      const res = await fetch('/api/portal/participant/support-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': 'OpusCare2025!Admin' },
        body: JSON.stringify({
          participant_id: selectedPlanParticipant,
          ...newPlan,
          status: 'draft',
        }),
      });
      const data = await res.json();
      if (data.plan) {
        setShowPlanForm(false);
        loadSupportPlans(selectedPlanParticipant);
        setStatusNotice('Support plan created successfully.');
      }
    } catch { setStatusNotice('Failed to create support plan.'); }
    setSavingPlan(false);
  }

  async function activatePlan(planId: string) {
    try {
      await fetch('/api/portal/participant/support-plans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': 'OpusCare2025!Admin' },
        body: JSON.stringify({ id: planId, status: 'active' }),
      });
      if (selectedPlanParticipant) loadSupportPlans(selectedPlanParticipant);
      setStatusNotice('Support plan activated. Previous active versions superseded.');
    } catch { setStatusNotice('Failed to activate plan.'); }
  }

  // -- Phase A: Risk Assessments ---------------------------------------------
  async function loadRiskAssessments(participantId: string) {
    setRisksLoading(true);
    try {
      const res = await fetch(`/api/portal/participant/risk-assessments?participant_id=${participantId}`, {
        headers: { 'x-admin-key': 'OpusCare2025!Admin' },
      });
      const data = await res.json();
      setRiskAssessments(data.assessments || []);
    } catch { setRiskAssessments([]); }
    setRisksLoading(false);
  }

  async function createRiskAssessment() {
    if (!selectedRiskParticipant || !newRisk.assessment_title.trim()) return;
    setSavingRisk(true);
    try {
      const res = await fetch('/api/portal/participant/risk-assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': 'OpusCare2025!Admin' },
        body: JSON.stringify({
          participant_id: selectedRiskParticipant,
          assessment_title: newRisk.assessment_title,
          status: 'draft',
          overall_risk_rating: newRisk.overall_risk_rating,
          review_date: newRisk.review_date || null,
          falls_and_mobility: { risk: newRisk.falls_risk, likelihood: 1, consequence: 2, controls: newRisk.falls_controls, residual_risk: 'Low' },
          medication_risks: { risk: newRisk.medication_risk, likelihood: 2, consequence: 3, controls: newRisk.medication_controls, residual_risk: 'Low' },
          behaviour_and_mental_health: { risk: newRisk.behaviour_risk, likelihood: 1, consequence: 2, controls: newRisk.behaviour_controls, residual_risk: 'Low' },
          community_access_risks: { risk: newRisk.community_risk, likelihood: 1, consequence: 2, controls: newRisk.community_controls, residual_risk: 'Low' },
        }),
      });
      const data = await res.json();
      if (data.assessment) {
        setShowRiskForm(false);
        loadRiskAssessments(selectedRiskParticipant);
        setStatusNotice('Risk assessment created successfully.');
      }
    } catch { setStatusNotice('Failed to create risk assessment.'); }
    setSavingRisk(false);
  }

  async function activateRiskAssessment(assessmentId: string) {
    try {
      await fetch('/api/portal/participant/risk-assessments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': 'OpusCare2025!Admin' },
        body: JSON.stringify({ id: assessmentId, status: 'active' }),
      });
      if (selectedRiskParticipant) loadRiskAssessments(selectedRiskParticipant);
      setStatusNotice('Risk assessment activated. Previous active versions superseded.');
    } catch { setStatusNotice('Failed to activate risk assessment.'); }
  }

  // -- Phase B: Quality & Safeguarding Functions -----------------------------
  async function loadIncidents() {
    setIncidentsLoading(true);
    try {
      const res = await fetch('/api/safeguarding/incidents', {
        headers: { 'x-admin-key': 'OpusCare2025!Admin' },
      });
      const data = await res.json();
      setIncidentsList(data.incidents || []);
    } catch {
      setIncidentsList([]);
    }
    setIncidentsLoading(false);
  }

  async function updateIncident(id: string, updates: Record<string, any>) {
    try {
      const res = await fetch('/api/safeguarding/incidents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': 'OpusCare2025!Admin' },
        body: JSON.stringify({ id, ...updates }),
      });
      const data = await res.json();
      if (res.ok && data.incident) {
        setStatusNotice(`Incident ${data.incident.incident_reference} updated.`);
        setSelectedIncident(data.incident);
        loadIncidents();
      }
    } catch {
      setStatusNotice('Failed to update incident.');
    }
  }

  async function loadComplaints() {
    setComplaintsLoading(true);
    try {
      const res = await fetch('/api/safeguarding/complaints', {
        headers: { 'x-admin-key': 'OpusCare2025!Admin' },
      });
      const data = await res.json();
      setComplaintsList(data.complaints || []);
    } catch {
      setComplaintsList([]);
    }
    setComplaintsLoading(false);
  }

  async function updateComplaint(id: string, updates: Record<string, any>) {
    try {
      const res = await fetch('/api/safeguarding/complaints', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': 'OpusCare2025!Admin' },
        body: JSON.stringify({ id, ...updates }),
      });
      const data = await res.json();
      if (res.ok && data.complaint) {
        setStatusNotice(`Complaint ${data.complaint.complaint_reference} updated.`);
        setSelectedComplaint(data.complaint);
        loadComplaints();
      }
    } catch {
      setStatusNotice('Failed to update complaint.');
    }
  }

  async function loadCorrectiveActions() {
    setActionsLoading(true);
    try {
      const res = await fetch('/api/safeguarding/corrective-actions', {
        headers: { 'x-admin-key': 'OpusCare2025!Admin' },
      });
      const data = await res.json();
      setActionsList(data.actions || []);
    } catch {
      setActionsList([]);
    }
    setActionsLoading(false);
  }

  async function createCorrectiveAction(form: any) {
    try {
      const res = await fetch('/api/safeguarding/corrective-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': 'OpusCare2025!Admin' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.action) {
        setStatusNotice(`Corrective action ${data.action.action_reference} created.`);
        setShowAddActionModal(false);
        loadCorrectiveActions();
      }
    } catch {
      setStatusNotice('Failed to create corrective action.');
    }
  }

  async function updateCorrectiveAction(id: string, updates: Record<string, any>) {
    try {
      const res = await fetch('/api/safeguarding/corrective-actions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': 'OpusCare2025!Admin' },
        body: JSON.stringify({ id, ...updates }),
      });
      if (res.ok) {
        setStatusNotice('Corrective action updated.');
        loadCorrectiveActions();
      }
    } catch {
      setStatusNotice('Failed to update corrective action.');
    }
  }

  async function escalateComplaintToIncident(complaint: any) {
    if (!complaint) return;
    try {
      const res = await fetch('/api/safeguarding/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': 'OpusCare2025!Admin' },
        body: JSON.stringify({
          participant_id: complaint.participant_id || (participants[0]?.id || ''),
          category: escalateIncidentForm.category,
          severity: escalateIncidentForm.severity,
          description: `Arising from complaint ${complaint.complaint_reference}: ${escalateIncidentForm.description || complaint.summary}. Details: ${complaint.details}`,
          status: 'Under Review',
        }),
      });
      const data = await res.json();
      if (res.ok && data.incident) {
        await updateComplaint(complaint.id, {
          linked_incident_id: data.incident.id,
          status: 'Under Review',
        });
        setStatusNotice(`Incident ${data.incident.incident_reference} created and linked to complaint.`);
        setShowEscalateComplaintModal(false);
        loadIncidents();
        loadComplaints();
      }
    } catch {
      setStatusNotice('Failed to escalate complaint.');
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
      const [refRes, partRes, staffRes, agrRes] = await Promise.all([
        fetch('/api/referral'),
        fetch('/api/crm/participants'),
        fetch('/api/crm/staff'),
        fetch('/api/crm/agreements'),
      ]);
      if (refRes.ok) setReferrals(await refRes.json());
      if (partRes.ok) setParticipants(await partRes.json());
      if (staffRes.ok) setStaff(await staffRes.json());
      if (agrRes.ok) setAgreements(await agrRes.json());
    } catch (err) {
      console.error('Failed to load CRM data', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadAgreements() {
    setAgreementsLoading(true);
    try {
      const res = await fetch('/api/crm/agreements');
      if (res.ok) setAgreements(await res.json());
    } catch (err) {
      console.error('Failed to load agreements', err);
    } finally {
      setAgreementsLoading(false);
    }
  }

  async function loadProviderConfig() {
    setProviderConfigLoading(true);
    try {
      const res = await fetch('/api/crm/provider-config');
      if (res.ok) {
        const data = await res.json();
        setProviderConfig(data);
        if (data?.proprietor_legal_name) {
          setProprietorInput(data.proprietor_legal_name);
        }
      }
    } catch (err) {
      console.error('Failed to load provider config', err);
    } finally {
      setProviderConfigLoading(false);
    }
  }

  async function loadInsurances() {
    setInsurancesLoading(true);
    try {
      const res = await fetch('/api/governance/insurance');
      if (res.ok) {
        const data = await res.json();
        if (data.ok && Array.isArray(data.policies)) {
          setInsurances(data.policies);
        }
      }
    } catch (err) {
      console.error('Failed to load insurances', err);
    } finally {
      setInsurancesLoading(false);
    }
  }

  async function handleSaveProprietor() {
    if (!proprietorInput.trim()) {
      notify('Please enter a proprietor legal name.');
      return;
    }
    setProprietorSaving(true);
    try {
      const res = await fetch('/api/crm/provider-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: providerConfig?.id,
          proprietor_legal_name: proprietorInput.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        notify('Proprietor legal name updated successfully.');
        setProviderConfig((prev: any) => ({ ...prev, proprietor_legal_name: proprietorInput.trim() }));
      } else {
        notify(data.message || 'Failed to update proprietor legal name.');
      }
    } catch {
      notify('Error saving proprietor legal name.');
    } finally {
      setProprietorSaving(false);
    }
  }

  async function handleAddInsurance(e: React.FormEvent) {
    e.preventDefault();
    if (!newInsurance.insurer.trim() || !newInsurance.policyNumber.trim()) {
      notify('Please enter the insurer name and policy number.');
      return;
    }
    try {
      const res = await fetch('/api/governance/insurance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInsurance),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        notify('Insurance policy registered successfully.');
        setShowAddInsurance(false);
        setNewInsurance({
          policyType: 'Public Liability',
          insurer: '',
          policyNumber: '',
          coverageAmount: 10000000,
          commencementDate: new Date().toISOString().slice(0, 10),
          expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10),
          notes: '',
        });
        loadInsurances();
      } else {
        notify(data.error || 'Failed to add insurance policy.');
      }
    } catch {
      notify('Error registering insurance policy.');
    }
  }

  async function loadActivities(params: { referralId?: string; participantId?: string; staffId?: string }) {
    setActivitiesLoading(true);
    try {
      let query = '';
      if (params.referralId) query = `referralId=${encodeURIComponent(params.referralId)}`;
      else if (params.participantId) query = `participantId=${encodeURIComponent(params.participantId)}`;
      else if (params.staffId) query = `staffId=${encodeURIComponent(params.staffId)}`;
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

  async function loadParticipantContacts(participantId: string) {
    setContactsLoading(true);
    try {
      const res = await fetch(`/api/crm/participant-contacts?participantId=${encodeURIComponent(participantId)}`);
      if (res.ok) {
        setParticipantContacts(await res.json());
      }
    } catch (err) {
      console.error('Failed to load participant contacts', err);
    } finally {
      setContactsLoading(false);
    }
  }

  async function handleAddContact(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedParticipant || !newContact.fullName.trim()) return;
    setContactSaving(true);
    try {
      const res = await fetch('/api/crm/participant-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId: selectedParticipant.id,
          ...newContact,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        notify('Contact added successfully.');
        setShowAddContactForm(false);
        setNewContact({
          fullName: '',
          role: 'Nominee / Representative',
          relationshipLabel: '',
          phone: '',
          email: '',
          organizationName: '',
          notes: '',
        });
        loadParticipantContacts(selectedParticipant.id);
      } else {
        notify(data.error || data.message || 'Failed to add contact.');
      }
    } catch (err: any) {
      console.error('Failed to add contact', err);
      notify(err?.message || 'Network error while adding contact.');
    } finally {
      setContactSaving(false);
    }
  }

  async function handleDeleteContact(contactLinkId: string) {
    if (!confirm('Are you sure you want to remove this contact?')) return;
    try {
      const res = await fetch(`/api/crm/participant-contacts?id=${encodeURIComponent(contactLinkId)}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        notify('Contact removed.');
        if (selectedParticipant) loadParticipantContacts(selectedParticipant.id);
      } else {
        notify(data.error || data.message || 'Failed to remove contact.');
      }
    } catch (err: any) {
      console.error('Failed to remove contact', err);
      notify(err?.message || 'Network error while removing contact.');
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
      if (selectedStaff) body.staffId = selectedStaff.id;

      const res = await fetch('/api/crm/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setNewNoteText('');
        notify('Note added to timeline.');
        if (selectedReferral) loadActivities({ referralId: selectedReferral.id });
        if (selectedParticipant) loadActivities({ participantId: selectedParticipant.id });
        if (selectedStaff) loadActivities({ staffId: selectedStaff.id });
      } else {
        notify(data.error || data.message || 'Failed to add note');
      }
    } catch (err: any) {
      console.error('Failed to add note', err);
      notify(err?.message || 'Network error while adding note');
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
        notify(err.error || 'Failed to upload document');
      }
    } catch (err) {
      console.error('Failed to upload file', err);
      notify('Upload error');
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
        notify(data.error || 'Failed to convert referral');
      }
    } catch (err) {
      console.error('Failed conversion', err);
      notify('Network error during conversion');
    } finally {
      setConverting(false);
    }
  }


  async function loadTrainingData() {
    setTrainingLoading(true);
    setTrainingLoadError('');
    try {
      const [coursesRes, assignRes, externalRes, compRes] = await Promise.all([
        fetch('/api/training/courses?active=false'),
        fetch('/api/training/assignments'),
        fetch('/api/training/external'),
        fetch('/api/training/completions'),
      ]);
      if (![coursesRes, assignRes, externalRes, compRes].every((response) => response.ok)) {
        throw new Error(
          `Training request failed (${[coursesRes, assignRes, externalRes, compRes]
            .map((response) => response.status)
            .join(', ')})`
        );
      }

      const [courses, assignments, extCourses, completions]: [
        TrainingCourse[],
        TrainingAssignment[],
        ExternalCourse[],
        TrainingCompletion[],
      ] = await Promise.all([
        coursesRes.json(),
        assignRes.json(),
        externalRes.json(),
        compRes.json(),
      ]);

      setTrainingCourses(Array.isArray(courses) ? courses : []);
      setTrainingAssignments(Array.isArray(assignments) ? assignments : []);
      setExternalCourses(Array.isArray(extCourses) ? extCourses : []);

      const map: Record<string, TrainingCompletion[]> = {};
      completions.forEach((completion) => {
        if (!map[completion.staff_id]) map[completion.staff_id] = [];
        map[completion.staff_id].push(completion);
      });
      setTrainingComplianceMap(map);
    } catch (err) {
      console.error('Failed to load training data', err);
      setTrainingLoadError('Training data could not be loaded');
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
        const err = await res.json().catch(() => ({}));
        notify(err.error || err.message || 'Failed to create course');
      }
    } catch (err: any) {
      console.error('Create course error:', err);
      notify(err?.message || 'Network error while creating course');
    } finally {
      setSavingCourse(false);
    }
  }

  async function handleAssignCourse(e: React.FormEvent) {
    e.preventDefault();
    if (!assignCourseId || assignStaffIds.length === 0) {
      notify('Select a course and at least one staff member.');
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
        const err = await res.json().catch(() => ({}));
        notify(err.error || err.message || 'Failed to assign course');
      }
    } catch (err: any) {
      console.error('Assign error:', err);
      notify(err?.message || 'Network error while assigning course');
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
        if (daysToExp < 0) return { label: 'Expired', color: 'var(--oc-danger)', bg: '#FEE2E2' };
        if (daysToExp <= 30) return { label: 'Expiring Soon', color: 'var(--oc-warning)', bg: '#FEF3C7' };
      }
      return { label: 'Complete', color: '#059669', bg: '#D1FAE5' };
    }
    if (dueDate) {
      const due = new Date(dueDate);
      const daysOverdue = Math.ceil((now.getTime() - due.getTime()) / 86400000);
      if (daysOverdue > 0) return { label: 'Overdue', color: 'var(--oc-danger)', bg: '#FEE2E2' };
      if (daysOverdue > -7) return { label: 'Due Soon', color: 'var(--oc-warning)', bg: '#FEF3C7' };
    }
    return { label: 'Not Started', color: 'var(--oc-muted)', bg: 'var(--oc-subtle)' };
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
          <RefreshCw size={28} className="spin" style={{ color: 'var(--oc-info)' }} />
          <span style={{ fontSize: '0.9rem', color: 'var(--oc-muted)', fontWeight: 600 }}>
            Verifying Opus Admin Security Session...
          </span>
        </div>
      </div>
    );
  }

  if (isAuth === false) {
    return (
      <div className="vsCanvas" style={{ justifyContent: 'center', minHeight: '100vh', padding: 20 }}>
        <div className="vsCard" style={{ maxWidth: 440, width: '100%', padding: '36px 32px', textAlign: 'center', boxShadow: '0 24px 60px rgba(15, 23, 42, 0.12)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
            <Link href="/" title="Return to Opus Care Website" style={{ display: 'inline-block', marginBottom: 18 }}>
              <Image
                src="/brand/Opus_Care_Logo_Transparent.png"
                alt="Opus Care Support Services"
                width={180}
                height={50}
                priority
                style={{ height: 42, width: 'auto', objectFit: 'contain' }}
              />
            </Link>
            <div className="vsSquircle indigo" style={{ width: 52, height: 52, borderRadius: 16, marginBottom: 14 }}>
              <Shield size={24} />
            </div>
            <h1 style={{ margin: '0 0 6px', fontSize: '1.35rem', fontWeight: 600, color: 'var(--oc-text)', letterSpacing: '-0.02em' }}>
              Opus Care CRM / ERP
            </h1>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--oc-muted)', lineHeight: 1.5 }}>
              Enter authorized administrator access key to open the operations management dashboard.
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {authError && (
              <div style={{ background: 'var(--oc-danger-soft)', border: '1px solid #FCA5A5', color: '#991B1B', padding: '10px 14px', borderRadius: 12, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left' }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{authError}</span>
              </div>
            )}

            <div style={{ textAlign: 'left' }}>
              <label htmlFor="adminKey" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--oc-secondary)', marginBottom: 6 }}>
                Admin Access Key
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--oc-muted)' }} />
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
                  style={{ width: '100%', padding: '10px 14px 10px 38px', borderRadius: 9999, border: '1px solid var(--oc-border)', background: 'var(--oc-background)', fontSize: '0.88rem', outline: 'none' }}
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authSubmitting}
              className="vsBtnBlack"
              style={{ width: '100%', padding: '12px 20px', borderRadius: 9999, fontSize: '0.9rem', marginTop: 8 }}
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

          <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--oc-subtle)' }}>
            <Link href="/" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--oc-muted)', textDecoration: 'none' }}>
              &larr; Return to Public Website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <CrmContainer
      currentTab={tab}
      onSelectTab={(newTab) => setTab(newTab)}
      searchQuery={searchQuery}
      onSearchChange={(q) => setSearchQuery(q)}
      referralsCount={countNew}
      participantsCount={participants.length}
      staffCount={staff.length}
      onOpenAddParticipant={() => setShowAddParticipant(true)}
      onOpenAddWorker={() => setShowAddWorker(true)}
      onOpenNewAgreement={() => setShowAgreementGenerator(true)}
    >
      {statusNotice && (
        <div style={{
          background: '#ECFDF5',
          color: '#065F46',
          border: '1px solid #A7F3D0',
          borderRadius: 14,
          padding: '10px 18px',
          fontSize: '0.85rem',
          fontWeight: 600,
          marginBottom: 18,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <CheckCircle2 size={16} color="#059669" />
          <span>{statusNotice}</span>
        </div>
      )}
          {/* TAB 0: DASHBOARD (CANONICAL LOCKED REFERENCE) */}
          {tab === 'dashboard' && (
            <CanonicalDashboard
              participants={participants}
              referrals={referrals}
              staff={staff}
              agreements={agreements}
              countNew={countNew}
              financeMetrics={financeMetrics}
              onSelectTab={(newTab) => setTab(newTab)}
              onOpenAgreementGenerator={() => setShowAgreementGenerator(true)}
              onOpenAddParticipant={() => setShowAddParticipant(true)}
              onOpenAddWorker={() => setShowAddWorker(true)}
            />
          )}

          {/* TAB 1: REFERRALS PIPELINE */}
          {tab === 'referrals' && (
            <div className="crmTabPanel">
              <div className="crmPanelHeader">
                <div>
                  <h2 className="crmPanelTitle">Referrals & Intake Pipeline</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--oc-muted)' }}>
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
                  <input aria-label="Search by participant, referrer, suburb, funding..."
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
                  <select aria-label="All Stages ( )"
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
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--oc-muted)' }}>
                  <RefreshCw size={24} className="spin" style={{ margin: '0 auto 12px', display: 'block', color: 'var(--oc-info)' }} />
                  <span>Loading referrals...</span>
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
                                <strong style={{ fontSize: '0.92rem', color: 'var(--oc-text)' }}>
                                  {item.participantName}
                                </strong>
                                <span className="refIdTag">
                                  {item.referenceNumber || 'Reference pending'}
                                </span>
                              </div>

                              <div style={{ fontSize: '0.8125rem', color: 'var(--oc-muted)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                                <MapPin size={12} />
                                <span>{item.suburb || 'Northern Rivers'}</span>
                                <span style={{ margin: '0 4px' }}>&bull;</span>
                                <span style={{ color: '#15803D', fontWeight: 600 }}>{item.funding}</span>
                              </div>

                              <div style={{ fontSize: '0.8125rem', color: 'var(--oc-secondary)', background: 'var(--oc-background)', padding: '6px 8px', borderRadius: 6, marginBottom: 8 }}>
                                <strong>Services:</strong> {item.services || 'General Support'}
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem', color: 'var(--oc-muted)' }}>
                                <span>Ref: {item.name}</span>
                                <span>{new Date(item.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</span>
                              </div>
                            </div>
                          ))}

                          {colReferrals.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--oc-muted)', fontSize: '0.8125rem' }}>
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
                              {r.referenceNumber || 'Reference pending'}
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
                            <select aria-label="New Inbound"
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, background: '#E0F2FE', color: 'var(--oc-info)', padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase' }}>
                      Contract & Agreement Engine
                    </span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--oc-muted)' }}>
                      Document library &bull; Version history
                    </span>
                  </div>
                  <h2 className="crmPanelTitle">Service Agreements & Document Packs</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--oc-muted)' }}>
                    Generate, execute, and version NDIS Service Agreements, Schedules of Supports, and Workforce Contracts with digital e-signatures.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setVariationTarget(null);
                    setShowAgreementGenerator(true);
                  }}
                  className="headerCtaBtn"
                  style={{ padding: '9px 20px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Plus size={16} /> <span>New Agreement / Pack</span>
                </button>
              </div>

              {/* Agreement Metric Cards */}
              <div className="ocFormGrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
                <div style={{ background: 'var(--oc-surface)', border: '1px solid var(--oc-border)', borderRadius: 12, padding: '14px 18px', boxShadow: '0 2px 6px rgba(15,23,42,0.02)' }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--oc-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Active Executed Agreements</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--oc-text)' }}>
                    {agreements.filter((a: any) => a.status === 'active' || a.status === 'fully_signed').length}
                  </div>
                </div>

                <div style={{ background: 'var(--oc-surface)', border: '1px solid var(--oc-border)', borderRadius: 12, padding: '14px 18px', boxShadow: '0 2px 6px rgba(15,23,42,0.02)' }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--oc-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Pending Execution / Drafts</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--oc-warning)' }}>
                    {agreements.filter((a: any) => a.status !== 'active' && a.status !== 'fully_signed' && a.status !== 'superseded').length}
                  </div>
                </div>

                <div style={{ background: 'var(--oc-surface)', border: '1px solid var(--oc-border)', borderRadius: 12, padding: '14px 18px', boxShadow: '0 2px 6px rgba(15,23,42,0.02)' }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--oc-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Committed Plan Funding</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#059669' }}>
                    ${agreements
                      .filter((a: any) => a.owner_type === 'participant' && ['active', 'fully_signed'].includes(a.status))
                      .reduce((acc: number, a: any) => acc + (Number(a.estimated_budget) || 0), 0)
                      .toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    <span style={{ fontSize: '0.8125rem', color: 'var(--oc-muted)', fontWeight: 500, marginLeft: 4 }}>AUD</span>
                  </div>
                </div>
              </div>

              {/* Active Agreements Table */}
              <div className="crmTableWrapper" style={{ marginBottom: 28 }}>
                <table className="crmTable">
                  <thead>
                    <tr>
                      <th>Ref & Date</th>
                      <th>Recipient / Owner</th>
                      <th>Document Title & Version</th>
                      <th className="ocNumeric">Committed Budget</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agreements.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: 36, textAlign: 'center', color: 'var(--oc-muted)' }}>
                          No agreements created yet. Click <strong>+ New Agreement / Pack</strong> to generate your first document.
                        </td>
                      </tr>
                    ) : (
                      agreements.map((agr: any) => {
                        const isExecuted = agr.status === 'active' || agr.status === 'fully_signed';
                        const isSuperseded = agr.status === 'superseded';
                        const ownerName = agr.questionnaire_data?.participant_name || agr.questionnaire_data?.worker_name || 'Participant';

                        return (
                          <tr key={agr.id} style={{ opacity: isSuperseded ? 0.65 : 1 }}>
                            <td>
                              <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--oc-info)', fontSize: '0.85rem' }}>
                                {agr.agreement_reference}
                              </span>
                              <div style={{ fontSize: '0.8125rem', color: 'var(--oc-muted)' }}>{agr.commencement_date}</div>
                            </td>
                            <td>
                              <strong style={{ color: 'var(--oc-text)' }}>{ownerName}</strong>
                              <div style={{ fontSize: '0.8125rem', color: 'var(--oc-muted)', textTransform: 'capitalize' }}>
                                {agr.owner_type} &bull; {agr.questionnaire_data?.funding_type || 'Agreed'}
                              </div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 600, color: 'var(--oc-text)', fontSize: '0.9rem' }}>{agr.title}</div>
                              <span style={{ fontSize: '0.8125rem', background: 'var(--oc-subtle)', color: 'var(--oc-secondary)', padding: '1px 6px', borderRadius: 4 }}>
                                Version {agr.version_number}.0 ({agr.template_version})
                              </span>
                            </td>
                            <td className="ocNumeric">
                              {agr.estimated_budget ? (
                                <strong style={{ color: '#059669', fontSize: '0.92rem' }}>
                                  ${Number(agr.estimated_budget).toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                                </strong>
                              ) : (
                                <span style={{ color: 'var(--oc-muted)' }}>—</span>
                              )}
                            </td>
                            <td>
                              <span style={{
                                display: 'inline-block',
                                padding: '3px 10px',
                                borderRadius: 20,
                                fontSize: '0.8125rem',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                background: isExecuted ? '#ECFDF5' : isSuperseded ? 'var(--oc-subtle)' : 'var(--oc-warning-soft)',
                                color: isExecuted ? '#059669' : isSuperseded ? 'var(--oc-muted)' : '#B45309',
                              }}>
                                {agr.status}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                onClick={() => setSelectedAgreementToView(agr)}
                                className="crmSecondaryBtn"
                                style={{ padding: '5px 12px', fontSize: '0.8125rem' }}
                              >
                                View / Print
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Collapsible Pricing Reference Table */}
              <div style={{ background: 'var(--oc-background)', border: '1px solid var(--oc-border)', borderRadius: 12, padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#162E56', margin: 0 }}>
                      NDIS Support Catalogue &bull; NSW Northern Rivers Price Limits (2026 Reference)
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: 'var(--oc-muted)' }}>
                      Confirm the applicable NDIS pricing rules and record agreed rates in the Schedule of Supports.
                    </p>
                  </div>
                </div>

                <div className="crmTableWrapper">
                  <table className="crmTable" style={{ fontSize: '0.82rem' }}>
                    <thead>
                      <tr>
                        <th>Line Item Code</th>
                        <th>Support Item Description</th>
                        <th>Category</th>
                        <th className="ocNumeric">NSW Regional Price Limit</th>
                        <th>Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><span className="refIdTag">01_011_0107_1_1</span></td>
                        <td><strong>Assistance with Self-Care Activities - Standard - Weekday Daytime</strong></td>
                        <td><span className="fundingPillMini">Core Supports</span></td>
                        <td className="ocNumeric"><strong style={{ color: 'var(--oc-text)' }}>$73.58</strong></td>
                        <td>Hour</td>
                      </tr>
                      <tr>
                        <td><span className="refIdTag">01_015_0107_1_1</span></td>
                        <td><strong>Assistance with Self-Care Activities - Standard - Weekday Evening</strong></td>
                        <td><span className="fundingPillMini">Core Supports</span></td>
                        <td className="ocNumeric"><strong style={{ color: 'var(--oc-text)' }}>$81.07</strong></td>
                        <td>Hour</td>
                      </tr>
                      <tr>
                        <td><span className="refIdTag">01_013_0107_1_1</span></td>
                        <td><strong>Assistance with Self-Care Activities - Saturday</strong></td>
                        <td><span className="fundingPillMini">Core Supports</span></td>
                        <td className="ocNumeric"><strong style={{ color: 'var(--oc-text)' }}>$103.54</strong></td>
                        <td>Hour</td>
                      </tr>
                      <tr>
                        <td><span className="refIdTag">04_104_0125_6_1</span></td>
                        <td><strong>Access Community Social and Rec Activities - Standard - Weekday Daytime</strong></td>
                        <td><span className="fundingPillMini">Core Supports</span></td>
                        <td className="ocNumeric"><strong style={{ color: 'var(--oc-text)' }}>$73.58</strong></td>
                        <td>Hour</td>
                      </tr>
                      <tr>
                        <td><span className="refIdTag">01_019_0120_1_1</span></td>
                        <td><strong>House or Yard Maintenance</strong></td>
                        <td><span className="fundingPillMini">Core Supports</span></td>
                        <td className="ocNumeric"><strong style={{ color: 'var(--oc-text)' }}>$59.01</strong></td>
                        <td>Hour</td>
                      </tr>
                      <tr>
                        <td><span className="refIdTag">01_020_0120_1_1</span></td>
                        <td><strong>House Cleaning and Other Household Activities</strong></td>
                        <td><span className="fundingPillMini">Core Supports</span></td>
                        <td className="ocNumeric"><strong style={{ color: 'var(--oc-text)' }}>$60.10</strong></td>
                        <td>Hour</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PARTICIPANTS DIRECTORY */}
          {tab === 'participants' && (
            <div className="crmTabPanel">
              <div className="crmPanelHeader">
                <div>
                  <h2 className="crmPanelTitle">Participants</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--oc-muted)' }}>
                    View participant details, funding arrangements, support workers, and documents.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddParticipant(true)}
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
                      <th className="ocNumeric">Allocated Hours</th>
                      <th>Support Worker</th>
                      <th>Lifecycle / Readiness</th>
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
                          <span style={{ fontSize: '0.85rem', color: 'var(--oc-secondary)' }}>{p.planManager || 'Self-Managed'}</span>
                        </td>
                        <td>
                          <span className="suburbBadge"><MapPin size={12} /> {p.suburb}</span>
                        </td>
                        <td className="ocNumeric">
                          <strong style={{ color: 'var(--oc-text)' }}>{p.allocatedHours || 15} hrs/wk</strong>
                        </td>
                        <td>
                          <span className="workerPill"><UserCheck size={14} /> {p.workerAssigned || 'Unassigned'}</span>
                        </td>
                        <td>
                          <button
                            onClick={() => setSelectedParticipant(p)}
                            className="crmViewBtn"
                          >
                            View profile
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredParticipants.length === 0 && (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--oc-muted)' }}>
                          No participant records found. Convert referrals to populate this directory.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* PHASE A TAB: PARTICIPANT GOALS                                  */}
          {/* =============================================================== */}
          {tab === 'goals' && (
            <div className="crmTabPanel">
              <div className="crmPanelHeader">
                <div>
                  <h2 className="crmPanelTitle">Participant Goals</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--oc-muted)' }}>
                    Manage NDIS plan goals, track progress and link to support activities.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <select className="ocField" aria-label="— Select Participant —"
                    value={selectedGoalParticipant}
                    onChange={(e) => {
                      setSelectedGoalParticipant(e.target.value);
                      if (e.target.value) loadGoals(e.target.value);
                    }}
                    style={{ border: '1px solid var(--oc-border)', borderRadius: 8, padding: '8px 12px', fontSize: '0.85rem', minWidth: 220 }}
                  >
                    <option value="">— Select Participant —</option>
                    {participants.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  {selectedGoalParticipant && (
                    <button
                      onClick={() => setShowGoalForm(!showGoalForm)}
                      style={{ background: 'var(--oc-accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <Plus size={15} /> Add Goal
                    </button>
                  )}
                </div>
              </div>

              {/* Create goal form */}
              {showGoalForm && (
                <div style={{ background: '#F8FAFF', border: '1px solid #BFDBFE', borderRadius: 12, padding: 20, marginBottom: 20 }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: '0.95rem', fontWeight: 600, color: 'var(--oc-accent)' }}>New Goal</h3>
                  <div className="ocFormGrid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Goal Title *</label>
                      <input className="ocField" aria-label="Goal Title *"
                        type="text"
                        placeholder="e.g. Improve independence in meal preparation"
                        value={newGoal.goal_title}
                        onChange={e => setNewGoal(prev => ({ ...prev, goal_title: e.target.value }))}
                        style={{ width: '100%', border: '1px solid var(--oc-border)', borderRadius: 8, padding: '9px 12px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Description</label>
                      <textarea className="ocField" aria-label="Description"
                        placeholder="Describe the goal in detail..."
                        value={newGoal.goal_description}
                        onChange={e => setNewGoal(prev => ({ ...prev, goal_description: e.target.value }))}
                        rows={3}
                        style={{ width: '100%', border: '1px solid var(--oc-border)', borderRadius: 8, padding: '9px 12px', fontSize: '0.88rem', resize: 'vertical', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Category</label>
                      <select className="ocField" aria-label="Category"
                        value={newGoal.category}
                        onChange={e => setNewGoal(prev => ({ ...prev, category: e.target.value }))}
                        style={{ width: '100%', border: '1px solid var(--oc-border)', borderRadius: 8, padding: '9px 12px', fontSize: '0.88rem' }}
                      >
                        {['Daily Living', 'Community Participation', 'Employment', 'Health & Wellbeing', 'Social', 'Capacity Building', 'General'].map(c => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>NDIS Domain</label>
                      <input className="ocField" aria-label="NDIS Domain"
                        type="text"
                        placeholder="e.g. Daily Activities"
                        value={newGoal.ndis_domain}
                        onChange={e => setNewGoal(prev => ({ ...prev, ndis_domain: e.target.value }))}
                        style={{ width: '100%', border: '1px solid var(--oc-border)', borderRadius: 8, padding: '9px 12px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Target Date</label>
                      <input className="ocField" aria-label="Target Date"
                        type="date"
                        value={newGoal.target_date}
                        onChange={e => setNewGoal(prev => ({ ...prev, target_date: e.target.value }))}
                        style={{ width: '100%', border: '1px solid var(--oc-border)', borderRadius: 8, padding: '9px 12px', fontSize: '0.88rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Review Date</label>
                      <input className="ocField" aria-label="Review Date"
                        type="date"
                        value={newGoal.review_date}
                        onChange={e => setNewGoal(prev => ({ ...prev, review_date: e.target.value }))}
                        style={{ width: '100%', border: '1px solid var(--oc-border)', borderRadius: 8, padding: '9px 12px', fontSize: '0.88rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Priority (1=Highest)</label>
                      <select className="ocField" aria-label="Priority (1=Highest)"
                        value={newGoal.priority}
                        onChange={e => setNewGoal(prev => ({ ...prev, priority: Number(e.target.value) }))}
                        style={{ width: '100%', border: '1px solid var(--oc-border)', borderRadius: 8, padding: '9px 12px', fontSize: '0.88rem' }}
                      >
                        {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                    <button
                      onClick={createGoal}
                      disabled={savingGoal || !newGoal.goal_title.trim()}
                      style={{ background: 'var(--oc-accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }}
                    >
                      {savingGoal ? 'Saving…' : 'Save Goal'}
                    </button>
                    <button
                      onClick={() => setShowGoalForm(false)}
                      style={{ background: 'var(--oc-subtle)', color: '#374151', border: 'none', borderRadius: 8, padding: '9px 20px', fontWeight: 500, fontSize: '0.88rem', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Goals list */}
              {!selectedGoalParticipant ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--oc-muted)' }}>
                  <Target size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
                  <p style={{ margin: 0 }}>Select a participant above to view their goals.</p>
                </div>
              ) : goalsLoading ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--oc-muted)' }}>Loading goals…</div>
              ) : goals.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--oc-muted)' }}>
                  <p>No goals recorded for this participant yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {goals.map(goal => (
                    <div key={goal.id} style={{
                      background: 'var(--oc-surface)', borderRadius: 10, padding: '16px 20px',
                      border: '1px solid var(--oc-border)', boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16,
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: '#111827', marginBottom: 4 }}>{goal.goal_title}</div>
                        {goal.goal_description && (
                          <p style={{ color: '#6B7280', fontSize: '0.85rem', margin: '0 0 8px' }}>{goal.goal_description}</p>
                        )}
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ background: 'var(--oc-info-soft)', color: '#3B82F6', borderRadius: 20, padding: '2px 10px', fontSize: '0.8125rem', fontWeight: 600 }}>{goal.category}</span>
                          {goal.ndis_domain && <span style={{ background: '#F3F4F6', color: '#6B7280', borderRadius: 20, padding: '2px 10px', fontSize: '0.8125rem' }}>{goal.ndis_domain}</span>}
                          {goal.target_date && <span style={{ fontSize: '0.8125rem', color: '#9CA3AF' }}>Target: {new Date(goal.target_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                        <span style={{
                          borderRadius: 20, padding: '4px 12px', fontSize: '0.8125rem', fontWeight: 600,
                          background: goal.status === 'active' ? 'var(--oc-info-soft)' : goal.status === 'achieved' ? 'var(--oc-success-soft)' : '#FFF7ED',
                          color: goal.status === 'active' ? '#3B82F6' : goal.status === 'achieved' ? 'var(--oc-success)' : 'var(--oc-warning)',
                        }}>
                          {goal.status === 'active' ? 'In Progress' : goal.status === 'achieved' ? '✓ Achieved' : goal.status === 'paused' ? 'On Hold' : 'Discontinued'}
                        </span>
                        <select className="ocField" aria-label="In Progress"
                          value={goal.status}
                          onChange={e => updateGoalStatus(goal.id, e.target.value)}
                          style={{ border: '1px solid var(--oc-border)', borderRadius: 6, padding: '4px 8px', fontSize: '0.8125rem' }}
                        >
                          <option value="active">In Progress</option>
                          <option value="achieved">Achieved</option>
                          <option value="paused">On Hold</option>
                          <option value="discontinued">Discontinued</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* =============================================================== */}
          {/* PHASE A TAB: SUPPORT PLANS                                       */}
          {/* =============================================================== */}
          {tab === 'support_plans' && (
            <div className="crmTabPanel">
              <div className="crmPanelHeader">
                <div>
                  <h2 className="crmPanelTitle">Support Plans</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--oc-muted)' }}>
                    Versioned participant support plans — draft, activate, and supersede as plans evolve.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <select className="ocField" aria-label="— Select Participant —"
                    value={selectedPlanParticipant}
                    onChange={(e) => {
                      setSelectedPlanParticipant(e.target.value);
                      if (e.target.value) loadSupportPlans(e.target.value);
                    }}
                    style={{ border: '1px solid var(--oc-border)', borderRadius: 8, padding: '8px 12px', fontSize: '0.85rem', minWidth: 220 }}
                  >
                    <option value="">— Select Participant —</option>
                    {participants.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  {selectedPlanParticipant && (
                    <button
                      onClick={() => setShowPlanForm(!showPlanForm)}
                      style={{ background: 'var(--oc-accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <Plus size={15} /> New Plan Version
                    </button>
                  )}
                </div>
              </div>

              {/* Support Plan Form */}
              {showPlanForm && (
                <div style={{ background: '#F8FAFF', border: '1px solid #BFDBFE', borderRadius: 12, padding: 20, marginBottom: 20 }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: '0.95rem', fontWeight: 600, color: 'var(--oc-accent)' }}>New Support Plan Version</h3>
                  <div className="ocFormGrid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Plan Title *</label>
                      <input className="ocField" aria-label="Plan Title *"
                        type="text"
                        value={newPlan.plan_title}
                        onChange={e => setNewPlan(prev => ({ ...prev, plan_title: e.target.value }))}
                        style={{ width: '100%', border: '1px solid var(--oc-border)', borderRadius: 8, padding: '9px 12px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Primary Disability</label>
                      <input className="ocField" aria-label="Primary Disability"
                        type="text"
                        placeholder="e.g. Autism Spectrum Disorder"
                        value={newPlan.primary_disability}
                        onChange={e => setNewPlan(prev => ({ ...prev, primary_disability: e.target.value }))}
                        style={{ width: '100%', border: '1px solid var(--oc-border)', borderRadius: 8, padding: '9px 12px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Communication Method</label>
                      <input className="ocField" aria-label="Communication Method"
                        type="text"
                        placeholder="e.g. Verbal, AAC device, Pictograms"
                        value={newPlan.communication_method}
                        onChange={e => setNewPlan(prev => ({ ...prev, communication_method: e.target.value }))}
                        style={{ width: '100%', border: '1px solid var(--oc-border)', borderRadius: 8, padding: '9px 12px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Dietary Requirements</label>
                      <input className="ocField" aria-label="Dietary Requirements"
                        type="text"
                        placeholder="e.g. Gluten-free, soft textures, nut allergy"
                        value={newPlan.dietary_requirements}
                        onChange={e => setNewPlan(prev => ({ ...prev, dietary_requirements: e.target.value }))}
                        style={{ width: '100%', border: '1px solid var(--oc-border)', borderRadius: 8, padding: '9px 12px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Mobility Aids</label>
                      <input className="ocField" aria-label="Mobility Aids"
                        type="text"
                        placeholder="e.g. Walking frame, wheelchair"
                        value={newPlan.mobility_aids}
                        onChange={e => setNewPlan(prev => ({ ...prev, mobility_aids: e.target.value }))}
                        style={{ width: '100%', border: '1px solid var(--oc-border)', borderRadius: 8, padding: '9px 12px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Review Date</label>
                      <input className="ocField" aria-label="Review Date"
                        type="date"
                        value={newPlan.review_date}
                        onChange={e => setNewPlan(prev => ({ ...prev, review_date: e.target.value }))}
                        style={{ width: '100%', border: '1px solid var(--oc-border)', borderRadius: 8, padding: '9px 12px', fontSize: '0.88rem' }}
                      />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Triggers & De-escalation Responses</label>
                      <textarea className="ocField" aria-label="Triggers & De-escalation Responses"
                        placeholder="Describe sensory triggers, environmental factors, and calming routines..."
                        value={newPlan.triggers_and_responses}
                        onChange={e => setNewPlan(prev => ({ ...prev, triggers_and_responses: e.target.value }))}
                        rows={3}
                        style={{ width: '100%', border: '1px solid var(--oc-border)', borderRadius: 8, padding: '9px 12px', fontSize: '0.88rem', resize: 'vertical', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                    <button
                      onClick={createSupportPlan}
                      disabled={savingPlan || !newPlan.plan_title.trim()}
                      style={{ background: 'var(--oc-accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }}
                    >
                      {savingPlan ? 'Saving…' : 'Save Support Plan Version'}
                    </button>
                    <button
                      onClick={() => setShowPlanForm(false)}
                      style={{ background: 'var(--oc-subtle)', color: '#374151', border: 'none', borderRadius: 8, padding: '9px 20px', fontWeight: 500, fontSize: '0.88rem', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {!selectedPlanParticipant ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--oc-muted)' }}>
                  <ClipboardList size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
                  <p style={{ margin: 0 }}>Select a participant to view their support plans.</p>
                </div>
              ) : plansLoading ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--oc-muted)' }}>Loading plans…</div>
              ) : supportPlans.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--oc-muted)' }}>
                  <p>No support plans yet. Click &ldquo;New Plan Version&rdquo; to create the first one.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {supportPlans.map(plan => (
                    <div key={plan.id} style={{
                      background: 'var(--oc-surface)', borderRadius: 10, padding: '18px 20px',
                      border: `1px solid ${plan.status === 'active' ? '#BBF7D0' : 'var(--oc-border)'}`,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 12 }}>
                        <div>
                          <div style={{ fontWeight: 600, color: '#111827', fontSize: '1rem' }}>{plan.plan_title} — v{plan.version}</div>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--oc-muted)', marginTop: 2 }}>
                            Created {new Date(plan.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {plan.plan_start_date && ` · Plan period: ${new Date(plan.plan_start_date).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })} – ${plan.plan_end_date ? new Date(plan.plan_end_date).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' }) : 'ongoing'}`}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span style={{
                            borderRadius: 20, padding: '4px 12px', fontSize: '0.8125rem', fontWeight: 600,
                            background: plan.status === 'active' ? 'var(--oc-success-soft)' : plan.status === 'draft' ? '#FFF7ED' : '#F3F4F6',
                            color: plan.status === 'active' ? 'var(--oc-success)' : plan.status === 'draft' ? 'var(--oc-warning)' : '#6B7280',
                          }}>
                            {plan.status === 'active' ? '✓ Active' : plan.status === 'draft' ? 'Draft' : plan.status === 'superseded' ? 'Superseded' : 'Archived'}
                          </span>
                          {plan.status === 'draft' && (
                            <button
                              onClick={() => activatePlan(plan.id)}
                              style={{ background: 'var(--oc-success)', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                              Activate
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="ocFormGrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                        {[
                          { label: 'Primary Disability', value: plan.primary_disability },
                          { label: 'Communication', value: plan.communication_method },
                          { label: 'Language', value: plan.language_preference },
                          { label: 'Dietary', value: plan.dietary_requirements },
                          { label: 'Mobility Aids', value: plan.mobility_aids },
                          { label: 'Review Date', value: plan.review_date ? new Date(plan.review_date).toLocaleDateString('en-AU') : null },
                        ].filter(f => f.value).map((field, idx) => (
                          <div key={idx}>
                            <div style={{ fontSize: '0.8125rem', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>{field.label}</div>
                            <div style={{ fontSize: '0.85rem', color: '#374151', fontWeight: 500 }}>{field.value}</div>
                          </div>
                        ))}
                      </div>
                      {plan.triggers_and_responses && (
                        <div style={{ marginTop: 12, background: '#FFF7ED', borderRadius: 8, padding: '10px 14px' }}>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--oc-warning)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Triggers & De-escalation</div>
                          <div style={{ fontSize: '0.85rem', color: '#374151' }}>{plan.triggers_and_responses}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* =============================================================== */}
          {/* PHASE A TAB: RISK ASSESSMENTS                                   */}
          {/* =============================================================== */}
          {tab === 'risk_assessments' && (
            <div className="crmTabPanel">
              <div className="crmPanelHeader">
                <div>
                  <h2 className="crmPanelTitle">Risk Assessments</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--oc-muted)' }}>
                    Structured participant risk assessments — versioned, activated, and shared with assigned workers.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <select className="ocField" aria-label="— Select Participant —"
                    value={selectedRiskParticipant}
                    onChange={(e) => {
                      setSelectedRiskParticipant(e.target.value);
                      if (e.target.value) loadRiskAssessments(e.target.value);
                    }}
                    style={{ border: '1px solid var(--oc-border)', borderRadius: 8, padding: '8px 12px', fontSize: '0.85rem', minWidth: 220 }}
                  >
                    <option value="">— Select Participant —</option>
                    {participants.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  {selectedRiskParticipant && (
                    <button
                      onClick={() => setShowRiskForm(!showRiskForm)}
                      style={{ background: 'var(--oc-accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <Plus size={15} /> New Assessment Version
                    </button>
                  )}
                </div>
              </div>

              {/* Risk Assessment Form */}
              {showRiskForm && (
                <div style={{ background: '#F8FAFF', border: '1px solid #BFDBFE', borderRadius: 12, padding: 20, marginBottom: 20 }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: '0.95rem', fontWeight: 600, color: 'var(--oc-accent)' }}>New Risk Assessment Version</h3>
                  <div className="ocFormGrid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Assessment Title *</label>
                      <input className="ocField" aria-label="Assessment Title *"
                        type="text"
                        value={newRisk.assessment_title}
                        onChange={e => setNewRisk(prev => ({ ...prev, assessment_title: e.target.value }))}
                        style={{ width: '100%', border: '1px solid var(--oc-border)', borderRadius: 8, padding: '9px 12px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Overall Risk Rating</label>
                      <select className="ocField" aria-label="Overall Risk Rating"
                        value={newRisk.overall_risk_rating}
                        onChange={e => setNewRisk(prev => ({ ...prev, overall_risk_rating: e.target.value }))}
                        style={{ width: '100%', border: '1px solid var(--oc-border)', borderRadius: 8, padding: '9px 12px', fontSize: '0.88rem' }}
                      >
                        <option value="Low">Low Risk</option>
                        <option value="Medium">Medium Risk</option>
                        <option value="High">High Risk</option>
                        <option value="Extreme">Extreme Risk</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Falls & Mobility Risk Description</label>
                      <input className="ocField" aria-label="Falls & Mobility Risk Description"
                        type="text"
                        value={newRisk.falls_risk}
                        onChange={e => setNewRisk(prev => ({ ...prev, falls_risk: e.target.value }))}
                        style={{ width: '100%', border: '1px solid var(--oc-border)', borderRadius: 8, padding: '9px 12px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Falls & Mobility Controls</label>
                      <input className="ocField" aria-label="Falls & Mobility Controls"
                        type="text"
                        value={newRisk.falls_controls}
                        onChange={e => setNewRisk(prev => ({ ...prev, falls_controls: e.target.value }))}
                        style={{ width: '100%', border: '1px solid var(--oc-border)', borderRadius: 8, padding: '9px 12px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Medication Controls</label>
                      <input className="ocField" aria-label="Medication Controls"
                        type="text"
                        value={newRisk.medication_controls}
                        onChange={e => setNewRisk(prev => ({ ...prev, medication_controls: e.target.value }))}
                        style={{ width: '100%', border: '1px solid var(--oc-border)', borderRadius: 8, padding: '9px 12px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Review Date</label>
                      <input className="ocField" aria-label="Review Date"
                        type="date"
                        value={newRisk.review_date}
                        onChange={e => setNewRisk(prev => ({ ...prev, review_date: e.target.value }))}
                        style={{ width: '100%', border: '1px solid var(--oc-border)', borderRadius: 8, padding: '9px 12px', fontSize: '0.88rem' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                    <button
                      onClick={createRiskAssessment}
                      disabled={savingRisk || !newRisk.assessment_title.trim()}
                      style={{ background: 'var(--oc-accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }}
                    >
                      {savingRisk ? 'Saving…' : 'Save Risk Assessment Version'}
                    </button>
                    <button
                      onClick={() => setShowRiskForm(false)}
                      style={{ background: 'var(--oc-subtle)', color: '#374151', border: 'none', borderRadius: 8, padding: '9px 20px', fontWeight: 500, fontSize: '0.88rem', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {!selectedRiskParticipant ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--oc-muted)' }}>
                  <ShieldAlert size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
                  <p style={{ margin: 0 }}>Select a participant to view their risk assessments.</p>
                </div>
              ) : risksLoading ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--oc-muted)' }}>Loading risk assessments…</div>
              ) : riskAssessments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--oc-muted)' }}>
                  <p style={{ margin: '0 0 12px' }}>No risk assessments for this participant yet.</p>
                  <button
                    onClick={async () => {
                      const res = await fetch('/api/portal/participant/risk-assessments', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'x-admin-key': 'OpusCare2025!Admin' },
                        body: JSON.stringify({
                          participant_id: selectedRiskParticipant,
                          assessment_title: 'Initial Risk Assessment',
                          status: 'draft',
                          overall_risk_rating: 'Low',
                          falls_and_mobility: { risk: 'Low risk of falls', likelihood: 1, consequence: 2, controls: 'Non-slip mats, grab rails in bathroom', residual_risk: 'Low' },
                          medication_risks: { risk: 'Medication management', likelihood: 2, consequence: 3, controls: 'Worker prompts at medication times; blister packs', residual_risk: 'Low' },
                        }),
                      });
                      const data = await res.json();
                      if (data.assessment) {
                        setRiskAssessments([data.assessment]);
                        setStatusNotice('Draft risk assessment created.');
                      }
                    }}
                    style={{ background: 'var(--oc-accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }}
                  >
                    Create Initial Risk Assessment
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {riskAssessments.map(ra => {
                    const ratingColour = ra.overall_risk_rating === 'Low' ? 'var(--oc-success)' : ra.overall_risk_rating === 'Medium' ? 'var(--oc-warning)' : ra.overall_risk_rating === 'High' ? 'var(--oc-danger)' : '#7C3AED';
                    const ratingBg = ra.overall_risk_rating === 'Low' ? 'var(--oc-success-soft)' : ra.overall_risk_rating === 'Medium' ? 'var(--oc-warning-soft)' : ra.overall_risk_rating === 'High' ? 'var(--oc-danger-soft)' : '#F5F3FF';
                    return (
                      <div key={ra.id} style={{
                        background: 'var(--oc-surface)', borderRadius: 10, padding: '18px 20px',
                        border: `1px solid ${ra.status === 'active' ? '#BBF7D0' : 'var(--oc-border)'}`,
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 14 }}>
                          <div>
                            <div style={{ fontWeight: 600, color: '#111827', fontSize: '1rem' }}>{ra.assessment_title} — v{ra.version}</div>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--oc-muted)', marginTop: 2 }}>
                              Created {new Date(ra.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                              {ra.review_date && ` · Review: ${new Date(ra.review_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            {ra.overall_risk_rating && (
                              <span style={{ borderRadius: 20, padding: '4px 12px', fontSize: '0.8125rem', fontWeight: 600, background: ratingBg, color: ratingColour }}>
                                {ra.overall_risk_rating} Risk
                              </span>
                            )}
                            <span style={{
                              borderRadius: 20, padding: '4px 12px', fontSize: '0.8125rem', fontWeight: 600,
                              background: ra.status === 'active' ? 'var(--oc-success-soft)' : ra.status === 'draft' ? '#FFF7ED' : '#F3F4F6',
                              color: ra.status === 'active' ? 'var(--oc-success)' : ra.status === 'draft' ? 'var(--oc-warning)' : '#6B7280',
                            }}>
                              {ra.status === 'active' ? '✓ Active' : ra.status === 'draft' ? 'Draft' : 'Superseded'}
                            </span>
                            {ra.status === 'draft' && (
                              <button
                                onClick={() => activateRiskAssessment(ra.id)}
                                style={{ background: 'var(--oc-success)', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}
                              >
                                Activate
                              </button>
                            )}
                          </div>
                        </div>
                        {/* Risk domains */}
                        <div className="ocFormGrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
                          {[
                            { key: 'falls_and_mobility', label: 'Falls & Mobility', data: ra.falls_and_mobility },
                            { key: 'medication_risks', label: 'Medication', data: ra.medication_risks },
                            { key: 'behaviour_and_mental_health', label: 'Behaviour & Mental Health', data: ra.behaviour_and_mental_health },
                            { key: 'environmental_hazards', label: 'Environmental Hazards', data: ra.environmental_hazards },
                            { key: 'community_access_risks', label: 'Community Access', data: ra.community_access_risks },
                            { key: 'fire_and_emergency', label: 'Fire & Emergency', data: ra.fire_and_emergency },
                            { key: 'financial_exploitation', label: 'Financial Safety', data: ra.financial_exploitation },
                          ].filter(d => d.data).map(domain => (
                            <div key={domain.key} style={{ background: 'var(--oc-background)', borderRadius: 8, padding: '10px 14px' }}>
                              <div style={{ fontSize: '0.8125rem', color: 'var(--oc-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>{domain.label}</div>
                              <div style={{ fontSize: '0.83rem', color: '#374151', marginBottom: 4 }}>{domain.data.risk}</div>
                              <div style={{ fontSize: '0.8125rem', color: '#6B7280' }}>Controls: {domain.data.controls}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* =============================================================== */}
          {/* PHASE B TAB: QUALITY & SAFEGUARDING                               */}
          {/* =============================================================== */}
          {tab === 'safeguarding' && (
            <div className="crmTabPanel">
              <div className="crmPanelHeader">
                <div>
                  <h2 className="crmPanelTitle">Quality & Safeguarding Hub</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--oc-muted)' }}>
                    Review incidents, respond to feedback, and track corrective actions.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => {
                      setNewActionForm({
                        source_type: 'incident',
                        source_id: incidentsList[0]?.id || '',
                        action_description: '',
                        owner: 'Operations Manager',
                        due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
                        priority: 'Medium',
                        notes: '',
                      });
                      setShowAddActionModal(true);
                    }}
                    style={{ background: 'var(--oc-info)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Plus size={15} /> Add Action
                  </button>
                  <button
                    onClick={() => {
                      loadIncidents();
                      loadComplaints();
                      loadCorrectiveActions();
                    }}
                    style={{ background: 'var(--oc-subtle)', color: 'var(--oc-secondary)', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <RefreshCw size={14} /> Refresh
                  </button>
                </div>
              </div>

              {/* KPI Strip */}
              {(() => {
                const openIncidents = incidentsList.filter(i => i.status !== 'Closed');
                const highCritIncidents = openIncidents.filter(i => i.severity === 'High' || i.severity === 'Critical');
                const pendingComplaints = complaintsList.filter(c => c.status !== 'Closed' && c.status !== 'Resolved');
                const nowStr = new Date().toISOString().split('T')[0];
                const overdueActions = actionsList.filter(a => a.status !== 'Completed' && a.status !== 'Cancelled' && a.due_date < nowStr);
                const reportableReview = openIncidents.filter(i =>
                  !i.reportable_assessment ||
                  i.reportable_assessment === 'Pending Review' ||
                  i.reportable_assessment.includes('Escalate') ||
                  i.reportable_assessment.includes('Potentially')
                );

                return (
                  <div className="ocFormGrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 20 }}>
                    <div style={{ background: 'var(--oc-surface)', padding: 16, borderRadius: 10, border: '1px solid var(--oc-border)', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--oc-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Open Incidents</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                        <span style={{ fontSize: '1.6rem', fontWeight: 600, color: 'var(--oc-text)' }}>{openIncidents.length}</span>
                        {highCritIncidents.length > 0 && (
                          <span style={{ fontSize: '0.8125rem', color: 'var(--oc-danger)', fontWeight: 600, background: 'var(--oc-danger-soft)', padding: '2px 8px', borderRadius: 12 }}>
                            {highCritIncidents.length} High/Critical
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ background: 'var(--oc-surface)', padding: 16, borderRadius: 10, border: '1px solid var(--oc-border)', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--oc-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Complaints Requiring Action</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                        <span style={{ fontSize: '1.6rem', fontWeight: 600, color: pendingComplaints.length > 0 ? 'var(--oc-warning)' : 'var(--oc-success)' }}>{pendingComplaints.length}</span>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--oc-muted)' }}>active feedback items</span>
                      </div>
                    </div>

                    <div style={{ background: 'var(--oc-surface)', padding: 16, borderRadius: 10, border: '1px solid var(--oc-border)', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--oc-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Overdue Corrective Actions</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                        <span style={{ fontSize: '1.6rem', fontWeight: 600, color: overdueActions.length > 0 ? 'var(--oc-danger)' : 'var(--oc-success)' }}>{overdueActions.length}</span>
                        <span style={{ fontSize: '0.8125rem', color: overdueActions.length > 0 ? 'var(--oc-danger)' : 'var(--oc-muted)' }}>
                          {overdueActions.length > 0 ? 'requires immediate action' : 'all on schedule'}
                        </span>
                      </div>
                    </div>

                    <div style={{ background: 'var(--oc-surface)', padding: 16, borderRadius: 10, border: '1px solid var(--oc-border)', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--oc-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Reportability Assessments</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                        <span style={{ fontSize: '1.6rem', fontWeight: 600, color: 'var(--oc-info)' }}>{reportableReview.length}</span>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--oc-muted)' }}>pending manager evaluation</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Sub-tab Navigation */}
              <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--oc-border)', paddingBottom: 10, marginBottom: 16 }}>
                <button
                  onClick={() => setSafeguardingSubTab('incidents')}
                  style={{
                    padding: '8px 16px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                    background: safeguardingSubTab === 'incidents' ? 'var(--oc-accent)' : 'var(--oc-surface)',
                    color: safeguardingSubTab === 'incidents' ? 'var(--oc-surface)' : 'var(--oc-muted)',
                    border: safeguardingSubTab === 'incidents' ? 'none' : '1px solid var(--oc-border)',
                  }}
                >
                  Incidents Register ({incidentsList.length})
                </button>
                <button
                  onClick={() => setSafeguardingSubTab('complaints')}
                  style={{
                    padding: '8px 16px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                    background: safeguardingSubTab === 'complaints' ? 'var(--oc-accent)' : 'var(--oc-surface)',
                    color: safeguardingSubTab === 'complaints' ? 'var(--oc-surface)' : 'var(--oc-muted)',
                    border: safeguardingSubTab === 'complaints' ? 'none' : '1px solid var(--oc-border)',
                  }}
                >
                  Complaints Register ({complaintsList.length})
                </button>
                <button
                  onClick={() => setSafeguardingSubTab('corrective_actions')}
                  style={{
                    padding: '8px 16px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                    background: safeguardingSubTab === 'corrective_actions' ? 'var(--oc-accent)' : 'var(--oc-surface)',
                    color: safeguardingSubTab === 'corrective_actions' ? 'var(--oc-surface)' : 'var(--oc-muted)',
                    border: safeguardingSubTab === 'corrective_actions' ? 'none' : '1px solid var(--oc-border)',
                  }}
                >
                  Corrective Actions ({actionsList.length})
                </button>
              </div>

              {/* SUBTAB 1: INCIDENTS */}
              {safeguardingSubTab === 'incidents' && (
                <div>
                  {/* Filters */}
                  <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                    <select className="ocField" aria-label="All Severities"
                      value={incidentSeverityFilter}
                      onChange={e => setIncidentSeverityFilter(e.target.value)}
                      style={{ border: '1px solid var(--oc-border)', borderRadius: 8, padding: '7px 12px', fontSize: '0.83rem' }}
                    >
                      <option value="all">All Severities</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                    <select className="ocField" aria-label="All Statuses"
                      value={incidentStatusFilter}
                      onChange={e => setIncidentStatusFilter(e.target.value)}
                      style={{ border: '1px solid var(--oc-border)', borderRadius: 8, padding: '7px 12px', fontSize: '0.83rem' }}
                    >
                      <option value="all">All Statuses</option>
                      <option value="Reported">Reported</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Investigation">Investigation</option>
                      <option value="Corrective Action">Corrective Action</option>
                      <option value="Monitoring">Monitoring</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>

                  {incidentsLoading ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--oc-muted)' }}>Loading incidents…</div>
                  ) : incidentsList.length === 0 ? (
                    <div style={{ background: 'var(--oc-surface)', padding: '40px 20px', borderRadius: 10, textAlign: 'center', border: '1px solid var(--oc-border)' }}>
                      <CheckCircle2 size={36} style={{ color: 'var(--oc-success)', marginBottom: 10 }} />
                      <p style={{ margin: 0, fontWeight: 600, color: 'var(--oc-secondary)' }}>No incidents recorded</p>
                      <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--oc-muted)' }}>Incident reports submitted by workers or staff will appear here.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {incidentsList
                        .filter(inc => incidentSeverityFilter === 'all' || inc.severity === incidentSeverityFilter)
                        .filter(inc => incidentStatusFilter === 'all' || inc.status === incidentStatusFilter)
                        .map(inc => {
                          const sevBg = inc.severity === 'Critical' ? '#450A0A' : inc.severity === 'High' ? 'var(--oc-danger-soft)' : inc.severity === 'Medium' ? 'var(--oc-warning-soft)' : 'var(--oc-success-soft)';
                          const sevColor = inc.severity === 'Critical' ? 'var(--oc-surface)' : inc.severity === 'High' ? 'var(--oc-danger)' : inc.severity === 'Medium' ? 'var(--oc-warning)' : 'var(--oc-success)';
                          return (
                            <div
                              key={inc.id}
                              style={{
                                background: 'var(--oc-surface)', borderRadius: 10, padding: '16px 18px', border: '1px solid var(--oc-border)',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.03)', display: 'flex', justifyContent: 'space-between',
                                alignItems: 'center', flexWrap: 'wrap', gap: 12,
                              }}
                            >
                              <div style={{ flex: 1, minWidth: 260 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                  <strong style={{ color: 'var(--oc-text)', fontSize: '0.95rem' }}>{inc.incident_reference}</strong>
                                  <span style={{ background: sevBg, color: sevColor, padding: '2px 8px', borderRadius: 12, fontSize: '0.8125rem', fontWeight: 600 }}>
                                    {inc.severity} Severity
                                  </span>
                                  <span style={{ background: 'var(--oc-subtle)', color: 'var(--oc-secondary)', padding: '2px 8px', borderRadius: 12, fontSize: '0.8125rem', fontWeight: 600 }}>
                                    {inc.category}
                                  </span>
                                  {inc.emergency_services_contacted && (
                                    <span style={{ background: 'var(--oc-danger-soft)', color: '#991B1B', padding: '2px 8px', borderRadius: 12, fontSize: '0.8125rem', fontWeight: 600 }}>
                                      🚨 000 Called
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.88rem', color: 'var(--oc-secondary)', marginBottom: 4 }}>
                                  {inc.description.length > 120 ? `${inc.description.slice(0, 120)}…` : inc.description}
                                </div>
                                <div style={{ fontSize: '0.8125rem', color: 'var(--oc-muted)', display: 'flex', gap: 14 }}>
                                  <span>Participant: <strong>{inc.participant?.full_name || 'Participant'}</strong></span>
                                  <span>Reported: {new Date(inc.incident_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                  <span>Status: <strong>{inc.status}</strong></span>
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                  onClick={() => setSelectedIncident(inc)}
                                  style={{
                                    background: 'var(--oc-accent)', color: '#fff', border: 'none', borderRadius: 6,
                                    padding: '7px 14px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 4,
                                  }}
                                >
                                  <Eye size={14} /> Review & Investigate
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}

              {/* SUBTAB 2: COMPLAINTS */}
              {safeguardingSubTab === 'complaints' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <select className="ocField" aria-label="All Statuses"
                        value={complaintStatusFilter}
                        onChange={e => setComplaintStatusFilter(e.target.value)}
                        style={{ border: '1px solid var(--oc-border)', borderRadius: 8, padding: '7px 12px', fontSize: '0.83rem' }}
                      >
                        <option value="all">All Statuses</option>
                        <option value="Received">Received</option>
                        <option value="Acknowledged">Acknowledged</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Action Required">Action Required</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: 'var(--oc-muted)' }}>
                      <span>Target Acknowledgement:</span>
                      <select className="ocField" aria-label="1 Business Day (Prompt: 24h)"
                        value={complaintAckTargetDays}
                        onChange={e => setComplaintAckTargetDays(Number(e.target.value))}
                        style={{ border: '1px solid var(--oc-border)', borderRadius: 6, padding: '5px 10px', fontSize: '0.8125rem', color: 'var(--oc-text)', background: 'var(--oc-background)' }}
                      >
                        <option value={1}>1 Business Day (Prompt: 24h)</option>
                        <option value={2}>2 Business Days (Prompt: 48h)</option>
                        <option value={3}>3 Business Days</option>
                        <option value={5}>5 Business Days</option>
                      </select>
                    </div>
                  </div>

                  {complaintsLoading ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--oc-muted)' }}>Loading complaints…</div>
                  ) : complaintsList.length === 0 ? (
                    <div style={{ background: 'var(--oc-surface)', padding: '40px 20px', borderRadius: 10, textAlign: 'center', border: '1px solid var(--oc-border)' }}>
                      <CheckCircle2 size={36} style={{ color: 'var(--oc-success)', marginBottom: 10 }} />
                      <p style={{ margin: 0, fontWeight: 600, color: 'var(--oc-secondary)' }}>No complaints recorded</p>
                      <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--oc-muted)' }}>Feedback and complaints from participants or stakeholders will appear here.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {complaintsList
                        .filter(c => complaintStatusFilter === 'all' || c.status === complaintStatusFilter)
                        .map(comp => (
                          <div
                            key={comp.id}
                            style={{
                              background: 'var(--oc-surface)', borderRadius: 10, padding: '16px 18px', border: '1px solid var(--oc-border)',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.03)', display: 'flex', justifyContent: 'space-between',
                              alignItems: 'center', flexWrap: 'wrap', gap: 12,
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 260 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <strong style={{ color: 'var(--oc-text)', fontSize: '0.95rem' }}>{comp.complaint_reference}</strong>
                                <span style={{ background: 'var(--oc-info-soft)', color: 'var(--oc-accent)', padding: '2px 8px', borderRadius: 12, fontSize: '0.8125rem', fontWeight: 600 }}>
                                  {comp.complainant_role}
                                </span>
                                {comp.immediate_safety_issue && (
                                  <span style={{ background: 'var(--oc-danger-soft)', color: 'var(--oc-danger)', padding: '2px 8px', borderRadius: 12, fontSize: '0.8125rem', fontWeight: 600 }}>
                                    ⚠️ Safety Issue
                                  </span>
                                )}
                                {comp.linked_incident_id && (
                                  <span style={{ background: '#FDF4FF', color: '#9333EA', padding: '2px 8px', borderRadius: 12, fontSize: '0.8125rem', fontWeight: 600 }}>
                                    Linked to Incident
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--oc-text)', marginBottom: 2 }}>
                                {comp.summary}
                              </div>
                              <div style={{ fontSize: '0.84rem', color: 'var(--oc-secondary)', marginBottom: 4 }}>
                                {comp.details.length > 120 ? `${comp.details.slice(0, 120)}…` : comp.details}
                              </div>
                              <div style={{ fontSize: '0.8125rem', color: 'var(--oc-muted)', display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                                <span>From: <strong>{comp.complainant_name}</strong></span>
                                <span>Received: {comp.received_date}</span>
                                <span>Status: <strong>{comp.status}</strong></span>
                                {comp.acknowledgement_date ? (
                                  <span style={{ color: 'var(--oc-success)', fontWeight: 600 }}>
                                    ✓ Acknowledged ({comp.acknowledgement_date})
                                  </span>
                                ) : (
                                  (() => {
                                    const rec = new Date(comp.received_date || comp.created_at);
                                    const target = new Date(rec.getTime() + complaintAckTargetDays * 86400000);
                                    const isDue = new Date() > target;
                                    return (
                                      <span style={{ color: isDue ? 'var(--oc-danger)' : 'var(--oc-warning)', fontWeight: 600 }}>
                                        {isDue ? '⚠️ Ack Overdue' : 'Prompt Ack Due'}: {target.toISOString().split('T')[0]}
                                      </span>
                                    );
                                  })()
                                )}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button
                                onClick={() => setSelectedComplaint(comp)}
                                style={{
                                  background: 'var(--oc-accent)', color: '#fff', border: 'none', borderRadius: 6,
                                  padding: '7px 14px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', gap: 4,
                                }}
                              >
                                <Eye size={14} /> Manage Complaint
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* SUBTAB 3: CORRECTIVE ACTIONS */}
              {safeguardingSubTab === 'corrective_actions' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <select className="ocField" aria-label="All Statuses"
                        value={actionStatusFilter}
                        onChange={e => setActionStatusFilter(e.target.value)}
                        style={{ border: '1px solid var(--oc-border)', borderRadius: 8, padding: '7px 12px', fontSize: '0.83rem' }}
                      >
                        <option value="all">All Statuses</option>
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Overdue">Overdue</option>
                      </select>
                    </div>
                  </div>

                  {actionsLoading ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--oc-muted)' }}>Loading corrective actions…</div>
                  ) : actionsList.length === 0 ? (
                    <div style={{ background: 'var(--oc-surface)', padding: '40px 20px', borderRadius: 10, textAlign: 'center', border: '1px solid var(--oc-border)' }}>
                      <CheckCircle2 size={36} style={{ color: 'var(--oc-success)', marginBottom: 10 }} />
                      <p style={{ margin: 0, fontWeight: 600, color: 'var(--oc-secondary)' }}>No corrective actions recorded</p>
                      <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--oc-muted)' }}>Actions assigned from incident reviews or complaint investigations will appear here.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {actionsList
                        .filter(a => actionStatusFilter === 'all' || a.status === actionStatusFilter)
                        .map(act => {
                          const isOverdue = act.status !== 'Completed' && act.status !== 'Cancelled' && act.due_date < new Date().toISOString().split('T')[0];
                          return (
                            <div
                              key={act.id}
                              style={{
                                background: 'var(--oc-surface)', borderRadius: 10, padding: '16px 18px', border: '1px solid var(--oc-border)',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.03)', display: 'flex', justifyContent: 'space-between',
                                alignItems: 'center', flexWrap: 'wrap', gap: 12,
                              }}
                            >
                              <div style={{ flex: 1, minWidth: 260 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                  <strong style={{ color: 'var(--oc-text)', fontSize: '0.95rem' }}>{act.action_reference}</strong>
                                  <span style={{ background: 'var(--oc-subtle)', color: 'var(--oc-secondary)', padding: '2px 8px', borderRadius: 12, fontSize: '0.8125rem', fontWeight: 600 }}>
                                    From {act.source_type}
                                  </span>
                                  <span style={{
                                    background: act.priority === 'Urgent' ? 'var(--oc-danger-soft)' : act.priority === 'High' ? 'var(--oc-warning-soft)' : 'var(--oc-success-soft)',
                                    color: act.priority === 'Urgent' ? 'var(--oc-danger)' : act.priority === 'High' ? 'var(--oc-warning)' : 'var(--oc-success)',
                                    padding: '2px 8px', borderRadius: 12, fontSize: '0.8125rem', fontWeight: 600,
                                  }}>
                                    {act.priority} Priority
                                  </span>
                                  {isOverdue && (
                                    <span style={{ background: 'var(--oc-danger-soft)', color: '#B91C1C', padding: '2px 8px', borderRadius: 12, fontSize: '0.8125rem', fontWeight: 600 }}>
                                      Overdue
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--oc-text)', fontWeight: 500, marginBottom: 4 }}>
                                  {act.action_description}
                                </div>
                                <div style={{ fontSize: '0.8125rem', color: 'var(--oc-muted)', display: 'flex', gap: 14 }}>
                                  <span>Owner: <strong>{act.owner}</strong></span>
                                  <span>Due: <strong>{act.due_date}</strong></span>
                                  <span>Status: <strong>{act.status}</strong></span>
                                  {act.completed_at && <span>Completed: {new Date(act.completed_at).toLocaleDateString('en-AU')}</span>}
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: 8 }}>
                                {act.status !== 'Completed' ? (
                                  <button
                                    onClick={() => {
                                      const evidence = prompt('Enter evidence / completion notes:');
                                      if (evidence !== null) {
                                        updateCorrectiveAction(act.id, {
                                          status: 'Completed',
                                          evidence_reference: evidence || 'Verified by manager',
                                        });
                                      }
                                    }}
                                    style={{
                                      background: 'var(--oc-success)', color: '#fff', border: 'none', borderRadius: 6,
                                      padding: '7px 14px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                                      display: 'flex', alignItems: 'center', gap: 4,
                                    }}
                                  >
                                    <Check size={14} /> Mark Completed
                                  </button>
                                ) : (
                                  <span style={{ background: 'var(--oc-success-soft)', color: 'var(--oc-success)', padding: '4px 10px', borderRadius: 6, fontSize: '0.8125rem', fontWeight: 600 }}>
                                    ✓ Completed
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* INCIDENT DETAIL & INVESTIGATION MODAL */}
          {selectedIncident && (
            <div style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 16,
            }}>
              <DialogPanel className="ocInlineDialog" onClose={() => setSelectedIncident(null)} label="Incident details" style={{
                background: 'var(--oc-surface)', borderRadius: 12, width: '100%', maxWidth: 760,
                maxHeight: '90vh', overflowY: 'auto', padding: 24, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--oc-border)', paddingBottom: 16, marginBottom: 16 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, color: 'var(--oc-text)' }}>
                        {selectedIncident.incident_reference}
                      </h3>
                      <span style={{ background: 'var(--oc-danger-soft)', color: 'var(--oc-danger)', padding: '2px 8px', borderRadius: 12, fontSize: '0.8125rem', fontWeight: 600 }}>
                        {selectedIncident.severity} Severity
                      </span>
                      <span style={{ background: 'var(--oc-info-soft)', color: 'var(--oc-accent)', padding: '2px 8px', borderRadius: 12, fontSize: '0.8125rem', fontWeight: 600 }}>
                        Status: {selectedIncident.status}
                      </span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--oc-muted)' }}>
                      Participant: <strong>{selectedIncident.participant?.full_name}</strong> &bull; Date: {new Date(selectedIncident.incident_at).toLocaleString('en-AU')}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedIncident(null)}
                    style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--oc-muted)' }}
                  >
                    &times;
                  </button>
                </div>

                {/* Facts Grid */}
                <div className="ocFormGrid" style={{ background: 'var(--oc-background)', padding: 14, borderRadius: 8, marginBottom: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: '0.85rem' }}>
                  <div><strong>Category:</strong> {selectedIncident.category}</div>
                  <div><strong>Location:</strong> {selectedIncident.location || 'Participant location'}</div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <strong>Incident Description:</strong>
                    <div style={{ marginTop: 4, color: 'var(--oc-secondary)' }}>{selectedIncident.description}</div>
                  </div>
                  {selectedIncident.immediate_actions_taken && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <strong>Immediate Actions Taken:</strong>
                      <div style={{ marginTop: 2, color: 'var(--oc-secondary)' }}>{selectedIncident.immediate_actions_taken}</div>
                    </div>
                  )}
                  {selectedIncident.injury_or_harm_details && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <strong>Injury / Harm:</strong>
                      <div style={{ marginTop: 2, color: '#B91C1C' }}>{selectedIncident.injury_or_harm_details}</div>
                    </div>
                  )}
                  {selectedIncident.emergency_services_contacted && (
                    <div style={{ gridColumn: '1 / -1', background: 'var(--oc-danger-soft)', padding: 8, borderRadius: 6, color: '#991B1B' }}>
                      <strong>Emergency Services (000) Contacted:</strong> {selectedIncident.emergency_services_details || 'Yes'}
                    </div>
                  )}
                </div>

                {/* Manager Review & Investigation Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 18 }}>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--oc-text)', display: 'block', marginBottom: 4 }}>
                      Manager Investigation Notes & Findings
                    </label>
                    <textarea className="ocField"
                      rows={3}
                      id="incident_inv_notes"
                      defaultValue={selectedIncident.investigation_notes || ''}
                      placeholder="Record root cause analysis, worker interviews, policy compliance, and contributing factors..."
                      style={{ width: '100%', border: '1px solid var(--oc-border)', borderRadius: 8, padding: '8px 12px', fontSize: '0.85rem', resize: 'vertical', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div className="ocFormGrid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--oc-text)', display: 'block', marginBottom: 4 }}>
                        Reportability Assessment
                      </label>
                      <select className="ocField"
                        id="incident_reportable_assessment"
                        defaultValue={selectedIncident.reportable_assessment || 'Pending Review'}
                        style={{ width: '100%', border: '1px solid var(--oc-border)', borderRadius: 8, padding: '8px 12px', fontSize: '0.85rem' }}
                      >
                        <option value="Pending Review">Pending Review</option>
                        <option value="Not Reportable / No External Notification Required">Not Reportable / No External Notification Required</option>
                        <option value="Potentially Reportable / Escalate for Review">Potentially Reportable / Escalate for Review</option>
                        <option value="Reportable where applicable">Reportable where applicable</option>
                      </select>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--oc-muted)', marginTop: 4, display: 'block' }}>
                        Opus Care operates as an unregistered provider. Formal notification obligations apply only where specifically mandated for the service or participant.
                      </span>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--oc-text)', display: 'block', marginBottom: 4 }}>
                        External Notification Status
                      </label>
                      <select className="ocField"
                        id="incident_notification_status"
                        defaultValue={selectedIncident.external_notification_status || 'Not Required'}
                        style={{ width: '100%', border: '1px solid var(--oc-border)', borderRadius: 8, padding: '8px 12px', fontSize: '0.85rem' }}
                      >
                        <option value="Not Required">Not Required</option>
                        <option value="Pending Review">Pending Review</option>
                        <option value="Escalated for Internal Governance Review">Escalated for Internal Governance Review</option>
                        <option value="Notified to NDIS Commission (where applicable)">Notified to NDIS Commission (where applicable)</option>
                        <option value="Reported to Police / Emergency Services">Reported to Police / Emergency Services</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--oc-text)', display: 'block', marginBottom: 4 }}>
                      Reportability Determination Rationale
                    </label>
                    <input className="ocField"
                      type="text"
                      id="incident_reportable_rationale"
                      defaultValue={selectedIncident.reportable_rationale || ''}
                      placeholder="Explain assessment rationale and whether external notification applies..."
                      style={{ width: '100%', border: '1px solid var(--oc-border)', borderRadius: 8, padding: '8px 12px', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--oc-text)', display: 'block', marginBottom: 4 }}>
                      Participant / Family Follow-up Notes
                    </label>
                    <input className="ocField"
                      type="text"
                      id="incident_family_followup"
                      defaultValue={selectedIncident.participant_family_follow_up || ''}
                      placeholder="Date contacted, family informed, welfare check completed..."
                      style={{ width: '100%', border: '1px solid var(--oc-border)', borderRadius: 8, padding: '8px 12px', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Actions & Status Workflow Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--oc-border)', paddingTop: 16, flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => {
                        setNewActionForm({
                          source_type: 'incident',
                          source_id: selectedIncident.id,
                          action_description: `Corrective action arising from ${selectedIncident.incident_reference}`,
                          owner: 'Operations Manager',
                          due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
                          priority: 'High',
                          notes: '',
                        });
                        setShowAddActionModal(true);
                      }}
                      style={{ background: 'var(--oc-subtle)', color: 'var(--oc-accent)', border: '1px solid #BFDBFE', borderRadius: 6, padding: '7px 12px', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      + Create Corrective Action
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={async () => {
                        const invNotes = (document.getElementById('incident_inv_notes') as HTMLTextAreaElement)?.value;
                        const repAssessment = (document.getElementById('incident_reportable_assessment') as HTMLSelectElement)?.value;
                        const notifStatus = (document.getElementById('incident_notification_status') as HTMLSelectElement)?.value;
                        const repRationale = (document.getElementById('incident_reportable_rationale') as HTMLInputElement)?.value;
                        const familyFollowup = (document.getElementById('incident_family_followup') as HTMLInputElement)?.value;

                        await updateIncident(selectedIncident.id, {
                          investigation_notes: invNotes,
                          reportable_assessment: repAssessment,
                          external_notification_status: notifStatus,
                          reportable_rationale: repRationale,
                          participant_family_follow_up: familyFollowup,
                        });
                      }}
                      style={{ background: 'var(--oc-accent)', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 16px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Save Investigation
                    </button>

                    {selectedIncident.status !== 'Investigation' && selectedIncident.status !== 'Closed' && (
                      <button
                        onClick={() => updateIncident(selectedIncident.id, { status: 'Investigation' })}
                        style={{ background: '#7C3AED', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 14px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Start Investigation
                      </button>
                    )}

                    {selectedIncident.status !== 'Closed' ? (
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to close this incident? All investigation findings and corrective actions must be finalized.')) {
                            updateIncident(selectedIncident.id, { status: 'Closed' });
                          }
                        }}
                        style={{ background: 'var(--oc-success)', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 14px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Close Incident
                      </button>
                    ) : (
                      <button
                        onClick={() => updateIncident(selectedIncident.id, { status: 'Under Review' })}
                        style={{ background: 'var(--oc-subtle)', color: 'var(--oc-muted)', border: '1px solid var(--oc-border)', borderRadius: 6, padding: '7px 14px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Re-open Incident
                      </button>
                    )}
                  </div>
                </div>
              </DialogPanel>
            </div>
          )}

          {/* COMPLAINT DETAIL & RESOLUTION MODAL */}
          {selectedComplaint && (
            <div style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 16,
            }}>
              <DialogPanel className="ocInlineDialog" onClose={() => setSelectedComplaint(null)} label="Complaint details" style={{
                background: 'var(--oc-surface)', borderRadius: 12, width: '100%', maxWidth: 700,
                maxHeight: '90vh', overflowY: 'auto', padding: 24, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--oc-border)', paddingBottom: 14, marginBottom: 16 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, color: 'var(--oc-text)' }}>
                        {selectedComplaint.complaint_reference}
                      </h3>
                      <span style={{ background: 'var(--oc-info-soft)', color: 'var(--oc-accent)', padding: '2px 8px', borderRadius: 12, fontSize: '0.8125rem', fontWeight: 600 }}>
                        {selectedComplaint.status}
                      </span>
                      {selectedComplaint.immediate_safety_issue && (
                        <span style={{ background: 'var(--oc-danger-soft)', color: 'var(--oc-danger)', padding: '2px 8px', borderRadius: 12, fontSize: '0.8125rem', fontWeight: 600 }}>
                          ⚠️ Immediate Safety Issue
                        </span>
                      )}
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--oc-muted)' }}>
                      Complainant: <strong>{selectedComplaint.complainant_name}</strong> ({selectedComplaint.complainant_role}) &bull; Received: {selectedComplaint.received_date}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedComplaint(null)}
                    style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--oc-muted)' }}
                  >
                    &times;
                  </button>
                </div>

                <div style={{ background: 'var(--oc-background)', padding: 14, borderRadius: 8, marginBottom: 16, fontSize: '0.85rem' }}>
                  <div style={{ marginBottom: 6 }}><strong>Summary:</strong> {selectedComplaint.summary}</div>
                  <div style={{ marginBottom: 6 }}><strong>Full Details:</strong> {selectedComplaint.details}</div>
                  <div><strong>Contact Details:</strong> {selectedComplaint.contact_details || 'Not provided'}</div>
                  {selectedComplaint.linked_incident_id && (
                    <div style={{ marginTop: 8, background: '#FDF4FF', padding: 8, borderRadius: 6, color: '#7E22CE' }}>
                      <strong>Linked Incident:</strong> Incident ID {selectedComplaint.linked_incident_id}
                    </div>
                  )}
                </div>

                {/* Complaint Management Fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                  <div className="ocFormGrid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--oc-text)', display: 'block', marginBottom: 4 }}>
                        Target Acknowledgement Date / Prompt Acknowledgement
                      </label>
                      <input className="ocField"
                        type="date"
                        id="comp_ack_date"
                        defaultValue={selectedComplaint.acknowledgement_date || ''}
                        style={{ width: '100%', border: '1px solid var(--oc-border)', borderRadius: 8, padding: '7px 10px', fontSize: '0.85rem' }}
                      />
                      <span style={{ fontSize: '0.8125rem', color: 'var(--oc-muted)', display: 'block', marginTop: 2 }}>
                        Target: prompt acknowledgement within {complaintAckTargetDays} business day{complaintAckTargetDays > 1 ? 's' : ''} of receipt
                      </span>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--oc-text)', display: 'block', marginBottom: 4 }}>
                        Assigned Manager
                      </label>
                      <input className="ocField"
                        type="text"
                        id="comp_assigned_manager"
                        defaultValue={selectedComplaint.assigned_manager || 'Operations Manager'}
                        style={{ width: '100%', border: '1px solid var(--oc-border)', borderRadius: 8, padding: '7px 10px', fontSize: '0.85rem', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--oc-text)', display: 'block', marginBottom: 4 }}>
                      Investigation Notes & Actions Taken
                    </label>
                    <textarea className="ocField"
                      rows={3}
                      id="comp_investigation_notes"
                      defaultValue={selectedComplaint.investigation_notes || ''}
                      placeholder="Steps taken to address the complaint..."
                      style={{ width: '100%', border: '1px solid var(--oc-border)', borderRadius: 8, padding: '8px 12px', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--oc-text)', display: 'block', marginBottom: 4 }}>
                      Outcome & Resolution Summary
                    </label>
                    <textarea className="ocField"
                      rows={2}
                      id="comp_resolution_summary"
                      defaultValue={selectedComplaint.resolution_summary || ''}
                      placeholder="Agreed resolution and communication with complainant..."
                      style={{ width: '100%', border: '1px solid var(--oc-border)', borderRadius: 8, padding: '8px 12px', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--oc-border)', paddingTop: 14, flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    {!selectedComplaint.linked_incident_id && (
                      <button
                        onClick={() => {
                          setEscalateIncidentForm({
                            category: 'other',
                            severity: 'High',
                            description: selectedComplaint.summary,
                          });
                          setShowEscalateComplaintModal(true);
                        }}
                        style={{ background: 'var(--oc-danger-soft)', color: 'var(--oc-danger)', border: '1px solid #FECACA', borderRadius: 6, padding: '7px 12px', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        ⚠️ Escalate to Incident
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={async () => {
                        const ackDate = (document.getElementById('comp_ack_date') as HTMLInputElement)?.value;
                        const manager = (document.getElementById('comp_assigned_manager') as HTMLInputElement)?.value;
                        const notes = (document.getElementById('comp_investigation_notes') as HTMLTextAreaElement)?.value;
                        const res = (document.getElementById('comp_resolution_summary') as HTMLTextAreaElement)?.value;

                        await updateComplaint(selectedComplaint.id, {
                          acknowledgement_date: ackDate || null,
                          assigned_manager: manager,
                          investigation_notes: notes,
                          resolution_summary: res,
                        });
                      }}
                      style={{ background: 'var(--oc-accent)', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 14px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Save Updates
                    </button>

                    {selectedComplaint.status !== 'Resolved' && selectedComplaint.status !== 'Closed' && (
                      <button
                        onClick={() => updateComplaint(selectedComplaint.id, { status: 'Resolved' })}
                        style={{ background: 'var(--oc-success)', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 14px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Mark Resolved
                      </button>
                    )}

                    {selectedComplaint.status !== 'Closed' ? (
                      <button
                        onClick={() => updateComplaint(selectedComplaint.id, { status: 'Closed' })}
                        style={{ background: 'var(--oc-secondary)', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 14px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Close Complaint
                      </button>
                    ) : (
                      <button
                        onClick={() => updateComplaint(selectedComplaint.id, { status: 'Under Review' })}
                        style={{ background: 'var(--oc-subtle)', color: 'var(--oc-muted)', border: '1px solid var(--oc-border)', borderRadius: 6, padding: '7px 14px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Re-open
                      </button>
                    )}
                  </div>
                </div>
              </DialogPanel>
            </div>
          )}

          {/* ADD CORRECTIVE ACTION DRAWER */}
          <FormDrawer
            isOpen={showAddActionModal}
            onClose={() => setShowAddActionModal(false)}
          >
            <DrawerHeader
              title="Create Corrective Action"
              description="Assign continuous improvement and compliance remediation actions to workforce leads."
              badge={<span className="refIdTag">GOVERNANCE</span>}
              onClose={() => setShowAddActionModal(false)}
            />
            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20, height: 'calc(100% - 73px)', overflowY: 'auto' }}>
              <FormField label="Action Description" required>
                <FormTextarea
                  rows={3}
                  value={newActionForm.action_description}
                  onChange={e => setNewActionForm(prev => ({ ...prev, action_description: e.target.value }))}
                  placeholder="e.g. Conduct refresher manual handling training for support team"
                />
              </FormField>

              <FormGrid2>
                <FormField label="Owner / Lead" required>
                  <FormInput
                    type="text"
                    value={newActionForm.owner}
                    onChange={e => setNewActionForm(prev => ({ ...prev, owner: e.target.value }))}
                  />
                </FormField>
                <FormField label="Due Date" required>
                  <FormInput
                    type="date"
                    value={newActionForm.due_date}
                    onChange={e => setNewActionForm(prev => ({ ...prev, due_date: e.target.value }))}
                  />
                </FormField>
              </FormGrid2>

              <FormField label="Priority">
                <FormSelect
                  value={newActionForm.priority}
                  onChange={e => setNewActionForm(prev => ({ ...prev, priority: e.target.value }))}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </FormSelect>
              </FormField>
            </div>
            <StickyFormFooter
              cancelLabel="Cancel"
              onCancel={() => setShowAddActionModal(false)}
              primaryLabel="Create Action"
              primaryDisabled={!newActionForm.action_description.trim() || !newActionForm.owner || !newActionForm.due_date}
              onPrimary={() => createCorrectiveAction(newActionForm)}
            />
          </FormDrawer>

          {/* ESCALATE COMPLAINT TO INCIDENT DRAWER */}
          <FormDrawer
            isOpen={showEscalateComplaintModal && !!selectedComplaint}
            onClose={() => setShowEscalateComplaintModal(false)}
          >
            {selectedComplaint && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <DrawerHeader
                  title="Escalate Complaint to Incident"
                  description={`Creates an official Incident record linked to complaint ${selectedComplaint.complaint_reference} for formal investigation.`}
                  badge={<span style={{ background: '#FEE2E2', color: '#B91C1C', fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: 6 }}>ESCALATION</span>}
                  onClose={() => setShowEscalateComplaintModal(false)}
                />
                <div style={{ flex: 1, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' }}>
                  <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: 14, fontSize: '0.85rem', color: '#991B1B' }}>
                    <strong>Notice:</strong> Escalating will create a formal NDIS reportable incident candidate and notify quality governance.
                  </div>

                  <FormField label="Category" required>
                    <FormSelect
                      value={escalateIncidentForm.category}
                      onChange={e => setEscalateIncidentForm(prev => ({ ...prev, category: e.target.value }))}
                    >
                      <option value="allegation_abuse_neglect">Allegation of Abuse / Neglect / Exploitation</option>
                      <option value="injury">Physical Harm or Injury</option>
                      <option value="medication_error">Medication Issue</option>
                      <option value="behaviour_of_concern">Behaviour of Concern</option>
                      <option value="other">Other Incident</option>
                    </FormSelect>
                  </FormField>

                  <FormField label="Severity Rating" required>
                    <FormSelect
                      value={escalateIncidentForm.severity}
                      onChange={e => setEscalateIncidentForm(prev => ({ ...prev, severity: e.target.value as any }))}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </FormSelect>
                  </FormField>

                  <FormField label="Incident Summary / Note">
                    <FormTextarea
                      rows={3}
                      value={escalateIncidentForm.description}
                      onChange={e => setEscalateIncidentForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Add any specific context for this escalation..."
                    />
                  </FormField>
                </div>

                <StickyFormFooter
                  cancelLabel="Cancel"
                  onCancel={() => setShowEscalateComplaintModal(false)}
                  primaryLabel="Confirm Escalation"
                  onPrimary={() => escalateComplaintToIncident(selectedComplaint)}
                />
              </div>
            )}
          </FormDrawer>

          {/* TAB: INVOICING & CLAIMS */}
          {tab === 'invoicing' && (
            <InvoicingTab participants={participants} />
          )}

          {/* TAB: QUOTES & BUDGETS */}
          {tab === 'quotes' && (
            <QuotesTab participants={participants} />
          )}

          {/* TAB: TIMESHEETS & SERVICE RECORDS */}
          {tab === 'timesheets' && (
            <TimesheetsTab />
          )}

          {/* TAB: PROGRESS NOTES */}
          {tab === 'progress_notes' && (
            <ProgressNotesTab />
          )}

          {/* TAB 6: SUPPORT WORKERS & CLEARANCES */}
          {tab === 'staff' && (
            <div className="crmTabPanel">
              <div className="crmPanelHeader">
                <div>
                  <h2 className="crmPanelTitle">Workers & credentials</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--oc-muted)' }}>
                    Monitor support worker qualifications, NDIS Worker Screening Check (NWSC), WWCC, and First Aid certificates.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddWorker(true)}
                  className="headerCtaBtn"
                  style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                >
                  <Plus size={15} /> <span>Add worker</span>
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
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--oc-secondary)' }}>{s.role}</span>
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
                        <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--oc-muted)' }}>
                          No support worker records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: WORKFORCE ROSTERING & SHIFT SCHEDULING */}
          {tab === 'workforce' && (
            <WorkforceRosterTab
              participants={participants.filter((p) => p.isRosterable).map((p) => ({
                id: p.id,
                referenceNumber: p.referenceNumber,
                name: p.name,
                suburb: p.suburb,
                allocatedHours: p.allocatedHours,
                fundingType: p.fundingType,
              }))}
              staff={staff.map((st) => ({
                id: st.id,
                referenceNumber: st.referenceNumber,
                name: st.name,
                role: st.role,
                phone: st.phone,
                suburbs: st.suburbs,
                ndisScreening: st.ndisScreening,
                ndisScreeningExpiry: st.ndisScreeningExpiry,
                firstAidExpiry: st.firstAidExpiry,
                cprExpiry: st.cprExpiry,
                hourlyRate: st.hourlyRate,
              }))}
            />
          )}

          {/* TAB 7: TRAINING & COMPLIANCE MANAGEMENT */}
          {tab === 'compliance' && (
            <div className="crmTabPanel">
              <div className="crmPanelHeader">
                <div>
                  <h2 className="crmPanelTitle">Training & Compliance Management</h2>
                  <p style={{ margin:'4px 0 0', fontSize:'0.85rem', color:'var(--oc-muted)' }}>
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
                    borderBottom: trainingTab===t ? '2px solid var(--oc-info)' : '2px solid transparent',
                    color: trainingTab===t ? 'var(--oc-info)' : 'var(--oc-muted)', fontWeight:600, fontSize:'0.85rem' }}>
                    {t === 'courses' ? 'Course Library' : t === 'assign' ? 'Assign to Staff' : t === 'external' ? 'External Training Library' : 'Compliance Report'}
                  </button>
                ))}
              </div>

              {trainingLoading && <div style={{padding:40,textAlign:'center',color:'var(--oc-muted)'}}>Loading...</div>}

              {!trainingLoading && trainingLoadError && (
                <div role="alert" style={{padding:20,border:'1px solid #FECACA',borderRadius:12,background:'#FEF2F2',color:'#991B1B'}}>
                  {trainingLoadError}
                </div>
              )}

              {!trainingLoading && !trainingLoadError && trainingTab === 'courses' && (
                <>
                  {showCourseForm && (
                    <div style={{background:'var(--oc-background)',border:'1px solid #EEF2F6',borderRadius:12,padding:24,marginBottom:24}}>
                      <h3 style={{fontSize:'1rem',fontWeight: 600,color:'var(--oc-text)',marginBottom:16}}>New Course</h3>
                      <form onSubmit={handleCreateCourse}>
                        <div className="ocFormGrid" style={{ display: 'grid', gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
                          <div>
                            <label style={{fontSize: '0.8125rem',fontWeight:600,color:'#374151',display:'block',marginBottom:4}}>Title *</label>
                            <input className="ocField" aria-label="Title *" value={newCourse.title} onChange={e=>setNewCourse(p=>({...p,title:e.target.value}))}
                              placeholder="e.g. NDIS Code of Conduct" required
                              style={{width:'100%',padding:'8px 12px',border:'1px solid #D1D5DB',borderRadius:6,fontSize:'0.9rem'}}/>
                          </div>
                          <div>
                            <label style={{fontSize: '0.8125rem',fontWeight:600,color:'#374151',display:'block',marginBottom:4}}>Type *</label>
                            <select className="ocField" aria-label="Type *" value={newCourse.course_type}
                              onChange={e=>setNewCourse(p=>({...p,course_type:e.target.value as "read_acknowledge"|"read_quiz"|"external_cert"}))}
                              style={{width:'100%',padding:'8px 12px',border:'1px solid #D1D5DB',borderRadius:6,fontSize:'0.9rem'}}>
                              <option value="read_acknowledge">Read & Acknowledge</option>
                              <option value="read_quiz">Read + Quiz</option>
                              <option value="external_cert">External Certificate Upload</option>
                            </select>
                          </div>
                          <div>
                            <label style={{fontSize: '0.8125rem',fontWeight:600,color:'#374151',display:'block',marginBottom:4}}>Material</label>
                            <select className="ocField" aria-label="Material" value={newCourse.material_type} onChange={e=>setNewCourse(p=>({...p,material_type:e.target.value}))}
                              style={{width:'100%',padding:'8px 12px',border:'1px solid #D1D5DB',borderRadius:6,fontSize:'0.9rem'}}>
                              <option value="none">No Material</option>
                              <option value="pdf">PDF</option>
                              <option value="ppt">PowerPoint</option>
                              <option value="link">External Link</option>
                            </select>
                          </div>
                          <div>
                            <label style={{fontSize: '0.8125rem',fontWeight:600,color:'#374151',display:'block',marginBottom:4}}>Material URL</label>
                            <input className="ocField" aria-label="Material URL" value={newCourse.material_url} onChange={e=>setNewCourse(p=>({...p,material_url:e.target.value}))}
                              placeholder="https://..." type="url"
                              style={{width:'100%',padding:'8px 12px',border:'1px solid #D1D5DB',borderRadius:6,fontSize:'0.9rem'}}/>
                          </div>
                          <div>
                            <label style={{fontSize: '0.8125rem',fontWeight:600,color:'#374151',display:'block',marginBottom:4}}>Pass Mark %</label>
                            <input className="ocField" aria-label="Pass Mark %" type="number" min="1" max="100" value={newCourse.pass_mark_pct}
                              onChange={e=>setNewCourse(p=>({...p,pass_mark_pct:Number(e.target.value)}))}
                              style={{width:'100%',padding:'8px 12px',border:'1px solid #D1D5DB',borderRadius:6,fontSize:'0.9rem'}}/>
                          </div>
                          <div>
                            <label style={{fontSize: '0.8125rem',fontWeight:600,color:'#374151',display:'block',marginBottom:4}}>Validity (months)</label>
                            <input className="ocField" aria-label="Validity (months)" type="number" min="1" value={newCourse.validity_months}
                              onChange={e=>setNewCourse(p=>({...p,validity_months:e.target.value}))} placeholder="blank = no expiry"
                              style={{width:'100%',padding:'8px 12px',border:'1px solid #D1D5DB',borderRadius:6,fontSize:'0.9rem'}}/>
                          </div>
                          <div>
                            <label style={{fontSize: '0.8125rem',fontWeight:600,color:'#374151',display:'block',marginBottom:4}}>Max Attempts</label>
                            <input className="ocField" aria-label="Max Attempts" type="number" min="1" value={newCourse.max_attempts}
                              onChange={e=>setNewCourse(p=>({...p,max_attempts:e.target.value}))} placeholder="blank = unlimited"
                              style={{width:'100%',padding:'8px 12px',border:'1px solid #D1D5DB',borderRadius:6,fontSize:'0.9rem'}}/>
                          </div>
                          <div style={{display:'flex',gap:16,alignItems:'center',paddingTop:22}}>
                            <label style={{display:'flex',alignItems:'center',gap:6,fontSize:'0.85rem',cursor:'pointer'}}>
                              <input aria-label="Mandatory" type="checkbox" checked={newCourse.is_mandatory} onChange={e=>setNewCourse(p=>({...p,is_mandatory:e.target.checked}))}/> Mandatory
                            </label>
                            <label style={{display:'flex',alignItems:'center',gap:6,fontSize:'0.85rem',cursor:'pointer'}}>
                              <input aria-label="Mandatory" type="checkbox" checked={newCourse.certificate_enabled} onChange={e=>setNewCourse(p=>({...p,certificate_enabled:e.target.checked}))}/> Issue Certificate
                            </label>
                          </div>
                        </div>
                        <div style={{marginBottom:16}}>
                          <label style={{fontSize: '0.8125rem',fontWeight:600,color:'#374151',display:'block',marginBottom:4}}>Description</label>
                          <textarea className="ocField" aria-label="Description" value={newCourse.description} onChange={e=>setNewCourse(p=>({...p,description:e.target.value}))}
                            rows={2} placeholder="Brief course description..."
                            style={{width:'100%',padding:'8px 12px',border:'1px solid #D1D5DB',borderRadius:6,fontSize:'0.9rem',resize:'vertical'}}/>
                        </div>
                        {newCourse.course_type === 'read_quiz' && (
                          <div style={{marginBottom:16}}>
                            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                              <strong style={{fontSize:'0.85rem',color:'#374151'}}>Quiz Questions ({newCourse.quiz_questions.length})</strong>
                              <button type="button" className="crmViewBtn" style={{fontSize: '0.8125rem',padding:'4px 12px'}}
                                onClick={()=>setNewCourse(p=>({...p,quiz_questions:[...p.quiz_questions,{question:'',options:['','','',''],correct_index:0}]}))}>
                                + Add Question
                              </button>
                            </div>
                            {newCourse.quiz_questions.map((q,qi)=>(
                              <div key={qi} style={{background:'#fff',border:'1px solid var(--oc-border)',borderRadius:8,padding:16,marginBottom:12}}>
                                <div style={{display:'flex',gap:8,marginBottom:8}}>
                                  <span style={{fontWeight: 600,color:'var(--oc-info)',minWidth:28}}>Q{qi+1}</span>
                                  <input className="ocField" aria-label="Question..." value={q.question} placeholder="Question..." style={{flex:1,padding:'6px 10px',border:'1px solid #D1D5DB',borderRadius:4,fontSize:'0.88rem'}}
                                    onChange={e=>{const qs=[...newCourse.quiz_questions];qs[qi]={...qs[qi],question:e.target.value};setNewCourse(p=>({...p,quiz_questions:qs}));}}/>
                                  <button type="button" onClick={()=>setNewCourse(p=>({...p,quiz_questions:p.quiz_questions.filter((_,i)=>i!==qi)}))}
                                    style={{border:'none',background:'#FEE2E2',color:'var(--oc-danger)',borderRadius:4,padding:'4px 8px',cursor:'pointer'}}>Remove</button>
                                </div>
                                {q.options.map((opt,oi)=>(
                                  <div key={oi} style={{display:'flex',gap:8,alignItems:'center',marginBottom:6,paddingLeft:36}}>
                                    <input type="radio" name={'correct-'+qi} checked={q.correct_index===oi} title="Correct answer"
                                      onChange={()=>{const qs=[...newCourse.quiz_questions];qs[qi]={...qs[qi],correct_index:oi};setNewCourse(p=>({...p,quiz_questions:qs}));}}/>
                                    <input className="ocField" value={opt} placeholder={'Option '+(oi+1)} style={{flex:1,padding:'5px 8px',border:'1px solid #D1D5DB',borderRadius:4,fontSize:'0.85rem'}}
                                      onChange={e=>{const qs=[...newCourse.quiz_questions];const opts=[...qs[qi].options];opts[oi]=e.target.value;qs[qi]={...qs[qi],options:opts};setNewCourse(p=>({...p,quiz_questions:qs}));}}/>
                                    {q.correct_index===oi&&<span style={{fontSize: '0.8125rem',color:'#059669',fontWeight:600}}>Correct</span>}
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                        <div style={{display:'flex',gap:10}}>
                          <button type="submit" disabled={savingCourse} className="crmViewBtn" style={{background:'var(--oc-info)',color:'#fff',border:'none'}}>
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
                        {trainingCourses.length===0&&(<tr><td colSpan={7} style={{textAlign:'center',padding:40,color:'var(--oc-muted)'}}>No courses yet. Click New Course to get started.</td></tr>)}
                        {trainingCourses.map(c=>(
                          <tr key={c.id}>
                            <td><strong>{c.title}</strong>{c.description&&<div style={{fontSize: '0.8125rem',color:'var(--oc-muted)',marginTop:2}}>{c.description}</div>}</td>
                            <td><span style={{padding:'3px 10px',borderRadius:20,fontSize: '0.8125rem',fontWeight:600,
                              background:c.course_type==='read_acknowledge'?'#DBEAFE':c.course_type==='read_quiz'?'#EDE9FE':'#D1FAE5',
                              color:c.course_type==='read_acknowledge'?'#1D4ED8':c.course_type==='read_quiz'?'#7C3AED':'#059669'}}>
                              {c.course_type==='read_acknowledge'?'Read & Ack':c.course_type==='read_quiz'?'Quiz':'Ext. Cert'}
                            </span></td>
                            <td>{c.material_url?(<a href={c.material_url} target="_blank" rel="noopener noreferrer" style={{color:'var(--oc-info)',textDecoration:'underline',fontSize:'0.85rem'}}>{c.material_type.toUpperCase()}</a>):<span style={{color:'var(--oc-border)'}}>None</span>}</td>
                            <td>{c.course_type==='read_quiz'?c.pass_mark_pct+'%':'—'}</td>
                            <td>{c.validity_months?c.validity_months+' mo':'No expiry'}</td>
                            <td>{c.is_mandatory?<span style={{color:'var(--oc-danger)',fontWeight: 600}}>Required</span>:<span style={{color:'var(--oc-muted)'}}>Optional</span>}</td>
                            <td><span style={{padding:'3px 10px',borderRadius:20,fontSize: '0.8125rem',fontWeight:600,
                              background:c.is_active?'#D1FAE5':'var(--oc-subtle)',color:c.is_active?'#059669':'var(--oc-muted)'}}>
                              {c.is_active?'Active':'Inactive'}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {!trainingLoading && !trainingLoadError && trainingTab === 'assign' && (
                <div>
                  <div style={{maxWidth:620,marginBottom:32}}>
                    <form onSubmit={handleAssignCourse}>
                      <div style={{marginBottom:16}}>
                        <label style={{fontSize:'0.85rem',fontWeight:600,color:'#374151',display:'block',marginBottom:4}}>Course *</label>
                        <select className="ocField" aria-label="Course *" value={assignCourseId} onChange={e=>setAssignCourseId(e.target.value)} required
                          style={{width:'100%',padding:'10px 12px',border:'1px solid #D1D5DB',borderRadius:8,fontSize:'0.9rem'}}>
                          <option value="">Choose a course</option>
                          {trainingCourses.filter(c=>c.is_active).map(c=><option key={c.id} value={c.id}>{c.title}</option>)}
                        </select>
                      </div>
                      <div style={{marginBottom:16}}>
                        <label style={{fontSize:'0.85rem',fontWeight:600,color:'#374151',display:'block',marginBottom:4}}>Staff Members *</label>
                        <div style={{border:'1px solid #D1D5DB',borderRadius:8,maxHeight:220,overflowY:'auto',padding:8}}>
                          {staff.length===0&&<p style={{color:'var(--oc-muted)',fontSize:'0.85rem',padding:8}}>No staff loaded.</p>}
                          {staff.map(s=>(
                            <label key={s.id} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 8px',cursor:'pointer',borderRadius:4,
                              background:assignStaffIds.includes(s.id)?'var(--oc-info-soft)':'transparent'}}>
                              <input type="checkbox" checked={assignStaffIds.includes(s.id)}
                                onChange={e=>setAssignStaffIds(p=>e.target.checked?[...p,s.id]:p.filter(id=>id!==s.id))}/>
                              <span style={{fontWeight:600,fontSize:'0.88rem'}}>{s.name}</span>
                              <span style={{fontSize: '0.8125rem',color:'var(--oc-muted)'}}>{s.role}</span>
                            </label>
                          ))}
                        </div>
                        {assignStaffIds.length>0&&<p style={{fontSize: '0.8125rem',color:'var(--oc-info)',marginTop:4}}>{assignStaffIds.length} selected</p>}
                      </div>
                      <div style={{marginBottom:20}}>
                        <label style={{fontSize:'0.85rem',fontWeight:600,color:'#374151',display:'block',marginBottom:4}}>Due Date</label>
                        <input className="ocField" aria-label="Due Date" type="date" value={assignDueDate} onChange={e=>setAssignDueDate(e.target.value)}
                          style={{padding:'10px 12px',border:'1px solid #D1D5DB',borderRadius:8,fontSize:'0.9rem'}}/>
                      </div>
                      <button type="submit" disabled={assigning} className="crmViewBtn" style={{background:'#059669',color:'#fff',border:'none',padding:'10px 24px'}}>
                        {assigning?'Assigning...':'Assign to '+(assignStaffIds.length||0)+' Worker(s)'}
                      </button>
                    </form>
                  </div>
                  {trainingAssignments.length>0&&(
                    <div>
                      <h4 style={{fontSize:'0.9rem',fontWeight: 600,color:'var(--oc-text)',marginBottom:12}}>All Assignments ({trainingAssignments.length})</h4>
                      <div className="crmTableWrapper">
                        <table className="crmTable">
                          <thead><tr><th>Course</th><th>Staff</th><th>Due Date</th></tr></thead>
                          <tbody>
                            {trainingAssignments.map(a=>(
                              <tr key={a.id}>
                                <td>{a.training_courses?.title??'Unknown'}</td>
                                <td style={{fontWeight:600}}>{a.staff_name??a.staff_id}</td>
                                <td style={{color:'var(--oc-muted)'}}>{a.due_date??'No due date'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

                            {!trainingLoading && !trainingLoadError && trainingTab === 'external' && (
                <div>
                  <div className="crmPanelHeader" style={{ marginBottom: 16 }}>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--oc-text)' }}>
                        Curated Free External Training Directory ({externalCourses.length})
                      </h3>
                      <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--oc-muted)' }}>
                        Authoritative free courses from the NDIS Commission, NSW Ageing & Disability Commission, and universities.
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
                          <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--oc-muted)' }}>
                            No external training loaded.
                          </td></tr>
                        )}
                        {externalCourses.map(ext => (
                          <tr key={ext.id}>
                            <td>
                              <strong>{ext.title}</strong>
                              <div style={{ fontSize: '0.8125rem', color: 'var(--oc-muted)', marginTop: 2 }}>{ext.description}</div>
                            </td>
                            <td style={{ fontSize: '0.85rem', fontWeight: 600 }}>{ext.provider}</td>
                            <td>
                              <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: '0.8125rem', fontWeight: 600, background: 'var(--oc-subtle)', color: 'var(--oc-secondary)' }}>
                                {ext.category}
                              </span>
                            </td>
                            <td style={{ fontSize: '0.82rem' }}>{ext.target_audience}</td>
                            <td>
                              <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: '0.8125rem', fontWeight: 600, background: '#EDE9FE', color: '#6D28D9' }}>
                                {ext.certificate_type}
                              </span>
                            </td>
                            <td style={{ fontSize: '0.82rem', color: 'var(--oc-muted)' }}>{ext.duration_text || 'Self-paced'}</td>
                            <td>
                              <a
                                href={ext.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="crmViewBtn"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none', fontSize: '0.8125rem' }}
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

              {!trainingLoading && !trainingLoadError && trainingTab === 'report' && (
                <div>
                  <div className="crmTableWrapper" style={{overflowX:'auto'}}>
                    <table className="crmTable" style={{minWidth:900}}>
                      <thead><tr>
                        <th>Staff Member</th>
                        {trainingCourses.filter(c=>c.is_active).map(c=>(
                          <th key={c.id} style={{fontSize: '0.8125rem',textAlign:'center'}}>
                            {c.title}{c.is_mandatory&&<span style={{color:'var(--oc-danger)'}}>*</span>}
                          </th>
                        ))}
                        <th>Mandatory %</th>
                      </tr></thead>
                      <tbody>
                        {staff.length===0&&<tr><td colSpan={99} style={{textAlign:'center',padding:40,color:'var(--oc-muted)'}}>No staff records.</td></tr>}
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
                              <td><strong style={{fontSize:'0.88rem'}}>{s.name}</strong><div style={{fontSize: '0.8125rem',color:'var(--oc-muted)'}}>{s.role}</div></td>
                              {ac.map(c=>{
                                const a=trainingAssignments.find(x=>x.course_id===c.id&&x.staff_id===s.id);
                                if(!a) return <td key={c.id} style={{textAlign:'center'}}><span style={{color:'var(--oc-border)',fontSize: '0.8125rem'}}>—</span></td>;
                                const st=getTrainingStatus(s.id,c.id,a.due_date);
                                return <td key={c.id} style={{textAlign:'center'}}>
                                  <span style={{padding:'2px 8px',borderRadius:20,fontSize: '0.8125rem',fontWeight:600,background:st.bg,color:st.color}}>{st.label}</span>
                                </td>;
                              })}
                              <td>
                                <div style={{display:'flex',alignItems:'center',gap:8}}>
                                  <div style={{flex:1,height:8,background:'var(--oc-subtle)',borderRadius:4,overflow:'hidden',minWidth:60}}>
                                    <div style={{width:pct+'%',height:'100%',borderRadius:4,background:pct===100?'#059669':pct>=60?'var(--oc-warning)':'var(--oc-danger)'}}/>
                                  </div>
                                  <span style={{fontSize:'0.82rem',fontWeight: 600,minWidth:36,color:pct===100?'#059669':pct>=60?'var(--oc-warning)':'var(--oc-danger)'}}>{pct}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <p style={{fontSize: '0.8125rem',color:'var(--oc-muted)',marginTop:8}}>* Mandatory. Compliance % counts mandatory courses only.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 8: SETTINGS */}
          {tab === 'settings' && (
        <div>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ margin: '0 0 4px', fontSize: '1.4rem', fontWeight: 600, color: 'var(--oc-text)', letterSpacing: '-0.02em' }}>
              Settings & Preferences
            </h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--oc-muted)' }}>
              Manage your administrator account, provider legal configuration, and system preferences.
            </p>
          </div>

          {/* Organisation Readiness & Legal Configuration Panel */}
          <div className="vsCard" style={{ marginBottom: 24, padding: '24px 24px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShieldCheck size={20} style={{ color: '#2563eb' }} />
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: 'var(--oc-text)' }}>
                    Organisation Governance &amp; Operational Readiness
                  </h3>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--oc-muted)' }}>
                  Authorised regulatory posture, legal counterparty identity, and operational pre-go-live status
                </p>
              </div>
              <button
                type="button"
                onClick={() => { loadProviderConfig(); loadInsurances(); notify('Refreshed governance configuration.'); }}
                className="vsBtnOutline"
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: '0.8125rem' }}
              >
                <RefreshCw size={14} className={providerConfigLoading ? 'spin' : ''} />
                <span>Refresh Status</span>
              </button>
            </div>

            {/* 8-Dimension Readiness Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 12,
              marginBottom: 20
            }}>
              {/* 1. Business Name */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Trading Name</span>
                  <span style={{ fontSize: '0.75rem', background: '#dcfce7', color: '#15803d', fontWeight: 600, padding: '2px 8px', borderRadius: 12 }}>Configured</span>
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--oc-text)' }}>Opus Care Support Services</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>Registered business name operated as a sole trader</div>
              </div>

              {/* 2. ABN */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Australian Business No.</span>
                  <span style={{ fontSize: '0.75rem', background: '#dcfce7', color: '#15803d', fontWeight: 600, padding: '2px 8px', borderRadius: 12 }}>Owner confirmed</span>
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--oc-text)', fontFamily: 'monospace' }}>41 267 197 576</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>Authorised sole trader ABN (configured by owner)</div>
              </div>

              {/* 3. GST Status */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>GST Registration</span>
                  <span style={{ fontSize: '0.75rem', background: '#dcfce7', color: '#15803d', fontWeight: 600, padding: '2px 8px', borderRadius: 12 }}>Configured</span>
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--oc-text)' }}>Not Registered for GST</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>0% GST · Standard &quot;INVOICE&quot; only</div>
              </div>

              {/* 4. NDIS Registration */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>NDIS Status</span>
                  <span style={{ fontSize: '0.75rem', background: '#dcfce7', color: '#15803d', fontWeight: 600, padding: '2px 8px', borderRadius: 12 }}>Configured</span>
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--oc-text)' }}>Unregistered Provider</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>Plan-Managed &amp; Self-Managed only</div>
              </div>

              {/* 5. Business Structure */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Business Structure</span>
                  <span style={{ fontSize: '0.75rem', background: '#dcfce7', color: '#15803d', fontWeight: 600, padding: '2px 8px', borderRadius: 12 }}>Configured</span>
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--oc-text)' }}>Sole Trader</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>Non-incorporated entity · ACN N/A</div>
              </div>

              {/* 6. Proprietor Legal Name */}
              <div style={{
                background: providerConfig?.proprietor_legal_name ? '#f8fafc' : '#fffbeb',
                border: providerConfig?.proprietor_legal_name ? '1px solid #e2e8f0' : '1px solid #fde68a',
                borderRadius: 8,
                padding: '12px 14px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Proprietor Legal Name</span>
                  {providerConfig?.proprietor_legal_name ? (
                    <span style={{ fontSize: '0.75rem', background: '#dcfce7', color: '#15803d', fontWeight: 600, padding: '2px 8px', borderRadius: 12 }}>Configured</span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', background: '#fef3c7', color: '#b45309', fontWeight: 600, padding: '2px 8px', borderRadius: 12 }}>Pending</span>
                  )}
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: providerConfig?.proprietor_legal_name ? 'var(--oc-text)' : '#b45309' }}>
                  {providerConfig?.proprietor_legal_name || 'Pending Configuration'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                  {providerConfig?.proprietor_legal_name ? 'Active legal counterparty' : 'Required before executing formal agreements'}
                </div>
              </div>

              {/* 7. Bank & Remittance */}
              <div style={{
                background: providerConfig?.bank_account_number ? '#f8fafc' : '#fffbeb',
                border: providerConfig?.bank_account_number ? '1px solid #e2e8f0' : '1px solid #fde68a',
                borderRadius: 8,
                padding: '12px 14px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Remittance Account</span>
                  {providerConfig?.bank_account_number ? (
                    <span style={{ fontSize: '0.75rem', background: '#dcfce7', color: '#15803d', fontWeight: 600, padding: '2px 8px', borderRadius: 12 }}>Configured</span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', background: '#fef3c7', color: '#b45309', fontWeight: 600, padding: '2px 8px', borderRadius: 12 }}>Pending</span>
                  )}
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: providerConfig?.bank_account_number ? 'var(--oc-text)' : '#b45309' }}>
                  {providerConfig?.bank_account_number ? `${providerConfig.bank_name || 'Configured Bank'} (BSB ${providerConfig.bank_bsb})` : 'Pending Configuration'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                  {providerConfig?.bank_account_number ? 'Active disbursement account' : 'Required before external invoice generation'}
                </div>
              </div>

              {/* 8. Insurance */}
              <div style={{
                background: insurances.length > 0 ? '#f8fafc' : '#fffbeb',
                border: insurances.length > 0 ? '1px solid #e2e8f0' : '1px solid #fde68a',
                borderRadius: 8,
                padding: '12px 14px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Insurance Register</span>
                  {insurances.length > 0 ? (
                    <span style={{ fontSize: '0.75rem', background: '#dcfce7', color: '#15803d', fontWeight: 600, padding: '2px 8px', borderRadius: 12 }}>{insurances.length} Active</span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', background: '#fef3c7', color: '#b45309', fontWeight: 600, padding: '2px 8px', borderRadius: 12 }}>Pending</span>
                  )}
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: insurances.length > 0 ? 'var(--oc-text)' : '#b45309' }}>
                  {insurances.length > 0 ? `${insurances.length} Policies Registered` : 'No Policies Registered'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                  Public Liability &amp; Professional Indemnity required
                </div>
              </div>
            </div>

            {/* Proprietor Legal Name Configuration Box */}
            <div style={{ background: '#f1f5f9', borderRadius: 8, padding: '14px 16px', border: '1px solid #cbd5e1' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 280 }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--oc-text)', marginBottom: 4 }}>
                    Proprietor Full Legal Name (Sole Trader)
                  </label>
                  <p style={{ margin: '0 0 8px', fontSize: '0.75rem', color: '#64748b' }}>
                    By Australian sole trader law, formal agreements must identify: <code>[Proprietor Full Legal Name] trading as Opus Care Support Services</code>.
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      placeholder="e.g. Full Legal Name of Proprietor"
                      value={proprietorInput}
                      onChange={(e) => setProprietorInput(e.target.value)}
                      className="crmInput"
                      style={{ flex: 1, padding: '7px 12px', fontSize: '0.85rem' }}
                    />
                    <button
                      type="button"
                      onClick={handleSaveProprietor}
                      disabled={proprietorSaving || !proprietorInput.trim() || proprietorInput.trim() === providerConfig?.proprietor_legal_name}
                      className="vsBtnBlack"
                      style={{ padding: '7px 16px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
                    >
                      {proprietorSaving ? 'Saving...' : 'Save Legal Name'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Organisation Insurance Register Section */}
          <div className="vsCard" style={{ marginBottom: 24, padding: '24px 24px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileSpreadsheet size={20} style={{ color: '#059669' }} />
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: 'var(--oc-text)' }}>
                    Organisation Insurance Register
                  </h3>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--oc-muted)' }}>
                  Statutory and operational risk insurance policies covering provider operations, worker liability, and transport.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddInsurance(true)}
                className="vsBtnBlack"
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', fontSize: '0.8125rem' }}
              >
                <Plus size={14} />
                <span>Register Policy</span>
              </button>
            </div>

            {insurancesLoading ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--oc-muted)', fontSize: '0.85rem' }}>
                Loading registered insurance policies...
              </div>
            ) : insurances.length === 0 ? (
              <div style={{
                padding: '24px 16px',
                textAlign: 'center',
                background: '#f8fafc',
                border: '1px dashed #cbd5e1',
                borderRadius: 8
              }}>
                <Shield size={32} style={{ color: '#94a3b8', margin: '0 auto 8px' }} />
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--oc-text)' }}>No Insurance Policies Registered</div>
                <p style={{ margin: '4px 0 12px', fontSize: '0.8rem', color: '#64748b', maxWidth: 460, marginLeft: 'auto', marginRight: 'auto' }}>
                  Opus Care operations require verified Public &amp; Products Liability ($10M+) and Professional Indemnity policies prior to participant service delivery.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddInsurance(true)}
                  className="vsBtnOutline"
                  style={{ padding: '6px 14px', fontSize: '0.8125rem' }}
                >
                  Register First Policy
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="crmTable" style={{ width: '100%', fontSize: '0.82rem' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '10px 12px' }}>Policy Type</th>
                      <th style={{ textAlign: 'left', padding: '10px 12px' }}>Insurer</th>
                      <th style={{ textAlign: 'left', padding: '10px 12px' }}>Policy Number</th>
                      <th style={{ textAlign: 'right', padding: '10px 12px' }}>Coverage Limit</th>
                      <th style={{ textAlign: 'left', padding: '10px 12px' }}>Expiry Date</th>
                      <th style={{ textAlign: 'center', padding: '10px 12px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {insurances.map((ins: any) => {
                      const isExpired = ins.isExpired;
                      const isExpiringSoon = ins.isExpiringSoon;
                      return (
                        <tr key={ins.id}>
                          <td style={{ padding: '10px 12px', fontWeight: 600 }}>{ins.policyType}</td>
                          <td style={{ padding: '10px 12px' }}>{ins.insurer}</td>
                          <td style={{ padding: '10px 12px', fontFamily: 'monospace' }}>{ins.policyNumber}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                            {ins.coverageAmount ? `$${Number(ins.coverageAmount).toLocaleString()} AUD` : '—'}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span>{ins.expiryDate}</span>
                            {isExpiringSoon && (
                              <span style={{ marginLeft: 6, fontSize: '0.72rem', background: '#fef3c7', color: '#b45309', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>
                                Expiring soon
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            {isExpired ? (
                              <span style={{ fontSize: '0.75rem', background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>Expired</span>
                            ) : (
                              <span style={{ fontSize: '0.75rem', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>Active</span>
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

          {/* 3-Column Bento Grid matching VibeStore Screen 4 */}
          <div className="vsSettingsGrid">
            {/* Column 1: Profile Card & Plan Card */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Profile Card (VibeStore Large Avatar Card) */}
              <div className="vsCard" style={{ alignItems: 'center', textAlign: 'center', padding: '28px 20px' }}>
                <div
                  style={{
                    width: 88,
                    height: 88,
                    borderRadius: '50%',
                    background: 'var(--oc-text)',
                    color: 'var(--oc-surface)',
                    fontSize: '2rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.2)',
                    marginBottom: 14,
                  }}
                >
                  OA
                </div>
                <h3 style={{ margin: '0 0 2px', fontSize: '1.2rem', fontWeight: 600, color: 'var(--oc-text)' }}>
                  Opus Admin
                </h3>
                <span style={{ fontSize: '0.8125rem', color: 'var(--oc-muted)', marginBottom: 10 }}>
                  support@opuscare.com.au
                </span>
                <span className="vsTagCrm" style={{ marginBottom: 18 }}>
                  Administrator
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                  <button
                    type="button"
                    onClick={() => notify('Admin Key is managed via ADMIN_ACCESS_KEY environment secret.')}
                    className="vsBtnBlack"
                    style={{ flex: 1, padding: '7px 12px', fontSize: '0.8125rem' }}
                  >
                    Change Key
                  </button>
                  <button
                    type="button"
                    onClick={() => notify('Activity history is available to authorised administrators.')}
                    className="vsBtnOutline"
                    style={{ flex: 1, padding: '7px 12px', fontSize: '0.8125rem' }}
                  >
                    Export Log
                  </button>
                </div>
              </div>

              {/* Provider Legal Entity Card (Screen 4 Plan Box) */}
              <div className="vsHeroCard lavender">
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  UNREGISTERED NDIS PROVIDER
                </span>
                <h4 style={{ margin: '4px 0 2px', fontSize: '0.98rem', fontWeight: 600, color: 'var(--oc-text)' }}>
                  Opus Care Support Services
                </h4>
                <p style={{ margin: '0 0 4px', fontSize: '0.8125rem', color: 'var(--oc-secondary)' }}>
                  ABN: 41 267 197 576 &bull; Sole Trader &bull; GST Not Registered
                </p>
                <p style={{ margin: '0 0 10px', fontSize: '0.75rem', color: 'var(--oc-muted)' }}>
                  {providerConfig?.proprietor_legal_name ? `Proprietor: ${providerConfig.proprietor_legal_name}` : 'Proprietor name pending configuration'}
                </p>
                <button
                  type="button"
                  onClick={() => setShowAgreementGenerator(true)}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#4F46E5', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                >
                  Create service agreement &rarr;
                </button>
              </div>
            </div>

            {/* Column 2: Account & NDIS Arrangements */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Account Details Bento Card */}
              <CrmBentoPane
                title="Account & Security"
                subtitle="Your credentials & administrative access"
                noPadding
              >
                <CrmSettingRow
                  title="Provider Legal Configuration"
                  description="Trading name, ABN, ACN & registered address"
                  icon={<Shield size={18} />}
                  tint="indigo"
                  onClick={() => notify('Provider Legal Configuration is loaded dynamically from public.provider_config.')}
                />
                <CrmSettingRow
                  title="Password & Security"
                  description="7-day HttpOnly cookie session active"
                  icon={<Lock size={18} />}
                  tint="teal"
                  onClick={() => notify('Sign out when you finish using this device.')}
                />
                <CrmSettingRow
                  title="Private Document Vault"
                  description="Document storage for authorised users"
                  icon={<FolderLock size={18} />}
                  tint="sky"
                  badge="Encrypted"
                />
              </CrmBentoPane>

              {/* NDIS Arrangements Bento Card */}
              <CrmBentoPane
                title="NDIS Pricing Reference"
                subtitle="Support catalogue & hourly price caps"
                noPadding
              >
                <CrmSettingRow
                  title="NDIA Arrangements 2025/2026"
                  description="Current national price limits reference active"
                  icon={<Sparkles size={18} />}
                  tint="amber"
                  badge="Active"
                />
                <CrmSettingRow
                  title="Cancellation Policy Rules"
                  description="Customizable cancellation windows (2 to 7 days)"
                  icon={<Clock size={18} />}
                  tint="emerald"
                />
              </CrmBentoPane>
            </div>

            {/* Column 3: Preferences & Diagnostics */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Preferences Bento Card */}
              <CrmBentoPane
                title="Preferences"
                subtitle="Appearance & notifications"
                noPadding
              >
                <CrmSettingRow
                  title="Dark Mode"
                  description="Theme appearance"
                  icon={<Sparkles size={18} />}
                  tint="slate"
                  toggle={{
                    checked: false,
                    onChange: () => notify('Dark mode preference will be persisted.'),
                  }}
                />
                <CrmSettingRow
                  title="Language & Region"
                  description="English (Australia - NDIS NSW)"
                  icon={<MapPin size={18} />}
                  tint="slate"
                />
              </CrmBentoPane>

              {/* About & Sign Out Bento Card */}
              <CrmBentoPane
                title="System Diagnostics"
                subtitle="System information and security"
                noPadding
              >
                <CrmSettingRow
                  title="About Opus Care CRM"
                  description="Opus Care operations workspace"
                  icon={<Sparkles size={18} />}
                  tint="indigo"
                  badge="Opus Care"
                />
                <CrmSettingRow
                  title="System access"
                  description="Use your account to access the workspace"
                  icon={<Activity size={18} />}
                  tint="emerald"
                  badge="Live"
                />
                <CrmSettingRow
                  title="Sign Out"
                  description="Sign out of your operations admin account"
                  icon={<LogOut size={18} />}
                  isDestructive
                  onClick={handleLogout}
                />
              </CrmBentoPane>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL / DRAWER (Referral, Participant, or Staff) */}
      {(selectedReferral || selectedParticipant || selectedStaff) && (
        <div className="crmModalOverlay ocRecordOverlay" onClick={() => {
          setSelectedReferral(null);
          setSelectedParticipant(null);
          setSelectedStaff(null);
        }}>
          <DialogPanel onClose={() => {
          setSelectedReferral(null);
          setSelectedParticipant(null);
          setSelectedStaff(null);
        }} label="Record details" className="crmModalBox ocRecordDrawer" onClick={(e) => e.stopPropagation()}>
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
                aria-label="Close dialog" className="crmModalClose"
              >
                &times;
              </button>
            </div>

            {/* Modal Drawer Tabs */}
            <div className="ocRecordTabs" aria-label="Record views">
              <button
                onClick={() => setDrawerTab('overview')}
                style={{
                  padding: '12px 0',
                  border: 'none',
                  background: 'none',
                  borderBottom: `2px solid ${drawerTab === 'overview' ? 'var(--oc-info)' : 'transparent'}`,
                  color: drawerTab === 'overview' ? 'var(--oc-info)' : 'var(--oc-muted)',
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
                  borderBottom: `2px solid ${drawerTab === 'documents' ? 'var(--oc-info)' : 'transparent'}`,
                  color: drawerTab === 'documents' ? 'var(--oc-info)' : 'var(--oc-muted)',
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

              {selectedParticipant && (
                <button
                  onClick={() => setDrawerTab('contacts')}
                  style={{
                    padding: '12px 0',
                    border: 'none',
                    background: 'none',
                    borderBottom: `2px solid ${drawerTab === 'contacts' ? 'var(--oc-info)' : 'transparent'}`,
                    color: drawerTab === 'contacts' ? 'var(--oc-info)' : 'var(--oc-muted)',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Users size={15} />
                  <span>Contacts ({participantContacts.length})</span>
                </button>
              )}

              {(selectedReferral || selectedParticipant || selectedStaff) && (
                <button
                  onClick={() => setDrawerTab('timeline')}
                  style={{
                    padding: '12px 0',
                    border: 'none',
                    background: 'none',
                    borderBottom: `2px solid ${drawerTab === 'timeline' ? 'var(--oc-info)' : 'transparent'}`,
                    color: drawerTab === 'timeline' ? 'var(--oc-info)' : 'var(--oc-muted)',
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
                            <a href={`tel:${selectedReferral.phone}`} style={{ color: 'var(--oc-info)', textDecoration: 'none' }}>
                              {selectedReferral.phone}
                            </a>
                            <br />
                            <a href={`mailto:${selectedReferral.email}`} style={{ color: 'var(--oc-muted)', fontSize: '0.85rem' }}>
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
                        <div style={{ marginTop: 20, padding: 16, background: 'var(--oc-success-soft)', border: '1px solid #BBF7D0', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <strong style={{ color: 'var(--oc-success)', fontSize: '0.9rem' }}>Enrol as Active Participant?</strong>
                            <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: '#15803D' }}>
                              Creates official Participant record and links all documents & history.
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
                      <div className="fullCol" style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--oc-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <strong style={{ fontSize: '0.88rem', color: 'var(--oc-accent)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Shield size={15} /> Emergency & Worker Instructions
                          </strong>
                          <button
                            onClick={() => setShowEditEmergency(!showEditEmergency)}
                            style={{ background: 'none', border: '1px solid var(--oc-border)', borderRadius: 6, padding: '3px 8px', fontSize: '0.8125rem', color: '#374151', cursor: 'pointer' }}
                          >
                            {showEditEmergency ? 'Close' : 'Edit'}
                          </button>
                        </div>
                        {showEditEmergency ? (
                          <div className="ocFormGrid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: 'var(--oc-background)', padding: 12, borderRadius: 8 }}>
                            <div>
                              <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Emergency Contact Name</label>
                              <input className="ocField"
                                type="text"
                                defaultValue={selectedParticipant.emergencyContactName || ''}
                                id="edit_emergency_name"
                                style={{ width: '100%', border: '1px solid var(--oc-border)', borderRadius: 6, padding: '6px 8px', fontSize: '0.82rem', boxSizing: 'border-box' }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Emergency Contact Phone</label>
                              <input className="ocField"
                                type="text"
                                defaultValue={selectedParticipant.emergencyContactPhone || ''}
                                id="edit_emergency_phone"
                                style={{ width: '100%', border: '1px solid var(--oc-border)', borderRadius: 6, padding: '6px 8px', fontSize: '0.82rem', boxSizing: 'border-box' }}
                              />
                            </div>
                            <div className="fullCol">
                              <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Medical Alert / Allergies</label>
                              <input className="ocField"
                                type="text"
                                defaultValue={selectedParticipant.medicalAlert || ''}
                                id="edit_medical_alert"
                                placeholder="e.g. Severe peanut allergy - carries EpiPen"
                                style={{ width: '100%', border: '1px solid var(--oc-border)', borderRadius: 6, padding: '6px 8px', fontSize: '0.82rem', boxSizing: 'border-box' }}
                              />
                            </div>
                            <div className="fullCol">
                              <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Worker Instructions</label>
                              <textarea className="ocField"
                                defaultValue={selectedParticipant.workerInstructions || ''}
                                id="edit_worker_instructions"
                                rows={2}
                                placeholder="e.g. Ring bell twice, prompt to take morning medication"
                                style={{ width: '100%', border: '1px solid var(--oc-border)', borderRadius: 6, padding: '6px 8px', fontSize: '0.82rem', resize: 'vertical', boxSizing: 'border-box' }}
                              />
                            </div>
                            <div className="fullCol">
                              <button
                                onClick={async () => {
                                  const name = (document.getElementById('edit_emergency_name') as HTMLInputElement)?.value;
                                  const phone = (document.getElementById('edit_emergency_phone') as HTMLInputElement)?.value;
                                  const alert = (document.getElementById('edit_medical_alert') as HTMLInputElement)?.value;
                                  const instructions = (document.getElementById('edit_worker_instructions') as HTMLTextAreaElement)?.value;
                                  try {
                                    const res = await fetch('/api/crm/participants', {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json', 'x-admin-key': 'OpusCare2025!Admin' },
                                      body: JSON.stringify({
                                        id: selectedParticipant.id,
                                        emergencyContactName: name,
                                        emergencyContactPhone: phone,
                                        medicalAlert: alert,
                                        workerInstructions: instructions,
                                      }),
                                    });
                                    if (res.ok) {
                                      setSelectedParticipant(prev => prev ? ({
                                        ...prev,
                                        emergencyContactName: name,
                                        emergencyContactPhone: phone,
                                        medicalAlert: alert,
                                        workerInstructions: instructions,
                                      }) : null);
                                      setShowEditEmergency(false);
                                      setStatusNotice('Emergency information saved successfully.');
                                    }
                                  } catch {
                                    setStatusNotice('Failed to save emergency info.');
                                  }
                                }}
                                style={{ background: 'var(--oc-accent)', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                              >
                                Save Emergency Info
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="ocFormGrid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.83rem', color: '#374151' }}>
                            <div>
                              <span style={{ color: 'var(--oc-muted)', fontSize: '0.8125rem', display: 'block' }}>Emergency Contact</span>
                              <strong>{selectedParticipant.emergencyContactName || 'Not recorded'}</strong>
                              {selectedParticipant.emergencyContactPhone && (
                                <span style={{ display: 'block', color: 'var(--oc-info)' }}>{selectedParticipant.emergencyContactPhone}</span>
                              )}
                            </div>
                            <div>
                              <span style={{ color: 'var(--oc-muted)', fontSize: '0.8125rem', display: 'block' }}>Medical Alert</span>
                              <span style={{ color: selectedParticipant.medicalAlert ? 'var(--oc-danger)' : 'var(--oc-muted)', fontWeight: selectedParticipant.medicalAlert ? 600 : 400 }}>
                                {selectedParticipant.medicalAlert || 'None'}
                              </span>
                            </div>
                            {selectedParticipant.workerInstructions && (
                              <div className="fullCol" style={{ background: 'var(--oc-warning-soft)', padding: 8, borderRadius: 6, border: '1px solid #FEF3C7' }}>
                                <span style={{ color: '#B45309', fontSize: '0.8125rem', fontWeight: 600, display: 'block' }}>Worker Instructions</span>
                                {selectedParticipant.workerInstructions}
                              </div>
                            )}
                          </div>
                        )}
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
                        <p><a href={`tel:${selectedStaff.phone}`} style={{ color: 'var(--oc-info)' }}>{selectedStaff.phone}</a></p>
                      </div>
                      <div>
                        <label>Email</label>
                        <p><a href={`mailto:${selectedStaff.email}`} style={{ color: 'var(--oc-muted)' }}>{selectedStaff.email}</a></p>
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
                  <div style={{ marginBottom: 20, padding: 16, background: 'var(--oc-background)', border: '1px solid #EEF2F6', borderRadius: 10 }}>
                    <h4 style={{ margin: '0 0 8px', fontSize: '0.92rem', color: 'var(--oc-text)' }}>
                      Upload document
                    </h4>
                    <div className="ocFormGrid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--oc-muted)', marginBottom: 4 }}>Document Category</label>
                        <select aria-label="Document Category"
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
                        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--oc-muted)', marginBottom: 4 }}>Expiry Date (if applicable)</label>
                        <input aria-label="Expiry Date (if applicable)"
                          type="date"
                          value={uploadExpiry}
                          onChange={(e) => setUploadExpiry(e.target.value)}
                          className="crmSearchInput"
                          style={{ padding: '7px 10px' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <input className="ocField"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        disabled={uploadingDoc}
                        style={{ fontSize: '0.85rem' }}
                      />
                      {uploadingDoc && (
                        <span style={{ fontSize: '0.8125rem', color: 'var(--oc-info)', fontWeight: 600 }}>
                          Uploading...
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Document List */}
                  {docsLoading ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: 'var(--oc-muted)' }}>
                      <RefreshCw size={20} className="spin" style={{ margin: '0 auto 8px', display: 'block' }} />
                      <span>Loading vault documents...</span>
                    </div>
                  ) : documents.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: 'var(--oc-muted)', fontSize: '0.85rem' }}>
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
                            background: 'var(--oc-surface)',
                            border: '1px solid #EEF2F6',
                            borderRadius: 8
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <FileText size={16} style={{ color: 'var(--oc-info)' }} />
                              <strong style={{ fontSize: '0.88rem', color: 'var(--oc-text)' }}>{doc.file_name}</strong>
                              <span className="refIdTag" style={{ fontSize: '0.8125rem' }}>{doc.category}</span>
                            </div>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--oc-muted)', marginTop: 4 }}>
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

              {/* DRAWER TAB: PARTICIPANT CONTACTS */}
              {drawerTab === 'contacts' && selectedParticipant && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--oc-text)' }}>
                        Contacts & Key Stakeholders
                      </h4>
                      <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--oc-muted)' }}>
                        Nominees, family members, plan managers, and emergency contacts linked to {selectedParticipant.name}.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddContactForm(!showAddContactForm)}
                      className="headerCtaBtn"
                      style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <Plus size={14} />
                      <span>{showAddContactForm ? 'Cancel' : 'Add Contact'}</span>
                    </button>
                  </div>

                  {showAddContactForm && (
                    <form onSubmit={handleAddContact} style={{
                      background: 'var(--oc-background)',
                      border: '1px solid var(--oc-border)',
                      borderRadius: 10,
                      padding: 16,
                      marginBottom: 20
                    }}>
                      <h5 style={{ margin: '0 0 12px', fontSize: '0.88rem', fontWeight: 600 }}>New Contact Details</h5>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--oc-muted)', marginBottom: 4 }}>Full Name *</label>
                          <input
                            type="text"
                            required
                            value={newContact.fullName}
                            onChange={(e) => setNewContact({ ...newContact, fullName: e.target.value })}
                            placeholder="e.g. Jane Doe"
                            className="crmSearchInput"
                            style={{ width: '100%', fontSize: '0.85rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--oc-muted)', marginBottom: 4 }}>Role / Type</label>
                          <select
                            value={newContact.role}
                            onChange={(e) => setNewContact({ ...newContact, role: e.target.value })}
                            className="crmSelect"
                            style={{ width: '100%', fontSize: '0.85rem' }}
                          >
                            <option value="Nominee / Representative">Nominee / Representative</option>
                            <option value="Family / Guardian">Family / Guardian</option>
                            <option value="Support Coordinator">Support Coordinator</option>
                            <option value="Plan Manager">Plan Manager</option>
                            <option value="Allied Health Professional">Allied Health Professional</option>
                            <option value="Emergency Contact">Emergency Contact</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--oc-muted)', marginBottom: 4 }}>Relationship to Participant</label>
                          <input
                            type="text"
                            value={newContact.relationshipLabel}
                            onChange={(e) => setNewContact({ ...newContact, relationshipLabel: e.target.value })}
                            placeholder="e.g. Mother, Legal Guardian"
                            className="crmSearchInput"
                            style={{ width: '100%', fontSize: '0.85rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--oc-muted)', marginBottom: 4 }}>Organization (Optional)</label>
                          <input
                            type="text"
                            value={newContact.organizationName}
                            onChange={(e) => setNewContact({ ...newContact, organizationName: e.target.value })}
                            placeholder="e.g. Support Services Co"
                            className="crmSearchInput"
                            style={{ width: '100%', fontSize: '0.85rem' }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--oc-muted)', marginBottom: 4 }}>Phone Number</label>
                          <input
                            type="tel"
                            value={newContact.phone}
                            onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                            placeholder="0400 000 000"
                            className="crmSearchInput"
                            style={{ width: '100%', fontSize: '0.85rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--oc-muted)', marginBottom: 4 }}>Email Address</label>
                          <input
                            type="email"
                            value={newContact.email}
                            onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                            placeholder="contact@email.com.au"
                            className="crmSearchInput"
                            style={{ width: '100%', fontSize: '0.85rem' }}
                          />
                        </div>
                      </div>

                      <div style={{ marginBottom: 14 }}>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--oc-muted)', marginBottom: 4 }}>Notes / Permissions</label>
                        <textarea
                          rows={2}
                          value={newContact.notes}
                          onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                          placeholder="e.g. Authorized to discuss funding and service schedules."
                          className="crmSearchInput"
                          style={{ width: '100%', fontSize: '0.85rem', resize: 'vertical' }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => setShowAddContactForm(false)}
                          className="crmSecondaryBtn"
                          style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={contactSaving || !newContact.fullName.trim()}
                          className="headerCtaBtn"
                          style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                        >
                          {contactSaving ? 'Saving...' : 'Save Contact'}
                        </button>
                      </div>
                    </form>
                  )}

                  {contactsLoading ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: 'var(--oc-muted)' }}>
                      <RefreshCw size={20} className="spin" style={{ margin: '0 auto 8px', display: 'block' }} />
                      <span>Loading participant contacts...</span>
                    </div>
                  ) : participantContacts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: 'var(--oc-muted)', fontSize: '0.85rem' }}>
                      No contacts linked yet. Click &quot;Add Contact&quot; above to register a nominee or stakeholder.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {participantContacts.map((c: any) => (
                        <div
                          key={c.id}
                          style={{
                            padding: '14px 16px',
                            background: 'var(--oc-background)',
                            border: '1px solid var(--oc-border)',
                            borderRadius: 10,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: 12
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                              <strong style={{ fontSize: '0.9rem', color: 'var(--oc-text)' }}>{c.fullName}</strong>
                              <span style={{
                                fontSize: '0.75rem',
                                padding: '2px 8px',
                                borderRadius: 12,
                                background: '#E0F2FE',
                                color: 'var(--oc-info)',
                                fontWeight: 600
                              }}>
                                {c.role}
                              </span>
                              {c.relationshipLabel && (
                                <span style={{
                                  fontSize: '0.75rem',
                                  padding: '2px 8px',
                                  borderRadius: 12,
                                  background: 'var(--oc-surface)',
                                  border: '1px solid var(--oc-border)',
                                  color: 'var(--oc-secondary)',
                                  fontWeight: 500
                                }}>
                                  {c.relationshipLabel}
                                </span>
                              )}
                              {c.organizationName && (
                                <span style={{ fontSize: '0.8rem', color: 'var(--oc-muted)' }}>
                                  • {c.organizationName}
                                </span>
                              )}
                            </div>

                            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--oc-secondary)', marginTop: 6 }}>
                              {c.phone && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  <Phone size={13} style={{ color: 'var(--oc-info)' }} />
                                  <a href={`tel:${c.phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>{c.phone}</a>
                                </span>
                              )}
                              {c.email && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  <Mail size={13} style={{ color: 'var(--oc-info)' }} />
                                  <a href={`mailto:${c.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>{c.email}</a>
                                </span>
                              )}
                            </div>

                            {c.notes && (
                              <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: 'var(--oc-muted)', lineHeight: 1.4 }}>
                                {c.notes}
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteContact(c.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--oc-muted)',
                              cursor: 'pointer',
                              padding: 4,
                              borderRadius: 4
                            }}
                            title="Remove contact"
                          >
                            <Trash2 size={16} />
                          </button>
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
                      <select aria-label="Internal Note"
                        value={newNoteType}
                        onChange={(e) => setNewNoteType(e.target.value as any)}
                        className="crmSelect"
                        style={{ fontSize: '0.8125rem', padding: '6px 10px' }}
                      >
                        <option value="note">Internal Note</option>
                        <option value="call">Phone Call</option>
                        <option value="email">Email</option>
                        <option value="meeting">Meeting</option>
                      </select>
                    </div>
                    <textarea aria-label="Write an operational note or log contact..."
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
                    <div style={{ textAlign: 'center', padding: '30px', color: 'var(--oc-muted)' }}>
                      <RefreshCw size={20} className="spin" style={{ margin: '0 auto 8px', display: 'block' }} />
                      <span>Loading timeline history...</span>
                    </div>
                  ) : activities.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: 'var(--oc-muted)', fontSize: '0.85rem' }}>
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
                            background: 'var(--oc-background)',
                            border: '1px solid #EEF2F6',
                            borderRadius: 8
                          }}
                        >
                          <div style={{ marginTop: 2 }}>
                            {act.activity_type === 'call' && <Phone size={16} style={{ color: 'var(--oc-info)' }} />}
                            {act.activity_type === 'email' && <Mail size={16} style={{ color: 'var(--oc-warning)' }} />}
                            {act.activity_type === 'meeting' && <Calendar size={16} style={{ color: '#10B981' }} />}
                            {act.activity_type === 'note' && <MessageSquare size={16} style={{ color: '#6D28D9' }} />}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <strong style={{ fontSize: '0.85rem', color: 'var(--oc-text)' }}>{act.title}</strong>
                              <span style={{ fontSize: '0.8125rem', color: 'var(--oc-muted)' }}>
                                {new Date(act.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--oc-secondary)', lineHeight: 1.5 }}>
                              {act.description}
                            </p>
                            <span style={{ fontSize: '0.8125rem', color: 'var(--oc-muted)', display: 'inline-block', marginTop: 4 }}>
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
          </DialogPanel>
        </div>
      )}
      {/* SUITABILITY ASSESSMENT MODAL (GOVERNANCE G1) */}
      {selectedReferralForSuitability && (
        <SuitabilityAssessmentModal
          isOpen={Boolean(selectedReferralForSuitability)}
          referral={selectedReferralForSuitability}
          onClose={() => setSelectedReferralForSuitability(null)}
          onSuccess={(assessment) => {
            notify(`Suitability assessment recorded (${assessment.outcome}). Advancing to onboarding.`);
            loadAllData();
            setSelectedReferral(null);
          }}
        />
      )}

      {/* PARTICIPANT ONBOARDING DRAWER (GOVERNANCE G1) */}
      {selectedParticipantForOnboarding && (
        <ParticipantOnboardingDrawer
          isOpen={Boolean(selectedParticipantForOnboarding)}
          participant={selectedParticipantForOnboarding}
          onClose={() => setSelectedParticipantForOnboarding(null)}
          onUpdated={() => {
            loadAllData();
          }}
        />
      )}

      {/* ADD PARTICIPANT MODAL */}
      {showAddParticipant && (
        <AddParticipantModal
          onClose={() => setShowAddParticipant(false)}
          onCreated={(newP) => {
            loadAllData();
          }}
        />
      )}

      {/* ADD WORKER MODAL */}
      {showAddWorker && (
        <AddWorkerModal
          onClose={() => setShowAddWorker(false)}
          onCreated={(newW) => {
            loadAllData();
          }}
        />
      )}

      {/* AGREEMENT GENERATOR MODAL */}
      {showAgreementGenerator && (
        <AgreementGeneratorModal
          participants={participants}
          staff={staff}
          onClose={() => {
            setShowAgreementGenerator(false);
            setVariationTarget(null);
            setDraftAgreementTarget(null);
          }}
          variationOf={variationTarget}
          draftAgreement={draftAgreementTarget}
          onCreated={(newA) => {
            loadAgreements();
          }}
        />
      )}

      {/* AGREEMENT VIEWER MODAL */}
      {selectedAgreementToView && (
        <AgreementViewerModal
          agreement={selectedAgreementToView}
          onClose={() => setSelectedAgreementToView(null)}
          onCreateVariation={(agr) => {
            setSelectedAgreementToView(null);
            setVariationTarget(agr);
            setShowAgreementGenerator(true);
          }}
          onResumeDraft={(agr) => {
            setSelectedAgreementToView(null);
            setDraftAgreementTarget(agr);
            setShowAgreementGenerator(true);
          }}
        />
      )}

      {/* REGISTER INSURANCE POLICY MODAL */}
      {showAddInsurance && (
        <div className="crmModalOverlay" onClick={() => setShowAddInsurance(false)}>
          <DialogPanel
            onClose={() => setShowAddInsurance(false)}
            label="Register Insurance Policy"
            className="crmModalBox"
            style={{ maxWidth: 540 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="crmModalHeader">
              <div>
                <span className="refIdTag">GOVERNANCE COMPLIANCE</span>
                <h3 style={{ margin: '4px 0 0' }}>Register Insurance Policy</h3>
              </div>
              <button
                onClick={() => setShowAddInsurance(false)}
                aria-label="Close dialog"
                className="crmModalClose"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleAddInsurance} style={{ padding: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>
                    Policy Type *
                  </label>
                  <select
                    value={newInsurance.policyType}
                    onChange={(e) => setNewInsurance({ ...newInsurance, policyType: e.target.value })}
                    className="crmSelect"
                    style={{ width: '100%', padding: '8px 12px' }}
                  >
                    <option value="Public Liability">Public Liability</option>
                    <option value="Professional Indemnity">Professional Indemnity</option>
                    <option value="Workers Compensation">Workers Compensation</option>
                    <option value="Business/Participant Transport Vehicle Cover">Business/Participant Transport Vehicle Cover</option>
                    <option value="Cyber/Data Cover">Cyber/Data Cover</option>
                    <option value="Clinical/High Intensity Extension">Clinical/High Intensity Extension</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>
                    Insurer Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. QBE, Allianz, CGU, BizCover"
                    value={newInsurance.insurer}
                    onChange={(e) => setNewInsurance({ ...newInsurance, insurer: e.target.value })}
                    className="crmInput"
                    style={{ width: '100%', padding: '8px 12px' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>
                      Policy Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. POL-992381"
                      value={newInsurance.policyNumber}
                      onChange={(e) => setNewInsurance({ ...newInsurance, policyNumber: e.target.value })}
                      className="crmInput"
                      style={{ width: '100%', padding: '8px 12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>
                      Coverage Amount ($ AUD)
                    </label>
                    <input
                      type="number"
                      placeholder="10000000"
                      value={newInsurance.coverageAmount}
                      onChange={(e) => setNewInsurance({ ...newInsurance, coverageAmount: Number(e.target.value) })}
                      className="crmInput"
                      style={{ width: '100%', padding: '8px 12px' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>
                      Commencement Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={newInsurance.commencementDate}
                      onChange={(e) => setNewInsurance({ ...newInsurance, commencementDate: e.target.value })}
                      className="crmInput"
                      style={{ width: '100%', padding: '8px 12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>
                      Expiry Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={newInsurance.expiryDate}
                      onChange={(e) => setNewInsurance({ ...newInsurance, expiryDate: e.target.value })}
                      className="crmInput"
                      style={{ width: '100%', padding: '8px 12px' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>
                    Notes / Policy Scope
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Optional coverage notes, broker contact, or conditions..."
                    value={newInsurance.notes}
                    onChange={(e) => setNewInsurance({ ...newInsurance, notes: e.target.value })}
                    className="crmInput"
                    style={{ width: '100%', padding: '8px 12px' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => setShowAddInsurance(false)}
                    className="vsBtnOutline"
                    style={{ padding: '8px 16px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="vsBtnBlack"
                    style={{ padding: '8px 18px' }}
                  >
                    Register Policy
                  </button>
                </div>
              </div>
            </form>
          </DialogPanel>
        </div>
      )}
    </CrmContainer>
  );
}

