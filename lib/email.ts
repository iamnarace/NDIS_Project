import { Resend } from 'resend';

// Initialize Resend client if API key is present
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const DEFAULT_FROM = process.env.FROM_EMAIL || 'Opus Care <support@opuscare.com.au>';
const ADMIN_EMAIL = process.env.REFERRAL_TO_EMAIL || 'support@opuscare.com.au';

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

/**
 * Sends a confirmation email to the client/participant/referrer
 */
export async function sendReferralClientConfirmation(referral: ReferralData) {
  if (!referral.email) return { ok: false, message: 'No client email provided' };

  const subject = `Thank you for your referral, ${referral.participantName || referral.name} · Opus Care Support Services`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; }
          .header { background: #1e1b4b; padding: 32px 24px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
          .header p { margin: 8px 0 0; color: #c7d2fe; font-size: 14px; }
          .body { padding: 32px 24px; }
          .welcome { font-size: 16px; line-height: 1.6; color: #334155; margin-bottom: 24px; }
          .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 28px; }
          .summary-title { font-size: 14px; font-weight: 800; color: #1e1b4b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; }
          .summary-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
          .summary-label { color: #64748b; }
          .summary-value { font-weight: 600; color: #0f172a; text-align: right; }
          .next-steps { background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 12px; padding: 20px; margin-bottom: 28px; }
          .next-steps h3 { margin: 0 0 10px; color: #5b21b6; font-size: 15px; font-weight: 700; }
          .next-steps ol { margin: 0; padding-left: 20px; color: #475569; font-size: 14px; line-height: 1.6; }
          .doc-buttons { text-align: center; margin: 32px 0 24px; }
          .btn-primary { display: inline-block; background: #391c63; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 9999px; font-weight: 700; font-size: 15px; margin: 6px; }
          .btn-secondary { display: inline-block; background: #ffffff; color: #391c63 !important; border: 2px solid #391c63; text-decoration: none; padding: 12px 26px; border-radius: 9999px; font-weight: 700; font-size: 15px; margin: 6px; }
          .footer { background: #f8fafc; padding: 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
          .footer a { color: #7c3aed; text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Opus Care Support Services</h1>
            <p>Person-Centred NDIS Disability Support · Northern NSW</p>
          </div>

          <div class="body">
            <p class="welcome">
              Hello <strong>${referral.name}</strong>,
            </p>
            <p class="welcome">
              Thank you for reaching out to Opus Care. We have successfully received your NDIS support referral for <strong>${referral.participantName || referral.name}</strong>.
            </p>

            <div class="summary-card">
              <div class="summary-title">Referral Summary (#${referral.id})</div>
              <div class="summary-row"><span class="summary-label">Participant:</span> <span class="summary-value">${referral.participantName || referral.name}</span></div>
              <div class="summary-row"><span class="summary-label">Contact Person:</span> <span class="summary-value">${referral.name} (${referral.role})</span></div>
              <div class="summary-row"><span class="summary-label">Location / Suburb:</span> <span class="summary-value">${referral.suburb}</span></div>
              <div class="summary-row"><span class="summary-label">Funding Model:</span> <span class="summary-value">${referral.funding}</span></div>
              <div class="summary-row"><span class="summary-label">Services Requested:</span> <span class="summary-value">${referral.services}</span></div>
              <div class="summary-row"><span class="summary-label">Preferred Schedule:</span> <span class="summary-value">${referral.schedulePreference}</span></div>
            </div>

            <div class="next-steps">
              <h3>What Happens Next?</h3>
              <ol>
                <li><strong>Review &amp; Initial Contact:</strong> Our local care coordinator will review your goals and contact you within 24 business hours to discuss your support preferences.</li>
                <li><strong>Support Worker Matching:</strong> We match you with vetted local support workers whose skills, personality, and schedule align with yours.</li>
                <li><strong>Service Agreement &amp; Schedule of Supports:</strong> We establish a transparent agreement outlining your supports and funding limits with full choice and control.</li>
              </ol>
            </div>

            <div class="doc-buttons">
              <a href="https://opuscare.com.au/documents/service-agreement" class="btn-primary" target="_blank">
                View NDIS Service Agreement Template
              </a>
              <a href="https://opuscare.com.au/portal" class="btn-secondary" target="_blank">
                Access Participant Portal
              </a>
            </div>

            <p style="font-size: 14px; color: #64748b; text-align: center; margin-top: 24px;">
              Need urgent assistance or have questions? Email our team directly at <a href="mailto:support@opuscare.com.au" style="color: #7c3aed; font-weight: 600;">support@opuscare.com.au</a>.
            </p>
          </div>

          <div class="footer">
            <p>&copy; 2026 Opus Care Support Services Pty Ltd · NSW North Coast &amp; Northern Rivers</p>
            <p>Unregistered NDIS Provider · Supporting Self-Managed &amp; Plan-Managed Participants</p>
            <p><a href="https://opuscare.com.au">opuscare.com.au</a> · <a href="https://opuscare.com.au/privacy">Privacy Policy</a></p>
          </div>
        </div>
      </body>
    </html>
  `;

  if (!resend) {
    console.log(`[Resend Sim] Would send client confirmation email to ${referral.email} (Referral ID: ${referral.id})`);
    return { ok: true, simulated: true };
  }

  try {
    const data = await resend.emails.send({
      from: DEFAULT_FROM,
      to: [referral.email],
      replyTo: 'support@opuscare.com.au',
      subject,
      html: htmlContent,
    });
    return { ok: true, data };
  } catch (error) {
    console.error('Failed to send client referral confirmation email', error);
    return { ok: false, error };
  }
}

/**
 * Sends an alert email to the Opus Care intake/admin team
 */
export async function sendReferralAdminAlert(referral: ReferralData) {
  const subject = `🚨 New NDIS Referral: ${referral.participantName || referral.name} (${referral.suburb}) - #${referral.id}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: system-ui, sans-serif; background-color: #f1f5f9; color: #0f172a; padding: 20px; }
          .box { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 24px; border: 1px solid #cbd5e1; }
          h2 { color: #1e1b4b; margin-top: 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: left; font-size: 14px; }
          th { background: #f8fafc; color: #475569; width: 35%; }
          .btn { display: inline-block; background: #0284c7; color: #fff !important; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 700; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="box">
          <h2>New NDIS Referral Received</h2>
          <p>A new referral has been submitted via <strong>opuscare.com.au/referral</strong> and logged in the CRM.</p>
          <table>
            <tr><th>Referral ID</th><td><strong>${referral.id}</strong></td></tr>
            <tr><th>Participant Name</th><td><strong>${referral.participantName || referral.name}</strong></td></tr>
            <tr><th>Referrer / Role</th><td>${referral.name} (${referral.role})</td></tr>
            <tr><th>Phone</th><td><a href="tel:${referral.phone}">${referral.phone}</a></td></tr>
            <tr><th>Email</th><td><a href="mailto:${referral.email}">${referral.email}</a></td></tr>
            <tr><th>Location / Suburb</th><td>${referral.suburb}</td></tr>
            <tr><th>NDIS Funding Model</th><td><span style="background:#f3e8ff; color:#7c3aed; padding:3px 8px; border-radius:4px; font-weight:700;">${referral.funding}</span></td></tr>
            <tr><th>Services Needed</th><td>${referral.services}</td></tr>
            <tr><th>Preferred Schedule</th><td>${referral.schedulePreference}</td></tr>
            <tr><th>Notes / Goals</th><td>${referral.message || 'None provided'}</td></tr>
            <tr><th>Submission Time</th><td>${new Date(referral.createdAt).toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })} AEST</td></tr>
          </table>
          <div style="text-align: center;">
            <a href="https://opuscare.com.au/admin" class="btn" target="_blank">Open Staff CRM Dashboard</a>
          </div>
        </div>
      </body>
    </html>
  `;

  if (!resend) {
    console.log(`[Resend Sim] Would send admin alert to ${ADMIN_EMAIL} for Referral #${referral.id}`);
    return { ok: true, simulated: true };
  }

  try {
    const data = await resend.emails.send({
      from: DEFAULT_FROM,
      to: [ADMIN_EMAIL],
      replyTo: referral.email,
      subject,
      html: htmlContent,
    });
    return { ok: true, data };
  } catch (error) {
    console.error('Failed to send admin referral alert', error);
    return { ok: false, error };
  }
}

/**
 * Sends a confirmation email for general contact enquiries
 */
export async function sendContactEmails(contact: ContactData) {
  const adminSubject = `📩 New Website Enquiry from ${contact.name}: ${contact.subject || 'General Enquiry'}`;
  
  const adminHtml = `
    <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; border: 1px solid #e2e8f0;">
      <h2 style="color: #1e1b4b; margin-top: 0;">New Website Enquiry</h2>
      <p><strong>Name:</strong> ${contact.name}</p>
      <p><strong>Email:</strong> <a href="mailto:${contact.email}">${contact.email}</a></p>
      ${contact.phone ? `<p><strong>Phone:</strong> ${contact.phone}</p>` : ''}
      ${contact.subject ? `<p><strong>Subject:</strong> ${contact.subject}</p>` : ''}
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
      <p><strong>Message:</strong></p>
      <p style="white-space: pre-wrap; background: #f8fafc; padding: 12px; border-radius: 8px;">${contact.message}</p>
    </div>
  `;

  const clientSubject = `We have received your enquiry · Opus Care Support Services`;
  const clientHtml = `
    <div style="font-family: sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; border: 1px solid #e2e8f0;">
      <h2 style="color: #1e1b4b;">Thank you for contacting Opus Care</h2>
      <p>Hello ${contact.name},</p>
      <p>We have received your enquiry and our local support team will review your message and reply promptly within 24 business hours.</p>
      <div style="background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 8px; padding: 14px; margin: 16px 0;">
        <p style="margin: 0; color: #475569; font-size: 14px;"><strong>Your message:</strong></p>
        <p style="margin: 6px 0 0; color: #1e1b4b; font-size: 14px; font-style: italic;">"${contact.message}"</p>
      </div>
      <p>In the meantime, feel free to explore our <a href="https://opuscare.com.au/services" style="color: #7c3aed; font-weight: 600;">services</a> or check your coverage across our <a href="https://opuscare.com.au/service-areas" style="color: #7c3aed; font-weight: 600;">service areas</a>.</p>
      <p style="color: #64748b; font-size: 13px; margin-top: 24px;">Kind regards,<br><strong>Opus Care Support Services Team</strong><br>support@opuscare.com.au</p>
    </div>
  `;

  if (!resend) {
    console.log(`[Resend Sim] Would send contact email to ${contact.email} and alert to ${ADMIN_EMAIL}`);
    return { ok: true, simulated: true };
  }

  try {
    await Promise.all([
      resend.emails.send({
        from: DEFAULT_FROM,
        to: [ADMIN_EMAIL],
        replyTo: contact.email,
        subject: adminSubject,
        html: adminHtml,
      }),
      resend.emails.send({
        from: DEFAULT_FROM,
        to: [contact.email],
        replyTo: 'support@opuscare.com.au',
        subject: clientSubject,
        html: clientHtml,
      })
    ]);
    return { ok: true };
  } catch (err) {
    console.error('Error sending contact emails', err);
    return { ok: false, error: err };
  }
}
