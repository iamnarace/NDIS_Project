import { sendReferralClientConfirmation, sendReferralAdminAlert } from '@/lib/email';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { userFacingError } from '@/lib/userFacingError';
import { nextReferenceNumber } from '@/lib/referenceNumber';

const required = ['name', 'phone', 'email'] as const;

function text(value: unknown, max = 1000) {
  return String(value ?? '').trim().slice(0, max);
}

export async function GET(request: Request) {
  const authed = await isAuthenticatedAdmin(request);
  if (!authed) {
    return NextResponse.json({ message: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ message: 'Referral data could not be loaded.' }, { status: 503 });

  const { data, error } = await supabase
    .from('referrals')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ message: userFacingError(error.message) }, { status: 500 });

  const mapped = (data || []).map((r: any) => ({
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

export async function POST(request: Request) {
  try {
    const body = await request.json();

    for (const field of required) {
      if (!text(body[field], 300)) {
        return NextResponse.json({ message: `Please provide your ${field}.` }, { status: 400 });
      }
    }

    const supabase = createAdminClient();
    if (!supabase) return NextResponse.json({ message: 'We could not submit your referral right now. Please try again.' }, { status: 503 });
    const referenceNumber = await nextReferenceNumber(supabase, 'referrals', 'REF');

    const { data: inserted, error: insertErr } = await supabase
          .from('referrals')
          .insert({
            reference_number: referenceNumber,
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

    if (insertErr || !inserted) {
      return NextResponse.json({ message: userFacingError(insertErr?.message || 'Referral insert returned no record.') }, { status: 500 });
    }

    const newReferral = {
      id: inserted.id,
      referenceNumber: inserted.reference_number,
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
      id: inserted.reference_number,
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

    const supabase = createAdminClient();
    if (!supabase) return NextResponse.json({ message: 'Referral could not be updated.' }, { status: 503 });
    const updatePayload: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
    if (notes !== undefined) updatePayload.notes = notes;
    const { data, error } = await supabase.from('referrals').update(updatePayload).or(`id.eq.${id},reference_number.eq.${id}`).select().maybeSingle();
    if (error) return NextResponse.json({ message: userFacingError(error.message) }, { status: 500 });
    if (!data) return NextResponse.json({ message: 'Referral not found.' }, { status: 404 });
    return NextResponse.json({ ok: true, referral: data });
  } catch (err: unknown) {
    return NextResponse.json({ message: userFacingError(err) }, { status: 500 });
  }
}
