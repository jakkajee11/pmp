/**
 * Dashboard Error Boundary
 *
 * Professional Corporate style: Navy blue (#1e3a5f), slate gray accents.
 */

"use client";

import * as React from "react";
import { PageErrorFallback } from "@/shared/components/ui/error-boundary";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[Dashboard] Error:", error);
  }, [error]);

  return (
    <PageErrorFallback
      error={error}
      onReset={reset}
      title="Dashboard Error"
      message="Unable to load your dashboard. Please try refreshing the page or contact support if the problem persists."
    />
  );
}
