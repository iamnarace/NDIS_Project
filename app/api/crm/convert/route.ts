import { NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import { userFacingError } from '@/lib/userFacingError';
import { nextReferenceNumber } from '@/lib/referenceNumber';

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
    if (!supabase) return NextResponse.json({ message: 'Referral conversion is currently unavailable.' }, { status: 503 });
    const { data: ref, error: refErr } = await supabase
          .from('referrals')
          .select('*')
          .or(`id.eq.${referralId},reference_number.eq.${referralId}`)
          .single();

    if (refErr || !ref) {
      if (refErr?.code === 'PGRST116') return NextResponse.json({ message: 'Referral not found.' }, { status: 404 });
      return NextResponse.json({ message: userFacingError(refErr?.message || 'Referral query returned no record.') }, { status: 500 });
    }

    const participantReference = await nextReferenceNumber(supabase, 'participants', 'PAR');
    const { data: part, error: partErr } = await supabase
            .from('participants')
            .insert({
              reference_number: participantReference,
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

    if (partErr || !part) return NextResponse.json({ message: userFacingError(partErr?.message || 'Participant insert returned no record.') }, { status: 500 });

    const { error: referralUpdateError } = await supabase
              .from('referrals')
              .update({ status: 'accepted', updated_at: new Date().toISOString() })
              .eq('id', ref.id);
    if (referralUpdateError) {
      await supabase.from('participants').delete().eq('id', part.id);
      return NextResponse.json({ message: userFacingError(referralUpdateError.message) }, { status: 500 });
    }

    const { error: activityError } = await supabase
              .from('activities')
              .insert({
                participant_id: part.id,
                referral_id: ref.id,
                activity_type: 'status_change',
                title: 'Referral Converted to Active Participant',
                description: `Participant record created (${part.reference_number || part.id}) from referral ${ref.reference_number || ref.id}.`
              });
    if (activityError) console.error('Referral conversion activity log failed:', activityError.message);

    return NextResponse.json({ ok: true, participant: part });
  } catch (err: unknown) {
    return NextResponse.json({ message: userFacingError(err) }, { status: 500 });
  }
}
