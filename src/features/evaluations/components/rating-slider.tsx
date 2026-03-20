/**
 * Rating Slider Component
 *
 * Interactive rating selector for evaluations (1-5 scale).
 */

"use client";

import * as React from "react";
import { cn } from "@/shared/utils/cn";
import { RATING_LABELS, MIN_RATING, MAX_RATING } from "../types";

export interface RatingSliderProps {
  /** Current rating value (1-5) */
  value: number | null;
  /** Rating change callback */
  onChange: (rating: number) => void;
  /** Whether the slider is disabled */
  disabled?: boolean;
  /** Rating criteria descriptions for each level */
  criteria?: Record<number, string>;
  /** Additional CSS classes */
  className?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Show rating labels */
  showLabels?: boolean;
}

const sizeStyles = {
  sm: "h-2",
  md: "h-3",
  lg: "h-4",
};

const buttonSizeStyles = {
  sm: "w-6 h-6 text-xs",
  md: "w-8 h-8 text-sm",
  lg: "w-10 h-10 text-base",
};

/**
 * Rating Slider Component
 *
 * Provides an interactive way to select ratings from 1 to 5.
 * Shows visual feedback and optional criteria for each rating level.
 */
export function RatingSlider({
  value,
  onChange,
  disabled = false,
  criteria,
  className,
  size = "md",
  showLabels = true,
}: RatingSliderProps) {
  const [hoveredRating, setHoveredRating] = React.useState<number | null>(null);
  const displayRating = hoveredRating ?? value;

  const getRatingColor = (rating: number): string => {
    switch (rating) {
      case 1:
        return "bg-red-500";
      case 2:
        return "bg-orange-500";
      case 3:
        return "bg-yellow-500";
      case 4:
        return "bg-blue-500";
      case 5:
        return "bg-green-500";
      default:
        return "bg-gray-300";
    }
  };

  const getRatingBorderColor = (rating: number): string => {
    switch (rating) {
      case 1:
        return "border-red-500 ring-red-200";
      case 2:
        return "border-orange-500 ring-orange-200";
      case 3:
        return "border-yellow-500 ring-yellow-200";
      case 4:
        return "border-blue-500 ring-blue-200";
      case 5:
        return "border-green-500 ring-green-200";
      default:
        return "border-gray-300";
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Rating buttons */}
      <div className="flex items-center justify-between gap-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            disabled={disabled}
            onClick={() => onChange(rating)}
            onMouseEnter={() => setHoveredRating(rating)}
            onMouseLeave={() => setHoveredRating(null)}
            className={cn(
              "relative rounded-full font-semibold transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-offset-2",
              buttonSizeStyles[size],
              disabled && "cursor-not-allowed opacity-50",
              value === rating
                ? [
                    getRatingColor(rating),
                    "text-white ring-2 ring-offset-2",
                    getRatingBorderColor(rating),
                  ]
                : [
                    "bg-white border-2",
                    displayRating !== null && rating <= displayRating
                      ? getRatingBorderColor(rating)
                      : "border-gray-200",
                    "hover:border-gray-400 text-gray-700",
                  ]
            )}
            aria-label={`Rating ${rating}: ${RATING_LABELS[rating]}`}
            aria-pressed={value === rating}
          >
            {rating}
          </button>
        ))}
      </div>

      {/* Rating labels */}
      {showLabels && (
        <div className="flex justify-between text-xs text-gray-500">
          <span>Below</span>
          <span>Meets</span>
          <span>Exceeds</span>
        </div>
      )}

      {/* Selected rating info */}
      {displayRating !== null && (
        <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={cn(
                "inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-sm font-semibold",
                getRatingColor(displayRating)
              )}
            >
              {displayRating}
            </span>
            <span className="font-medium text-slate-900">
              {RATING_LABELS[displayRating]}
            </span>
          </div>
          {criteria?.[displayRating] && (
            <p className="text-sm text-slate-600 mt-1">
              {criteria[displayRating]}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Compact Rating Display
 *
 * Shows a compact rating badge for list views.
 */
export function RatingBadge({
  rating,
  size = "md",
  className,
}: {
  rating: number | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  if (rating === null) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full bg-gray-100 text-gray-400",
          size === "sm" && "w-5 h-5 text-xs",
          size === "md" && "w-6 h-6 text-sm",
          size === "lg" && "w-8 h-8 text-base",
          className
        )}
      >
        -
      </span>
    );
  }

  const getColor = (r: number): string => {
    switch (r) {
      case 1:
        return "bg-red-100 text-red-700";
      case 2:
        return "bg-orange-100 text-orange-700";
      case 3:
        return "bg-yellow-100 text-yellow-700";
      case 4:
        return "bg-blue-100 text-blue-700";
      case 5:
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold",
        size === "sm" && "w-5 h-5 text-xs",
        size === "md" && "w-6 h-6 text-sm",
        size === "lg" && "w-8 h-8 text-base",
        getColor(rating),
        className
      )}
      title={RATING_LABELS[rating]}
    >
      {rating}
    </span>
  );
}
