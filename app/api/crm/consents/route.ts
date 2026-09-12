import { NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import { userFacingError } from '@/lib/userFacingError';
import { isValidUuid, resolveParticipantUuid } from '@/lib/uuid';
import {
  getParticipantConsents,
  upsertParticipantConsents,
  getInformationSharingAuthorities,
  createInformationSharingAuthority,
  revokeInformationSharingAuthority,
} from '@/lib/services/privacyConsent';

export async function GET(req: Request) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) {
    return NextResponse.json({ message: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const participantId = searchParams.get('participant_id');

  if (!participantId) {
    return NextResponse.json({ message: 'Participant ID is required' }, { status: 400 });
  }

  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ message: 'Database service unavailable' }, { status: 503 });

  let resolvedId = participantId;
  if (!isValidUuid(participantId)) {
    resolvedId = (await resolveParticipantUuid(supabase, participantId)) || participantId;
  }
  if (!isValidUuid(resolvedId)) {
    return NextResponse.json({ message: 'Invalid participant identifier.' }, { status: 400 });
  }

  try {
    const consents = await getParticipantConsents(resolvedId, supabase);
    const authorities = await getInformationSharingAuthorities(resolvedId, supabase);

    return NextResponse.json({
      consents: consents || {
        participant_id: resolvedId,
        privacy_notice_acknowledged: false,
        privacy_notice_version: '2026.1',
        service_consent_granted: false,
        marketing_consent_granted: false,
      },
      information_sharing_authorities: authorities || [],
    });
  } catch (err: any) {
    return NextResponse.json({ message: userFacingError(err.message) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) {
    return NextResponse.json({ message: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ message: 'Database service unavailable' }, { status: 503 });

  try {
    const body = await req.json();
    const { participant_id, ...consentData } = body;

    if (!participant_id) {
      return NextResponse.json({ message: 'Participant ID is required.' }, { status: 400 });
    }

    let resolvedId = participant_id;
    if (!isValidUuid(participant_id)) {
      resolvedId = (await resolveParticipantUuid(supabase, participant_id)) || participant_id;
    }
    if (!isValidUuid(resolvedId)) {
      return NextResponse.json({ message: 'Invalid participant identifier.' }, { status: 400 });
    }

    const updated = await upsertParticipantConsents(
      {
        participant_id: resolvedId,
        ...consentData,
      },
      'admin_governance',
      supabase
    );

    return NextResponse.json({ ok: true, consents: updated });
  } catch (err: any) {
    return NextResponse.json({ message: userFacingError(err.message) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) {
    return NextResponse.json({ message: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ message: 'Database service unavailable' }, { status: 503 });

  try {
    const body = await req.json();
    const { action, authority_id, participant_id, reason, ...newAuthorityData } = body;

    if (!participant_id) {
      return NextResponse.json({ message: 'Participant ID is required.' }, { status: 400 });
    }

    let resolvedId = participant_id;
    if (!isValidUuid(participant_id)) {
      resolvedId = (await resolveParticipantUuid(supabase, participant_id)) || participant_id;
    }

    if (action === 'revoke') {
      if (!authority_id || !reason) {
        return NextResponse.json({ message: 'authority_id and reason are required to revoke authority.' }, { status: 400 });
      }
      const revoked = await revokeInformationSharingAuthority(
        authority_id,
        resolvedId,
        reason,
        'admin_governance',
        supabase
      );
      return NextResponse.json({ ok: true, authority: revoked });
    } else if (action === 'create') {
      const created = await createInformationSharingAuthority(
        {
          participant_id: resolvedId,
          ...newAuthorityData,
        },
        'admin_governance',
        supabase
      );
      return NextResponse.json({ ok: true, authority: created });
    } else {
      return NextResponse.json({ message: 'Invalid action. Specify create or revoke.' }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ message: userFacingError(err.message) }, { status: 500 });
  }
}
