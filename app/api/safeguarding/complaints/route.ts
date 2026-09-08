import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { logAuditEvent } from '@/lib/audit';

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

    if (!isAdmin) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const participantId = searchParams.get('participant_id');

    let query = supabase
      .from('complaints')
      .select(`
        *,
        participant:participants(id, full_name, reference_number),
        linked_incident:incidents(id, incident_reference, severity, status)
      `)
      .order('received_date', { ascending: false });

    if (status && status !== 'all') query = query.eq('status', status);
    if (participantId) query = query.eq('participant_id', participantId);

    const { data, error } = await query;
    if (error) {
      console.error('Complaints query error:', error);
      return NextResponse.json({ complaints: [] });
    }

    return NextResponse.json({ complaints: data || [] });
  } catch (err) {
    console.error('GET /api/safeguarding/complaints error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);
    let supabase: any = null;
    let actorId = 'admin';
    let actorType = 'admin';

    if (isAdmin) {
      supabase = createAdminClient();
    } else {
      supabase = await createClient();
    }

    if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });

    if (!isAdmin) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (user) {
        actorId = user.id;
        actorType = 'portal_user';
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
    } = body;

    const resolvedSummary = summary || body.title || body.description?.slice(0, 100) || '';
    const resolvedDetails = details || body.description || '';
    const resolvedRole = complainant_role || body.complainant_type || 'Participant';
    const resolvedContact = contact_details || body.complainant_contact || null;

    if (!complainant_name || !resolvedSummary || !resolvedDetails) {
      return NextResponse.json(
        { error: 'complainant_name, summary, and details are required.' },
        { status: 400 }
      );
    }

    // Generate unique reference CMP-YYYY-XXXX
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true });
    const ref = `CMP-${year}-${String((count ?? 0) + 1).padStart(4, '0')}`;

    const { data, error } = await supabase
      .from('complaints')
      .insert({
        complaint_reference: ref,
        participant_id: participant_id || null,
        complainant_name,
        complainant_role: resolvedRole,
        contact_details: resolvedContact,
        source: source || 'Portal',
        received_date: received_date || new Date().toISOString().split('T')[0],
        summary: resolvedSummary,
        details: resolvedDetails,
        immediate_safety_issue: Boolean(immediate_safety_issue),
        linked_incident_id: linked_incident_id || null,
        assigned_manager: assigned_manager || null,
        status: 'Received',
      })
      .select(`
        *,
        participant:participants(id, full_name, reference_number),
        linked_incident:incidents(id, incident_reference, severity, status)
      `)
      .single();

    if (error) {
      console.error('Complaint insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Record audit event
    await logAuditEvent({
      entity_type: 'complaint',
      entity_id: data.id,
      actor_type: actorType,
      actor_id: actorId,
      action: 'created',
      changes: { status: 'Received', immediate_safety_issue },
      metadata: { complaint_reference: ref },
    });

    return NextResponse.json({ complaint: data }, { status: 201 });
  } catch (err) {
    console.error('POST /api/safeguarding/complaints error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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

    if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });

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
      return NextResponse.json({ error: error.message }, { status: 500 });
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
