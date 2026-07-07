/**
 * Minimal in-memory fixed-window rate limiter.
 *
 * A lightweight first line of defense against abuse / cost blow-up on /api/ask,
 * which can reach a hosted LLM provider on the non-mock path. It is per-process
 * and NOT durable: in a multi-instance or serverless deployment, enforce limits
 * at an edge/gateway layer or a shared store (e.g. Redis) instead.
 */

type Window = { count: number; resetAt: number };

const buckets = new Map<string, Window>();
const LIMIT = 30; // requests per window
const WINDOW_MS = 60_000; // 1 minute
const MAX_KEYS = 10_000; // crude guard against unbounded growth

export type RateLimitResult = { ok: boolean; retryAfter: number };

export function rateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now >= existing.resetAt) {
    // Guard against unbounded growth by sweeping only elapsed windows — never
    // clear the whole map, which would reset clients that are actively limited.
    if (buckets.size > MAX_KEYS) sweepExpired(now);
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, retryAfter: 0 };
  }

  if (existing.count >= LIMIT) {
    return { ok: false, retryAfter: Math.ceil((existing.resetAt - now) / 1000) };
  }

  existing.count += 1;
  return { ok: true, retryAfter: 0 };
}

/** Remove only entries whose window has already elapsed (keeps active limits). */
function sweepExpired(now: number): void {
  for (const [key, window] of buckets) {
    if (now >= window.resetAt) buckets.delete(key);
  }
}
