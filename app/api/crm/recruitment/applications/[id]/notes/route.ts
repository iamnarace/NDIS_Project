import { NextResponse } from 'next/server';
import { getAuthenticatedAdminActor } from '@/lib/adminAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import { userFacingError } from '@/lib/userFacingError';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actorId = await getAuthenticatedAdminActor(req);
  if (!actorId) {
    return NextResponse.json({ ok: false, error: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Database service unavailable.' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const note = String(body.note || '').trim();

    if (!note) {
      return NextResponse.json({ ok: false, error: 'Note text cannot be empty.' }, { status: 400 });
    }

    const { data: event, error } = await supabase
      .from('job_application_events')
      .insert({
        application_id: id,
        event_type: 'note_added',
        note: note,
        actor: actorId
      })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: userFacingError(error.message) }, { status: 500 });
    }

    return NextResponse.json({ ok: true, event });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Invalid note request.' }, { status: 400 });
  }
}
