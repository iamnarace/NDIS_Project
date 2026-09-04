import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const required = ['name', 'phone', 'email'] as const;

function text(value: unknown, max = 1000) {
  return String(value ?? '').trim().slice(0, max);
}

const dataFilePath = path.join(process.cwd(), 'data', 'referrals.json');

function getReferrals() {
  try {
    if (!fs.existsSync(dataFilePath)) {
      return [];
    }
    const raw = fs.readFileSync(dataFilePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading referrals.json', err);
    return [];
  }
}

function saveReferrals(items: any[]) {
  try {
    const dir = path.dirname(dataFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dataFilePath, JSON.stringify(items, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing referrals.json', err);
  }
}

export async function GET() {
  const referrals = getReferrals();
  return NextResponse.json(referrals);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    for (const field of required) {
      if (!text(body[field], 300)) {
        return NextResponse.json({ message: `Please provide your ${field}.` }, { status: 400 });
      }
    }

    const referrals = getReferrals();
    const newId = `REF-${1000 + referrals.length + 1}`;

    const newReferral = {
      id: newId,
      name: text(body.name, 120),
      role: text(body.role, 120) || 'Participant',
      phone: text(body.phone, 80),
      email: text(body.email, 160),
      participantName: text(body.participantName, 120) || text(body.name, 120),
      suburb: text(body.suburb, 120) || 'Not provided',
      funding: text(body.funding, 120) || 'Plan-Managed',
      services: text(body.service, 300) || text(body.services, 300) || 'General Support',
      schedulePreference: text(body.schedulePreference, 200) || 'Flexible',
      message: text(body.message, 2500) || 'No additional message.',
      status: 'new',
      createdAt: new Date().toISOString(),
    };

    referrals.unshift(newReferral);
    saveReferrals(referrals);

    // Optional Email Notification if Resend is configured
    const apiKey = process.env.RESEND_API_KEY;
    const to = process.env.REFERRAL_TO_EMAIL;
    const from = process.env.FROM_EMAIL;

    if (apiKey && to && from) {
      try {
        const subject = `New Opus Care Referral: ${newReferral.name} (${newReferral.suburb})`;
        const lines = [
          `New NDIS Referral Received`,
          `-------------------------`,
          `Referral ID: ${newReferral.id}`,
          `Contact Name: ${newReferral.name} (${newReferral.role})`,
          `Participant Name: ${newReferral.participantName}`,
          `Phone: ${newReferral.phone}`,
          `Email: ${newReferral.email}`,
          `Location: ${newReferral.suburb}`,
          `Funding Model: ${newReferral.funding}`,
          `Services Requested: ${newReferral.services}`,
          `Schedule: ${newReferral.schedulePreference}`,
          ``,
          `Notes / Goals:`,
          newReferral.message
        ];

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from, to: [to], reply_to: newReferral.email, subject, text: lines.join('\n') }),
        });
      } catch (emailErr) {
        console.warn('Email notification skipped or failed', emailErr);
      }
    }

    return NextResponse.json({ 
      ok: true, 
      id: newReferral.id,
      message: 'Referral submitted successfully and recorded in Opus Care CRM.' 
    });
  } catch (err) {
    console.error('Referral submission error', err);
    return NextResponse.json({ message: 'Error processing referral submission.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, notes } = body;

    if (!id || !status) {
      return NextResponse.json({ message: 'Missing referral ID or status.' }, { status: 400 });
    }

    const referrals = getReferrals();
    const index = referrals.findIndex((r: any) => r.id === id);

    if (index === -1) {
      return NextResponse.json({ message: 'Referral not found.' }, { status: 404 });
    }

    referrals[index].status = status;
    if (notes) {
      referrals[index].notes = notes;
    }
    referrals[index].updatedAt = new Date().toISOString();

    saveReferrals(referrals);

    return NextResponse.json({ ok: true, referral: referrals[index] });
  } catch (err) {
    return NextResponse.json({ message: 'Error updating referral.' }, { status: 500 });
  }
}
