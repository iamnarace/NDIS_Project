import { NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import { userFacingError } from '@/lib/userFacingError';

export async function GET(req: Request) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) {
    return NextResponse.json({ message: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const referralId = searchParams.get('referralId');
  const participantId = searchParams.get('participantId');

  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ message: 'Activity history could not be loaded.' }, { status: 503 });
  let query = supabase.from('activities').select('*').order('created_at', { ascending: false });
  if (referralId) query = query.eq('referral_id', referralId);
  if (participantId) query = query.eq('participant_id', participantId);
  const { data, error } = await query;
  if (error) return NextResponse.json({ message: userFacingError(error.message) }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(req: Request) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) {
    return NextResponse.json({ message: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { referralId, participantId, activityType, title, description, authorName } = body;

    if (!title) {
      return NextResponse.json({ message: 'Title is required.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    if (!supabase) return NextResponse.json({ message: 'Activity could not be saved.' }, { status: 503 });
    const { data, error } = await supabase
          .from('activities')
          .insert({
            referral_id: referralId || null,
            participant_id: participantId || null,
            activity_type: activityType || 'note',
            title,
            description: description || '',
            author_name: authorName || 'Opus Admin',
          })
          .select()
          .single();
    if (error || !data) return NextResponse.json({ message: userFacingError(error?.message || 'Activity insert returned no record.') }, { status: 500 });
    return NextResponse.json({ ok: true, activity: data });
  } catch (err: unknown) {
    return NextResponse.json({ message: userFacingError(err) }, { status: 500 });
  }
}
