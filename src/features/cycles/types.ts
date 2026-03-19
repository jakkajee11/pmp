/**
 * Review Cycle Types
 *
 * Type definitions for review cycle management.
 */

import { z } from "zod";

// ============================================================================
// Cycle Type & Status Types
// ============================================================================

export type CycleType = "MID_YEAR" | "YEAR_END";
export type CycleStatus = "DRAFT" | "ACTIVE" | "CLOSED";

// ============================================================================
// Cycle Type Constants
// ============================================================================

export const CYCLE_TYPES = ["MID_YEAR", "YEAR_END"] as const;
export const CYCLE_STATUSES = ["DRAFT", "ACTIVE", "CLOSED"] as const;

export const CYCLE_TYPE_LABELS: Record<CycleType, string> = {
  MID_YEAR: "Mid-Year Review",
  YEAR_END: "Year-End Review",
};

export const CYCLE_TYPE_LABELS_TH: Record<CycleType, string> = {
  MID_YEAR: "ประเมินกลางปี",
  YEAR_END: "ประเมินสิ้นปี",
};

export const CYCLE_STATUS_LABELS: Record<CycleStatus, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  CLOSED: "Closed",
};

export const CYCLE_STATUS_LABELS_TH: Record<CycleStatus, string> = {
  DRAFT: "ร่าง",
  ACTIVE: "ใช้งาน",
  CLOSED: "ปิดแล้ว",
};

export const CYCLE_STATUS_COLORS: Record<CycleStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  ACTIVE: "bg-green-100 text-green-800",
  CLOSED: "bg-blue-100 text-blue-800",
};

// ============================================================================
// Weights Configuration
// ============================================================================

export interface WeightsConfig {
  kpi: number;
  coreValues: number;
}

export const DEFAULT_WEIGHTS: WeightsConfig = {
  kpi: 0.8,
  coreValues: 0.2,
};

// ============================================================================
// Review Cycle Types
// ============================================================================

/**
 * Review cycle entity type
 */
export interface ReviewCycle {
  id: string;
  name: string;
  type: CycleType;
  startDate: Date;
  endDate: Date;
  selfEvalDeadline: Date;
  managerReviewDeadline: Date;
  gracePeriodDays: number;
  status: CycleStatus;
  weightsConfig: WeightsConfig;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Review cycle with completion statistics
 */
export interface ReviewCycleWithStats extends ReviewCycle {
  completionStats: {
    totalEmployees: number;
    selfEvalCompleted: number;
    managerReviewCompleted: number;
  };
}

/**
 * Review cycle list item for display
 */
export interface ReviewCycleListItem {
  id: string;
  name: string;
  type: CycleType;
  startDate: string;
  endDate: string;
  status: CycleStatus;
  selfEvalDeadline: string;
  managerReviewDeadline: string;
  completionStats: {
    totalEmployees: number;
    selfEvalCompleted: number;
    managerReviewCompleted: number;
  };
  createdAt: string;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Cycle list query parameters
 */
export interface CycleListParams {
  status?: CycleStatus;
  type?: CycleType;
}

/**
 * Create cycle request
 */
export interface CreateCycleRequest {
  name: string;
  type: CycleType;
  startDate: string;
  endDate: string;
  selfEvalDeadline: string;
  managerReviewDeadline: string;
  gracePeriodDays?: number;
  weightsConfig?: WeightsConfig;
}

/**
 * Update cycle request (draft status only)
 */
export interface UpdateCycleRequest {
  name?: string;
  type?: CycleType;
  startDate?: string;
  endDate?: string;
  selfEvalDeadline?: string;
  managerReviewDeadline?: string;
  gracePeriodDays?: number;
  weightsConfig?: WeightsConfig;
}

/**
 * Deadline extension request
 */
export interface DeadlineExtensionRequest {
  userIds: string[];
  extensionType: "self_eval" | "manager_review";
  newDeadline: string;
}

/**
 * Deadline extension record
 */
export interface DeadlineExtension {
  id: string;
  cycleId: string;
  userId: string;
  extensionType: "self_eval" | "manager_review";
  originalDeadline: Date;
  newDeadline: Date;
  grantedBy: string;
  grantedAt: Date;
}

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

export const CycleTypeSchema = z.enum(["MID_YEAR", "YEAR_END"]);

export const CycleStatusSchema = z.enum(["DRAFT", "ACTIVE", "CLOSED"]);

export const WeightsConfigSchema = z.object({
  kpi: z.number().min(0).max(1),
  coreValues: z.number().min(0).max(1),
}).refine(
  (data) => Math.abs(data.kpi + data.coreValues - 1) < 0.001,
  { message: "Weights must sum to 1.0" }
);

export const CreateCycleSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name too long"),
  type: CycleTypeSchema,
  startDate: z.string().transform((val) => new Date(val)),
  endDate: z.string().transform((val) => new Date(val)),
  selfEvalDeadline: z.string().transform((val) => new Date(val)),
  managerReviewDeadline: z.string().transform((val) => new Date(val)),
  gracePeriodDays: z.number().int().min(0).max(30).default(0),
  weightsConfig: WeightsConfigSchema.default({ kpi: 0.8, coreValues: 0.2 }),
}).refine(
  (data) => data.startDate < data.endDate,
  { message: "Start date must be before end date", path: ["startDate"] }
).refine(
  (data) => {
    const selfEvalDate = new Date(data.selfEvalDeadline);
    const managerDate = new Date(data.managerReviewDeadline);
    const endDate = new Date(data.endDate);
    return selfEvalDate <= endDate && managerDate <= endDate;
  },
  { message: "Deadlines must be within cycle date range", path: ["selfEvalDeadline"] }
).refine(
  (data) => {
    const selfEvalDate = new Date(data.selfEvalDeadline);
    const managerDate = new Date(data.managerReviewDeadline);
    return selfEvalDate <= managerDate;
  },
  { message: "Self-evaluation deadline must be before manager review deadline", path: ["selfEvalDeadline"] }
);

export const UpdateCycleSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name too long").optional(),
  type: CycleTypeSchema.optional(),
  startDate: z.string().transform((val) => new Date(val)).optional(),
  endDate: z.string().transform((val) => new Date(val)).optional(),
  selfEvalDeadline: z.string().transform((val) => new Date(val)).optional(),
  managerReviewDeadline: z.string().transform((val) => new Date(val)).optional(),
  gracePeriodDays: z.number().int().min(0).max(30).optional(),
  weightsConfig: WeightsConfigSchema.optional(),
});

export const CycleListQuerySchema = z.object({
  status: CycleStatusSchema.optional(),
  type: CycleTypeSchema.optional(),
});

export const DeadlineExtensionSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1, "At least one user is required").max(100),
  extensionType: z.enum(["self_eval", "manager_review"]),
  newDeadline: z.string().transform((val) => new Date(val)),
});

export const CycleIdSchema = z.string().uuid("Invalid cycle ID format");
