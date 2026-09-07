import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { 
  ADMIN_COOKIE_NAME, 
  generateSessionToken, 
  verifyAdminSecret, 
  isAuthenticatedAdmin 
} from '@/lib/adminAuth';

export async function GET() {
  const authed = await isAuthenticatedAdmin();
  return NextResponse.json({ authenticated: authed });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { password } = body;

    if (!password || !verifyAdminSecret(password)) {
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
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({ ok: true, message: 'Admin authentication successful.' });
  } catch (err) {
    console.error('Admin login error:', err);
    return NextResponse.json({ ok: false, message: 'Authentication error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(ADMIN_COOKIE_NAME);
    return NextResponse.json({ ok: true, message: 'Logged out successfully.' });
  } catch (err) {
    return NextResponse.json({ ok: true });
  }
}
