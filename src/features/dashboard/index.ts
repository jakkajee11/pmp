/**
 * Dashboard Feature - Public API
 *
 * Exports all public types, components, and hooks for the dashboard feature.
 */

// Components
export { ManagerDashboard, ManagerDashboardSkeleton } from "./components/manager-dashboard";
export type { ManagerDashboardProps, TeamMember } from "./components/manager-dashboard";

export {
  StatusSummary,
  ProgressSummary,
  CompletionChart,
} from "./components/status-summary";
export type { StatusSummaryProps, StatCard, ProgressSummaryProps, CompletionChartProps } from "./components/status-summary";

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
