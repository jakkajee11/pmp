/**
 * Cycles Page Error Boundary
 *
 * Professional Corporate style: Navy blue (#1e3a5f), slate gray accents.
 */

"use client";

import * as React from "react";
import { PageErrorFallback } from "@/shared/components/ui/error-boundary";

export default function CyclesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[Cycles] Error:", error);
  }, [error]);

  return (
    <PageErrorFallback
      error={error}
      onReset={reset}
      title="Review Cycles Error"
      message="Unable to load review cycles. Please try refreshing the page or contact HR support if the problem persists."
    />
  );
}
