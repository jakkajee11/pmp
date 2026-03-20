/**
 * Rate Limiting Middleware
 *
 * Implements rate limiting for API routes to prevent abuse.
 * Uses in-memory store with sliding window algorithm.
 *
 * Configuration:
 * - Window duration (default: 60 seconds)
 * - Max requests per window (configurable per route)
 * - Custom key generator (default: IP address)
 *
 * Professional Corporate style: Navy blue (#1e3a5f), slate gray accents.
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from "./logger";

// Rate limit configuration per route pattern
export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (request: NextRequest) => string;
  skip?: (request: NextRequest) => boolean;
  headers?: boolean;
}

// Default configurations for different route types
export const DEFAULT_CONFIGS: Record<string, RateLimitConfig> = {
  // Authentication endpoints - stricter limits
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: "Too many authentication attempts, please try again later.",
  },
  // Login endpoint - very strict
  login: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: "Too many login attempts, please try again in an hour.",
  },
  // Password reset - strict
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: "Too many password reset requests, please try again later.",
  },
  // API write operations - moderate
  write: {
    windowMs: 60 * 1000, // 1 minute
    max: 30,
    message: "Too many requests, please slow down.",
  },
  // API read operations - relaxed
  read: {
    windowMs: 60 * 1000, // 1 minute
    max: 100,
    message: "Too many requests, please slow down.",
  },
  // Search endpoints - moderate
  search: {
    windowMs: 60 * 1000, // 1 minute
    max: 20,
    message: "Too many search requests, please slow down.",
  },
  // Export/report generation - strict
  export: {
    windowMs: 60 * 1000, // 1 minute
    max: 5,
    message: "Too many export requests, please wait before generating more reports.",
  },
  // Default - moderate
  default: {
    windowMs: 60 * 1000, // 1 minute
    max: 60,
    message: "Too many requests, please try again later.",
  },
};

// In-memory store for rate limiting
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup interval to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 1000); // Cleanup every minute

/**
 * Generate a rate limit key from the request
 */
