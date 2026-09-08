import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { isValidUuid } from '@/lib/uuid';
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

    if (!supabase) return NextResponse.json({ records: [] });

    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get('staff_id');
    const participantId = searchParams.get('participant_id');
    const status = searchParams.get('status');

    let query = supabase
      .from('travel_records')
      .select(`
        *,
        staff:staff(id, full_name, role, reference_number),
        participant:participants(id, full_name, reference_number),
        shift:shifts(id, shift_reference, service_type, start_time)
      `)
      .order('created_at', { ascending: false });

    if (staffId && isValidUuid(staffId)) query = query.eq('staff_id', staffId);
    if (participantId && isValidUuid(participantId)) query = query.eq('participant_id', participantId);
    if (status && status !== 'all') query = query.eq('approval_status', status);

    const { data, error } = await query;
    if (error) return NextResponse.json({ records: [] });

    return NextResponse.json({ records: data || [] });
  } catch (err) {
    console.error('GET /api/workforce/travel error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorised' }, { status: 403 });

    const supabase = createAdminClient();
    if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });

    const body = await request.json();
    const { id, approval_status, notes } = body;

    if (!id || !isValidUuid(id)) {
      return NextResponse.json({ error: 'Valid travel record ID is required.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('travel_records')
      .update({
        approval_status: approval_status || 'Approved',
        notes: notes || null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await logAuditEvent({
      entity_type: 'travel_records',
      entity_id: id,
      actor_type: 'admin',
      actor_id: 'admin',
      action: 'travel_approval_updated',
      metadata: { approval_status, notes },
    });

    return NextResponse.json({ record: data });
  } catch (err: any) {
    console.error('PATCH /api/workforce/travel error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
