/**
 * Report Types
 *
 * Type definitions for reports and analytics feature.
 */

import { z } from "zod";

// ============================================================================
// Report Types
// ============================================================================

export type ReportType = "completion" | "ratings" | "detailed" | "historical";

export type ExportFormat = "csv" | "pdf";

// ============================================================================
// Completion Report Types
// ============================================================================

/**
 * Overall completion statistics
 */
export interface CompletionOverall {
  totalEmployees: number;
  selfEvalCompleted: number;
  selfEvalPercentage: number;
  managerReviewCompleted: number;
  managerReviewPercentage: number;
  selfEvalSubmitted?: number;
  managerReviewCompletedCount?: number;
}

/**
 * Department-level completion statistics
 */
export interface DepartmentCompletion {
  department: {
    id: string;
    name: string;
  };
  total: number;
  selfEvalCompleted: number;
  managerReviewCompleted: number;
}

/**
 * Status breakdown for completion report
 */
export interface StatusBreakdown {
  notStarted: number;
  selfInProgress: number;
  selfSubmitted: number;
  managerInProgress: number;
  completed: number;
}

/**
 * Full completion report data
 */
export interface CompletionReport {
  cycle: {
    id: string;
    name: string;
  };
  overall: CompletionOverall;
  byDepartment: DepartmentCompletion[];
  byStatus: StatusBreakdown;
  generatedAt: Date;
}

// ============================================================================
// Rating Distribution Types
// ============================================================================

/**
 * Rating distribution (1-5 scale)
 */
export interface RatingDistribution {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

/**
 * Score range for distribution
 */
export interface ScoreRange {
  min: number;
  max: number;
  count: number;
  label: string;
}

/**
 * Final score distribution
 */
export interface FinalScoreDistribution {
  ranges: ScoreRange[];
}

/**
 * Rating distribution report data
 */
export interface RatingDistributionReport {
  cycle: {
    id: string;
    name: string;
  };
  kpiDistribution: RatingDistribution;
  coreValuesDistribution: RatingDistribution;
  finalScoreDistribution: FinalScoreDistribution;
  generatedAt: Date;
}

// ============================================================================
// Detailed Report Types
// ============================================================================

/**
 * Employee evaluation detail for detailed report
 */
export interface EmployeeEvaluationDetail {
  employee: {
    id: string;
    name: string;
    email: string;
    department: string | null;
  };
  cycle: {
    id: string;
    name: string;
  };
  kpiEvaluations: Array<{
    objective: {
      id: string;
      title: string;
      category: string;
    };
    selfRating: number | null;
    managerRating: number | null;
    status: string;
  }>;
  coreValueEvaluations: Array<{
    coreValue: {
      id: string;
      name: string;
    };
    selfRating: number | null;
    managerRating: number | null;
    status: string;
  }>;
  scores: {
    kpiScore: number | null;
    coreValuesScore: number | null;
    finalScore: number | null;
  };
  overallStatus: string;
}

/**
 * Detailed report data
 */
export interface DetailedReport {
  cycle: {
    id: string;
    name: string;
  };
  employees: EmployeeEvaluationDetail[];
  generatedAt: Date;
}

// ============================================================================
// Report Query Types
// ============================================================================

/**
 * Completion report query parameters
 */
export interface CompletionReportParams {
  cycleId: string;
  departmentId?: string;
}

/**
 * Rating distribution query parameters
 */
export interface RatingDistributionParams {
  cycleId: string;
}

/**
 * Export query parameters
 */
export interface ExportParams {
  cycleId: string;
  reportType: ReportType;
  departmentId?: string;
  format: ExportFormat;
}

// ============================================================================
// Chart Data Types
// ============================================================================

/**
 * Chart data point
 */
export interface ChartDataPoint {
  name: string;
  value: number;
  label?: string;
}

/**
 * Bar chart data
 */
export interface BarChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
  }>;
}

/**
 * Pie chart data
 */
export interface PieChartData {
  labels: string[];
  datasets: Array<{
    data: number[];
    backgroundColor?: string[];
    borderColor?: string[];
  }>;
}

// ============================================================================
// Filter Types
// ============================================================================

/**
 * Report filter state
 */
export interface ReportFilters {
  cycleId: string | null;
  departmentId: string | null;
  reportType: ReportType;
}

/**
 * Filter option for dropdowns
 */
export interface FilterOption {
  value: string;
  label: string;
}

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

export const ReportTypeSchema = z.enum(["completion", "ratings", "detailed", "historical"]);

export const ExportFormatSchema = z.enum(["csv", "pdf"]);

export const CompletionReportQuerySchema = z.object({
  cycleId: z.string().uuid("Invalid cycle ID"),
  departmentId: z.string().uuid("Invalid department ID").optional(),
});

export const RatingDistributionQuerySchema = z.object({
  cycleId: z.string().uuid("Invalid cycle ID"),
});

export const ExportQuerySchema = z.object({
  cycleId: z.string().uuid("Invalid cycle ID"),
  reportType: ReportTypeSchema,
  departmentId: z.string().uuid("Invalid department ID").optional(),
  format: ExportFormatSchema,
});

// ============================================================================
// Constants
// ============================================================================

export const REPORT_TYPES: ReportType[] = ["completion", "ratings", "detailed", "historical"];

export const EXPORT_FORMATS: ExportFormat[] = ["csv", "pdf"];

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  completion: "Completion Report",
  ratings: "Rating Distribution",
  detailed: "Detailed Report",
  historical: "Historical Evaluation Report",
};

export const STATUS_COLORS: Record<string, string> = {
  notStarted: "#9CA3AF",
  selfInProgress: "#3B82F6",
  selfSubmitted: "#F59E0B",
  managerInProgress: "#F97316",
  completed: "#10B981",
  returned: "#EF4444",
};

export const RATING_COLORS: Record<number, string> = {
  1: "#EF4444", // Red - Below expectations
  2: "#F97316", // Orange - Needs improvement
  3: "#F59E0B", // Yellow - Meets expectations
  4: "#10B981", // Green - Above expectations
  5: "#3B82F6", // Blue - Exceeds expectations
};

export const SCORE_RANGE_DEFAULTS: ScoreRange[] = [
  { min: 0, max: 1.5, count: 0, label: "0 - 1.5" },
  { min: 1.5, max: 2.5, count: 0, label: "1.5 - 2.5" },
  { min: 2.5, max: 3.5, count: 0, label: "2.5 - 3.5" },
  { min: 3.5, max: 4.5, count: 0, label: "3.5 - 4.5" },
  { min: 4.5, max: 5, count: 0, label: "4.5 - 5" },
];
