/**
 * Cycle API Handlers
 *
 * CRUD operations for review cycle management.
 */

import { NextRequest } from "next/server";
import { prisma } from "../../../shared/lib/db";
import { auditLog, extractClientIp, extractUserAgent } from "../../../shared/lib/audit";
import {
  successResponse,
  errorResponse,
  notFoundResponse,
} from "../../../shared/api/response";
import { requireAuth, requireRole, hasRole, Role } from "../../../shared/api/middleware";
import {
  validateCreateCycle,
  validateUpdateCycle,
  validateCycleListQuery,
  validateCycleId,
  validateDeadlineExtension,
  validateActivatePreconditions,
  validateClosePreconditions,
} from "./validators";
import {
  ReviewCycle,
  ReviewCycleWithStats,
  ReviewCycleListItem,
  CreateCycleRequest,
  UpdateCycleRequest,
  CycleListParams,
  DeadlineExtensionRequest,
  CycleStatus,
  CycleType,
} from "../types";

/**
 * Helper to log audit entries from request context
 */
async function logAudit(params: {
  userId: string;
  action: "create" | "update" | "delete" | "activate" | "close";
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

/**
 * Helper to calculate completion statistics for a cycle
 */
async function getCompletionStats(cycleId: string) {
  // Get total employees (active users with manager)
  const totalEmployees = await prisma.user.count({
    where: {
      isActive: true,
      managerId: { not: null },
    },
  });

  // Get self-evaluation completion count
  const selfEvalCompleted = await prisma.evaluation.count({
    where: {
      cycleId,
      selfSubmittedAt: { not: null },
    },
  });

  // Get manager review completion count
  const managerReviewCompleted = await prisma.evaluation.count({
    where: {
      cycleId,
      managerReviewedAt: { not: null },
    },
  });

  return {
    totalEmployees,
    selfEvalCompleted,
    managerReviewCompleted,
  };
}

/**
 * Transform cycle data to list item format
 */
function toCycleListItem(
  cycle: any,
  completionStats: { totalEmployees: number; selfEvalCompleted: number; managerReviewCompleted: number }
): ReviewCycleListItem {
  return {
    id: cycle.id,
    name: cycle.name,
    type: cycle.type as CycleType,
    startDate: cycle.startDate.toISOString().split("T")[0],
    endDate: cycle.endDate.toISOString().split("T")[0],
    status: cycle.status as CycleStatus,
    selfEvalDeadline: cycle.selfEvalDeadline.toISOString().split("T")[0],
    managerReviewDeadline: cycle.managerReviewDeadline.toISOString().split("T")[0],
    completionStats,
    createdAt: cycle.createdAt.toISOString(),
  };
}

// ============================================================================
// Cycle Handlers
// ============================================================================

/**
 * GET /api/cycles - List review cycles
 */
export async function getCyclesHandler(request: NextRequest) {
  await requireAuth();

  const params = validateCycleListQuery(request);
  const where: Record<string, unknown> = {};

  if (params.status) {
    where.status = params.status;
  }

  if (params.type) {
    where.type = params.type;
  }

  const cycles = await prisma.reviewCycle.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  // Get completion stats for each cycle
  const cyclesWithStats = await Promise.all(
    cycles.map(async (cycle) => {
      const stats = cycle.status === "ACTIVE" || cycle.status === "CLOSED"
        ? await getCompletionStats(cycle.id)
        : { totalEmployees: 0, selfEvalCompleted: 0, managerReviewCompleted: 0 };
      return toCycleListItem(cycle, stats);
    })
  );

  return successResponse({ cycles: cyclesWithStats });
}

/**
 * GET /api/cycles/active - Get currently active cycle
 */
export async function getActiveCycleHandler(request: NextRequest) {
  await requireAuth();

  const cycle = await prisma.reviewCycle.findFirst({
    where: { status: "ACTIVE" },
  });

  if (!cycle) {
    return notFoundResponse("Active cycle");
  }

  const stats = await getCompletionStats(cycle.id);

  return successResponse({
    ...toCycleListItem(cycle, stats),
    gracePeriodDays: cycle.gracePeriodDays,
    weightsConfig: cycle.weightsConfig,
  });
}

/**
 * GET /api/cycles/:id - Get cycle by ID
 */
export async function getCycleHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await requireAuth();

  const cycleId = validateCycleId(params.id);

  const cycle = await prisma.reviewCycle.findUnique({
    where: { id: cycleId },
  });

  if (!cycle) {
    return notFoundResponse("Cycle");
  }

  const stats = await getCompletionStats(cycleId);

  return successResponse({
    ...toCycleListItem(cycle, stats),
    gracePeriodDays: cycle.gracePeriodDays,
    weightsConfig: cycle.weightsConfig,
  });
}

/**
 * POST /api/cycles - Create new review cycle
 */
export async function createCycleHandler(request: NextRequest) {
  const auth = await requireRole("HR_ADMIN");
  const data = await validateCreateCycle(request);

  // Create cycle
  const cycle = await prisma.reviewCycle.create({
    data: {
      name: data.name,
      type: data.type as any,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      selfEvalDeadline: new Date(data.selfEvalDeadline),
      managerReviewDeadline: new Date(data.managerReviewDeadline),
      gracePeriodDays: data.gracePeriodDays ?? 0,
      weightsConfig: data.weightsConfig ?? { kpi: 0.8, coreValues: 0.2 },
      status: "DRAFT",
    },
  });

  // Audit log
  await logAudit({
    userId: auth.userId,
    action: "create",
    entityType: "ReviewCycle",
    entityId: cycle.id,
    oldValues: null,
    newValues: {
      name: cycle.name,
      type: cycle.type,
      startDate: cycle.startDate,
      endDate: cycle.endDate,
    },
    request,
  });

  return successResponse(
    {
      id: cycle.id,
      name: cycle.name,
      type: cycle.type,
      startDate: cycle.startDate.toISOString().split("T")[0],
      endDate: cycle.endDate.toISOString().split("T")[0],
      selfEvalDeadline: cycle.selfEvalDeadline.toISOString().split("T")[0],
      managerReviewDeadline: cycle.managerReviewDeadline.toISOString().split("T")[0],
      gracePeriodDays: cycle.gracePeriodDays,
      weightsConfig: cycle.weightsConfig,
      status: cycle.status,
      createdAt: cycle.createdAt.toISOString(),
    },
    201
  );
}

/**
 * PUT /api/cycles/:id - Update cycle (draft status only)
 */
export async function updateCycleHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole("HR_ADMIN");
  const cycleId = validateCycleId(params.id);
  const data = await validateUpdateCycle(request);

  // Get existing cycle
  const existing = await prisma.reviewCycle.findUnique({
    where: { id: cycleId },
  });

  if (!existing) {
    return notFoundResponse("Cycle");
  }

  // Check if cycle is in draft status
  if (existing.status !== "DRAFT") {
    return errorResponse(
      "BUSINESS_RULE",
      "Cannot update cycle that is not in draft status",
      422
    );
  }

  // Update cycle
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
  if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
  if (data.selfEvalDeadline !== undefined) updateData.selfEvalDeadline = new Date(data.selfEvalDeadline);
  if (data.managerReviewDeadline !== undefined) updateData.managerReviewDeadline = new Date(data.managerReviewDeadline);
  if (data.gracePeriodDays !== undefined) updateData.gracePeriodDays = data.gracePeriodDays;
  if (data.weightsConfig !== undefined) updateData.weightsConfig = data.weightsConfig;

  const cycle = await prisma.reviewCycle.update({
    where: { id: cycleId },
    data: updateData,
  });

  // Audit log
  await logAudit({
    userId: auth.userId,
    action: "update",
    entityType: "ReviewCycle",
    entityId: cycle.id,
    oldValues: {
      name: existing.name,
      type: existing.type,
    },
    newValues: {
      name: cycle.name,
      type: cycle.type,
    },
    request,
  });

  return successResponse({
    id: cycle.id,
    name: cycle.name,
    type: cycle.type,
    startDate: cycle.startDate.toISOString().split("T")[0],
    endDate: cycle.endDate.toISOString().split("T")[0],
    selfEvalDeadline: cycle.selfEvalDeadline.toISOString().split("T")[0],
    managerReviewDeadline: cycle.managerReviewDeadline.toISOString().split("T")[0],
    gracePeriodDays: cycle.gracePeriodDays,
    weightsConfig: cycle.weightsConfig,
    status: cycle.status,
  });
}

