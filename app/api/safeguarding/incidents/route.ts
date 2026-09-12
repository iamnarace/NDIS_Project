import { userFacingError } from '@/lib/userFacingError';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { logAuditEvent } from '@/lib/audit';
import { isValidUuid, resolveParticipantUuid, resolveStaffUuid, resolveShiftUuid } from '@/lib/uuid';
import {
  assessExternalReportingDuty,
  evaluateRestrictivePracticeBoundary,
  canCloseIncident,
} from '@/lib/services/safeguardingGovernance';

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);
    let supabase: any = null;
    let currentUser: any = null;

    if (isAdmin) {
      supabase = createAdminClient();
    } else {
      supabase = await createClient();
    }

    if (!supabase) return NextResponse.json({ incidents: [] });

    if (!isAdmin) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
      currentUser = user;
    }

    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get('participant_id');
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    const workerId = searchParams.get('worker_id');

    const incidentFields = isAdmin
      ? `*, participant:participants(id, full_name, reference_number, funding_type, suburb), worker:staff(id, full_name, reference_number, role)`
      : `id, incident_reference, participant_id, worker_id, shift_id, reported_by, incident_at, location, category, severity, description, immediate_actions_taken, injury_or_harm_details, emergency_services_contacted, emergency_services_details, witnesses, attachment_urls, safeguarding_indicators, management_regulatory_review_stop, external_reporting_duty, open_disclosure_provided, status, created_at, updated_at, participant:participants(id, full_name, reference_number), worker:staff(id, full_name, reference_number, role)`;

    let query = supabase
      .from('incidents')
      .select(incidentFields)
      .order('incident_at', { ascending: false });

    if (participantId) query = query.eq('participant_id', participantId);
    if (status && status !== 'all') query = query.eq('status', status);
    if (severity && severity !== 'all') query = query.eq('severity', severity);
    if (workerId) query = query.eq('worker_id', workerId);

    // If worker portal, only return incidents they submitted or were involved in
    if (!isAdmin && currentUser) {
      query = query.or(`reported_by.eq.${currentUser.id}`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Incidents query error:', error);
      return NextResponse.json({ incidents: [] });
    }

    return NextResponse.json({ incidents: data || [] });
  } catch (err) {
    console.error('GET /api/safeguarding/incidents error:', err);
    return NextResponse.json({ error: "We couldn't complete this action. Please refresh and try again." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);
    let supabase: any = null;
    let actorId = 'admin';
    let actorType = 'admin';
    let workerStaffId: string | null = null;

    if (isAdmin) {
      supabase = createAdminClient();
    } else {
      supabase = await createClient();
    }

    if (!supabase) return NextResponse.json({ error: "We couldn't complete this action. Please refresh and try again." }, { status: 503 });

    if (!isAdmin) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
      actorId = user.id;
      actorType = 'worker';
      const { data: profile } = await supabase
        .from('profiles')
        .select('portal_staff_id, role, is_active')
        .eq('id', user.id)
        .single();
      if (!profile?.is_active || profile.role !== 'worker' || !profile.portal_staff_id) {
        return NextResponse.json({ error: 'Your account does not have worker portal access.' }, { status: 403 });
      }
      workerStaffId = profile.portal_staff_id;
    }

    const body = await request.json();
    const {
      participant_id,
      worker_id,
      shift_id,
      incident_at,
      location,
      category,
      severity,
      description,
      immediate_actions_taken,
      injury_or_harm_details,
      emergency_services_contacted,
      emergency_services_details,
      witnesses,
      attachment_urls,
      safeguarding_indicators,
      management_regulatory_review_stop,
      external_reporting_duty,
      external_reporting_rationale,
      bsp_reference,
      bsp_practitioner,
      open_disclosure_provided,
      open_disclosure_notes,
    } = body;

    if (!participant_id || !description || !severity) {
      return NextResponse.json(
        { error: 'participant_id, severity, and description are required.' },
        { status: 400 }
      );
    }

    let resolvedParticipantId: string | null;
    let resolvedWorkerId: string | null;
    let resolvedShiftId: string | null;
    if (!isAdmin) {
      if (!isValidUuid(shift_id)) {
        return NextResponse.json({ error: 'Select one of your assigned shifts.' }, { status: 400 });
      }
      const { data: assignedShift } = await supabase
        .from('shifts')
        .select('id, participant_id')
        .eq('id', shift_id)
        .maybeSingle();
      if (!assignedShift) {
        return NextResponse.json({ error: 'This shift is not assigned to you.' }, { status: 403 });
      }
      resolvedParticipantId = assignedShift.participant_id;
      resolvedWorkerId = workerStaffId;
      resolvedShiftId = assignedShift.id;
      supabase = createAdminClient();
      if (!supabase) return NextResponse.json({ error: 'We could not submit this report right now.' }, { status: 503 });
    } else {
      resolvedParticipantId = isValidUuid(participant_id)
        ? participant_id
        : await resolveParticipantUuid(supabase, participant_id);
      resolvedWorkerId = isValidUuid(worker_id)
        ? worker_id
        : await resolveStaffUuid(supabase, worker_id);
      resolvedShiftId = isValidUuid(shift_id)
        ? shift_id
        : await resolveShiftUuid(supabase, shift_id);
    }
    if (!resolvedParticipantId || !isValidUuid(resolvedParticipantId)) {
      return NextResponse.json({ error: 'Select a valid participant.' }, { status: 400 });
    }

    // Process safeguarding indicators and restrictive practice boundary
    const indicators: string[] = Array.isArray(safeguarding_indicators) ? safeguarding_indicators : [];
    const hasRestrictive = indicators.includes('restrictive_practice_concern');
    const restrictiveResult = evaluateRestrictivePracticeBoundary({
      hasRestrictivePracticeIndicator: hasRestrictive,
      bspReference: bsp_reference,
      isRegisteredProvider: false,
    });

    // Assess external reporting duty (enforces unregistered provider boundary)
    const reportingAssessment = assessExternalReportingDuty({
      severity,
      indicators,
      emergencyServicesContacted: Boolean(emergency_services_contacted),
      workerWorkplaceInjury: category === 'worker_injury' || category === 'whs',
    });

    const finalReviewStop = Boolean(management_regulatory_review_stop) || restrictiveResult.managementRegulatoryReviewStop;
    const finalDuty = external_reporting_duty || reportingAssessment.duty;
    const finalRationale = external_reporting_rationale || reportingAssessment.rationale;

    // Generate unique reference INC-YYYY-XXXX
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from('incidents')
      .select('*', { count: 'exact', head: true });
    const ref = `INC-${year}-${String((count ?? 0) + 1).padStart(4, '0')}`;

    const { data, error } = await supabase
      .from('incidents')
      .insert({
        incident_reference: ref,
        participant_id: resolvedParticipantId,
        worker_id: resolvedWorkerId,
        shift_id: resolvedShiftId,
        reported_by: actorType === 'worker' ? actorId : null,
        incident_at: incident_at || new Date().toISOString(),
        location: location || null,
        category: category || 'other',
        severity,
        description,
        immediate_actions_taken: immediate_actions_taken || null,
        injury_or_harm_details: injury_or_harm_details || null,
        emergency_services_contacted: Boolean(emergency_services_contacted),
        emergency_services_details: emergency_services_details || null,
        witnesses: witnesses || null,
        attachment_urls: attachment_urls || [],
        status: 'Reported',
        reportable_assessment: 'Pending Review',
        external_notification_status: 'Not Required',
        safeguarding_indicators: indicators,
        management_regulatory_review_stop: finalReviewStop,
        external_reporting_duty: finalDuty,
        external_reporting_rationale: finalRationale,
        bsp_reference: bsp_reference || null,
        bsp_practitioner: bsp_practitioner || null,
        open_disclosure_provided: Boolean(open_disclosure_provided),
        open_disclosure_notes: open_disclosure_notes || null,
      })
      .select(isAdmin
        ? '*, participant:participants(id, full_name, reference_number), worker:staff(id, full_name, role)'
        : 'id, incident_reference, participant_id, worker_id, shift_id, reported_by, incident_at, location, category, severity, description, immediate_actions_taken, injury_or_harm_details, emergency_services_contacted, emergency_services_details, witnesses, attachment_urls, safeguarding_indicators, management_regulatory_review_stop, external_reporting_duty, open_disclosure_provided, status, created_at, updated_at, participant:participants(id, full_name, reference_number), worker:staff(id, full_name, role)')
      .single();

    if (error) {
      console.error('Incident insert error:', error);
      return NextResponse.json({ error: userFacingError(error.message) }, { status: 500 });
    }

    // Link back to shift_progress_notes if shift_id or progress_note_id provided
    if (body.progress_note_id) {
      await supabase
        .from('shift_progress_notes')
        .update({ incident_id: data.id, incident_occurred: true })
        .eq('id', body.progress_note_id);
    } else if (shift_id) {
      await supabase
        .from('shift_progress_notes')
        .update({ incident_id: data.id, incident_occurred: true })
        .eq('shift_id', shift_id);
    }

    // Record audit event
    await logAuditEvent({
      entity_type: 'incident',
      entity_id: data.id,
      actor_type: actorType,
      actor_id: actorId,
      action: 'created',
      changes: {
        status: 'Reported',
        severity,
        category,
        indicators,
        management_regulatory_review_stop: finalReviewStop,
        external_reporting_duty: finalDuty,
      },
      metadata: { incident_reference: ref, participant_id: resolvedParticipantId },
    });

    return NextResponse.json({ incident: data }, { status: 201 });
  } catch (err) {
    console.error('POST /api/safeguarding/incidents error:', err);
    return NextResponse.json({ error: "We couldn't complete this action. Please refresh and try again." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);
    let supabase: any = null;
    let actorId = 'admin';

    if (isAdmin) {
      supabase = createAdminClient();
    } else {
      supabase = await createClient();
    }

    if (!supabase) return NextResponse.json({ error: "We couldn't complete this action. Please refresh and try again." }, { status: 503 });

    if (!isAdmin) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
      actorId = user.id;
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Incident ID is required' }, { status: 400 });
    }

    if ('participant_family_followup' in updates) {
      updates.participant_family_follow_up = updates.participant_family_followup;
      delete updates.participant_family_followup;
    }

    // Check existing incident before status change or closure
    const { data: existingIncident } = await supabase
      .from('incidents')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!existingIncident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    // If updating safeguarding indicators, check restrictive practice concern
    if (Array.isArray(updates.safeguarding_indicators)) {
      if (updates.safeguarding_indicators.includes('restrictive_practice_concern')) {
        updates.management_regulatory_review_stop = true;
      }
    }

    // If closing, enforce G4 closure guard
    if (updates.status === 'Closed') {
      const merged = { ...existingIncident, ...updates };
      const actorRole = isAdmin ? 'admin' : 'staff';
      const closureGate = canCloseIncident(merged, actorRole);
      if (!closureGate.allowed) {
        return NextResponse.json({ error: closureGate.reason }, { status: 403 });
      }

      if (!updates.closed_at) {
        updates.closed_at = new Date().toISOString();
        updates.closed_by = actorId !== 'admin' ? actorId : null;
      }
    }

    const { data, error } = await supabase
      .from('incidents')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`
        *,
        participant:participants(id, full_name, reference_number),
        worker:staff(id, full_name, role)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: userFacingError(error.message) }, { status: 500 });
    }

    // Record audit event
    await logAuditEvent({
      entity_type: 'incident',
      entity_id: id,
      actor_type: isAdmin ? 'admin' : 'staff',
      actor_id: actorId,
      action: updates.status ? 'status_changed' : 'updated',
      changes: updates,
      metadata: { incident_reference: data.incident_reference },
    });

    return NextResponse.json({ incident: data });
  } catch (err) {
    console.error('PATCH /api/safeguarding/incidents error:', err);
    return NextResponse.json({ error: "We couldn't complete this action. Please refresh and try again." }, { status: 500 });
  }
}
