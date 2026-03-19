/**
 * Self-Evaluation Form Component
 *
 * Main form for employees to complete their self-evaluations.
 * Features auto-save, rating slider, and status indicators.
 */

"use client";

import * as React from "react";
import { cn } from "@/shared/utils/cn";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { RatingSlider } from "./rating-slider";
import { AutoSaveIndicator, AutoSaveBadge } from "./auto-save-indicator";
import { EvaluationStatusProgress, EvaluationStatusBadge } from "./evaluation-status";
import { useEvaluation } from "../hooks/use-evaluation";
import { useAutoSave } from "../hooks/use-auto-save";
import {
  EvaluationWithRelations,
  UpdateSelfEvalRequest,
} from "../types";
import { FileUpload } from "@/features/documents/components/file-upload";
import { FileList } from "@/features/documents/components/file-list";
import { useFileUpload } from "@/features/documents/hooks/use-file-upload";

export interface SelfEvalFormProps {
  /** Evaluation data */
  evaluation: EvaluationWithRelations;
  /** Save callback */
  onSave: (data: UpdateSelfEvalRequest) => Promise<void>;
  /** Submit callback */
  onSubmit: () => Promise<void>;
  /** Additional CSS classes */
  className?: string;
  /** Whether the form is read-only */
  readOnly?: boolean;
}

/**
 * Self-Eval Documents Component
 *
 * Manages document upload and display within the self-evaluation form.
 */
