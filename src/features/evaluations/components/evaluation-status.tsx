/**
 * Evaluation Status Component
 *
 * Displays the current status of an evaluation with visual indicators.
 */

"use client";

import * as React from "react";
import { cn } from "@/shared/utils/cn";
import {
  EvaluationStatus as EvalStatus,
  EVALUATION_STATUS_LABELS,
  EVALUATION_STATUS_COLORS,
} from "../types";

export interface EvaluationStatusProps {
  /** Current evaluation status */
  status: EvalStatus | string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Show icon */
  showIcon?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const statusIcons: Record<string, React.ReactNode> = {
  NOT_STARTED: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <circle cx="12" cy="12" r="10" strokeWidth={2} />
    </svg>
  ),
  SELF_IN_PROGRESS: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
  ),
  SELF_SUBMITTED: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  MANAGER_IN_PROGRESS: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  ),
  COMPLETED: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  RETURNED: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
      />
    </svg>
  ),
};

const sizeStyles = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
  lg: "px-3 py-1.5 text-base",
};

/**
 * Evaluation Status Badge Component
 *
 * Shows a styled badge indicating the current evaluation status.
 */
export function EvaluationStatusBadge({
  status,
  size = "md",
  showIcon = true,
  className,
}: EvaluationStatusProps) {
  const normalizedStatus = status.toUpperCase() as EvalStatus;
  const label = EVALUATION_STATUS_LABELS[normalizedStatus] || status;
  const colorClass = EVALUATION_STATUS_COLORS[normalizedStatus] || "bg-gray-100 text-gray-800";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        sizeStyles[size],
        colorClass,
        className
      )}
      role="status"
    >
      {showIcon && statusIcons[normalizedStatus]}
      {label}
    </span>
  );
}

/**
 * Evaluation Status Progress Component
 *
 * Shows a visual progress indicator for the evaluation workflow.
 */
export function EvaluationStatusProgress({
  status,
  className,
}: {
  status: EvalStatus | string;
  className?: string;
}) {
  const normalizedStatus = status.toUpperCase() as EvalStatus;

  const steps = [
    { key: "NOT_STARTED", label: "Not Started" },
    { key: "SELF_IN_PROGRESS", label: "Self Eval" },
    { key: "SELF_SUBMITTED", label: "Submitted" },
    { key: "MANAGER_IN_PROGRESS", label: "Review" },
    { key: "COMPLETED", label: "Complete" },
  ];

  const currentIndex = steps.findIndex((s) => s.key === normalizedStatus);
  const isReturned = normalizedStatus === "RETURNED";

  return (
    <div className={cn("w-full", className)}>
      {/* Progress bar */}
      <div className="relative">
        <div className="h-2 bg-gray-100 rounded-full">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              isReturned ? "bg-red-500" : "bg-blue-500"
            )}
            style={{
              width: `${((currentIndex + 1) / steps.length) * 100}%`,
            }}
          />
        </div>

        {/* Step indicators */}
        <div className="absolute top-0 left-0 right-0 flex justify-between">
          {steps.map((step, index) => {
            const isComplete = index < currentIndex;
            const isCurrent = index === currentIndex;

            return (
              <div
                key={step.key}
                className={cn(
                  "w-4 h-4 -mt-1 rounded-full border-2 flex items-center justify-center text-xs font-medium transition-colors",
                  isComplete && "bg-blue-500 border-blue-500 text-white",
                  isCurrent && !isReturned && "bg-blue-500 border-blue-500 text-white",
                  isCurrent && isReturned && "bg-red-500 border-red-500 text-white",
                  !isComplete && !isCurrent && "bg-white border-gray-300 text-gray-400"
                )}
              >
                {isComplete ? "✓" : index + 1}
              </div>
            );
          })}
        </div>
      </div>

      {/* Labels */}
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        {steps.map((step) => (
          <span key={step.key}>{step.label}</span>
        ))}
      </div>

      {/* Returned indicator */}
      {isReturned && (
        <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span>Evaluation returned for revision</span>
        </div>
      )}
    </div>
  );
}

/**
 * Evaluation Status Summary Component
 *
 * Shows a summary of evaluation statuses for a list.
 */
export function EvaluationStatusSummary({
  statuses,
  className,
}: {
  statuses: Array<{ status: string; count: number }>;
  className?: string;
}) {
  const total = statuses.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {statuses.map(({ status, count }) => (
        <div
          key={status}
          className="flex items-center gap-1.5 text-sm"
        >
          <EvaluationStatusBadge status={status} size="sm" showIcon={false} />
          <span className="font-medium">{count}</span>
          <span className="text-gray-400">
            ({Math.round((count / total) * 100)}%)
          </span>
        </div>
      ))}
    </div>
  );
}
