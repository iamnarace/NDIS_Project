import { NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import fs from 'fs';
import path from 'path';

const participantsFile = path.join(process.cwd(), 'data', 'participants.json');
const referralsFile = path.join(process.cwd(), 'data', 'referrals.json');

function getJsonData(filePath: string) {
  try {
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return [];
  }
}

function saveJsonData(filePath: string, data: any) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing to ${filePath}:`, err);
  }
}

export async function POST(req: Request) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) {
    return NextResponse.json({ message: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { referralId, ndisNumber, allocatedHours } = body;

    if (!referralId) {
      return NextResponse.json({ message: 'Missing referral ID.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    if (supabase) {
      try {
        // 1. Fetch the referral from Supabase
        const { data: ref, error: refErr } = await supabase
          .from('referrals')
          .select('*')
          .or(`id.eq.${referralId},reference_number.eq.${referralId}`)
          .single();

        if (ref && !refErr) {
          // 2. Insert into participants
          const { data: part, error: partErr } = await supabase
            .from('participants')
            .insert({
              referral_id: ref.id,
              full_name: ref.participant_name,
              ndis_number: ndisNumber || null,
              phone: ref.phone,
              email: ref.email,
              suburb: ref.suburb,
              funding_type: ref.funding_type || 'Plan-Managed',
              allocated_weekly_hours: Number(allocatedHours) || 0.0,
              status: 'active'
            })
            .select()
            .single();

          if (part && !partErr) {
            // 3. Mark referral as accepted
            await supabase
              .from('referrals')
              .update({ status: 'accepted', updated_at: new Date().toISOString() })
              .eq('id', ref.id);

            // 4. Record audit activity
            await supabase
              .from('activities')
              .insert({
                participant_id: part.id,
                referral_id: ref.id,
                activity_type: 'status_change',
                title: 'Referral Converted to Active Participant',
                description: `Participant record created (${part.reference_number || part.id}) from referral ${ref.reference_number || ref.id}.`
              });

            return NextResponse.json({ ok: true, participant: part });
          }
        }
      } catch (sbErr) {
        console.warn('Supabase convert fallback to JSON:', sbErr);
      }
    }

    // Fallback to local JSON files
    const referrals = getJsonData(referralsFile);
    const participants = getJsonData(participantsFile);

    const refIndex = referrals.findIndex((r: any) => r.id === referralId || r.referenceNumber === referralId);
    if (refIndex === -1) {
      return NextResponse.json({ message: 'Referral not found.' }, { status: 404 });
    }

    const ref = referrals[refIndex];
    const newPartId = `PAR-${String(participants.length + 1).padStart(3, '0')}`;

    const newParticipant = {
      id: newPartId,
      referenceNumber: newPartId,
      name: ref.participantName || ref.name,
      ndisNumber: ndisNumber || 'Pending NDIS #',
      fundingType: ref.funding || 'Plan-Managed',
      planManager: ref.role === 'Plan Manager' ? ref.name : 'Self / Pending',
      suburb: ref.suburb || 'Yamba / Northern Rivers',
      allocatedHours: Number(allocatedHours) || 12,
      primaryService: ref.services || 'Daily Living & Community Access',
      status: 'active',
      workerAssigned: 'To be assigned',
      contactPerson: `${ref.name} (${ref.phone})`,
      referralId: ref.id,
      createdAt: new Date().toISOString(),
    };

    participants.unshift(newParticipant);
    referrals[refIndex].status = 'accepted';
    referrals[refIndex].updatedAt = new Date().toISOString();

    saveJsonData(participantsFile, participants);
    saveJsonData(referralsFile, referrals);

    return NextResponse.json({ ok: true, participant: newParticipant });
  } catch (err) {
    console.error('Convert referral error:', err);
    return NextResponse.json({ message: 'Error converting referral.' }, { status: 500 });
  }
}
