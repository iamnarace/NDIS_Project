import { userFacingError } from '@/lib/userFacingError';
import { NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET  /api/training/completions?staff_id=...&course_id=...
 * POST /api/training/completions  — Read & Acknowledge completion (no quiz)
 * PATCH /api/training/completions — Upload external certificate
 */

export async function GET(req: Request) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ message: "We couldn't complete this action. Please refresh and try again." }, { status: 503 });

  const { searchParams } = new URL(req.url);
  const staffId = searchParams.get('staff_id');
  const courseId = searchParams.get('course_id');

  let query = supabase
    .from('training_completions')
    .select('*, training_courses(title, course_type, validity_months)')
    .order('completed_at', { ascending: false });

  if (staffId) query = query.eq('staff_id', staffId);
  if (courseId) query = query.eq('course_id', courseId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ message: userFacingError(error.message) }, { status: 500 });

  // For completions with cert_storage_path, generate signed URLs
  const enriched = await Promise.all(
    (data ?? []).map(async (c: Record<string, unknown>) => {
      if (c.cert_storage_path) {
        const { data: signed } = await supabase.storage
          .from('crm-documents')
          .createSignedUrl(c.cert_storage_path as string, 3600);
        return { ...c, cert_download_url: signed?.signedUrl ?? null };
      }
      return { ...c, cert_download_url: null };
    })
  );

  return NextResponse.json(enriched);
}

export async function POST(req: Request) {
  // Read & Acknowledge completion
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ message: "We couldn't complete this action. Please refresh and try again." }, { status: 503 });

  try {
    const body = await req.json();
    const { course_id, assignment_id, staff_id, staff_name } = body;

    if (!course_id || !staff_id) {
      return NextResponse.json({ message: 'course_id and staff_id required' }, { status: 400 });
    }

    // Validate course exists and is read_acknowledge type
    const { data: course, error: cErr } = await supabase
      .from('training_courses')
      .select('course_type, validity_months, certificate_enabled, title')
      .eq('id', course_id)
      .single();

    if (cErr || !course) return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    if (course.course_type !== 'read_acknowledge') {
      return NextResponse.json({ message: 'This endpoint is for Read & Acknowledge courses only' }, { status: 400 });
    }

    // Check for duplicate completion
    const { data: existing } = await supabase
      .from('training_completions')
      .select('id')
      .eq('course_id', course_id)
      .eq('staff_id', staff_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ message: 'Already completed', ok: true });
    }

    // Generate certificate ID
    let certificateId: string | null = null;
    let expiresAt: string | null = null;

    if (course.certificate_enabled) {
      const year = new Date().getFullYear();
      const rand = Math.floor(Math.random() * 90000) + 10000;
      certificateId = `OC-TRN-${year}-${rand}`;
    }

    if (course.validity_months) {
      const exp = new Date();
      exp.setMonth(exp.getMonth() + course.validity_months);
      expiresAt = exp.toISOString();
    }

    const { data: completion, error } = await supabase
      .from('training_completions')
      .insert({
        course_id,
        assignment_id: assignment_id ?? null,
        staff_id,
        staff_name: staff_name ?? null,
        passed: true,
        expires_at: expiresAt,
        certificate_id: certificateId,
        certificate_issue_date: new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (error) return NextResponse.json({ message: userFacingError(error.message) }, { status: 500 });
    return NextResponse.json({ ok: true, completion });
  } catch (err) {
    console.error('Acknowledge completion error:', err);
    return NextResponse.json({ message: 'Failed to record completion' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  // External certificate upload (file upload handled via FormData)
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ message: "We couldn't complete this action. Please refresh and try again." }, { status: 503 });

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const courseId = formData.get('course_id') as string;
    const assignmentId = formData.get('assignment_id') as string | null;
    const staffId = formData.get('staff_id') as string;
    const staffName = formData.get('staff_name') as string | null;
    const externalIssuer = formData.get('external_issuer') as string | null;
    const externalExpiryDate = formData.get('external_expiry_date') as string | null;
    const notes = formData.get('notes') as string | null;

    if (!courseId || !staffId) {
      return NextResponse.json({ message: 'course_id and staff_id required' }, { status: 400 });
    }

    let storagePath: string | null = null;
    let fileName: string | null = null;

    if (file) {
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      storagePath = `training/${staffId}/${Date.now()}_${safeFileName}`;
      fileName = file.name;
      const buffer = Buffer.from(await file.arrayBuffer());

      const { error: uploadErr } = await supabase.storage
        .from('crm-documents')
        .upload(storagePath, buffer, {
          contentType: file.type || 'application/pdf',
          upsert: false,
        });

      if (uploadErr) {
        console.error('Certificate upload error:', uploadErr);
        return NextResponse.json({ message: userFacingError('File upload failed: ' + uploadErr.message) }, { status: 500 });
      }
    }

    // Upsert completion record (external certs don't have a pass mark)
    const { data: completion, error } = await supabase
      .from('training_completions')
      .upsert({
        course_id: courseId,
        assignment_id: assignmentId ?? null,
        staff_id: staffId,
        staff_name: staffName ?? null,
        passed: true,
        external_issuer: externalIssuer ?? null,
        external_expiry_date: externalExpiryDate ?? null,
        cert_file_name: fileName,
        cert_storage_path: storagePath,
        notes: notes ?? null,
        certificate_issue_date: new Date().toISOString().split('T')[0],
      }, { onConflict: 'course_id,staff_id' } as Record<string, unknown>)
      .select()
      .single();

    if (error) return NextResponse.json({ message: userFacingError(error.message) }, { status: 500 });
    return NextResponse.json({ ok: true, completion });
  } catch (err) {
    console.error('External cert upload error:', err);
    return NextResponse.json({ message: 'Failed to upload certificate' }, { status: 500 });
  }
}
