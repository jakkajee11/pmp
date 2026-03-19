/**
 * useObjectives Hook
 *
 * Hook for fetching and listing objectives.
 */

"use client";

import * as React from "react";
import {
  ObjectiveListItem,
  ObjectiveWithRelations,
  ObjectiveListParams,
} from "../types";

interface UseObjectivesOptions {
  filters?: ObjectiveListParams;
  enabled?: boolean;
}

interface UseObjectivesReturn {
  objectives: ObjectiveListItem[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useObjectives(options: UseObjectivesOptions = {}): UseObjectivesReturn {
  const { filters = {}, enabled = true } = options;

  const [objectives, setObjectives] = React.useState<ObjectiveListItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchObjectives = React.useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.cycleId) params.set("cycleId", filters.cycleId);
      if (filters.assignedTo) params.set("assignedTo", filters.assignedTo);
      if (filters.category) params.set("category", filters.category);
      if (filters.createdBy) params.set("createdBy", filters.createdBy);

      const response = await fetch(`/api/objectives?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to fetch objectives");
      }

      setObjectives(data.data.objectives);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  }, [filters.cycleId, filters.assignedTo, filters.category, filters.createdBy, enabled]);

  React.useEffect(() => {
    fetchObjectives();
  }, [fetchObjectives]);

  return {
    objectives,
    isLoading,
    error,
    refetch: fetchObjectives,
  };
}

interface UseObjectiveOptions {
  id: string;
  enabled?: boolean;
}

interface UseObjectiveReturn {
  objective: ObjectiveWithRelations | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useObjective(options: UseObjectiveOptions): UseObjectiveReturn {
  const { id, enabled = true } = options;

  const [objective, setObjective] = React.useState<ObjectiveWithRelations | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchObjective = React.useCallback(async () => {
    if (!enabled || !id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/objectives/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to fetch objective");
      }

      setObjective(data.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  }, [id, enabled]);

  React.useEffect(() => {
    fetchObjective();
  }, [fetchObjective]);

  return {
    objective,
    isLoading,
    error,
    refetch: fetchObjective,
  };
}