/**
 * POST /api/cycles/:id/activate - Activate cycle
 */
export async function activateCycleHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole("HR_ADMIN");
  const cycleId = validateCycleId(params.id);

  // Get existing cycle
  const existing = await prisma.reviewCycle.findUnique({
    where: { id: cycleId },
  });

  if (!existing) {
    return notFoundResponse("Cycle");
  }

  // Check for existing active cycle
  const activeCycle = await prisma.reviewCycle.findFirst({
    where: { status: "ACTIVE" },
  });

  // Validate preconditions
  const validation = validateActivatePreconditions(
    { status: existing.status, startDate: existing.startDate },
    !!activeCycle
  );

  if (!validation.valid) {
    return errorResponse("BUSINESS_RULE", validation.error!, 422);
  }

  // Activate cycle
  const cycle = await prisma.reviewCycle.update({
    where: { id: cycleId },
    data: { status: "ACTIVE" },
  });

  // Audit log
  await logAudit({
    userId: auth.userId,
    action: "activate",
    entityType: "ReviewCycle",
    entityId: cycle.id,
    oldValues: { status: "DRAFT" },
    newValues: { status: "ACTIVE" },
    request,
  });

  return successResponse({
    id: cycle.id,
    status: cycle.status,
  });
}

/**
 * POST /api/cycles/:id/close - Close cycle
 */
