import crypto from 'crypto';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';

export const ADMIN_COOKIE_NAME = 'opus_admin_session';
export const ADMIN_SESSION_DAYS = 7;

export type AdminIdentity = {
  id: string;
  displayName: string;
  email: string | null;
  role: 'owner' | 'admin';
  legacy: boolean;
};

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

export function hashAdminAccessKey(inputKey: string): string {
  const pepper = getAdminSecret();
  if (!pepper) throw new Error('ADMIN_ACCESS_KEY is required as the access-key hashing pepper.');
  return crypto.createHmac('sha256', pepper).update(inputKey.trim(), 'utf8').digest('hex');
}

export function hashAdminSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
}

export function validateChosenAdminKey(inputKey: string): string | null {
  const key = inputKey.trim();
  if (key.length < 10) return 'Access key must be at least 10 characters.';
  if (key.length > 128) return 'Access key must be 128 characters or fewer.';
  return null;
}

async function getIndividualIdentity(token: string): Promise<AdminIdentity | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;
  const tokenHash = hashAdminSessionToken(token);
  const now = new Date().toISOString();
  const { data } = await supabase
    .from('crm_admin_sessions')
    .select('id, admin_user_id, expires_at, revoked_at, crm_admin_users!inner(id, display_name, email, role, active)')
    .eq('token_hash', tokenHash)
    .is('revoked_at', null)
    .gt('expires_at', now)
    .maybeSingle();

  const user = data?.crm_admin_users as any;
  if (!data || !user?.active) return null;
  void supabase.from('crm_admin_sessions').update({ last_seen_at: now }).eq('id', data.id);
  return {
    id: user.id,
    displayName: user.display_name,
    email: user.email || null,
    role: user.role === 'owner' ? 'owner' : 'admin',
    legacy: false,
  };
}

export async function getAuthenticatedAdminIdentity(req?: Request): Promise<AdminIdentity | null> {
  let token = '';
  try {
    const cookieStore = await cookies();
    token = cookieStore.get(ADMIN_COOKIE_NAME)?.value || '';
  } catch {
    // Non-cookie environment or background call.
  }

  if (!token && req) {
    token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  }
  if (!token) return null;

  const individualIdentity = await getIndividualIdentity(token);
  if (individualIdentity) return individualIdentity;

  const secret = getAdminSecret();
  if (secret && token === generateSessionToken(secret)) {
    return {
      id: `admin-session:${generateSessionToken(secret).slice(0, 16)}`,
      displayName: 'Legacy Owner',
      email: null,
      role: 'owner',
      legacy: true,
    };
  }
  return null;
}

export async function isAuthenticatedAdmin(req?: Request): Promise<boolean> {
  return Boolean(await getAuthenticatedAdminIdentity(req));
}

/**
 * Stable server-derived identity for governance audit events. The current admin
 * surface uses a shared authenticated session rather than individual Supabase
 * profiles, so never accept an actor label from a request body.
 */
export async function getAuthenticatedAdminActor(req?: Request): Promise<string | null> {
  const identity = await getAuthenticatedAdminIdentity(req);
  return identity?.id || null;
}
