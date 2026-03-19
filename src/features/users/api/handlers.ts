/**
 * User API Handlers
 *
 * CRUD operations for user management.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/shared/lib/db";
import { auditLog, extractClientIp, extractUserAgent } from "@/shared/lib/audit";

/**
 * Helper to log audit entries from request context
 */
async function logAudit(params: {
  userId: string;
  action: "create" | "update" | "delete" | "view";
  entityType: string;
  entityId: string;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  request: NextRequest;
}) {
  await auditLog({
    userId: params.userId,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    oldValues: params.oldValues ?? undefined,
    newValues: params.newValues ?? undefined,
    ipAddress: extractClientIp(params.request.headers),
    userAgent: extractUserAgent(params.request.headers) ?? undefined,
  });
}
import {
  successResponse,
  errorResponse,
  paginatedResponse,
  notFoundResponse,
} from "@/shared/api/response";
import { requireAuth, requireRole, hasRole, Role } from "@/shared/api/middleware";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/shared/utils/constants";
import {
  validateCreateUser,
  validateUpdateUser,
  validateUserListQuery,
  validateUserId,
  validateDepartment,
  validateDepartmentId,
  parseBulkImportCsv,
} from "./validators";
import { processBulkImport, validateImportFile } from "./bulk-import";
import {
  User,
  UserWithRelations,
  UserListItem,
  Department,
  DepartmentWithChildren,
  CreateUserRequest,
  UpdateUserRequest,
  UserListParams,
  UserRole,
} from "../types";

// ============================================================================
// User Handlers
// ============================================================================

/**
 * GET /api/users - List users with pagination and filters
 */
export async function getUsersHandler(request: NextRequest) {
  const auth = await requireRole("HR_ADMIN");

  const params = validateUserListQuery(request);
  const page = params.page ?? 1;
  const limit = Math.min(params.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  const offset = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (params.role) {
    where.role = params.role;
  }

  if (params.departmentId) {
    where.departmentId = params.departmentId;
  }

  if (params.isActive !== undefined) {
    where.isActive = params.isActive;
  }

  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { email: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        manager: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        _count: { select: { directReports: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const userList: UserListItem[] = users.map((user: {
    id: string;
    email: string;
    name: string;
    nameTh: string | null;
    role: string;
    department: { id: string; name: string } | null;
    manager: { id: string; name: string } | null;
    isActive: boolean;
    createdAt: Date;
  }) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    nameTh: user.nameTh ?? undefined,
    role: user.role as UserRole,
    department: user.department,
    manager: user.manager,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
  }));

  return paginatedResponse(userList, page, limit, total);
}

/**
 * GET /api/users/:id - Get user by ID
 */
export async function getUserHandler(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth();

  const userId = validateUserId(params.id);

  // Check access: HR Admin, own profile, or manager of user
  const isHrAdmin = hasRole(auth.role, "HR_ADMIN" as Role);
  const isOwnProfile = auth.userId === userId;

  let isManagerOfUser = false;
  if (!isHrAdmin && !isOwnProfile) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { managerId: true },
    });
    isManagerOfUser = user?.managerId === auth.userId;
  }

  if (!isHrAdmin && !isOwnProfile && !isManagerOfUser) {
    return errorResponse("FORBIDDEN", "Access denied", 403);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      manager: { select: { id: true, name: true, email: true } },
      department: { select: { id: true, name: true, nameTh: true } },
      _count: { select: { directReports: true } },
    },
  });

  if (!user) {
    return notFoundResponse("User");
  }

  return successResponse({
    id: user.id,
    email: user.email,
    name: user.name,
    nameTh: user.nameTh,
    role: user.role,
    managerId: user.managerId,
    manager: user.manager,
    departmentId: user.departmentId,
    department: user.department,
    language: user.language,
    isActive: user.isActive,
    directReportsCount: user._count.directReports,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  });
}

/**
 * POST /api/users - Create new user
 */
export async function createUserHandler(request: NextRequest) {
  const auth = await requireRole("HR_ADMIN");
  const data = await validateCreateUser(request);

  // Check for existing email
  const existing = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (existing) {
    return errorResponse("CONFLICT", "User with this email already exists", 409);
  }

  // Validate manager exists if provided
  if (data.managerId) {
    const manager = await prisma.user.findUnique({
      where: { id: data.managerId },
    });
    if (!manager) {
      return errorResponse("VALIDATION_ERROR", "Manager not found", 400);
    }
  }

  // Validate department exists if provided
  if (data.departmentId) {
    const department = await prisma.department.findUnique({
      where: { id: data.departmentId },
    });
    if (!department) {
      return errorResponse("VALIDATION_ERROR", "Department not found", 400);
    }
  }

  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      name: data.name,
      nameTh: data.nameTh,
      role: data.role as any,
      managerId: data.managerId,
      departmentId: data.departmentId,
      language: "en",
      isActive: true,
    },
    include: {
      manager: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
    },
  });

  // Audit log
  await logAudit({
    userId: auth.userId,
    action: "create",
    entityType: "User",
    entityId: user.id,
    oldValues: null,
    newValues: {
      email: user.email,
      name: user.name,
      role: user.role,
    },
    request,
  });

  return successResponse(user, 201);
}

