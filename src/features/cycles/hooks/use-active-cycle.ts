"use client";

/**
 * useActiveCycle Hook
 *
 * React hook for fetching the currently active review cycle.
 */

import { useState, useEffect, useCallback } from "react";
import { ReviewCycleListItem } from "../types";

interface UseActiveCycleReturn {
  activeCycle: ReviewCycleListItem | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useActiveCycle(): UseActiveCycleReturn {
  const [activeCycle, setActiveCycle] = useState<ReviewCycleListItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveCycle = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/cycles/active");

      if (response.status === 404) {
        setActiveCycle(null);
        return;
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Failed to fetch active cycle");
      }

      setActiveCycle(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setActiveCycle(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveCycle();
  }, [fetchActiveCycle]);

  return {
    activeCycle,
    isLoading,
    error,
    refetch: fetchActiveCycle,
  };
}
