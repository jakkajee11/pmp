/**
 * Objective Validation Unit Tests
 *
 * Tests for objective data validation and business rules.
 */

import { describe, it, expect } from "@jest/globals";
import {
  CreateObjectiveSchema,
  UpdateObjectiveSchema,
  ObjectiveListQuerySchema,
  ObjectiveCategorySchema,
  TimelineSchema,
  RatingCriteriaSchema,
  BulkAssignSchema,
  CopyObjectiveSchema,
  ObjectiveIdSchema,
} from "../../../../src/features/objectives/types";

describe("Objective Validation", () => {
  describe("ObjectiveCategorySchema", () => {
    it("should accept valid categories", () => {
      expect(() => ObjectiveCategorySchema.parse("DELIVERY")).not.toThrow();
      expect(() => ObjectiveCategorySchema.parse("INNOVATION")).not.toThrow();
      expect(() => ObjectiveCategorySchema.parse("QUALITY")).not.toThrow();
      expect(() => ObjectiveCategorySchema.parse("CULTURE")).not.toThrow();
    });

    it("should reject invalid categories", () => {
      expect(() => ObjectiveCategorySchema.parse("INVALID")).toThrow();
      expect(() => ObjectiveCategorySchema.parse("delivery")).toThrow();
      expect(() => ObjectiveCategorySchema.parse("")).toThrow();
    });
  });

  describe("TimelineSchema", () => {
    it("should accept valid timeline strings", () => {
      expect(() => TimelineSchema.parse("Q1")).not.toThrow();
      expect(() => TimelineSchema.parse("Q2")).not.toThrow();
      expect(() => TimelineSchema.parse("H1")).not.toThrow();
      expect(() => TimelineSchema.parse("Full Year")).not.toThrow();
      expect(() => TimelineSchema.parse("Jan-Mar 2026")).not.toThrow();
    });

    it("should reject empty timeline", () => {
      expect(() => TimelineSchema.parse("")).toThrow();
    });

    it("should reject timeline longer than 100 characters", () => {
      expect(() => TimelineSchema.parse("a".repeat(101))).toThrow();
    });
  });

  describe("RatingCriteriaSchema", () => {
    const validRatingCriteria = {
      rating1Desc: "Did not meet expectations",
      rating2Desc: "Partially met expectations",
      rating3Desc: "Met expectations",
      rating4Desc: "Exceeded expectations",
      rating5Desc: "Far exceeded expectations",
    };

    it("should validate valid rating criteria", () => {
      expect(() => RatingCriteriaSchema.parse(validRatingCriteria)).not.toThrow();
    });

    it("should require all rating descriptions", () => {
      const incomplete = {
        rating1Desc: "Rating 1",
        rating2Desc: "Rating 2",
        // missing others
      };
      expect(() => RatingCriteriaSchema.parse(incomplete)).toThrow();
    });

    it("should reject empty rating descriptions", () => {
      expect(() =>
        RatingCriteriaSchema.parse({
          ...validRatingCriteria,
          rating1Desc: "",
        })
      ).toThrow();
    });
  });

  describe("CreateObjectiveSchema", () => {
    const validObjectiveData = {
      title: "Complete project deliverable",
      description: "Deliver the main project module on time with all features",
      keyResults: "Complete by Q2 with 95% test coverage",
      category: "DELIVERY",
      timeline: "Q2",
      assignedTo: "123e4567-e89b-12d3-a456-426614174000",
      cycleId: "123e4567-e89b-12d3-a456-426614174001",
      rating1Desc: "Did not complete any deliverables",
      rating2Desc: "Completed less than 50% of deliverables",
      rating3Desc: "Completed all deliverables on time",
      rating4Desc: "Completed all deliverables early with high quality",
      rating5Desc: "Exceeded all expectations with innovation",
    };

    it("should validate a valid objective creation request", () => {
      const result = CreateObjectiveSchema.parse(validObjectiveData);
      expect(result.title).toBe("Complete project deliverable");
      expect(result.category).toBe("DELIVERY");
      expect(result.timeline).toBe("Q2");
    });

    it("should accept optional keyResults", () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { keyResults: _, ...data } = validObjectiveData;
      expect(() => CreateObjectiveSchema.parse(data)).not.toThrow();
    });

    it("should reject empty title", () => {
      expect(() =>
        CreateObjectiveSchema.parse({
          ...validObjectiveData,
          title: "",
        })
      ).toThrow();
    });

    it("should reject title longer than 500 characters", () => {
      expect(() =>
        CreateObjectiveSchema.parse({
          ...validObjectiveData,
          title: "a".repeat(501),
        })
      ).toThrow();
    });

    it("should reject empty description", () => {
      expect(() =>
        CreateObjectiveSchema.parse({
          ...validObjectiveData,
          description: "",
        })
      ).toThrow();
    });

    it("should reject invalid category", () => {
      expect(() =>
        CreateObjectiveSchema.parse({
          ...validObjectiveData,
          category: "INVALID",
        })
      ).toThrow();
    });

    it("should reject invalid assignedTo UUID", () => {
      expect(() =>
        CreateObjectiveSchema.parse({
          ...validObjectiveData,
          assignedTo: "not-a-uuid",
        })
      ).toThrow();
    });

    it("should reject invalid cycleId UUID", () => {
      expect(() =>
        CreateObjectiveSchema.parse({
          ...validObjectiveData,
          cycleId: "not-a-uuid",
        })
      ).toThrow();
    });

    it("should require all rating descriptions", () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { rating3Desc: _, ...data } = validObjectiveData;
      expect(() => CreateObjectiveSchema.parse(data)).toThrow();
    });
  });

  describe("UpdateObjectiveSchema", () => {
    it("should validate partial updates", () => {
      const partialData = {
        title: "Updated objective title",
      };

      const result = UpdateObjectiveSchema.parse(partialData);
      expect(result.title).toBe("Updated objective title");
      expect(result.description).toBeUndefined();
    });

    it("should allow updating individual fields", () => {
      const data = {
        timeline: "Q3",
      };

      const result = UpdateObjectiveSchema.parse(data);
      expect(result.timeline).toBe("Q3");
    });

    it("should allow updating rating criteria", () => {
      const data = {
        rating3Desc: "Updated meet expectations description",
      };

      const result = UpdateObjectiveSchema.parse(data);
      expect(result.rating3Desc).toBe("Updated meet expectations description");
    });

    it("should allow updating category", () => {
      const data = {
        category: "INNOVATION",
      };

      const result = UpdateObjectiveSchema.parse(data);
      expect(result.category).toBe("INNOVATION");
    });
  });

  describe("ObjectiveListQuerySchema", () => {
    it("should accept empty parameters", () => {
      const result = ObjectiveListQuerySchema.parse({});
      expect(result.cycleId).toBeUndefined();
      expect(result.assignedTo).toBeUndefined();
    });

    it("should accept valid filter parameters", () => {
      const result = ObjectiveListQuerySchema.parse({
        cycleId: "123e4567-e89b-12d3-a456-426614174000",
        assignedTo: "123e4567-e89b-12d3-a456-426614174001",
        category: "DELIVERY",
        createdBy: "123e4567-e89b-12d3-a456-426614174002",
      });

      expect(result.cycleId).toBe("123e4567-e89b-12d3-a456-426614174000");
      expect(result.assignedTo).toBe("123e4567-e89b-12d3-a456-426614174001");
      expect(result.category).toBe("DELIVERY");
    });

    it("should reject invalid category", () => {
      expect(() =>
        ObjectiveListQuerySchema.parse({
          category: "INVALID",
        })
      ).toThrow();
    });

    it("should reject invalid UUID format", () => {
      expect(() =>
        ObjectiveListQuerySchema.parse({
          cycleId: "not-a-uuid",
        })
      ).toThrow();
    });
  });

  describe("BulkAssignSchema", () => {
    const validBulkData = {
      title: "Complete annual compliance training",
      description: "Complete all mandatory compliance training modules",
      category: "CULTURE",
      timeline: "Full Year",
      cycleId: "123e4567-e89b-12d3-a456-426614174000",
      assignedTo: [
        "123e4567-e89b-12d3-a456-426614174001",
        "123e4567-e89b-12d3-a456-426614174002",
      ],
      rating1Desc: "No training completed",
      rating2Desc: "Partial training completed",
      rating3Desc: "All training completed on time",
      rating4Desc: "All training completed early",
      rating5Desc: "Training champion - helped others",
    };

    it("should validate valid bulk assignment request", () => {
      const result = BulkAssignSchema.parse(validBulkData);
      expect(result.assignedTo).toHaveLength(2);
      expect(result.title).toBe("Complete annual compliance training");
    });

    it("should accept single employee assignment", () => {
      const data = {
        ...validBulkData,
        assignedTo: ["123e4567-e89b-12d3-a456-426614174001"],
      };
      expect(() => BulkAssignSchema.parse(data)).not.toThrow();
    });

    it("should reject empty assignedTo array", () => {
      expect(() =>
        BulkAssignSchema.parse({
          ...validBulkData,
          assignedTo: [],
        })
      ).toThrow();
    });

    it("should reject more than 50 employees", () => {
      const manyIds = Array(51).fill("123e4567-e89b-12d3-a456-426614174001");
      expect(() =>
        BulkAssignSchema.parse({
          ...validBulkData,
          assignedTo: manyIds,
        })
      ).toThrow();
    });

    it("should reject invalid UUID in assignedTo", () => {
      expect(() =>
        BulkAssignSchema.parse({
          ...validBulkData,
          assignedTo: ["not-a-uuid"],
        })
      ).toThrow();
    });
  });

  describe("CopyObjectiveSchema", () => {
    const validCopyData = {
      sourceObjectiveId: "123e4567-e89b-12d3-a456-426614174000",
      assignedTo: "123e4567-e89b-12d3-a456-426614174001",
      cycleId: "123e4567-e89b-12d3-a456-426614174002",
    };

    it("should validate valid copy request", () => {
      const result = CopyObjectiveSchema.parse(validCopyData);
      expect(result.sourceObjectiveId).toBe(validCopyData.sourceObjectiveId);
      expect(result.assignedTo).toBe(validCopyData.assignedTo);
    });

    it("should reject invalid source objective ID", () => {
      expect(() =>
        CopyObjectiveSchema.parse({
          ...validCopyData,
          sourceObjectiveId: "not-a-uuid",
        })
      ).toThrow();
    });

    it("should reject invalid assignedTo ID", () => {
      expect(() =>
        CopyObjectiveSchema.parse({
          ...validCopyData,
          assignedTo: "not-a-uuid",
        })
      ).toThrow();
    });

    it("should reject invalid cycle ID", () => {
      expect(() =>
        CopyObjectiveSchema.parse({
          ...validCopyData,
          cycleId: "not-a-uuid",
        })
      ).toThrow();
    });
  });

  describe("ObjectiveIdSchema", () => {
    it("should accept valid UUID", () => {
      const validUuid = "123e4567-e89b-12d3-a456-426614174000";
      expect(() => ObjectiveIdSchema.parse(validUuid)).not.toThrow();
    });

    it("should reject invalid UUID", () => {
      expect(() => ObjectiveIdSchema.parse("invalid-uuid")).toThrow();
      expect(() => ObjectiveIdSchema.parse("12345")).toThrow();
      expect(() => ObjectiveIdSchema.parse("")).toThrow();
    });
  });
});
