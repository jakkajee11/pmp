/**
 * Reports Page Loading State
 *
 * Professional Corporate style: Navy blue (#1e3a5f), slate gray accents.
 */

"use client";

import { PageSkeleton, CardSkeleton } from "@/shared/components/ui/loading-states";

export default function ReportsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 bg-slate-200 rounded w-32 animate-pulse" />
          <div className="h-4 bg-slate-200 rounded w-48 mt-1 animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 bg-slate-200 rounded w-28 animate-pulse" />
          <div className="h-10 bg-slate-200 rounded w-32 animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-slate-200 rounded-lg animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardSkeleton hasHeader lines={8} />
        <CardSkeleton hasHeader lines={8} />
      </div>
    </div>
  );
}
