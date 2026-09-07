import { sendReferralClientConfirmation, sendReferralAdminAlert } from '@/lib/email';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { createAdminClient } from '@/lib/supabase/admin';
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
    if (!fs.existsSync(dataFilePath)) return [];
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
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(dataFilePath, JSON.stringify(items, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing referrals.json', err);
  }
}

export async function GET(request: Request) {
  const authed = await isAuthenticatedAdmin(request);
  if (!authed) {
    return NextResponse.json({ message: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  // 1. Attempt to fetch from Supabase if connected
  const supabase = createAdminClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped = data.map((r: any) => ({
          id: r.id,
          referenceNumber: r.reference_number || r.id,
          name: r.referrer_name,
          role: r.referrer_role,
          phone: r.phone,
          email: r.email,
          participantName: r.participant_name,
          suburb: r.suburb,
          funding: r.funding_type,
          services: r.services,
          schedulePreference: r.schedule_preference,
          message: r.notes || '',
          status: r.status,
          createdAt: r.created_at,
        }));
        return NextResponse.json(mapped);
      }
    } catch (sbErr) {
      console.warn('Supabase referral query fallback to JSON:', sbErr);
    }
  }

  // Fallback to local data
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
    const fallbackSeq = 1000 + referrals.length + 1;
    const fallbackRef = `REF-${fallbackSeq}`;

    let recordId = fallbackRef;
    let refNumber = fallbackRef;

    // 1. Insert into Supabase if connected
    const supabase = createAdminClient();
    if (supabase) {
      try {
        const { data: inserted, error: insertErr } = await supabase
          .from('referrals')
          .insert({
            referrer_name: text(body.name, 120),
            referrer_role: text(body.role, 120) || 'Participant',
            phone: text(body.phone, 80),
            email: text(body.email, 160),
            participant_name: text(body.participantName, 120) || text(body.name, 120),
            suburb: text(body.suburb, 120) || 'Not provided',
            funding_type: text(body.funding, 120) || 'Plan-Managed',
            services: text(body.service, 300) || text(body.services, 300) || 'General Support',
            schedule_preference: text(body.schedulePreference, 200) || 'Flexible',
            notes: text(body.message, 2500) || '',
            status: 'new',
          })
          .select()
          .single();

        if (inserted && !insertErr) {
          recordId = inserted.id;
          refNumber = inserted.reference_number || fallbackRef;
        }
      } catch (sbErr) {
        console.warn('Supabase referral insert fallback to JSON:', sbErr);
      }
    }

    const newReferral = {
      id: recordId,
      referenceNumber: refNumber,
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

    // Send Resend notification emails (Client confirmation + Admin alert)
    try {
      await Promise.allSettled([
        sendReferralClientConfirmation(newReferral),
        sendReferralAdminAlert(newReferral),
      ]);
    } catch (emailErr) {
      console.warn('Email dispatch simulated or failed:', emailErr);
    }

    return NextResponse.json({ 
      ok: true, 
      id: refNumber,
      message: 'Referral submitted successfully and recorded in Opus Care CRM.' 
    });
  } catch (err) {
    console.error('Referral submission error', err);
    return NextResponse.json({ message: 'Error processing referral submission.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const authed = await isAuthenticatedAdmin(request);
  if (!authed) {
    return NextResponse.json({ message: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, status, notes } = body;

    if (!id || !status) {
      return NextResponse.json({ message: 'Missing referral ID or status.' }, { status: 400 });
    }

    // 1. Update in Supabase if connected
    const supabase = createAdminClient();
    if (supabase) {
      try {
        const updatePayload: any = { status, updated_at: new Date().toISOString() };
        if (notes !== undefined) updatePayload.notes = notes;

        // Try updating by UUID or reference_number
        await supabase
          .from('referrals')
          .update(updatePayload)
          .or(`id.eq.${id},reference_number.eq.${id}`);
      } catch (sbErr) {
        console.warn('Supabase referral PATCH fallback to JSON:', sbErr);
      }
    }

    // 2. Also update local JSON mirror
    const referrals = getReferrals();
    const index = referrals.findIndex((r: any) => r.id === id || r.referenceNumber === id);

    if (index !== -1) {
      referrals[index].status = status;
      if (notes) referrals[index].notes = notes;
      referrals[index].updatedAt = new Date().toISOString();
      saveReferrals(referrals);
      return NextResponse.json({ ok: true, referral: referrals[index] });
    }

    return NextResponse.json({ ok: true, message: 'Referral updated.' });
  } catch (err) {
    return NextResponse.json({ message: 'Error updating referral.' }, { status: 500 });
  }
}
