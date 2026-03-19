/**
 * Auto-Save Indicator Component
 *
 * Displays the current auto-save status with visual feedback.
 */

"use client";

import * as React from "react";
import { cn } from "@/shared/utils/cn";
import {
  getAutoSaveStatusText,
  formatLastSaved,
  AutoSaveStatus,
} from "../hooks/use-auto-save";

export interface AutoSaveIndicatorProps {
  /** Current auto-save status */
  status: Pick<AutoSaveStatus, "state" | "lastSavedAt" | "error">;
  /** Show last saved time */
  showLastSaved?: boolean;
  /** Compact mode */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const stateIcons: Record<string, React.ReactNode> = {
  idle: null,
  pending: (
    <svg
      className="w-4 h-4 text-gray-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  saving: (
    <svg
      className="w-4 h-4 animate-spin text-blue-500"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  ),
  saved: (
    <svg
      className="w-4 h-4 text-green-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  ),
  error: (
    <svg
      className="w-4 h-4 text-red-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
};

const stateColors: Record<string, string> = {
  idle: "text-gray-400",
  pending: "text-gray-500",
  saving: "text-blue-600",
  saved: "text-green-600",
  error: "text-red-600",
};

/**
 * Auto-Save Indicator Component
 *
 * Shows the current state of auto-save with visual feedback.
 */
export function AutoSaveIndicator({
  status,
  showLastSaved = true,
  compact = false,
  className,
}: AutoSaveIndicatorProps) {
  const { state, lastSavedAt, error } = status;
  const statusText = getAutoSaveStatusText(state);
  const lastSavedText = formatLastSaved(lastSavedAt);

  // Don't show anything for idle state in compact mode
  if (compact && state === "idle") {
    return null;
  }

  return (
    <div
      data-testid="auto-save-indicator"
      className={cn(
        "flex items-center gap-2 text-sm transition-all duration-200",
        stateColors[state],
        className
      )}
      role="status"
      aria-live="polite"
    >
      {/* Icon */}
      {stateIcons[state]}

      {/* Status text */}
      {!compact && (
        <span className="font-medium">
          {state === "error" ? error : statusText}
        </span>
      )}

      {/* Last saved time */}
      {showLastSaved && state === "saved" && lastSavedText && (
        <span className="text-gray-400 text-xs">
          {compact ? "✓" : `• ${lastSavedText}`}
        </span>
      )}

      {/* Compact mode - just show text */}
      {compact && state !== "idle" && (
        <span className="text-xs">
          {state === "saving" && "Saving..."}
          {state === "saved" && "Saved"}
          {state === "error" && "Error"}
          {state === "pending" && "Unsaved"}
        </span>
      )}
    </div>
  );
}

/**
 * Auto-Save Progress Bar
 *
 * Shows a progress bar indicating time until next auto-save.
 */
export function AutoSaveProgress({
  progress,
  className,
}: {
  /** Progress percentage (0-100) */
  progress: number;
  className?: string;
}) {
  return (
    <div className={cn("w-full h-1 bg-gray-100 rounded-full overflow-hidden", className)}>
      <div
        className="h-full bg-blue-500 transition-all duration-1000 ease-linear"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  );
}

/**
 * Auto-Save Status Badge
 *
 * Compact badge showing save status for header/toolbar.
 */
export function AutoSaveBadge({
  status,
  className,
}: {
  status: Pick<AutoSaveStatus, "state" | "isDirty">;
  className?: string;
}) {
  const { state, isDirty } = status;

  const getBadgeStyle = (): string => {
    if (isDirty || state === "pending") {
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
    if (state === "saving") {
      return "bg-blue-100 text-blue-800 border-blue-200";
    }
    if (state === "saved") {
      return "bg-green-100 text-green-800 border-green-200";
    }
    if (state === "error") {
      return "bg-red-100 text-red-800 border-red-200";
    }
    return "bg-gray-100 text-gray-600 border-gray-200";
  };

  const getBadgeText = (): string => {
    if (isDirty || state === "pending") return "Unsaved";
    if (state === "saving") return "Saving...";
    if (state === "saved") return "Saved";
    if (state === "error") return "Error";
    return "";
  };

  const text = getBadgeText();
  if (!text) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border",
        getBadgeStyle(),
        className
      )}
    >
      {stateIcons[state] && (
        <span className="w-3 h-3">{stateIcons[state]}</span>
      )}
      {text}
    </span>
  );
}
