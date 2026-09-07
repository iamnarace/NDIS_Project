import { NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/training/certificate?completion_id=...
 * Returns HTML for a printable internal training certificate.
 * The certificate clearly states it is NOT a nationally accredited qualification.
 */
export async function GET(req: Request) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) return new Response('Unauthorized', { status: 401 });

  const supabase = createAdminClient();
  if (!supabase) return new Response('Database unavailable', { status: 503 });

  const { searchParams } = new URL(req.url);
  const completionId = searchParams.get('completion_id');

  if (!completionId) return new Response('completion_id required', { status: 400 });

  const { data: completion, error } = await supabase
    .from('training_completions')
    .select('*, training_courses(title, description)')
    .eq('id', completionId)
    .single();

  if (error || !completion) return new Response('Completion not found', { status: 404 });

  const course = (completion.training_courses as { title?: string } | null);
  const courseTitle = course?.title ?? 'Training Module';
  const workerName = completion.staff_name ?? 'Staff Member';
  const certId = completion.certificate_id ?? `OC-TRN-${completionId.slice(0, 8).toUpperCase()}`;
  const issueDate = completion.certificate_issue_date
    ? new Date(completion.certificate_issue_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
  const expiresDate = completion.expires_at
    ? new Date(completion.expires_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;
  const scoreLine = completion.quiz_score_pct !== null && completion.quiz_score_pct !== undefined
    ? `<p class="score">Assessment Score: ${completion.quiz_score_pct}%</p>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Certificate of Completion — ${courseTitle}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;500&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #f4f1ec; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 40px; font-family: 'Inter', sans-serif; }
    .cert { background: #fff; border: 1px solid #d4c5a9; border-radius: 4px; max-width: 800px; width: 100%; padding: 64px 72px; text-align: center; position: relative; box-shadow: 0 4px 32px rgba(0,0,0,0.08); }
    .cert::before { content: ''; position: absolute; inset: 12px; border: 1.5px solid #c9a96e; border-radius: 2px; pointer-events: none; }
    .logo-line { display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 40px; }
    .logo-mark { width: 48px; height: 48px; background: #1a3a6b; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 18px; font-weight: 700; letter-spacing: -1px; }
    .org-name { font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 500; color: #1a3a6b; letter-spacing: 0.05em; text-transform: uppercase; }
    .rule { width: 80px; height: 2px; background: #c9a96e; margin: 0 auto 24px; }
    .cert-label { font-family: 'Playfair Display', serif; font-size: 13px; letter-spacing: 0.25em; text-transform: uppercase; color: #8a7560; margin-bottom: 12px; }
    h1 { font-family: 'Playfair Display', serif; font-size: 36px; color: #1a1a1a; line-height: 1.2; margin-bottom: 28px; }
    .certifies { font-size: 14px; color: #666; margin-bottom: 16px; letter-spacing: 0.05em; text-transform: uppercase; }
    .worker-name { font-family: 'Playfair Display', serif; font-size: 32px; color: #1a3a6b; border-bottom: 1.5px solid #c9a96e; display: inline-block; padding-bottom: 8px; margin-bottom: 28px; min-width: 280px; }
    .completed-text { font-size: 14px; color: #666; margin-bottom: 12px; }
    .course-title { font-family: 'Playfair Display', serif; font-size: 22px; color: #1a1a1a; margin-bottom: 32px; font-style: italic; }
    .score { font-size: 13px; color: #666; margin-bottom: 24px; }
    .meta-row { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 48px; padding-top: 24px; border-top: 1px solid #e8e0d0; }
    .meta-col { text-align: left; }
    .meta-col.right { text-align: right; }
    .meta-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #aaa; margin-bottom: 4px; }
    .meta-value { font-size: 13px; color: #333; font-weight: 500; }
    .disclaimer { margin-top: 32px; font-size: 10px; color: #999; letter-spacing: 0.02em; border-top: 1px solid #f0ebe0; padding-top: 16px; }
    @media print {
      body { background: white; padding: 0; }
      .cert { box-shadow: none; border: 1px solid #ccc; }
      .print-btn { display: none; }
    }
    .print-btn { margin-top: 32px; padding: 12px 32px; background: #1a3a6b; color: #fff; border: none; border-radius: 4px; font-size: 14px; cursor: pointer; font-family: 'Inter', sans-serif; }
    .print-btn:hover { background: #1e4a8a; }
  </style>
</head>
<body>
  <div class="cert">
    <div class="logo-line">
      <div class="logo-mark">OC</div>
      <span class="org-name">Opus Care Support Services</span>
    </div>
    <div class="rule"></div>
    <p class="cert-label">Certificate of Completion</p>
    <h1>Internal Training Certificate</h1>
    <p class="certifies">This certifies that</p>
    <div class="worker-name">${workerName}</div>
    <p class="completed-text">has successfully completed</p>
    <div class="course-title">${courseTitle}</div>
    ${scoreLine}
    <div class="meta-row">
      <div class="meta-col">
        <div class="meta-label">Date Completed</div>
        <div class="meta-value">${issueDate}</div>
        ${expiresDate ? `<div class="meta-label" style="margin-top:8px">Valid Until</div><div class="meta-value">${expiresDate}</div>` : ''}
      </div>
      <div class="meta-col right">
        <div class="meta-label">Certificate ID</div>
        <div class="meta-value">${certId}</div>
        <div class="meta-label" style="margin-top:8px">Issued By</div>
        <div class="meta-value">Opus Care Pty Ltd</div>
      </div>
    </div>
    <p class="disclaimer">Internal Training Certificate — Not a nationally accredited qualification.<br/>This certificate does not represent completion of any NDIS Commission, TAFE, or RTO-registered course.</p>
    <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
