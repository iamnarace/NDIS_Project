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
