import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendCareersApplicantAcknowledgement, sendCareersAdminAlert } from '@/lib/email';
import { validateCandidateBuffer } from '@/lib/recruitmentFileValidation';
import crypto from 'crypto';

async function getNextApplicationReference(supabase: any): Promise<string> {
  try {
    const { data, error } = await supabase.rpc('next_recruitment_reference', { p_prefix: 'APP' });
    if (!error && typeof data === 'string' && data.startsWith('APP-')) {
      return data;
    }
  } catch {}

  // Fallback Sydney yearly counter
  let year = String(new Date().getFullYear());
  try {
    year = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Sydney', year: 'numeric' }).format(new Date());
  } catch {}

  const fullPrefix = `APP-${year}`;
  const { data } = await supabase.from('job_applications').select('reference_number');
  const matcher = new RegExp(`^${fullPrefix}-(\\d+)$`);
  const highest = (data || []).reduce((max: number, row: any) => {
    const match = row.reference_number?.match(matcher);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);

  return `${fullPrefix}-${String(highest + 1).padStart(5, '0')}`;
}

export async function POST(req: Request) {
  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Database service unavailable. Please try again later.' }, { status: 503 });
  }

  try {
    let fields: Record<string, any> = {};
    let directResumeFile: File | null = null;
    let directCoverFile: File | null = null;

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      for (const [key, value] of formData.entries()) {
        if (key === 'resume' && value instanceof File) {
          directResumeFile = value;
        } else if (key === 'cover_letter' && value instanceof File) {
          directCoverFile = value;
        } else if (typeof value === 'string') {
          try {
            if ((value.startsWith('[') && value.endsWith(']')) || (value.startsWith('{') && value.endsWith('}'))) {
              fields[key] = JSON.parse(value);
            } else {
              fields[key] = value;
            }
          } catch {
            fields[key] = value;
          }
        }
      }
    } else {
      fields = await req.json().catch(() => ({}));
    }

    // 1. Anti-Bot / Honeypot Checks
    if (fields.website_url || fields.fax_number || fields.bot_check) {
      return NextResponse.json({ ok: true, reference_number: 'APP-2026-99999' });
    }

    if (fields._form_loaded_at) {
      const loadedAt = parseInt(fields._form_loaded_at, 10);
      const now = Date.now();
      if (!isNaN(loadedAt) && (now - loadedAt) < 2000) {
        return NextResponse.json({ ok: false, error: 'Please take your time to review the application before submitting.' }, { status: 400 });
      }
    }

    const applicationType = fields.application_type === 'eoi' ? 'eoi' : 'vacancy';
    const vacancyId = applicationType === 'vacancy' ? (fields.vacancy_id || null) : null;

    let vacancyTitle = 'General Expression of Interest';
    if (applicationType === 'vacancy') {
      if (!vacancyId) {
        return NextResponse.json({ ok: false, error: 'Vacancy ID is required for vacancy applications.' }, { status: 400 });
      }

      const { data: vacancy, error: vacError } = await supabase
        .from('job_vacancies')
        .select('id, title, status, opens_at, closes_at')
        .eq('id', vacancyId)
        .maybeSingle();

      if (vacError || !vacancy) {
        return NextResponse.json({ ok: false, error: 'The selected job opportunity was not found.' }, { status: 404 });
      }

      const now = Date.now();
      if (vacancy.opens_at && new Date(vacancy.opens_at).getTime() > now) {
        return NextResponse.json({ ok: false, error: 'Applications for this position have not opened yet.' }, { status: 400 });
      }

      if (vacancy.closes_at && new Date(vacancy.closes_at).getTime() < now) {
        return NextResponse.json({ ok: false, error: 'Applications for this role have now closed.' }, { status: 400 });
      }

      if (vacancy.status !== 'published') {
        return NextResponse.json({ ok: false, error: 'This opportunity is not currently accepting applications.' }, { status: 400 });
      }

      vacancyTitle = vacancy.title;
    }

    // 2. Validate Identity & Contact
    const firstName = String(fields.first_name || '').trim();
    const lastName = String(fields.last_name || '').trim();
    const email = String(fields.email || '').trim().toLowerCase();
    const phone = String(fields.phone || '').trim();
    const suburb = String(fields.suburb || '').trim();
    const postcode = String(fields.postcode || '').trim();

    if (!firstName || !lastName) {
      return NextResponse.json({ ok: false, error: 'First name and last name are required.' }, { status: 400 });
    }
    if (!email || !email.includes('@') || email.length > 150) {
      return NextResponse.json({ ok: false, error: 'A valid email address is required.' }, { status: 400 });
    }
    if (!phone || phone.length < 8 || phone.length > 30) {
      return NextResponse.json({ ok: false, error: 'A valid Australian contact number is required.' }, { status: 400 });
    }
    if (!suburb || !postcode || !/^\d{4}$/.test(postcode)) {
      return NextResponse.json({ ok: false, error: 'NSW suburb and a valid 4-digit postcode are required.' }, { status: 400 });
    }

    // 3. Duplicate Prevention (15 min window for same email + vacancy/eoi)
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    let dupQuery = supabase
      .from('job_applications')
      .select('id, reference_number, submitted_at')
      .eq('email', email)
      .gte('submitted_at', fifteenMinsAgo);

    if (applicationType === 'vacancy') {
      dupQuery = dupQuery.eq('vacancy_id', vacancyId);
    } else {
      dupQuery = dupQuery.eq('application_type', 'eoi');
    }

    const { data: duplicateApp } = await dupQuery.limit(1);
    if (duplicateApp && duplicateApp.length > 0) {
      return NextResponse.json({
        ok: false,
        duplicate_detected: true,
        error: `We have already received an application from this email address recently. Your reference is ${duplicateApp[0].reference_number}.`
      }, { status: 409 });
    }

    // 4. Validate Declarations & Work Rights
    const declarationAccurate =
      fields.declaration_accurate_information === true ||
      fields.declaration_accurate_information === 'true' ||
      fields.declaration_accuracy === true ||
      fields.declaration_accuracy === 'true' ||
      Boolean(fields.accuracy_declaration_at);

    const declarationPrivacy =
      fields.declaration_privacy_consent === true ||
      fields.declaration_privacy_consent === 'true' ||
      fields.declaration_privacy === true ||
      fields.declaration_privacy === 'true' ||
      Boolean(fields.privacy_consent_at);

    if (!declarationAccurate || !declarationPrivacy) {
      return NextResponse.json({
        ok: false,
        error: 'You must confirm the accuracy of your application and agree to the privacy policy before submitting.'
      }, { status: 400 });
    }

    const workRights = fields.work_rights_status;
    const validWorkRights = ['citizen_pr', 'valid_visa', 'no_rights'];
    if (!workRights || !validWorkRights.includes(workRights)) {
      return NextResponse.json({
        ok: false,
        error: 'Please explicitly specify your Australian work rights status.'
      }, { status: 400 });
    }

    // 5. Resolve Resume & Cover Letter (from Upload Sessions or direct multipart)
    const resumeSessionId = fields.resume_upload_session_id || fields.resume_session_id;
    const coverSessionId = fields.cover_letter_upload_session_id || fields.cover_letter_session_id;

    let resumeBuffer: Buffer | null = null;
    let resumeFileName = '';
    let resumeSessionRecord: any = null;
    let resumeSessionStoragePath: string | null = null;

    if (resumeSessionId) {
      const { data: sess, error: sErr } = await supabase
        .from('job_application_upload_sessions')
        .select('*')
        .eq('id', resumeSessionId)
        .maybeSingle();

      if (sErr || !sess) {
        return NextResponse.json({ ok: false, error: 'Resume upload session not found or invalid.' }, { status: 400 });
      }

      if (new Date(sess.expires_at).getTime() < Date.now()) {
        return NextResponse.json({ ok: false, error: 'Resume upload session has expired. Please re-upload your resume.' }, { status: 400 });
      }

      resumeSessionStoragePath = sess.resume_storage_path || sess.storage_path;
      if (!resumeSessionStoragePath) {
        return NextResponse.json({ ok: false, error: 'No resume found in upload session.' }, { status: 400 });
      }

      const { data: blob, error: dlErr } = await supabase.storage
        .from('crm-documents')
        .download(resumeSessionStoragePath);

      if (dlErr || !blob) {
        return NextResponse.json({ ok: false, error: 'Failed to access uploaded resume. Please upload your file again.' }, { status: 400 });
      }

      resumeBuffer = Buffer.from(await blob.arrayBuffer());
      resumeFileName = sess.resume_file_name || sess.file_name || 'resume.pdf';
      resumeSessionRecord = sess;
    } else if (directResumeFile && directResumeFile.size > 0) {
      resumeBuffer = Buffer.from(await directResumeFile.arrayBuffer());
      resumeFileName = directResumeFile.name;
    }

    if (applicationType === 'vacancy' && (!resumeBuffer || resumeBuffer.length === 0)) {
      return NextResponse.json({ ok: false, error: 'A valid Resume / CV (.pdf, .doc, or .docx) is required for vacancy applications.' }, { status: 400 });
    }

    let resumeValidation: any = null;
    if (resumeBuffer && resumeBuffer.length > 0) {
      resumeValidation = validateCandidateBuffer(resumeBuffer, resumeFileName, 'resume');
      if (!resumeValidation.valid) {
        return NextResponse.json({ ok: false, error: resumeValidation.error }, { status: 400 });
      }
    }

    let coverBuffer: Buffer | null = null;
    let coverFileName = '';
    let coverSessionRecord: any = null;
    let coverSessionStoragePath: string | null = null;

    if (coverSessionId) {
      const { data: sess, error: sErr } = await supabase
        .from('job_application_upload_sessions')
        .select('*')
        .eq('id', coverSessionId)
        .maybeSingle();

      if (!sErr && sess && new Date(sess.expires_at).getTime() >= Date.now()) {
        coverSessionStoragePath = sess.cover_storage_path || sess.storage_path;
        if (coverSessionStoragePath) {
          const { data: blob } = await supabase.storage
            .from('crm-documents')
            .download(coverSessionStoragePath);
          if (blob) {
            coverBuffer = Buffer.from(await blob.arrayBuffer());
            coverFileName = sess.cover_file_name || sess.file_name || 'cover_letter.pdf';
            coverSessionRecord = sess;
          }
        }
      }
    } else if (directCoverFile && directCoverFile.size > 0) {
      coverBuffer = Buffer.from(await directCoverFile.arrayBuffer());
      coverFileName = directCoverFile.name;
    }

    let coverValidation: any = null;
    if (coverBuffer && coverBuffer.length > 0) {
      coverValidation = validateCandidateBuffer(coverBuffer, coverFileName, 'cover_letter');
      if (!coverValidation.valid) {
        return NextResponse.json({ ok: false, error: coverValidation.error }, { status: 400 });
      }
    }

    // 6. Generate Reference Number & Retention Window
    const referenceNumber = await getNextApplicationReference(supabase);
    const applicationId = crypto.randomUUID();
    const nowIso = new Date().toISOString();

    let retentionMonths = 12;
    try {
      const { data: config } = await supabase
        .from('provider_config')
        .select('recruitment_retention_months')
        .limit(1)
        .maybeSingle();
      if (config?.recruitment_retention_months && Number(config.recruitment_retention_months) > 0) {
        retentionMonths = Number(config.recruitment_retention_months);
      }
    } catch {}

    const retentionDate = new Date();
    retentionDate.setMonth(retentionDate.getMonth() + retentionMonths);
    const retentionUntil = retentionDate.toISOString();

    const preferredServiceAreas = Array.isArray(fields.preferred_service_area_ids)
      ? fields.preferred_service_area_ids.slice(0, 20)
      : [];
    const employmentPreferences = Array.isArray(fields.employment_preferences)
      ? fields.employment_preferences.slice(0, 10)
      : [];

    const roleInterest = applicationType === 'eoi' ? (fields.role_interest ? String(fields.role_interest).slice(0, 100) : null) : null;
    const roleInterestOther = applicationType === 'eoi' ? (fields.role_interest_other ? String(fields.role_interest_other).slice(0, 200) : null) : null;

    const experienceSummary = fields.experience_summary || fields.notes_summary || null;
    const qualificationSummary = fields.qualification_summary || null;

    // 7. Store Resume in Canonical Storage Path
    let uploadedResumePath: string | null = null;
    let uploadedCoverPath: string | null = null;

    if (resumeBuffer && resumeValidation && resumeValidation.valid) {
      const resumeUuid = crypto.randomUUID();
      uploadedResumePath = `recruitment/applications/${applicationId}/${resumeUuid}_${resumeValidation.sanitizedFilename}`;

      const { error: resumeUploadErr } = await supabase.storage
        .from('crm-documents')
        .upload(uploadedResumePath, resumeBuffer, {
          contentType: resumeValidation.canonicalMime,
          upsert: false
        });

      if (resumeUploadErr) {
        console.error('Storage resume upload failed:', resumeUploadErr.message);
        return NextResponse.json({
          ok: false,
          error: 'Failed to securely store your resume. Please try again.'
        }, { status: 500 });
      }

      if (resumeSessionRecord && resumeSessionStoragePath) {
        try {
          await supabase.storage.from('crm-documents').remove([resumeSessionStoragePath]);
          await supabase.from('job_application_upload_sessions').update({ finalized_at: nowIso }).eq('id', resumeSessionRecord.id);
        } catch {}
      }
    }

    // 8. Insert canonical job_applications row
    const { error: appErr } = await supabase.from('job_applications').insert({
      id: applicationId,
      reference_number: referenceNumber,
      application_type: applicationType,
      vacancy_id: vacancyId,
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      suburb,
      postcode,
      preferred_service_area_ids: preferredServiceAreas,
      employment_preferences: employmentPreferences,
      earliest_start_date: fields.earliest_start_date || null,
      experience_summary: experienceSummary ? String(experienceSummary).slice(0, 3000) : null,
      qualification_summary: qualificationSummary ? String(qualificationSummary).slice(0, 3000) : null,
      driver_licence_status: fields.driver_licence_status || null,
      vehicle_access_status: fields.vehicle_access_status || null,
      work_rights_status: workRights,
      ndiswc_status_declared: fields.ndiswc_status_declared || fields.ndis_worker_screening_status || null,
      police_check_status_declared: fields.police_check_status_declared || fields.national_police_check_status || null,
      first_aid_status_declared: fields.first_aid_status_declared || fields.first_aid_cpr_status || null,
      cpr_status_declared: fields.cpr_status_declared || null,
      wwcc_status_declared: fields.wwcc_status_declared || null,
      availability: typeof fields.availability === 'object' && fields.availability !== null ? fields.availability : {},
      availability_notes: fields.availability_notes ? String(fields.availability_notes).slice(0, 1000) : null,
      motivation: fields.motivation ? String(fields.motivation).slice(0, 2000) : null,
      role_interest: roleInterest,
      role_interest_other: roleInterestOther,
      privacy_consent_at: nowIso,
      accuracy_declaration_at: nowIso,
      retention_until: retentionUntil,
      stage: 'new',
      submitted_at: nowIso
    });

    if (appErr) {
      console.error('Failed to insert job_applications:', appErr.message);
      if (uploadedResumePath) {
        await supabase.storage.from('crm-documents').remove([uploadedResumePath]).catch(() => {});
      }
      return NextResponse.json({ ok: false, error: 'Failed to record application. Please try again.' }, { status: 500 });
    }

    // 9. Insert job_application_files record for Resume
    if (resumeBuffer && resumeValidation && uploadedResumePath) {
      const { error: fileErr } = await supabase.from('job_application_files').insert({
        application_id: applicationId,
        file_kind: 'resume',
        storage_path: uploadedResumePath,
        file_name: resumeFileName,
        file_size: resumeBuffer.length,
        mime_type: resumeValidation.canonicalMime
      });

      if (fileErr) {
        console.error('Failed to insert job_application_files for resume:', fileErr.message);
        try {
          await supabase.from('job_applications').delete().eq('id', applicationId);
          await supabase.storage.from('crm-documents').remove([uploadedResumePath]);
        } catch {}
        return NextResponse.json({ ok: false, error: 'Failed to register resume metadata. Please try again.' }, { status: 500 });
      }
    }

    // 10. Store optional Cover Letter if present
    let coverLetterFailed = false;
    if (coverBuffer && coverValidation && coverValidation.valid) {
      const coverUuid = crypto.randomUUID();
      uploadedCoverPath = `recruitment/applications/${applicationId}/${coverUuid}_${coverValidation.sanitizedFilename}`;

      const { error: coverUploadErr } = await supabase.storage
        .from('crm-documents')
        .upload(uploadedCoverPath, coverBuffer, {
          contentType: coverValidation.canonicalMime,
          upsert: false
        });

      if (!coverUploadErr) {
        const { error: coverFileErr } = await supabase.from('job_application_files').insert({
          application_id: applicationId,
          file_kind: 'cover_letter',
          storage_path: uploadedCoverPath,
          file_name: coverFileName,
          file_size: coverBuffer.length,
          mime_type: coverValidation.canonicalMime
        });

        if (coverFileErr) {
          coverLetterFailed = true;
          try {
            await supabase.storage.from('crm-documents').remove([uploadedCoverPath]);
          } catch {}
        } else if (coverSessionRecord && coverSessionStoragePath) {
          try {
            await supabase.storage.from('crm-documents').remove([coverSessionStoragePath]);
            await supabase.from('job_application_upload_sessions').update({ finalized_at: nowIso }).eq('id', coverSessionRecord.id);
          } catch {}
        }
      } else {
        coverLetterFailed = true;
      }
    }

    // 11. Transactional Timeline Event with Fail-Closed Rollback
    const { error: eventErr } = await supabase.from('job_application_events').insert({
      application_id: applicationId,
      event_type: 'submitted',
      from_stage: null,
      to_stage: 'new',
      note: applicationType === 'eoi'
        ? `Expression of Interest submitted online (${roleInterest || 'General'})`
        : `Application submitted online for vacancy: ${vacancyTitle}`,
      actor: 'system'
    });

    if (eventErr) {
      console.error('Failed to insert submitted event:', eventErr.message);
      try {
        await supabase.from('job_applications').delete().eq('id', applicationId);
        if (uploadedResumePath) await supabase.storage.from('crm-documents').remove([uploadedResumePath]);
        if (uploadedCoverPath) await supabase.storage.from('crm-documents').remove([uploadedCoverPath]);
      } catch {}
      return NextResponse.json({ ok: false, error: 'Failed to record application timeline.' }, { status: 500 });
    }

    if (coverLetterFailed) {
      try {
        await supabase.from('job_application_events').insert({
          application_id: applicationId,
          event_type: 'attachment_warning',
          from_stage: null,
          to_stage: null,
          note: 'Optional cover letter upload failed during submission; candidate resume was securely preserved.',
          actor: 'system'
        });
      } catch {}
    }

    // 12. Fail-Safe Email Dispatch
    const applicantEmailPromise = sendCareersApplicantAcknowledgement({
      firstName,
      referenceNumber,
      roleOrEoi: vacancyTitle,
      roleInterest: roleInterest || undefined,
      applicationLabel: applicationType === 'eoi' ? 'Expression of Interest' : 'application',
      email
    });

    const adminEmailPromise = sendCareersAdminAlert({
      referenceNumber,
      applicantName: `${firstName} ${lastName}`,
      roleOrEoi: vacancyTitle,
      roleInterest: roleInterest || undefined,
      applicationType,
      email,
      phone,
      suburb,
      postcode,
      preferredServiceAreas,
      employmentPreferences,
      submittedAt: new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' }),
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://opuscare.com.au'
    });

    const [applicantResult, adminResult] = await Promise.all([applicantEmailPromise, adminEmailPromise]);

    if (!applicantResult.ok) {
      try {
        await supabase.from('job_application_events').insert({
          application_id: applicationId,
          event_type: 'email_delivery_failed',
          note: 'Failed to deliver automated applicant acknowledgement email.',
          actor: 'system'
        });
      } catch {}
    }

    if (!adminResult.ok) {
      try {
        await supabase.from('job_application_events').insert({
          application_id: applicationId,
          event_type: 'email_delivery_failed',
          note: 'Failed to deliver automated recruitment admin notification email.',
          actor: 'system'
        });
      } catch {}
    }

    return NextResponse.json({
      ok: true,
      reference_number: referenceNumber,
      application_id: applicationId,
      role_title: vacancyTitle
    });

  } catch (err: any) {
    console.error('Unhandled error in careers application API:', err);
    return NextResponse.json({ ok: false, error: 'An unexpected error occurred while processing your application.' }, { status: 500 });
  }
}
