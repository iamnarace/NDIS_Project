import { userFacingError } from '@/lib/userFacingError';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { logAuditEvent } from '@/lib/audit';
import { isValidUuid, resolveParticipantUuid, resolveIncidentUuid } from '@/lib/uuid';
import { processComplaintLodgement } from '@/lib/services/safeguardingGovernance';

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);
    let supabase: any = null;

    if (isAdmin) {
      supabase = createAdminClient();
    } else {
      supabase = await createClient();
    }

    if (!supabase) return NextResponse.json({ complaints: [] });

    let currentParticipantId: string | null = null;
    if (!isAdmin) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        // Public users cannot browse complaints register
        return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('portal_participant_id, role, is_active')
        .eq('id', user.id)
        .single();
      if (!profile?.is_active || profile.role !== 'participant' || !profile.portal_participant_id) {
        return NextResponse.json({ error: 'Unauthorised' }, { status: 403 });
      }
      currentParticipantId = profile.portal_participant_id;
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const participantId = searchParams.get('participant_id');

    const complaintFields = isAdmin
      ? '*, participant:participants(id, full_name, reference_number), linked_incident:incidents(id, incident_reference, severity, status)'
      : 'id, complaint_reference, participant_id, complainant_name, complainant_role, received_date, summary, status, acknowledgement_date, response_target_date, resolution_summary, closed_at, created_at, updated_at, participant:participants(id, full_name, reference_number)';

    let query = supabase
      .from('complaints')
      .select(complaintFields)
      .order('received_date', { ascending: false });

    if (status && status !== 'all') query = query.eq('status', status);
    if (isAdmin && participantId) {
      query = query.eq('participant_id', participantId);
    } else if (!isAdmin && currentParticipantId) {
      query = query.eq('participant_id', currentParticipantId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Complaints query error:', error);
      return NextResponse.json({ complaints: [] });
    }

    return NextResponse.json({ complaints: data || [] });
  } catch (err) {
    console.error('GET /api/safeguarding/complaints error:', err);
    return NextResponse.json({ error: "We couldn't complete this action. Please refresh and try again." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);
    let supabase: any = null;
    let actorId = 'admin';
    let actorType = 'admin';
    let portalParticipantId: string | null = null;

    if (isAdmin) {
      supabase = createAdminClient();
    } else {
      supabase = await createClient();
    }

    if (!isAdmin && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        actorId = user.id;
        actorType = 'participant';
        const { data: profile } = await supabase
          .from('profiles')
          .select('portal_participant_id, role, is_active')
          .eq('id', user.id)
          .single();
        if (profile?.is_active && profile.role === 'participant' && profile.portal_participant_id) {
          portalParticipantId = profile.portal_participant_id;
        }
      } else {
        // Public complaint / feedback lodgement allowed per G4 spec
        actorId = 'public';
        actorType = 'public';
      }
    }

    const body = await request.json();
    const {
      participant_id,
      complainant_name,
      complainant_role,
      contact_details,
      source,
      received_date,
      summary,
      details,
      immediate_safety_issue,
      linked_incident_id,
      assigned_manager,
      is_anonymous,
      advocate_name,
      advocate_relationship,
      advocate_contact,
      accessibility_communication_needs,
      category,
      urgency,
    } = body;

    const resolvedSummary = summary || body.title || body.description?.slice(0, 100) || '';
    const resolvedDetails = details || body.description || '';
    const resolvedName = Boolean(is_anonymous) ? 'Anonymous' : (complainant_name || body.name || 'Participant / Complainant');

    if (!resolvedSummary || !resolvedDetails) {
      return NextResponse.json(
        { error: 'Summary and details are required to submit a complaint.' },
        { status: 400 }
      );
    }

    // Always use admin client for database insert to ensure unauthenticated public lodgement succeeds
    const insertClient = createAdminClient() || supabase;
    if (!insertClient) {
      return NextResponse.json({ error: "We couldn't complete this action. Please refresh and try again." }, { status: 503 });
    }

    let resolvedParticipantId = Boolean(is_anonymous) ? null : (portalParticipantId || participant_id || null);
    if (isAdmin && resolvedParticipantId && !isValidUuid(resolvedParticipantId)) {
      resolvedParticipantId = await resolveParticipantUuid(insertClient, resolvedParticipantId);
    }

    let resolvedLinkedIncidentId = linked_incident_id || null;
    if (!isAdmin) {
      resolvedLinkedIncidentId = null;
    } else if (resolvedLinkedIncidentId && !isValidUuid(resolvedLinkedIncidentId)) {
      resolvedLinkedIncidentId = await resolveIncidentUuid(insertClient, resolvedLinkedIncidentId);
    }

    // Process complaint through governance engine
    const processed = processComplaintLodgement({
      is_anonymous: Boolean(is_anonymous),
      complainant_name: resolvedName,
      complainant_role,
      contact_details,
      advocate_name,
      advocate_relationship,
      advocate_contact,
      accessibility_communication_needs,
      category,
      urgency,
      immediate_safety_issue: Boolean(immediate_safety_issue),
      summary: resolvedSummary,
      details: resolvedDetails,
      source: source || (isAdmin ? 'Admin' : (actorType === 'public' ? 'Public Website' : 'Participant Portal')),
      participant_id: resolvedParticipantId,
    });

    // Generate unique reference CMP-YYYY-XXXX
    const year = new Date().getFullYear();
    const { count } = await insertClient
      .from('complaints')
      .select('*', { count: 'exact', head: true });
    const ref = `CMP-${year}-${String((count ?? 0) + 1).padStart(4, '0')}`;

    const { data, error } = await insertClient
      .from('complaints')
      .insert({
        complaint_reference: ref,
        participant_id: processed.participant_id,
        complainant_name: processed.complainant_name,
        complainant_role: processed.complainant_role,
        contact_details: processed.contact_details,
        source: processed.source,
        received_date: received_date || new Date().toISOString().split('T')[0],
        summary: processed.summary,
        details: processed.details,
        immediate_safety_issue: processed.immediate_safety_issue,
        linked_incident_id: resolvedLinkedIncidentId,
        assigned_manager: isAdmin ? (assigned_manager || null) : null,
        is_anonymous: processed.is_anonymous,
        advocate_name: processed.advocate_name,
        advocate_relationship: processed.advocate_relationship,
        advocate_contact: processed.advocate_contact,
        accessibility_communication_needs: processed.accessibility_communication_needs,
        category: processed.category,
        urgency: processed.urgency,
        response_target_date: processed.response_target_date,
        status: 'Received',
      })
      .select(isAdmin
        ? '*, participant:participants(id, full_name, reference_number), linked_incident:incidents(id, incident_reference, severity, status)'
        : 'id, complaint_reference, participant_id, complainant_name, complainant_role, received_date, summary, status, response_target_date, created_at')
      .single();

    if (error) {
      console.error('Complaint insert error:', error);
      return NextResponse.json({ error: userFacingError(error.message) }, { status: 500 });
    }

    // Record audit event
    await logAuditEvent({
      entity_type: 'complaint',
      entity_id: data.id,
      actor_type: actorType,
      actor_id: actorId,
      action: 'created',
      changes: { status: 'Received', urgency: processed.urgency, is_anonymous: processed.is_anonymous },
      metadata: { complaint_reference: ref },
    });

    return NextResponse.json({ complaint: data }, { status: 201 });
  } catch (err) {
    console.error('POST /api/safeguarding/complaints error:', err);
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
      return NextResponse.json({ error: 'Complaint ID is required' }, { status: 400 });
    }

    if ('acknowledged_at' in updates) {
      updates.acknowledgement_date = String(updates.acknowledged_at).split('T')[0];
      delete updates.acknowledged_at;
    }
    if ('resolution_notes' in updates) {
      updates.resolution_summary = updates.resolution_notes;
      delete updates.resolution_notes;
    }
    if ('resolved_by' in updates) {
      updates.assigned_manager = updates.resolved_by;
      delete updates.resolved_by;
    }
    if ('complainant_satisfied' in updates) {
      if (!updates.outcome) {
        updates.outcome = updates.complainant_satisfied ? 'Satisfied / Resolved' : 'Unsatisfied / Escalated';
      }
      delete updates.complainant_satisfied;
    }

    // If closing, set closed_at
    if (updates.status === 'Closed' && !updates.closed_at) {
      updates.closed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('complaints')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`
        *,
        participant:participants(id, full_name, reference_number),
        linked_incident:incidents(id, incident_reference, severity, status)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: userFacingError(error.message) }, { status: 500 });
    }

    // Record audit event
    await logAuditEvent({
      entity_type: 'complaint',
      entity_id: id,
      actor_type: isAdmin ? 'admin' : 'staff',
      actor_id: actorId,
      action: updates.status ? 'status_changed' : 'updated',
      changes: updates,
      metadata: { complaint_reference: data.complaint_reference },
    });

    return NextResponse.json({ complaint: data });
  } catch (err) {
    console.error('PATCH /api/safeguarding/complaints error:', err);
    return NextResponse.json({ error: "We couldn't complete this action. Please refresh and try again." }, { status: 500 });
  }
}
