import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendCareersApplicantAcknowledgement, sendCareersAdminAlert } from '@/lib/email';
import { validateCandidateBuffer } from '@/lib/recruitmentFileValidation';
import { getAtomicRecruitmentReference } from '@/lib/referenceNumber';
import { checkRecruitmentRateLimit } from '@/lib/rateLimit';
import crypto from 'crypto';

const ALLOWED_SERVICE_AREAS = new Set([
  'coffs-coast',
  'clarence-valley',
  'tweed-byron',
  'richmond-valley',
  'ballina-richmond',
  'western-sydney',
  'blacktown',
  'parramatta',
  'penrith',
  'inner-west',
  'south-west-sydney',
  'sydney-eastern-suburbs'
]);

const ALLOWED_EMPLOYMENT_PREFERENCES = new Set([
  'casual',
  'part_time',
  'full_time',
  'fixed_term',
  'flexible'
]);

const ALLOWED_WORK_RIGHTS = new Set([
  'citizen_pr',
  'valid_visa',
  'no_rights'
]);

const ALLOWED_DAYS = new Set([
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
]);

const ALLOWED_PERIODS = new Set([
  'Morning', 'Daytime', 'Evening', 'Sleepover / Active Night', 'Flexible'
]);

const ALLOWED_YES_NO = new Set(['yes', 'no', 'not_applicable']);
const ALLOWED_NDISWC = new Set(['current', 'in_progress', 'not_held', 'unsure']);
const ALLOWED_SCREENING = new Set(['current', 'expired', 'not_held']);
const ALLOWED_WWCC = new Set(['current', 'in_progress', 'not_held']);