export async function closeCycleHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole("HR_ADMIN");
  const cycleId = validateCycleId(params.id);

  // Get existing cycle
  const existing = await prisma.reviewCycle.findUnique({
    where: { id: cycleId },
  });

  if (!existing) {
    return notFoundResponse("Cycle");
  }

  // Validate preconditions
  const validation = validateClosePreconditions({
    status: existing.status,
    endDate: existing.endDate,
  });

  if (!validation.valid) {
    return errorResponse("BUSINESS_RULE", validation.error!, 422);
  }

  // Close cycle
  const cycle = await prisma.reviewCycle.update({
    where: { id: cycleId },
    data: { status: "CLOSED" },
  });

  // Audit log
  await logAudit({
    userId: auth.userId,
    action: "close",
    entityType: "ReviewCycle",
    entityId: cycle.id,
    oldValues: { status: "ACTIVE" },
    newValues: { status: "CLOSED" },
    request,
  });

  return successResponse({
    id: cycle.id,
    status: cycle.status,
  });
}

/**
 * POST /api/cycles/:id/extensions - Grant deadline extension
 */
export async function grantExtensionHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole("HR_ADMIN");
  const cycleId = validateCycleId(params.id);
  const data = await validateDeadlineExtension(request);

  // Get existing cycle
  const cycle = await prisma.reviewCycle.findUnique({
    where: { id: cycleId },
  });

  if (!cycle) {
    return notFoundResponse("Cycle");
  }

  // Check cycle is active
  if (cycle.status !== "ACTIVE") {
    return errorResponse(
      "BUSINESS_RULE",
      "Can only extend deadlines for active cycles",
      422
    );
  }

  // Get current deadline
  const currentDeadline =
    data.extensionType === "self_eval"
      ? cycle.selfEvalDeadline
      : cycle.managerReviewDeadline;

  const newDeadline = new Date(data.newDeadline);

  // Validate new deadline is after current
  if (newDeadline <= currentDeadline) {
    return errorResponse(
      "BUSINESS_RULE",
      "New deadline must be after current deadline",
      422
    );
  }

  // Validate users exist
  const users = await prisma.user.findMany({
    where: { id: { in: data.userIds } },
    select: { id: true },
  });

  const foundUserIds = users.map((u) => u.id);
  const skippedUserIds = data.userIds.filter((id) => !foundUserIds.includes(id));

  // For now, we'll store extensions in audit log since there's no dedicated table
  // In a full implementation, you'd have a DeadlineExtension table

  // Log each extension
  await Promise.all(
    foundUserIds.map((userId) =>
      logAudit({
        userId: auth.userId,
        action: "update" as const,
        entityType: "DeadlineExtension",
        entityId: `${cycleId}:${userId}:${data.extensionType}`,
        oldValues: {
          userId,
          extensionType: data.extensionType,
          originalDeadline: currentDeadline.toISOString(),
        },
        newValues: {
          userId,
          extensionType: data.extensionType,
          newDeadline: newDeadline.toISOString(),
        },
        request,
      })
    )
  );

  return successResponse({
    granted: foundUserIds.length,
    skipped: skippedUserIds.length,
    extensions: foundUserIds.map((userId) => ({
      userId,
      extensionType: data.extensionType,
      newDeadline: newDeadline.toISOString(),
    })),
  });
}

/**
 * DELETE /api/cycles/:id - Delete cycle (draft status only, no evaluations)
 */
export async function deleteCycleHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole("HR_ADMIN");
  const cycleId = validateCycleId(params.id);

  // Get existing cycle
  const existing = await prisma.reviewCycle.findUnique({
    where: { id: cycleId },
  });

  if (!existing) {
    return notFoundResponse("Cycle");
  }

  // Check if cycle is in draft status
  if (existing.status !== "DRAFT") {
    return errorResponse(
      "BUSINESS_RULE",
      "Cannot delete cycle that is not in draft status",
      422
    );
  }

  // Check for existing evaluations
  const evaluationsCount = await prisma.evaluation.count({
    where: { cycleId },
  });

  if (evaluationsCount > 0) {
    return errorResponse(
      "CONFLICT",
      "Cannot delete cycle with existing evaluations",
      409,
      { evaluationsCount }
    );
  }

  // Delete cycle
  await prisma.reviewCycle.delete({
    where: { id: cycleId },
  });

  // Audit log
  await logAudit({
    userId: auth.userId,
    action: "delete",
    entityType: "ReviewCycle",
    entityId: cycleId,
    oldValues: { name: existing.name },
    newValues: null,
    request,
  });

  return successResponse({ id: cycleId, deleted: true });
}
