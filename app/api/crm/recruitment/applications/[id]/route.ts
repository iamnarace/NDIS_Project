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

  const { data: application, error } = await supabase
    .from('job_applications')
    .select(`
      *,
      job_vacancies (
        id,
        reference_number,
        title,
        slug,
        category,
        service_area_ids,
        employment_basis,
        status
      )
    `)
    .eq('id', id)
    .single();

  if (error || !application) {
    return NextResponse.json({ ok: false, error: 'Application not found.' }, { status: 404 });
  }

  // 1. Files metadata (on-demand signed URLs generated via /files/[fileId])
  const { data: rawFiles } = await supabase
    .from('job_application_files')
    .select('id, file_kind, file_name, file_size, mime_type, created_at')
    .eq('application_id', id);

  const filesMetadata = (rawFiles || []).map((f: any) => ({
    id: f.id,
    file_kind: f.file_kind,
    file_name: f.file_name,
    file_size: f.file_size,
    mime_type: f.mime_type,
    created_at: f.created_at
  }));

  // 2. Timeline events
  const { data: events } = await supabase
    .from('job_application_events')
    .select('*')
    .eq('application_id', id)
    .order('created_at', { ascending: true });

  // 3. Interviews
  const { data: interviews } = await supabase
    .from('job_interviews')
    .select('*')
    .eq('application_id', id)
    .order('scheduled_at', { ascending: false });

  // 4. Reference checks
  const { data: references } = await supabase
    .from('job_reference_checks')
    .select('*')
    .eq('application_id', id)
    .order('created_at', { ascending: false });

  // 5. Linked staff record if hired
  let linkedStaff = null;
  const staffId = application.hired_staff_id || application.converted_staff_id;
  if (staffId) {
    const { data: staffData } = await supabase
      .from('staff')
      .select('id, reference_number, full_name, status, lifecycle_stage, is_rosterable, employment_basis, created_at')
      .eq('id', staffId)
      .maybeSingle();
    linkedStaff = staffData || null;
  }

  return NextResponse.json({
    ok: true,
    application: {
      ...application,
      files: filesMetadata,
      events: events || [],
      interviews: interviews || [],
      references: references || [],
      linked_staff: linkedStaff
    }
  });
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
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    if (body.retention_until !== undefined) {
      updates.retention_until = body.retention_until;
    }

    const { data: updated, error } = await supabase
      .from('job_applications')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: userFacingError(error.message) }, { status: 500 });
    }

    return NextResponse.json({ ok: true, application: updated });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Invalid update payload.' }, { status: 400 });
  }
}

export async function DELETE(
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
    const body = await req.json().catch(() => ({}));
    if (!body.confirm_purge) {
      return NextResponse.json({
        ok: false,
        error: 'Purge action requires explicit confirmation ({ confirm_purge: true }).'
      }, { status: 400 });
    }

    const purgeReason = String(body.purge_reason || 'Retention period expired / Candidate privacy redaction').trim();
    if (purgeReason.length < 3) {
      return NextResponse.json({
        ok: false,
        error: 'Purge reason must be at least 3 characters long.'
      }, { status: 400 });
    }

    // Check application existence and stage eligibility
    const { data: appToPurge, error: fetchErr } = await supabase
      .from('job_applications')
      .select('id, stage, purged_at')
      .eq('id', id)
      .single();

    if (fetchErr || !appToPurge) {
      return NextResponse.json({ ok: false, error: 'Application not found.' }, { status: 404 });
    }

    if (appToPurge.purged_at) {
      return NextResponse.json({ ok: false, error: 'Application has already been purged.' }, { status: 400 });
    }

    if (!['unsuccessful', 'withdrawn'].includes(appToPurge.stage)) {
      return NextResponse.json({
        ok: false,
        error: `Cannot purge candidate in active or hired stage '${appToPurge.stage}'. Purge is restricted strictly to unsuccessful or withdrawn applications.`
      }, { status: 400 });
    }

    // 1. Find all private files for this application
    const { data: files } = await supabase
      .from('job_application_files')
      .select('storage_path')
      .eq('application_id', id);

    if (files && files.length > 0) {
      const paths = files.map((f: any) => f.storage_path);
      const { error: removeErr } = await supabase.storage.from('crm-documents').remove(paths);
      if (removeErr) {
        return NextResponse.json({ ok: false, error: 'Storage deletion failed. Purge aborted to ensure data consistency.' }, { status: 500 });
      }
    }

    // 2. Delete file rows
    await supabase.from('job_application_files').delete().eq('application_id', id);

    // 3. Perform governed PII redaction on job_applications record
    const nowIso = new Date().toISOString();
    const { data: redactedApp, error: redactError } = await supabase
      .from('job_applications')
      .update({
        first_name: '[REDACTED]',
        last_name: '[REDACTED]',
        email: `purged-${id}@redacted.internal`,
        phone: '[REDACTED]',
        suburb: '[REDACTED]',
        postcode: '0000',
        experience_summary: null,
        qualification_summary: null,
        availability_notes: null,
        motivation: null,
        role_interest_other: null,
        purged_at: nowIso,
        purged_by: actorId,
        purge_reason: purgeReason,
        updated_at: nowIso
      })
      .eq('id', id)
      .select('*')
      .single();

    if (redactError) {
      return NextResponse.json({ ok: false, error: userFacingError(redactError.message) }, { status: 500 });
    }

    // 4. Log immutable timeline event
    try {
      await supabase.from('job_application_events').insert({
        application_id: id,
        event_type: 'application_purged',
        note: `Application PII and attachments purged under privacy governance: ${purgeReason}`,
        actor: actorId
      });
    } catch {}

    return NextResponse.json({
      ok: true,
      message: 'Application PII redacted and private documents purged successfully.',
      application: redactedApp
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to purge application.' }, { status: 500 });
  }
}
