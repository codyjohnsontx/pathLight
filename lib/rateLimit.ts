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
const MAX_KEYS = 10_000; // hard cap on tracked keys (oldest evicted beyond this)

export type RateLimitResult = { ok: boolean; retryAfter: number };

export function rateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now >= existing.resetAt) {
    // Keep the map bounded: sweep elapsed windows first, then evict the oldest
    // entries if it's still at the cap (a flood of many active keys). Never
    // clears the whole map, which would reset actively-limited clients.
    if (buckets.size >= MAX_KEYS) enforceCapacity(now);
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, retryAfter: 0 };
  }

  if (existing.count >= LIMIT) {
    return { ok: false, retryAfter: Math.ceil((existing.resetAt - now) / 1000) };
  }

  existing.count += 1;
  return { ok: true, retryAfter: 0 };
}

/**
 * Keep `buckets` bounded. Drop elapsed windows first; if the map is still at the
 * cap (many active keys arriving within one window), evict the oldest entries by
 * insertion order to make room for the incoming key. Never clears the whole map.
 */
function enforceCapacity(now: number): void {
  sweepExpired(now);
  if (buckets.size < MAX_KEYS) return;
  const toEvict = buckets.size - MAX_KEYS + 1; // leave room for the incoming key
  let evicted = 0;
  for (const key of buckets.keys()) {
    if (evicted >= toEvict) break;
    buckets.delete(key);
    evicted += 1;
  }
}

/** Remove only entries whose window has already elapsed (keeps active limits). */
function sweepExpired(now: number): void {
  for (const [key, window] of buckets) {
    if (now >= window.resetAt) buckets.delete(key);
  }
}
