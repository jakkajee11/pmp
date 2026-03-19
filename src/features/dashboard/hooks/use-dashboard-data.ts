/**
 * useDashboardData Hook
 *
 * Custom hook for fetching and managing dashboard data.
 */

"use client";

import * as React from "react";
import { useSession } from "../../auth/hooks/use-session";

export interface DashboardData {
  cycle: {
    id: string;
    name: string;
    status: string;
  } | null;
  // Employee dashboard
  objectives?: Array<{
    id: string;
    title: string;
    category: string;
    evaluationStatus: string;
    selfRating: number | null;
  }>;
  coreValues?: Array<{
    id: string;
    name: string;
    evaluationStatus: string;
    selfRating: number | null;
  }>;
  selfEvalDeadline?: string;
  canSubmit?: boolean;
  // Manager dashboard
  team?: Array<{
    id: string;
    name: string;
    selfEvalStatus: string;
    managerReviewStatus: string;
    overallStatus: string;
  }>;
  pendingReviews?: number;
  completedReviews?: number;
}

export interface UseDashboardDataOptions {
  cycleId?: string;
  refreshInterval?: number;
}

export interface UseDashboardDataReturn {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  isManager: boolean;
}

export function useDashboardData(
  options: UseDashboardDataOptions = {}
): UseDashboardDataReturn {
  const { cycleId, refreshInterval } = options;
  const { session } = useSession();
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const isManager = React.useMemo(() => {
    if (!session?.user?.role) return false;
    return ["LINE_MANAGER", "SENIOR_MANAGER", "HR_ADMIN", "HR_STAFF"].includes(
      session.user.role
    );
  }, [session?.user?.role]);

  const fetchData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set("dashboard", "true");
      if (cycleId) {
        params.set("cycleId", cycleId);
      }

      const response = await fetch(`/api/evaluations?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Failed to fetch dashboard");
      }

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [cycleId]);

  // Initial fetch
  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh
  React.useEffect(() => {
    if (!refreshInterval) return;

    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, refreshInterval]);

  return {
    data,
    isLoading,
    error,
    refresh: fetchData,
    isManager,
  };
}

export interface UseTeamOverviewOptions {
  cycleId?: string;
}

export interface TeamMemberOverview {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  evaluationCount: number;
  completedCount: number;
  selfEvalStatus: string;
  managerReviewStatus: string;
}

export function useTeamOverview(options: UseTeamOverviewOptions = {}) {
  const { cycleId } = options;
  const [team, setTeam] = React.useState<TeamMemberOverview[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchTeam = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (cycleId) {
        params.set("cycleId", cycleId);
      }

      const response = await fetch(`/api/users/team?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Failed to fetch team");
      }

      setTeam(result.data?.team || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [cycleId]);

  React.useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  return {
    team,
    isLoading,
    error,
    refresh: fetchTeam,
  };
}
