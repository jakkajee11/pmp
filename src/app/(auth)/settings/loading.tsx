/**
 * Settings Page Loading State
 *
 * Professional Corporate style: Navy blue (#1e3a5f), slate gray accents.
 */

"use client";

import { FormSkeleton, CardSkeleton } from "@/shared/components/ui/loading-states";

export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 bg-slate-200 rounded w-28 animate-pulse" />
          <div className="h-4 bg-slate-200 rounded w-48 mt-1 animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <CardSkeleton hasHeader lines={3} />
          <CardSkeleton hasHeader lines={4} />
        </div>
        <CardSkeleton hasHeader lines={5} />
      </div>
    </div>
  );
}
