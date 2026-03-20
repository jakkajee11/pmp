/**
 * Audit Logs Page Error Boundary
 *
 * Professional Corporate style: Navy blue (#1e3a5f), slate gray accents.
 */

"use client";

import * as React from "react";
import { PageErrorFallback } from "@/shared/components/ui/error-boundary";

export default function AuditLogsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[Audit Logs] Error:", error);
  }, [error]);

  return (
    <PageErrorFallback
      error={error}
      onReset={reset}
      title="Audit Logs Error"
      message="Unable to load audit logs. Please try refreshing the page or contact system administrator if the problem persists."
    />
  );
}
