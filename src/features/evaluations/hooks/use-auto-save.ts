/**
 * Auto-Save Hook
 *
 * Provides debounced auto-save functionality for evaluation forms.
 * Saves changes after 30 seconds of inactivity.
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  AUTO_SAVE_DEBOUNCE_MS,
  AUTO_SAVE_MIN_INTERVAL_MS,
  AutoSaveData,
} from "../types";

export interface UseAutoSaveOptions<T> {
  /** Unique identifier for the evaluation being edited */
  evaluationId: string;
  /** Current form data */
  data: T;
  /** Function to save data to server */
  onSave: (data: T) => Promise<void>;
  /** Debounce delay in milliseconds (default: 30000) */
  debounceMs?: number;
  /** Minimum interval between saves (default: 5000) */
  minIntervalMs?: number;
  /** Whether auto-save is enabled */
  enabled?: boolean;
}

export interface AutoSaveStatus {
  /** Current auto-save state */
  state: "idle" | "pending" | "saving" | "saved" | "error";
  /** Last save timestamp */
  lastSavedAt: Date | null;
  /** Error message if save failed */
  error: string | null;
  /** Whether there are unsaved changes */
  isDirty: boolean;
  /** Manually trigger save */
  saveNow: () => Promise<void>;
  /** Reset status */
  reset: () => void;
}

/**
 * Hook for auto-saving form data with debouncing
 *
 * @example
 * ```tsx
 * const { state, lastSavedAt, isDirty, saveNow } = useAutoSave({
 *   evaluationId: evaluation.id,
 *   data: formData,
 *   onSave: async (data) => {
 *     await updateEvaluation(evaluation.id, data);
 *   },
 * });
 * ```
 */
export function useAutoSave<T>({
  evaluationId,
  data,
  onSave,
  debounceMs = AUTO_SAVE_DEBOUNCE_MS,
  minIntervalMs = AUTO_SAVE_MIN_INTERVAL_MS,
  enabled = true,
}: UseAutoSaveOptions<T>): AutoSaveStatus {
  const [state, setState] = useState<AutoSaveStatus["state"]>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Refs for managing debounce and save state
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveTimeRef = useRef<number>(0);
  const previousDataRef = useRef<T>(data);
  const isSavingRef = useRef(false);

  // Check if data has changed
  const hasDataChanged = useCallback(() => {
    return JSON.stringify(data) !== JSON.stringify(previousDataRef.current);
  }, [data]);

  // Perform the save operation
  const performSave = useCallback(async () => {
    if (isSavingRef.current || !enabled) {
      return;
    }

    // Check minimum interval
    const now = Date.now();
    if (now - lastSaveTimeRef.current < minIntervalMs) {
      return;
    }

    isSavingRef.current = true;
    setState("saving");
    setError(null);

    try {
      await onSave(data);
      previousDataRef.current = data;
      lastSaveTimeRef.current = now;
      setLastSavedAt(new Date());
      setState("saved");
      setIsDirty(false);

      // Reset to idle after a short delay
      setTimeout(() => {
        setState((s) => (s === "saved" ? "idle" : s));
      }, 2000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save";
      setError(errorMessage);
      setState("error");
    } finally {
      isSavingRef.current = false;
    }
  }, [data, enabled, minIntervalMs, onSave]);

  // Manual save trigger
  const saveNow = useCallback(async () => {
    // Clear any pending debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    await performSave();
  }, [performSave]);

  // Reset status
  const reset = useCallback(() => {
    setState("idle");
    setError(null);
    setIsDirty(false);
    previousDataRef.current = data;
  }, [data]);

  // Set up debounce timer when data changes
  useEffect(() => {
    if (!enabled || !hasDataChanged()) {
      return;
    }

    setIsDirty(true);
    setState("pending");

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      performSave();
    }, debounceMs);

    // Cleanup on unmount or data change
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [data, enabled, debounceMs, hasDataChanged, performSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Update evaluation ID ref when it changes
  useEffect(() => {
    // Reset state when evaluation ID changes
    previousDataRef.current = data;
    setIsDirty(false);
    setState("idle");
    setError(null);
  }, [evaluationId, data]);

  return {
    state,
    lastSavedAt,
    error,
    isDirty,
    saveNow,
    reset,
  };
}

/**
 * Get display text for auto-save status
 */
export function getAutoSaveStatusText(state: AutoSaveStatus["state"]): string {
  switch (state) {
    case "idle":
      return "";
    case "pending":
      return "Changes pending...";
    case "saving":
      return "Saving...";
    case "saved":
      return "All changes saved";
    case "error":
      return "Failed to save";
    default:
      return "";
  }
}

/**
 * Get icon name for auto-save status
 */
export function getAutoSaveStatusIcon(
  state: AutoSaveStatus["state"]
): string | null {
  switch (state) {
    case "saving":
      return "loader";
    case "saved":
      return "check";
    case "error":
      return "alert-circle";
    default:
      return null;
  }
}

/**
 * Format last saved time for display
 */
export function formatLastSaved(date: Date | null): string {
  if (!date) {
    return "";
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);

  if (diffSecs < 60) {
    return "Saved just now";
  } else if (diffSecs < 3600) {
    const mins = Math.floor(diffSecs / 60);
    return `Saved ${mins} minute${mins > 1 ? "s" : ""} ago`;
  } else if (diffSecs < 86400) {
    const hours = Math.floor(diffSecs / 3600);
    return `Saved ${hours} hour${hours > 1 ? "s" : ""} ago`;
  } else {
    return `Saved on ${date.toLocaleDateString()}`;
  }
}
