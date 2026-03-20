/**
 * useReports Hook
 *
 * Custom hook for fetching and managing report data.
 */

import { useState, useCallback } from "react";
import {
  CompletionReport,
  RatingDistributionReport,
  ReportFilters,
  FilterOption,
  ExportFormat,
  ReportType,
} from "../types";

interface UseReportsOptions {
  initialFilters?: Partial<ReportFilters>;
}

interface UseReportsReturn {
  // Data
  completionReport: CompletionReport | null;
  ratingDistribution: RatingDistributionReport | null;

  // Loading states
  isLoadingCompletion: boolean;
  isLoadingRatings: boolean;
  isExporting: boolean;

  // Errors
  completionError: string | null;
  ratingsError: string | null;
  exportError: string | null;

  // Filters
  filters: ReportFilters;
  cycles: FilterOption[];
  departments: FilterOption[];

  // Actions
  fetchCompletionReport: () => Promise<void>;
  fetchRatingDistribution: () => Promise<void>;
  exportReport: (format: ExportFormat) => Promise<void>;
  setFilters: (filters: ReportFilters) => void;
  fetchFilterOptions: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useReports(options: UseReportsOptions = {}): UseReportsReturn {
  const { initialFilters } = options;

  // State
  const [completionReport, setCompletionReport] = useState<CompletionReport | null>(null);
  const [ratingDistribution, setRatingDistribution] = useState<RatingDistributionReport | null>(null);
  const [isLoadingCompletion, setIsLoadingCompletion] = useState(false);
  const [isLoadingRatings, setIsLoadingRatings] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [ratingsError, setRatingsError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<ReportFilters>(
    initialFilters || {
      cycleId: null,
      departmentId: null,
      reportType: "completion",
    }
  );
  const [cycles, setCycles] = useState<FilterOption[]>([]);
  const [departments, setDepartments] = useState<FilterOption[]>([]);

  // Fetch completion report
  const fetchCompletionReport = useCallback(async () => {
    if (!filters.cycleId) {
      setCompletionError("Please select a cycle");
      return;
    }

    setIsLoadingCompletion(true);
    setCompletionError(null);

    try {
      const params = new URLSearchParams({
        cycleId: filters.cycleId,
      });

      if (filters.departmentId) {
        params.append("departmentId", filters.departmentId);
      }

      const response = await fetch(`/api/reports/completion?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to fetch completion report");
      }

      setCompletionReport(data.data);
    } catch (error) {
      setCompletionError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoadingCompletion(false);
    }
  }, [filters.cycleId, filters.departmentId]);

  // Fetch rating distribution
  const fetchRatingDistribution = useCallback(async () => {
    if (!filters.cycleId) {
      setRatingsError("Please select a cycle");
      return;
    }

    setIsLoadingRatings(true);
    setRatingsError(null);

    try {
      const params = new URLSearchParams({
        cycleId: filters.cycleId,
      });

      const response = await fetch(`/api/reports/rating-distribution?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to fetch rating distribution");
      }

      setRatingDistribution(data.data);
    } catch (error) {
      setRatingsError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoadingRatings(false);
    }
  }, [filters.cycleId]);

  // Export report
  const exportReport = useCallback(
    async (format: ExportFormat) => {
      if (!filters.cycleId) {
        setExportError("Please select a cycle");
        return;
      }

      setIsExporting(true);
      setExportError(null);

      try {
        const params = new URLSearchParams({
          cycleId: filters.cycleId,
          reportType: filters.reportType,
          format,
        });

        if (filters.departmentId) {
          params.append("departmentId", filters.departmentId);
        }

        const response = await fetch(`/api/reports/export/${format}?${params.toString()}`);

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error?.message || "Failed to export report");
        }

        // Get the blob and download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${filters.reportType}_report_${filters.cycleId}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (error) {
        setExportError(error instanceof Error ? error.message : "An error occurred");
      } finally {
        setIsExporting(false);
      }
    },
    [filters]
  );

  // Set filters
  const setFilters = useCallback((newFilters: ReportFilters) => {
    setFiltersState(newFilters);
  }, []);

  // Fetch filter options (cycles and departments)
  const fetchFilterOptions = useCallback(async () => {
    try {
      // Fetch cycles
      const cyclesResponse = await fetch("/api/cycles");
      const cyclesData = await cyclesResponse.json();

      if (cyclesResponse.ok && cyclesData.data?.cycles) {
        setCycles(
          cyclesData.data.cycles.map((cycle: { id: string; name: string }) => ({
            value: cycle.id,
            label: cycle.name,
          }))
        );
      }

      // Fetch departments
      const deptsResponse = await fetch("/api/departments");
      const deptsData = await deptsResponse.json();

      if (deptsResponse.ok && deptsData.data?.departments) {
        setDepartments(
          deptsData.data.departments.map((dept: { id: string; name: string }) => ({
            value: dept.id,
            label: dept.name,
          }))
        );
      }
    } catch (error) {
      console.error("Failed to fetch filter options:", error);
    }
  }, []);

  // Refresh all data
  const refresh = useCallback(async () => {
    await Promise.all([fetchCompletionReport(), fetchRatingDistribution()]);
  }, [fetchCompletionReport, fetchRatingDistribution]);

  return {
    // Data
    completionReport,
    ratingDistribution,

    // Loading states
    isLoadingCompletion,
    isLoadingRatings,
    isExporting,

    // Errors
    completionError,
    ratingsError,
    exportError,

    // Filters
    filters,
    cycles,
    departments,

    // Actions
    fetchCompletionReport,
    fetchRatingDistribution,
    exportReport,
    setFilters,
    fetchFilterOptions,
    refresh,
  };
}

export default useReports;