function SelfEvalDocuments({
  objectiveId,
  readOnly,
}: {
  objectiveId: string;
  readOnly: boolean;
}) {
  const {
    documents,
    isUploading,
    error,
    deleteDocument,
    clearError,
    refreshDocuments,
  } = useFileUpload({
    objectiveId,
    onUploadComplete: (doc) => {
      console.log("Document uploaded:", doc.fileName);
    },
    onUploadError: (fileName, err) => {
      console.error("Upload error:", fileName, err);
    },
  });

  // Fetch existing documents on mount
  React.useEffect(() => {
    refreshDocuments();
  }, [refreshDocuments]);

  return (
    <div className="space-y-4">
      {/* Existing Documents */}
      {documents.length > 0 && (
        <FileList
          documents={documents}
          onDelete={readOnly ? undefined : deleteDocument}
          readOnly={readOnly}
        />
      )}

      {/* Upload Area */}
      {!readOnly && (
        <FileUpload
          objectiveId={objectiveId}
          disabled={isUploading}
          maxFiles={5}
        />
      )}

      {/* Error Display */}
      {error && (
        <div className="flex items-center justify-between p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
          <span>{error}</span>
          <button
            type="button"
            onClick={clearError}
            className="text-xs underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Self-Evaluation Form Component
 *
 * Provides a complete form for employees to:
 * - View objective/core value details
 * - Select a rating (1-5)
 * - Add comments
 * - Auto-save progress
 * - Submit when ready
 */
export function SelfEvalForm({
  evaluation,
  onSave,
  onSubmit,
  className,
  readOnly = false,
}: SelfEvalFormProps) {
  const [rating, setRating] = React.useState<number | null>(evaluation.selfRating);
  const [comments, setComments] = React.useState(evaluation.selfComments ?? "");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);

  const isEditable =
    !readOnly &&
    ["NOT_STARTED", "SELF_IN_PROGRESS", "RETURNED"].includes(evaluation.status);

  const canSubmit =
    rating !== null &&
    ["SELF_IN_PROGRESS", "RETURNED"].includes(evaluation.status);

  // Get rating criteria from objective or core value
  const ratingCriteria = evaluation.objective?.ratingCriteria ??
    evaluation.coreValue?.ratingCriteria;

  // Form data for auto-save
  const formData = React.useMemo(
    () => ({ selfRating: rating, selfComments: comments }),
    [rating, comments]
  );

  // Auto-save hook
  const autoSaveStatus = useAutoSave({
    evaluationId: evaluation.id,
    data: formData,
    onSave: async (data) => {
      if (data.selfRating === null) return;
      await onSave({
        selfRating: data.selfRating,
        selfComments: data.selfComments ?? "",
        version: evaluation.version,
      });
    },
    enabled: isEditable,
  });

  // Handle rating change
  const handleRatingChange = (newRating: number) => {
    if (!isEditable) return;
    setRating(newRating);
  };

  // Handle comments change
  const handleCommentsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!isEditable) return;
    setComments(e.target.value);
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return;
    setShowConfirmDialog(true);
  };

  // Confirm submit
  const confirmSubmit = async () => {
    setIsSubmitting(true);
    setShowConfirmDialog(false);
    try {
      // First save any pending changes
      await autoSaveStatus.saveNow();
      // Then submit
      await onSubmit();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {evaluation.objective?.title ?? evaluation.coreValue?.name}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {evaluation.evaluationType === "KPI" ? "KPI Objective" : "Core Value"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AutoSaveBadge status={autoSaveStatus} />
          <EvaluationStatusBadge status={evaluation.status} />
        </div>
      </div>

      {/* Progress */}
      <EvaluationStatusProgress status={evaluation.status} />

      {/* Description */}
      <div className="bg-slate-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-slate-700 mb-2">Description</h3>
        <p className="text-sm text-slate-600">
          {evaluation.objective?.description ?? evaluation.coreValue?.description}
        </p>
      </div>

      {/* Rating Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-slate-700">
          Your Self-Rating
        </h3>
        <RatingSlider
          value={rating}
          onChange={handleRatingChange}
          disabled={!isEditable}
          criteria={ratingCriteria}
          size="lg"
        />
      </div>

      {/* Comments Section */}
      <div className="space-y-2">
        <label htmlFor="comments" className="text-sm font-medium text-slate-700">
          Comments
        </label>
        <Textarea
          id="comments"
          value={comments}
          onChange={handleCommentsChange}
          disabled={!isEditable}
          placeholder="Describe your achievements, challenges, and areas for improvement..."
          rows={5}
          className="resize-none"
          maxLength={5000}
        />
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{comments.length} / 5000 characters</span>
          <AutoSaveIndicator status={autoSaveStatus} compact />
        </div>
      </div>

      {/* Supporting Documents Section */}
      {evaluation.objective && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-slate-700">
            Supporting Documents
          </h3>
          <p className="text-xs text-slate-500">
            Upload supporting documents for this objective (PDF, Word, Excel, or images)
          </p>
          <SelfEvalDocuments
            objectiveId={evaluation.objective.id}
            readOnly={!isEditable}
          />
        </div>
      )}

      {/* Submit Section */}
      {isEditable && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <p className="text-sm text-slate-500">
            {rating === null
              ? "Select a rating to enable submission"
              : "Make sure to save before submitting"}
          </p>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="min-w-[140px]"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Submitting...
              </>
            ) : (
              "Submit Evaluation"
            )}
          </Button>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Confirm Submission
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Are you sure you want to submit your self-evaluation? After
              submission, you won&apos;t be able to make changes until your manager
              completes their review.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={confirmSubmit}>Confirm</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Self-Evaluation Form Skeleton
 *
 * Loading state for the form.
 */
export function SelfEvalFormSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-slate-200 rounded w-1/2" />
      <div className="h-4 bg-slate-200 rounded w-1/4" />
      <div className="h-2 bg-slate-100 rounded-full w-full" />
      <div className="h-20 bg-slate-200 rounded" />
      <div className="space-y-4">
        <div className="h-4 bg-slate-200 rounded w-1/4" />
        <div className="flex gap-4 justify-between">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-10 h-10 bg-slate-200 rounded-full" />
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-slate-200 rounded w-1/4" />
        <div className="h-32 bg-slate-200 rounded" />
      </div>
    </div>
  );
}
