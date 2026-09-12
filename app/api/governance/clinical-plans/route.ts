import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { logAuditEvent } from '@/lib/audit';
import { evaluateParticipantClinicalReadiness } from '@/lib/services/clinicalGovernance';

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);
    let supabase: any = null;

    if (isAdmin) {
      supabase = createAdminClient();
    } else {
      supabase = await createClient();
    }

    if (!supabase) return NextResponse.json({ plans: [] });

    if (!isAdmin) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, portal_participant_id, portal_staff_id, is_active')
        .eq('id', user.id)
        .single();
      if (!profile?.is_active) return NextResponse.json({ error: 'Unauthorised' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get('participant_id');
    const serviceId = searchParams.get('service_id');

    let query = supabase
      .from('participant_clinical_plans')
      .select('*, participant:participants(id, full_name, reference_number)')
      .order('issue_date', { ascending: false });

    if (participantId) query = query.eq('participant_id', participantId);
    if (serviceId) query = query.eq('service_id', serviceId);

    const { data, error } = await query;
    if (error) {
      console.error('Clinical plans query error:', error);
      return NextResponse.json({ plans: [] });
    }

    const plansWithReadiness = (data || []).map((p: any) => ({
      ...p,
      plan_readiness: evaluateParticipantClinicalReadiness(p),
    }));

    return NextResponse.json({ plans: plansWithReadiness });
  } catch (err) {
    console.error('GET /api/governance/clinical-plans error:', err);
    return NextResponse.json({ error: 'Failed to retrieve clinical plans.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Only administrative staff can record clinical care plans.' }, { status: 403 });
    }

    const supabase = createAdminClient();
    if (!supabase) return NextResponse.json({ error: 'Service unavailable.' }, { status: 503 });

    const body = await request.json();
    const {
      participant_id,
      service_id,
      plan_title,
      treating_practitioner_name,
      treating_practitioner_discipline,
      treating_practitioner_contact,
      plan_document_url,
      issue_date,
      review_date,
      emergency_escalation_instructions,
      contraindications_and_risks,
      clinical_reviewer_name,
      approval_status,
      required_worker_competencies,
    } = body;

    if (!participant_id || !service_id || !plan_title || !treating_practitioner_name) {
      return NextResponse.json({ error: 'participant_id, service_id, plan_title, and treating_practitioner_name are required.' }, { status: 400 });
    }

    const year = new Date().getFullYear();
    const { count } = await supabase
      .from('participant_clinical_plans')
      .select('*', { count: 'exact', head: true });
    const ref = `CCP-${year}-${String((count ?? 0) + 1).padStart(4, '0')}`;

    const defaultReviewDate = review_date || new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('participant_clinical_plans')
      .insert({
        plan_reference: ref,
        participant_id,
        service_id,
        plan_title,
        treating_practitioner_name,
        treating_practitioner_discipline: treating_practitioner_discipline || 'General Practitioner',
        treating_practitioner_contact: treating_practitioner_contact || null,
        plan_document_url: plan_document_url || null,
        issue_date: issue_date || new Date().toISOString().split('T')[0],
        review_date: defaultReviewDate,
        emergency_escalation_instructions: emergency_escalation_instructions || 'If acute distress or complication occurs, cease support immediately and call 000.',
        contraindications_and_risks: contraindications_and_risks || 'Standard clinical safeguards apply.',
        clinical_reviewer_name: clinical_reviewer_name || null,
        approval_status: approval_status || 'Pending Review',
        approved_at: approval_status === 'Clinical Approved' ? new Date().toISOString() : null,
        approved_by: approval_status === 'Clinical Approved' ? (clinical_reviewer_name || 'Clinical Lead') : null,
        required_worker_competencies: required_worker_competencies || [],
      })
      .select('*, participant:participants(id, full_name, reference_number)')
      .single();

    if (error) {
      console.error('Clinical plan insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAuditEvent({
      entity_type: 'participant_clinical_plan',
      entity_id: data.id,
      actor_type: 'admin',
      actor_id: 'admin',
      action: 'created',
      changes: { plan_reference: ref, service_id, approval_status: data.approval_status },
      metadata: { participant_id },
    });

    return NextResponse.json({
      plan: data,
      plan_readiness: evaluateParticipantClinicalReadiness(data),
    }, { status: 201 });
  } catch (err) {
    console.error('POST /api/governance/clinical-plans error:', err);
    return NextResponse.json({ error: 'Failed to record clinical care plan.' }, { status: 500 });
  }
}
