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

export interface AgreementInvitationEmailData {
  recipientName: string;
  recipientEmail: string;
  agreementTitle: string;
  agreementReference: string;
  signingUrl: string;
  expiresAt: string;
  providerTradingName?: string;
}

export async function sendAgreementSigningInvitationEmail(data: AgreementInvitationEmailData) {
  if (!data.recipientEmail) return { ok: false, error: 'No recipient email address provided' };

  const tradingName = data.providerTradingName || 'Opus Care Support Services';
  const subject = `Action Required: Please review and sign your agreement · ${data.agreementReference} · ${tradingName}`;
  const expiryDateFormatted = new Date(data.expiresAt).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const html = `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;line-height:1.6;margin:0;padding:24px;background:#f8fafc;">
<div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:32px;">
  <div style="border-bottom:2px solid #0284c7;padding-bottom:12px;margin-bottom:24px;">
    <span style="color:#0284c7;font-size:12px;font-weight:800;letter-spacing:0.05em;text-transform:uppercase;">${tradingName}</span>
    <h2 style="color:#0f172a;margin:6px 0 0;font-size:20px;">Review &amp; Sign Agreement</h2>
  </div>
  <p>Hello <strong>${data.recipientName}</strong>,</p>
  <p>An official document has been prepared for your electronic signature:</p>
  <div style="background:#f1f5f9;border-radius:6px;padding:14px 18px;margin:20px 0;">
    <div style="font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;">Document Details</div>
    <div style="font-size:16px;font-weight:700;color:#0f172a;margin-top:2px;">${data.agreementTitle}</div>
    <div style="font-size:13px;color:#475569;margin-top:4px;">Reference: <strong>${data.agreementReference}</strong></div>
    <div style="font-size:12px;color:#dc2626;margin-top:6px;">Link expires: <strong>${expiryDateFormatted}</strong></div>
  </div>
  <p>Please click the button below to review the full agreement particulars, terms, and apply your digital signature:</p>
  <div style="margin:28px 0;text-align:center;">
    <a href="${data.signingUrl}" style="display:inline-block;background:#0284c7;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:600;font-size:15px;">
      Review &amp; Sign Agreement
    </a>
  </div>
  <p style="font-size:12px;color:#64748b;line-height:1.5;margin-top:28px;border-top:1px solid #f1f5f9;padding-top:16px;">
    <strong>Security &amp; Privacy Notice:</strong> This link is unique to you and cryptographically protected. Do not forward this email. In accordance with the <em>Electronic Transactions Act 1999 (Cth)</em>, submitting your digital signature constitutes a binding legal agreement.
  </p>
  <p style="font-size:12px;color:#94a3b8;margin-top:12px;">
    Questions? Contact <a href="mailto:support@opuscare.com.au" style="color:#0284c7;">support@opuscare.com.au</a>.
  </p>
</div>
</body></html>`;

  if (!resend) return { ok: true, simulated: true };
  try {
    const result = await resend.emails.send({
      from: DEFAULT_FROM,
      to: [data.recipientEmail],
      replyTo: 'support@opuscare.com.au',
      subject,
      html,
    });
    if ((result as any)?.error) {
      return { ok: false, error: (result as any).error.message || 'Resend delivery rejected' };
    }
    return { ok: true, data: result, messageId: (result as any)?.data?.id };
  } catch (error: any) {
    console.error('Failed to send agreement signing invitation email', error);
    return { ok: false, error: error?.message || 'Failed to dispatch email' };
  }
}

export async function sendAgreementExecutionCompletedEmail(data: {
  recipientName: string;
  recipientEmail: string;
  agreementTitle: string;
  agreementReference: string;
  executedAt: string;
}) {
  if (!data.recipientEmail) return { ok: false, error: 'No recipient email provided' };

  const subject = `Agreement Executed: ${data.agreementTitle} · ${data.agreementReference} · Opus Care Support Services`;
  const html = `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;line-height:1.6;margin:0;padding:24px;background:#f8fafc;">
<div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:32px;">
  <div style="border-bottom:2px solid #059669;padding-bottom:12px;margin-bottom:24px;">
    <span style="color:#059669;font-size:12px;font-weight:800;letter-spacing:0.05em;text-transform:uppercase;">Opus Care Support Services</span>
    <h2 style="color:#0f172a;margin:6px 0 0;font-size:20px;">Agreement Fully Executed</h2>
  </div>
  <p>Hello <strong>${data.recipientName}</strong>,</p>
  <p>All required signatures have been successfully recorded. Your agreement is now officially executed and active.</p>
  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:14px 18px;margin:20px 0;">
    <div style="font-size:15px;font-weight:700;color:#166534;">${data.agreementTitle}</div>
    <div style="font-size:13px;color:#15803d;margin-top:2px;">Reference: <strong>${data.agreementReference}</strong></div>
    <div style="font-size:12px;color:#166534;margin-top:4px;">Executed: ${new Date(data.executedAt).toISOString()}</div>
  </div>
  <p style="font-size:13px;color:#475569;">
    An authoritative immutable original has been permanently sealed in Opus Care's record system. If you require an updated PDF copy, reply to this email or access your participant/staff portal.
  </p>
  <p style="font-size:12px;color:#94a3b8;margin-top:20px;border-top:1px solid #f1f5f9;padding-top:14px;">
    Opus Care Support Services · ABN 41 267 197 576
  </p>
</div>
</body></html>`;

  if (!resend) return { ok: true, simulated: true };
  try {
    const result = await resend.emails.send({
      from: DEFAULT_FROM,
      to: [data.recipientEmail, 'support@opuscare.com.au'],
      replyTo: 'support@opuscare.com.au',
      subject,
      html,
    });
    return { ok: true, data: result };
  } catch (error: any) {
    console.error('Failed to send execution completed email', error);
    return { ok: false, error: error?.message || 'Failed to dispatch email' };
  }
}
