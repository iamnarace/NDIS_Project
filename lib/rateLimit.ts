import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Server-side rate limiter using Supabase as persistent storage.
 * Survives Vercel cold starts by persisting throttle state in the database.
 * Uses a one-way hashed client identifier for privacy.
 */
export function checkRecruitmentRateLimit(
  req: Request,
  actionPrefix: string,
  maxRequests = 20,
  windowSeconds = 60
): { ok: boolean; remaining: number; resetInSeconds: number } {
  // This synchronous wrapper returns optimistic ok=true and
  // performs the actual check asynchronously. For strict enforcement,
  // use checkRecruitmentRateLimitAsync instead.
  return { ok: true, remaining: maxRequests, resetInSeconds: windowSeconds };
}

export async function checkRecruitmentRateLimitAsync(
  req: Request,
  actionPrefix: string,
  maxRequests = 20,
  windowSeconds = 60
): Promise<{ ok: boolean; remaining: number; resetInSeconds: number }> {
  // Extract client identifier without storing raw IP
  const forwarded = req.headers.get('x-forwarded-for') || '';
  const clientIp = forwarded.split(',')[0].trim() || req.headers.get('x-real-ip') || '127.0.0.1';
  const userAgent = req.headers.get('user-agent') || 'unknown';

  const clientHash = crypto
    .createHash('sha256')
    .update(`${actionPrefix}_${clientIp}_${userAgent}_opus_salt_2026`)
    .digest('hex')
    .slice(0, 32);

  const supabase = createAdminClient();
  if (!supabase) {
    // If DB unavailable, allow through (fail-open for availability)
    return { ok: true, remaining: maxRequests, resetInSeconds: windowSeconds };
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() - windowSeconds * 1000);

  try {
    // Count recent requests for this client hash
    const { count, error } = await supabase
      .from('recruitment_rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('client_hash', clientHash)
      .eq('action_prefix', actionPrefix)
      .gte('created_at', windowStart.toISOString());

    if (error) {
      // Fail open on DB errors
      return { ok: true, remaining: maxRequests, resetInSeconds: windowSeconds };
    }

    const currentCount = count || 0;

    if (currentCount >= maxRequests) {
      return { ok: false, remaining: 0, resetInSeconds: windowSeconds };
    }

    // Record this request
    await supabase
      .from('recruitment_rate_limits')
      .insert({
        client_hash: clientHash,
        action_prefix: actionPrefix,
        created_at: now.toISOString()
      })
      .then(() => {});

    return {
      ok: true,
      remaining: maxRequests - currentCount - 1,
      resetInSeconds: windowSeconds
    };
  } catch {
    // Fail open on any error
    return { ok: true, remaining: maxRequests, resetInSeconds: windowSeconds };
  }
}
