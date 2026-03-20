/**
 * Audit Log Types
 *
 * Type definitions for audit logging and compliance tracking.
 *
 * Constitution: IV. Observability & Auditability
 * - 5-year audit log retention
 * - No PII in JSONB fields (use IDs only)
 * - Immutable audit records
 */

import { z } from "zod";

// ============================================================================
// Audit Action Types
// ============================================================================

/**
 * Standard audit actions
 */
export type AuditAction = "create" | "update" | "delete" | "view";

/**
 * All possible audit actions including extended actions
 */
export const AUDIT_ACTIONS = [
  "create",
  "update",
  "delete",
  "view",
] as const;

export const AuditActionSchema = z.enum(AUDIT_ACTIONS);

// ============================================================================
// Entity Types
// ============================================================================

/**
 * Entity types that can be audited
 */
export type AuditEntityType =
  | "User"
  | "Department"
  | "ReviewCycle"
  | "Objective"
  | "CoreValue"
  | "Evaluation"
  | "EvaluationSummary"
  | "Document"
  | "Notification";

/**
 * All auditable entity types
 */
export const AUDIT_ENTITY_TYPES = [
  "User",
  "Department",
  "ReviewCycle",
  "Objective",
  "CoreValue",
  "Evaluation",
  "EvaluationSummary",
  "Document",
  "Notification",
] as const;

export const AuditEntityTypeSchema = z.enum(AUDIT_ENTITY_TYPES);

// ============================================================================
// Audit Log Types
// ============================================================================

/**
 * Audit log record from database
 */
export interface AuditLog {
  id: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  ipAddress: string;
  userAgent: string | null;
  createdAt: Date;
}

/**
 * Audit log with expanded user information
 */
export interface AuditLogWithUser extends AuditLog {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

/**
 * Change diff for displaying old vs new values
 */
export interface ChangeDiff {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  type: "added" | "removed" | "modified";
}

// ============================================================================
// Query & Filter Types
// ============================================================================

/**
 * Audit log query parameters
 */
export interface AuditLogQueryParams {
  page?: number;
  limit?: number;
  userId?: string;
  action?: AuditAction;
  entityType?: AuditEntityType;
  entityId?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  ipAddress?: string;
  sortBy?: "createdAt" | "action" | "entityType";
  sortOrder?: "asc" | "desc";
}

/**
 * Audit log filters for UI
 */
export interface AuditLogFilters {
  userId: string | null;
  action: AuditAction | null;
  entityType: AuditEntityType | null;
  entityId: string | null;
  dateRange: {
    start: Date | null;
    end: Date | null;
  } | null;
  ipAddress: string | null;
}

/**
 * Paginated audit log response
 */
export interface PaginatedAuditLogs {
  data: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// ============================================================================
// Statistics Types
// ============================================================================

/**
 * Audit log statistics
 */
export interface AuditLogStats {
  totalLogs: number;
  byAction: Record<AuditAction, number>;
  byEntityType: Record<AuditEntityType, number>;
  byUser: Array<{
    userId: string;
    userName: string;
    count: number;
  }>;
  recentActivity: Array<{
    date: string;
    count: number;
  }>;
}

/**
 * Activity summary for a time period
 */
export interface ActivitySummary {
  period: {
    start: Date;
    end: Date;
  };
  totalActions: number;
  uniqueUsers: number;
  topActions: Array<{
    action: AuditAction;
    count: number;
  }>;
  topEntities: Array<{
    entityType: AuditEntityType;
    count: number;
  }>;
}

// ============================================================================
// Export Types
// ============================================================================

/**
 * Export format for audit logs
 */
export type AuditExportFormat = "csv" | "pdf";

/**
 * Export parameters
 */
export interface AuditExportParams {
  filters: AuditLogFilters;
  format: AuditExportFormat;
  includeUserDetails?: boolean;
}

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

export const AuditLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  userId: z.string().uuid().optional(),
  action: AuditActionSchema.optional(),
  entityType: AuditEntityTypeSchema.optional(),
  entityId: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  ipAddress: z.string().max(45).optional(),
  sortBy: z.enum(["createdAt", "action", "entityType"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const AuditExportQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  action: AuditActionSchema.optional(),
  entityType: AuditEntityTypeSchema.optional(),
  entityId: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  format: z.enum(["csv", "pdf"]).default("csv"),
  includeUserDetails: z.coerce.boolean().default(true),
});

// ============================================================================
// Constants
// ============================================================================

export const ACTION_LABELS: Record<AuditAction, string> = {
  create: "Created",
  update: "Updated",
  delete: "Deleted",
  view: "Viewed",
};

export const ENTITY_TYPE_LABELS: Record<AuditEntityType, string> = {
  User: "User",
  Department: "Department",
  ReviewCycle: "Review Cycle",
  Objective: "Objective",
  CoreValue: "Core Value",
  Evaluation: "Evaluation",
  EvaluationSummary: "Evaluation Summary",
  Document: "Document",
  Notification: "Notification",
};

export const ACTION_COLORS: Record<AuditAction, string> = {
  create: "#10B981", // Green
  update: "#3B82F6", // Blue
  delete: "#EF4444", // Red
  view: "#6B7280", // Gray
};

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
