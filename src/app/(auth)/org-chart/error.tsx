/**
 * Org Chart Page Error Boundary
 *
 * Professional Corporate style: Navy blue (#1e3a5f), slate gray accents.
 */

"use client";

import * as React from "react";
import { PageErrorFallback } from "@/shared/components/ui/error-boundary";

export default function OrgChartError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[Org Chart] Error:", error);
  }, [error]);

  return (
    <PageErrorFallback
      error={error}
      onReset={reset}
      title="Organization Chart Error"
      message="Unable to load the organization chart. Please try refreshing the page or contact HR support if the problem persists."
    />
  );
}
