/**
 * useAuditLogs Hook
 *
 * Hook for fetching and managing audit logs with filtering and pagination.
 */

import { useState, useCallback, useEffect } from "react";
import {
  AuditLog,
  AuditLogFilters,
  PaginatedAuditLogs,
  AuditLogStats,
  AuditAction,
  AuditEntityType,
} from "../types";

// ============================================================================
// Types
// ============================================================================

interface UseAuditLogsOptions {
  initialPage?: number;
  initialLimit?: number;
  initialFilters?: Partial<AuditLogFilters>;
}

interface UseAuditLogsReturn {
  logs: AuditLog[];
  pagination: PaginatedAuditLogs["pagination"] | null;
  filters: AuditLogFilters;
  isLoading: boolean;
  error: string | null;
  stats: AuditLogStats | null;
  statsLoading: boolean;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setFilters: (filters: Partial<AuditLogFilters>) => void;
  resetFilters: () => void;
  refresh: () => void;
  loadStats: () => Promise<void>;
}

// ============================================================================
// Default Filters
// ============================================================================

const defaultFilters: AuditLogFilters = {
  userId: null,
  action: null,
  entityType: null,
  entityId: null,
  dateRange: null,
  ipAddress: null,
};

// ============================================================================
// Hook Implementation
// ============================================================================

export function useAuditLogs(options: UseAuditLogsOptions = {}): UseAuditLogsReturn {
  const { initialPage = 1, initialLimit = 20, initialFilters } = options;

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<PaginatedAuditLogs["pagination"] | null>(null);
  const [filters, setFiltersState] = useState<AuditLogFilters>({
    ...defaultFilters,
    ...initialFilters,
  });
  const [page, setPageState] = useState(initialPage);
  const [limit, setLimitState] = useState(initialLimit);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AuditLogStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Build query string from filters
  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));

    if (filters.userId) params.set("userId", filters.userId);
    if (filters.action) params.set("action", filters.action);
    if (filters.entityType) params.set("entityType", filters.entityType);
    if (filters.entityId) params.set("entityId", filters.entityId);
    if (filters.ipAddress) params.set("ipAddress", filters.ipAddress);
    if (filters.dateRange?.start) {
      params.set("startDate", filters.dateRange.start.toISOString());
    }
    if (filters.dateRange?.end) {
      params.set("endDate", filters.dateRange.end.toISOString());
    }

    return params.toString();
  }, [page, limit, filters]);

  // Fetch audit logs
  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const queryString = buildQueryString();
      const response = await fetch(`/api/audit-logs?${queryString}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message ?? "Failed to fetch audit logs");
      }

      const data: PaginatedAuditLogs = await response.json();
      setLogs(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLogs([]);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  }, [buildQueryString]);

  // Load stats
  const loadStats = useCallback(async () => {
    setStatsLoading(true);

    try {
      const params = new URLSearchParams();
      if (filters.dateRange?.start) {
        params.set("startDate", filters.dateRange.start.toISOString());
      }
      if (filters.dateRange?.end) {
        params.set("endDate", filters.dateRange.end.toISOString());
      }

      const response = await fetch(`/api/audit-logs/stats?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }

      const data = await response.json();
      setStats(data.data);
    } catch {
      // Silently fail stats loading
    } finally {
      setStatsLoading(false);
    }
  }, [filters.dateRange]);

  // Fetch on mount and when filters/page change
  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  // Set page
  const setPage = useCallback((newPage: number) => {
    setPageState(newPage);
  }, []);

  // Set limit
  const setLimit = useCallback((newLimit: number) => {
    setLimitState(newLimit);
    setPageState(1); // Reset to first page
  }, []);

  // Set filters
  const setFilters = useCallback((newFilters: Partial<AuditLogFilters>) => {
    setFiltersState((prev) => ({
      ...prev,
      ...newFilters,
    }));
    setPageState(1); // Reset to first page
  }, []);

  // Reset filters
  const resetFilters = useCallback(() => {
    setFiltersState(defaultFilters);
    setPageState(1);
  }, []);

  // Refresh
  const refresh = useCallback(() => {
    void fetchLogs();
  }, [fetchLogs]);

  return {
    logs,
    pagination,
    filters,
    isLoading,
    error,
    stats,
    statsLoading,
    setPage,
    setLimit,
    setFilters,
    resetFilters,
    refresh,
    loadStats,
  };
}

// ============================================================================
// Additional Hooks
// ============================================================================

/**
 * Hook for fetching a single audit log detail
 */
export function useAuditLogDetail(id: string | null) {
  const [log, setLog] = useState<AuditLog | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLog(null);
      return;
    }

    const fetchDetail = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/audit-logs/${id}`);

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error?.message ?? "Failed to fetch audit log");
        }

        const data = await response.json();
        setLog(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setLog(null);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchDetail();
  }, [id]);

  return { log, isLoading, error };
}

/**
 * Hook for audit action options
 */
export function useAuditFilterOptions() {
  const actionOptions: { value: AuditAction; label: string }[] = [
    { value: "create", label: "Created" },
    { value: "update", label: "Updated" },
    { value: "delete", label: "Deleted" },
    { value: "view", label: "Viewed" },
  ];

  const entityTypeOptions: { value: AuditEntityType; label: string }[] = [
    { value: "User", label: "User" },
    { value: "Department", label: "Department" },
    { value: "ReviewCycle", label: "Review Cycle" },
    { value: "Objective", label: "Objective" },
    { value: "CoreValue", label: "Core Value" },
    { value: "Evaluation", label: "Evaluation" },
    { value: "EvaluationSummary", label: "Evaluation Summary" },
    { value: "Document", label: "Document" },
    { value: "Notification", label: "Notification" },
  ];

  return { actionOptions, entityTypeOptions };
}