/**
 * PUT /api/users/:id - Update user
 */
export async function updateUserHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole("HR_ADMIN");
  const userId = validateUserId(params.id);
  const data = await validateUpdateUser(request);

  // Get existing user
  const existing = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existing) {
    return notFoundResponse("User");
  }

  // Validate manager exists if provided
  if (data.managerId !== undefined && data.managerId !== null) {
    if (data.managerId === userId) {
      return errorResponse("VALIDATION_ERROR", "User cannot be their own manager", 400);
    }
    const manager = await prisma.user.findUnique({
      where: { id: data.managerId },
    });
    if (!manager) {
      return errorResponse("VALIDATION_ERROR", "Manager not found", 400);
    }
  }

  // Validate department exists if provided
  if (data.departmentId !== undefined && data.departmentId !== null) {
    const department = await prisma.department.findUnique({
      where: { id: data.departmentId },
    });
    if (!department) {
      return errorResponse("VALIDATION_ERROR", "Department not found", 400);
    }
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      nameTh: data.nameTh,
      role: data.role as any,
      managerId: data.managerId,
      departmentId: data.departmentId,
      isActive: data.isActive,
    },
    include: {
      manager: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
    },
  });

  // Audit log
  await logAudit({
    userId: auth.userId,
    action: "update",
    entityType: "User",
    entityId: user.id,
    oldValues: {
      name: existing.name,
      role: existing.role,
      managerId: existing.managerId,
      departmentId: existing.departmentId,
      isActive: existing.isActive,
    },
    newValues: {
      name: user.name,
      role: user.role,
      managerId: user.managerId,
      departmentId: user.departmentId,
      isActive: user.isActive,
    },
    request,
  });

  return successResponse(user);
}

/**
 * DELETE /api/users/:id - Soft delete user (deactivate)
 */
export async function deleteUserHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole("HR_ADMIN");
  const userId = validateUserId(params.id);

  // Prevent self-deletion
  if (auth.userId === userId) {
    return errorResponse("FORBIDDEN", "Cannot deactivate your own account", 403);
  }

  const existing = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existing) {
    return notFoundResponse("User");
  }

  // Soft delete by deactivating
  const user = await prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
  });

  // Audit log
  await logAudit({
    userId: auth.userId,
    action: "delete",
    entityType: "User",
    entityId: user.id,
    oldValues: { isActive: true },
    newValues: { isActive: false },
    request,
  });

  return successResponse({ id: user.id, isActive: false });
}

/**
 * POST /api/users/import - Bulk import users via CSV
 */
export async function bulkImportUsersHandler(request: NextRequest) {
  const auth = await requireRole("HR_ADMIN");

  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return errorResponse("VALIDATION_ERROR", "No file provided", 400);
  }

  const validation = validateImportFile(file);
  if (!validation.valid) {
    return errorResponse("VALIDATION_ERROR", validation.error!, 400);
  }

  const csvContent = await file.text();
  const { valid, errors: parseErrors } = parseBulkImportCsv(csvContent);

  if (parseErrors.length > 0 && valid.length === 0) {
    return errorResponse("VALIDATION_ERROR", "CSV parsing failed", 400, {
      errors: parseErrors,
    });
  }

  const result = await processBulkImport(valid, auth.userId);

  // Include parse errors in result
  result.errors = [...parseErrors.slice(0, 10), ...result.errors]; // Limit to first 10 parse errors

  return successResponse(result);
}

/**
 * PUT /api/users/:id/language - Update user language preference
 */
export async function updateUserLanguageHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  const userId = validateUserId(params.id);

  // Only allow own profile
  if (auth.userId !== userId) {
    return errorResponse("FORBIDDEN", "Can only update own language preference", 403);
  }

  const body = await request.json();
  const language = body.language;

  if (language !== "en" && language !== "th") {
    return errorResponse("VALIDATION_ERROR", "Language must be 'en' or 'th'", 400);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { language },
    select: { id: true, language: true },
  });

  return successResponse(user);
}

// ============================================================================
// Department Handlers
// ============================================================================

/**
 * GET /api/departments - List all departments
 */
export async function getDepartmentsHandler(request: NextRequest) {
  await requireAuth();

  const departments = await prisma.department.findMany({
    include: {
      _count: { select: { users: true } },
    },
    orderBy: { name: "asc" },
  });

  return successResponse(
    departments.map((dept: { id: string; name: string; nameTh: string | null; parentId: string | null; _count: { users: number }; createdAt: Date }) => ({
      id: dept.id,
      name: dept.name,
      nameTh: dept.nameTh,
      parentId: dept.parentId,
      employeeCount: dept._count.users,
      createdAt: dept.createdAt,
    }))
  );
}

