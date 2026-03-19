/**
 * Role Badge Component
 *
 * Displays user role with appropriate styling.
 * Uses Professional Corporate color scheme.
 */

"use client";

import { Badge } from "../../../shared/components/ui/badge";
import { UserRole, ROLE_LABELS, ROLE_LABELS_TH } from "../types";
import { cn } from "../../../shared/lib/utils";

interface RoleBadgeProps {
  role: UserRole;
  showThaiLabel?: boolean;
  className?: string;
}

const roleVariants: Record<UserRole, "default" | "secondary" | "destructive" | "outline"> = {
  SUPER_ADMIN: "destructive",
  HR_ADMIN: "default",
  HR_STAFF: "secondary",
  SENIOR_MANAGER: "default",
  LINE_MANAGER: "secondary",
  EMPLOYEE: "outline",
};

const roleColors: Record<UserRole, string> = {
  SUPER_ADMIN: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100",
  HR_ADMIN: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100",
  HR_STAFF: "bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-100",
  SENIOR_MANAGER: "bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-100",
  LINE_MANAGER: "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100",
  EMPLOYEE: "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-50",
};

export function RoleBadge({ role, showThaiLabel = false, className }: RoleBadgeProps) {
  const label = showThaiLabel ? ROLE_LABELS_TH[role] : ROLE_LABELS[role];

  return (
    <Badge
      variant={roleVariants[role]}
      className={cn(
        "font-medium px-2.5 py-0.5 rounded-md border",
        roleColors[role],
        className
      )}
    >
      {label}
    </Badge>
  );
}

/**
 * Get role badge color class for external use
 */
export function getRoleBadgeColor(role: UserRole): string {
  return roleColors[role];
}

/**
 * Role badge for compact display (smaller size)
 */
export function RoleBadgeCompact({ role, className }: { role: UserRole; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
        roleColors[role],
        className
      )}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}
