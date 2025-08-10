import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { NextRequest } from "next/server";

let limiter: Ratelimit | null = null;

function getLimiter() {
  if (!limiter) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return null;
    const redis = new Redis({ url, token });
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(60, "1 m"),
    });
  }
  return limiter;
}

export async function rateLimit(request: NextRequest, keyPrefix: string) {
  const lim = getLimiter();
  if (!lim) return { success: true };
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "127.0.0.1";
  const key = `${keyPrefix}:${ip}`;
  const res = await lim.limit(key);
  return res;
}
