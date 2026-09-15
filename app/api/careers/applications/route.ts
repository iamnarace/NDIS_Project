import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { nextYearlyReferenceNumber } from '@/lib/referenceNumber';
import { sendCareersApplicantAcknowledgement, sendCareersAdminAlert } from '@/lib/email';
import { validateCandidateFile } from '@/lib/recruitmentFileValidation';
import { isVacancyCurrentlyOpen } from '@/lib/recruitmentValidation';
import crypto from 'crypto';

export async function POST(req: Request) {
  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Database service unavailable. Please try again later.' }, { status: 503 });
  }

  try {
    let fields: Record<string, any> = {};
    let resumeFile: File | null = null;
    let coverFile: File | null = null;

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      for (const [key, value] of formData.entries()) {
        if (key === 'resume' && value instanceof File) {
          resumeFile = value;
        } else if (key === 'cover_letter' && value instanceof File) {
          coverFile = value;
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
      fields = await req.json();
    }

    // 1. Spam & Anti-Bot Protection
    if (fields.website_url || fields.fax_number || fields.bot_check) {
      return NextResponse.json({ ok: true, reference_number: 'APP-2026-99999' });
    }

    // Timing check: if form loaded in < 2 seconds, reject bot submission
    if (fields._form_loaded_at) {
      const loadedAt = parseInt(fields._form_loaded_at, 10);
      const now = Date.now();
      if (!isNaN(loadedAt) && (now - loadedAt) < 2000) {
        return NextResponse.json({ ok: false, error: 'Please take your time to review the application before submitting.' }, { status: 400 });
      }
    }

    const applicationType = fields.application_type === 'eoi' ? 'eoi' : 'vacancy';
    const vacancyId = fields.vacancy_id || null;

    let vacancyTitle = 'General Expression of Interest';
    if (applicationType === 'vacancy') {
      if (!vacancyId) {
        return NextResponse.json({ ok: false, error: 'Vacancy ID is required for vacancy applications.' }, { status: 400 });
      }

      // Check vacancy status and opening / closing dates
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

    // 2. Validate applicant identity & contact
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

    // 3. Duplicate Prevention Check (15 min window for same email + vacancy/eoi)
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

    // 4. Validate Mandatory Declarations & Work Rights
    const declarationAccurate = fields.declaration_accurate_information === true || fields.declaration_accurate_information === 'true';
    const declarationPrivacy = fields.declaration_privacy_consent === true || fields.declaration_privacy_consent === 'true';

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

    // 5. Validate Candidate Files (Resume is mandatory for vacancy application)
    let resumeValidation: any = null;
    if (resumeFile && resumeFile.size > 0) {
      resumeValidation = await validateCandidateFile(resumeFile, 'resume');
      if (!resumeValidation.valid) {
        return NextResponse.json({ ok: false, error: resumeValidation.error }, { status: 400 });
      }
    } else if (applicationType === 'vacancy') {
      return NextResponse.json({ ok: false, error: 'A valid Resume / CV (.pdf, .doc, or .docx) is required for vacancy applications.' }, { status: 400 });
    }

    let coverValidation: any = null;
    if (coverFile && coverFile.size > 0) {
      coverValidation = await validateCandidateFile(coverFile, 'cover_letter');
      if (!coverValidation.valid) {
        return NextResponse.json({ ok: false, error: coverValidation.error }, { status: 400 });
      }
    }

    // 6. Generate Next Canonical Reference Number (APP-YYYY-XXXXX)
    const referenceNumber = await nextYearlyReferenceNumber(supabase, 'job_applications', 'APP');
    const applicationId = crypto.randomUUID();
    const nowIso = new Date().toISOString();

    const preferredServiceAreas = Array.isArray(fields.preferred_service_area_ids)
      ? fields.preferred_service_area_ids.slice(0, 20)
      : [];
    const employmentPreferences = Array.isArray(fields.employment_preferences)
      ? fields.employment_preferences.slice(0, 10)
      : [];

    // Role interest for EOI
    const roleInterest = applicationType === 'eoi' ? String(fields.role_interest || '').slice(0, 100) : null;
    const roleInterestOther = applicationType === 'eoi' ? String(fields.role_interest_other || '').slice(0, 200) : null;

    // 7. Atomic Resume Upload with Fail-Closed DB & Storage Rollback
    let uploadedResumePath: string | null = null;
    let uploadedCoverPath: string | null = null;

    if (resumeFile && resumeValidation && resumeValidation.valid) {
      const resumeUuid = crypto.randomUUID();
      uploadedResumePath = `recruitment/applications/${applicationId}/${resumeUuid}_${resumeValidation.sanitizedFilename}`;
      const resumeBuffer = Buffer.from(await resumeFile.arrayBuffer());

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
    }

    // Insert job_applications record
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
      notes_summary: fields.notes_summary ? String(fields.notes_summary).slice(0, 2000) : null,
      work_rights_status: workRights,
      work_rights_visa_details: fields.work_rights_visa_details ? String(fields.work_rights_visa_details).slice(0, 500) : null,
      ndis_worker_screening_status: fields.ndis_worker_screening_status || null,
      national_police_check_status: fields.national_police_check_status || null,
      first_aid_cpr_status: fields.first_aid_cpr_status || null,
      driver_licence_status: fields.driver_licence_status || null,
      vehicle_access_status: fields.vehicle_access_status || null,
      declaration_accurate_information: true,
      declaration_privacy_consent: true,
      role_interest: roleInterest,
      role_interest_other: roleInterestOther,
      stage: 'new',
      submitted_at: nowIso
    });

    if (appErr) {
      console.error('Failed to insert job_applications:', appErr.message);
      // Clean up uploaded resume object from storage
      if (uploadedResumePath) {
        await supabase.storage.from('crm-documents').remove([uploadedResumePath]).catch(() => {});
      }
      return NextResponse.json({ ok: false, error: 'Failed to record application. Please try again.' }, { status: 500 });
    }

    // Insert job_application_files record for Resume
    if (resumeFile && resumeValidation && uploadedResumePath) {
      const { error: fileErr } = await supabase.from('job_application_files').insert({
        application_id: applicationId,
        file_kind: 'resume',
        storage_bucket: 'crm-documents',
        storage_path: uploadedResumePath,
        file_name: resumeFile.name,
        file_size: resumeFile.size,
        mime_type: resumeValidation.canonicalMime
      });

      if (fileErr) {
        console.error('Failed to insert job_application_files for resume:', fileErr.message);
        // Clean up DB application and storage file
        try {
          await supabase.from('job_applications').delete().eq('id', applicationId);
          await supabase.storage.from('crm-documents').remove([uploadedResumePath]);
        } catch {}
        return NextResponse.json({ ok: false, error: 'Failed to register resume metadata. Please try again.' }, { status: 500 });
      }
    }

    // Attempt optional Cover Letter upload
    let coverLetterFailed = false;
    if (coverFile && coverValidation && coverValidation.valid) {
      const coverUuid = crypto.randomUUID();
      uploadedCoverPath = `recruitment/applications/${applicationId}/${coverUuid}_${coverValidation.sanitizedFilename}`;
      const coverBuffer = Buffer.from(await coverFile.arrayBuffer());

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
          storage_bucket: 'crm-documents',
          storage_path: uploadedCoverPath,
          file_name: coverFile.name,
          file_size: coverFile.size,
          mime_type: coverValidation.canonicalMime
        });
        if (coverFileErr) {
          coverLetterFailed = true;
          try {
            await supabase.storage.from('crm-documents').remove([uploadedCoverPath]);
          } catch {}
        }
      } else {
        coverLetterFailed = true;
      }
    }

    // 8. Insert timeline submitted event
    await supabase.from('job_application_events').insert({
      application_id: applicationId,
      event_type: 'submitted',
      from_stage: null,
      to_stage: 'new',
      note: applicationType === 'eoi'
        ? `Expression of Interest submitted online (${roleInterest || 'General'})`
        : `Application submitted online for vacancy: ${vacancyTitle}`,
      actor: 'system'
    });

    if (coverLetterFailed) {
      await supabase.from('job_application_events').insert({
        application_id: applicationId,
        event_type: 'attachment_warning',
        from_stage: null,
        to_stage: null,
        note: 'Optional cover letter upload failed during submission; candidate resume was securely preserved.',
        actor: 'system'
      });
    }

    // 9. Fail-Safe Email Dispatch & Audit Logging
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
