/**
 * useEvaluation Hook
 *
 * Hook for managing evaluation state and API operations.
 */

"use client";

import { useState, useCallback } from "react";
import {
  EvaluationWithRelations,
  EvaluationListItem,
  UpdateSelfEvalRequest,
  SubmitSelfEvalRequest,
  UpdateManagerReviewRequest,
  EvaluationListParams,
  EmployeeDashboard,
  ManagerDashboard,
} from "../types";

export interface UseEvaluationOptions {
  /** Initial evaluation data */
  initialData?: EvaluationWithRelations;
  /** Fetch on mount */
  fetchOnMount?: boolean;
}

export interface UseEvaluationReturn {
  /** Current evaluation data */
  evaluation: EvaluationWithRelations | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: string | null;
  /** Fetch evaluation by ID */
  fetchEvaluation: (id: string) => Promise<void>;
  /** Update self-evaluation */
  updateSelfEval: (data: UpdateSelfEvalRequest) => Promise<void>;
  /** Submit self-evaluation */
  submitSelfEval: (data: SubmitSelfEvalRequest) => Promise<void>;
  /** Update manager review */
  updateManagerReview: (data: UpdateManagerReviewRequest) => Promise<void>;
  /** Submit manager review */
  submitManagerReview: (data: SubmitSelfEvalRequest) => Promise<void>;
  /** Return evaluation to employee */
  returnEvaluation: (reason: string) => Promise<void>;
  /** Reset state */
  reset: () => void;
}

/**
 * Hook for managing a single evaluation
 */
export function useEvaluation(
  options: UseEvaluationOptions = {}
): UseEvaluationReturn {
  const [evaluation, setEvaluation] = useState<EvaluationWithRelations | null>(
    options.initialData ?? null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvaluation = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/evaluations/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message ?? "Failed to fetch evaluation");
      }

      setEvaluation(data.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateSelfEval = useCallback(async (data: UpdateSelfEvalRequest) => {
    if (!evaluation) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/evaluations/${evaluation.id}/self`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message ?? "Failed to update");
      }

      setEvaluation((prev) =>
        prev ? { ...prev, ...result.data } : result.data
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [evaluation]);

  const submitSelfEval = useCallback(
    async (data: SubmitSelfEvalRequest) => {
      if (!evaluation) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/evaluations/${evaluation.id}/self/submit`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error?.message ?? "Failed to submit");
        }

        setEvaluation((prev) =>
          prev ? { ...prev, ...result.data } : result.data
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [evaluation]
  );

  const updateManagerReview = useCallback(
    async (data: UpdateManagerReviewRequest) => {
      if (!evaluation) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/evaluations/${evaluation.id}/manager`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error?.message ?? "Failed to update");
        }

        setEvaluation((prev) =>
          prev ? { ...prev, ...result.data } : result.data
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [evaluation]
  );

  const submitManagerReview = useCallback(
    async (data: SubmitSelfEvalRequest) => {
      if (!evaluation) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/evaluations/${evaluation.id}/manager/submit`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error?.message ?? "Failed to submit");
        }

        setEvaluation((prev) =>
          prev ? { ...prev, ...result.data } : result.data
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [evaluation]
  );

  const returnEvaluation = useCallback(
    async (reason: string) => {
      if (!evaluation) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/evaluations/${evaluation.id}/return`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reason }),
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error?.message ?? "Failed to return");
        }

        setEvaluation((prev) =>
          prev ? { ...prev, ...result.data } : result.data
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [evaluation]
  );

  const reset = useCallback(() => {
    setEvaluation(options.initialData ?? null);
    setError(null);
    setIsLoading(false);
  }, [options.initialData]);

  return {
    evaluation,
    isLoading,
    error,
    fetchEvaluation,
    updateSelfEval,
    submitSelfEval,
    updateManagerReview,
    submitManagerReview,
    returnEvaluation,
    reset,
  };
}

/**
 * Hook for fetching evaluation list
 */
export function useEvaluationList(params: EvaluationListParams = {}) {
  const [evaluations, setEvaluations] = useState<EvaluationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvaluations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const query = new URLSearchParams();
      if (params.cycleId) query.set("cycleId", params.cycleId);
      if (params.employeeId) query.set("employeeId", params.employeeId);
      if (params.status) query.set("status", params.status);
      if (params.type) query.set("type", params.type);

      const response = await fetch(`/api/evaluations?${query.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message ?? "Failed to fetch");
      }

      setEvaluations(data.data.evaluations);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  return {
    evaluations,
    isLoading,
    error,
    fetchEvaluations,
    refresh: fetchEvaluations,
  };
}

/**
 * Hook for fetching dashboard data
 */
export function useDashboard(cycleId?: string) {
  const [dashboard, setDashboard] = useState<
    EmployeeDashboard | ManagerDashboard | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const query = cycleId ? `?cycleId=${cycleId}` : "";
      const response = await fetch(`/api/evaluations/dashboard${query}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message ?? "Failed to fetch dashboard");
      }

      setDashboard(data.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [cycleId]);

  return {
    dashboard,
    isLoading,
    error,
    fetchDashboard,
    refresh: fetchDashboard,
  };
}
