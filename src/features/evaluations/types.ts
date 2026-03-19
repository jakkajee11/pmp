/**
 * Evaluation Types
 *
 * Type definitions for self-evaluation and manager review feature.
 */

import { z } from "zod";

// ============================================================================
// Evaluation Status Types
// ============================================================================

export type EvaluationStatus =
  | "NOT_STARTED"
  | "SELF_IN_PROGRESS"
  | "SELF_SUBMITTED"
  | "MANAGER_IN_PROGRESS"
  | "COMPLETED"
  | "RETURNED";

export type EvaluationType = "KPI" | "CORE_VALUE";

// ============================================================================
// Status Constants
// ============================================================================

export const EVALUATION_STATUSES = [
  "NOT_STARTED",
  "SELF_IN_PROGRESS",
  "SELF_SUBMITTED",
  "MANAGER_IN_PROGRESS",
  "COMPLETED",
  "RETURNED",
] as const;

export const EVALUATION_STATUS_LABELS: Record<EvaluationStatus, string> = {
  NOT_STARTED: "Not Started",
  SELF_IN_PROGRESS: "Self Evaluation In Progress",
  SELF_SUBMITTED: "Self Evaluation Submitted",
  MANAGER_IN_PROGRESS: "Manager Review In Progress",
  COMPLETED: "Completed",
  RETURNED: "Returned",
};

export const EVALUATION_STATUS_COLORS: Record<EvaluationStatus, string> = {
  NOT_STARTED: "bg-gray-100 text-gray-800",
  SELF_IN_PROGRESS: "bg-blue-100 text-blue-800",
  SELF_SUBMITTED: "bg-yellow-100 text-yellow-800",
  MANAGER_IN_PROGRESS: "bg-orange-100 text-orange-800",
  COMPLETED: "bg-green-100 text-green-800",
  RETURNED: "bg-red-100 text-red-800",
};

export const EVALUATION_TYPES = ["KPI", "CORE_VALUE"] as const;

// ============================================================================
// Score Constants
// ============================================================================

export const MIN_RATING = 1;
export const MAX_RATING = 5;
export const DEFAULT_KPI_WEIGHT = 0.8;
export const DEFAULT_CORE_VALUES_WEIGHT = 0.2;

export const RATING_LABELS: Record<number, string> = {
  1: "Below Expectations",
  2: "Needs Improvement",
  3: "Meets Expectations",
  4: "Above Expectations",
  5: "Exceeds Expectations",
};

// ============================================================================
// Auto-save Constants
// ============================================================================

export const AUTO_SAVE_DEBOUNCE_MS = 30000; // 30 seconds
export const AUTO_SAVE_MIN_INTERVAL_MS = 5000; // Minimum 5 seconds between saves

// ============================================================================
// Evaluation Types
// ============================================================================

/**
 * Base evaluation entity
 */
