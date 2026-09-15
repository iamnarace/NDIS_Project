import crypto from 'crypto';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

// Cleanup stale records periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of memoryStore.entries()) {
    if (val.resetAt <= now) {
      memoryStore.delete(key);
    }
  }
}, 60000).unref();

export function checkRecruitmentRateLimit(
  req: Request,
  actionPrefix: string,
  maxRequests = 20,
  windowSeconds = 60
): { ok: boolean; remaining: number; resetInSeconds: number } {
  // Extract client identifier without storing raw IP
  const forwarded = req.headers.get('x-forwarded-for') || '';
  const clientIp = forwarded.split(',')[0].trim() || req.headers.get('x-real-ip') || '127.0.0.1';
  const userAgent = req.headers.get('user-agent') || 'unknown';

  const clientHash = crypto
    .createHash('sha256')
    .update(`${actionPrefix}_${clientIp}_${userAgent}_opus_salt_2026`)
    .digest('hex')
    .slice(0, 32);

  const now = Date.now();
  const existing = memoryStore.get(clientHash);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowSeconds * 1000;
    memoryStore.set(clientHash, { count: 1, resetAt });
    return { ok: true, remaining: maxRequests - 1, resetInSeconds: windowSeconds };
  }

  if (existing.count >= maxRequests) {
    const resetInSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return { ok: false, remaining: 0, resetInSeconds };
  }

  existing.count += 1;
  const resetInSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  return { ok: true, remaining: maxRequests - existing.count, resetInSeconds };
}
