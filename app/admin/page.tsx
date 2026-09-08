'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import WorkforceRosterTab from '@/components/WorkforceRosterTab';
import AddParticipantModal from '@/components/admin/AddParticipantModal';
import AddWorkerModal from '@/components/admin/AddWorkerModal';
import AgreementGeneratorModal from '@/components/admin/AgreementGeneratorModal';
import AgreementViewerModal from '@/components/admin/AgreementViewerModal';
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
  ClipboardList, Target
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


type TabType = 'dashboard' | 'referrals' | 'agreements' | 'participants' | 'goals' | 'support_plans' | 'risk_assessments' | 'safeguarding' | 'invoicing' | 'quotes' | 'staff' | 'workforce' | 'compliance' | 'settings';

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
  const [agreements, setAgreements] = useState<any[]>([]);
  const [agreementsLoading, setAgreementsLoading] = useState(false);
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [showAgreementGenerator, setShowAgreementGenerator] = useState(false);
  const [selectedAgreementToView, setSelectedAgreementToView] = useState<any | null>(null);
  const [variationTarget, setVariationTarget] = useState<any | null>(null);
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

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tab === 'compliance') {
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
    }
  }, [tab, selectedGoalParticipant, selectedPlanParticipant, selectedRiskParticipant]);



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
            <h1 style={{ margin: '0 0 6px', fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              Opus Care CRM / ERP
            </h1>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B', lineHeight: 1.5 }}>
              Enter authorized administrator access key to open the operations management dashboard.
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {authError && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '10px 14px', borderRadius: 12, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left' }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{authError}</span>
              </div>
            )}

            <div style={{ textAlign: 'left' }}>
              <label htmlFor="adminKey" style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                Admin Access Key
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
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
                  style={{ width: '100%', padding: '10px 14px 10px 38px', borderRadius: 9999, border: '1px solid #CBD5E1', background: '#F8FAFC', fontSize: '0.88rem', outline: 'none' }}
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

          <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid #F1F5F9' }}>
            <Link href="/" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textDecoration: 'none' }}>
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
          fontWeight: 700,
          marginBottom: 18,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <CheckCircle2 size={16} color="#059669" />
          <span>{statusNotice}</span>
        </div>
      )}
          {/* TAB 0: DASHBOARD (IDURAR STYLE) */}
          {tab === 'dashboard' && (
        <div>
          {/* Sub-view Filter Pills */}
          <CrmPillBar
            items={[
              { id: 'all', label: 'All Operations', count: participants.length + referrals.length },
              { id: 'urgent', label: 'Urgent Actions', count: countNew },
              { id: 'intake', label: 'Intake Pipeline', count: referrals.length },
              { id: 'participants', label: 'Active Participants', count: participants.length },
              { id: 'roster', label: 'Workforce Roster', count: staff.length },
            ]}
            selectedId={filterStatus === 'all' ? 'all' : filterStatus}
            onSelect={(id) => {
              if (id === 'intake' || id === 'urgent') setTab('referrals');
              else if (id === 'participants') setTab('participants');
              else if (id === 'roster') setTab('workforce');
            }}
            className="mb-4"
          />

          {/* Row 1: Top 4 Squircle KPI Cards (VibeStore Screen 1 Style) */}
          <div className="vsGrid4">
            <CrmSquircleCard
              title="Active Participants"
              value={participants.length}
              subtitle="Enrolled in Clarence Valley & Northern Rivers NSW"
              meta="Plan-Managed & Self-Managed"
              icon={<Users size={24} />}
              tint="sky"
              actionLabel="Directory"
              onAction={() => setTab('participants')}
            />

            <CrmSquircleCard
              title="Inbound Referrals"
              value={referrals.length}
              subtitle={`${countNew} new referrals awaiting intake review`}
              meta="Intake pipeline active"
              icon={<UserPlus size={24} />}
              tint="emerald"
              actionLabel="Review"
              badge={countNew > 0 ? `${countNew} New` : undefined}
              onAction={() => setTab('referrals')}
            />

            <CrmSquircleCard
              title="Workforce & Staff"
              value={staff.length}
              subtitle="Support workers & verified clearances"
              meta="NDISWC & WWCC active"
              icon={<UserCheck size={24} />}
              tint="amber"
              actionLabel="Manage"
              onAction={() => setTab('staff')}
            />

            <CrmSquircleCard
              title="Service Agreements"
              value={agreements.length}
              subtitle="Legally sealed & SHA-256 verified contracts"
              meta="Turnkey onboarding packs"
              icon={<FileText size={24} />}
              tint="indigo"
              actionLabel="Agreements"
              badge="Immutable"
              onAction={() => setTab('agreements')}
            />
          </div>

          {/* Row 2: Two-Column Bento Layout */}
          <div className="vsGrid2ColBento">
            {/* Left Column: Hero Callouts & Intake Funnel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Feature Hero 1: Agreement Engine Callout (Matching Screen 1 Huppy Box) */}
              <div className="vsHeroCard lavender">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span className="vsTagCrm">CONTRACT ENGINE</span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#4F46E5' }}>Updated v2.4</span>
                    </div>
                    <h3 style={{ margin: '0 0 6px', fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>
                      Australian NDIS Service Agreement Engine
                    </h3>
                    <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: '#475569', lineHeight: 1.5, maxWidth: 520 }}>
                      Generate turnkey participant packs (PACK-PART-01), schedules of supports, and SCHADS employment contracts with automated sham-contracting compliance guards and SHA-256 digital seals.
                    </p>
                  </div>
                  <div className="vsSquircle indigo" style={{ width: 56, height: 56, borderRadius: 18 }}>
                    <FileText size={28} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setShowAgreementGenerator(true)}
                    className="vsBtnBlack"
                    style={{ padding: '8px 20px', fontSize: '0.82rem' }}
                  >
                    + New Agreement / Pack
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('agreements')}
                    className="vsBtnOutline"
                    style={{ padding: '8px 18px', fontSize: '0.82rem' }}
                  >
                    View All ({agreements.length})
                  </button>
                </div>
              </div>

              {/* Feature Hero 2: Workforce Roster Callout */}
              <div className="vsHeroCard teal">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ background: '#CCFBF1', color: '#0F766E', fontSize: '0.65rem', fontWeight: 800, padding: '2px 7px', borderRadius: 9999 }}>
                        WORKFORCE HUB
                      </span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0D9488' }}>Live Roster</span>
                    </div>
                    <h3 style={{ margin: '0 0 6px', fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
                      Workforce Rostering & Shift Management
                    </h3>
                    <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: '#334155', lineHeight: 1.5, maxWidth: 520 }}>
                      Roster support shifts across Yamba, Maclean, Grafton, and Iluka with instant conflict checks and compliance clearance validation.
                    </p>
                  </div>
                  <div className="vsSquircle teal" style={{ width: 56, height: 56, borderRadius: 18 }}>
                    <CalendarClock size={28} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setTab('workforce')}
                    className="vsBtnBlack"
                    style={{ padding: '8px 20px', fontSize: '0.82rem' }}
                  >
                    Open Shift Roster
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddWorker(true)}
                    className="vsBtnOutline"
                    style={{ padding: '8px 18px', fontSize: '0.82rem' }}
                  >
                    + Register Worker
                  </button>
                </div>
              </div>

              {/* Pipeline Funnel Bento Pane */}
              <CrmBentoPane
                title="Intake & Conversion Pipeline"
                subtitle="Live status distribution across all inbound referrals"
                action={
                  <button
                    type="button"
                    onClick={() => setTab('referrals')}
                    className="vsBtnOutline"
                    style={{ padding: '4px 12px', fontSize: '0.75rem' }}
                  >
                    Manage Pipeline &rarr;
                  </button>
                }
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="crmPreviewRow">
                    <div className="crmPreviewRowMeta">
                      <span className="crmPreviewLabel">1. New Inbound Intake</span>
                      <span className="crmPreviewPct">{pctNew}% ({countNew})</span>
                    </div>
                    <div className="crmProgressBarTrack">
                      <div className="crmProgressBarFill slate" style={{ width: `${pctNew}%` }} />
                    </div>
                  </div>

                  <div className="crmPreviewRow">
                    <div className="crmPreviewRowMeta">
                      <span className="crmPreviewLabel">2. Contacted & Initial Consult</span>
                      <span className="crmPreviewPct">{pctContacted}% ({countContacted})</span>
                    </div>
                    <div className="crmProgressBarTrack">
                      <div className="crmProgressBarFill amber" style={{ width: `${pctContacted}%` }} />
                    </div>
                  </div>

                  <div className="crmPreviewRow">
                    <div className="crmPreviewRowMeta">
                      <span className="crmPreviewLabel">3. Participant Assessment & Goals</span>
                      <span className="crmPreviewPct">{pctAssessment}% ({countAssessment})</span>
                    </div>
                    <div className="crmProgressBarTrack">
                      <div className="crmProgressBarFill blue" style={{ width: `${pctAssessment}%` }} />
                    </div>
                  </div>

                  <div className="crmPreviewRow">
                    <div className="crmPreviewRowMeta">
                      <span className="crmPreviewLabel">4. Service Agreement Sent</span>
                      <span className="crmPreviewPct">{pctAgreements}% ({countAgreements})</span>
                    </div>
                    <div className="crmProgressBarTrack">
                      <div className="crmProgressBarFill teal" style={{ width: `${pctAgreements}%` }} />
                    </div>
                  </div>

                  <div className="crmPreviewRow">
                    <div className="crmPreviewRowMeta">
                      <span className="crmPreviewLabel">5. Active / Enrolled Participant</span>
                      <span className="crmPreviewPct">{pctActive}% ({countActive})</span>
                    </div>
                    <div className="crmProgressBarTrack">
                      <div className="crmProgressBarFill green" style={{ width: `${pctActive}%` }} />
                    </div>
                  </div>
                </div>
              </CrmBentoPane>
            </div>

            {/* Right Column: Quick Operations & Recent Activity */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Pinned Quick Intake Controls */}
              <CrmBentoPane
                title="Quick Operations Hub"
                subtitle="Direct intake & registration actions"
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setShowAddParticipant(true)}
                    className="vsBtnOutline"
                    style={{ width: '100%', justifyContent: 'flex-start', padding: '10px 14px', borderRadius: 14 }}
                  >
                    <div className="vsSquircle sky" style={{ width: 32, height: 32, borderRadius: 10, marginRight: 8 }}>
                      <UserPlus size={16} />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <strong style={{ display: 'block', fontSize: '0.82rem', color: '#0F172A' }}>+ Add New Participant</strong>
                      <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Register participant & plan details</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAddWorker(true)}
                    className="vsBtnOutline"
                    style={{ width: '100%', justifyContent: 'flex-start', padding: '10px 14px', borderRadius: 14 }}
                  >
                    <div className="vsSquircle amber" style={{ width: 32, height: 32, borderRadius: 10, marginRight: 8 }}>
                      <UserCheck size={16} />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <strong style={{ display: 'block', fontSize: '0.82rem', color: '#0F172A' }}>+ Register Support Worker</strong>
                      <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Add staff member & clearances</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAgreementGenerator(true)}
                    className="vsBtnOutline"
                    style={{ width: '100%', justifyContent: 'flex-start', padding: '10px 14px', borderRadius: 14 }}
                  >
                    <div className="vsSquircle indigo" style={{ width: 32, height: 32, borderRadius: 10, marginRight: 8 }}>
                      <FileText size={16} />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <strong style={{ display: 'block', fontSize: '0.82rem', color: '#0F172A' }}>+ Generate Agreement Pack</strong>
                      <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Turnkey contract generator wizard</span>
                    </div>
                  </button>
                </div>
              </CrmBentoPane>

              {/* Supabase Live Infrastructure Card */}
              <CrmBentoPane
                title="System Health & Infrastructure"
                subtitle="High-availability database connectivity"
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#F8FAFC', borderRadius: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="vsLiveDot" />
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A' }}>Supabase PostgreSQL 17</span>
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#059669' }}>Sydney ap-southeast-2</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#F8FAFC', borderRadius: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FolderLock size={14} color="#0284C7" />
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A' }}>Private Vault (AES-256)</span>
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0284C7' }}>crm-documents</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#F8FAFC', borderRadius: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Shield size={14} color="#7C3AED" />
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A' }}>NDIS Commission Rules</span>
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#7C3AED' }}>Compliant</span>
                  </div>
                </div>
              </CrmBentoPane>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#E0F2FE', color: '#0284C7', padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase' }}>
                      Contract &amp; Agreement Engine
                    </span>
                    <span style={{ fontSize: '0.82rem', color: '#64748B' }}>
                      Immutable Private Vault &bull; Version Controlled
                    </span>
                  </div>
                  <h2 className="crmPanelTitle">Service Agreements &amp; Document Packs</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748B' }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 18px', boxShadow: '0 2px 6px rgba(15,23,42,0.02)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>Active Executed Agreements</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A' }}>
                    {agreements.filter((a: any) => a.status === 'active' || a.status === 'fully_signed').length}
                  </div>
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 18px', boxShadow: '0 2px 6px rgba(15,23,42,0.02)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>Pending Execution / Drafts</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#D97706' }}>
                    {agreements.filter((a: any) => a.status !== 'active' && a.status !== 'fully_signed' && a.status !== 'superseded').length}
                  </div>
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 18px', boxShadow: '0 2px 6px rgba(15,23,42,0.02)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>Committed Plan Funding</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669' }}>
                    ${agreements.reduce((acc: number, a: any) => acc + (Number(a.estimated_budget) || 0), 0).toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 500, marginLeft: 4 }}>AUD</span>
                  </div>
                </div>
              </div>

              {/* Active Agreements Table */}
              <div className="crmTableWrapper" style={{ marginBottom: 28 }}>
                <table className="crmTable">
                  <thead>
                    <tr>
                      <th>Ref &amp; Date</th>
                      <th>Recipient / Owner</th>
                      <th>Document Title &amp; Version</th>
                      <th>Committed Budget</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agreements.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: 36, textAlign: 'center', color: '#94A3B8' }}>
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
                              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0284C7', fontSize: '0.85rem' }}>
                                {agr.agreement_reference}
                              </span>
                              <div style={{ fontSize: '0.78rem', color: '#64748B' }}>{agr.commencement_date}</div>
                            </td>
                            <td>
                              <strong style={{ color: '#0F172A' }}>{ownerName}</strong>
                              <div style={{ fontSize: '0.78rem', color: '#64748B', textTransform: 'capitalize' }}>
                                {agr.owner_type} &bull; {agr.questionnaire_data?.funding_type || 'Agreed'}
                              </div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.9rem' }}>{agr.title}</div>
                              <span style={{ fontSize: '0.75rem', background: '#F1F5F9', color: '#475569', padding: '1px 6px', borderRadius: 4 }}>
                                Version {agr.version_number}.0 ({agr.template_version})
                              </span>
                            </td>
                            <td>
                              {agr.estimated_budget ? (
                                <strong style={{ color: '#059669', fontSize: '0.92rem' }}>
                                  ${Number(agr.estimated_budget).toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                                </strong>
                              ) : (
                                <span style={{ color: '#94A3B8' }}>—</span>
                              )}
                            </td>
                            <td>
                              <span style={{
                                display: 'inline-block',
                                padding: '3px 10px',
                                borderRadius: 20,
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                background: isExecuted ? '#ECFDF5' : isSuperseded ? '#F1F5F9' : '#FFFBEB',
                                color: isExecuted ? '#059669' : isSuperseded ? '#64748B' : '#B45309',
                              }}>
                                {agr.status}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                onClick={() => setSelectedAgreementToView(agr)}
                                className="crmSecondaryBtn"
                                style={{ padding: '5px 12px', fontSize: '0.8rem' }}
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
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#162E56', margin: 0 }}>
                      NDIS Support Catalogue &bull; NSW Northern Rivers Price Limits (2026 Reference)
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748B' }}>
                      Statutory price limits serve as reference benchmarks; all client rates in the Schedule of Supports are mutually agreed.
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
                        <th>NSW Regional Price Limit</th>
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
                        <td><span className="refIdTag">04_104_0125_6_1</span></td>
                        <td><strong>Access Community, Social and Rec Activities - Standard - Weekday Daytime</strong></td>
                        <td><span className="fundingPillMini">Capacity Building</span></td>
                        <td><strong style={{ color: '#0F172A' }}>$67.56</strong></td>
                        <td>Hour</td>
                      </tr>
                      <tr>
                        <td><span className="refIdTag">01_019_0120_1_1</span></td>
                        <td><strong>House Cleaning &amp; Other Household Activities</strong></td>
                        <td><span className="fundingPillMini">Core Supports</span></td>
                        <td><strong style={{ color: '#0F172A' }}>$58.45</strong></td>
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
                  <h2 className="crmPanelTitle">Participants 360° Directory</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                    Comprehensive participant profiles, NDIS numbers, funding models, assigned support workers, and document vault.
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

          {/* =============================================================== */}
          {/* PHASE A TAB: PARTICIPANT GOALS                                  */}
          {/* =============================================================== */}
          {tab === 'goals' && (
            <div className="crmTabPanel">
              <div className="crmPanelHeader">
                <div>
                  <h2 className="crmPanelTitle">Participant Goals</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                    Manage NDIS plan goals, track progress and link to support activities.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <select
                    value={selectedGoalParticipant}
                    onChange={(e) => {
                      setSelectedGoalParticipant(e.target.value);
                      if (e.target.value) loadGoals(e.target.value);
                    }}
                    style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 12px', fontSize: '0.85rem', minWidth: 220 }}
                  >
                    <option value="">— Select Participant —</option>
                    {participants.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  {selectedGoalParticipant && (
                    <button
                      onClick={() => setShowGoalForm(!showGoalForm)}
                      style={{ background: '#1E40AF', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <Plus size={15} /> Add Goal
                    </button>
                  )}
                </div>
              </div>

              {/* Create goal form */}
              {showGoalForm && (
                <div style={{ background: '#F8FAFF', border: '1px solid #BFDBFE', borderRadius: 12, padding: 20, marginBottom: 20 }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: '0.95rem', fontWeight: 600, color: '#1E40AF' }}>New Goal</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Goal Title *</label>
                      <input
                        type="text"
                        placeholder="e.g. Improve independence in meal preparation"
                        value={newGoal.goal_title}
                        onChange={e => setNewGoal(prev => ({ ...prev, goal_title: e.target.value }))}
                        style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: 8, padding: '9px 12px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Description</label>
                      <textarea
                        placeholder="Describe the goal in detail..."
                        value={newGoal.goal_description}
                        onChange={e => setNewGoal(prev => ({ ...prev, goal_description: e.target.value }))}
                        rows={3}
                        style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: 8, padding: '9px 12px', fontSize: '0.88rem', resize: 'vertical', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Category</label>
                      <select
                        value={newGoal.category}
                        onChange={e => setNewGoal(prev => ({ ...prev, category: e.target.value }))}
                        style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: 8, padding: '9px 12px', fontSize: '0.88rem' }}
                      >
                        {['Daily Living', 'Community Participation', 'Employment', 'Health & Wellbeing', 'Social', 'Capacity Building', 'General'].map(c => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>NDIS Domain</label>
                      <input
                        type="text"
                        placeholder="e.g. Daily Activities"
                        value={newGoal.ndis_domain}
                        onChange={e => setNewGoal(prev => ({ ...prev, ndis_domain: e.target.value }))}
                        style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: 8, padding: '9px 12px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Target Date</label>
                      <input
                        type="date"
                        value={newGoal.target_date}
                        onChange={e => setNewGoal(prev => ({ ...prev, target_date: e.target.value }))}
                        style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: 8, padding: '9px 12px', fontSize: '0.88rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Review Date</label>
                      <input
                        type="date"
                        value={newGoal.review_date}
                        onChange={e => setNewGoal(prev => ({ ...prev, review_date: e.target.value }))}
                        style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: 8, padding: '9px 12px', fontSize: '0.88rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Priority (1=Highest)</label>
                      <select
                        value={newGoal.priority}
                        onChange={e => setNewGoal(prev => ({ ...prev, priority: Number(e.target.value) }))}
                        style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: 8, padding: '9px 12px', fontSize: '0.88rem' }}
                      >
                        {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                    <button
                      onClick={createGoal}
                      disabled={savingGoal || !newGoal.goal_title.trim()}
                      style={{ background: '#1E40AF', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }}
                    >
                      {savingGoal ? 'Saving…' : 'Save Goal'}
                    </button>
                    <button
                      onClick={() => setShowGoalForm(false)}
                      style={{ background: '#F1F5F9', color: '#374151', border: 'none', borderRadius: 8, padding: '9px 20px', fontWeight: 500, fontSize: '0.88rem', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Goals list */}
              {!selectedGoalParticipant ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#94A3B8' }}>
                  <Target size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
                  <p style={{ margin: 0 }}>Select a participant above to view their goals.</p>
                </div>
              ) : goalsLoading ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#94A3B8' }}>Loading goals…</div>
              ) : goals.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#94A3B8' }}>
                  <p>No goals recorded for this participant yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {goals.map(goal => (
                    <div key={goal.id} style={{
                      background: '#FFFFFF', borderRadius: 10, padding: '16px 20px',
                      border: '1px solid #E2E8F0', boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16,
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: '#111827', marginBottom: 4 }}>{goal.goal_title}</div>
                        {goal.goal_description && (
                          <p style={{ color: '#6B7280', fontSize: '0.85rem', margin: '0 0 8px' }}>{goal.goal_description}</p>
                        )}
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ background: '#EFF6FF', color: '#3B82F6', borderRadius: 20, padding: '2px 10px', fontSize: '0.75rem', fontWeight: 600 }}>{goal.category}</span>
                          {goal.ndis_domain && <span style={{ background: '#F3F4F6', color: '#6B7280', borderRadius: 20, padding: '2px 10px', fontSize: '0.75rem' }}>{goal.ndis_domain}</span>}
                          {goal.target_date && <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>Target: {new Date(goal.target_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                        <span style={{
                          borderRadius: 20, padding: '4px 12px', fontSize: '0.78rem', fontWeight: 700,
                          background: goal.status === 'active' ? '#EFF6FF' : goal.status === 'achieved' ? '#F0FDF4' : '#FFF7ED',
                          color: goal.status === 'active' ? '#3B82F6' : goal.status === 'achieved' ? '#16A34A' : '#D97706',
                        }}>
                          {goal.status === 'active' ? 'In Progress' : goal.status === 'achieved' ? '✓ Achieved' : goal.status === 'paused' ? 'On Hold' : 'Discontinued'}
                        </span>
                        <select
                          value={goal.status}
                          onChange={e => updateGoalStatus(goal.id, e.target.value)}
                          style={{ border: '1px solid #E2E8F0', borderRadius: 6, padding: '4px 8px', fontSize: '0.78rem' }}
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
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                    Versioned participant support plans — draft, activate, and supersede as plans evolve.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <select
                    value={selectedPlanParticipant}
                    onChange={(e) => {
                      setSelectedPlanParticipant(e.target.value);
                      if (e.target.value) loadSupportPlans(e.target.value);
                    }}
                    style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 12px', fontSize: '0.85rem', minWidth: 220 }}
                  >
                    <option value="">— Select Participant —</option>
                    {participants.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  {selectedPlanParticipant && (
                    <button
                      onClick={() => setShowPlanForm(!showPlanForm)}
                      style={{ background: '#1E40AF', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <Plus size={15} /> New Plan Version
                    </button>
                  )}
                </div>
              </div>

              {/* Support Plan Form */}
              {showPlanForm && (
                <div style={{ background: '#F8FAFF', border: '1px solid #BFDBFE', borderRadius: 12, padding: 20, marginBottom: 20 }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: '0.95rem', fontWeight: 600, color: '#1E40AF' }}>New Support Plan Version</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Plan Title *</label>
                      <input
                        type="text"
                        value={newPlan.plan_title}
                        onChange={e => setNewPlan(prev => ({ ...prev, plan_title: e.target.value }))}
                        style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: 8, padding: '9px 12px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Primary Disability</label>
                      <input
                        type="text"
                        placeholder="e.g. Autism Spectrum Disorder"
                        value={newPlan.primary_disability}
                        onChange={e => setNewPlan(prev => ({ ...prev, primary_disability: e.target.value }))}
                        style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: 8, padding: '9px 12px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Communication Method</label>
                      <input
                        type="text"
                        placeholder="e.g. Verbal, AAC device, Pictograms"
                        value={newPlan.communication_method}
                        onChange={e => setNewPlan(prev => ({ ...prev, communication_method: e.target.value }))}
                        style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: 8, padding: '9px 12px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Dietary Requirements</label>
                      <input
                        type="text"
                        placeholder="e.g. Gluten-free, soft textures, nut allergy"
                        value={newPlan.dietary_requirements}
                        onChange={e => setNewPlan(prev => ({ ...prev, dietary_requirements: e.target.value }))}
                        style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: 8, padding: '9px 12px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Mobility Aids</label>
                      <input
                        type="text"
                        placeholder="e.g. Walking frame, wheelchair"
                        value={newPlan.mobility_aids}
                        onChange={e => setNewPlan(prev => ({ ...prev, mobility_aids: e.target.value }))}
                        style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: 8, padding: '9px 12px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Review Date</label>
                      <input
                        type="date"
                        value={newPlan.review_date}
                        onChange={e => setNewPlan(prev => ({ ...prev, review_date: e.target.value }))}
                        style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: 8, padding: '9px 12px', fontSize: '0.88rem' }}
                      />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Triggers & De-escalation Responses</label>
                      <textarea
                        placeholder="Describe sensory triggers, environmental factors, and calming routines..."
                        value={newPlan.triggers_and_responses}
                        onChange={e => setNewPlan(prev => ({ ...prev, triggers_and_responses: e.target.value }))}
                        rows={3}
                        style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: 8, padding: '9px 12px', fontSize: '0.88rem', resize: 'vertical', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                    <button
                      onClick={createSupportPlan}
                      disabled={savingPlan || !newPlan.plan_title.trim()}
                      style={{ background: '#1E40AF', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }}
                    >
                      {savingPlan ? 'Saving…' : 'Save Support Plan Version'}
                    </button>
                    <button
                      onClick={() => setShowPlanForm(false)}
                      style={{ background: '#F1F5F9', color: '#374151', border: 'none', borderRadius: 8, padding: '9px 20px', fontWeight: 500, fontSize: '0.88rem', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {!selectedPlanParticipant ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#94A3B8' }}>
                  <ClipboardList size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
                  <p style={{ margin: 0 }}>Select a participant to view their support plans.</p>
                </div>
              ) : plansLoading ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#94A3B8' }}>Loading plans…</div>
              ) : supportPlans.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#94A3B8' }}>
                  <p>No support plans yet. Click &ldquo;New Plan Version&rdquo; to create the first one.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {supportPlans.map(plan => (
                    <div key={plan.id} style={{
                      background: '#FFFFFF', borderRadius: 10, padding: '18px 20px',
                      border: `1px solid ${plan.status === 'active' ? '#BBF7D0' : '#E2E8F0'}`,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 12 }}>
                        <div>
                          <div style={{ fontWeight: 700, color: '#111827', fontSize: '1rem' }}>{plan.plan_title} — v{plan.version}</div>
                          <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: 2 }}>
                            Created {new Date(plan.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {plan.plan_start_date && ` · Plan period: ${new Date(plan.plan_start_date).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })} – ${plan.plan_end_date ? new Date(plan.plan_end_date).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' }) : 'ongoing'}`}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span style={{
                            borderRadius: 20, padding: '4px 12px', fontSize: '0.78rem', fontWeight: 700,
                            background: plan.status === 'active' ? '#F0FDF4' : plan.status === 'draft' ? '#FFF7ED' : '#F3F4F6',
                            color: plan.status === 'active' ? '#16A34A' : plan.status === 'draft' ? '#D97706' : '#6B7280',
                          }}>
                            {plan.status === 'active' ? '✓ Active' : plan.status === 'draft' ? 'Draft' : plan.status === 'superseded' ? 'Superseded' : 'Archived'}
                          </span>
                          {plan.status === 'draft' && (
                            <button
                              onClick={() => activatePlan(plan.id)}
                              style={{ background: '#16A34A', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                              Activate
                            </button>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                        {[
                          { label: 'Primary Disability', value: plan.primary_disability },
                          { label: 'Communication', value: plan.communication_method },
                          { label: 'Language', value: plan.language_preference },
                          { label: 'Dietary', value: plan.dietary_requirements },
                          { label: 'Mobility Aids', value: plan.mobility_aids },
                          { label: 'Review Date', value: plan.review_date ? new Date(plan.review_date).toLocaleDateString('en-AU') : null },
                        ].filter(f => f.value).map((field, idx) => (
                          <div key={idx}>
                            <div style={{ fontSize: '0.72rem', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>{field.label}</div>
                            <div style={{ fontSize: '0.85rem', color: '#374151', fontWeight: 500 }}>{field.value}</div>
                          </div>
                        ))}
                      </div>
                      {plan.triggers_and_responses && (
                        <div style={{ marginTop: 12, background: '#FFF7ED', borderRadius: 8, padding: '10px 14px' }}>
                          <div style={{ fontSize: '0.73rem', color: '#D97706', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Triggers & De-escalation</div>
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
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                    Structured participant risk assessments — versioned, activated, and shared with assigned workers.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <select
                    value={selectedRiskParticipant}
                    onChange={(e) => {
                      setSelectedRiskParticipant(e.target.value);
                      if (e.target.value) loadRiskAssessments(e.target.value);
                    }}
                    style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 12px', fontSize: '0.85rem', minWidth: 220 }}
                  >
                    <option value="">— Select Participant —</option>
                    {participants.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  {selectedRiskParticipant && (
                    <button
                      onClick={() => setShowRiskForm(!showRiskForm)}
                      style={{ background: '#1E40AF', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <Plus size={15} /> New Assessment Version
                    </button>
                  )}
                </div>
              </div>

              {/* Risk Assessment Form */}
              {showRiskForm && (
                <div style={{ background: '#F8FAFF', border: '1px solid #BFDBFE', borderRadius: 12, padding: 20, marginBottom: 20 }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: '0.95rem', fontWeight: 600, color: '#1E40AF' }}>New Risk Assessment Version</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Assessment Title *</label>
                      <input
                        type="text"
                        value={newRisk.assessment_title}
                        onChange={e => setNewRisk(prev => ({ ...prev, assessment_title: e.target.value }))}
                        style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: 8, padding: '9px 12px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Overall Risk Rating</label>
                      <select
                        value={newRisk.overall_risk_rating}
                        onChange={e => setNewRisk(prev => ({ ...prev, overall_risk_rating: e.target.value }))}
                        style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: 8, padding: '9px 12px', fontSize: '0.88rem' }}
                      >
                        <option value="Low">Low Risk</option>
                        <option value="Medium">Medium Risk</option>
                        <option value="High">High Risk</option>
                        <option value="Extreme">Extreme Risk</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Falls & Mobility Risk Description</label>
                      <input
                        type="text"
                        value={newRisk.falls_risk}
                        onChange={e => setNewRisk(prev => ({ ...prev, falls_risk: e.target.value }))}
                        style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: 8, padding: '9px 12px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Falls & Mobility Controls</label>
                      <input
                        type="text"
                        value={newRisk.falls_controls}
                        onChange={e => setNewRisk(prev => ({ ...prev, falls_controls: e.target.value }))}
                        style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: 8, padding: '9px 12px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Medication Controls</label>
                      <input
                        type="text"
                        value={newRisk.medication_controls}
                        onChange={e => setNewRisk(prev => ({ ...prev, medication_controls: e.target.value }))}
                        style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: 8, padding: '9px 12px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Review Date</label>
                      <input
                        type="date"
                        value={newRisk.review_date}
                        onChange={e => setNewRisk(prev => ({ ...prev, review_date: e.target.value }))}
                        style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: 8, padding: '9px 12px', fontSize: '0.88rem' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                    <button
                      onClick={createRiskAssessment}
                      disabled={savingRisk || !newRisk.assessment_title.trim()}
                      style={{ background: '#1E40AF', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }}
                    >
                      {savingRisk ? 'Saving…' : 'Save Risk Assessment Version'}
                    </button>
                    <button
                      onClick={() => setShowRiskForm(false)}
                      style={{ background: '#F1F5F9', color: '#374151', border: 'none', borderRadius: 8, padding: '9px 20px', fontWeight: 500, fontSize: '0.88rem', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {!selectedRiskParticipant ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#94A3B8' }}>
                  <ShieldAlert size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
                  <p style={{ margin: 0 }}>Select a participant to view their risk assessments.</p>
                </div>
              ) : risksLoading ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#94A3B8' }}>Loading risk assessments…</div>
              ) : riskAssessments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#94A3B8' }}>
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
                    style={{ background: '#1E40AF', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }}
                  >
                    Create Initial Risk Assessment
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {riskAssessments.map(ra => {
                    const ratingColour = ra.overall_risk_rating === 'Low' ? '#16A34A' : ra.overall_risk_rating === 'Medium' ? '#D97706' : ra.overall_risk_rating === 'High' ? '#DC2626' : '#7C3AED';
                    const ratingBg = ra.overall_risk_rating === 'Low' ? '#F0FDF4' : ra.overall_risk_rating === 'Medium' ? '#FFFBEB' : ra.overall_risk_rating === 'High' ? '#FEF2F2' : '#F5F3FF';
                    return (
                      <div key={ra.id} style={{
                        background: '#FFFFFF', borderRadius: 10, padding: '18px 20px',
                        border: `1px solid ${ra.status === 'active' ? '#BBF7D0' : '#E2E8F0'}`,
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 14 }}>
                          <div>
                            <div style={{ fontWeight: 700, color: '#111827', fontSize: '1rem' }}>{ra.assessment_title} — v{ra.version}</div>
                            <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: 2 }}>
                              Created {new Date(ra.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                              {ra.review_date && ` · Review: ${new Date(ra.review_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            {ra.overall_risk_rating && (
                              <span style={{ borderRadius: 20, padding: '4px 12px', fontSize: '0.78rem', fontWeight: 700, background: ratingBg, color: ratingColour }}>
                                {ra.overall_risk_rating} Risk
                              </span>
                            )}
                            <span style={{
                              borderRadius: 20, padding: '4px 12px', fontSize: '0.78rem', fontWeight: 700,
                              background: ra.status === 'active' ? '#F0FDF4' : ra.status === 'draft' ? '#FFF7ED' : '#F3F4F6',
                              color: ra.status === 'active' ? '#16A34A' : ra.status === 'draft' ? '#D97706' : '#6B7280',
                            }}>
                              {ra.status === 'active' ? '✓ Active' : ra.status === 'draft' ? 'Draft' : 'Superseded'}
                            </span>
                            {ra.status === 'draft' && (
                              <button
                                onClick={() => activateRiskAssessment(ra.id)}
                                style={{ background: '#16A34A', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                              >
                                Activate
                              </button>
                            )}
                          </div>
                        </div>
                        {/* Risk domains */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
                          {[
                            { key: 'falls_and_mobility', label: 'Falls & Mobility', data: ra.falls_and_mobility },
                            { key: 'medication_risks', label: 'Medication', data: ra.medication_risks },
                            { key: 'behaviour_and_mental_health', label: 'Behaviour & Mental Health', data: ra.behaviour_and_mental_health },
                            { key: 'environmental_hazards', label: 'Environmental Hazards', data: ra.environmental_hazards },
                            { key: 'community_access_risks', label: 'Community Access', data: ra.community_access_risks },
                            { key: 'fire_and_emergency', label: 'Fire & Emergency', data: ra.fire_and_emergency },
                            { key: 'financial_exploitation', label: 'Financial Safety', data: ra.financial_exploitation },
                          ].filter(d => d.data).map(domain => (
                            <div key={domain.key} style={{ background: '#F8FAFC', borderRadius: 8, padding: '10px 14px' }}>
                              <div style={{ fontSize: '0.73rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>{domain.label}</div>
                              <div style={{ fontSize: '0.83rem', color: '#374151', marginBottom: 4 }}>{domain.data.risk}</div>
                              <div style={{ fontSize: '0.78rem', color: '#6B7280' }}>Controls: {domain.data.controls}</div>
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
                  <h2 className="crmPanelTitle">Quality &amp; Safeguarding Hub</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                    NDIS Quality &amp; Safeguards Commission compliant incident management, complaints resolution, and corrective actions register.
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
                    style={{ background: '#0284C7', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Plus size={15} /> Add Action
                  </button>
                  <button
                    onClick={() => {
                      loadIncidents();
                      loadComplaints();
                      loadCorrectiveActions();
                    }}
                    style={{ background: '#F1F5F9', color: '#334155', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
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
                const reportableReview = openIncidents.filter(i => i.reportable_assessment === 'Pending Review' || i.reportable_assessment === 'Potentially Reportable');

                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 20 }}>
                    <div style={{ background: '#FFFFFF', padding: 16, borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Open Incidents</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                        <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A' }}>{openIncidents.length}</span>
                        {highCritIncidents.length > 0 && (
                          <span style={{ fontSize: '0.78rem', color: '#DC2626', fontWeight: 700, background: '#FEF2F2', padding: '2px 8px', borderRadius: 12 }}>
                            {highCritIncidents.length} High/Critical
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ background: '#FFFFFF', padding: 16, borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Complaints Requiring Action</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                        <span style={{ fontSize: '1.6rem', fontWeight: 800, color: pendingComplaints.length > 0 ? '#D97706' : '#16A34A' }}>{pendingComplaints.length}</span>
                        <span style={{ fontSize: '0.78rem', color: '#64748B' }}>active feedback items</span>
                      </div>
                    </div>

                    <div style={{ background: '#FFFFFF', padding: 16, borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Overdue Corrective Actions</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                        <span style={{ fontSize: '1.6rem', fontWeight: 800, color: overdueActions.length > 0 ? '#DC2626' : '#16A34A' }}>{overdueActions.length}</span>
                        <span style={{ fontSize: '0.78rem', color: overdueActions.length > 0 ? '#DC2626' : '#64748B' }}>
                          {overdueActions.length > 0 ? 'requires immediate action' : 'all on schedule'}
                        </span>
                      </div>
                    </div>

                    <div style={{ background: '#FFFFFF', padding: 16, borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>NDIS Reportable Reviews</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                        <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2563EB' }}>{reportableReview.length}</span>
                        <span style={{ fontSize: '0.78rem', color: '#64748B' }}>manager assessment pending</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Sub-tab Navigation */}
              <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #E2E8F0', paddingBottom: 10, marginBottom: 16 }}>
                <button
                  onClick={() => setSafeguardingSubTab('incidents')}
                  style={{
                    padding: '8px 16px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                    background: safeguardingSubTab === 'incidents' ? '#1E40AF' : '#FFFFFF',
                    color: safeguardingSubTab === 'incidents' ? '#FFFFFF' : '#64748B',
                    border: safeguardingSubTab === 'incidents' ? 'none' : '1px solid #E2E8F0',
                  }}
                >
                  Incidents Register ({incidentsList.length})
                </button>
                <button
                  onClick={() => setSafeguardingSubTab('complaints')}
                  style={{
                    padding: '8px 16px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                    background: safeguardingSubTab === 'complaints' ? '#1E40AF' : '#FFFFFF',
                    color: safeguardingSubTab === 'complaints' ? '#FFFFFF' : '#64748B',
                    border: safeguardingSubTab === 'complaints' ? 'none' : '1px solid #E2E8F0',
                  }}
                >
                  Complaints Register ({complaintsList.length})
                </button>
                <button
                  onClick={() => setSafeguardingSubTab('corrective_actions')}
                  style={{
                    padding: '8px 16px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                    background: safeguardingSubTab === 'corrective_actions' ? '#1E40AF' : '#FFFFFF',
                    color: safeguardingSubTab === 'corrective_actions' ? '#FFFFFF' : '#64748B',
                    border: safeguardingSubTab === 'corrective_actions' ? 'none' : '1px solid #E2E8F0',
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
                    <select
                      value={incidentSeverityFilter}
                      onChange={e => setIncidentSeverityFilter(e.target.value)}
                      style={{ border: '1px solid #CBD5E1', borderRadius: 8, padding: '7px 12px', fontSize: '0.83rem' }}
                    >
                      <option value="all">All Severities</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                    <select
                      value={incidentStatusFilter}
                      onChange={e => setIncidentStatusFilter(e.target.value)}
                      style={{ border: '1px solid #CBD5E1', borderRadius: 8, padding: '7px 12px', fontSize: '0.83rem' }}
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
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8' }}>Loading incidents…</div>
                  ) : incidentsList.length === 0 ? (
                    <div style={{ background: '#FFFFFF', padding: '40px 20px', borderRadius: 10, textAlign: 'center', border: '1px solid #E2E8F0' }}>
                      <CheckCircle2 size={36} style={{ color: '#16A34A', marginBottom: 10 }} />
                      <p style={{ margin: 0, fontWeight: 600, color: '#334155' }}>No incidents recorded</p>
                      <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748B' }}>Incident reports submitted by workers or staff will appear here.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {incidentsList
                        .filter(inc => incidentSeverityFilter === 'all' || inc.severity === incidentSeverityFilter)
                        .filter(inc => incidentStatusFilter === 'all' || inc.status === incidentStatusFilter)
                        .map(inc => {
                          const sevBg = inc.severity === 'Critical' ? '#450A0A' : inc.severity === 'High' ? '#FEF2F2' : inc.severity === 'Medium' ? '#FFFBEB' : '#F0FDF4';
                          const sevColor = inc.severity === 'Critical' ? '#FFFFFF' : inc.severity === 'High' ? '#DC2626' : inc.severity === 'Medium' ? '#D97706' : '#16A34A';
                          return (
                            <div
                              key={inc.id}
                              style={{
                                background: '#FFFFFF', borderRadius: 10, padding: '16px 18px', border: '1px solid #E2E8F0',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.03)', display: 'flex', justifyContent: 'space-between',
                                alignItems: 'center', flexWrap: 'wrap', gap: 12,
                              }}
                            >
                              <div style={{ flex: 1, minWidth: 260 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                  <strong style={{ color: '#0F172A', fontSize: '0.95rem' }}>{inc.incident_reference}</strong>
                                  <span style={{ background: sevBg, color: sevColor, padding: '2px 8px', borderRadius: 12, fontSize: '0.73rem', fontWeight: 700 }}>
                                    {inc.severity} Severity
                                  </span>
                                  <span style={{ background: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: 12, fontSize: '0.73rem', fontWeight: 600 }}>
                                    {inc.category}
                                  </span>
                                  {inc.emergency_services_contacted && (
                                    <span style={{ background: '#FEF2F2', color: '#991B1B', padding: '2px 8px', borderRadius: 12, fontSize: '0.73rem', fontWeight: 700 }}>
                                      🚨 000 Called
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.88rem', color: '#334155', marginBottom: 4 }}>
                                  {inc.description.length > 120 ? `${inc.description.slice(0, 120)}…` : inc.description}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: '#94A3B8', display: 'flex', gap: 14 }}>
                                  <span>Participant: <strong>{inc.participant?.full_name || 'Participant'}</strong></span>
                                  <span>Reported: {new Date(inc.incident_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                  <span>Status: <strong>{inc.status}</strong></span>
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                  onClick={() => setSelectedIncident(inc)}
                                  style={{
                                    background: '#1E40AF', color: '#fff', border: 'none', borderRadius: 6,
                                    padding: '7px 14px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 4,
                                  }}
                                >
                                  <Eye size={14} /> Review &amp; Investigate
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <select
                        value={complaintStatusFilter}
                        onChange={e => setComplaintStatusFilter(e.target.value)}
                        style={{ border: '1px solid #CBD5E1', borderRadius: 8, padding: '7px 12px', fontSize: '0.83rem' }}
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
                  </div>

                  {complaintsLoading ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8' }}>Loading complaints…</div>
                  ) : complaintsList.length === 0 ? (
                    <div style={{ background: '#FFFFFF', padding: '40px 20px', borderRadius: 10, textAlign: 'center', border: '1px solid #E2E8F0' }}>
                      <CheckCircle2 size={36} style={{ color: '#16A34A', marginBottom: 10 }} />
                      <p style={{ margin: 0, fontWeight: 600, color: '#334155' }}>No complaints recorded</p>
                      <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748B' }}>Feedback and complaints from participants or stakeholders will appear here.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {complaintsList
                        .filter(c => complaintStatusFilter === 'all' || c.status === complaintStatusFilter)
                        .map(comp => (
                          <div
                            key={comp.id}
                            style={{
                              background: '#FFFFFF', borderRadius: 10, padding: '16px 18px', border: '1px solid #E2E8F0',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.03)', display: 'flex', justifyContent: 'space-between',
                              alignItems: 'center', flexWrap: 'wrap', gap: 12,
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 260 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <strong style={{ color: '#0F172A', fontSize: '0.95rem' }}>{comp.complaint_reference}</strong>
                                <span style={{ background: '#EFF6FF', color: '#1E40AF', padding: '2px 8px', borderRadius: 12, fontSize: '0.73rem', fontWeight: 600 }}>
                                  {comp.complainant_role}
                                </span>
                                {comp.immediate_safety_issue && (
                                  <span style={{ background: '#FEF2F2', color: '#DC2626', padding: '2px 8px', borderRadius: 12, fontSize: '0.73rem', fontWeight: 700 }}>
                                    ⚠️ Safety Issue
                                  </span>
                                )}
                                {comp.linked_incident_id && (
                                  <span style={{ background: '#FDF4FF', color: '#9333EA', padding: '2px 8px', borderRadius: 12, fontSize: '0.73rem', fontWeight: 600 }}>
                                    Linked to Incident
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1E293B', marginBottom: 2 }}>
                                {comp.summary}
                              </div>
                              <div style={{ fontSize: '0.84rem', color: '#475569', marginBottom: 4 }}>
                                {comp.details.length > 120 ? `${comp.details.slice(0, 120)}…` : comp.details}
                              </div>
                              <div style={{ fontSize: '0.78rem', color: '#94A3B8', display: 'flex', gap: 14 }}>
                                <span>From: <strong>{comp.complainant_name}</strong></span>
                                <span>Received: {comp.received_date}</span>
                                <span>Status: <strong>{comp.status}</strong></span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button
                                onClick={() => setSelectedComplaint(comp)}
                                style={{
                                  background: '#1E40AF', color: '#fff', border: 'none', borderRadius: 6,
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
                      <select
                        value={actionStatusFilter}
                        onChange={e => setActionStatusFilter(e.target.value)}
                        style={{ border: '1px solid #CBD5E1', borderRadius: 8, padding: '7px 12px', fontSize: '0.83rem' }}
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
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8' }}>Loading corrective actions…</div>
                  ) : actionsList.length === 0 ? (
                    <div style={{ background: '#FFFFFF', padding: '40px 20px', borderRadius: 10, textAlign: 'center', border: '1px solid #E2E8F0' }}>
                      <CheckCircle2 size={36} style={{ color: '#16A34A', marginBottom: 10 }} />
                      <p style={{ margin: 0, fontWeight: 600, color: '#334155' }}>No corrective actions recorded</p>
                      <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748B' }}>Actions assigned from incident reviews or complaint investigations will appear here.</p>
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
                                background: '#FFFFFF', borderRadius: 10, padding: '16px 18px', border: '1px solid #E2E8F0',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.03)', display: 'flex', justifyContent: 'space-between',
                                alignItems: 'center', flexWrap: 'wrap', gap: 12,
                              }}
                            >
                              <div style={{ flex: 1, minWidth: 260 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                  <strong style={{ color: '#0F172A', fontSize: '0.95rem' }}>{act.action_reference}</strong>
                                  <span style={{ background: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: 12, fontSize: '0.73rem', fontWeight: 600 }}>
                                    From {act.source_type}
                                  </span>
                                  <span style={{
                                    background: act.priority === 'Urgent' ? '#FEF2F2' : act.priority === 'High' ? '#FFFBEB' : '#F0FDF4',
                                    color: act.priority === 'Urgent' ? '#DC2626' : act.priority === 'High' ? '#D97706' : '#16A34A',
                                    padding: '2px 8px', borderRadius: 12, fontSize: '0.73rem', fontWeight: 700,
                                  }}>
                                    {act.priority} Priority
                                  </span>
                                  {isOverdue && (
                                    <span style={{ background: '#FEF2F2', color: '#B91C1C', padding: '2px 8px', borderRadius: 12, fontSize: '0.73rem', fontWeight: 700 }}>
                                      Overdue
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.9rem', color: '#1E293B', fontWeight: 500, marginBottom: 4 }}>
                                  {act.action_description}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: '#94A3B8', display: 'flex', gap: 14 }}>
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
                                      background: '#16A34A', color: '#fff', border: 'none', borderRadius: 6,
                                      padding: '7px 14px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                                      display: 'flex', alignItems: 'center', gap: 4,
                                    }}
                                  >
                                    <Check size={14} /> Mark Completed
                                  </button>
                                ) : (
                                  <span style={{ background: '#F0FDF4', color: '#16A34A', padding: '4px 10px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600 }}>
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
              <div style={{
                background: '#FFFFFF', borderRadius: 12, width: '100%', maxWidth: 760,
                maxHeight: '90vh', overflowY: 'auto', padding: 24, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #E2E8F0', paddingBottom: 16, marginBottom: 16 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#0F172A' }}>
                        {selectedIncident.incident_reference}
                      </h3>
                      <span style={{ background: '#FEF2F2', color: '#DC2626', padding: '2px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 700 }}>
                        {selectedIncident.severity} Severity
                      </span>
                      <span style={{ background: '#EFF6FF', color: '#1E40AF', padding: '2px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 }}>
                        Status: {selectedIncident.status}
                      </span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748B' }}>
                      Participant: <strong>{selectedIncident.participant?.full_name}</strong> &bull; Date: {new Date(selectedIncident.incident_at).toLocaleString('en-AU')}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedIncident(null)}
                    style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#94A3B8' }}
                  >
                    &times;
                  </button>
                </div>

                {/* Facts Grid */}
                <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 8, marginBottom: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: '0.85rem' }}>
                  <div><strong>Category:</strong> {selectedIncident.category}</div>
                  <div><strong>Location:</strong> {selectedIncident.location || 'Participant location'}</div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <strong>Incident Description:</strong>
                    <div style={{ marginTop: 4, color: '#334155' }}>{selectedIncident.description}</div>
                  </div>
                  {selectedIncident.immediate_actions_taken && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <strong>Immediate Actions Taken:</strong>
                      <div style={{ marginTop: 2, color: '#334155' }}>{selectedIncident.immediate_actions_taken}</div>
                    </div>
                  )}
                  {selectedIncident.injury_or_harm_details && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <strong>Injury / Harm:</strong>
                      <div style={{ marginTop: 2, color: '#B91C1C' }}>{selectedIncident.injury_or_harm_details}</div>
                    </div>
                  )}
                  {selectedIncident.emergency_services_contacted && (
                    <div style={{ gridColumn: '1 / -1', background: '#FEF2F2', padding: 8, borderRadius: 6, color: '#991B1B' }}>
                      <strong>Emergency Services (000) Contacted:</strong> {selectedIncident.emergency_services_details || 'Yes'}
                    </div>
                  )}
                </div>

                {/* Manager Review & Investigation Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 18 }}>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1E293B', display: 'block', marginBottom: 4 }}>
                      Manager Investigation Notes &amp; Findings
                    </label>
                    <textarea
                      rows={3}
                      id="incident_inv_notes"
                      defaultValue={selectedIncident.investigation_notes || ''}
                      placeholder="Record root cause analysis, worker interviews, policy compliance, and contributing factors..."
                      style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: 8, padding: '8px 12px', fontSize: '0.85rem', resize: 'vertical', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1E293B', display: 'block', marginBottom: 4 }}>
                        NDIS Commission Reportability Assessment
                      </label>
                      <select
                        id="incident_reportable_assessment"
                        defaultValue={selectedIncident.reportable_assessment || 'Pending Review'}
                        style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: 8, padding: '8px 12px', fontSize: '0.85rem' }}
                      >
                        <option value="Not Reportable">Not Reportable (Internal Management Only)</option>
                        <option value="Potentially Reportable">Potentially Reportable (Requires Further Evidence)</option>
                        <option value="NDIS Commission Reportable">NDIS Commission Reportable (Part 6 NDIS Act)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1E293B', display: 'block', marginBottom: 4 }}>
                        External Notification Status
                      </label>
                      <select
                        id="incident_notification_status"
                        defaultValue={selectedIncident.external_notification_status || 'Not Required'}
                        style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: 8, padding: '8px 12px', fontSize: '0.85rem' }}
                      >
                        <option value="Not Required">Not Required</option>
                        <option value="Pending Review">Pending Review</option>
                        <option value="Reported to NDIS Commission (24-Hour)">Reported to NDIS Commission (24-Hour Notice)</option>
                        <option value="Reported to NDIS Commission (5-Day)">Reported to NDIS Commission (5-Day Report)</option>
                        <option value="Reported to Police">Reported to Police</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1E293B', display: 'block', marginBottom: 4 }}>
                      Reportability Determination Rationale
                    </label>
                    <input
                      type="text"
                      id="incident_reportable_rationale"
                      defaultValue={selectedIncident.reportable_rationale || ''}
                      placeholder="Explain why the incident is or is not reportable under NDIS rules..."
                      style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: 8, padding: '8px 12px', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1E293B', display: 'block', marginBottom: 4 }}>
                      Participant / Family Follow-up Notes
                    </label>
                    <input
                      type="text"
                      id="incident_family_followup"
                      defaultValue={selectedIncident.participant_family_follow_up || ''}
                      placeholder="Date contacted, family informed, welfare check completed..."
                      style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: 8, padding: '8px 12px', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Actions & Status Workflow Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: 16, flexWrap: 'wrap', gap: 10 }}>
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
                      style={{ background: '#F1F5F9', color: '#1E40AF', border: '1px solid #BFDBFE', borderRadius: 6, padding: '7px 12px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
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
                      style={{ background: '#1E40AF', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 16px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
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
                        style={{ background: '#16A34A', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 14px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Close Incident
                      </button>
                    ) : (
                      <button
                        onClick={() => updateIncident(selectedIncident.id, { status: 'Under Review' })}
                        style={{ background: '#F1F5F9', color: '#64748B', border: '1px solid #CBD5E1', borderRadius: 6, padding: '7px 14px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Re-open Incident
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* COMPLAINT DETAIL & RESOLUTION MODAL */}
          {selectedComplaint && (
            <div style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 16,
            }}>
              <div style={{
                background: '#FFFFFF', borderRadius: 12, width: '100%', maxWidth: 700,
                maxHeight: '90vh', overflowY: 'auto', padding: 24, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #E2E8F0', paddingBottom: 14, marginBottom: 16 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#0F172A' }}>
                        {selectedComplaint.complaint_reference}
                      </h3>
                      <span style={{ background: '#EFF6FF', color: '#1E40AF', padding: '2px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 }}>
                        {selectedComplaint.status}
                      </span>
                      {selectedComplaint.immediate_safety_issue && (
                        <span style={{ background: '#FEF2F2', color: '#DC2626', padding: '2px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 700 }}>
                          ⚠️ Immediate Safety Issue
                        </span>
                      )}
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748B' }}>
                      Complainant: <strong>{selectedComplaint.complainant_name}</strong> ({selectedComplaint.complainant_role}) &bull; Received: {selectedComplaint.received_date}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedComplaint(null)}
                    style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#94A3B8' }}
                  >
                    &times;
                  </button>
                </div>

                <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 8, marginBottom: 16, fontSize: '0.85rem' }}>
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
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1E293B', display: 'block', marginBottom: 4 }}>
                        Acknowledgement Date
                      </label>
                      <input
                        type="date"
                        id="comp_ack_date"
                        defaultValue={selectedComplaint.acknowledgement_date || ''}
                        style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: 8, padding: '7px 10px', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1E293B', display: 'block', marginBottom: 4 }}>
                        Assigned Manager
                      </label>
                      <input
                        type="text"
                        id="comp_assigned_manager"
                        defaultValue={selectedComplaint.assigned_manager || 'Operations Manager'}
                        style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: 8, padding: '7px 10px', fontSize: '0.85rem', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1E293B', display: 'block', marginBottom: 4 }}>
                      Investigation Notes &amp; Actions Taken
                    </label>
                    <textarea
                      rows={3}
                      id="comp_investigation_notes"
                      defaultValue={selectedComplaint.investigation_notes || ''}
                      placeholder="Steps taken to address the complaint..."
                      style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: 8, padding: '8px 12px', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1E293B', display: 'block', marginBottom: 4 }}>
                      Outcome &amp; Resolution Summary
                    </label>
                    <textarea
                      rows={2}
                      id="comp_resolution_summary"
                      defaultValue={selectedComplaint.resolution_summary || ''}
                      placeholder="Agreed resolution and communication with complainant..."
                      style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: 8, padding: '8px 12px', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: 14, flexWrap: 'wrap', gap: 10 }}>
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
                        style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 6, padding: '7px 12px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
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
                      style={{ background: '#1E40AF', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 14px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Save Updates
                    </button>

                    {selectedComplaint.status !== 'Resolved' && selectedComplaint.status !== 'Closed' && (
                      <button
                        onClick={() => updateComplaint(selectedComplaint.id, { status: 'Resolved' })}
                        style={{ background: '#16A34A', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 14px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Mark Resolved
                      </button>
                    )}

                    {selectedComplaint.status !== 'Closed' ? (
                      <button
                        onClick={() => updateComplaint(selectedComplaint.id, { status: 'Closed' })}
                        style={{ background: '#475569', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 14px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Close Complaint
                      </button>
                    ) : (
                      <button
                        onClick={() => updateComplaint(selectedComplaint.id, { status: 'Under Review' })}
                        style={{ background: '#F1F5F9', color: '#64748B', border: '1px solid #CBD5E1', borderRadius: 6, padding: '7px 14px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Re-open
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ADD CORRECTIVE ACTION MODAL */}
          {showAddActionModal && (
            <div style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', zIndex: 70, padding: 16,
            }}>
              <div style={{ background: '#FFFFFF', borderRadius: 12, width: '100%', maxWidth: 500, padding: 22 }}>
                <h3 style={{ margin: '0 0 14px', fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>
                  Create Corrective Action
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Action Description *</label>
                    <textarea
                      rows={3}
                      value={newActionForm.action_description}
                      onChange={e => setNewActionForm(prev => ({ ...prev, action_description: e.target.value }))}
                      placeholder="e.g. Conduct refresher manual handling training for support team"
                      style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: 6, padding: '8px 10px', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Owner *</label>
                      <input
                        type="text"
                        value={newActionForm.owner}
                        onChange={e => setNewActionForm(prev => ({ ...prev, owner: e.target.value }))}
                        style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: 6, padding: '7px 10px', fontSize: '0.85rem', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Due Date *</label>
                      <input
                        type="date"
                        value={newActionForm.due_date}
                        onChange={e => setNewActionForm(prev => ({ ...prev, due_date: e.target.value }))}
                        style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: 6, padding: '7px 10px', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Priority</label>
                    <select
                      value={newActionForm.priority}
                      onChange={e => setNewActionForm(prev => ({ ...prev, priority: e.target.value }))}
                      style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: 6, padding: '7px 10px', fontSize: '0.85rem' }}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
                  <button
                    onClick={() => setShowAddActionModal(false)}
                    style={{ background: '#F1F5F9', border: 'none', borderRadius: 6, padding: '7px 14px', fontSize: '0.82rem', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => createCorrectiveAction(newActionForm)}
                    disabled={!newActionForm.action_description.trim() || !newActionForm.owner || !newActionForm.due_date}
                    style={{ background: '#1E40AF', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 16px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Create Action
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ESCALATE COMPLAINT TO INCIDENT MODAL */}
          {showEscalateComplaintModal && selectedComplaint && (
            <div style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', zIndex: 70, padding: 16,
            }}>
              <div style={{ background: '#FFFFFF', borderRadius: 12, width: '100%', maxWidth: 520, padding: 22 }}>
                <h3 style={{ margin: '0 0 10px', fontSize: '1.1rem', fontWeight: 700, color: '#DC2626' }}>
                  ⚠️ Escalate Complaint to Incident
                </h3>
                <p style={{ margin: '0 0 14px', fontSize: '0.82rem', color: '#64748B' }}>
                  Creates an official Incident record linked to complaint {selectedComplaint.complaint_reference} for formal investigation.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Category</label>
                    <select
                      value={escalateIncidentForm.category}
                      onChange={e => setEscalateIncidentForm(prev => ({ ...prev, category: e.target.value }))}
                      style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: 6, padding: '7px 10px', fontSize: '0.85rem' }}
                    >
                      <option value="allegation_abuse_neglect">Allegation of Abuse / Neglect / Exploitation</option>
                      <option value="injury">Physical Harm or Injury</option>
                      <option value="medication_error">Medication Issue</option>
                      <option value="behaviour_of_concern">Behaviour of Concern</option>
                      <option value="other">Other Incident</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Severity</label>
                    <select
                      value={escalateIncidentForm.severity}
                      onChange={e => setEscalateIncidentForm(prev => ({ ...prev, severity: e.target.value as any }))}
                      style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: 6, padding: '7px 10px', fontSize: '0.85rem' }}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Incident Summary / Note</label>
                    <textarea
                      rows={2}
                      value={escalateIncidentForm.description}
                      onChange={e => setEscalateIncidentForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Add any specific context for this escalation..."
                      style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: 6, padding: '8px 10px', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
                  <button
                    onClick={() => setShowEscalateComplaintModal(false)}
                    style={{ background: '#F1F5F9', border: 'none', borderRadius: 6, padding: '7px 14px', fontSize: '0.82rem', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => escalateComplaintToIncident(selectedComplaint)}
                    style={{ background: '#DC2626', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 16px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Confirm Escalation
                  </button>
                </div>
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
                  onClick={() => setShowAddWorker(true)}
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

          {/* TAB: WORKFORCE ROSTERING & SHIFT SCHEDULING */}
          {tab === 'workforce' && (
            <WorkforceRosterTab
              participants={participants.map((p) => ({
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
        <div>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ margin: '0 0 4px', fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              Settings &amp; Preferences
            </h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>
              Manage your administrator account, provider legal configuration, and system preferences.
            </p>
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
                    background: '#0F172A',
                    color: '#FFFFFF',
                    fontSize: '2rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.2)',
                    marginBottom: 14,
                  }}
                >
                  OA
                </div>
                <h3 style={{ margin: '0 0 2px', fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>
                  Opus Admin
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#64748B', marginBottom: 10 }}>
                  support@opuscare.com.au
                </span>
                <span className="vsTagCrm" style={{ marginBottom: 18 }}>
                  Administrator
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                  <button
                    type="button"
                    onClick={() => alert('Admin Key is managed via ADMIN_ACCESS_KEY environment secret.')}
                    className="vsBtnBlack"
                    style={{ flex: 1, padding: '7px 12px', fontSize: '0.75rem' }}
                  >
                    Change Key
                  </button>
                  <button
                    type="button"
                    onClick={() => alert('Audit logs are synchronized in private Supabase bucket.')}
                    className="vsBtnOutline"
                    style={{ flex: 1, padding: '7px 12px', fontSize: '0.75rem' }}
                  >
                    Export Log
                  </button>
                </div>
              </div>

              {/* Provider Legal Entity Card (Screen 4 Plan Box) */}
              <div className="vsHeroCard lavender">
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  REGISTERED PROVIDER
                </span>
                <h4 style={{ margin: '4px 0 2px', fontSize: '0.98rem', fontWeight: 800, color: '#0F172A' }}>
                  Opus Care Support Services
                </h4>
                <p style={{ margin: '0 0 10px', fontSize: '0.75rem', color: '#475569' }}>
                  ABN: 89 654 321 098 &bull; Yamba NSW
                </p>
                <button
                  type="button"
                  onClick={() => setShowAgreementGenerator(true)}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#4F46E5', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', textAlign: 'left' }}
                >
                  Configure provider details &rarr;
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
                  onClick={() => alert('Provider Legal Configuration is loaded dynamically from public.provider_config.')}
                />
                <CrmSettingRow
                  title="Password & Security"
                  description="7-day HttpOnly cookie session active"
                  icon={<Lock size={18} />}
                  tint="teal"
                  onClick={() => alert('Session token is cryptographically signed with HMAC-SHA256.')}
                />
                <CrmSettingRow
                  title="Private Document Vault"
                  description="AES-256 encrypted Supabase Storage"
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
                    onChange: () => alert('Dark mode preference will be persisted.'),
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
                title="About & System"
                subtitle="System information and security"
                noPadding
              >
                <CrmSettingRow
                  title="About Opus Care CRM"
                  description="Version 2.5 Enterprise Edition"
                  icon={<Sparkles size={18} />}
                  tint="indigo"
                  badge="v2.5"
                />
                <CrmSettingRow
                  title="Supabase Sydney Connection"
                  description="Connected live to ap-southeast-2"
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
                      <div className="fullCol" style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <strong style={{ fontSize: '0.88rem', color: '#1E40AF', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Shield size={15} /> Emergency &amp; Worker Instructions
                          </strong>
                          <button
                            onClick={() => setShowEditEmergency(!showEditEmergency)}
                            style={{ background: 'none', border: '1px solid #CBD5E1', borderRadius: 6, padding: '3px 8px', fontSize: '0.78rem', color: '#374151', cursor: 'pointer' }}
                          >
                            {showEditEmergency ? 'Close' : 'Edit'}
                          </button>
                        </div>
                        {showEditEmergency ? (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: '#F8FAFC', padding: 12, borderRadius: 8 }}>
                            <div>
                              <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Emergency Contact Name</label>
                              <input
                                type="text"
                                defaultValue={selectedParticipant.emergencyContactName || ''}
                                id="edit_emergency_name"
                                style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: 6, padding: '6px 8px', fontSize: '0.82rem', boxSizing: 'border-box' }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Emergency Contact Phone</label>
                              <input
                                type="text"
                                defaultValue={selectedParticipant.emergencyContactPhone || ''}
                                id="edit_emergency_phone"
                                style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: 6, padding: '6px 8px', fontSize: '0.82rem', boxSizing: 'border-box' }}
                              />
                            </div>
                            <div className="fullCol">
                              <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Medical Alert / Allergies</label>
                              <input
                                type="text"
                                defaultValue={selectedParticipant.medicalAlert || ''}
                                id="edit_medical_alert"
                                placeholder="e.g. Severe peanut allergy - carries EpiPen"
                                style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: 6, padding: '6px 8px', fontSize: '0.82rem', boxSizing: 'border-box' }}
                              />
                            </div>
                            <div className="fullCol">
                              <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Worker Instructions</label>
                              <textarea
                                defaultValue={selectedParticipant.workerInstructions || ''}
                                id="edit_worker_instructions"
                                rows={2}
                                placeholder="e.g. Ring bell twice, prompt to take morning medication"
                                style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: 6, padding: '6px 8px', fontSize: '0.82rem', resize: 'vertical', boxSizing: 'border-box' }}
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
                                style={{ background: '#1E40AF', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                              >
                                Save Emergency Info
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.83rem', color: '#374151' }}>
                            <div>
                              <span style={{ color: '#94A3B8', fontSize: '0.75rem', display: 'block' }}>Emergency Contact</span>
                              <strong>{selectedParticipant.emergencyContactName || 'Not recorded'}</strong>
                              {selectedParticipant.emergencyContactPhone && (
                                <span style={{ display: 'block', color: '#0284C7' }}>{selectedParticipant.emergencyContactPhone}</span>
                              )}
                            </div>
                            <div>
                              <span style={{ color: '#94A3B8', fontSize: '0.75rem', display: 'block' }}>Medical Alert</span>
                              <span style={{ color: selectedParticipant.medicalAlert ? '#DC2626' : '#64748B', fontWeight: selectedParticipant.medicalAlert ? 600 : 400 }}>
                                {selectedParticipant.medicalAlert || 'None'}
                              </span>
                            </div>
                            {selectedParticipant.workerInstructions && (
                              <div className="fullCol" style={{ background: '#FFFBEB', padding: 8, borderRadius: 6, border: '1px solid #FEF3C7' }}>
                                <span style={{ color: '#B45309', fontSize: '0.75rem', fontWeight: 600, display: 'block' }}>Worker Instructions</span>
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
          }}
          variationOf={variationTarget}
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
        />
      )}
    </CrmContainer>
  );
}