/**
 * GET /api/departments/tree - Get department hierarchy tree
 */
export async function getDepartmentTreeHandler(request: NextRequest) {
  await requireAuth();

  const departments = await prisma.department.findMany({
    include: {
      _count: { select: { users: true } },
    },
    orderBy: { name: "asc" },
  });

  // Build tree structure
  const deptMap = new Map<string, DepartmentWithChildren>();
  const rootDepartments: DepartmentWithChildren[] = [];

  // First pass: create all nodes
  type DepartmentWithCount = { id: string; name: string; nameTh: string | null; parentId: string | null; _count: { users: number }; createdAt: Date; updatedAt: Date };
  departments.forEach((dept: DepartmentWithCount) => {
    deptMap.set(dept.id, {
      id: dept.id,
      name: dept.name,
      nameTh: dept.nameTh ?? undefined,
      parentId: dept.parentId ?? undefined,
      createdAt: dept.createdAt,
      updatedAt: dept.updatedAt,
      children: [],
      employeeCount: dept._count.users,
    });
  });

  // Second pass: build hierarchy
  departments.forEach((dept: DepartmentWithCount) => {
    const node = deptMap.get(dept.id)!;
    if (dept.parentId && deptMap.has(dept.parentId)) {
      deptMap.get(dept.parentId)!.children.push(node);
    } else {
      rootDepartments.push(node);
    }
  });

  return successResponse(rootDepartments);
}

/**
 * POST /api/departments - Create department
 */
export async function createDepartmentHandler(request: NextRequest) {
  const auth = await requireRole("HR_ADMIN");
  const data = await validateDepartment(request);

  // Validate parent exists if provided
  if (data.parentId) {
    const parent = await prisma.department.findUnique({
      where: { id: data.parentId },
    });
    if (!parent) {
      return errorResponse("VALIDATION_ERROR", "Parent department not found", 400);
    }
  }

  const department = await prisma.department.create({
    data: {
      name: data.name,
      nameTh: data.nameTh,
      parentId: data.parentId,
    },
  });

  // Audit log
  await logAudit({
    userId: auth.userId,
    action: "create",
    entityType: "Department",
    entityId: department.id,
    oldValues: null,
    newValues: { name: department.name },
    request,
  });

  return successResponse(department, 201);
}

/**
 * PUT /api/departments/:id - Update department
 */
export async function updateDepartmentHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole("HR_ADMIN");
  const departmentId = validateDepartmentId(params.id);
  const data = await validateDepartment(request);

  const existing = await prisma.department.findUnique({
    where: { id: departmentId },
  });

  if (!existing) {
    return notFoundResponse("Department");
  }

  // Prevent self-referencing parent
  if (data.parentId === departmentId) {
    return errorResponse("VALIDATION_ERROR", "Department cannot be its own parent", 400);
  }

  const department = await prisma.department.update({
    where: { id: departmentId },
    data: {
      name: data.name,
      nameTh: data.nameTh,
      parentId: data.parentId,
    },
  });

  // Audit log
  await logAudit({
    userId: auth.userId,
    action: "update",
    entityType: "Department",
    entityId: department.id,
    oldValues: { name: existing.name, parentId: existing.parentId },
    newValues: { name: department.name, parentId: department.parentId },
    request,
  });

  return successResponse(department);
}

/**
 * DELETE /api/departments/:id - Delete department (if no users assigned)
 */
export async function deleteDepartmentHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole("HR_ADMIN");
  const departmentId = validateDepartmentId(params.id);

  // Check for assigned users
  const usersCount = await prisma.user.count({
    where: { departmentId },
  });

  if (usersCount > 0) {
    return errorResponse(
      "CONFLICT",
      "Cannot delete department with assigned users",
      409,
      { assignedUsers: usersCount }
    );
  }

  // Check for child departments
  const childCount = await prisma.department.count({
    where: { parentId: departmentId },
  });

  if (childCount > 0) {
    return errorResponse(
      "CONFLICT",
      "Cannot delete department with child departments",
      409,
      { childDepartments: childCount }
    );
  }

  const existing = await prisma.department.findUnique({
    where: { id: departmentId },
  });

  if (!existing) {
    return notFoundResponse("Department");
  }

  await prisma.department.delete({
    where: { id: departmentId },
  });

  // Audit log
  await logAudit({
    userId: auth.userId,
    action: "delete",
    entityType: "Department",
    entityId: departmentId,
    oldValues: { name: existing.name },
    newValues: null,
    request,
  });

  return successResponse({ id: departmentId, deleted: true });
}