export interface Evaluation {
  id: string;
  employeeId: string;
  managerId: string;
  cycleId: string;
  objectiveId?: string;
  coreValueId?: string;
  evaluationType: EvaluationType;
  selfRating: number | null;
  selfComments: string | null;
  selfSubmittedAt: Date | null;
  managerRating: number | null;
  managerFeedback: string | null;
  managerReviewedAt: Date | null;
  status: EvaluationStatus;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Evaluation with related data for display
 */
export interface EvaluationWithRelations extends Evaluation {
  employee: {
    id: string;
    name: string;
    email: string;
  };
  manager: {
    id: string;
    name: string;
  };
  cycle: {
    id: string;
    name: string;
    type: string;
    weightsConfig: {
      kpi: number;
      coreValues: number;
    };
  };
  objective?: {
    id: string;
    title: string;
    description: string;
    ratingCriteria: {
      1: string;
      2: string;
      3: string;
      4: string;
      5: string;
    };
  };
  coreValue?: {
    id: string;
    name: string;
    description: string;
    ratingCriteria: {
      1: string;
      2: string;
      3: string;
      4: string;
      5: string;
    };
  };
}

/**
 * Evaluation list item for display
 */
export interface EvaluationListItem {
  id: string;
  employee: {
    id: string;
    name: string;
  };
  cycle: {
    id: string;
    name: string;
  };
  evaluationType: EvaluationType;
  objective?: {
    id: string;
    title: string;
  } | null;
  coreValue?: {
    id: string;
    name: string;
  } | null;
  selfRating: number | null;
  managerRating: number | null;
  status: EvaluationStatus;
  updatedAt: string;
}

/**
 * Evaluation list query parameters
 */
export interface EvaluationListParams {
  cycleId?: string;
  employeeId?: string;
  status?: EvaluationStatus;
  type?: EvaluationType;
}

// ============================================================================
// Dashboard Types
// ============================================================================

/**
 * Employee dashboard data
 */
export interface EmployeeDashboard {
  cycle: {
    id: string;
    name: string;
    status: string;
  };
  selfEvalDeadline: string;
  objectives: Array<{
    id: string;
    title: string;
    category: string;
    evaluationStatus: EvaluationStatus;
    selfRating: number | null;
  }>;
  coreValues: Array<{
    id: string;
    name: string;
    evaluationStatus: EvaluationStatus;
    selfRating: number | null;
  }>;
  overallStatus: EvaluationStatus;
  canSubmit: boolean;
}

/**
 * Manager dashboard data
 */
export interface ManagerDashboard {
  cycle: {
    id: string;
    name: string;
    status: string;
  };
  team: Array<{
    id: string;
    name: string;
    selfEvalStatus: EvaluationStatus;
    managerReviewStatus: EvaluationStatus;
    overallStatus: EvaluationStatus;
  }>;
  pendingReviews: number;
  completedReviews: number;
}

// ============================================================================
// Score Types
// ============================================================================

/**
 * Calculated scores for an employee
 */
export interface CalculatedScores {
  kpiScore: number | null; // Average of manager KPI ratings
  coreValuesScore: number | null; // Average of manager core value ratings
  finalScore: number | null; // Weighted average
}

/**
 * Evaluation summary with scores
 */
export interface EvaluationSummary {
  employee: {
    id: string;
    name: string;
  };
  cycle: {
    id: string;
    name: string;
  };
  kpiEvaluations: Array<{
    objective: {
      id: string;
      title: string;
    };
    selfRating: number;
    managerRating: number;
  }>;
  coreValueEvaluations: Array<{
    coreValue: {
      id: string;
      name: string;
    };
    selfRating: number;
    managerRating: number;
  }>;
  scores: CalculatedScores;
  overallComments: string | null;
  status: string;
  finalizedAt: Date | null;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Update self-evaluation request
 */
export interface UpdateSelfEvalRequest {
  selfRating: number;
  selfComments: string;
  version: number; // Required for optimistic locking
}

/**
 * Submit self-evaluation request
 */
export interface SubmitSelfEvalRequest {
  version: number;
}

/**
 * Update manager review request
 */
export interface UpdateManagerReviewRequest {
  managerRating: number;
  managerFeedback: string;
  version: number;
}

/**
 * Return evaluation request
 */
export interface ReturnEvaluationRequest {
  reason: string;
}

/**
 * Auto-save data
 */
export interface AutoSaveData {
  evaluationId: string;
  selfRating?: number;
  selfComments?: string;
  lastSavedAt: Date;
  isDirty: boolean;
}

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

export const EvaluationStatusSchema = z.enum([
  "NOT_STARTED",
  "SELF_IN_PROGRESS",
  "SELF_SUBMITTED",
  "MANAGER_IN_PROGRESS",
  "COMPLETED",
  "RETURNED",
]);

export const EvaluationTypeSchema = z.enum(["KPI", "CORE_VALUE"]);

export const RatingSchema = z
  .number()
  .int("Rating must be an integer")
  .min(MIN_RATING, `Rating must be at least ${MIN_RATING}`)
  .max(MAX_RATING, `Rating must be at most ${MAX_RATING}`);

export const VersionSchema = z
  .number()
  .int("Version must be an integer")
  .positive("Version must be positive");

export const UpdateSelfEvalSchema = z.object({
  selfRating: RatingSchema,
  selfComments: z.string().max(5000, "Comments too long"),
  version: VersionSchema,
});

export const SubmitSelfEvalSchema = z.object({
  version: VersionSchema,
});

export const UpdateManagerReviewSchema = z.object({
  managerRating: RatingSchema,
  managerFeedback: z.string().max(5000, "Feedback too long"),
  version: VersionSchema,
});

export const ReturnEvaluationSchema = z.object({
  reason: z.string().min(1, "Reason is required").max(1000, "Reason too long"),
});

export const EvaluationListQuerySchema = z.object({
  cycleId: z.string().uuid().optional(),
  employeeId: z.string().uuid().optional(),
  status: EvaluationStatusSchema.optional(),
  type: EvaluationTypeSchema.optional(),
});

export const EvaluationIdSchema = z.string().uuid("Invalid evaluation ID format");

// ============================================================================
// Scoring Utility Types
// ============================================================================

export interface ScoringInput {
  kpiRatings: number[];
  coreValueRatings: number[];
  weightsConfig: {
    kpi: number;
    coreValues: number;
  };
}

export interface ScoringResult {
  kpiScore: number;
  coreValuesScore: number;
  finalScore: number;
}
