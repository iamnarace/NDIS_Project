import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { hashSigningToken } from '@/lib/services/agreementExecution';

const PRIVACY_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token: rawToken } = await params;
  if (!rawToken || rawToken.length < 32) {
    return NextResponse.json({ message: 'Invalid token' }, { status: 400, headers: PRIVACY_HEADERS });
  }

  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ message: 'Database unavailable' }, { status: 503, headers: PRIVACY_HEADERS });

  const tokenHash = hashSigningToken(rawToken);

  const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null;
  const userAgent = req.headers.get('user-agent') || null;

  // Only update if status is currently pending (preserves first human interaction timestamp)
  const { data: inv } = await supabase
    .from('agreement_signing_invitations')
    .select('id, status')
    .eq('token_hash', tokenHash)
    .single();

  if (inv && inv.status === 'pending') {
    await supabase
      .from('agreement_signing_invitations')
      .update({
        status: 'viewed',
        viewed_at: new Date().toISOString(),
        human_view_ip: ipAddress,
        human_view_user_agent: userAgent,
        updated_at: new Date().toISOString(),
      })
      .eq('id', inv.id);
  }

  return NextResponse.json({ ok: true, viewed: true }, { headers: PRIVACY_HEADERS });
}
