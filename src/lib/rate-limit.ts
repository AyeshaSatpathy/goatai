/**
 * Simple in-memory rate limiter
 * For production, replace with Redis-based solution
 */

type RateLimitEntry = {
  count: number;
  resetTime: number;
};

// In-memory store (cleared on server restart)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60_000); // Clean up every minute

type RateLimitConfig = {
  /** Unique identifier for this limiter (e.g., "trade", "create-market") */
  identifier: string;
  /** Maximum requests allowed in the window */
  maxRequests: number;
  /** Time window in seconds */
  windowSeconds: number;
};

type RateLimitResult = {
  success: boolean;
  remaining: number;
  resetIn: number; // seconds until reset
};

/**
 * Check if a request should be rate limited
 * @param userId - The user's ID (or IP for unauthenticated requests)
 * @param config - Rate limit configuration
 */
export function checkRateLimit(
  userId: string,
  config: RateLimitConfig
): RateLimitResult {
  const key = `${config.identifier}:${userId}`;
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;

  const entry = rateLimitStore.get(key);

  // No existing entry or window expired
  if (!entry || entry.resetTime < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowSeconds,
    };
  }

  // Within window, check count
  if (entry.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetIn: Math.ceil((entry.resetTime - now) / 1000),
    };
  }

  // Increment counter
  entry.count += 1;
  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetIn: Math.ceil((entry.resetTime - now) / 1000),
  };
}

// Pre-configured rate limiters
export const rateLimits = {
  /** Trade: 30 trades per minute */
  trade: { identifier: "trade", maxRequests: 30, windowSeconds: 60 },
  /** Create market: 5 per hour */
  createMarket: { identifier: "create-market", maxRequests: 5, windowSeconds: 3600 },
  /** Resolve/Cancel market: 10 per minute */
  resolveMarket: { identifier: "resolve-market", maxRequests: 10, windowSeconds: 60 },
  /** General API: 100 requests per minute */
  general: { identifier: "general", maxRequests: 100, windowSeconds: 60 },
} as const;
