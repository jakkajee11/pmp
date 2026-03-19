/**
 * User & Organization Types
 *
 * Type definitions for user management and organizational hierarchy.
 */

import { z } from "zod";

// ============================================================================
// Role Types
// ============================================================================

export type UserRole =
  | "SUPER_ADMIN"
  | "HR_ADMIN"
  | "HR_STAFF"
  | "SENIOR_MANAGER"
  | "LINE_MANAGER"
  | "EMPLOYEE";

// ============================================================================
// Role Constants
// ============================================================================

export const USER_ROLES = [
  "SUPER_ADMIN",
  "HR_ADMIN",
  "HR_STAFF",
  "SENIOR_MANAGER",
  "LINE_MANAGER",
  "EMPLOYEE",
] as const;

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  HR_ADMIN: "HR Admin",
  HR_STAFF: "HR Staff",
  SENIOR_MANAGER: "Senior Manager",
  LINE_MANAGER: "Line Manager",
  EMPLOYEE: "Employee",
};

export const ROLE_LABELS_TH: Record<UserRole, string> = {
  SUPER_ADMIN: "ผู้ดูแลระบบสูงสุด",
  HR_ADMIN: "ผู้ดูแลทรัพยากรบุคคล",
  HR_STAFF: "เจ้าหน้าที่ทรัพยากรบุคคล",
  SENIOR_MANAGER: "ผู้จัดการอาวุโส",
  LINE_MANAGER: "ผู้จัดการ",
  EMPLOYEE: "พนักงาน",
};

// ============================================================================
// User Types
// ============================================================================

/**
 * User entity type
 */
export interface User {
  id: string;
  email: string;
  name: string;
  nameTh?: string;
  role: UserRole;
  managerId?: string;
  departmentId?: string;
  language: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User with related data
 */
export interface UserWithRelations extends User {
  manager?: Pick<User, "id" | "name" | "email"> | null;
  department?: Pick<Department, "id" | "name"> | null;
  directReportsCount?: number;
}

/**
 * User list item for display
 */
export interface UserListItem {
  id: string;
  email: string;
  name: string;
  nameTh?: string;
  role: UserRole;
  department?: { id: string; name: string } | null;
  manager?: { id: string; name: string } | null;
  isActive: boolean;
  createdAt: string;
}

// ============================================================================
// Department Types
// ============================================================================

/**
 * Department entity type
 */
export interface Department {
  id: string;
  name: string;
  nameTh?: string;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Department with hierarchy data
 */
export interface DepartmentWithChildren extends Department {
  children: DepartmentWithChildren[];
  employeeCount?: number;
}

/**
 * Department tree node
 */
export interface DepartmentTreeNode {
  id: string;
  name: string;
  nameTh?: string;
  children: DepartmentTreeNode[];
}

// ============================================================================
// Org Chart Types
// ============================================================================

/**
 * Org chart node for visualization
 */
export interface OrgChartNode {
  id: string;
  name: string;
  role: UserRole;
  department?: string;
  email: string;
  directReports: OrgChartNode[];
}

/**
 * Org chart filter options
 */
export interface OrgChartFilters {
  rootUserId?: string;
  depth?: number;
  departmentId?: string;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * User list query parameters
 */
export interface UserListParams {
  page?: number;
  limit?: number;
  role?: UserRole;
  departmentId?: string;
  search?: string;
  isActive?: boolean;
}

/**
 * Create user request
 */
export interface CreateUserRequest {
  email: string;
  name: string;
  nameTh?: string;
  role: UserRole;
  managerId?: string;
  departmentId?: string;
}

/**
 * Update user request
 */
export interface UpdateUserRequest {
  name?: string;
  nameTh?: string;
  role?: UserRole;
  managerId?: string | null;
  departmentId?: string | null;
  isActive?: boolean;
}

/**
 * Bulk import result
 */
export interface BulkImportResult {
  imported: number;
  skipped: number;
  errors: Array<{
    row: number;
    email?: string;
    error: string;
  }>;
}

/**
 * CSV row for bulk import
 */
export interface UserCsvRow {
  email: string;
  name: string;
  name_th?: string;
  role: string;
  manager_email?: string;
  department_name?: string;
}

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

export const UserRoleSchema = z.enum([
  "SUPER_ADMIN",
  "HR_ADMIN",
  "HR_STAFF",
  "SENIOR_MANAGER",
  "LINE_MANAGER",
  "EMPLOYEE",
]);

export const CreateUserSchema = z.object({
  email: z.string().email("Invalid email format").max(255, "Email too long"),
  name: z.string().min(1, "Name is required").max(255, "Name too long"),
  nameTh: z.string().max(255, "Thai name too long").optional(),
  role: UserRoleSchema,
  managerId: z.string().uuid("Invalid manager ID").optional(),
  departmentId: z.string().uuid("Invalid department ID").optional(),
});

export const UpdateUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name too long").optional(),
  nameTh: z.string().max(255, "Thai name too long").optional(),
  role: UserRoleSchema.optional(),
  managerId: z.string().uuid("Invalid manager ID").nullable().optional(),
  departmentId: z.string().uuid("Invalid department ID").nullable().optional(),
  isActive: z.boolean().optional(),
});

export const UserListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  role: UserRoleSchema.optional(),
  departmentId: z.string().uuid().optional(),
  search: z.string().max(255).optional(),
  isActive: z.coerce.boolean().optional(),
});

export const DepartmentSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name too long"),
  nameTh: z.string().max(255, "Thai name too long").optional(),
  parentId: z.string().uuid("Invalid parent department ID").optional(),
});

export const BulkImportRowSchema = z.object({
  email: z.string().email("Invalid email format"),
  name: z.string().min(1, "Name is required").max(255, "Name too long"),
  name_th: z.string().max(255, "Thai name too long").optional(),
  role: UserRoleSchema,
  manager_email: z.string().email("Invalid manager email").optional(),
  department_name: z.string().max(255).optional(),
});
