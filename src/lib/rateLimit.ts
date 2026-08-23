/**
 * Rate limiter sederhana berbasis memori (token bucket per-kunci).
 *
 * Cukup untuk prototipe single-instance. Di produksi, ganti dengan penyimpanan
 * bersama (mis. Redis) supaya batasan konsisten di banyak instance server —
 * lihat catatan di dokumen spesifikasi bagian "Keamanan aplikasi".
 */

interface Bucket {
    count: number;
    resetAt: number;
  }

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    retryAfterSeconds: number;
  }

export function rateLimit(key: string, limit: number, windowSeconds: number): RateLimitResult {
    const now = Date.now();
    const existing = buckets.get(key);

    if (!existing || existing.resetAt < now) {
          buckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
          return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
        }

    if (existing.count >= limit) {
          return { allowed: false, remaining: 0, retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000) };
        }

    existing.count += 1;
    return { allowed: true, remaining: limit - existing.count, retryAfterSeconds: 0 };
  }

export function clientKeyFromRequest(req: Request, scope: string): string {
    const fwd = req.headers.get("x-forwarded-for");
    const ip = fwd?.split(",")[0]?.trim() || "unknown";
    return `${scope}:${ip}`;
  }
