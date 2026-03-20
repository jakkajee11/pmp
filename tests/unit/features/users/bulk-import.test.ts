/**
 * Bulk Import CSV Parsing Unit Tests
 *
 * Tests for CSV parsing and validation in bulk user import.
 */

import { describe, it, expect } from "@jest/globals";
import { parseBulkImportCsv } from "../../../../src/features/users/api/validators";

describe("Bulk Import CSV Parsing", () => {
  describe("parseBulkImportCsv", () => {
    it("should parse valid CSV content", () => {
      const csvContent = `email,name,name_th,role,manager_email,department_name
john.doe@company.com,John Doe,จอห์น โด,EMPLOYEE,manager@company.com,Engineering
jane.smith@company.com,Jane Smith,,LINE_MANAGER,,Engineering`;

      const result = parseBulkImportCsv(csvContent);

      expect(result.valid).toHaveLength(2);
      expect(result.errors).toHaveLength(0);

      expect(result.valid[0]).toEqual({
        email: "john.doe@company.com",
        name: "John Doe",
        name_th: "จอห์น โด",
        role: "EMPLOYEE",
        manager_email: "manager@company.com",
        department_name: "Engineering",
      });

      expect(result.valid[1]).toEqual({
        email: "jane.smith@company.com",
        name: "Jane Smith",
        name_th: undefined,
        role: "LINE_MANAGER",
        manager_email: undefined,
        department_name: "Engineering",
      });
    });

    it("should handle case-insensitive role values", () => {
      const csvContent = `email,name,role
test1@company.com,Test1,employee
test2@company.com,Test2,LINE_MANAGER
test3@company.com,Test3,hr_admin`;

      const result = parseBulkImportCsv(csvContent);

      expect(result.valid).toHaveLength(3);
      expect(result.valid[0].role).toBe("EMPLOYEE");
      expect(result.valid[1].role).toBe("LINE_MANAGER");
      expect(result.valid[2].role).toBe("HR_ADMIN");
    });

    it("should reject CSV without required headers", () => {
      const csvContent = `name,email
John Doe,john@company.com`;

      const result = parseBulkImportCsv(csvContent);

      expect(result.valid).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain("Missing required column");
    });

    it("should reject CSV with only header row", () => {
      const csvContent = `email,name,role`;

      const result = parseBulkImportCsv(csvContent);

      expect(result.valid).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain("at least one data row");
    });

    it("should handle empty CSV", () => {
      const csvContent = ``;

      const result = parseBulkImportCsv(csvContent);

      expect(result.valid).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
    });

    it("should validate individual row data", () => {
      const csvContent = `email,name,role
invalid-email,John Doe,EMPLOYEE
test@company.com,,EMPLOYEE
test2@company.com,Jane,INVALID_ROLE`;

      const result = parseBulkImportCsv(csvContent);

      expect(result.valid).toHaveLength(0);
      expect(result.errors).toHaveLength(3);
    });

    it("should handle quoted values with commas", () => {
      const csvContent = `email,name,role,department_name
test@company.com,"Doe, John",EMPLOYEE,"Engineering, R&D"`;

      const result = parseBulkImportCsv(csvContent);

      expect(result.valid).toHaveLength(1);
      expect(result.valid[0].name).toBe("Doe, John");
      expect(result.valid[0].department_name).toBe("Engineering, R&D");
    });

    it("should handle escaped quotes in values", () => {
      const csvContent = `email,name,role
test@company.com,"John ""The Boss"" Doe",EMPLOYEE`;

      const result = parseBulkImportCsv(csvContent);

      expect(result.valid).toHaveLength(1);
      expect(result.valid[0].name).toBe('John "The Boss" Doe');
    });

    it("should skip empty lines", () => {
      const csvContent = `email,name,role
test1@company.com,Test1,EMPLOYEE

test2@company.com,Test2,EMPLOYEE
`;

      const result = parseBulkImportCsv(csvContent);

      expect(result.valid).toHaveLength(2);
    });

    it("should report errors with row numbers", () => {
      const csvContent = `email,name,role
test@company.com,Valid User,EMPLOYEE
invalid-email,Invalid User,EMPLOYEE`;

      const result = parseBulkImportCsv(csvContent);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].row).toBe(3);
    });

    it("should validate email format", () => {
      const csvContent = `email,name,role
not-an-email,John,EMPLOYEE
also-not-email,Jane,EMPLOYEE
valid@company.com,Bob,EMPLOYEE`;

      const result = parseBulkImportCsv(csvContent);

      expect(result.valid).toHaveLength(1);
      expect(result.valid[0].email).toBe("valid@company.com");
      expect(result.errors).toHaveLength(2);
    });

    it("should validate manager email format if provided", () => {
      const csvContent = `email,name,role,manager_email
test@company.com,Test,EMPLOYEE,invalid-manager`;

      const result = parseBulkImportCsv(csvContent);

      expect(result.valid).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
    });

    it("should handle whitespace in values", () => {
      const csvContent = `email,name,role
  test@company.com  ,  John Doe  ,  EMPLOYEE  `;

      const result = parseBulkImportCsv(csvContent);

      expect(result.valid).toHaveLength(1);
      expect(result.valid[0].email).toBe("test@company.com");
      expect(result.valid[0].name).toBe("John Doe");
      expect(result.valid[0].role).toBe("EMPLOYEE");
    });
  });
});
