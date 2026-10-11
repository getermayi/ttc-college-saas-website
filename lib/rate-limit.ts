import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type Result = { success: boolean; remaining: number; reset: number };

const upstashConfigured = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

const redis = upstashConfigured ? Redis.fromEnv() : null;
const limiters = new Map<string, Ratelimit>();

// Fallback for local development: a per-process sliding window. Not shared across
// serverless instances, so configure Upstash in production.
const memory = new Map<string, number[]>();

export async function rateLimit(
  key: string,
  { limit, windowSeconds }: { limit: number; windowSeconds: number },
): Promise<Result> {
  if (redis) {
    const id = `${limit}:${windowSeconds}`;
    let limiter = limiters.get(id);
    if (!limiter) {
      limiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
        prefix: "ttc-rl",
        analytics: false,
      });
      limiters.set(id, limiter);
    }
    const res = await limiter.limit(key);
    return { success: res.success, remaining: res.remaining, reset: res.reset };
  }

  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;
  const hits = (memory.get(key) ?? []).filter((t) => t > windowStart);
  if (hits.length >= limit) {
    memory.set(key, hits);
    return { success: false, remaining: 0, reset: hits[0] + windowSeconds * 1000 };
  }
  hits.push(now);
  memory.set(key, hits);
  if (memory.size > 5000) {
    for (const [k, v] of memory) if (v.every((t) => t <= windowStart)) memory.delete(k);
  }
  return { success: true, remaining: limit - hits.length, reset: now + windowSeconds * 1000 };
}
