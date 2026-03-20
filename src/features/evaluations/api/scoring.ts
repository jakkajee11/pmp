/**
 * Evaluation Scoring Calculation
 *
 * Implements weighted scoring for KPI and Core Values evaluations.
 * KPI: 80% weight (configurable)
 * Core Values: 20% weight (configurable)
 */

import { ScoringInput, ScoringResult, MIN_RATING, MAX_RATING } from "../types";

/**
 * Calculate average of an array of ratings
 */
export function calculateAverageRating(ratings: number[]): number | null {
  if (ratings.length === 0) {
    return null;
  }

  const sum = ratings.reduce((acc, rating) => acc + rating, 0);
  return Math.round((sum / ratings.length) * 100) / 100; // Round to 2 decimal places
}

/**
 * Validate that a rating is within acceptable range
 */
export function isValidRating(rating: number): boolean {
  return (
    Number.isInteger(rating) && rating >= MIN_RATING && rating <= MAX_RATING
  );
}

/**
 * Validate all ratings in an array
 */
export function validateRatings(ratings: number[]): {
  valid: boolean;
  invalidRatings: number[];
} {
  const invalidRatings = ratings.filter((r) => !isValidRating(r));
  return {
    valid: invalidRatings.length === 0,
    invalidRatings,
  };
}

/**
 * Calculate weighted score based on KPI and Core Values ratings
 *
 * Formula:
 *   finalScore = (kpiAverage * kpiWeight) + (coreValuesAverage * coreValuesWeight)
 *
 * @param input - Scoring input containing ratings and weights
 * @returns Calculated scores or null values if no ratings available
 */
export function calculateScores(input: ScoringInput): ScoringResult | null {
  const { kpiRatings, coreValueRatings, weightsConfig } = input;

  // Validate weights sum to 1.0 (with small tolerance for floating point)
  const weightSum = weightsConfig.kpi + weightsConfig.coreValues;
  if (Math.abs(weightSum - 1.0) > 0.001) {
    throw new Error(
      `Weights must sum to 1.0, got ${weightSum.toFixed(3)}`
    );
  }

  // Validate all ratings are in range
  const kpiValidation = validateRatings(kpiRatings);
  if (!kpiValidation.valid) {
    throw new Error(
      `Invalid KPI ratings: ${kpiValidation.invalidRatings.join(", ")}`
    );
  }

  const coreValuesValidation = validateRatings(coreValueRatings);
  if (!coreValuesValidation.valid) {
    throw new Error(
      `Invalid Core Values ratings: ${coreValuesValidation.invalidRatings.join(", ")}`
    );
  }

  // Calculate averages
  const kpiScore = calculateAverageRating(kpiRatings);
  const coreValuesScore = calculateAverageRating(coreValueRatings);

  // If no ratings at all, return null
  if (kpiScore === null && coreValuesScore === null) {
    return null;
  }

  // Calculate final weighted score
  // Use 0 for missing components but weight appropriately
  const effectiveKpiScore = kpiScore ?? 0;
  const effectiveCoreValuesScore = coreValuesScore ?? 0;

  // Adjust weights if one component is missing
  let effectiveKpiWeight = weightsConfig.kpi;
  let effectiveCoreValuesWeight = weightsConfig.coreValues;

  if (kpiScore === null && coreValuesScore !== null) {
    // Only core values available
    effectiveKpiWeight = 0;
    effectiveCoreValuesWeight = 1;
  } else if (kpiScore !== null && coreValuesScore === null) {
    // Only KPI available
    effectiveKpiWeight = 1;
    effectiveCoreValuesWeight = 0;
  }

  const finalScore =
    effectiveKpiScore * effectiveKpiWeight +
    effectiveCoreValuesScore * effectiveCoreValuesWeight;

  return {
    kpiScore: kpiScore ?? 0,
    coreValuesScore: coreValuesScore ?? 0,
    finalScore: Math.round(finalScore * 100) / 100, // Round to 2 decimal places
  };
}

/**
 * Get rating label for display
 */
export function getRatingLabel(rating: number): string {
  const labels: Record<number, string> = {
    1: "Below Expectations",
    2: "Needs Improvement",
    3: "Meets Expectations",
    4: "Above Expectations",
    5: "Exceeds Expectations",
  };
  return labels[rating] ?? "Unknown";
}

/**
 * Get score band label for final scores
 */
export function getScoreBand(score: number): {
  band: string;
  color: string;
  description: string;
} {
  if (score >= 4.5) {
    return {
      band: "Exceptional",
      color: "green",
      description: "Consistently exceeds expectations",
    };
  } else if (score >= 3.5) {
    return {
      band: "Strong",
      color: "blue",
      description: "Often exceeds expectations",
    };
  } else if (score >= 2.5) {
    return {
      band: "Solid",
      color: "yellow",
      description: "Meets expectations",
    };
  } else if (score >= 1.5) {
    return {
      band: "Developing",
      color: "orange",
      description: "Needs improvement in some areas",
    };
  } else {
    return {
      band: "Below",
      color: "red",
      description: "Below expectations",
    };
  }
}

/**
 * Calculate completion percentage for a set of evaluations
 */
export function calculateCompletionPercentage(params: {
  total: number;
  completed: number;
}): number {
  if (params.total === 0) {
    return 0;
  }
  return Math.round((params.completed / params.total) * 100);
}
