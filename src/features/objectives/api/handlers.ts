/**
 * Objective API Handlers
 *
 * CRUD operations for objective assignment feature.
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
  validateObjectiveId,
  validateObjectiveListQuery,
  validateCreateObjective,
  validateUpdateObjective,
  validateBulkAssign,
  validateCopyObjective,
} from "./validators";
import { processBulkAssign, validateDirectReports } from "./bulk-assign";
import {
  ObjectiveWithRelations,
  ObjectiveListItem,
  CreateObjectiveRequest,
} from "../types";

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

// ============================================================================
// Objective Handlers
// ============================================================================

/**
 * GET /api/objectives - List objectives with filters
 */
export async function getObjectivesHandler(request: NextRequest) {
  const auth = await requireAuth();
  const params = validateObjectiveListQuery(request);

  // Build where clause based on role
  const where: Record<string, unknown> = {};

  // HR Admin can see all, Managers see their direct reports' objectives, Employees see only their own
  if (!hasRole(auth.role, "HR_ADMIN" as Role) && !hasRole(auth.role, "HR_STAFF" as Role)) {
    if (hasRole(auth.role, "LINE_MANAGER" as Role) || hasRole(auth.role, "SENIOR_MANAGER" as Role)) {
      // Get direct reports
      const directReports = await prisma.user.findMany({
        where: { managerId: auth.userId, isActive: true },
        select: { id: true },
      });
      const directReportIds = directReports.map((u: { id: string }) => u.id);
      directReportIds.push(auth.userId); // Include own objectives

      if (params.assignedTo && !directReportIds.includes(params.assignedTo)) {
        return errorResponse("FORBIDDEN", "Access denied to this employee's objectives", 403);
      }

      where.assignedTo = params.assignedTo || { in: directReportIds };
    } else {
      // Regular employee - only their own
      where.assignedTo = auth.userId;
    }
  } else {
    if (params.assignedTo) {
      where.assignedTo = params.assignedTo;
    }
  }

  if (params.cycleId) {
    where.cycleId = params.cycleId;
  }

  if (params.category) {
    where.category = params.category;
  }

  if (params.createdBy) {
    where.createdBy = params.createdBy;
  }

  const objectives = await prisma.objective.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      employee: { select: { id: true, name: true } },
      cycle: { select: { id: true, name: true } },
      evaluations: {
        select: { status: true },
        take: 1,
      },
    },
  });

  const objectiveList: ObjectiveListItem[] = objectives.map((obj: {
    id: string;
    title: string;
    description: string;
    keyResults: string | null;
    category: string;
    timeline: string;
    employee: { id: string; name: string };
    cycle: { id: string; name: string };
    evaluations: { status: string }[];
    createdAt: Date;
  }) => ({
    id: obj.id,
    title: obj.title,
    description: obj.description,
    keyResults: obj.keyResults ?? undefined,
    category: obj.category as any,
    timeline: obj.timeline,
    assignedTo: obj.employee,
    cycle: obj.cycle,
    evaluationStatus: obj.evaluations[0]?.status ?? "not_started",
    createdAt: obj.createdAt.toISOString(),
  }));

  return successResponse({ objectives: objectiveList });
}

/**
 * GET /api/objectives/:id - Get objective details
 */
export async function getObjectiveHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  const objectiveId = validateObjectiveId(params.id);

  const objective = await prisma.objective.findUnique({
    where: { id: objectiveId },
    include: {
      employee: { select: { id: true, name: true, email: true } },
      cycle: { select: { id: true, name: true, type: true } },
      creator: { select: { id: true, name: true } },
      documents: {
        select: { id: true, fileName: true, fileSize: true, uploadedAt: true },
        orderBy: { uploadedAt: "desc" },
      },
      evaluations: {
        select: {
          selfRating: true,
          selfComments: true,
          managerRating: true,
          managerFeedback: true,
          status: true,
        },
        take: 1,
      },
    },
  });

  if (!objective) {
    return notFoundResponse("Objective");
  }

  // Check access
  const isHrAdmin = hasRole(auth.role, "HR_ADMIN" as Role) || hasRole(auth.role, "HR_STAFF" as Role);
  const isAssignee = objective.assignedTo === auth.userId;
  const isCreator = objective.createdBy === auth.userId;

  let isManagerOfAssignee = false;
  if (!isHrAdmin && !isAssignee && !isCreator) {
    const assignee = await prisma.user.findUnique({
      where: { id: objective.assignedTo },
      select: { managerId: true },
    });
    isManagerOfAssignee = assignee?.managerId === auth.userId;
  }

  if (!isHrAdmin && !isAssignee && !isCreator && !isManagerOfAssignee) {
    return errorResponse("FORBIDDEN", "Access denied", 403);
  }

  const response: ObjectiveWithRelations = {
    id: objective.id,
    title: objective.title,
    description: objective.description,
    keyResults: objective.keyResults ?? undefined,
    category: objective.category as any,
    timeline: objective.timeline,
    rating1Desc: objective.rating1Desc,
    rating2Desc: objective.rating2Desc,
    rating3Desc: objective.rating3Desc,
    rating4Desc: objective.rating4Desc,
    rating5Desc: objective.rating5Desc,
    assignedTo: objective.assignedTo,
    cycleId: objective.cycleId,
    createdBy: objective.createdBy,
    createdAt: objective.createdAt,
    updatedAt: objective.updatedAt,
    employee: objective.employee,
    cycle: objective.cycle,
    creator: objective.creator,
    documents: objective.documents.map((d: { id: string; fileName: string; fileSize: number; uploadedAt: Date }) => ({
      id: d.id,
      fileName: d.fileName,
      fileSize: d.fileSize,
      uploadedAt: d.uploadedAt,
    })),
    evaluation: objective.evaluations[0]
      ? {
          selfRating: objective.evaluations[0].selfRating,
          selfComments: objective.evaluations[0].selfComments,
          managerRating: objective.evaluations[0].managerRating,
          managerFeedback: objective.evaluations[0].managerFeedback,
          status: objective.evaluations[0].status,
        }
      : undefined,
  };

  return successResponse(response);
}

