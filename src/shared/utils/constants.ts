/**
 * Application-wide Constants
 *
 * Centralized constants for consistent values across the application.
 */

// ============================================================================
// Application Info
// ============================================================================

export const APP_NAME = "Performance Metrics Portal";
export const APP_VERSION = "1.0.0";

// ============================================================================
// Pagination
// ============================================================================

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ============================================================================
// File Upload
// ============================================================================

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_FILE_SIZE_MB = 10;

export const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png",
  "image/jpeg",
] as const;

export const ALLOWED_FILE_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".png",
  ".jpg",
  ".jpeg",
] as const;

// ============================================================================
// Rating Scale
// ============================================================================

export const MIN_RATING = 1;
export const MAX_RATING = 5;

export const RATING_LABELS: Record<number, string> = {
  1: "Far Below Expectations",
  2: "Below Expectations",
  3: "Meets Expectations",
  4: "Above Expectations",
  5: "Far Exceeds Expectations",
};

export const RATING_LABELS_TH: Record<number, string> = {
  1: "ต่ำกว่าเกณฑ์มาก",
  2: "ต่ำกว่าเกณฑ์",
  3: "ผ่านเกณฑ์",
  4: "เกินเกณฑ์",
  5: "เกินเกณฑ์มาก",
};

// ============================================================================
// Scoring Weights
// ============================================================================

export const DEFAULT_WEIGHTS = {
  kpi: 0.8,
  coreValues: 0.2,
} as const;

// ============================================================================
// Auto-Save
// ============================================================================

export const AUTO_SAVE_DELAY_MS = 30000; // 30 seconds
export const LOCAL_STORAGE_DRAFT_PREFIX = "draft_";

// ============================================================================
// Notifications
// ============================================================================

export const NOTIFICATION_RETRY_DELAYS = [
  60 * 1000, // 1 minute
  5 * 60 * 1000, // 5 minutes
  15 * 60 * 1000, // 15 minutes
];

export const MAX_NOTIFICATION_RETRIES = 3;

// ============================================================================
// Rate Limiting
// ============================================================================

export const DEFAULT_RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
export const DEFAULT_RATE_LIMIT_MAX_REQUESTS = 100;

// ============================================================================
// Audit & Compliance
// ============================================================================

export const AUDIT_RETENTION_YEARS = 5;
export const AUDIT_RETENTION_DAYS = AUDIT_RETENTION_YEARS * 365;

// ============================================================================
// Session & Authentication
// ============================================================================

export const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
export const SESSION_UPDATE_AGE_MS = 60 * 60 * 1000; // 1 hour

// ============================================================================
// Objectives
// ============================================================================

export const MIN_OBJECTIVES_PER_EMPLOYEE = 3;
export const MAX_OBJECTIVES_PER_EMPLOYEE = 10;
export const MAX_OBJECTIVE_TITLE_LENGTH = 500;
export const MAX_OBJECTIVE_DESCRIPTION_LENGTH = 5000;

// ============================================================================
// Evaluation Status Transitions
// ============================================================================

export const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  NOT_STARTED: ["SELF_IN_PROGRESS"],
  SELF_IN_PROGRESS: ["SELF_SUBMITTED"],
  SELF_SUBMITTED: ["MANAGER_IN_PROGRESS", "SELF_IN_PROGRESS"], // Can be returned
  MANAGER_IN_PROGRESS: ["COMPLETED", "SELF_IN_PROGRESS"], // Can be returned
  COMPLETED: [],
  RETURNED: ["SELF_IN_PROGRESS"],
};

// ============================================================================
// Cycle Status Transitions
// ============================================================================

export const VALID_CYCLE_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["ACTIVE"],
  ACTIVE: ["CLOSED"],
  CLOSED: [],
};

// ============================================================================
// Date Formats
// ============================================================================

export const DATE_FORMAT_DISPLAY = "dd/MM/yyyy";
export const DATE_FORMAT_DISPLAY_EN = "MM/dd/yyyy";
export const DATE_FORMAT_API = "yyyy-MM-dd";
export const DATE_TIME_FORMAT_DISPLAY = "dd/MM/yyyy HH:mm";

// ============================================================================
// Objective Categories
// ============================================================================

export const OBJECTIVE_CATEGORIES = [
  "DELIVERY",
  "INNOVATION",
  "QUALITY",
  "CULTURE",
] as const;

export const OBJECTIVE_CATEGORY_LABELS: Record<string, string> = {
  DELIVERY: "Delivery",
  INNOVATION: "Innovation",
  QUALITY: "Quality",
  CULTURE: "Culture",
};

export const OBJECTIVE_CATEGORY_LABELS_TH: Record<string, string> = {
  DELIVERY: "การส่งมอบ",
  INNOVATION: "นวัตกรรม",
  QUALITY: "คุณภาพ",
  CULTURE: "วัฒนธรรมองค์กร",
};

// ============================================================================
// Timeline Options
// ============================================================================

export const TIMELINE_OPTIONS = ["Q1", "Q2", "Q3", "Q4", "H1", "H2", "FY"] as const;

// ============================================================================
// Languages
// ============================================================================

export const SUPPORTED_LANGUAGES = ["en", "th"] as const;
export const DEFAULT_LANGUAGE = "en";

// ============================================================================
// Error Messages
// ============================================================================

export const ERROR_MESSAGES = {
  UNAUTHORIZED: "You must be logged in to access this resource.",
  FORBIDDEN: "You do not have permission to perform this action.",
  NOT_FOUND: "The requested resource was not found.",
  VALIDATION_ERROR: "Please check your input and try again.",
  VERSION_CONFLICT: "This record has been modified. Please refresh and try again.",
  DEADLINE_PASSED: "The deadline for this action has passed.",
  RATE_LIMIT_EXCEEDED: "Too many requests. Please try again later.",
  INTERNAL_ERROR: "An unexpected error occurred. Please try again.",
} as const;
