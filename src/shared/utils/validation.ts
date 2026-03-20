/**
 * Common Zod Validation Schemas
 *
 * Reusable validation schemas for API requests and forms.
 */

import { z } from "zod";

/**
 * UUID validation
 */
export const uuidSchema = z.string().uuid();

/**
 * Email validation
 */
export const emailSchema = z.string().email().max(255);

/**
 * Name validation (supports Thai characters)
 */
export const nameSchema = z.string().min(1).max(255);

/**
 * Thai name validation (optional)
 */
export const thaiNameSchema = z.string().max(255).optional();

/**
 * Language code validation
 */
export const languageSchema = z.enum(["en", "th"]);

/**
 * User role validation
 */
export const roleSchema = z.enum([
  "SUPER_ADMIN",
  "HR_ADMIN",
  "HR_STAFF",
  "SENIOR_MANAGER",
  "LINE_MANAGER",
  "EMPLOYEE",
]);

/**
 * Evaluation status validation
 */
export const evaluationStatusSchema = z.enum([
  "NOT_STARTED",
  "SELF_IN_PROGRESS",
  "SELF_SUBMITTED",
  "MANAGER_IN_PROGRESS",
  "COMPLETED",
  "RETURNED",
]);

/**
 * Cycle status validation
 */
export const cycleStatusSchema = z.enum(["DRAFT", "ACTIVE", "CLOSED"]);

/**
 * Cycle type validation
 */
export const cycleTypeSchema = z.enum(["MID_YEAR", "YEAR_END"]);

/**
 * Objective category validation
 */
export const objectiveCategorySchema = z.enum([
  "DELIVERY",
  "INNOVATION",
  "QUALITY",
  "CULTURE",
]);

/**
 * Rating validation (1-5)
 */
export const ratingSchema = z.number().int().min(1).max(5);

/**
 * Optional rating validation
 */
export const optionalRatingSchema = ratingSchema.optional().nullable();

/**
 * Pagination parameters validation
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * Sort parameters validation
 */
export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

/**
 * Search parameters validation
 */
export const searchSchema = z.object({
  search: z.string().max(255).optional(),
});

/**
 * Date string validation (ISO 8601)
 */
export const dateStringSchema = z.string().datetime();

/**
 * Date validation
 */
export const dateSchema = z.coerce.date();

/**
 * Date range validation
 */
export const dateRangeSchema = z.object({
  startDate: dateSchema,
  endDate: dateSchema,
}).refine(
  (data) => data.endDate >= data.startDate,
  { message: "End date must be after start date" }
);

/**
 * Version validation (for optimistic locking)
 */
export const versionSchema = z.number().int().min(1);

/**
 * Text content validation (max 5000 characters)
 */
export const textContentSchema = z.string().max(5000);

/**
 * Comments validation
 */
export const commentsSchema = z.string().max(5000).optional();

/**
 * Timeline validation (Q1-Q4 or custom range)
 */
export const timelineSchema = z.string().max(100);

/**
 * File name validation
 */
export const fileNameSchema = z.string().max(255);

/**
 * File size validation (max 10MB in bytes)
 */
export const fileSizeSchema = z.number().int().max(10 * 1024 * 1024);

/**
 * Allowed MIME types for document uploads
 */
export const allowedMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png",
  "image/jpeg",
] as const;

/**
 * MIME type validation
 */
export const mimeTypeSchema = z.enum(allowedMimeTypes);

/**
 * Weights configuration validation
 */
export const weightsConfigSchema = z.object({
  kpi: z.number().min(0).max(1),
  coreValues: z.number().min(0).max(1),
}).refine(
  (data) => Math.abs(data.kpi + data.coreValues - 1) < 0.001,
  { message: "KPI and core values weights must sum to 1.0" }
);

/**
 * Create entity response schema helper
 */
export function createEntitySchema<T extends z.ZodRawShape>(shape: T) {
  return z.object({
    id: uuidSchema,
    ...shape,
    createdAt: dateSchema,
    updatedAt: dateSchema,
  });
}

/**
 * API response schema helper
 */
export function apiResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.object({
      code: z.string(),
      message: z.string(),
      details: z.record(z.unknown()).optional(),
    }).optional(),
    meta: z.object({
      page: z.number().optional(),
      limit: z.number().optional(),
      total: z.number().optional(),
      totalPages: z.number().optional(),
    }).optional(),
  });
}

/**
 * Validate and parse with error formatting
 */
export function safeParse<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string[]> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string[]> = {};

  for (const error of result.error.errors) {
    const path = error.path.join(".") || "_root";
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(error.message);
  }

  return { success: false, errors };
}
