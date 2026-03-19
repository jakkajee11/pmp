/**
 * Audit Log API Handlers
 *
 * Handlers for audit log endpoints - viewing, filtering, and exporting audit logs.
 *
 * Constitution: IV. Observability & Auditability
 * - 5-year audit log retention
 * - No PII in JSONB fields (use IDs only)
 * - Immutable audit records
 */

import { NextRequest } from "next/server";
import { prisma } from "../../../shared/lib/db";
import { auditLog, extractClientIp, extractUserAgent } from "../../../shared/lib/audit";
import {
  successResponse,
  errorResponse,
  forbiddenResponse,
} from "../../../shared/api/response";
import { hasRole, Role, getSessionUser } from "../../../shared/api/middleware";
import {
  AuditLog,
  AuditLogQueryParams,
  PaginatedAuditLogs,
  AuditLogStats,
  AuditEntityType,
  AuditAction,
  AuditLogQuerySchema,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from "../types";

// ============================================================================
// Audit Log Handlers
// ============================================================================

/**
 * GET /api/audit-logs - Get paginated audit logs
 * Access: HR_ADMIN, SUPER_ADMIN
 */
export async function getAuditLogsHandler(request: NextRequest) {
  const auth = await getSessionUser(request);
  if (!auth) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  // Check permissions - HR Admin or Super Admin only
  if (!hasRole(auth.role, "HR_ADMIN" as Role) && !hasRole(auth.role, "SUPER_ADMIN" as Role)) {
    return forbiddenResponse("Access denied. HR Admin or Super Admin role required.");
  }

  const { searchParams } = new URL(request.url);

  // Parse and validate query parameters
  const parseResult = AuditLogQuerySchema.safeParse({
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
    userId: searchParams.get("userId") ?? undefined,
    action: searchParams.get("action") ?? undefined,
    entityType: searchParams.get("entityType") ?? undefined,
    entityId: searchParams.get("entityId") ?? undefined,
    startDate: searchParams.get("startDate") ?? undefined,
    endDate: searchParams.get("endDate") ?? undefined,
    ipAddress: searchParams.get("ipAddress") ?? undefined,
    sortBy: searchParams.get("sortBy") ?? undefined,
    sortOrder: searchParams.get("sortOrder") ?? undefined,
  });

  if (!parseResult.success) {
    return errorResponse("VALIDATION_ERROR", parseResult.error.message, 400);
  }

  const params = parseResult.data;

  // Build where clause
  const where: Record<string, unknown> = {};

  if (params.userId) {
    where.userId = params.userId;
  }

  if (params.action) {
    where.action = params.action;
  }

  if (params.entityType) {
    where.entityType = params.entityType;
  }

  if (params.entityId) {
    where.entityId = params.entityId;
  }

  if (params.ipAddress) {
    where.ipAddress = { contains: params.ipAddress };
  }

  // Date range filter
  if (params.startDate || params.endDate) {
    where.createdAt = {};
    if (params.startDate) {
      (where.createdAt as Record<string, Date>).gte = params.startDate;
    }
    if (params.endDate) {
      (where.createdAt as Record<string, Date>).lte = params.endDate;
    }
  }

  // Calculate pagination
  const page = params.page ?? 1;
  const limit = Math.min(params.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  const skip = (page - 1) * limit;

  // Build orderBy
  const orderBy: Record<string, string> = {};
  orderBy[params.sortBy ?? "createdAt"] = params.sortOrder ?? "desc";

  // Execute queries in parallel
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  const response: PaginatedAuditLogs = {
    data: logs.map((log) => ({
      id: log.id,
      userId: log.userId,
      user: log.user ? {
        id: log.user.id,
        name: log.user.name,
        email: log.user.email,
        role: log.user.role,
      } : undefined,
      action: log.action as AuditAction,
      entityType: log.entityType as AuditEntityType,
      entityId: log.entityId,
      oldValues: log.oldValues as Record<string, unknown> | null,
      newValues: log.newValues as Record<string, unknown> | null,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
    },
  };

  // Audit log the view action
  await auditLog({
    userId: auth.userId,
    action: "view",
    entityType: "AuditLog",
    entityId: "list",
    newValues: { filters: params },
    ipAddress: extractClientIp(request.headers),
    userAgent: extractUserAgent(request.headers) ?? undefined,
  });

  return successResponse(response);
}

/**
 * GET /api/audit-logs/stats - Get audit log statistics
 * Access: HR_ADMIN, SUPER_ADMIN
 */
export async function getAuditLogStatsHandler(request: NextRequest) {
  const auth = await getSessionUser(request);
  if (!auth) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  if (!hasRole(auth.role, "HR_ADMIN" as Role) && !hasRole(auth.role, "SUPER_ADMIN" as Role)) {
    return forbiddenResponse("Access denied. HR Admin or Super Admin role required.");
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  // Build date filter
  const dateFilter: Record<string, Date> = {};
  if (startDate) {
    dateFilter.gte = new Date(startDate);
  }
  if (endDate) {
    dateFilter.lte = new Date(endDate);
  }

  const where = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

  // Get all logs for stats
  const logs = await prisma.auditLog.findMany({
    where,
    select: {
      action: true,
      entityType: true,
      userId: true,
      user: {
        select: { name: true },
      },
      createdAt: true,
    },
  });

  // Calculate statistics
  const byAction: Record<string, number> = {
    create: 0,
    update: 0,
    delete: 0,
    view: 0,
  };

  const byEntityType: Record<string, number> = {};
  const userCounts = new Map<string, { userName: string; count: number }>();
  const dailyCounts = new Map<string, number>();

  for (const log of logs) {
    // By action
    if (byAction[log.action] !== undefined) {
      byAction[log.action]++;
    }

    // By entity type
    if (!byEntityType[log.entityType]) {
      byEntityType[log.entityType] = 0;
    }
    byEntityType[log.entityType]++;

    // By user
    if (!userCounts.has(log.userId)) {
      userCounts.set(log.userId, {
        userName: log.user?.name ?? "Unknown",
        count: 0,
      });
    }
    userCounts.get(log.userId)!.count++;

    // Daily activity
    const dateKey = log.createdAt.toISOString().split("T")[0]!;
    dailyCounts.set(dateKey, (dailyCounts.get(dateKey) ?? 0) + 1);
  }

  // Sort and limit top users
  const byUser = Array.from(userCounts.entries())
    .map(([userId, data]) => ({
      userId,
      userName: data.userName,
      count: data.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Sort and format recent activity
  const recentActivity = Array.from(dailyCounts.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 30);

  const stats: AuditLogStats = {
    totalLogs: logs.length,
    byAction: byAction as Record<AuditAction, number>,
    byEntityType: byEntityType as Record<AuditEntityType, number>,
    byUser,
    recentActivity,
  };

  return successResponse(stats);
}

/**
 * GET /api/audit-logs/:id - Get single audit log detail
 * Access: HR_ADMIN, SUPER_ADMIN
 */
export async function getAuditLogDetailHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getSessionUser(request);
  if (!auth) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  if (!hasRole(auth.role, "HR_ADMIN" as Role) && !hasRole(auth.role, "SUPER_ADMIN" as Role)) {
    return forbiddenResponse("Access denied. HR Admin or Super Admin role required.");
  }

  const { id } = await params;

  const log = await prisma.auditLog.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  if (!log) {
    return errorResponse("NOT_FOUND", "Audit log not found", 404);
  }

  const response: AuditLog = {
    id: log.id,
    userId: log.userId,
    user: log.user ? {
      id: log.user.id,
      name: log.user.name,
      email: log.user.email,
    } : undefined,
    action: log.action as AuditAction,
    entityType: log.entityType as AuditEntityType,
    entityId: log.entityId,
    oldValues: log.oldValues as Record<string, unknown> | null,
    newValues: log.newValues as Record<string, unknown> | null,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    createdAt: log.createdAt,
  };

  return successResponse(response);
}

/**
 * GET /api/audit-logs/export - Export audit logs
 * Access: SUPER_ADMIN only (sensitive data)
 */
export async function exportAuditLogsHandler(request: NextRequest) {
  const auth = await getSessionUser(request);
  if (!auth) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  // Only Super Admin can export audit logs
  if (!hasRole(auth.role, "SUPER_ADMIN" as Role)) {
    return forbiddenResponse("Access denied. Super Admin role required for export.");
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "csv";

  // Build filters
  const where: Record<string, unknown> = {};

  const userId = searchParams.get("userId");
  if (userId) where.userId = userId;

  const action = searchParams.get("action");
  if (action) where.action = action;

  const entityType = searchParams.get("entityType");
  if (entityType) where.entityType = entityType;

  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) (where.createdAt as Record<string, Date>).gte = new Date(startDate);
    if (endDate) (where.createdAt as Record<string, Date>).lte = new Date(endDate);
  }

  // Get logs with user details
  const logs = await prisma.auditLog.findMany({
    where,
    include: {
      user: {
        select: {
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10000, // Limit to prevent memory issues
  });

  // Audit the export
  await auditLog({
    userId: auth.userId,
    action: "view",
    entityType: "AuditLog",
    entityId: "export",
    newValues: { format, filters: where, count: logs.length },
    ipAddress: extractClientIp(request.headers),
    userAgent: extractUserAgent(request.headers) ?? undefined,
  });

  if (format === "csv") {
    return exportAsCsv(logs);
  } else {
    return errorResponse("NOT_IMPLEMENTED", "PDF export not yet implemented", 501);
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Export audit logs as CSV
 */
function exportAsCsv(logs: Array<{
  id: string;
  userId: string;
  user: { name: string; email: string; role: string } | null;
  action: string;
  entityType: string;
  entityId: string;
  oldValues: unknown;
  newValues: unknown;
  ipAddress: string;
  userAgent: string | null;
  createdAt: Date;
}>): Response {
  const headers = [
    "ID",
    "Timestamp",
    "User Name",
    "User Email",
    "User Role",
    "Action",
    "Entity Type",
    "Entity ID",
    "Old Values",
    "New Values",
    "IP Address",
    "User Agent",
  ];

  const rows = logs.map((log) => [
    log.id,
    log.createdAt.toISOString(),
    log.user?.name ?? "Unknown",
    log.user?.email ?? "Unknown",
    log.user?.role ?? "Unknown",
    log.action,
    log.entityType,
    log.entityId,
    log.oldValues ? JSON.stringify(log.oldValues) : "",
    log.newValues ? JSON.stringify(log.newValues) : "",
    log.ipAddress,
    log.userAgent ?? "",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => {
        // Escape cells containing commas, quotes, or newlines
        const str = String(cell);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(",")
    ),
  ].join("\n");

  return new Response(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="audit_logs_${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
