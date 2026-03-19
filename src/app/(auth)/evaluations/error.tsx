/**
 * Evaluations Page Error Boundary
 *
 * Professional Corporate style: Navy blue (#1e3a5f), slate gray accents.
 */

"use client";

import * as React from "react";
import { EvaluationErrorBoundary } from "@/shared/components/ui/error-boundary";

export default function EvaluationsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[Evaluations] Error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-lg text-center">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
          <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Evaluation Error</h1>
        <p className="text-slate-500 mb-8">
          Unable to load your evaluation. Your progress has been auto-saved. Please try refreshing the page.
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={reset}
            className="px-4 py-2 bg-[#1e3a5f] hover:bg-[#1e3a5f]/90 text-white rounded-lg font-medium transition-colors duration-200 cursor-pointer"
          >
            Refresh Page
          </button>
          <button
            onClick={() => window.location.href = "/"}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-colors duration-200 cursor-pointer"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
