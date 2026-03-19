/**
 * User API Validators
 *
 * Request validation for user management endpoints.
 */

import { NextRequest } from "next/server";
import {
  CreateUserSchema,
  UpdateUserSchema,
  UserListQuerySchema,
  DepartmentSchema,
  BulkImportRowSchema,
  UserCsvRow,
} from "../types";
import { validationErrorResponse } from "../../../shared/api/response";
import { z } from "zod";

/**
 * Validate create user request body
 */
export async function validateCreateUser(request: NextRequest) {
  try {
    const body = await request.json();
    return CreateUserSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        JSON.stringify({
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: error.errors,
        })
      );
    }
    throw error;
  }
}

/**
 * Validate update user request body
 */
export async function validateUpdateUser(request: NextRequest) {
  try {
    const body = await request.json();
    return UpdateUserSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        JSON.stringify({
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: error.errors,
        })
      );
    }
    throw error;
  }
}

/**
 * Validate user list query parameters
 */
export function validateUserListQuery(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const params = {
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
    role: searchParams.get("role") ?? undefined,
    departmentId: searchParams.get("department_id") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    isActive: searchParams.get("is_active") ?? undefined,
  };

  try {
    return UserListQuerySchema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        JSON.stringify({
          code: "VALIDATION_ERROR",
          message: "Invalid query parameters",
          details: error.errors,
        })
      );
    }
    throw error;
  }
}

/**
 * Validate department create/update request
 */
export async function validateDepartment(request: NextRequest) {
  try {
    const body = await request.json();
    return DepartmentSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        JSON.stringify({
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: error.errors,
        })
      );
    }
    throw error;
  }
}

/**
 * Parse and validate CSV content for bulk import
 */
export function parseBulkImportCsv(csvContent: string): {
  valid: UserCsvRow[];
  errors: Array<{ row: number; error: string; data?: Record<string, string> }>;
} {
  const lines = csvContent.trim().split("\n");
  const valid: UserCsvRow[] = [];
  const errors: Array<{ row: number; error: string; data?: Record<string, string> }> = [];

  if (lines.length < 2) {
    errors.push({ row: 0, error: "CSV file must have header and at least one data row" });
    return { valid, errors };
  }

  // Parse header
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const requiredHeaders = ["email", "name", "role"];

  for (const req of requiredHeaders) {
    if (!header.includes(req)) {
      errors.push({ row: 0, error: `Missing required column: ${req}` });
    }
  }

  if (errors.length > 0) {
    return { valid, errors };
  }

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const rowNum = i + 1;
    const line = lines[i].trim();

    if (!line) continue; // Skip empty lines

    const values = parseCSVLine(line);
    const rowData: Record<string, string> = {};

    header.forEach((h, idx) => {
      rowData[h] = values[idx]?.trim() ?? "";
    });

    try {
      const row = BulkImportRowSchema.parse({
        email: rowData.email,
        name: rowData.name,
        name_th: rowData.name_th || undefined,
        role: rowData.role.toUpperCase(),
        manager_email: rowData.manager_email || undefined,
        department_name: rowData.department_name || undefined,
      });
      valid.push(row);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push({
          row: rowNum,
          error: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; "),
          data: rowData,
        });
      }
    }
  }

  return { valid, errors };
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

/**
 * Validate user ID parameter
 */
export function validateUserId(id: string): string {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(id)) {
    throw new Error(
      JSON.stringify({
        code: "VALIDATION_ERROR",
        message: "Invalid user ID format",
        details: { id },
      })
    );
  }

  return id;
}

/**
 * Validate department ID parameter
 */
export function validateDepartmentId(id: string): string {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(id)) {
    throw new Error(
      JSON.stringify({
        code: "VALIDATION_ERROR",
        message: "Invalid department ID format",
        details: { id },
      })
    );
  }

  return id;
}
