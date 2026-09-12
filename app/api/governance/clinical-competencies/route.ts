import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { logAuditEvent } from '@/lib/audit';
import { verifyParticipantSpecificCompetency } from '@/lib/services/clinicalGovernance';

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);
    let supabase: any = null;

    if (isAdmin) {
      supabase = createAdminClient();
    } else {
      supabase = await createClient();
    }

    if (!supabase) return NextResponse.json({ competencies: [] });

    if (!isAdmin) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, portal_staff_id, is_active')
        .eq('id', user.id)
        .single();
      if (!profile?.is_active || profile.role !== 'worker') {
        return NextResponse.json({ error: 'Unauthorised' }, { status: 403 });
      }
    }

    const { searchParams } = new URL(request.url);
    const workerId = searchParams.get('worker_id');
    const participantId = searchParams.get('participant_id');
    const taskType = searchParams.get('task_type');

    let query = supabase
      .from('participant_specific_competencies')
      .select('*, worker:staff(id, full_name, reference_number, role), participant:participants(id, full_name, reference_number)')
      .order('achieved_date', { ascending: false });

    if (workerId) query = query.eq('worker_id', workerId);
    if (participantId) query = query.eq('participant_id', participantId);
    if (taskType) query = query.eq('task_type', taskType);

    const { data, error } = await query;
    if (error) {
      console.error('Competencies query error:', error);
      return NextResponse.json({ competencies: [] });
    }

    return NextResponse.json({ competencies: data || [] });
  } catch (err) {
    console.error('GET /api/governance/clinical-competencies error:', err);
    return NextResponse.json({ error: 'Failed to retrieve competencies.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Only administrative management can record participant competencies.' }, { status: 403 });
    }

    const supabase = createAdminClient();
    if (!supabase) return NextResponse.json({ error: 'Service unavailable.' }, { status: 503 });

    const body = await request.json();
    const {
      worker_id,
      participant_id,
      clinical_plan_id,
      task_type,
      trainer_name,
      trainer_qualification,
      competency_status,
      achieved_date,
      expiry_date,
      evidence_reference,
    } = body;

    if (!worker_id || !participant_id || !task_type || !trainer_name || !trainer_qualification) {
      return NextResponse.json({
        error: 'worker_id, participant_id, task_type, trainer_name, and trainer_qualification are required.',
      }, { status: 400 });
    }

    const defaultExpiry = expiry_date || new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('participant_specific_competencies')
      .upsert({
        worker_id,
        participant_id,
        clinical_plan_id: clinical_plan_id || null,
        task_type,
        trainer_name,
        trainer_qualification,
        competency_status: competency_status || 'TRAINED_COMPETENT',
        achieved_date: achieved_date || new Date().toISOString().split('T')[0],
        expiry_date: defaultExpiry,
        evidence_reference: evidence_reference || null,
        emergency_protocols_assessed: true,
      }, { onConflict: 'worker_id,participant_id,task_type' })
      .select('*, worker:staff(id, full_name, reference_number), participant:participants(id, full_name, reference_number)')
      .single();

    if (error) {
      console.error('Competency upsert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAuditEvent({
      entity_type: 'participant_specific_competency',
      entity_id: data.id,
      actor_type: 'admin',
      actor_id: 'admin',
      action: 'certified',
      changes: { task_type, competency_status: data.competency_status, worker_id, participant_id },
      metadata: { worker_id, participant_id },
    });

    return NextResponse.json({ competency: data }, { status: 201 });
  } catch (err) {
    console.error('POST /api/governance/clinical-competencies error:', err);
    return NextResponse.json({ error: 'Failed to record competency.' }, { status: 500 });
  }
}