function defaultKeyGenerator(request: NextRequest): string {
  // Try to get IP from headers (for proxies/load balancers)
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  if (forwardedFor) {
    // Take the first IP in the chain (original client)
    return forwardedFor.split(",")[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  // Fallback to a default (should not happen in production)
  return "unknown";
}

/**
 * Get configuration for a route
 */
function getConfigForRoute(pathname: string): RateLimitConfig {
  if (pathname.includes("/auth/") || pathname.includes("/login")) {
    return DEFAULT_CONFIGS.auth;
  }
  if (pathname.includes("/login")) {
    return DEFAULT_CONFIGS.login;
  }
  if (pathname.includes("/password-reset")) {
    return DEFAULT_CONFIGS.passwordReset;
  }
  if (pathname.includes("/search")) {
    return DEFAULT_CONFIGS.search;
  }
  if (pathname.includes("/export") || pathname.includes("/reports")) {
    return DEFAULT_CONFIGS.export;
  }
  if (pathname.includes("/api/")) {
    // Check if it's a write operation
    return DEFAULT_CONFIGS.default;
  }
  return DEFAULT_CONFIGS.default;
}

/**
 * Rate limit middleware wrapper
 */
export function withRateLimit(
  config: RateLimitConfig | string = "default"
): (handler: (request: NextRequest, context?: any) => Promise<NextResponse>) => (request: NextRequest, context?: any) => Promise<NextResponse> {
  const finalConfig: RateLimitConfig =
    typeof config === "string" ? DEFAULT_CONFIGS[config] || DEFAULT_CONFIGS.default : config;

  return (handler) => {
    return async (request: NextRequest, context?: any): Promise<NextResponse> => {
      // Skip if configured
      if (finalConfig.skip?.(request)) {
        return handler(request, context);
      }

      const keyGenerator = finalConfig.keyGenerator || defaultKeyGenerator;
      const key = `ratelimit:${keyGenerator(request)}:${new URL(request.url).pathname}`;
      const now = Date.now();
      const windowStart = now - finalConfig.windowMs;

      // Get or create entry
      let entry = rateLimitStore.get(key);

      if (!entry || entry.resetTime < now) {
        // Create new entry
        entry = {
          count: 0,
          resetTime: now + finalConfig.windowMs,
        };
      }

      // Increment count
      entry.count++;
      rateLimitStore.set(key, entry);

      const remaining = Math.max(0, finalConfig.max - entry.count);
      const resetTime = Math.ceil(entry.resetTime / 1000);

      // Log rate limit hit
      if (entry.count > finalConfig.max * 0.8) {
        logger.warn("Rate limit approaching", {
          key,
          count: entry.count,
          max: finalConfig.max,
          pathname: new URL(request.url).pathname,
        });
      }

      // Check if over limit
      if (entry.count > finalConfig.max) {
        logger.warn("Rate limit exceeded", {
          key,
          count: entry.count,
          max: finalConfig.max,
          pathname: new URL(request.url).pathname,
        });

        const response = NextResponse.json(
          {
            success: false,
            error: {
              code: "RATE_LIMITED",
              message: finalConfig.message || "Too many requests",
              retryAfter: Math.ceil((entry.resetTime - now) / 1000),
            },
          },
          { status: 429 }
        );

        // Set rate limit headers
        response.headers.set("X-RateLimit-Limit", finalConfig.max.toString());
        response.headers.set("X-RateLimit-Remaining", "0");
        response.headers.set("X-RateLimit-Reset", resetTime.toString());
        response.headers.set("Retry-After", Math.ceil((entry.resetTime - now) / 1000).toString());

        return response;
      }

      // Process request
      const response = await handler(request, context);

      // Add rate limit headers to response
      if (finalConfig.headers !== false) {
        response.headers.set("X-RateLimit-Limit", finalConfig.max.toString());
        response.headers.set("X-RateLimit-Remaining", remaining.toString());
        response.headers.set("X-RateLimit-Reset", resetTime.toString());
      }

      return response;
    };
  };
}

/**
 * Create a rate limiter with custom configuration
 */
export function createRateLimiter(config: Partial<RateLimitConfig>) {
  return withRateLimit({
    ...DEFAULT_CONFIGS.default,
    ...config,
  });
}

/**
 * Rate limiter for specific route patterns
 */
export const rateLimiters = {
  auth: withRateLimit("auth"),
  login: withRateLimit("login"),
  passwordReset: withRateLimit("passwordReset"),
  write: withRateLimit("write"),
  read: withRateLimit("read"),
  search: withRateLimit("search"),
  export: withRateLimit("export"),
  default: withRateLimit("default"),
};

/**
 * Get current rate limit status for a key
 */
export function getRateLimitStatus(
  request: NextRequest,
  config: RateLimitConfig | string = "default"
): {
  limit: number;
  remaining: number;
  reset: number;
} {
  const finalConfig: RateLimitConfig =
    typeof config === "string" ? DEFAULT_CONFIGS[config] || DEFAULT_CONFIGS.default : config;

  const keyGenerator = finalConfig.keyGenerator || defaultKeyGenerator;
  const key = `ratelimit:${keyGenerator(request)}:${new URL(request.url).pathname}`;
  const entry = rateLimitStore.get(key);

  if (!entry) {
    return {
      limit: finalConfig.max,
      remaining: finalConfig.max,
      reset: Math.ceil((Date.now() + finalConfig.windowMs) / 1000),
    };
  }

  return {
    limit: finalConfig.max,
    remaining: Math.max(0, finalConfig.max - entry.count),
    reset: Math.ceil(entry.resetTime / 1000),
  };
}

/**
 * Reset rate limit for a specific key
 */
export function resetRateLimit(request: NextRequest, config?: RateLimitConfig): void {
  const finalConfig = config || DEFAULT_CONFIGS.default;
  const keyGenerator = finalConfig.keyGenerator || defaultKeyGenerator;
  const key = `ratelimit:${keyGenerator(request)}:${new URL(request.url).pathname}`;
  rateLimitStore.delete(key);
}

export default {
  withRateLimit,
  createRateLimiter,
  rateLimiters,
  getRateLimitStatus,
  resetRateLimit,
  DEFAULT_CONFIGS,
};
