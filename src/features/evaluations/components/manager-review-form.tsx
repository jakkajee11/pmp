/**
 * ManagerReviewForm Component
 *
 * Form for managers to review and rate employee self-evaluations.
 */

"use client";

import * as React from "react";
import { cn } from "@/shared/utils/cn";
import { Button } from "@/shared/components/ui/button";
import {
  EvaluationWithRelations,
  EvaluationStatus,
  RATING_LABELS,
} from "../types";
import { RatingSlider, RatingBadge } from "./rating-slider";
import { AutoSaveIndicator } from "./auto-save-indicator";
import { EvaluationStatusBadge } from "./evaluation-status";
import { useAutoSave } from "../hooks/use-auto-save";
import {
  CoreValueRating,
  type CoreValueRating as CoreValueRatingType,
} from "@/features/core-values";
import { useCoreValues } from "@/features/core-values";

export interface ManagerReviewFormProps {
  evaluation: EvaluationWithRelations;
  onSubmit: (data: {
    managerRating: number;
    managerFeedback: string;
    coreValueRatings?: { coreValueId: string; rating: number; comments?: string }[];
  }) => Promise<void>;
  onReturn?: (reason: string) => Promise<void>;
  onAutoSave?: (data: {
    managerRating: number;
    managerFeedback: string;
    coreValueRatings?: { coreValueId: string; rating: number; comments?: string }[];
  }) => Promise<void>;
  isSubmitting?: boolean;
  className?: string;
}

