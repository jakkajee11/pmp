/**
 * User Entity Validation Unit Tests
 *
 * Tests for user data validation and business rules.
 */

import { describe, it, expect } from "@jest/globals";
import {
  CreateUserSchema,
  UpdateUserSchema,
  UserListQuerySchema,
  UserRoleSchema,
} from "../../../../src/features/users/types";

describe("User Validation", () => {
  describe("UserRoleSchema", () => {
    it("should accept valid roles", () => {
      const validRoles = [
        "SUPER_ADMIN",
        "HR_ADMIN",
        "HR_STAFF",
        "SENIOR_MANAGER",
        "LINE_MANAGER",
        "EMPLOYEE",
      ];

      validRoles.forEach((role) => {
        expect(() => UserRoleSchema.parse(role)).not.toThrow();
      });
    });

    it("should reject invalid roles", () => {
      expect(() => UserRoleSchema.parse("INVALID_ROLE")).toThrow();
      expect(() => UserRoleSchema.parse("admin")).toThrow();
      expect(() => UserRoleSchema.parse("")).toThrow();
    });
  });

  describe("CreateUserSchema", () => {
    it("should validate a valid user creation request", () => {
      const validData = {
        email: "john.doe@company.com",
        name: "John Doe",
        role: "EMPLOYEE",
      };

      const result = CreateUserSchema.parse(validData);
      expect(result.email).toBe("john.doe@company.com");
      expect(result.name).toBe("John Doe");
      expect(result.role).toBe("EMPLOYEE");
    });

    it("should accept optional fields", () => {
      const data = {
        email: "jane@company.com",
        name: "Jane Smith",
        nameTh: "เจน สมิธ",
        role: "LINE_MANAGER",
        managerId: "123e4567-e89b-12d3-a456-426614174000",
        departmentId: "123e4567-e89b-12d3-a456-426614174001",
      };

      const result = CreateUserSchema.parse(data);
      expect(result.nameTh).toBe("เจน สมิธ");
      expect(result.managerId).toBe("123e4567-e89b-12d3-a456-426614174000");
    });

    it("should reject invalid email", () => {
      const invalidEmails = ["notanemail", "missing@domain", "@nodomain.com", ""];

      invalidEmails.forEach((email) => {
        expect(() =>
          CreateUserSchema.parse({
            email,
            name: "Test User",
            role: "EMPLOYEE",
          })
        ).toThrow();
      });
    });

    it("should reject empty name", () => {
      expect(() =>
        CreateUserSchema.parse({
          email: "test@company.com",
          name: "",
          role: "EMPLOYEE",
        })
      ).toThrow();
    });

    it("should reject name longer than 255 characters", () => {
      expect(() =>
        CreateUserSchema.parse({
          email: "test@company.com",
          name: "a".repeat(256),
          role: "EMPLOYEE",
        })
      ).toThrow();
    });

    it("should reject invalid UUID for managerId", () => {
      expect(() =>
        CreateUserSchema.parse({
          email: "test@company.com",
          name: "Test User",
          role: "EMPLOYEE",
          managerId: "not-a-uuid",
        })
      ).toThrow();
    });
  });

  describe("UpdateUserSchema", () => {
    it("should validate partial updates", () => {
      const partialData = {
        name: "Updated Name",
      };

      const result = UpdateUserSchema.parse(partialData);
      expect(result.name).toBe("Updated Name");
      expect(result.role).toBeUndefined();
    });

    it("should allow null values for optional relations", () => {
      const data = {
        managerId: null,
        departmentId: null,
      };

      const result = UpdateUserSchema.parse(data);
      expect(result.managerId).toBeNull();
      expect(result.departmentId).toBeNull();
    });

    it("should accept isActive toggle", () => {
      const data = {
        isActive: false,
      };

      const result = UpdateUserSchema.parse(data);
      expect(result.isActive).toBe(false);
    });
  });

  describe("UserListQuerySchema", () => {
    it("should apply default values", () => {
      const result = UserListQuerySchema.parse({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it("should coerce string numbers to integers", () => {
      const result = UserListQuerySchema.parse({
        page: "2",
        limit: "50",
      });
      expect(result.page).toBe(2);
      expect(result.limit).toBe(50);
    });

    it("should reject limit > 100", () => {
      expect(() =>
        UserListQuerySchema.parse({
          limit: 150,
        })
      ).toThrow();
    });

    it("should accept valid filter parameters", () => {
      const result = UserListQuerySchema.parse({
        role: "LINE_MANAGER",
        departmentId: "123e4567-e89b-12d3-a456-426614174000",
        search: "john",
        isActive: "true",
      });

      expect(result.role).toBe("LINE_MANAGER");
      expect(result.search).toBe("john");
    });
  });
});