/**
 * POST /api/objectives - Create new objective
 */
export async function createObjectiveHandler(request: NextRequest) {
  const auth = await requireRole("LINE_MANAGER");
  const data = await validateCreateObjective(request);

  // Verify assignee is a direct report
  const directReport = await prisma.user.findFirst({
    where: {
      id: data.assignedTo,
      managerId: auth.userId,
      isActive: true,
    },
  });

  // HR Admin can assign to anyone
  const isHrAdmin = hasRole(auth.role, "HR_ADMIN" as Role);
  if (!directReport && !isHrAdmin) {
    return errorResponse("FORBIDDEN", "Can only assign objectives to direct reports", 403);
  }

  // Verify cycle exists
  const cycle = await prisma.reviewCycle.findUnique({
    where: { id: data.cycleId },
  });

  if (!cycle) {
    return errorResponse("VALIDATION_ERROR", "Review cycle not found", 400);
  }

  const objective = await prisma.objective.create({
    data: {
      title: data.title,
      description: data.description,
      keyResults: data.keyResults,
      category: data.category as any,
      timeline: data.timeline,
      rating1Desc: data.rating1Desc,
      rating2Desc: data.rating2Desc,
      rating3Desc: data.rating3Desc,
      rating4Desc: data.rating4Desc,
      rating5Desc: data.rating5Desc,
      assignedTo: data.assignedTo,
      cycleId: data.cycleId,
      createdBy: auth.userId,
    },
    include: {
      employee: { select: { id: true, name: true, email: true } },
      cycle: { select: { id: true, name: true } },
    },
  });

  // Audit log
  await logAudit({
    userId: auth.userId,
    action: "create",
    entityType: "Objective",
    entityId: objective.id,
    oldValues: null,
    newValues: {
      title: objective.title,
      assignedTo: objective.assignedTo,
      cycleId: objective.cycleId,
    },
    request,
  });

  return successResponse(objective, 201);
}

/**
 * PUT /api/objectives/:id - Update objective
 */
export async function updateObjectiveHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  const objectiveId = validateObjectiveId(params.id);
  const data = await validateUpdateObjective(request);

  const existing = await prisma.objective.findUnique({
    where: { id: objectiveId },
    include: {
      evaluations: { select: { status: true } },
    },
  });

  if (!existing) {
    return notFoundResponse("Objective");
  }

  // Check if evaluation has started
  const hasEvaluation = existing.evaluations.length > 0 &&
    existing.evaluations[0].status !== "NOT_STARTED";

  if (hasEvaluation) {
    return errorResponse(
      "BUSINESS_RULE",
      "Cannot modify objective after evaluation has started",
      422
    );
  }

  // Check permission: creator, HR Admin, or manager of assignee
  const isHrAdmin = hasRole(auth.role, "HR_ADMIN" as Role);
  const isCreator = existing.createdBy === auth.userId;

  let isManagerOfAssignee = false;
  if (!isHrAdmin && !isCreator) {
    const assignee = await prisma.user.findUnique({
      where: { id: existing.assignedTo },
      select: { managerId: true },
    });
    isManagerOfAssignee = assignee?.managerId === auth.userId;
  }

  if (!isHrAdmin && !isCreator && !isManagerOfAssignee) {
    return errorResponse("FORBIDDEN", "Only the creator or HR Admin can update this objective", 403);
  }

  const objective = await prisma.objective.update({
    where: { id: objectiveId },
    data: {
      title: data.title,
      description: data.description,
      keyResults: data.keyResults,
      category: data.category as any,
      timeline: data.timeline,
      rating1Desc: data.rating1Desc,
      rating2Desc: data.rating2Desc,
      rating3Desc: data.rating3Desc,
      rating4Desc: data.rating4Desc,
      rating5Desc: data.rating5Desc,
    },
    include: {
      employee: { select: { id: true, name: true } },
      cycle: { select: { id: true, name: true } },
    },
  });

  // Audit log
  await logAudit({
    userId: auth.userId,
    action: "update",
    entityType: "Objective",
    entityId: objective.id,
    oldValues: {
      title: existing.title,
      description: existing.description,
      category: existing.category,
    },
    newValues: {
      title: objective.title,
      description: objective.description,
      category: objective.category,
    },
    request,
  });

  return successResponse(objective);
}

