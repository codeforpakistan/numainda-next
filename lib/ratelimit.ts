import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Rate limiting uses Upstash Redis (already used elsewhere via QStash). It is
// enabled only when both env vars are present, which keeps local development
// and preview builds working without a Redis instance while still protecting
// production. An in-memory limiter is not an option because each serverless
// invocation runs in isolation and would not share counters.
const url = process.env.UPSTASH_REDIS_REST_URL
const token = process.env.UPSTASH_REDIS_REST_TOKEN

export const ratelimit =
  url && token
    ? new Ratelimit({
        redis: new Redis({ url, token }),
        // 20 requests per minute per IP, sliding window.
        limiter: Ratelimit.slidingWindow(20, "1 m"),
        prefix: "numainda:chat",
        analytics: true,
      })
    : null

/**
 * Best-effort client IP from proxy headers (Vercel sets x-forwarded-for).
 * Falls back to a constant bucket so requests without an IP are still limited
 * as a group rather than bypassing the limiter entirely.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  return req.headers.get("x-real-ip") ?? "anonymous"
}