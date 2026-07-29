// Lightweight in-memory rate limiter shared by edge functions.
// NOTE: state is per edge instance (best-effort, not a distributed limiter).
// It stops naive abuse/bursts; it is not a hard global guarantee.

const buckets = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitOptions {
  /** Max requests allowed per window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
  /** Namespace so different functions don't share buckets. */
  scope: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/** Stable-ish caller identity: bearer token tail → IP → "anon". */
export function callerIdentity(req: Request): string {
  const auth = req.headers.get("authorization");
  if (auth && auth.length > 40) return `t:${auth.slice(-32)}`;
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip");
  return ip ? `ip:${ip}` : "anon";
}

export function checkRateLimit(req: Request, opts: RateLimitOptions): RateLimitResult {
  const key = `${opts.scope}:${callerIdentity(req)}`;
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    // Opportunistic cleanup so the map can't grow unbounded.
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
    }
    return { allowed: true, remaining: opts.limit - 1, retryAfterSeconds: 0 };
  }

  if (bucket.count >= opts.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count++;
  return { allowed: true, remaining: opts.limit - bucket.count, retryAfterSeconds: 0 };
}

/** Returns a 429 Response when the caller is over the limit, otherwise null. */
export function rateLimitResponse(
  req: Request,
  opts: RateLimitOptions,
  corsHeaders: Record<string, string>,
): Response | null {
  const result = checkRateLimit(req, opts);
  if (result.allowed) return null;
  return new Response(
    JSON.stringify({
      error: "Too many requests. Please wait a moment and try again.",
      retry_after: result.retryAfterSeconds,
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": String(result.retryAfterSeconds),
      },
    },
  );
}
