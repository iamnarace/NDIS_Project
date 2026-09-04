import { NextResponse } from 'next/server';

const required = ['name', 'role', 'phone', 'email', 'consent'] as const;

function text(value: unknown, max = 1000) {
  return String(value ?? '').trim().slice(0, max);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    for (const field of required) {
      if (!text(body[field], 300)) return NextResponse.json({ message: `Please complete ${field}.` }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const to = process.env.REFERRAL_TO_EMAIL;
    const from = process.env.FROM_EMAIL;
    if (!apiKey || !to || !from) {
      return NextResponse.json({ message: 'Online referrals are not configured yet. Please email bijaykafle41@gmail.com.' }, { status: 503 });
    }

    const subject = `New Opus Care referral enquiry — ${text(body.name, 120)}`;
    const lines = [
      `Name: ${text(body.name, 120)}`,
      `Role: ${text(body.role, 120)}`,
      `Phone: ${text(body.phone, 80)}`,
      `Email: ${text(body.email, 160)}`,
      `Suburb: ${text(body.suburb, 120) || 'Not provided'}`,
      `Funding: ${text(body.funding, 120) || 'Not provided'}`,
      `Service: ${text(body.service, 160) || 'Not provided'}`,
      `Preferred contact: ${text(body.contactPreference, 80) || 'Not provided'}`,
      '',
      'Enquiry:',
      text(body.message, 2500) || 'No additional message.',
    ];

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], reply_to: text(body.email, 160), subject, text: lines.join('\n') }),
    });

    if (!response.ok) {
      console.error('Referral email failed', response.status);
      return NextResponse.json({ message: 'We could not send the enquiry right now. Please email Opus Care directly.' }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: 'Invalid referral request.' }, { status: 400 });
  }
}
