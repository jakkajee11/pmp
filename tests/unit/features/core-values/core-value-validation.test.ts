/**
 * Core Value Entity Validation Unit Tests
 *
 * Tests for core value data validation and business rules.
 */

import { describe, it, expect } from "@jest/globals";
import {
  createCoreValueSchema,
  updateCoreValueSchema,
  coreValueListQuerySchema,
  coreValueSchema,
  coreValueRatingSchema,
} from "../../../../src/features/core-values/types";

describe("Core Value Validation", () => {
  describe("createCoreValueSchema", () => {
    it("should validate a valid core value creation request", () => {
      const validData = {
        name: "Integrity",
        description: "Acting with honesty and transparency",
        rating1Desc: "Consistently dishonest",
        rating2Desc: "Occasionally lacks transparency",
        rating3Desc: "Generally honest and transparent",
        rating4Desc: "Consistently honest and transparent",
        rating5Desc: "Exemplary integrity in all actions",
        displayOrder: 0,
      };

      const result = createCoreValueSchema.parse(validData);
      expect(result.name).toBe("Integrity");
      expect(result.description).toBe("Acting with honesty and transparency");
      expect(result.displayOrder).toBe(0);
    });

    it("should accept optional fields", () => {
      const data = {
        name: "Innovation",
        nameTh: "นวัตกรรม",
        description: "Driving creative solutions",
        rating1Desc: "Resists new ideas",
        rating2Desc: "Accepts some innovation",
        rating3Desc: "Open to new ideas",
        rating4Desc: "Actively promotes innovation",
        rating5Desc: "Leads breakthrough innovations",
        displayOrder: 1,
      };

      const result = createCoreValueSchema.parse(data);
      expect(result.nameTh).toBe("นวัตกรรม");
    });

    it("should reject empty name", () => {
      expect(() =>
        createCoreValueSchema.parse({
          name: "",
          description: "Test description",
          rating1Desc: "1",
          rating2Desc: "2",
          rating3Desc: "3",
          rating4Desc: "4",
          rating5Desc: "5",
          displayOrder: 0,
        })
      ).toThrow();
    });

    it("should reject name longer than 255 characters", () => {
      expect(() =>
        createCoreValueSchema.parse({
          name: "a".repeat(256),
          description: "Test description",
          rating1Desc: "1",
          rating2Desc: "2",
          rating3Desc: "3",
          rating4Desc: "4",
          rating5Desc: "5",
          displayOrder: 0,
        })
      ).toThrow();
    });

    it("should reject empty description", () => {
      expect(() =>
        createCoreValueSchema.parse({
          name: "Test",
          description: "",
          rating1Desc: "1",
          rating2Desc: "2",
          rating3Desc: "3",
          rating4Desc: "4",
          rating5Desc: "5",
          displayOrder: 0,
        })
      ).toThrow();
    });

    it("should reject missing rating descriptions", () => {
      const baseData = {
        name: "Test",
        description: "Test description",
        displayOrder: 0,
      };

      // Missing rating1Desc
      expect(() =>
        createCoreValueSchema.parse({
          ...baseData,
          rating2Desc: "2",
          rating3Desc: "3",
          rating4Desc: "4",
          rating5Desc: "5",
        })
      ).toThrow();
    });

    it("should reject negative displayOrder", () => {
      expect(() =>
        createCoreValueSchema.parse({
          name: "Test",
          description: "Test description",
          rating1Desc: "1",
          rating2Desc: "2",
          rating3Desc: "3",
          rating4Desc: "4",
          rating5Desc: "5",
          displayOrder: -1,
        })
      ).toThrow();
    });
  });

  describe("updateCoreValueSchema", () => {
    it("should validate partial updates", () => {
      const partialData = {
        name: "Updated Name",
      };

      const result = updateCoreValueSchema.parse(partialData);
      expect(result.name).toBe("Updated Name");
      expect(result.description).toBeUndefined();
    });

    it("should allow isActive toggle", () => {
      const data = {
        isActive: false,
      };

      const result = updateCoreValueSchema.parse(data);
      expect(result.isActive).toBe(false);
    });

    it("should allow updating all fields", () => {
      const data = {
        name: "Updated",
        nameTh: "อัปเดต",
        description: "Updated description",
        rating1Desc: "Updated 1",
        rating2Desc: "Updated 2",
        rating3Desc: "Updated 3",
        rating4Desc: "Updated 4",
        rating5Desc: "Updated 5",
        displayOrder: 10,
        isActive: true,
      };

      const result = updateCoreValueSchema.parse(data);
      expect(result.name).toBe("Updated");
      expect(result.isActive).toBe(true);
    });
  });

  describe("coreValueListQuerySchema", () => {
    it("should apply default values", () => {
      const result = coreValueListQuerySchema.parse({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(50);
      expect(result.sortBy).toBe("displayOrder");
      expect(result.sortOrder).toBe("asc");
    });

    it("should coerce string numbers to integers", () => {
      const result = coreValueListQuerySchema.parse({
        page: "2",
        limit: "25",
      });
      expect(result.page).toBe(2);
      expect(result.limit).toBe(25);
    });

    it("should reject limit > 100", () => {
      expect(() =>
        coreValueListQuerySchema.parse({
          limit: 150,
        })
      ).toThrow();
    });

    it("should accept valid filter parameters", () => {
      const result = coreValueListQuerySchema.parse({
        isActive: true,
        sortBy: "name",
        sortOrder: "desc",
      });

      expect(result.isActive).toBe(true);
      expect(result.sortBy).toBe("name");
      expect(result.sortOrder).toBe("desc");
    });

    it("should reject invalid sortBy", () => {
      expect(() =>
        coreValueListQuerySchema.parse({
          sortBy: "invalid",
        })
      ).toThrow();
    });

    it("should reject invalid sortOrder", () => {
      expect(() =>
        coreValueListQuerySchema.parse({
          sortOrder: "invalid",
        })
      ).toThrow();
    });
  });

  describe("coreValueSchema", () => {
    it("should validate a complete core value", () => {
      const data = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        name: "Integrity",
        nameTh: "ความซื่อสัตย์",
        description: "Acting with honesty",
        rating1Desc: "1",
        rating2Desc: "2",
        rating3Desc: "3",
        rating4Desc: "4",
        rating5Desc: "5",
        displayOrder: 0,
        isActive: true,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      const result = coreValueSchema.parse(data);
      expect(result.id).toBe("123e4567-e89b-12d3-a456-426614174000");
      expect(result.isActive).toBe(true);
    });

    it("should reject invalid UUID", () => {
      expect(() =>
        coreValueSchema.parse({
          id: "not-a-uuid",
          name: "Test",
          description: "Test",
          rating1Desc: "1",
          rating2Desc: "2",
          rating3Desc: "3",
          rating4Desc: "4",
          rating5Desc: "5",
          displayOrder: 0,
          isActive: true,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        })
      ).toThrow();
    });
  });

  describe("coreValueRatingSchema", () => {
    it("should validate a valid rating", () => {
      const data = {
        coreValueId: "123e4567-e89b-12d3-a456-426614174000",
        coreValueName: "Integrity",
        rating: 4,
        rating1Desc: "1",
        rating2Desc: "2",
        rating3Desc: "3",
        rating4Desc: "4",
        rating5Desc: "5",
        comments: "Great performance",
      };

      const result = coreValueRatingSchema.parse(data);
      expect(result.rating).toBe(4);
      expect(result.comments).toBe("Great performance");
    });

    it("should allow nullable rating", () => {
      const data = {
        coreValueId: "123e4567-e89b-12d3-a456-426614174000",
        coreValueName: "Integrity",
        rating: null,
        rating1Desc: "1",
        rating2Desc: "2",
        rating3Desc: "3",
        rating4Desc: "4",
        rating5Desc: "5",
        comments: null,
      };

      const result = coreValueRatingSchema.parse(data);
      expect(result.rating).toBeNull();
    });

    it("should reject rating outside 1-5 range", () => {
      const baseData = {
        coreValueId: "123e4567-e89b-12d3-a456-426614174000",
        coreValueName: "Integrity",
        rating1Desc: "1",
        rating2Desc: "2",
        rating3Desc: "3",
        rating4Desc: "4",
        rating5Desc: "5",
      };

      expect(() => coreValueRatingSchema.parse({ ...baseData, rating: 0 })).toThrow();
      expect(() => coreValueRatingSchema.parse({ ...baseData, rating: 6 })).toThrow();
    });
  });
});
