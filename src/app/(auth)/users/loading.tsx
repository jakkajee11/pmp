/**
 * Users Page Loading State
 *
 * Professional Corporate style: Navy blue (#1e3a5f), slate gray accents.
 */

"use client";

import { TableSkeleton } from "@/shared/components/ui/loading-states";

export default function UsersLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 bg-slate-200 rounded w-32 animate-pulse" />
          <div className="h-4 bg-slate-200 rounded w-48 mt-1 animate-pulse" />
        </div>
        <div className="h-10 bg-slate-200 rounded w-28 animate-pulse" />
      </div>
      <TableSkeleton rows={8} columns={5} />
    </div>
  );
}