export function ManagerReviewForm({
  evaluation,
  onSubmit,
  onReturn,
  onAutoSave,
  isSubmitting = false,
  className,
}: ManagerReviewFormProps) {
  const [managerRating, setManagerRating] = React.useState(evaluation.managerRating ?? 3);
  const [managerFeedback, setManagerFeedback] = React.useState(evaluation.managerFeedback ?? "");
  const [showReturnDialog, setShowReturnDialog] = React.useState(false);
  const [returnReason, setReturnReason] = React.useState("");
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);

  // Core Values state
  const { coreValues, isLoading: isLoadingCoreValues } = useCoreValues({ autoFetch: true });
  const [coreValueRatings, setCoreValueRatings] = React.useState<
    Record<string, { rating: number; comments: string }>
  >({});

  // Auto-save setup
  const autoSave = useAutoSave({
    evaluationId: evaluation.id,
    data: { managerRating, managerFeedback, coreValueRatings },
    onSave: async (data) => {
      if (onAutoSave) {
        const coreValueRatingsArray = Object.entries(data.coreValueRatings || {}).map(
          ([coreValueId, ratingData]) => ({
            coreValueId,
            rating: ratingData.rating,
            comments: ratingData.comments || undefined,
          })
        );
        await onAutoSave({
          managerRating: data.managerRating,
          managerFeedback: data.managerFeedback,
          coreValueRatings: coreValueRatingsArray,
        });
      }
    },
    debounceMs: 30000,
    enabled: evaluation.status === "SELF_SUBMITTED" || evaluation.status === "MANAGER_IN_PROGRESS",
  });

  // Sync with evaluation changes
  React.useEffect(() => {
    if (evaluation.managerRating !== null && evaluation.managerRating !== managerRating) {
      setManagerRating(evaluation.managerRating);
    }
    if (evaluation.managerFeedback !== null && evaluation.managerFeedback !== managerFeedback) {
      setManagerFeedback(evaluation.managerFeedback);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evaluation.managerRating, evaluation.managerFeedback]);

  const handleSubmit = async () => {
    const coreValueRatingsArray = Object.entries(coreValueRatings).map(
      ([coreValueId, data]) => ({
        coreValueId,
        rating: data.rating,
        comments: data.comments || undefined,
      })
    );
    await onSubmit({
      managerRating,
      managerFeedback,
      coreValueRatings: coreValueRatingsArray,
    });
    setShowConfirmDialog(false);
  };

  const handleReturn = async () => {
    if (onReturn && returnReason.trim()) {
      await onReturn(returnReason.trim());
      setShowReturnDialog(false);
      setReturnReason("");
    }
  };

  const canEdit = evaluation.status === "SELF_SUBMITTED" || evaluation.status === "MANAGER_IN_PROGRESS";
  const canSubmit = canEdit && managerRating > 0;
  const canReturn = evaluation.status === "SELF_SUBMITTED" || evaluation.status === "MANAGER_IN_PROGRESS";

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Manager Review</h2>
          <p className="text-sm text-slate-500">
            Review and rate the employee&apos;s self-evaluation
          </p>
        </div>
        <div className="flex items-center gap-3">
          <EvaluationStatusBadge status={evaluation.status} />
          <AutoSaveIndicator
            state={autoSave.state}
            lastSavedAt={autoSave.lastSavedAt}
            error={autoSave.error}
          />
        </div>
      </div>

      {/* Self-Evaluation Summary */}
      <div className="bg-slate-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-slate-700 mb-3">Employee Self-Evaluation</h3>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <span className="text-xs text-slate-500">Self Rating</span>
            <div className="mt-1">
              <RatingBadge rating={evaluation.selfRating} />
            </div>
          </div>
          <div className="flex-1">
            <span className="text-xs text-slate-500">Comments</span>
            <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">
              {evaluation.selfComments || "No comments provided"}
            </p>
          </div>
        </div>
      </div>

      {/* Rating Criteria */}
      {evaluation.objective && (
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-slate-700 mb-3">Rating Criteria</h3>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-600">
                  {rating}
                </span>
                <span className="text-sm text-slate-600">
                  {evaluation.objective?.ratingCriteria?.[rating as keyof typeof evaluation.objective.ratingCriteria] || RATING_LABELS[rating]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manager Rating */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          Your Rating
        </label>
        <RatingSlider
          value={managerRating}
          onChange={canEdit ? setManagerRating : undefined}
          disabled={!canEdit}
          showLabels
        />
        <p className="text-xs text-slate-500">
          {RATING_LABELS[managerRating]}
        </p>
      </div>

      {/* Core Values Assessment */}
      {coreValues.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-700">
              Core Values Assessment
            </h3>
            <span className="text-xs text-slate-500">
              Weight: 20% of final score
            </span>
          </div>
          {isLoadingCoreValues ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-slate-200 rounded" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {coreValues
                .filter((cv) => cv.isActive)
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map((coreValue) => (
                  <CoreValueRating
                    key={coreValue.id}
                    coreValue={{
                      coreValueId: coreValue.id,
                      coreValueName: coreValue.name,
                      rating: coreValueRatings[coreValue.id]?.rating ?? null,
                      rating1Desc: coreValue.rating1Desc,
                      rating2Desc: coreValue.rating2Desc,
                      rating3Desc: coreValue.rating3Desc,
                      rating4Desc: coreValue.rating4Desc,
                      rating5Desc: coreValue.rating5Desc,
                      comments: coreValueRatings[coreValue.id]?.comments ?? null,
                    }}
                    onRatingChange={(id, rating) =>
                      setCoreValueRatings((prev) => ({
                        ...prev,
                        [id]: { ...prev[id], rating, comments: prev[id]?.comments ?? "" },
                      }))
                    }
                    onCommentsChange={(id, comments) =>
                      setCoreValueRatings((prev) => ({
                        ...prev,
                        [id]: { ...prev[id], comments },
                      }))
                    }
                    readOnly={!canEdit}
                    showRatingDescriptions={false}
                  />
                ))}
            </div>
          )}
        </div>
      )}

      {/* Manager Feedback */}
      <div className="space-y-2">
        <label htmlFor="managerFeedback" className="block text-sm font-medium text-slate-700">
          Feedback
        </label>
        <textarea
          id="managerFeedback"
          value={managerFeedback}
          onChange={(e) => setManagerFeedback(e.target.value)}
          disabled={!canEdit}
          rows={4}
          className={cn(
            "w-full rounded-md border border-slate-300 px-3 py-2 text-sm",
            "placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500",
            "disabled:bg-slate-50 disabled:text-slate-500"
          )}
          placeholder="Provide detailed feedback for the employee..."
        />
        <p className="text-xs text-slate-500">
          {managerFeedback.length} / 5000 characters
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <div>
          {canReturn && onReturn && (
            <Button
              variant="outline"
              onClick={() => setShowReturnDialog(true)}
              disabled={isSubmitting}
            >
              Return to Employee
            </Button>
          )}
        </div>
        <Button
          onClick={() => setShowConfirmDialog(true)}
          disabled={!canSubmit || isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit Review"}
        </Button>
      </div>

      {/* Return Dialog */}
      {showReturnDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Return to Employee
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Please provide a reason for returning this evaluation. The employee
              will be able to edit and resubmit their self-evaluation.
            </p>
            <textarea
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm mb-4"
              placeholder="Enter reason for return..."
            />
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowReturnDialog(false);
                  setReturnReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleReturn}
                disabled={!returnReason.trim() || isSubmitting}
                variant="destructive"
              >
                Return
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Confirm Submission
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Are you sure you want to submit your review? After submission, the
              evaluation will be marked as completed and the final score will be
              calculated.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ManagerReviewFormSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-6 bg-slate-200 rounded w-40" />
          <div className="h-4 bg-slate-200 rounded w-60 mt-1" />
        </div>
        <div className="h-6 bg-slate-200 rounded w-24" />
      </div>
      <div className="h-32 bg-slate-200 rounded" />
      <div className="h-24 bg-slate-200 rounded" />
      <div className="h-24 bg-slate-200 rounded" />
      <div className="flex justify-end gap-3 pt-4">
        <div className="h-10 bg-slate-200 rounded w-32" />
        <div className="h-10 bg-slate-200 rounded w-28" />
      </div>
    </div>
  );
}
