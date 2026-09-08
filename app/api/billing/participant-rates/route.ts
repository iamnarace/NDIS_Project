import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { isValidUuid, resolveParticipantUuid } from '@/lib/uuid';

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    if (!supabase) return NextResponse.json({ rates: [] });

    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get('participant_id');

    if (!participantId) {
      return NextResponse.json({ error: 'Participant ID is required.' }, { status: 400 });
    }

    const pUuid = isValidUuid(participantId) ? participantId : await resolveParticipantUuid(supabase, participantId);
    if (!pUuid) return NextResponse.json({ rates: [] });

    const { data, error } = await supabase
      .from('participant_service_rates')
      .select(`
        *,
        support_item:ndis_support_items(*)
      `)
      .eq('participant_id', pUuid)
      .eq('active', true);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ rates: data || [] });
  } catch (err: any) {
    console.error('GET /api/billing/participant-rates error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

    const supabase = createAdminClient();
    if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });

    const body = await request.json();
    const { participant_id, support_item_id, agreed_rate, agreement_id } = body;

    if (!participant_id || !support_item_id || agreed_rate === undefined) {
      return NextResponse.json({ error: 'participant_id, support_item_id, and agreed_rate are required.' }, { status: 400 });
    }

    const pUuid = isValidUuid(participant_id) ? participant_id : await resolveParticipantUuid(supabase, participant_id);
    if (!pUuid) return NextResponse.json({ error: 'Participant not found.' }, { status: 404 });

    const { data, error } = await supabase
      .from('participant_service_rates')
      .insert({
        participant_id: pUuid,
        support_item_id,
        agreed_rate: Number(agreed_rate),
        agreement_id: agreement_id && isValidUuid(agreement_id) ? agreement_id : null,
        active: true,
      })
      .select(`
        *,
        support_item:ndis_support_items(*)
      `)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ rate: data }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/billing/participant-rates error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
