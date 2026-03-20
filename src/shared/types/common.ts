/**
 * Common Types
 *
 * Shared type definitions used across the application.
 */

/**
 * Pagination parameters for list queries
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Pagination metadata for responses
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Sort parameters
 */
export interface SortParams {
  sortBy: string;
  sortOrder: "asc" | "desc";
}

/**
 * Filter parameters base
 */
export interface FilterParams {
  search?: string;
}

/**
 * Date range filter
 */
export interface DateRangeFilter {
  startDate?: Date;
  endDate?: Date;
}

/**
 * ID type (UUID)
 */
export type UUID = string;

/**
 * Timestamps mixin
 */
export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Soft delete mixin
 */
export interface SoftDelete {
  isActive: boolean;
}

/**
 * Base entity with common fields
 */
export interface BaseEntity extends Timestamps {
  id: UUID;
}

/**
 * Language code type
 */
export type LanguageCode = "en" | "th";

/**
 * User role enum type
 */
export type UserRole =
  | "SUPER_ADMIN"
  | "HR_ADMIN"
  | "HR_STAFF"
  | "SENIOR_MANAGER"
  | "LINE_MANAGER"
  | "EMPLOYEE";

/**
 * Evaluation status enum type
 */
export type EvaluationStatus =
  | "NOT_STARTED"
  | "SELF_IN_PROGRESS"
  | "SELF_SUBMITTED"
  | "MANAGER_IN_PROGRESS"
  | "COMPLETED"
  | "RETURNED";

/**
 * Cycle status enum type
 */
export type CycleStatus = "DRAFT" | "ACTIVE" | "CLOSED";

/**
 * Objective category enum type
 */
export type ObjectiveCategory = "DELIVERY" | "INNOVATION" | "QUALITY" | "CULTURE";

/**
 * Weights configuration for scoring
 */
export interface WeightsConfig {
  kpi: number;
  coreValues: number;
}

/**
 * Rating scale (1-5)
 */
export type Rating = 1 | 2 | 3 | 4 | 5;

/**
 * Score calculation result
 */
export interface ScoreResult {
  kpiScore: number;
  coreValuesScore: number;
  finalScore: number;
}

/**
 * Audit log entry type
 */
export interface AuditLogEntry {
  id: UUID;
  userId: UUID;
  action: "create" | "update" | "delete" | "view";
  entityType: string;
  entityId: UUID;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  ipAddress: string;
  userAgent: string | null;
  createdAt: Date;
}

/**
 * Notification type
 */
export type NotificationType =
  | "CYCLE_START"
  | "DEADLINE_REMINDER"
  | "SUBMISSION_CONFIRM"
  | "FEEDBACK_AVAILABLE"
  | "ESCALATION";

/**
 * Notification channel
 */
export type NotificationChannel = "EMAIL" | "SMS" | "TEAMS";
