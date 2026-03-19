/**
 * useScoring Hook
 *
 * Hook for calculating and displaying evaluation scores.
 */

"use client";

import { useState, useCallback, useMemo } from "react";
import {
  calculateScores,
  getRatingLabel,
  getScoreBand,
  calculateAverageRating,
  calculateCompletionPercentage,
} from "../api/scoring";
import {
  ScoringInput,
  ScoringResult,
  DEFAULT_KPI_WEIGHT,
  DEFAULT_CORE_VALUES_WEIGHT,
} from "../types";

export interface EvaluationScore {
  objectiveId?: string;
  coreValueId?: string;
  title: string;
  selfRating: number | null;
  managerRating: number | null;
}

export interface UseScoringOptions {
  /** KPI evaluations */
  kpiEvaluations?: EvaluationScore[];
  /** Core values evaluations */
  coreValueEvaluations?: EvaluationScore[];
  /** Custom weights config */
  weightsConfig?: {
    kpi: number;
    coreValues: number;
  };
}

export interface UseScoringReturn {
  /** Calculated scores */
  scores: ScoringResult | null;
  /** KPI average self-rating */
  kpiSelfAverage: number | null;
  /** KPI average manager rating */
  kpiManagerAverage: number | null;
  /** Core values average self-rating */
  coreValuesSelfAverage: number | null;
  /** Core values average manager rating */
  coreValuesManagerAverage: number | null;
  /** Score band info */
  scoreBand: {
    band: string;
    color: string;
    description: string;
  } | null;
  /** Calculate scores with custom data */
  calculate: (input: ScoringInput) => ScoringResult | null;
  /** Get label for a rating */
  getLabel: (rating: number) => string;
  /** Get completion percentage */
  getCompletion: (total: number, completed: number) => number;
  /** Rating distribution */
  ratingDistribution: {
    kpi: Record<number, number>;
    coreValues: Record<number, number>;
  };
}

/**
 * Hook for calculating evaluation scores
 */
export function useScoring(options: UseScoringOptions = {}): UseScoringReturn {
  const {
    kpiEvaluations = [],
    coreValueEvaluations = [],
    weightsConfig = { kpi: DEFAULT_KPI_WEIGHT, coreValues: DEFAULT_CORE_VALUES_WEIGHT },
  } = options;

  // Calculate manager rating averages
  const kpiManagerAverage = useMemo(() => {
    const ratings = kpiEvaluations
      .map((e) => e.managerRating)
      .filter((r): r is number => r !== null);
    return calculateAverageRating(ratings);
  }, [kpiEvaluations]);

  const coreValuesManagerAverage = useMemo(() => {
    const ratings = coreValueEvaluations
      .map((e) => e.managerRating)
      .filter((r): r is number => r !== null);
    return calculateAverageRating(ratings);
  }, [coreValueEvaluations]);

  // Calculate self rating averages
  const kpiSelfAverage = useMemo(() => {
    const ratings = kpiEvaluations
      .map((e) => e.selfRating)
      .filter((r): r is number => r !== null);
    return calculateAverageRating(ratings);
  }, [kpiEvaluations]);

  const coreValuesSelfAverage = useMemo(() => {
    const ratings = coreValueEvaluations
      .map((e) => e.selfRating)
      .filter((r): r is number => r !== null);
    return calculateAverageRating(ratings);
  }, [coreValueEvaluations]);

  // Calculate final scores
  const scores = useMemo(() => {
    const kpiRatings = kpiEvaluations
      .map((e) => e.managerRating)
      .filter((r): r is number => r !== null);

    const coreValueRatings = coreValueEvaluations
      .map((e) => e.managerRating)
      .filter((r): r is number => r !== null);

    if (kpiRatings.length === 0 && coreValueRatings.length === 0) {
      return null;
    }

    const input: ScoringInput = {
      kpiRatings,
      coreValueRatings,
      weightsConfig,
    };

    return calculateScores(input);
  }, [kpiEvaluations, coreValueEvaluations, weightsConfig]);

  // Get score band for final score
  const scoreBand = useMemo(() => {
    if (scores?.finalScore === undefined || scores === null) {
      return null;
    }
    return getScoreBand(scores.finalScore);
  }, [scores]);

  // Calculate rating distribution
  const ratingDistribution = useMemo(() => {
    const kpi: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const coreValues: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    kpiEvaluations.forEach((e) => {
      if (e.managerRating !== null) {
        kpi[e.managerRating]++;
      }
    });

    coreValueEvaluations.forEach((e) => {
      if (e.managerRating !== null) {
        coreValues[e.managerRating]++;
      }
    });

    return { kpi, coreValues };
  }, [kpiEvaluations, coreValueEvaluations]);

  const calculate = useCallback((input: ScoringInput) => {
    return calculateScores(input);
  }, []);

  const getLabel = useCallback((rating: number) => {
    return getRatingLabel(rating);
  }, []);

  const getCompletion = useCallback((total: number, completed: number) => {
    return calculateCompletionPercentage({ total, completed });
  }, []);

  return {
    scores,
    kpiSelfAverage,
    kpiManagerAverage,
    coreValuesSelfAverage,
    coreValuesManagerAverage,
    scoreBand,
    calculate,
    getLabel,
    getCompletion,
    ratingDistribution,
  };
}

