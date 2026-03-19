/**
 * Org Chart Page Loading State
 *
 * Professional Corporate style: Navy blue (#1e3a5f), slate gray accents.
 */

"use client";

import { PageSkeleton } from "@/shared/components/ui/loading-states";

export default function OrgChartLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 bg-slate-200 rounded w-40 animate-pulse" />
          <div className="h-4 bg-slate-200 rounded w-56 mt-1 animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 bg-slate-200 rounded w-24 animate-pulse" />
          <div className="h-10 bg-slate-200 rounded w-28 animate-pulse" />
        </div>
      </div>
      <div className="h-[600px] bg-slate-100 rounded-lg animate-pulse" />
    </div>
  );
}
