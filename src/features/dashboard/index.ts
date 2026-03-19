/**
 * Dashboard Feature - Public API
 *
 * Exports all public types, components, and hooks for the dashboard feature.
 */

// Components
export { ManagerDashboard, ManagerDashboardSkeleton } from "./components/manager-dashboard";
export type { ManagerDashboardProps, TeamMember } from "./components/manager-dashboard";

export { EmployeeDashboard, EmployeeDashboardSkeleton } from "./components/employee-dashboard";
export type { EmployeeDashboardProps, ObjectiveSummary } from "./components/employee-dashboard";

export { HRDashboard, HRDashboardSkeleton } from "./components/hr-dashboard";
export type { HRDashboardProps, DepartmentStats, CycleProgress } from "./components/hr-dashboard";

export {
  StatusSummary,
  ProgressSummary,
  CompletionChart,
} from "./components/status-summary";
export type { StatusSummaryProps, StatCard, ProgressSummaryProps, CompletionChartProps } from "./components/status-summary";

export {
  CompletionChart as CompletionChartWidget,
  DonutChart,
  CompletionChartSkeleton,
} from "./components/completion-chart";
export type { CompletionChartProps as CompletionChartWidgetProps, DonutChartProps, ChartDataItem } from "./components/completion-chart";

// Hooks
export {
  useDashboardData,
  useTeamOverview,
} from "./hooks/use-dashboard-data";
export type {
  DashboardData,
  UseDashboardDataOptions,
  UseDashboardDataReturn,
  TeamMemberOverview,
  UseTeamOverviewOptions,
} from "./hooks/use-dashboard-data";
