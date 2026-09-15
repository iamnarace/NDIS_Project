import { NextResponse } from 'next/server';
import { getAuthenticatedAdminActor, isAuthenticatedAdmin } from '@/lib/adminAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import { userFacingError } from '@/lib/userFacingError';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) {
    return NextResponse.json({ ok: false, error: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Database service unavailable.' }, { status: 503 });
  }

  const { data: references, error } = await supabase
    .from('job_reference_checks')
    .select('*')
    .eq('application_id', id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: userFacingError(error.message) }, { status: 500 });
  }

  return NextResponse.json({ ok: true, references: references || [] });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actorId = await getAuthenticatedAdminActor(req);
  if (!actorId) {
    return NextResponse.json({ ok: false, error: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Database service unavailable.' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const refereeName = String(body.referee_name || '').trim();
    const relationship = String(body.relationship || '').trim();

    if (!refereeName) {
      return NextResponse.json({ ok: false, error: 'Referee name is required.' }, { status: 400 });
    }
    if (!relationship) {
      return NextResponse.json({ ok: false, error: 'Professional relationship is required.' }, { status: 400 });
    }

    const { data: reference, error: insertErr } = await supabase
      .from('job_reference_checks')
      .insert({
        application_id: id,
        referee_name: refereeName,
        relationship: relationship,
        organisation: body.organisation || null,
        phone: body.phone || null,
        email: body.email || null,
        applicant_consent_confirmed: Boolean(body.applicant_consent_confirmed),
        status: body.status || 'pending',
        checked_at: body.checked_at || null,
        checked_by: body.checked_by || actorId,
        notes: body.notes || null,
        outcome: body.outcome || null
      })
      .select('*')
      .single();

    if (insertErr) {
      return NextResponse.json({ ok: false, error: userFacingError(insertErr.message) }, { status: 500 });
    }

    await supabase.from('job_application_events').insert({
      application_id: id,
      event_type: 'reference_check_recorded',
      note: `Reference check added for referee: ${refereeName} (${relationship})`,
      actor: actorId
    });

    return NextResponse.json({ ok: true, reference });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Invalid reference check request.' }, { status: 400 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actorId = await getAuthenticatedAdminActor(req);
  if (!actorId) {
    return NextResponse.json({ ok: false, error: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Database service unavailable.' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const referenceId = body.reference_id;
    if (!referenceId) {
      return NextResponse.json({ ok: false, error: 'Reference check ID is required.' }, { status: 400 });
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString()
    };
    if (body.status !== undefined) updates.status = body.status;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.outcome !== undefined) updates.outcome = body.outcome;
    if (body.checked_at !== undefined) updates.checked_at = body.checked_at;
    if (body.checked_by !== undefined) updates.checked_by = body.checked_by;

    const { data: updated, error } = await supabase
      .from('job_reference_checks')
      .update(updates)
      .eq('id', referenceId)
      .eq('application_id', id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: userFacingError(error.message) }, { status: 500 });
    }

    await supabase.from('job_application_events').insert({
      application_id: id,
      event_type: 'reference_check_updated',
      note: `Reference check updated: status=${updated.status}, outcome=${updated.outcome || 'pending'}`,
      actor: actorId
    });

    return NextResponse.json({ ok: true, reference: updated });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Invalid reference check update.' }, { status: 400 });
  }
}
