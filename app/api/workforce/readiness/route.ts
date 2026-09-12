import { NextResponse } from 'next/server';
import { getAuthenticatedAdminActor } from '@/lib/adminAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import { userFacingError } from '@/lib/userFacingError';

export async function GET(req: Request) {
  const actorId = await getAuthenticatedAdminActor(req);
  if (!actorId) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const staffId = new URL(req.url).searchParams.get('staff_id');
  if (!staffId) return NextResponse.json({ ok: false, error: 'staff_id is required.' }, { status: 400 });
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: 'Workforce governance service unavailable.' }, { status: 503 });
  const [worker, credentials, competencies, futureShifts] = await Promise.all([
    supabase.from('staff').select('id,reference_number,full_name,role,lifecycle_stage,is_rosterable,readiness_notes').eq('id', staffId).maybeSingle(),
    supabase.from('worker_credentials').select('*').eq('staff_id', staffId).order('requirement_code'),
    supabase.from('worker_competencies').select('*,competency:competency_catalogue(*)').eq('staff_id', staffId).order('created_at'),
    supabase.from('shift_assignments').select('id,shift:shifts(id,shift_reference,start_time,service_code,status)').eq('staff_id', staffId).neq('status', 'cancelled'),
  ]);
  const error = worker.error || credentials.error || competencies.error || futureShifts.error;
  if (error) return NextResponse.json({ ok: false, error: userFacingError(error.message) }, { status: 500 });
  return NextResponse.json({ ok: true, worker: worker.data, credentials: credentials.data || [], competencies: competencies.data || [], futureShifts: (futureShifts.data || []).filter((item: any) => item.shift && new Date(item.shift.start_time) >= new Date()) });
}

export async function POST(req: Request) {
  const actorId = await getAuthenticatedAdminActor(req);
  if (!actorId) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: 'Workforce governance service unavailable.' }, { status: 503 });
  try {
    const body = await req.json();
    if (!body.staffId || !body.kind) return NextResponse.json({ ok: false, error: 'staffId and kind are required.' }, { status: 400 });
    if (body.kind === 'credential') {
      if (!body.requirementCode || !body.requirementType || !['pending','verified','expired','revoked','rejected'].includes(body.verificationStatus)) return NextResponse.json({ ok: false, error: 'Controlled credential fields are required.' }, { status: 400 });
      if (body.verificationStatus === 'verified' && !body.evidenceDocumentId && !body.credentialNumber && !['acknowledgement','identity','work_eligibility','agreement'].includes(body.requirementType)) return NextResponse.json({ ok: false, error: 'Verification evidence or credential reference is required.' }, { status: 400 });
      if (body.requirementCode === 'ndis_worker_screening' && body.verificationStatus === 'verified' && body.screeningStatus !== 'Clearance') return NextResponse.json({ ok: false, error: 'Only a verified Clearance can satisfy worker screening.' }, { status: 400 });
      const { error } = await supabase.from('worker_credentials').upsert({ staff_id: body.staffId, requirement_code: body.requirementCode, requirement_type: body.requirementType, applicability: body.applicability || 'required', credential_number: body.credentialNumber || null, issuer: body.issuer || null, issue_date: body.issueDate || null, expiry_date: body.expiryDate || null, screening_status: body.screeningStatus || null, verification_status: body.verificationStatus, verified_by: body.verificationStatus === 'verified' ? actorId : null, verified_at: body.verificationStatus === 'verified' ? new Date().toISOString() : null, evidence_document_id: body.evidenceDocumentId || null, notes: body.notes || null, updated_at: new Date().toISOString() }, { onConflict: 'staff_id,requirement_code' });
      if (error) throw error;
    } else if (body.kind === 'competency') {
      if (!body.competencyCode || !['pending','achieved','expired','revoked','rejected'].includes(body.status)) return NextResponse.json({ ok: false, error: 'Controlled competency fields are required.' }, { status: 400 });
      const { data: catalogue, error: catalogueError } = await supabase.from('competency_catalogue').select('participant_specific').eq('code', body.competencyCode).single();
      if (catalogueError || !catalogue) return NextResponse.json({ ok: false, error: 'Unknown competency code.' }, { status: 400 });
      if (catalogue?.participant_specific && !body.participantId) return NextResponse.json({ ok: false, error: 'Participant-specific competency requires a participant.' }, { status: 400 });
      if (body.status === 'achieved' && !body.evidenceDocumentId) return NextResponse.json({ ok: false, error: 'Competency evidence is required.' }, { status: 400 });
      let existing = supabase.from('worker_competencies').select('id').eq('staff_id', body.staffId).eq('competency_code', body.competencyCode);
      existing = body.participantId ? existing.eq('participant_id', body.participantId) : existing.is('participant_id', null);
      existing = body.serviceCode ? existing.eq('service_code', body.serviceCode) : existing.is('service_code', null);
      const { data: existingRecord, error: existingError } = await existing.maybeSingle();
      if (existingError) throw existingError;
      const values = { staff_id: body.staffId, competency_code: body.competencyCode, participant_id: body.participantId || null, service_code: body.serviceCode || null, status: body.status, assessed_by: body.status === 'achieved' ? actorId : null, achieved_at: body.status === 'achieved' ? new Date().toISOString() : null, review_date: body.reviewDate || null, evidence_document_id: body.evidenceDocumentId || null, notes: body.notes || null, updated_at: new Date().toISOString() };
      const mutation = existingRecord
        ? supabase.from('worker_competencies').update(values).eq('id', existingRecord.id)
        : supabase.from('worker_competencies').insert(values);
      const { error } = await mutation;
      if (error) throw error;
    } else return NextResponse.json({ ok: false, error: 'Unsupported workforce evidence kind.' }, { status: 400 });
    const actionStatus = body.kind === 'credential' ? body.verificationStatus : body.status;
    const { error: auditError } = await supabase.from('audit_events').insert({
      entity_type: 'staff', entity_id: body.staffId, actor_type: 'admin_session', actor_id: actorId,
      action: `${body.kind}_${actionStatus}`,
      changes: body.kind === 'credential'
        ? { requirement_code: body.requirementCode, verification_status: body.verificationStatus, screening_status: body.screeningStatus || null }
        : { competency_code: body.competencyCode, status: body.status, participant_id: body.participantId || null, service_code: body.serviceCode || null },
    });
    if (auditError) throw auditError;
    const { data: readiness, error: readinessError } = await supabase.rpc('governance_g2_recalculate_worker_readiness', { p_staff_id: body.staffId, p_actor_id: actorId });
    if (readinessError) throw readinessError;
    return NextResponse.json({ ok: true, readiness });
  } catch (error) {
    return NextResponse.json({ ok: false, error: userFacingError(error) }, { status: 500 });
  }
}
