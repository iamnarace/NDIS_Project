import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const DEFAULT_FROM = process.env.FROM_EMAIL || 'Opus Care <support@opuscare.com.au>';
const REFERRAL_EMAIL = process.env.REFERRAL_TO_EMAIL || 'referrals@opuscare.com.au';
const CONTACT_EMAIL = process.env.CONTACT_TO_EMAIL || 'contact@opuscare.com.au';

export interface ReferralData {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  participantName: string;
  suburb: string;
  funding: string;
  services: string;
  schedulePreference: string;
  message: string;
  createdAt: string;
}

export interface ContactData {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}

export async function sendReferralClientConfirmation(referral: ReferralData) {
  if (!referral.email) return { ok: false, message: 'No client email provided' };

  const subject = `Thank you for your referral, ${referral.participantName || referral.name} · Opus Care Support Services`;
  const html = `<!DOCTYPE html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#1e293b"><h2>Thank you for contacting Opus Care</h2><p>Hello <strong>${referral.name}</strong>,</p><p>We have received your NDIS support referral for <strong>${referral.participantName || referral.name}</strong>. Our team will review it and contact you within 24 business hours.</p><p><strong>Referral ID:</strong> ${referral.id}<br><strong>Location:</strong> ${referral.suburb}<br><strong>Services:</strong> ${referral.services}</p><p>Questions? Reply to this email or contact <a href="mailto:referrals@opuscare.com.au">referrals@opuscare.com.au</a>.</p><p>Kind regards,<br><strong>Opus Care Support Services</strong></p></body></html>`;

  if (!resend) return { ok: true, simulated: true };
  try {
    const data = await resend.emails.send({ from: DEFAULT_FROM, to: [referral.email], replyTo: REFERRAL_EMAIL, subject, html });
    return { ok: true, data };
  } catch (error) {
    console.error('Failed to send client referral confirmation email', error);
    return { ok: false, error };
  }
}

export async function sendReferralAdminAlert(referral: ReferralData) {
  const subject = `New NDIS Referral: ${referral.participantName || referral.name} (${referral.suburb}) - #${referral.id}`;
  const html = `<!DOCTYPE html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#0f172a"><h2>New NDIS Referral Received</h2><p><strong>Referral ID:</strong> ${referral.id}</p><p><strong>Participant:</strong> ${referral.participantName || referral.name}</p><p><strong>Referrer:</strong> ${referral.name} (${referral.role})</p><p><strong>Phone:</strong> ${referral.phone}</p><p><strong>Email:</strong> ${referral.email}</p><p><strong>Location:</strong> ${referral.suburb}</p><p><strong>Funding:</strong> ${referral.funding}</p><p><strong>Services:</strong> ${referral.services}</p><p><strong>Preferred schedule:</strong> ${referral.schedulePreference}</p><p><strong>Notes:</strong> ${referral.message || 'None provided'}</p></body></html>`;

  if (!resend) return { ok: true, simulated: true };
  try {
    const data = await resend.emails.send({ from: DEFAULT_FROM, to: [REFERRAL_EMAIL], replyTo: referral.email, subject, html });
    return { ok: true, data };
  } catch (error) {
    console.error('Failed to send admin referral alert', error);
    return { ok: false, error };
  }
}

export async function sendContactEmails(contact: ContactData) {
  const adminSubject = `New Website Enquiry from ${contact.name}: ${contact.subject || 'General Enquiry'}`;
  const adminHtml = `<!DOCTYPE html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#0f172a"><h2>New Website Enquiry</h2><p><strong>Name:</strong> ${contact.name}</p><p><strong>Email:</strong> ${contact.email}</p>${contact.phone ? `<p><strong>Phone:</strong> ${contact.phone}</p>` : ''}${contact.subject ? `<p><strong>Subject:</strong> ${contact.subject}</p>` : ''}<p><strong>Message:</strong></p><p>${contact.message}</p></body></html>`;
  const clientSubject = 'We have received your enquiry · Opus Care Support Services';
  const clientHtml = `<!DOCTYPE html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#1e293b"><h2>Thank you for contacting Opus Care</h2><p>Hello ${contact.name},</p><p>We have received your enquiry and our support team will reply within 24 business hours.</p><p>Kind regards,<br><strong>Opus Care Support Services</strong><br><a href="mailto:contact@opuscare.com.au">contact@opuscare.com.au</a></p></body></html>`;

  if (!resend) return { ok: true, simulated: true };
  try {
    await Promise.all([
      resend.emails.send({ from: DEFAULT_FROM, to: [CONTACT_EMAIL], replyTo: contact.email, subject: adminSubject, html: adminHtml }),
      resend.emails.send({ from: DEFAULT_FROM, to: [contact.email], replyTo: CONTACT_EMAIL, subject: clientSubject, html: clientHtml }),
    ]);
    return { ok: true };
  } catch (error) {
    console.error('Error sending contact emails', error);
    return { ok: false, error };
  }
}

export interface CareersApplicantEmailData {
  firstName: string;
  referenceNumber: string;
  roleOrEoi: string;
  roleInterest?: string;
  applicationLabel: string; // e.g. 'application' or 'Expression of Interest'
  email: string;
  replyTo?: string;
}

