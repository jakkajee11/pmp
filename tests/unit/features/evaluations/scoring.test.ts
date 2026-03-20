/**
 * Unit Tests for Evaluation Scoring Calculation
 *
 * Tests the weighted scoring algorithm for KPI and Core Values evaluations.
 */

import {
  calculateScores,
  calculateAverageRating,
  isValidRating,
  validateRatings,
  getRatingLabel,
  getScoreBand,
  calculateCompletionPercentage,
} from "../../../../src/features/evaluations/api/scoring";
import { ScoringInput } from "../../../../src/features/evaluations/types";

describe("Evaluation Scoring", () => {
  describe("isValidRating", () => {
    it("should return true for valid ratings (1-5)", () => {
      expect(isValidRating(1)).toBe(true);
      expect(isValidRating(2)).toBe(true);
      expect(isValidRating(3)).toBe(true);
      expect(isValidRating(4)).toBe(true);
      expect(isValidRating(5)).toBe(true);
    });

    it("should return false for invalid ratings", () => {
      expect(isValidRating(0)).toBe(false);
      expect(isValidRating(6)).toBe(false);
      expect(isValidRating(-1)).toBe(false);
      expect(isValidRating(3.5)).toBe(false); // Non-integer
      expect(isValidRating(NaN)).toBe(false);
    });
  });

  describe("validateRatings", () => {
    it("should return valid for all correct ratings", () => {
      const result = validateRatings([1, 2, 3, 4, 5]);
      expect(result.valid).toBe(true);
      expect(result.invalidRatings).toHaveLength(0);
    });

    it("should identify invalid ratings", () => {
      const result = validateRatings([1, 6, 3, 0, 5]);
      expect(result.valid).toBe(false);
      expect(result.invalidRatings).toContain(6);
      expect(result.invalidRatings).toContain(0);
    });

    it("should handle empty array", () => {
      const result = validateRatings([]);
      expect(result.valid).toBe(true);
      expect(result.invalidRatings).toHaveLength(0);
    });
  });

  describe("calculateAverageRating", () => {
    it("should calculate correct average", () => {
      expect(calculateAverageRating([3, 4, 5])).toBe(4);
      expect(calculateAverageRating([1, 2, 3, 4, 5])).toBe(3);
      expect(calculateAverageRating([5, 5, 5])).toBe(5);
    });

    it("should round to 2 decimal places", () => {
      // 10/3 = 3.333...
      const result = calculateAverageRating([3, 3, 4]);
      expect(result).toBe(3.33);
    });

    it("should return null for empty array", () => {
      expect(calculateAverageRating([])).toBeNull();
    });
  });

  describe("calculateScores", () => {
    const defaultWeights = { kpi: 0.8, coreValues: 0.2 };

    it("should calculate weighted score with default weights", () => {
      const input: ScoringInput = {
        kpiRatings: [4, 4, 5], // Average: 4.33
        coreValueRatings: [4, 5], // Average: 4.5
        weightsConfig: defaultWeights,
      };

      const result = calculateScores(input);

      expect(result).not.toBeNull();
      expect(result!.kpiScore).toBe(4.33);
      expect(result!.coreValuesScore).toBe(4.5);
      // 4.33 * 0.8 + 4.5 * 0.2 = 3.464 + 0.9 = 4.364 ≈ 4.36
      expect(result!.finalScore).toBe(4.36);
    });

    it("should handle KPI only (no core values)", () => {
      const input: ScoringInput = {
        kpiRatings: [3, 4, 5], // Average: 4
        coreValueRatings: [],
        weightsConfig: defaultWeights,
      };

      const result = calculateScores(input);

      expect(result).not.toBeNull();
      expect(result!.kpiScore).toBe(4);
      expect(result!.coreValuesScore).toBe(0);
      // When no core values, KPI weight becomes 1.0
      expect(result!.finalScore).toBe(4);
    });

    it("should handle Core Values only (no KPI)", () => {
      const input: ScoringInput = {
        kpiRatings: [],
        coreValueRatings: [4, 5], // Average: 4.5
        weightsConfig: defaultWeights,
      };

      const result = calculateScores(input);

      expect(result).not.toBeNull();
      expect(result!.kpiScore).toBe(0);
      expect(result!.coreValuesScore).toBe(4.5);
      // When no KPI, core values weight becomes 1.0
      expect(result!.finalScore).toBe(4.5);
    });

    it("should return null when no ratings provided", () => {
      const input: ScoringInput = {
        kpiRatings: [],
        coreValueRatings: [],
        weightsConfig: defaultWeights,
      };

      expect(calculateScores(input)).toBeNull();
    });

    it("should throw error when weights do not sum to 1.0", () => {
      const input: ScoringInput = {
        kpiRatings: [4],
        coreValueRatings: [5],
        weightsConfig: { kpi: 0.7, coreValues: 0.4 }, // Sums to 1.1
      };

      expect(() => calculateScores(input)).toThrow(
        "Weights must sum to 1.0"
      );
    });

    it("should throw error for invalid KPI ratings", () => {
      const input: ScoringInput = {
        kpiRatings: [6, 4], // 6 is invalid
        coreValueRatings: [4],
        weightsConfig: defaultWeights,
      };

      expect(() => calculateScores(input)).toThrow("Invalid KPI ratings");
    });

    it("should throw error for invalid Core Values ratings", () => {
      const input: ScoringInput = {
        kpiRatings: [4],
        coreValueRatings: [0], // 0 is invalid
        weightsConfig: defaultWeights,
      };

      expect(() => calculateScores(input)).toThrow(
        "Invalid Core Values ratings"
      );
    });

    it("should handle custom weights", () => {
      const input: ScoringInput = {
        kpiRatings: [5], // Average: 5
        coreValueRatings: [3], // Average: 3
        weightsConfig: { kpi: 0.6, coreValues: 0.4 },
      };

      const result = calculateScores(input);

      expect(result).not.toBeNull();
      // 5 * 0.6 + 3 * 0.4 = 3 + 1.2 = 4.2
      expect(result!.finalScore).toBe(4.2);
    });

    it("should handle equal weights", () => {
      const input: ScoringInput = {
        kpiRatings: [4], // Average: 4
        coreValueRatings: [5], // Average: 5
        weightsConfig: { kpi: 0.5, coreValues: 0.5 },
      };

      const result = calculateScores(input);

      expect(result).not.toBeNull();
      // 4 * 0.5 + 5 * 0.5 = 2 + 2.5 = 4.5
      expect(result!.finalScore).toBe(4.5);
    });

    it("should handle all same ratings", () => {
      const input: ScoringInput = {
        kpiRatings: [3, 3, 3, 3, 3],
        coreValueRatings: [3, 3, 3],
        weightsConfig: defaultWeights,
      };

      const result = calculateScores(input);

      expect(result).not.toBeNull();
      expect(result!.kpiScore).toBe(3);
      expect(result!.coreValuesScore).toBe(3);
      expect(result!.finalScore).toBe(3);
    });

    it("should handle min ratings (1)", () => {
      const input: ScoringInput = {
        kpiRatings: [1, 1, 1],
        coreValueRatings: [1, 1],
        weightsConfig: defaultWeights,
      };

      const result = calculateScores(input);

      expect(result).not.toBeNull();
      expect(result!.kpiScore).toBe(1);
      expect(result!.coreValuesScore).toBe(1);
      expect(result!.finalScore).toBe(1);
    });

    it("should handle max ratings (5)", () => {
      const input: ScoringInput = {
        kpiRatings: [5, 5, 5],
        coreValueRatings: [5, 5],
        weightsConfig: defaultWeights,
      };

      const result = calculateScores(input);

      expect(result).not.toBeNull();
      expect(result!.kpiScore).toBe(5);
      expect(result!.coreValuesScore).toBe(5);
      expect(result!.finalScore).toBe(5);
    });
  });

  describe("getRatingLabel", () => {
    it("should return correct labels for each rating", () => {
      expect(getRatingLabel(1)).toBe("Below Expectations");
      expect(getRatingLabel(2)).toBe("Needs Improvement");
      expect(getRatingLabel(3)).toBe("Meets Expectations");
      expect(getRatingLabel(4)).toBe("Above Expectations");
      expect(getRatingLabel(5)).toBe("Exceeds Expectations");
    });

    it("should return Unknown for invalid ratings", () => {
      expect(getRatingLabel(0)).toBe("Unknown");
      expect(getRatingLabel(6)).toBe("Unknown");
      expect(getRatingLabel(NaN)).toBe("Unknown");
    });
  });

  describe("getScoreBand", () => {
    it("should return Exceptional for scores >= 4.5", () => {
      const result = getScoreBand(4.5);
      expect(result.band).toBe("Exceptional");
      expect(result.color).toBe("green");

      const result2 = getScoreBand(5.0);
      expect(result2.band).toBe("Exceptional");
    });

    it("should return Strong for scores 3.5-4.49", () => {
      const result = getScoreBand(3.5);
      expect(result.band).toBe("Strong");
      expect(result.color).toBe("blue");

      const result2 = getScoreBand(4.0);
      expect(result2.band).toBe("Strong");

      const result3 = getScoreBand(4.49);
      expect(result3.band).toBe("Strong");
    });

    it("should return Solid for scores 2.5-3.49", () => {
      const result = getScoreBand(2.5);
      expect(result.band).toBe("Solid");
      expect(result.color).toBe("yellow");

      const result2 = getScoreBand(3.0);
      expect(result2.band).toBe("Solid");
    });

    it("should return Developing for scores 1.5-2.49", () => {
      const result = getScoreBand(1.5);
      expect(result.band).toBe("Developing");
      expect(result.color).toBe("orange");

      const result2 = getScoreBand(2.0);
      expect(result2.band).toBe("Developing");
    });

    it("should return Below for scores < 1.5", () => {
      const result = getScoreBand(1.0);
      expect(result.band).toBe("Below");
      expect(result.color).toBe("red");

      const result2 = getScoreBand(1.49);
      expect(result2.band).toBe("Below");
    });
  });

  describe("calculateCompletionPercentage", () => {
    it("should calculate percentage correctly", () => {
      expect(calculateCompletionPercentage({ total: 10, completed: 5 })).toBe(50);
      expect(calculateCompletionPercentage({ total: 4, completed: 3 })).toBe(75);
      expect(calculateCompletionPercentage({ total: 100, completed: 100 })).toBe(100);
      expect(calculateCompletionPercentage({ total: 100, completed: 0 })).toBe(0);
    });

    it("should handle zero total", () => {
      expect(calculateCompletionPercentage({ total: 0, completed: 0 })).toBe(0);
    });

    it("should round to nearest integer", () => {
      // 1/3 = 33.333... -> 33
      expect(calculateCompletionPercentage({ total: 3, completed: 1 })).toBe(33);
      // 2/3 = 66.666... -> 67
      expect(calculateCompletionPercentage({ total: 3, completed: 2 })).toBe(67);
    });
  });
});
