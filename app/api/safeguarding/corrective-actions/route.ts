import { userFacingError } from '@/lib/userFacingError';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { logAuditEvent } from '@/lib/audit';
import { isValidUuid, resolveIncidentUuid } from '@/lib/uuid';

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorised' }, { status: 403 });
    const supabase: any = createAdminClient();

    if (!supabase) return NextResponse.json({ actions: [] });

    const { searchParams } = new URL(request.url);
    const sourceType = searchParams.get('source_type');
    const sourceId = searchParams.get('source_id');
    const status = searchParams.get('status');

    let query = supabase
      .from('corrective_actions')
      .select('*')
      .order('due_date', { ascending: true });

    if (sourceType) query = query.eq('source_type', sourceType);
    if (sourceId) query = query.eq('source_id', sourceId);
    if (status && status !== 'all') query = query.eq('status', status);

    const { data, error } = await query;
    if (error) {
      console.error('Corrective actions query error:', error);
      return NextResponse.json({ actions: [] });
    }

    return NextResponse.json({ actions: data || [] });
  } catch (err) {
    console.error('GET /api/safeguarding/corrective-actions error:', err);
    return NextResponse.json({ error: "We couldn't complete this action. Please refresh and try again." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);
    let supabase: any = null;
    let actorId = 'admin';

    if (!isAdmin) return NextResponse.json({ error: 'Unauthorised' }, { status: 403 });
    supabase = createAdminClient();

    if (!supabase) return NextResponse.json({ error: "We couldn't complete this action. Please refresh and try again." }, { status: 503 });

    const body = await request.json();
    const {
      source_type,
      source_id,
      action_description,
      owner,
      due_date,
      priority,
      notes,
    } = body;

    if (!source_type || !source_id || !action_description || !owner || !due_date) {
      return NextResponse.json(
        { error: 'source_type, source_id, action_description, owner, and due_date are required.' },
        { status: 400 }
      );
    }

    let resolvedSourceId = source_id;
    if (!isValidUuid(source_id)) {
      if (source_type === 'incident') {
        resolvedSourceId = await resolveIncidentUuid(supabase, source_id);
      } else if (source_type === 'complaint') {
        const { data: cData } = await supabase.from('complaints').select('id').eq('complaint_reference', source_id).maybeSingle();
        if (cData?.id) resolvedSourceId = cData.id;
      }
    }

    if (!resolvedSourceId || !isValidUuid(resolvedSourceId)) {
      return NextResponse.json({ error: "We couldn't complete this action. Please refresh and try again." }, { status: 400 });
    }

    // Generate unique reference CAP-YYYY-XXXX
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from('corrective_actions')
      .select('*', { count: 'exact', head: true });
    const ref = `CAP-${year}-${String((count ?? 0) + 1).padStart(4, '0')}`;

    const { data, error } = await supabase
      .from('corrective_actions')
      .insert({
        action_reference: ref,
        source_type,
        source_id: resolvedSourceId,
        action_description,
        owner,
        due_date,
        priority: priority || 'Medium',
        status: 'Open',
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Corrective action insert error:', error);
      return NextResponse.json({ error: userFacingError(error.message) }, { status: 500 });
    }

    // Record audit event
    await logAuditEvent({
      entity_type: 'corrective_action',
      entity_id: data.id,
      actor_type: isAdmin ? 'admin' : 'staff',
      actor_id: actorId,
      action: 'created',
      changes: { source_type, source_id, status: 'Open' },
      metadata: { action_reference: ref },
    });

    return NextResponse.json({ action: data }, { status: 201 });
  } catch (err) {
    console.error('POST /api/safeguarding/corrective-actions error:', err);
    return NextResponse.json({ error: "We couldn't complete this action. Please refresh and try again." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);
    let supabase: any = null;
    let actorId = 'admin';

    if (!isAdmin) return NextResponse.json({ error: 'Unauthorised' }, { status: 403 });
    supabase = createAdminClient();

    if (!supabase) return NextResponse.json({ error: "We couldn't complete this action. Please refresh and try again." }, { status: 503 });

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Action ID is required' }, { status: 400 });
    }

    if ('completion_evidence' in updates) {
      updates.evidence_reference = updates.completion_evidence;
      delete updates.completion_evidence;
    }

    // If marked Completed, set completed_at
    if (updates.status === 'Completed' && !updates.completed_at) {
      updates.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('corrective_actions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: userFacingError(error.message) }, { status: 500 });
    }

    // Record audit event
    await logAuditEvent({
      entity_type: 'corrective_action',
      entity_id: id,
      actor_type: isAdmin ? 'admin' : 'staff',
      actor_id: actorId,
      action: updates.status ? 'status_changed' : 'updated',
      changes: updates,
      metadata: { action_reference: data.action_reference },
    });

    return NextResponse.json({ action: data });
  } catch (err) {
    console.error('PATCH /api/safeguarding/corrective-actions error:', err);
    return NextResponse.json({ error: "We couldn't complete this action. Please refresh and try again." }, { status: 500 });
  }
}
