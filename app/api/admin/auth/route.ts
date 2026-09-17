import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { 
  ADMIN_COOKIE_NAME, 
  ADMIN_SESSION_DAYS,
  generateSessionToken, 
  getAuthenticatedAdminIdentity,
  hashAdminAccessKey,
  hashAdminSessionToken,
  verifyAdminSecret, 
} from '@/lib/adminAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import crypto from 'crypto';

export async function GET() {
  const identity = await getAuthenticatedAdminIdentity();
  return NextResponse.json({ authenticated: Boolean(identity), profile: identity });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { password } = body;

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { ok: false, message: 'Invalid Admin Access Key. Access denied.' },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();
    if (supabase) {
      const keyHash = hashAdminAccessKey(password);
      const { data: user } = await supabase
        .from('crm_admin_users')
        .select('id, display_name, email, role, active')
        .eq('access_key_hash', keyHash)
        .maybeSingle();

      if (user) {
        if (!user.active) {
          return NextResponse.json(
            { ok: false, message: 'This CRM access profile is locked. Contact an owner.' },
            { status: 423 }
          );
        }

        const token = crypto.randomBytes(32).toString('base64url');
        const expiresAt = new Date(Date.now() + ADMIN_SESSION_DAYS * 24 * 60 * 60 * 1000);
        const { error: sessionError } = await supabase.from('crm_admin_sessions').insert({
          admin_user_id: user.id,
          token_hash: hashAdminSessionToken(token),
          expires_at: expiresAt.toISOString(),
        });
        if (sessionError) throw sessionError;
        await supabase
          .from('crm_admin_users')
          .update({ last_login_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq('id', user.id);

        const cookieStore = await cookies();
        cookieStore.set(ADMIN_COOKIE_NAME, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * ADMIN_SESSION_DAYS,
        });
        return NextResponse.json({
          ok: true,
          message: 'Admin authentication successful.',
          profile: {
            id: user.id,
            displayName: user.display_name,
            email: user.email || null,
            role: user.role,
            legacy: false,
          },
        });
      }
    }

    if (!verifyAdminSecret(password)) {
      return NextResponse.json(
        { ok: false, message: 'Invalid Admin Access Key. Access denied.' },
        { status: 401 }
      );
    }

    const token = generateSessionToken();
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * ADMIN_SESSION_DAYS,
    });

    return NextResponse.json({
      ok: true,
      message: 'Admin authentication successful.',
      profile: {
        id: `admin-session:${generateSessionToken().slice(0, 16)}`,
        displayName: 'Legacy Owner',
        email: null,
        role: 'owner',
        legacy: true,
      },
    });
  } catch (err) {
    console.error('Admin login error:', err);
    return NextResponse.json({ ok: false, message: 'Authentication error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (token) {
      const supabase = createAdminClient();
      if (supabase) {
        await supabase
          .from('crm_admin_sessions')
          .update({ revoked_at: new Date().toISOString() })
          .eq('token_hash', hashAdminSessionToken(token));
      }
    }
    cookieStore.delete(ADMIN_COOKIE_NAME);
    return NextResponse.json({ ok: true, message: 'Logged out successfully.' });
  } catch (err) {
    return NextResponse.json({ ok: true });
  }
}
