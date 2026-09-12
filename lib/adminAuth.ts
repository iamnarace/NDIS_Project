import crypto from 'crypto';
import { cookies } from 'next/headers';

export const ADMIN_COOKIE_NAME = 'opus_admin_session';

export function getAdminSecret(): string {
  return process.env.ADMIN_ACCESS_KEY || '';
}

export function generateSessionToken(secret: string = getAdminSecret()): string {
  return crypto
    .createHmac('sha256', secret)
    .update('opuscare_ndis_admin_session_salt')
    .digest('hex');
}

export function verifyAdminSecret(inputKey: string): boolean {
  if (!inputKey) return false;
  const secret = getAdminSecret();
  if (!secret) return false;
  const provided = Buffer.from(inputKey.trim(), 'utf8');
  const expected = Buffer.from(secret.trim(), 'utf8');
  return provided.length === expected.length && crypto.timingSafeEqual(provided, expected);
}

export async function isAuthenticatedAdmin(req?: Request): Promise<boolean> {
  const secret = getAdminSecret();
  if (!secret) return false;
  const expectedToken = generateSessionToken(secret);

  // 1. Check HttpOnly cookie
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (token && token === expectedToken) {
      return true;
    }
  } catch {
    // Non-cookie environment or background call
  }

  // 2. A server-generated session token may be supplied by trusted non-browser
  // callers. The raw administrator credential is accepted only by the login
  // endpoint and is never a reusable API header.
  if (req) {
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      if (token === expectedToken) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Stable server-derived identity for governance audit events. The current admin
 * surface uses a shared authenticated session rather than individual Supabase
 * profiles, so never accept an actor label from a request body.
 */
export async function getAuthenticatedAdminActor(req?: Request): Promise<string | null> {
  if (!(await isAuthenticatedAdmin(req))) return null;
  const secret = getAdminSecret();
  if (!secret) return null;
  return `admin-session:${generateSessionToken(secret).slice(0, 16)}`;
}
