/**
 * Audit Logs Feature - Public Exports
 *
 * This file exports all public types, components, hooks, and utilities
 * from the audit-logs feature module.
 */

// Types
export type {
  AuditAction,
  AuditEntityType,
  AuditLog,
  AuditLogWithUser,
  ChangeDiff,
  AuditLogQueryParams,
  AuditLogFilters,
  PaginatedAuditLogs,
  AuditLogStats,
  ActivitySummary,
  AuditExportFormat,
  AuditExportParams,
} from "./types";

// Constants
export {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  ACTION_LABELS,
  ENTITY_TYPE_LABELS,
  ACTION_COLORS,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from "./types";

// Schemas
export {
  AuditActionSchema,
  AuditEntityTypeSchema,
  AuditLogQuerySchema,
  AuditExportQuerySchema,
} from "./types";

// Components
export { AuditLogTable } from "./components/audit-log-table";
export { AuditLogFilters } from "./components/audit-log-filters";
export { ChangeDiff as ChangeDiffComponent } from "./components/change-diff";

// Hooks
export {
  useAuditLogs,
  useAuditLogDetail,
  useAuditFilterOptions,
} from "./hooks/use-audit-logs";

// API Handlers (for route re-exports)
export {
  getAuditLogsHandler,
  getAuditLogStatsHandler,
  getAuditLogDetailHandler,
  exportAuditLogsHandler,
} from "./api/handlers";
