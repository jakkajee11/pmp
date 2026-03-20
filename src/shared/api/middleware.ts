/**
 * API Middleware Utilities
 *
 * Provides authentication, RBAC, and logging middleware for API routes.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { logger, logRequest, logError } from "../lib/logger";
import { unauthorizedResponse, forbiddenResponse, errorResponse } from "./response";
import { AppError } from "./errors";

// Role hierarchy for permission checks
const ROLE_HIERARCHY: Record<string, number> = {
  SUPER_ADMIN: 100,
  HR_ADMIN: 80,
  HR_STAFF: 60,
  SENIOR_MANAGER: 40,
  LINE_MANAGER: 20,
  EMPLOYEE: 10,
};

export type Role = keyof typeof ROLE_HIERARCHY;

/**
 * Check if user has required role or higher
 */
export function hasRole(userRole: Role, requiredRole: Role): boolean {
  const userLevel = ROLE_HIERARCHY[userRole] ?? 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? 0;
  return userLevel >= requiredLevel;
}

/**
 * Check if user has any of the required roles
 */
export function hasAnyRole(userRole: Role, requiredRoles: Role[]): boolean {
  return requiredRoles.some((role) => hasRole(userRole, role));
}

/**
 * Get current session with type safety
 */
export async function getSession() {
  try {
    const session = await getServerSession();
    return session;
  } catch (error) {
    logError(error as Error, { action: "getSession" });
    return null;
  }
}

/**
 * Require authenticated user
 * Returns user ID or throws unauthorized error
 */
export async function requireAuth(): Promise<{ userId: string; role: Role }> {
  const session = await getSession();

  if (!session?.user) {
    throw new Error("UNAUTHORIZED");
  }

  return {
    userId: session.user.id,
    role: (session.user as { role: Role }).role,
  };
}

/**
 * Get session user from request (for use in API handlers)
 * Returns null if not authenticated
 */
export async function getSessionUser(
  request: NextRequest
): Promise<{ userId: string; role: string } | null> {
  try {
    const auth = await requireAuth();
    return auth;
  } catch {
    return null;
  }
}

/**
 * Require specific role or higher
 */
export async function requireRole(requiredRole: Role): Promise<{ userId: string; role: Role }> {
  const auth = await requireAuth();

  if (!hasRole(auth.role, requiredRole)) {
    throw new Error("FORBIDDEN");
  }

  return auth;
}

/**
 * Require any of the specified roles
 */
export async function requireAnyRole(
  requiredRoles: Role[]
): Promise<{ userId: string; role: Role }> {
  const auth = await requireAuth();

  if (!hasAnyRole(auth.role, requiredRoles)) {
    throw new Error("FORBIDDEN");
  }

  return auth;
}

/**
 * Wrapper that provides authentication to API handlers
 * Returns 401 if not authenticated
 */
export function withAuth(
  request: NextRequest,
  handler: (session: { user: { id: string; role: Role } }) => Promise<NextResponse>
): Promise<NextResponse> {
  return withApiHandler(async () => {
    const auth = await requireAuth();
    return handler({ user: { id: auth.userId, role: auth.role } });
  })(request, {});
}

/**
 * Wrapper that provides RBAC to API handlers
 * Returns 401 if not authenticated, 403 if not authorized
 */
export function withRBAC(
  request: NextRequest,
  requiredRole: Role,
  handler: (session: { user: { id: string; role: Role } }) => Promise<NextResponse>
): Promise<NextResponse> {
  return withApiHandler(async () => {
    const auth = await requireRole(requiredRole);
    return handler({ user: { id: auth.userId, role: auth.role } });
  })(request, {});
}

/**
 * API route wrapper with error handling and logging
 */
export function withApiHandler<T>(
  handler: (request: NextRequest, context: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: T): Promise<NextResponse> => {
    const startTime = Date.now();
    const path = request.nextUrl.pathname;

    try {
      const response = await handler(request, context);
      const durationMs = Date.now() - startTime;

      logRequest(request.method, path, response.status, durationMs);

      return response;
    } catch (error) {
      const durationMs = Date.now() - startTime;

      if (error instanceof AppError) {
        logError(error, { path, method: request.method });
        logRequest(request.method, path, error.statusCode, durationMs);
        return errorResponse(error.code, error.message, error.statusCode, error.details);
      }

      if (error instanceof Error) {
        if (error.message === "UNAUTHORIZED") {
          logRequest(request.method, path, 401, durationMs);
          return unauthorizedResponse();
        }
        if (error.message === "FORBIDDEN") {
          logRequest(request.method, path, 403, durationMs);
          return forbiddenResponse();
        }

        logError(error, { path, method: request.method });
      }

      logRequest(request.method, path, 500, durationMs);
      return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
    }
  };
}

/**
 * Rate limiting configuration
 */
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Simple in-memory rate limiting
 */
export function rateLimit(config: RateLimitConfig) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    // Get client identifier (IP or user ID)
    const forwarded = request.headers.get("x-forwarded-for");
    const clientId = forwarded?.split(",")[0]?.trim() ?? "unknown";
    const key = `${clientId}:${request.nextUrl.pathname}`;

    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return null;
    }

    if (entry.count >= config.maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Too many requests. Please try again later.",
            details: { retryAfter },
          },
        },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfter) },
        }
      );
    }

    entry.count++;
    return null;
  };
}

// Clean up rate limit entries periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, 60000); // Clean up every minute
}
