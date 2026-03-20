/**
 * Standard API Response Helpers
 *
 * Provides consistent response formatting for all API endpoints.
 */

import { NextResponse } from "next/server";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

/**
 * Success response helper
 */
export function successResponse<T>(
  data: T,
  status = 200,
  meta?: ApiResponse["meta"]
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(meta && { meta }),
    },
    { status }
  );
}

/**
 * Error response helper
 */
export function errorResponse(
  code: string,
  message: string,
  status = 400,
  details?: Record<string, unknown>
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details && { details }),
      },
    },
    { status }
  );
}

/**
 * Paginated response helper
 */
export function paginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): NextResponse<ApiResponse<T[]>> {
  const totalPages = Math.ceil(total / limit);

  return successResponse(data, 200, {
    page,
    limit,
    total,
    totalPages,
  });
}

/**
 * No content response helper
 */
export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

/**
 * Not found response helper
 */
export function notFoundResponse(
  resource: string
): NextResponse<ApiResponse> {
  return errorResponse("NOT_FOUND", `${resource} not found`, 404);
}

/**
 * Unauthorized response helper
 */
export function unauthorizedResponse(
  message = "Unauthorized access"
): NextResponse<ApiResponse> {
  return errorResponse("UNAUTHORIZED", message, 401);
}

/**
 * Forbidden response helper
 */
export function forbiddenResponse(
  message = "Access denied"
): NextResponse<ApiResponse> {
  return errorResponse("FORBIDDEN", message, 403);
}

/**
 * Validation error response helper
 */
export function validationErrorResponse(
  details: Record<string, unknown>
): NextResponse<ApiResponse> {
  return errorResponse(
    "VALIDATION_ERROR",
    "Validation failed",
    422,
    details
  );
}

/**
 * Conflict response helper (e.g., version mismatch)
 */
export function conflictResponse(
  message: string,
  details?: Record<string, unknown>
): NextResponse<ApiResponse> {
  return errorResponse("CONFLICT", message, 409, details);
}