/**
 * DELETE /api/objectives/:id - Delete objective
 */
export async function deleteObjectiveHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  const objectiveId = validateObjectiveId(params.id);

  const existing = await prisma.objective.findUnique({
    where: { id: objectiveId },
    include: {
      evaluations: { select: { status: true } },
    },
  });

  if (!existing) {
    return notFoundResponse("Objective");
  }

  // Check if evaluation has started
  const hasEvaluation = existing.evaluations.length > 0 &&
    existing.evaluations[0].status !== "NOT_STARTED";

  if (hasEvaluation) {
    return errorResponse(
      "BUSINESS_RULE",
      "Cannot delete objective after evaluation has started",
      422
    );
  }

  // Check permission: creator or HR Admin
  const isHrAdmin = hasRole(auth.role, "HR_ADMIN" as Role);
  const isCreator = existing.createdBy === auth.userId;

  if (!isHrAdmin && !isCreator) {
    return errorResponse("FORBIDDEN", "Only the creator or HR Admin can delete this objective", 403);
  }

  await prisma.objective.delete({
    where: { id: objectiveId },
  });

  // Audit log
  await logAudit({
    userId: auth.userId,
    action: "delete",
    entityType: "Objective",
    entityId: objectiveId,
    oldValues: { title: existing.title, assignedTo: existing.assignedTo },
    newValues: null,
    request,
  });

  return successResponse({ id: objectiveId, deleted: true });
}

/**
 * POST /api/objectives/bulk - Bulk assign objectives
 */
export async function bulkAssignObjectivesHandler(request: NextRequest) {
  const auth = await requireRole("LINE_MANAGER");
  const data = await validateBulkAssign(request);

  try {
    const result = await processBulkAssign(data, auth.userId);

    // Audit log for bulk operation
    await logAudit({
      userId: auth.userId,
      action: "create",
      entityType: "Objective",
      entityId: "bulk",
      oldValues: null,
      newValues: {
        created: result.created,
        skipped: result.skipped,
        errors: result.errors.length,
        cycleId: data.cycleId,
      },
      request,
    });

    return successResponse(result, 201);
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse("VALIDATION_ERROR", error.message, 400);
    }
    throw error;
  }
}

/**
 * POST /api/objectives/:id/copy - Copy objective from template
 */
export async function copyObjectiveHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole("LINE_MANAGER");
  const sourceObjectiveId = validateObjectiveId(params.id);
  const data = await validateCopyObjective(request);

  // Get source objective
  const sourceObjective = await prisma.objective.findUnique({
    where: { id: sourceObjectiveId },
  });

  if (!sourceObjective) {
    return notFoundResponse("Source objective");
  }

  // Verify assignee is a direct report
  const isHrAdmin = hasRole(auth.role, "HR_ADMIN" as Role);
  const directReport = await prisma.user.findFirst({
    where: {
      id: data.assignedTo,
      managerId: auth.userId,
      isActive: true,
    },
  });

  if (!directReport && !isHrAdmin) {
    return errorResponse("FORBIDDEN", "Can only assign objectives to direct reports", 403);
  }

  // Verify cycle exists
  const cycle = await prisma.reviewCycle.findUnique({
    where: { id: data.cycleId },
  });

  if (!cycle) {
    return errorResponse("VALIDATION_ERROR", "Review cycle not found", 400);
  }

  // Create copied objective
  const objective = await prisma.objective.create({
    data: {
      title: sourceObjective.title,
      description: sourceObjective.description,
      keyResults: sourceObjective.keyResults,
      category: sourceObjective.category,
      timeline: sourceObjective.timeline,
      rating1Desc: sourceObjective.rating1Desc,
      rating2Desc: sourceObjective.rating2Desc,
      rating3Desc: sourceObjective.rating3Desc,
      rating4Desc: sourceObjective.rating4Desc,
      rating5Desc: sourceObjective.rating5Desc,
      assignedTo: data.assignedTo,
      cycleId: data.cycleId,
      createdBy: auth.userId,
    },
    include: {
      employee: { select: { id: true, name: true, email: true } },
      cycle: { select: { id: true, name: true } },
    },
  });

  // Audit log
  await logAudit({
    userId: auth.userId,
    action: "create",
    entityType: "Objective",
    entityId: objective.id,
    oldValues: null,
    newValues: {
      title: objective.title,
      assignedTo: objective.assignedTo,
      cycleId: objective.cycleId,
      copiedFrom: sourceObjectiveId,
    },
    request,
  });

  return successResponse(objective, 201);
}
