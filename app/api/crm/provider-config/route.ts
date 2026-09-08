import { userFacingError } from '@/lib/userFacingError';
import { NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: Request) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ message: "We couldn't complete this action. Please refresh and try again." }, { status: 503 });

  const { data, error } = await supabase
    .from('provider_config')
    .select('*')
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ message: userFacingError(error.message) }, { status: 500 });
  }

  return NextResponse.json(data || {});
}

export async function POST(req: Request) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ message: "We couldn't complete this action. Please refresh and try again." }, { status: 503 });

  try {
    const body = await req.json();
    const { id, ...updates } = body;
    updates.updated_at = new Date().toISOString();

    let result;
    if (id) {
      result = await supabase
        .from('provider_config')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    } else {
      result = await supabase
        .from('provider_config')
        .insert(updates)
        .select()
        .single();
    }

    if (result.error) return NextResponse.json({ message: userFacingError(result.error.message) }, { status: 500 });
    return NextResponse.json({ ok: true, config: result.data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
