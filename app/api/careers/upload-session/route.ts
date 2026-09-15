import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sanitizeRecruitmentFilename } from '@/lib/recruitmentFileValidation';
import { checkRecruitmentRateLimit } from '@/lib/rateLimit';
import crypto from 'crypto';

export async function POST(req: Request) {
  // 1. Abuse control / rate limiting
  const rateCheck = checkRecruitmentRateLimit(req, 'upload_session', 30, 60);
  if (!rateCheck.ok) {
    return NextResponse.json({
      ok: false,
      error: `Too many upload requests. Please try again in ${rateCheck.resetInSeconds} seconds.`
    }, { status: 429 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Database service unavailable.' }, { status: 503 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const applicationType = body.application_type === 'vacancy' ? 'vacancy' : 'eoi';
    const vacancyId = body.vacancy_id || null;

    if (applicationType === 'vacancy' && !vacancyId) {
      return NextResponse.json({ ok: false, error: 'Vacancy ID is required for vacancy upload sessions.' }, { status: 400 });
    }

    // Support both single file and multi-file payload
    let files: Array<{ file_kind: string; file_name: string; file_size: number; mime_type?: string }> = [];

    if (Array.isArray(body.files) && body.files.length > 0) {
      files = body.files;
    } else if (body.file_name && (body.file_kind || body.kind)) {
      files = [{
        file_kind: body.file_kind || body.kind || 'resume',
        file_name: String(body.file_name).trim(),
        file_size: Number(body.file_size) || 0,
        mime_type: body.mime_type
      }];
    }

    if (files.length === 0) {
      return NextResponse.json({ ok: false, error: 'At least one file descriptor is required to initialize upload session.' }, { status: 400 });
    }

    const sessionId = crypto.randomUUID();
    const sessionSecret = crypto.randomBytes(32).toString('hex');
    const secretHash = crypto.createHash('sha256').update(sessionSecret).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    let resumeStoragePath: string | null = null;
    let resumeFileName: string | null = null;
    let resumeFileSize: number | null = null;
    let resumeMimeType: string | null = null;
    let resumeSignedData: { signedUrl: string; token: string; path: string } | null = null;

    let coverStoragePath: string | null = null;
    let coverFileName: string | null = null;
    let coverFileSize: number | null = null;
    let coverMimeType: string | null = null;
    let coverSignedData: { signedUrl: string; token: string; path: string } | null = null;

    for (const f of files) {
      const kind = f.file_kind === 'cover_letter' ? 'cover_letter' : 'resume';
      const name = String(f.file_name || '').trim();
      const size = Number(f.file_size) || 0;
      const declaredMime = String(f.mime_type || '').trim();
      const maxSize = kind === 'resume' ? 8 * 1024 * 1024 : 5 * 1024 * 1024;
      const maxMb = kind === 'resume' ? 8 : 5;

      if (!name) {
        return NextResponse.json({ ok: false, error: 'File name is required.' }, { status: 400 });
      }

      if (size <= 0 || size > maxSize) {
        return NextResponse.json({
          ok: false,
          error: `${kind === 'resume' ? 'Resume' : 'Cover letter'} size must be between 1 byte and ${maxMb}MB.`
        }, { status: 400 });
      }

      const extMatch = name.match(/\.([a-zA-Z0-9]+)$/);
      if (!extMatch || !['pdf', 'doc', 'docx'].includes(extMatch[1].toLowerCase())) {
        return NextResponse.json({
          ok: false,
          error: 'Only PDF (.pdf), Microsoft Word 97-2003 (.doc), and Microsoft Word (.docx) files are accepted.'
        }, { status: 400 });
      }

      const ext = extMatch[1].toLowerCase();

      // Check declared MIME against extension
      if (declaredMime) {
        const normDeclared = declaredMime.toLowerCase();
        if (ext === 'pdf' && !['application/pdf', 'application/x-pdf', 'application/octet-stream'].includes(normDeclared)) {
          return NextResponse.json({ ok: false, error: `MIME mismatch: ${declaredMime} is not valid for .pdf.` }, { status: 400 });
        }
        if (ext === 'doc' && !['application/msword', 'application/doc', 'application/octet-stream'].includes(normDeclared)) {
          return NextResponse.json({ ok: false, error: `MIME mismatch: ${declaredMime} is not valid for .doc.` }, { status: 400 });
        }
        if (ext === 'docx' && !['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/octet-stream'].includes(normDeclared)) {
          return NextResponse.json({ ok: false, error: `MIME mismatch: ${declaredMime} is not valid for .docx.` }, { status: 400 });
        }
      }

      const sanitizedName = sanitizeRecruitmentFilename(name, ext);
      const storagePath = `recruitment/temp/${sessionId}/${kind}_${sanitizedName}`;

      const { data: signed, error: signErr } = await supabase.storage
        .from('crm-documents')
        .createSignedUploadUrl(storagePath);

      if (signErr || !signed) {
        console.error('Failed to create signed upload URL:', signErr?.message);
        return NextResponse.json({ ok: false, error: 'Failed to initialize secure upload channel.' }, { status: 500 });
      }

      if (kind === 'resume') {
        resumeStoragePath = storagePath;
        resumeFileName = name;
        resumeFileSize = size;
        resumeMimeType = declaredMime || 'application/octet-stream';
        resumeSignedData = { signedUrl: signed.signedUrl, token: signed.token, path: storagePath };
      } else {
        coverStoragePath = storagePath;
        coverFileName = name;
        coverFileSize = size;
        coverMimeType = declaredMime || 'application/octet-stream';
        coverSignedData = { signedUrl: signed.signedUrl, token: signed.token, path: storagePath };
      }
    }

    const { error: dbErr } = await supabase
      .from('job_application_upload_sessions')
      .insert({
        id: sessionId,
        session_secret_hash: secretHash,
        application_type: applicationType,
        vacancy_id: vacancyId,
        resume_storage_path: resumeStoragePath,
        cover_storage_path: coverStoragePath,
        resume_file_name: resumeFileName,
        cover_file_name: coverFileName,
        resume_file_size: resumeFileSize,
        cover_file_size: coverFileSize,
        resume_mime_type: resumeMimeType,
        cover_mime_type: coverMimeType,
        expires_at: expiresAt
      });

    if (dbErr) {
      console.error('Failed to insert upload session:', dbErr.message);
      return NextResponse.json({ ok: false, error: 'Failed to record upload session.' }, { status: 500 });
    }

    // Opportunistic cleanup of expired unfinalized sessions
    (async () => {
      try {
        const { data: expired } = await supabase
          .from('job_application_upload_sessions')
          .select('id, resume_storage_path, cover_storage_path')
          .is('finalized_at', null)
          .lt('expires_at', new Date().toISOString())
          .limit(10);

        if (expired && expired.length > 0) {
          const stalePaths = expired.flatMap(e => [e.resume_storage_path, e.cover_storage_path].filter(Boolean));
          if (stalePaths.length > 0) {
            await supabase.storage.from('crm-documents').remove(stalePaths as string[]);
          }
          const expiredIds = expired.map(e => e.id);
          await supabase.from('job_application_upload_sessions').delete().in('id', expiredIds);
        }
      } catch {}
    })().catch(() => {});

    return NextResponse.json({
      ok: true,
      session_id: sessionId,
      session_token: sessionSecret,
      resume: resumeSignedData,
      cover_letter: coverSignedData,
      // Flat properties for single file backward-compatibility
      signed_url: resumeSignedData?.signedUrl || coverSignedData?.signedUrl,
      token: resumeSignedData?.token || coverSignedData?.token,
      path: resumeSignedData?.path || coverSignedData?.path,
      expires_in: 1800
    });
  } catch (err: any) {
    console.error('Upload session creation error:', err);
    return NextResponse.json({ ok: false, error: 'Internal error initializing upload session.' }, { status: 500 });
  }
}
