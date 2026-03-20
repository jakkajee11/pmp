/**
 * Evaluations Feature - Public API
 *
 * Exports all public types, components, and hooks for the evaluations feature.
 */

// Types
export * from "./types";

// Components
export { RatingSlider, RatingBadge } from "./components/rating-slider";
export type { RatingSliderProps } from "./components/rating-slider";

export {
  AutoSaveIndicator,
  AutoSaveProgress,
  AutoSaveBadge,
} from "./components/auto-save-indicator";
export type { AutoSaveIndicatorProps } from "./components/auto-save-indicator";

export {
  EvaluationStatusBadge,
  EvaluationStatusProgress,
  EvaluationStatusSummary,
} from "./components/evaluation-status";
export type { EvaluationStatusProps } from "./components/evaluation-status";

export { SelfEvalForm, SelfEvalFormSkeleton } from "./components/self-eval-form";
export type { SelfEvalFormProps } from "./components/self-eval-form";

export {
  ManagerReviewForm,
  ManagerReviewFormSkeleton,
} from "./components/manager-review-form";
export type { ManagerReviewFormProps } from "./components/manager-review-form";

export {
  ScoreDisplay,
  ScoreBar,
  ScoreComparison,
  MiniScoreDisplay,
} from "./components/score-display";
export type {
  ScoreDisplayProps,
  ScoreBarProps,
  ScoreComparisonProps,
  MiniScoreDisplayProps,
} from "./components/score-display";

// Hooks
export { useAutoSave } from "./hooks/use-auto-save";
export type { AutoSaveStatus, UseAutoSaveOptions } from "./hooks/use-auto-save";
export {
  getAutoSaveStatusText,
  getAutoSaveStatusIcon,
  formatLastSaved,
} from "./hooks/use-auto-save";

export {
  useEvaluation,
  useEvaluationList,
  useDashboard,
} from "./hooks/use-evaluation";
export type {
  UseEvaluationOptions,
  UseEvaluationReturn,
} from "./hooks/use-evaluation";

export {
  useScoring,
  useScoreComparison,
  useScoreHistory,
} from "./hooks/use-scoring";
export type {
  EvaluationScore,
  UseScoringOptions,
  UseScoringReturn,
} from "./hooks/use-scoring";

// API utilities
export {
  calculateScores,
  calculateAverageRating,
  isValidRating,
  validateRatings,
  getRatingLabel,
  getScoreBand,
  calculateCompletionPercentage,
} from "./api/scoring";

export {
  validateEvaluationId,
  validateEvaluationListQuery,
  validateUpdateSelfEval,
  validateSubmitSelfEval,
  validateUpdateManagerReview,
  validateReturnEvaluation,
} from "./api/validators";