/**
 * Hook for score comparison between self and manager ratings
 */
export function useScoreComparison(options: UseScoringOptions) {
  const { kpiEvaluations = [], coreValueEvaluations = [] } = options;

  const comparison = useMemo(() => {
    const results: Array<{
      title: string;
      selfRating: number;
      managerRating: number;
      difference: number;
      category: "kpi" | "coreValue";
    }> = [];

    kpiEvaluations.forEach((e) => {
      if (e.selfRating !== null && e.managerRating !== null) {
        results.push({
          title: e.title,
          selfRating: e.selfRating,
          managerRating: e.managerRating,
          difference: e.managerRating - e.selfRating,
          category: "kpi",
        });
      }
    });

    coreValueEvaluations.forEach((e) => {
      if (e.selfRating !== null && e.managerRating !== null) {
        results.push({
          title: e.title,
          selfRating: e.selfRating,
          managerRating: e.managerRating,
          difference: e.managerRating - e.selfRating,
          category: "coreValue",
        });
      }
    });

    return results;
  }, [kpiEvaluations, coreValueEvaluations]);

  const stats = useMemo(() => {
    const total = comparison.length;
    const agreed = comparison.filter((c) => c.difference === 0).length;
    const managerHigher = comparison.filter((c) => c.difference > 0).length;
    const selfHigher = comparison.filter((c) => c.difference < 0).length;

    const averageDifference =
      total > 0
        ? comparison.reduce((sum, c) => sum + c.difference, 0) / total
        : 0;

    return {
      total,
      agreed,
      managerHigher,
      selfHigher,
      agreementRate: total > 0 ? Math.round((agreed / total) * 100) : 0,
      averageDifference: Math.round(averageDifference * 100) / 100,
    };
  }, [comparison]);

  return {
    comparison,
    stats,
  };
}

/**
 * Hook for score history tracking
 */
export function useScoreHistory() {
  const [history, setHistory] = useState<
    Array<{
      timestamp: Date;
      scores: ScoringResult;
      cycleId: string;
    }>
  >([]);

  const addEntry = useCallback(
    (scores: ScoringResult, cycleId: string) => {
      setHistory((prev) => [
        ...prev,
        { timestamp: new Date(), scores, cycleId },
      ]);
    },
    []
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const getEntriesByCycle = useCallback(
    (cycleId: string) => {
      return history.filter((h) => h.cycleId === cycleId);
    },
    [history]
  );

  return {
    history,
    addEntry,
    clearHistory,
    getEntriesByCycle,
  };
}
