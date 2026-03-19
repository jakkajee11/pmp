"use client";

/**
 * useCycles Hook
 *
 * React hook for fetching and managing review cycles.
 */

import { useState, useEffect, useCallback } from "react";
import {
  ReviewCycleListItem,
  CycleListParams,
  CreateCycleRequest,
  UpdateCycleRequest,
  CycleStatus,
} from "../types";

interface UseCyclesOptions {
  initialParams?: CycleListParams;
}

interface UseCyclesReturn {
  cycles: ReviewCycleListItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createCycle: (data: CreateCycleRequest) => Promise<ReviewCycleListItem>;
  updateCycle: (id: string, data: UpdateCycleRequest) => Promise<ReviewCycleListItem>;
  activateCycle: (id: string) => Promise<void>;
  closeCycle: (id: string) => Promise<void>;
  deleteCycle: (id: string) => Promise<void>;
}

export function useCycles(options: UseCyclesOptions = {}): UseCyclesReturn {
  const [cycles, setCycles] = useState<ReviewCycleListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCycles = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (options.initialParams?.status) {
        params.append("status", options.initialParams.status);
      }
      if (options.initialParams?.type) {
        params.append("type", options.initialParams.type);
      }

      const response = await fetch(`/api/cycles?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Failed to fetch cycles");
      }

      setCycles(result.data.cycles);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [options.initialParams?.status, options.initialParams?.type]);

  useEffect(() => {
    fetchCycles();
  }, [fetchCycles]);

  const createCycle = async (data: CreateCycleRequest): Promise<ReviewCycleListItem> => {
    const response = await fetch("/api/cycles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || "Failed to create cycle");
    }

    await fetchCycles();
    return result.data;
  };

  const updateCycle = async (
    id: string,
    data: UpdateCycleRequest
  ): Promise<ReviewCycleListItem> => {
    const response = await fetch(`/api/cycles/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || "Failed to update cycle");
    }

    await fetchCycles();
    return result.data;
  };

  const activateCycle = async (id: string): Promise<void> => {
    const response = await fetch(`/api/cycles/${id}/activate`, {
      method: "POST",
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || "Failed to activate cycle");
    }

    await fetchCycles();
  };

  const closeCycle = async (id: string): Promise<void> => {
    const response = await fetch(`/api/cycles/${id}/close`, {
      method: "POST",
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || "Failed to close cycle");
    }

    await fetchCycles();
  };

  const deleteCycle = async (id: string): Promise<void> => {
    const response = await fetch(`/api/cycles/${id}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || "Failed to delete cycle");
    }

    await fetchCycles();
  };

  return {
    cycles,
    isLoading,
    error,
    refetch: fetchCycles,
    createCycle,
    updateCycle,
    activateCycle,
    closeCycle,
    deleteCycle,
  };
}
