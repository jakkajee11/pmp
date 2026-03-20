/**
 * Reports Feature - Public Exports
 *
 * This file exports all public types, components, hooks, and utilities
 * from the reports feature module.
 */

// Types
export type {
  ReportType,
  ExportFormat,
  CompletionOverall,
  DepartmentCompletion,
  StatusBreakdown,
  CompletionReport,
  RatingDistribution,
  ScoreRange,
  FinalScoreDistribution,
  RatingDistributionReport,
  EmployeeEvaluationDetail,
  DetailedReport,
  CompletionReportParams,
  RatingDistributionParams,
  ExportParams,
  ChartDataPoint,
  BarChartData,
  PieChartData,
  ReportFilters,
  FilterOption,
} from "./types";

// Constants
export {
  REPORT_TYPES,
  EXPORT_FORMATS,
  REPORT_TYPE_LABELS,
  STATUS_COLORS,
  RATING_COLORS,
  SCORE_RANGE_DEFAULTS,
} from "./types";

// Schemas
export {
  ReportTypeSchema,
  ExportFormatSchema,
  CompletionReportQuerySchema,
  RatingDistributionQuerySchema,
  ExportQuerySchema,
} from "./types";

// Components
export { CompletionReport as CompletionReportCard } from "./components/completion-report";
export { RatingDistributionChart } from "./components/rating-distribution-chart";
export { ReportFilters as ReportFiltersCard } from "./components/report-filters";
export { ExportDialog } from "./components/export-dialog";

// Hooks
export { useReports } from "./hooks/use-reports";

// API Handlers (for route re-exports)
export {
  getCompletionReportHandler,
  getRatingDistributionHandler,
  exportCsvHandler,
  exportPdfHandler,
} from "./api/handlers";
