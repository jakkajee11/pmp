/**
 * useOrgData Hook
 *
 * Fetches organization chart data with caching.
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import { OrgChartNode, OrgChartFilters, OrgFlowNode, OrgFlowEdge } from "../types";

interface UseOrgDataReturn {
  orgTree: OrgChartNode | null;
  isLoading: boolean;
  error: string | null;
  filters: OrgChartFilters;
  setFilters: (filters: OrgChartFilters) => void;
  refresh: () => Promise<void>;
}

export function useOrgData(initialFilters?: OrgChartFilters): UseOrgDataReturn {
  const [orgTree, setOrgTree] = useState<OrgChartNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<OrgChartFilters>(
    initialFilters ?? { depth: 3 }
  );

  const fetchOrgChart = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (filters.rootUserId) {
        params.set("root_user_id", filters.rootUserId);
      }
      if (filters.depth) {
        params.set("depth", String(filters.depth));
      }
      if (filters.departmentId) {
        params.set("department_id", filters.departmentId);
      }

      const response = await fetch(`/api/org-chart?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to fetch org chart");
      }

      setOrgTree(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setOrgTree(null);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchOrgChart();
  }, [fetchOrgChart]);

  const setFilters = useCallback((newFilters: OrgChartFilters) => {
    setFiltersState(newFilters);
  }, []);

  const refresh = useCallback(async () => {
    await fetchOrgChart();
  }, [fetchOrgChart]);

  return {
    orgTree,
    isLoading,
    error,
    filters,
    setFilters,
    refresh,
  };
}

interface UseOrgFlatDataReturn {
  nodes: OrgFlowNode[];
  edges: OrgFlowEdge[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useOrgFlatData(
  filters?: OrgChartFilters
): UseOrgFlatDataReturn {
  const [nodes, setNodes] = useState<OrgFlowNode[]>([]);
  const [edges, setEdges] = useState<OrgFlowEdge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrgChart = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (filters?.rootUserId) {
        params.set("root_user_id", filters.rootUserId);
      }
      if (filters?.depth) {
        params.set("depth", String(filters.depth));
      }
      if (filters?.departmentId) {
        params.set("department_id", filters.departmentId);
      }

      const response = await fetch(`/api/org-chart/flat?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to fetch org chart");
      }

      setNodes(data.data.nodes);
      setEdges(data.data.edges);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setNodes([]);
      setEdges([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters?.rootUserId, filters?.depth, filters?.departmentId]);

  useEffect(() => {
    fetchOrgChart();
  }, [fetchOrgChart]);

  return {
    nodes,
    edges,
    isLoading,
    error,
    refresh: fetchOrgChart,
  };
}
