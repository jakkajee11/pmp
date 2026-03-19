/**
 * useObjectiveMutations Hook
 *
 * Hook for creating, updating, and deleting objectives.
 */

"use client";

import * as React from "react";
import {
  CreateObjectiveRequest,
  UpdateObjectiveRequest,
  BulkAssignRequest,
  CopyObjectiveRequest,
  BulkAssignResult,
  ObjectiveWithRelations,
} from "../types";

interface UseObjectiveMutationsReturn {
  createObjective: (data: CreateObjectiveRequest) => Promise<ObjectiveWithRelations>;
  updateObjective: (id: string, data: UpdateObjectiveRequest) => Promise<ObjectiveWithRelations>;
  deleteObjective: (id: string) => Promise<void>;
  bulkAssign: (data: BulkAssignRequest) => Promise<BulkAssignResult>;
  copyObjective: (sourceId: string, data: CopyObjectiveRequest) => Promise<ObjectiveWithRelations>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isBulkAssigning: boolean;
  isCopying: boolean;
  error: Error | null;
}

export function useObjectiveMutations(): UseObjectiveMutationsReturn {
  const [isCreating, setIsCreating] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isBulkAssigning, setIsBulkAssigning] = React.useState(false);
  const [isCopying, setIsCopying] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const createObjective = React.useCallback(
    async (data: CreateObjectiveRequest): Promise<ObjectiveWithRelations> => {
      setIsCreating(true);
      setError(null);

      try {
        const response = await fetch("/api/objectives", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error?.message || "Failed to create objective");
        }

        return result.data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        throw error;
      } finally {
        setIsCreating(false);
      }
    },
    []
  );

  const updateObjective = React.useCallback(
    async (id: string, data: UpdateObjectiveRequest): Promise<ObjectiveWithRelations> => {
      setIsUpdating(true);
      setError(null);

      try {
        const response = await fetch(`/api/objectives/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error?.message || "Failed to update objective");
        }

        return result.data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    []
  );

  const deleteObjective = React.useCallback(async (id: string): Promise<void> => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/objectives/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Failed to delete objective");
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      throw error;
    } finally {
      setIsDeleting(false);
    }
  }, []);

  const bulkAssign = React.useCallback(
    async (data: BulkAssignRequest): Promise<BulkAssignResult> => {
      setIsBulkAssigning(true);
      setError(null);

      try {
        const response = await fetch("/api/objectives/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error?.message || "Failed to bulk assign objectives");
        }

        return result.data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        throw error;
      } finally {
        setIsBulkAssigning(false);
      }
    },
    []
  );

  const copyObjective = React.useCallback(
    async (sourceId: string, data: CopyObjectiveRequest): Promise<ObjectiveWithRelations> => {
      setIsCopying(true);
      setError(null);

      try {
        const response = await fetch(`/api/objectives/${sourceId}/copy`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error?.message || "Failed to copy objective");
        }

        return result.data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        throw error;
      } finally {
        setIsCopying(false);
      }
    },
    []
  );

  return {
    createObjective,
    updateObjective,
    deleteObjective,
    bulkAssign,
    copyObjective,
    isCreating,
    isUpdating,
    isDeleting,
    isBulkAssigning,
    isCopying,
    error,
  };
}
