import crypto from 'crypto';
import { cookies } from 'next/headers';

export const ADMIN_COOKIE_NAME = 'opus_admin_session';

export function getAdminSecret(): string {
  return (
    process.env.ADMIN_ACCESS_KEY ||
    process.env.ADMIN_PASSWORD ||
    'OpusCare2025!Admin'
  );
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
  return inputKey.trim() === secret.trim();
}

export async function isAuthenticatedAdmin(req?: Request): Promise<boolean> {
  const expectedToken = generateSessionToken();

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

  // 2. Check custom headers if provided
  if (req) {
    const headerKey = req.headers.get('x-admin-key');
    if (headerKey && verifyAdminSecret(headerKey)) {
      return true;
    }
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      if (token === expectedToken || verifyAdminSecret(token)) {
        return true;
      }
    }
  }

  return false;
}
