"use client";

/**
 * Cycle Status Badge Component
 *
 * Displays the status of a review cycle with appropriate styling.
 */

import React from "react";
import { Badge } from "@/shared/components/ui/badge";
import { CycleStatus, CYCLE_STATUS_LABELS, CYCLE_STATUS_COLORS } from "../types";

interface CycleStatusBadgeProps {
  status: CycleStatus;
  className?: string;
}

export function CycleStatusBadge({ status, className = "" }: CycleStatusBadgeProps) {
  const label = CYCLE_STATUS_LABELS[status];
  const colorClass = CYCLE_STATUS_COLORS[status];

  return (
    <Badge
      variant="outline"
      className={`${colorClass} border-0 font-medium ${className}`}
    >
      {label}
    </Badge>
  );
}