export interface CareersAdminEmailData {
  referenceNumber: string;
  applicantName: string;
  roleOrEoi: string;
  roleInterest?: string;
  applicationType: 'vacancy' | 'eoi';
  email: string;
  phone: string;
  suburb: string;
  postcode: string;
  preferredServiceAreas: string[];
  employmentPreferences: string[];
  submittedAt: string;
  toEmail?: string;
  appUrl?: string;
}

const CAREERS_DEFAULT_EMAIL = process.env.CAREERS_TO_EMAIL || 'support@opuscare.com.au';

export async function sendCareersApplicantAcknowledgement(data: CareersApplicantEmailData) {
  if (!data.email) return { ok: false, error: 'No applicant email provided' };

  const subject = `We've received your application · Opus Care Support Services · ${data.referenceNumber}`;
  const html = `<!DOCTYPE html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#1e293b;line-height:1.6">
<h2>Thank you for your interest in Opus Care</h2>
<p>Hello <strong>${data.firstName}</strong>,</p>
<p>Thank you for your interest in joining Opus Care Support Services.</p>
<p>We've received your ${data.applicationLabel || 'application'} for:</p>
<p style="font-size:1.1rem;font-weight:bold;color:#0f172a;background:#f1f5f9;padding:10px 14px;border-radius:6px;">${data.roleOrEoi}${data.roleInterest ? ` (${data.roleInterest})` : ''}</p>
<p>Application reference: <strong>${data.referenceNumber}</strong></p>
<p>Our team will review your information and contact you if we need anything further or would like to progress your application.</p>
<p style="color:#64748b;font-size:0.875rem;border-left:3px solid #cbd5e1;padding-left:12px;margin:20px 0;">
Please do not email sensitive identity, banking, tax or screening documents unless an authorised Opus Care team member asks you to use an approved secure process.
</p>
<p>Kind regards,<br><strong>Opus Care Support Services</strong></p>
</body></html>`;

  if (!resend) return { ok: true, simulated: true };
  try {
    const result = await resend.emails.send({
      from: DEFAULT_FROM,
      to: [data.email],
      replyTo: data.replyTo || CAREERS_DEFAULT_EMAIL,
      subject,
      html,
    });
    if ((result as any)?.error) {
      return { ok: false, error: (result as any).error.message || 'Resend delivery rejected' };
    }
    return { ok: true, data: result };
  } catch (error: any) {
    console.error('Failed to send careers applicant acknowledgement', error);
    return { ok: false, error: error?.message || 'Failed to send applicant email' };
  }
}

export async function sendCareersAdminAlert(data: CareersAdminEmailData) {
  const targetEmail = data.toEmail || CAREERS_DEFAULT_EMAIL;
  const subject = `New Careers Application · ${data.referenceNumber} · ${data.applicantName}`;
  const adminUrl = `${data.appUrl || 'https://opuscare.com.au'}/admin?tab=recruitment`;
  const html = `<!DOCTYPE html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;line-height:1.5">
<h2>New Careers Application Received</h2>
<table style="border-collapse:collapse;width:100%;max-width:600px;font-size:0.95rem;">
  <tr><td style="padding:6px 0;color:#64748b;width:160px;">Reference:</td><td><strong>${data.referenceNumber}</strong></td></tr>
  <tr><td style="padding:6px 0;color:#64748b;">Type / Role:</td><td><strong>${data.roleOrEoi}</strong> (${data.applicationType.toUpperCase()})${data.roleInterest ? ` · Interest: ${data.roleInterest}` : ''}</td></tr>
  <tr><td style="padding:6px 0;color:#64748b;">Applicant:</td><td><strong>${data.applicantName}</strong></td></tr>
  <tr><td style="padding:6px 0;color:#64748b;">Email:</td><td><a href="mailto:${data.email}">${data.email}</a></td></tr>
  <tr><td style="padding:6px 0;color:#64748b;">Mobile:</td><td>${data.phone}</td></tr>
  <tr><td style="padding:6px 0;color:#64748b;">Location:</td><td>${data.suburb} NSW ${data.postcode}</td></tr>
  <tr><td style="padding:6px 0;color:#64748b;">Preferred Areas:</td><td>${data.preferredServiceAreas?.join(', ') || 'None specified'}</td></tr>
  <tr><td style="padding:6px 0;color:#64748b;">Employment Prefs:</td><td>${data.employmentPreferences?.join(', ') || 'Not specified'}</td></tr>
  <tr><td style="padding:6px 0;color:#64748b;">Submitted At:</td><td>${data.submittedAt}</td></tr>
</table>
<p style="margin-top:20px;">
  <a href="${adminUrl}" style="display:inline-block;background:#0369a1;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:600;">
    Review in Recruitment CRM
  </a>
</p>
<p style="font-size:0.8rem;color:#94a3b8;margin-top:24px;">
Note: For privacy and security, candidate CVs and cover letters are stored securely and never attached to email notifications. Open the authenticated CRM to view uploaded documents.
</p>
</body></html>`;

  if (!resend) return { ok: true, simulated: true };
  try {
    const result = await resend.emails.send({
      from: DEFAULT_FROM,
      to: [targetEmail],
      replyTo: data.email,
      subject,
      html,
    });
    if ((result as any)?.error) {
      return { ok: false, error: (result as any).error.message || 'Resend delivery rejected' };
    }
    return { ok: true, data: result };
  } catch (error: any) {
    console.error('Failed to send careers admin alert email', error);
    return { ok: false, error: error?.message || 'Failed to send admin alert email' };
  }
}
