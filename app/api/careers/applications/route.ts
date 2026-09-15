import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { nextReferenceNumber } from '@/lib/referenceNumber';
import { sendCareersApplicantAcknowledgement, sendCareersAdminAlert } from '@/lib/email';
import crypto from 'crypto';

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.doc', '.docx']);
const ALLOWED_MIMES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/octet-stream', // often sent by windows browsers for doc/docx
]);

function getExtension(filename: string): string {
  const idx = filename.lastIndexOf('.');
  return idx !== -1 ? filename.substring(idx).toLowerCase() : '';
}

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

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
            // Check if stringified JSON (for arrays or availability)
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

    // Honeypot check — catch automated spam bots silently
    if (fields.website_url || fields.fax_number || fields.bot_check) {
      return NextResponse.json({ ok: true, reference_number: 'APP-2026-9999' });
    }

    const applicationType = fields.application_type === 'eoi' ? 'eoi' : 'vacancy';
    const vacancyId = fields.vacancy_id || null;

    let vacancyTitle = 'General Expression of Interest';
    if (applicationType === 'vacancy') {
      if (!vacancyId) {
        return NextResponse.json({ ok: false, error: 'Vacancy ID is required for vacancy applications.' }, { status: 400 });
      }

      // Check vacancy status and closing date
      const { data: vacancy, error: vacError } = await supabase
        .from('job_vacancies')
        .select('id, title, status, closes_at')
        .eq('id', vacancyId)
        .maybeSingle();

      if (vacError || !vacancy) {
        return NextResponse.json({ ok: false, error: 'The selected job opportunity was not found.' }, { status: 404 });
      }

      if (vacancy.status !== 'published') {
        return NextResponse.json({ ok: false, error: 'This opportunity is not currently accepting applications.' }, { status: 400 });
      }

      if (vacancy.closes_at && new Date(vacancy.closes_at).getTime() < Date.now()) {
        return NextResponse.json({ ok: false, error: 'Applications for this role have now closed.' }, { status: 400 });
      }

      vacancyTitle = vacancy.title;
    }

    // Validate applicant details
    const firstName = String(fields.first_name || '').trim();
    const lastName = String(fields.last_name || '').trim();
    const email = String(fields.email || '').trim().toLowerCase();
    const phone = String(fields.phone || '').trim();
    const suburb = String(fields.suburb || '').trim();
    const postcode = String(fields.postcode || '').trim();

    if (!firstName || firstName.length > 80) {
      return NextResponse.json({ ok: false, error: 'Please provide a valid first name (up to 80 characters).' }, { status: 400 });
    }
    if (!lastName || lastName.length > 80) {
      return NextResponse.json({ ok: false, error: 'Please provide a valid last name (up to 80 characters).' }, { status: 400 });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email) || email.length > 160) {
      return NextResponse.json({ ok: false, error: 'Please provide a valid email address.' }, { status: 400 });
    }
    if (!phone || phone.length > 40) {
      return NextResponse.json({ ok: false, error: 'Please provide a contact phone number.' }, { status: 400 });
    }
    if (!suburb || suburb.length > 100) {
      return NextResponse.json({ ok: false, error: 'Please provide your residential suburb.' }, { status: 400 });
    }
    if (!/^\d{4}$/.test(postcode)) {
      return NextResponse.json({ ok: false, error: 'Please provide a valid 4-digit Australian postcode.' }, { status: 400 });
    }

    // Consent declarations
    const privacyConsent = Boolean(fields.privacy_consent);
    const accuracyDeclaration = Boolean(fields.accuracy_declaration);

    if (!privacyConsent) {
      return NextResponse.json({ ok: false, error: 'You must confirm that you have read and agreed to the Privacy Policy to apply.' }, { status: 400 });
    }
    if (!accuracyDeclaration) {
      return NextResponse.json({ ok: false, error: 'You must declare that the information provided is accurate to the best of your knowledge.' }, { status: 400 });
    }

    // File validation
    if (applicationType === 'vacancy' && (!resumeFile || resumeFile.size === 0)) {
      return NextResponse.json({ ok: false, error: 'Please attach your Resume / CV in PDF, DOC, or DOCX format.' }, { status: 400 });
    }

    if (resumeFile && resumeFile.size > 0) {
      if (resumeFile.size > 8 * 1024 * 1024) {
        return NextResponse.json({ ok: false, error: 'Resume file exceeds the maximum limit of 8 MB.' }, { status: 400 });
      }
      const ext = getExtension(resumeFile.name);
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        return NextResponse.json({ ok: false, error: 'Resume must be a PDF, DOC, or DOCX document.' }, { status: 400 });
      }
    }

    if (coverFile && coverFile.size > 0) {
      if (coverFile.size > 5 * 1024 * 1024) {
        return NextResponse.json({ ok: false, error: 'Cover letter file exceeds the maximum limit of 5 MB.' }, { status: 400 });
      }
      const ext = getExtension(coverFile.name);
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        return NextResponse.json({ ok: false, error: 'Cover letter must be a PDF, DOC, or DOCX document.' }, { status: 400 });
      }
    }

    // Work preferences & declarations
    const preferredServiceAreaIds = Array.isArray(fields.preferred_service_area_ids) ? fields.preferred_service_area_ids : [];
    const employmentPreferences = Array.isArray(fields.employment_preferences) ? fields.employment_preferences : [];
    const workRightsStatus = String(fields.work_rights_status || 'yes').trim();
    const earliestStartDate = fields.earliest_start_date ? String(fields.earliest_start_date).slice(0, 10) : null;

    const experienceSummary = fields.experience_summary ? String(fields.experience_summary).slice(0, 1500) : null;
    const qualificationSummary = fields.qualification_summary ? String(fields.qualification_summary).slice(0, 1000) : null;

    const driverLicenceStatus = fields.driver_licence_status ? String(fields.driver_licence_status) : null;
    const vehicleAccessStatus = fields.vehicle_access_status ? String(fields.vehicle_access_status) : null;
    const ndiswcStatusDeclared = fields.ndiswc_status_declared ? String(fields.ndiswc_status_declared) : null;
    const policeCheckStatusDeclared = fields.police_check_status_declared ? String(fields.police_check_status_declared) : null;
    const firstAidStatusDeclared = fields.first_aid_status_declared ? String(fields.first_aid_status_declared) : null;
    const cprStatusDeclared = fields.cpr_status_declared ? String(fields.cpr_status_declared) : null;
    const wwccStatusDeclared = fields.wwcc_status_declared ? String(fields.wwcc_status_declared) : null;

    const availability = typeof fields.availability === 'object' && fields.availability !== null ? fields.availability : {};
    const availabilityNotes = fields.availability_notes ? String(fields.availability_notes).slice(0, 500) : null;
    const motivation = fields.motivation ? String(fields.motivation).slice(0, 1000) : null;

    // Fetch config for retention and careers destination email
    const { data: config } = await supabase
      .from('provider_config')
      .select('recruitment_retention_months, careers_email, support_email')
      .limit(1)
      .maybeSingle();

    const retentionMonths = config?.recruitment_retention_months || 12;
    const retentionUntil = new Date();
    retentionUntil.setMonth(retentionUntil.getMonth() + retentionMonths);

    // Generate APP-2026-XXXX reference number
    const referenceNumber = await nextReferenceNumber(supabase, 'job_applications', 'APP-2026', 4);
    const nowTimestamp = new Date().toISOString();

    // 1. Insert application record
    const { data: insertedApp, error: insertError } = await supabase
      .from('job_applications')
      .insert({
        reference_number: referenceNumber,
        application_type: applicationType,
        vacancy_id: applicationType === 'vacancy' ? vacancyId : null,
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone,
        suburb: suburb,
        postcode: postcode,
        preferred_service_area_ids: preferredServiceAreaIds,
        employment_preferences: employmentPreferences,
        work_rights_status: workRightsStatus,
        earliest_start_date: earliestStartDate,
        experience_summary: experienceSummary,
        qualification_summary: qualificationSummary,
        driver_licence_status: driverLicenceStatus,
        vehicle_access_status: vehicleAccessStatus,
        ndiswc_status_declared: ndiswcStatusDeclared,
        police_check_status_declared: policeCheckStatusDeclared,
        first_aid_status_declared: firstAidStatusDeclared,
        cpr_status_declared: cprStatusDeclared,
        wwcc_status_declared: wwccStatusDeclared,
        availability: availability,
        availability_notes: availabilityNotes,
        motivation: motivation,
        privacy_consent_at: nowTimestamp,
        accuracy_declaration_at: nowTimestamp,
        stage: 'new',
        source: 'website',
        submitted_at: nowTimestamp,
        retention_until: retentionUntil.toISOString().split('T')[0]
      })
      .select('id, reference_number')
      .single();

    if (insertError || !insertedApp) {
      console.error('Failed to insert job application:', insertError?.message);
      return NextResponse.json({ ok: false, error: 'Could not record application. Please try again.' }, { status: 500 });
    }

    const applicationId = insertedApp.id;

    // 2. Upload files if provided
    const uploadedFiles: Array<{ kind: string; name: string; size: number; mime: string; path: string }> = [];

    if (resumeFile && resumeFile.size > 0) {
      const buffer = Buffer.from(await resumeFile.arrayBuffer());
      const safeName = sanitizeFilename(resumeFile.name);
      const storagePath = `recruitment/applications/${applicationId}/${crypto.randomUUID()}_${safeName}`;

      const { error: uploadErr } = await supabase.storage
        .from('crm-documents')
        .upload(storagePath, buffer, {
          contentType: resumeFile.type || 'application/octet-stream',
          upsert: false
        });

      if (uploadErr) {
        console.error('Failed to store resume in crm-documents:', uploadErr.message);
      } else {
        await supabase.from('job_application_files').insert({
          application_id: applicationId,
          file_kind: 'resume',
          file_name: resumeFile.name,
          file_size: resumeFile.size,
          mime_type: resumeFile.type || 'application/octet-stream',
          storage_path: storagePath
        });
        uploadedFiles.push({ kind: 'resume', name: resumeFile.name, size: resumeFile.size, mime: resumeFile.type, path: storagePath });
      }
    }

    if (coverFile && coverFile.size > 0) {
      const buffer = Buffer.from(await coverFile.arrayBuffer());
      const safeName = sanitizeFilename(coverFile.name);
      const storagePath = `recruitment/applications/${applicationId}/${crypto.randomUUID()}_${safeName}`;

      const { error: uploadErr } = await supabase.storage
        .from('crm-documents')
        .upload(storagePath, buffer, {
          contentType: coverFile.type || 'application/octet-stream',
          upsert: false
        });

      if (uploadErr) {
        console.error('Failed to store cover letter in crm-documents:', uploadErr.message);
      } else {
        await supabase.from('job_application_files').insert({
          application_id: applicationId,
          file_kind: 'cover_letter',
          file_name: coverFile.name,
          file_size: coverFile.size,
          mime_type: coverFile.type || 'application/octet-stream',
          storage_path: storagePath
        });
        uploadedFiles.push({ kind: 'cover_letter', name: coverFile.name, size: coverFile.size, mime: coverFile.type, path: storagePath });
      }
    }

    // 3. Insert initial event in timeline
    await supabase.from('job_application_events').insert({
      application_id: applicationId,
      event_type: 'submitted',
      from_stage: null,
      to_stage: 'new',
      note: applicationType === 'eoi' ? 'Expression of Interest submitted via website' : `Application submitted for vacancy: ${vacancyTitle}`,
      actor: 'applicant'
    });

    // 4. Attempt email notifications (fail-safe: application is already persisted)
    try {
      const roleOrEoiLabel = applicationType === 'eoi' ? 'Expression of Interest' : vacancyTitle;
      const appLabel = applicationType === 'eoi' ? 'Expression of Interest' : 'job application';

      await sendCareersApplicantAcknowledgement({
        firstName: firstName,
        referenceNumber: referenceNumber,
        roleOrEoi: roleOrEoiLabel,
        applicationLabel: appLabel,
        email: email
      });

      await sendCareersAdminAlert({
        referenceNumber: referenceNumber,
        applicantName: `${firstName} ${lastName}`,
        roleOrEoi: roleOrEoiLabel,
        applicationType: applicationType,
        email: email,
        phone: phone,
        suburb: suburb,
        postcode: postcode,
        preferredServiceAreas: preferredServiceAreaIds,
        employmentPreferences: employmentPreferences,
        submittedAt: new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' }),
        toEmail: config?.careers_email || config?.support_email || undefined
      });
    } catch (emailErr: any) {
      console.error('Careers notification email failed safely:', emailErr?.message || emailErr);
      await supabase.from('job_application_events').insert({
        application_id: applicationId,
        event_type: 'email_delivery_failed',
        note: 'Email notification delivery could not be completed at submission time.',
        actor: 'system'
      });
    }

    return NextResponse.json({
      ok: true,
      reference_number: referenceNumber,
      application_id: applicationId
    });
  } catch (err: any) {
    console.error('Unhandled error in careers application submission:', err?.message || err);
    return NextResponse.json({ ok: false, error: 'A system error occurred while processing your application. Please try again.' }, { status: 500 });
  }
}