function constantTimeEqualHex(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, 'hex');
    const bufB = Buffer.from(b, 'hex');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  // 1. Abuse control / rate limiting
  const rateCheck = checkRecruitmentRateLimit(req, 'application_submission', 25, 60);
  if (!rateCheck.ok) {
    return NextResponse.json({
      ok: false,
      error: `Too many application submissions. Please try again in ${rateCheck.resetInSeconds} seconds.`
    }, { status: 429 });
  }

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

    // 2. Anti-Bot / Honeypot Checks
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
    let vacancyRecord: any = null;

    if (applicationType === 'vacancy') {
      if (!vacancyId) {
        return NextResponse.json({ ok: false, error: 'Vacancy ID is required for vacancy applications.' }, { status: 400 });
      }

      const { data: vacancy, error: vacError } = await supabase
        .from('job_vacancies')
        .select('*')
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
      vacancyRecord = vacancy;
    }

    // 3. Server-side validation of applicant identity & contact
    const firstName = String(fields.first_name || '').trim();
    const lastName = String(fields.last_name || '').trim();
    const email = String(fields.email || '').trim().toLowerCase();
    const phone = String(fields.phone || '').trim();
    const suburb = String(fields.suburb || '').trim();
    const postcode = String(fields.postcode || '').trim();

    if (!firstName || firstName.length > 80 || !lastName || lastName.length > 80) {
      return NextResponse.json({ ok: false, error: 'First name and last name are required (maximum 80 characters).' }, { status: 400 });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || email.length > 160 || !emailRegex.test(email)) {
      return NextResponse.json({ ok: false, error: 'A valid email address is required (maximum 160 characters).' }, { status: 400 });
    }
    if (!phone || phone.length < 8 || phone.length > 40) {
      return NextResponse.json({ ok: false, error: 'A valid Australian contact phone number is required.' }, { status: 400 });
    }
    if (!suburb || suburb.length > 100 || !postcode || !/^\d{4}$/.test(postcode)) {
      return NextResponse.json({ ok: false, error: 'NSW suburb and a valid 4-digit postcode are required.' }, { status: 400 });
    }

    // 4. Server-side validation of service areas and employment preferences
    const preferredAreas = Array.isArray(fields.preferred_service_area_ids) ? fields.preferred_service_area_ids : [];
    if (preferredAreas.length === 0) {
      return NextResponse.json({ ok: false, error: 'Please select at least one preferred service area.' }, { status: 400 });
    }
    for (const area of preferredAreas) {
      if (!ALLOWED_SERVICE_AREAS.has(area)) {
        return NextResponse.json({ ok: false, error: `Invalid service area '${area}'.` }, { status: 400 });
      }
    }

    const employmentPrefs = Array.isArray(fields.employment_preferences) ? fields.employment_preferences : [];
    if (employmentPrefs.length === 0) {
      return NextResponse.json({ ok: false, error: 'Please select at least one employment preference.' }, { status: 400 });
    }
    for (const pref of employmentPrefs) {
      if (!ALLOWED_EMPLOYMENT_PREFERENCES.has(pref)) {
        return NextResponse.json({ ok: false, error: `Invalid employment preference '${pref}'.` }, { status: 400 });
      }
    }

    const workRights = String(fields.work_rights_status || '').trim();
    if (!ALLOWED_WORK_RIGHTS.has(workRights)) {
      return NextResponse.json({ ok: false, error: 'Please explicitly specify a valid Australian work rights status.' }, { status: 400 });
    }

    // 5. Declarations validation against vacancy requirements
    const driverLicenceStatus = fields.driver_licence_status ? String(fields.driver_licence_status).trim() : null;
    const vehicleAccessStatus = fields.vehicle_access_status ? String(fields.vehicle_access_status).trim() : null;
    const ndiswcStatus = fields.ndiswc_status_declared ? String(fields.ndiswc_status_declared).trim() : null;
    const policeCheckStatus = fields.police_check_status_declared ? String(fields.police_check_status_declared).trim() : null;
    const firstAidStatus = fields.first_aid_status_declared ? String(fields.first_aid_status_declared).trim() : null;
    const cprStatus = fields.cpr_status_declared ? String(fields.cpr_status_declared).trim() : null;
    const wwccStatus = fields.wwcc_status_declared ? String(fields.wwcc_status_declared).trim() : null;

    if (driverLicenceStatus && !ALLOWED_YES_NO.has(driverLicenceStatus)) {
      return NextResponse.json({ ok: false, error: 'Invalid driver licence declaration.' }, { status: 400 });
    }
    if (vehicleAccessStatus && !ALLOWED_YES_NO.has(vehicleAccessStatus)) {
      return NextResponse.json({ ok: false, error: 'Invalid vehicle access declaration.' }, { status: 400 });
    }
    if (ndiswcStatus && !ALLOWED_NDISWC.has(ndiswcStatus)) {
      return NextResponse.json({ ok: false, error: 'Invalid NDIS worker screening declaration.' }, { status: 400 });
    }
    if (policeCheckStatus && !ALLOWED_SCREENING.has(policeCheckStatus)) {
      return NextResponse.json({ ok: false, error: 'Invalid police check declaration.' }, { status: 400 });
    }
    if (firstAidStatus && !ALLOWED_SCREENING.has(firstAidStatus)) {
      return NextResponse.json({ ok: false, error: 'Invalid first aid declaration.' }, { status: 400 });
    }
    if (cprStatus && !ALLOWED_SCREENING.has(cprStatus)) {
      return NextResponse.json({ ok: false, error: 'Invalid CPR declaration.' }, { status: 400 });
    }
    if (wwccStatus && !ALLOWED_WWCC.has(wwccStatus)) {
      return NextResponse.json({ ok: false, error: 'Invalid WWCC declaration.' }, { status: 400 });
    }

    if (vacancyRecord) {
      if (vacancyRecord.driver_licence_required && !driverLicenceStatus) {
        return NextResponse.json({ ok: false, error: 'Driver licence declaration is required for this role.' }, { status: 400 });
      }
      if (vacancyRecord.vehicle_required && !vehicleAccessStatus) {
        return NextResponse.json({ ok: false, error: 'Vehicle access declaration is required for this role.' }, { status: 400 });
      }
      if (vacancyRecord.ndiswc_required && !ndiswcStatus) {
        return NextResponse.json({ ok: false, error: 'NDIS Worker Screening declaration is required for this role.' }, { status: 400 });
      }
      if (vacancyRecord.police_check_required && !policeCheckStatus) {
        return NextResponse.json({ ok: false, error: 'Police check declaration is required for this role.' }, { status: 400 });
      }
      if (vacancyRecord.first_aid_required && !firstAidStatus) {
        return NextResponse.json({ ok: false, error: 'First aid declaration is required for this role.' }, { status: 400 });
      }
      if (vacancyRecord.cpr_required && !cprStatus) {
        return NextResponse.json({ ok: false, error: 'CPR declaration is required for this role.' }, { status: 400 });
      }
      if (vacancyRecord.child_related_role && !wwccStatus) {
        return NextResponse.json({ ok: false, error: 'Working With Children Check declaration is required for child-related roles.' }, { status: 400 });
      }
    }

    // Availability validation
    const availabilityObj = typeof fields.availability === 'object' && fields.availability !== null ? fields.availability : {};
    const availDays = Array.isArray(availabilityObj.days) ? availabilityObj.days : [];
    for (const d of availDays) {
      if (!ALLOWED_DAYS.has(d)) {
        return NextResponse.json({ ok: false, error: `Invalid availability day '${d}'.` }, { status: 400 });
      }
    }
    const availPeriods = Array.isArray(availabilityObj.periods) ? availabilityObj.periods : [];
    for (const p of availPeriods) {
      if (!ALLOWED_PERIODS.has(p)) {
        return NextResponse.json({ ok: false, error: `Invalid availability period '${p}'.` }, { status: 400 });
      }
    }

    // 6. Mandatory legal consents
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

    // 7. Duplicate Prevention (15 min window for same email + vacancy/eoi)
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

    // 8. Upload Session Verification & Secret Token Validation
    const resumeSessionId = fields.resume_upload_session_id || fields.resume_session_id;
    const resumeSessionToken = fields.resume_upload_session_token || fields.resume_session_token;

    const coverSessionId = fields.cover_letter_upload_session_id || fields.cover_letter_session_id;
    const coverSessionToken = fields.cover_letter_upload_session_token || fields.cover_letter_session_token;

    let resumeBuffer: Buffer | null = null;
    let resumeFileName = '';
    let resumeSessionRecord: any = null;
    let resumeSessionStoragePath: string | null = null;

    if (resumeSessionId) {
      if (!resumeSessionToken || typeof resumeSessionToken !== 'string') {
        return NextResponse.json({ ok: false, error: 'Resume upload session token is missing or invalid.' }, { status: 400 });
      }

      const { data: sess, error: sErr } = await supabase
        .from('job_application_upload_sessions')
        .select('*')
        .eq('id', resumeSessionId)
        .maybeSingle();

      if (sErr || !sess) {
        return NextResponse.json({ ok: false, error: 'Resume upload session not found.' }, { status: 400 });
      }

      if (sess.finalized_at) {
        return NextResponse.json({ ok: false, error: 'Upload session has already been finalized and cannot be reused.' }, { status: 400 });
      }

      if (new Date(sess.expires_at).getTime() < Date.now()) {
        return NextResponse.json({ ok: false, error: 'Resume upload session has expired. Please re-upload your resume.' }, { status: 400 });
      }

      // Verify token hash constant time
      const computedHash = crypto.createHash('sha256').update(resumeSessionToken).digest('hex');
      if (!constantTimeEqualHex(computedHash, sess.session_secret_hash)) {
        return NextResponse.json({ ok: false, error: 'Resume upload session security verification failed.' }, { status: 400 });
      }

      // Verify binding
      if (sess.application_type !== applicationType) {
        return NextResponse.json({ ok: false, error: 'Upload session application type mismatch.' }, { status: 400 });
      }
      if (applicationType === 'vacancy' && sess.vacancy_id !== vacancyId) {
        return NextResponse.json({ ok: false, error: 'Upload session vacancy binding mismatch.' }, { status: 400 });
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
      resumeValidation = validateCandidateBuffer(
        resumeBuffer,
        resumeFileName,
        'resume',
        resumeSessionRecord?.resume_mime_type || directResumeFile?.type
      );
      if (!resumeValidation.valid) {
        return NextResponse.json({ ok: false, error: resumeValidation.error }, { status: 400 });
      }
    }

    // Cover letter verification
    let coverBuffer: Buffer | null = null;
    let coverFileName = '';
    let coverSessionRecord: any = null;
    let coverSessionStoragePath: string | null = null;

    if (coverSessionId) {
      if (!coverSessionToken || typeof coverSessionToken !== 'string') {
        return NextResponse.json({ ok: false, error: 'Cover letter upload session token is missing or invalid.' }, { status: 400 });
      }

      const { data: sess, error: sErr } = await supabase
        .from('job_application_upload_sessions')
        .select('*')
        .eq('id', coverSessionId)
        .maybeSingle();

      if (!sErr && sess && !sess.finalized_at && new Date(sess.expires_at).getTime() >= Date.now()) {
        const computedHash = crypto.createHash('sha256').update(coverSessionToken).digest('hex');
        if (constantTimeEqualHex(computedHash, sess.session_secret_hash)) {
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
      }
    } else if (directCoverFile && directCoverFile.size > 0) {
      coverBuffer = Buffer.from(await directCoverFile.arrayBuffer());
      coverFileName = directCoverFile.name;
    }

    let coverValidation: any = null;
    if (coverBuffer && coverBuffer.length > 0) {
      coverValidation = validateCandidateBuffer(
        coverBuffer,
        coverFileName,
        'cover_letter',
        coverSessionRecord?.cover_mime_type || directCoverFile?.type
      );
      if (!coverValidation.valid) {
        return NextResponse.json({ ok: false, error: coverValidation.error }, { status: 400 });
      }
    }

    // 9. Fail-Closed Atomic Reference Generator
    let referenceNumber: string;
    try {
      referenceNumber = await getAtomicRecruitmentReference(supabase, 'APP');
    } catch (refErr: any) {
      console.error('Fatal: Reference counter generation failed:', refErr?.message);
      return NextResponse.json({ ok: false, error: 'Failed to generate canonical reference number. Please try again.' }, { status: 500 });
    }

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

    const roleInterest = applicationType === 'eoi' ? (fields.role_interest ? String(fields.role_interest).slice(0, 100) : null) : null;
    const roleInterestOther = applicationType === 'eoi' && fields.role_interest === 'Other' ? (fields.role_interest_other ? String(fields.role_interest_other).slice(0, 200) : null) : null;

    const experienceSummary = fields.experience_summary || fields.notes_summary || null;
    const qualificationSummary = fields.qualification_summary || null;

    // 10. Store Resume in Canonical Storage Path
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

    // 11. Insert canonical job_applications row
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
      preferred_service_area_ids: preferredAreas,
      employment_preferences: employmentPrefs,
      earliest_start_date: fields.earliest_start_date || null,
      experience_summary: experienceSummary ? String(experienceSummary).slice(0, 3000) : null,
      qualification_summary: qualificationSummary ? String(qualificationSummary).slice(0, 3000) : null,
      driver_licence_status: driverLicenceStatus,
      vehicle_access_status: vehicleAccessStatus,
      work_rights_status: workRights,
      ndiswc_status_declared: ndiswcStatus,
      police_check_status_declared: policeCheckStatus,
      first_aid_status_declared: firstAidStatus,
      cpr_status_declared: cprStatus,
      wwcc_status_declared: wwccStatus,
      availability: availabilityObj,
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

    // 12. Insert job_application_files record for Resume
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

    // 13. Store optional Cover Letter if present
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

    // 14. Transactional Timeline Event with Fail-Closed Rollback
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

    // 15. Fail-Safe Email Dispatch
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
      preferredServiceAreas: preferredAreas,
      employmentPreferences: employmentPrefs,
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
