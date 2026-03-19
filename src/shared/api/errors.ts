/**
 * Error Classes and Codes
 *
 * Provides custom error classes for consistent error handling across the application.
 */

/**
 * Base application error
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    statusCode: number,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Validation error (422)
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "VALIDATION_ERROR", 422, details);
    this.name = "ValidationError";
  }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      `${resource}${id ? ` with id '${id}'` : ""} not found`,
      "NOT_FOUND",
      404
    );
    this.name = "NotFoundError";
  }
}

/**
 * Unauthorized error (401)
 */
export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized access") {
    super(message, "UNAUTHORIZED", 401);
    this.name = "UnauthorizedError";
  }
}

/**
 * Forbidden error (403)
 */
export class ForbiddenError extends AppError {
  constructor(message = "Access denied") {
    super(message, "FORBIDDEN", 403);
    this.name = "ForbiddenError";
  }
}

/**
 * Conflict error (409)
 */
export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "CONFLICT", 409, details);
    this.name = "ConflictError";
  }
}

/**
 * Optimistic lock error (version mismatch)
 */
export class OptimisticLockError extends AppError {
  constructor(entityType: string, entityId: string) {
    super(
      `${entityType} has been modified by another user. Please refresh and try again.`,
      "VERSION_CONFLICT",
      409,
      { entityType, entityId }
    );
    this.name = "OptimisticLockError";
  }
}

/**
 * Business logic error
 */
export class BusinessError extends AppError {
  constructor(message: string, code: string, details?: Record<string, unknown>) {
    super(message, code, 400, details);
    this.name = "BusinessError";
  }
}

/**
 * Rate limit error (429)
 */
export class RateLimitError extends AppError {
  constructor(retryAfter: number) {
    super("Too many requests. Please try again later.", "RATE_LIMIT_EXCEEDED", 429, { retryAfter });
    this.name = "RateLimitError";
  }
}

// ============================================================================
// Error Codes
// ============================================================================

export const ErrorCodes = {
  // Authentication & Authorization
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  INVALID_TOKEN: "INVALID_TOKEN",
  SESSION_EXPIRED: "SESSION_EXPIRED",

  // Validation
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",

  // Not Found
  NOT_FOUND: "NOT_FOUND",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  CYCLE_NOT_FOUND: "CYCLE_NOT_FOUND",
  OBJECTIVE_NOT_FOUND: "OBJECTIVE_NOT_FOUND",
  EVALUATION_NOT_FOUND: "EVALUATION_NOT_FOUND",

  // Conflict
  CONFLICT: "CONFLICT",
  VERSION_CONFLICT: "VERSION_CONFLICT",
  DUPLICATE_ENTRY: "DUPLICATE_ENTRY",

  // Business Logic
  CYCLE_NOT_ACTIVE: "CYCLE_NOT_ACTIVE",
  EVALUATION_ALREADY_SUBMITTED: "EVALUATION_ALREADY_SUBMITTED",
  EVALUATION_NOT_SUBMITTED: "EVALUATION_NOT_SUBMITTED",
  DEADLINE_PASSED: "DEADLINE_PASSED",
  INVALID_STATUS_TRANSITION: "INVALID_STATUS_TRANSITION",

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",

  // Internal
  INTERNAL_ERROR: "INTERNAL_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
