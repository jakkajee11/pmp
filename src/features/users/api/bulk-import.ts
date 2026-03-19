/**
 * Bulk User Import Service
 *
 * Handles CSV-based bulk user import with validation and error reporting.
 */

import { prisma } from "../../../shared/lib/db";
import { UserCsvRow, BulkImportResult } from "../types";

interface ImportContext {
  emailToUserId: Map<string, string>;
  departmentNameToId: Map<string, string>;
}

/**
 * Build import context with existing users and departments
 */
async function buildImportContext(): Promise<ImportContext> {
  const [users, departments] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, email: true },
    }),
    prisma.department.findMany({
      select: { id: true, name: true },
    }),
  ]);

  return {
    emailToUserId: new Map(users.map((u: { id: string; email: string }) => [u.email.toLowerCase(), u.id])),
    departmentNameToId: new Map(departments.map((d: { id: string; name: string }) => [d.name.toLowerCase(), d.id])),
  };
}

/**
 * Process bulk user import from CSV rows
 */
export async function processBulkImport(
  rows: UserCsvRow[],
  createdBy: string
): Promise<BulkImportResult> {
  const result: BulkImportResult = {
    imported: 0,
    skipped: 0,
    errors: [],
  };

  if (rows.length === 0) {
    return result;
  }

  const context = await buildImportContext();

  // Process each row
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // +2 for 1-based index and header row

    try {
      // Check if user already exists
      const existingUserId = context.emailToUserId.get(row.email.toLowerCase());
      if (existingUserId) {
        result.skipped++;
        continue;
      }

      // Resolve manager ID from email
      let managerId: string | null = null;
      if (row.manager_email) {
        managerId = context.emailToUserId.get(row.manager_email.toLowerCase()) ?? null;
        if (!managerId) {
          result.errors.push({
            row: rowNum,
            email: row.email,
            error: `Manager with email "${row.manager_email}" not found`,
          });
          continue;
        }
      }

      // Resolve department ID from name
      let departmentId: string | null = null;
      if (row.department_name) {
        departmentId = context.departmentNameToId.get(row.department_name.toLowerCase()) ?? null;
        if (!departmentId) {
          result.errors.push({
            row: rowNum,
            email: row.email,
            error: `Department "${row.department_name}" not found`,
          });
          continue;
        }
      }

      // Validate role doesn't require manager
      const rolesWithoutManager = ["SUPER_ADMIN", "HR_ADMIN"];
      if (!managerId && !rolesWithoutManager.includes(row.role)) {
        // For non-HR roles, manager is recommended but not required
        // Log warning but continue
      }

      // Create user
      const user = await prisma.user.create({
        data: {
          email: row.email.toLowerCase(),
          name: row.name,
          nameTh: row.name_th,
          role: row.role as any,
          managerId,
          departmentId,
          language: "en",
          isActive: true,
        },
      });

      // Update context for subsequent rows
      context.emailToUserId.set(row.email.toLowerCase(), user.id);

      result.imported++;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      result.errors.push({
        row: rowNum,
        email: row.email,
        error: errorMessage,
      });
    }
  }

  // Log audit entry for bulk import
  await prisma.auditLog.create({
    data: {
      userId: createdBy,
      action: "bulk_import",
      entityType: "User",
      entityId: "bulk",
      oldValues: null,
      newValues: {
        imported: result.imported,
        skipped: result.skipped,
        errorCount: result.errors.length,
      },
      ipAddress: "system",
    },
  });

  return result;
}

/**
 * Validate import file size and format
 */
export function validateImportFile(file: File): { valid: boolean; error?: string } {
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ["text/csv", "application/csv", "text/plain"];

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "File size must be less than 5MB" };
  }

  if (!ALLOWED_TYPES.includes(file.type) && !file.name.endsWith(".csv")) {
    return { valid: false, error: "File must be a CSV file" };
  }

  return { valid: true };
}

/**
 * Generate CSV template for download
 */
export function generateCsvTemplate(): string {
  const headers = ["email", "name", "name_th", "role", "manager_email", "department_name"];
  const exampleRows = [
    ["john.doe@company.com", "John Doe", "จอห์น โด", "EMPLOYEE", "manager@company.com", "Engineering"],
    ["jane.smith@company.com", "Jane Smith", "", "LINE_MANAGER", "", "Engineering"],
    ["hr.admin@company.com", "HR Admin", "", "HR_ADMIN", "", "Human Resources"],
  ];

  const csvContent = [
    headers.join(","),
    ...exampleRows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  return csvContent;
}
