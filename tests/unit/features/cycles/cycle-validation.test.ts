/**
 * Review Cycle Validation Unit Tests
 *
 * Tests for review cycle data validation and business rules.
 */

import { describe, it, expect } from "@jest/globals";
import {
  CreateCycleSchema,
  UpdateCycleSchema,
  CycleListQuerySchema,
  CycleTypeSchema,
  CycleStatusSchema,
  WeightsConfigSchema,
  DeadlineExtensionSchema,
  CycleIdSchema,
} from "../../../../src/features/cycles/types";

describe("Review Cycle Validation", () => {
  describe("CycleTypeSchema", () => {
    it("should accept valid cycle types", () => {
      expect(() => CycleTypeSchema.parse("MID_YEAR")).not.toThrow();
      expect(() => CycleTypeSchema.parse("YEAR_END")).not.toThrow();
    });

    it("should reject invalid cycle types", () => {
      expect(() => CycleTypeSchema.parse("INVALID")).toThrow();
      expect(() => CycleTypeSchema.parse("mid_year")).toThrow();
      expect(() => CycleTypeSchema.parse("")).toThrow();
    });
  });

  describe("CycleStatusSchema", () => {
    it("should accept valid statuses", () => {
      expect(() => CycleStatusSchema.parse("DRAFT")).not.toThrow();
      expect(() => CycleStatusSchema.parse("ACTIVE")).not.toThrow();
      expect(() => CycleStatusSchema.parse("CLOSED")).not.toThrow();
    });

    it("should reject invalid statuses", () => {
      expect(() => CycleStatusSchema.parse("INVALID")).toThrow();
      expect(() => CycleStatusSchema.parse("active")).toThrow();
      expect(() => CycleStatusSchema.parse("")).toThrow();
    });
  });

  describe("WeightsConfigSchema", () => {
    it("should accept valid weights that sum to 1.0", () => {
      const validWeights = [
        { kpi: 0.8, coreValues: 0.2 },
        { kpi: 0.7, coreValues: 0.3 },
        { kpi: 0.5, coreValues: 0.5 },
        { kpi: 1.0, coreValues: 0.0 },
        { kpi: 0.0, coreValues: 1.0 },
      ];

      validWeights.forEach((weights) => {
        expect(() => WeightsConfigSchema.parse(weights)).not.toThrow();
      });
    });

    it("should reject weights that do not sum to 1.0", () => {
      const invalidWeights = [
        { kpi: 0.8, coreValues: 0.3 }, // Sum = 1.1
        { kpi: 0.5, coreValues: 0.4 }, // Sum = 0.9
        { kpi: 0.0, coreValues: 0.0 }, // Sum = 0.0
      ];

      invalidWeights.forEach((weights) => {
        expect(() => WeightsConfigSchema.parse(weights)).toThrow();
      });
    });

    it("should reject weights outside 0-1 range", () => {
      expect(() => WeightsConfigSchema.parse({ kpi: -0.1, coreValues: 1.1 })).toThrow();
      expect(() => WeightsConfigSchema.parse({ kpi: 1.5, coreValues: -0.5 })).toThrow();
    });
  });

  describe("CreateCycleSchema", () => {
    const validCycleData = {
      name: "Mid-Year Review 2026",
      type: "MID_YEAR",
      startDate: "2026-01-01",
      endDate: "2026-06-30",
      selfEvalDeadline: "2026-05-15",
      managerReviewDeadline: "2026-06-15",
    };

    it("should validate a valid cycle creation request", () => {
      const result = CreateCycleSchema.parse(validCycleData);
      expect(result.name).toBe("Mid-Year Review 2026");
      expect(result.type).toBe("MID_YEAR");
      expect(result.gracePeriodDays).toBe(0);
      expect(result.weightsConfig).toEqual({ kpi: 0.8, coreValues: 0.2 });
    });

    it("should accept optional fields", () => {
      const data = {
        ...validCycleData,
        gracePeriodDays: 5,
        weightsConfig: { kpi: 0.7, coreValues: 0.3 },
      };

      const result = CreateCycleSchema.parse(data);
      expect(result.gracePeriodDays).toBe(5);
      expect(result.weightsConfig).toEqual({ kpi: 0.7, coreValues: 0.3 });
    });

    it("should reject empty name", () => {
      expect(() =>
        CreateCycleSchema.parse({
          ...validCycleData,
          name: "",
        })
      ).toThrow();
    });

    it("should reject name longer than 255 characters", () => {
      expect(() =>
        CreateCycleSchema.parse({
          ...validCycleData,
          name: "a".repeat(256),
        })
      ).toThrow();
    });

    it("should reject start date after end date", () => {
      expect(() =>
        CreateCycleSchema.parse({
          ...validCycleData,
          startDate: "2026-07-01",
          endDate: "2026-01-01",
        })
      ).toThrow();
    });

    it("should reject self-eval deadline after manager review deadline", () => {
      expect(() =>
        CreateCycleSchema.parse({
          ...validCycleData,
          selfEvalDeadline: "2026-06-20",
          managerReviewDeadline: "2026-06-15",
        })
      ).toThrow();
    });

    it("should reject deadline after end date", () => {
      expect(() =>
        CreateCycleSchema.parse({
          ...validCycleData,
          selfEvalDeadline: "2026-07-15", // After end date
        })
      ).toThrow();
    });

    it("should reject grace period > 30 days", () => {
      expect(() =>
        CreateCycleSchema.parse({
          ...validCycleData,
          gracePeriodDays: 31,
        })
      ).toThrow();
    });

    it("should reject negative grace period", () => {
      expect(() =>
        CreateCycleSchema.parse({
          ...validCycleData,
          gracePeriodDays: -1,
        })
      ).toThrow();
    });
  });

  describe("UpdateCycleSchema", () => {
    it("should validate partial updates", () => {
      const partialData = {
        name: "Updated Cycle Name",
      };

      const result = UpdateCycleSchema.parse(partialData);
      expect(result.name).toBe("Updated Cycle Name");
      expect(result.type).toBeUndefined();
    });

    it("should allow updating individual fields", () => {
      const data = {
        gracePeriodDays: 10,
      };

      const result = UpdateCycleSchema.parse(data);
      expect(result.gracePeriodDays).toBe(10);
    });

    it("should allow updating weights config", () => {
      const data = {
        weightsConfig: { kpi: 0.6, coreValues: 0.4 },
      };

      const result = UpdateCycleSchema.parse(data);
      expect(result.weightsConfig).toEqual({ kpi: 0.6, coreValues: 0.4 });
    });
  });

  describe("CycleListQuerySchema", () => {
    it("should accept empty parameters", () => {
      const result = CycleListQuerySchema.parse({});
      expect(result.status).toBeUndefined();
      expect(result.type).toBeUndefined();
    });

    it("should accept valid filter parameters", () => {
      const result = CycleListQuerySchema.parse({
        status: "ACTIVE",
        type: "MID_YEAR",
      });

      expect(result.status).toBe("ACTIVE");
      expect(result.type).toBe("MID_YEAR");
    });

    it("should reject invalid status", () => {
      expect(() =>
        CycleListQuerySchema.parse({
          status: "INVALID",
        })
      ).toThrow();
    });

    it("should reject invalid type", () => {
      expect(() =>
        CycleListQuerySchema.parse({
          type: "INVALID",
        })
      ).toThrow();
    });
  });

  describe("DeadlineExtensionSchema", () => {
    it("should validate a valid extension request", () => {
      const validData = {
        userIds: ["123e4567-e89b-12d3-a456-426614174000"],
        extensionType: "self_eval",
        newDeadline: "2026-06-30",
      };

      const result = DeadlineExtensionSchema.parse(validData);
      expect(result.userIds).toHaveLength(1);
      expect(result.extensionType).toBe("self_eval");
    });

    it("should accept multiple user IDs", () => {
      const data = {
        userIds: [
          "123e4567-e89b-12d3-a456-426614174000",
          "123e4567-e89b-12d3-a456-426614174001",
        ],
        extensionType: "manager_review",
        newDeadline: "2026-07-15",
      };

      const result = DeadlineExtensionSchema.parse(data);
      expect(result.userIds).toHaveLength(2);
    });

    it("should reject empty user IDs array", () => {
      expect(() =>
        DeadlineExtensionSchema.parse({
          userIds: [],
          extensionType: "self_eval",
          newDeadline: "2026-06-30",
        })
      ).toThrow();
    });

    it("should reject invalid extension type", () => {
      expect(() =>
        DeadlineExtensionSchema.parse({
          userIds: ["123e4567-e89b-12d3-a456-426614174000"],
          extensionType: "invalid",
          newDeadline: "2026-06-30",
        })
      ).toThrow();
    });

    it("should reject invalid UUID format", () => {
      expect(() =>
        DeadlineExtensionSchema.parse({
          userIds: ["not-a-uuid"],
          extensionType: "self_eval",
          newDeadline: "2026-06-30",
        })
      ).toThrow();
    });
  });

  describe("CycleIdSchema", () => {
    it("should accept valid UUID", () => {
      const validUuid = "123e4567-e89b-12d3-a456-426614174000";
      expect(() => CycleIdSchema.parse(validUuid)).not.toThrow();
    });

    it("should reject invalid UUID", () => {
      expect(() => CycleIdSchema.parse("invalid-uuid")).toThrow();
      expect(() => CycleIdSchema.parse("12345")).toThrow();
      expect(() => CycleIdSchema.parse("")).toThrow();
    });
  });
});
