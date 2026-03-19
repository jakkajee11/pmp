/**
 * Evaluation API Handlers
 *
 * CRUD operations for self-evaluation and manager review feature.
 */

import { NextRequest } from "next/server";
import { prisma } from "../../../shared/lib/db";
import { auditLog, extractClientIp, extractUserAgent } from "../../../shared/lib/audit";
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  conflictResponse,
} from "../../../shared/api/response";
import { requireAuth, requireRole, hasRole, Role } from "../../../shared/api/middleware";
import {
  validateEvaluationId,
  validateEvaluationListQuery,
  validateUpdateSelfEval,
  validateSubmitSelfEval,
  validateUpdateManagerReview,
  validateReturnEvaluation,
} from "./validators";
import {
  EvaluationWithRelations,
  EvaluationListItem,
  EvaluationStatus,
  UpdateSelfEvalRequest,
  UpdateManagerReviewRequest,
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

/**
 * Valid status transitions for self-evaluation
 */
const SELF_EVAL_TRANSITIONS: Record<EvaluationStatus, EvaluationStatus[]> = {
  NOT_STARTED: ["SELF_IN_PROGRESS"],
  SELF_IN_PROGRESS: ["SELF_IN_PROGRESS", "SELF_SUBMITTED"],
  SELF_SUBMITTED: ["MANAGER_IN_PROGRESS", "SELF_IN_PROGRESS"], // Can be returned
  MANAGER_IN_PROGRESS: ["COMPLETED", "SELF_IN_PROGRESS"], // Can be returned
  COMPLETED: [],
  RETURNED: ["SELF_IN_PROGRESS"],
};

// ============================================================================
// Evaluation Handlers
// ============================================================================

/**
 * GET /api/evaluations - List evaluations with filters
 */
export async function getEvaluationsHandler(request: NextRequest) {
  const auth = await requireAuth();
  const params = validateEvaluationListQuery(request);

  // Build where clause based on role
  const where: Record<string, unknown> = {};

  // HR Admin can see all, Managers see their team's, Employees see only their own
  if (!hasRole(auth.role, "HR_ADMIN" as Role) && !hasRole(auth.role, "HR_STAFF" as Role)) {
    if (hasRole(auth.role, "LINE_MANAGER" as Role) || hasRole(auth.role, "SENIOR_MANAGER" as Role)) {
      // Get direct reports
      const directReports = await prisma.user.findMany({
        where: { managerId: auth.userId, isActive: true },
        select: { id: true },
      });
      const directReportIds = directReports.map((u: { id: string }) => u.id);

      // Manager can see their own and their direct reports' evaluations
      where.OR = [
        { employeeId: auth.userId },
        { employeeId: { in: directReportIds } },
      ];
    } else {
      // Regular employee - only their own
      where.employeeId = auth.userId;
    }
  }

  if (params.cycleId) {
    where.cycleId = params.cycleId;
  }

  if (params.employeeId) {
    where.employeeId = params.employeeId;
  }

  if (params.status) {
    where.status = params.status;
  }

  if (params.type) {
    where.evaluationType = params.type;
  }

  const evaluations = await prisma.evaluation.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      employee: { select: { id: true, name: true } },
      cycle: { select: { id: true, name: true } },
      objective: { select: { id: true, title: true } },
      coreValue: { select: { id: true, name: true } },
    },
  });

  const evaluationList: EvaluationListItem[] = evaluations.map((eval_: {
    id: string;
    evaluationType: string;
    selfRating: number | null;
    managerRating: number | null;
    status: string;
    updatedAt: Date;
    employee: { id: string; name: string };
    cycle: { id: string; name: string };
    objective: { id: string; title: string } | null;
    coreValue: { id: string; name: string } | null;
  }) => ({
    id: eval_.id,
    employee: eval_.employee,
    cycle: eval_.cycle,
    evaluationType: eval_.evaluationType as "KPI" | "CORE_VALUE",
    objective: eval_.objective,
    coreValue: eval_.coreValue,
    selfRating: eval_.selfRating,
    managerRating: eval_.managerRating,
    status: eval_.status as EvaluationStatus,
    updatedAt: eval_.updatedAt.toISOString(),
  }));

  return successResponse({ evaluations: evaluationList });
}

/**
 * GET /api/evaluations/dashboard - Get dashboard data
 */
export async function getDashboardHandler(request: NextRequest) {
  const auth = await requireAuth();
  const { searchParams } = new URL(request.url);
  const cycleId = searchParams.get("cycleId");

  // Get active cycle
  const cycle = cycleId
    ? await prisma.reviewCycle.findUnique({ where: { id: cycleId } })
    : await prisma.reviewCycle.findFirst({ where: { status: "ACTIVE" } });

  if (!cycle) {
    return successResponse({ cycle: null, message: "No active cycle found" });
  }

  // Check if user is a manager
  const directReports = await prisma.user.findMany({
    where: { managerId: auth.userId, isActive: true },
    select: { id: true, name: true },
  });

  const isManager = directReports.length > 0;

  if (isManager) {
    // Return manager dashboard
    const teamData = await Promise.all(
      directReports.map(async (report: { id: string; name: string }) => {
        const evaluations = await prisma.evaluation.findMany({
          where: { employeeId: report.id, cycleId: cycle.id },
          select: { status: true },
        });

        const selfEvalStatus = getOverallSelfEvalStatus(evaluations);
        const managerReviewStatus = getOverallManagerReviewStatus(evaluations);
        const overallStatus = getOverallStatus(evaluations);

        return {
          id: report.id,
          name: report.name,
          selfEvalStatus,
          managerReviewStatus,
          overallStatus,
        };
      })
    );

    const pendingReviews = teamData.filter(
      (t) => t.managerReviewStatus === "SELF_SUBMITTED"
    ).length;
    const completedReviews = teamData.filter(
      (t) => t.overallStatus === "COMPLETED"
    ).length;

    return successResponse({
      cycle: {
        id: cycle.id,
        name: cycle.name,
        status: cycle.status,
      },
      team: teamData,
      pendingReviews,
      completedReviews,
    });
  } else {
    // Return employee dashboard
    const evaluations = await prisma.evaluation.findMany({
      where: { employeeId: auth.userId, cycleId: cycle.id },
      include: {
        objective: { select: { id: true, title: true, category: true } },
        coreValue: { select: { id: true, name: true } },
      },
    });

    const objectives = evaluations
      .filter((e: { objective: unknown }) => e.objective)
      .map((e: { id: string; status: string; selfRating: number | null; objective: { id: string; title: string; category: string } | null }) => ({
        id: e.id,
        title: e.objective!.title,
        category: e.objective!.category,
        evaluationStatus: e.status as EvaluationStatus,
        selfRating: e.selfRating,
      }));

    const coreValues = evaluations
      .filter((e: { coreValue: unknown }) => e.coreValue)
      .map((e: { id: string; status: string; selfRating: number | null; coreValue: { id: string; name: string } | null }) => ({
        id: e.id,
        name: e.coreValue!.name,
        evaluationStatus: e.status as EvaluationStatus,
        selfRating: e.selfRating,
      }));

    const overallStatus = getOverallStatus(evaluations);
    const canSubmit = evaluations.every(
      (e: { status: string; selfRating: number | null }) =>
        e.status !== "NOT_STARTED" && e.selfRating !== null
    );

    return successResponse({
      cycle: {
        id: cycle.id,
        name: cycle.name,
        status: cycle.status,
      },
      selfEvalDeadline: cycle.selfEvalDeadline.toISOString(),
      objectives,
      coreValues,
      overallStatus,
      canSubmit,
    });
  }
}

/**
 * GET /api/evaluations/:id - Get evaluation details
 */
export async function getEvaluationHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  const evaluationId = validateEvaluationId(params.id);

  const evaluation = await prisma.evaluation.findUnique({
    where: { id: evaluationId },
    include: {
      employee: { select: { id: true, name: true, email: true } },
      manager: { select: { id: true, name: true } },
      cycle: {
        select: {
          id: true,
          name: true,
          type: true,
          weightsConfig: true,
        },
      },
      objective: {
        select: {
          id: true,
          title: true,
          description: true,
          rating1Desc: true,
          rating2Desc: true,
          rating3Desc: true,
          rating4Desc: true,
          rating5Desc: true,
        },
      },
      coreValue: {
        select: {
          id: true,
          name: true,
          description: true,
          rating1Desc: true,
          rating2Desc: true,
          rating3Desc: true,
          rating4Desc: true,
          rating5Desc: true,
        },
      },
    },
  });

  if (!evaluation) {
    return notFoundResponse("Evaluation");
  }

  // Check access
  const isHrAdmin = hasRole(auth.role, "HR_ADMIN" as Role);
  const isEmployee = evaluation.employeeId === auth.userId;
  const isManager = evaluation.managerId === auth.userId;

  if (!isHrAdmin && !isEmployee && !isManager) {
    return errorResponse("FORBIDDEN", "Access denied", 403);
  }

  const response: EvaluationWithRelations = {
    ...evaluation,
    cycle: {
      ...evaluation.cycle,
      weightsConfig: evaluation.cycle.weightsConfig as { kpi: number; coreValues: number },
    },
    objective: evaluation.objective
      ? {
          id: evaluation.objective.id,
          title: evaluation.objective.title,
          description: evaluation.objective.description,
          ratingCriteria: {
            1: evaluation.objective.rating1Desc,
            2: evaluation.objective.rating2Desc,
            3: evaluation.objective.rating3Desc,
            4: evaluation.objective.rating4Desc,
            5: evaluation.objective.rating5Desc,
          },
        }
      : undefined,
    coreValue: evaluation.coreValue
      ? {
          id: evaluation.coreValue.id,
          name: evaluation.coreValue.name,
          description: evaluation.coreValue.description,
          ratingCriteria: {
            1: evaluation.coreValue.rating1Desc,
            2: evaluation.coreValue.rating2Desc,
            3: evaluation.coreValue.rating3Desc,
            4: evaluation.coreValue.rating4Desc,
            5: evaluation.coreValue.rating5Desc,
          },
        }
      : undefined,
  };

  return successResponse(response);
}

/**
 * PUT /api/evaluations/:id/self - Update self-evaluation
 */
export async function updateSelfEvalHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  const evaluationId = validateEvaluationId(params.id);
  const data = await validateUpdateSelfEval(request);

  const evaluation = await prisma.evaluation.findUnique({
    where: { id: evaluationId },
  });

  if (!evaluation) {
    return notFoundResponse("Evaluation");
  }

  // Check access - only the employee can update their self-evaluation
  if (evaluation.employeeId !== auth.userId) {
    return errorResponse("FORBIDDEN", "Can only update your own evaluation", 403);
  }

  // Check version for optimistic locking
  if (evaluation.version !== data.version) {
    return conflictResponse(
      "Evaluation has been modified by another user. Please refresh and try again.",
      { currentVersion: evaluation.version }
    );
  }

  // Check status - can only update if not submitted or returned
  const allowedStatuses: EvaluationStatus[] = [
    "NOT_STARTED",
    "SELF_IN_PROGRESS",
    "RETURNED",
  ];
  if (!allowedStatuses.includes(evaluation.status as EvaluationStatus)) {
    return errorResponse(
      "BUSINESS_RULE",
      "Cannot update self-evaluation after submission",
      422
    );
  }

  // Determine new status
  const newStatus: EvaluationStatus =
    evaluation.status === "NOT_STARTED" ? "SELF_IN_PROGRESS" : evaluation.status as EvaluationStatus;

  // Update evaluation
  const updated = await prisma.evaluation.update({
    where: { id: evaluationId },
    data: {
      selfRating: data.selfRating,
      selfComments: data.selfComments,
      status: newStatus,
      version: { increment: 1 },
    },
    include: {
      employee: { select: { id: true, name: true, email: true } },
      manager: { select: { id: true, name: true } },
      cycle: { select: { id: true, name: true } },
    },
  });

  // Audit log
  await logAudit({
    userId: auth.userId,
    action: "update",
    entityType: "Evaluation",
    entityId: evaluationId,
    oldValues: {
      selfRating: evaluation.selfRating,
      selfComments: evaluation.selfComments,
      status: evaluation.status,
    },
    newValues: {
      selfRating: updated.selfRating,
      selfComments: updated.selfComments,
      status: updated.status,
    },
    request,
  });

  return successResponse(updated);
}

/**
 * POST /api/evaluations/:id/self/submit - Submit self-evaluation
 */
export async function submitSelfEvalHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  const evaluationId = validateEvaluationId(params.id);
  const data = await validateSubmitSelfEval(request);

  const evaluation = await prisma.evaluation.findUnique({
    where: { id: evaluationId },
  });

  if (!evaluation) {
    return notFoundResponse("Evaluation");
  }

  // Check access
  if (evaluation.employeeId !== auth.userId) {
    return errorResponse("FORBIDDEN", "Can only submit your own evaluation", 403);
  }

  // Check version
  if (evaluation.version !== data.version) {
    return conflictResponse(
      "Evaluation has been modified. Please refresh and try again.",
      { currentVersion: evaluation.version }
    );
  }

  // Check status
  const allowedStatuses: EvaluationStatus[] = ["SELF_IN_PROGRESS", "RETURNED"];
  if (!allowedStatuses.includes(evaluation.status as EvaluationStatus)) {
    return errorResponse(
      "BUSINESS_RULE",
      "Self-evaluation already submitted",
      422
    );
  }

  // Check that self-rating is provided
  if (evaluation.selfRating === null) {
    return errorResponse(
      "VALIDATION_ERROR",
      "Self-rating is required before submission",
      400
    );
  }

  // Update evaluation
  const updated = await prisma.evaluation.update({
    where: { id: evaluationId },
    data: {
      status: "SELF_SUBMITTED",
      selfSubmittedAt: new Date(),
      version: { increment: 1 },
    },
    include: {
      employee: { select: { id: true, name: true, email: true } },
      manager: { select: { id: true, name: true } },
      cycle: { select: { id: true, name: true } },
    },
  });

  // Audit log
  await logAudit({
    userId: auth.userId,
    action: "update",
    entityType: "Evaluation",
    entityId: evaluationId,
    oldValues: { status: evaluation.status },
    newValues: { status: "SELF_SUBMITTED", submittedAt: updated.selfSubmittedAt },
    request,
  });

  return successResponse(updated);
}

/**
 * PUT /api/evaluations/:id/manager - Update manager review
 */
export async function updateManagerReviewHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  const evaluationId = validateEvaluationId(params.id);
  const data = await validateUpdateManagerReview(request);

  const evaluation = await prisma.evaluation.findUnique({
    where: { id: evaluationId },
  });

  if (!evaluation) {
    return notFoundResponse("Evaluation");
  }

  // Check access - only the assigned manager can update
  if (evaluation.managerId !== auth.userId) {
    return errorResponse(
      "FORBIDDEN",
      "Only the assigned manager can update this review",
      403
    );
  }

  // Check version
  if (evaluation.version !== data.version) {
    return conflictResponse(
      "Evaluation has been modified. Please refresh and try again.",
      { currentVersion: evaluation.version }
    );
  }

  // Check status - self-evaluation must be submitted
  const allowedStatuses: EvaluationStatus[] = [
    "SELF_SUBMITTED",
    "MANAGER_IN_PROGRESS",
  ];
  if (!allowedStatuses.includes(evaluation.status as EvaluationStatus)) {
    return errorResponse(
      "BUSINESS_RULE",
      "Self-evaluation must be submitted before manager review",
      422
    );
  }

  // Update evaluation
  const updated = await prisma.evaluation.update({
    where: { id: evaluationId },
    data: {
      managerRating: data.managerRating,
      managerFeedback: data.managerFeedback,
      status: "MANAGER_IN_PROGRESS",
      version: { increment: 1 },
    },
    include: {
      employee: { select: { id: true, name: true, email: true } },
      manager: { select: { id: true, name: true } },
      cycle: { select: { id: true, name: true } },
    },
  });

  // Audit log
  await logAudit({
    userId: auth.userId,
    action: "update",
    entityType: "Evaluation",
    entityId: evaluationId,
    oldValues: {
      managerRating: evaluation.managerRating,
      managerFeedback: evaluation.managerFeedback,
    },
    newValues: {
      managerRating: updated.managerRating,
      managerFeedback: updated.managerFeedback,
    },
    request,
  });

  return successResponse(updated);
}

/**
 * POST /api/evaluations/:id/manager/submit - Submit manager review
 */
export async function submitManagerReviewHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  const evaluationId = validateEvaluationId(params.id);
  const data = await validateSubmitSelfEval(request);

  const evaluation = await prisma.evaluation.findUnique({
    where: { id: evaluationId },
  });

  if (!evaluation) {
    return notFoundResponse("Evaluation");
  }

  // Check access
  if (evaluation.managerId !== auth.userId) {
    return errorResponse("FORBIDDEN", "Only the assigned manager can submit", 403);
  }

  // Check version
  if (evaluation.version !== data.version) {
    return conflictResponse(
      "Evaluation has been modified. Please refresh and try again.",
      { currentVersion: evaluation.version }
    );
  }

  // Check status
  if (evaluation.status !== "MANAGER_IN_PROGRESS") {
    return errorResponse(
      "BUSINESS_RULE",
      "Manager review must be in progress to submit",
      422
    );
  }

  // Check that manager rating is provided
  if (evaluation.managerRating === null) {
    return errorResponse(
      "VALIDATION_ERROR",
      "Manager rating is required before submission",
      400
    );
  }

  // Update evaluation
  const updated = await prisma.evaluation.update({
    where: { id: evaluationId },
    data: {
      status: "COMPLETED",
      managerReviewedAt: new Date(),
      version: { increment: 1 },
    },
    include: {
      employee: { select: { id: true, name: true, email: true } },
      manager: { select: { id: true, name: true } },
      cycle: { select: { id: true, name: true } },
    },
  });

  // Audit log
  await logAudit({
    userId: auth.userId,
    action: "update",
    entityType: "Evaluation",
    entityId: evaluationId,
    oldValues: { status: evaluation.status },
    newValues: { status: "COMPLETED", reviewedAt: updated.managerReviewedAt },
    request,
  });

  return successResponse(updated);
}

/**
 * POST /api/evaluations/:id/return - Return evaluation to employee
 */
export async function returnEvaluationHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  const evaluationId = validateEvaluationId(params.id);
  const data = await validateReturnEvaluation(request);

  const evaluation = await prisma.evaluation.findUnique({
    where: { id: evaluationId },
  });

  if (!evaluation) {
    return notFoundResponse("Evaluation");
  }

  // Check access - only the assigned manager can return
  if (evaluation.managerId !== auth.userId) {
    return errorResponse(
      "FORBIDDEN",
      "Only the assigned manager can return this evaluation",
      403
    );
  }

  // Check status - can return from SELF_SUBMITTED or MANAGER_IN_PROGRESS
  const allowedStatuses: EvaluationStatus[] = [
    "SELF_SUBMITTED",
    "MANAGER_IN_PROGRESS",
  ];
  if (!allowedStatuses.includes(evaluation.status as EvaluationStatus)) {
    return errorResponse(
      "BUSINESS_RULE",
      "Cannot return evaluation in current status",
      422
    );
  }

  // Update evaluation
  const updated = await prisma.evaluation.update({
    where: { id: evaluationId },
    data: {
      status: "RETURNED",
      version: { increment: 1 },
    },
    include: {
      employee: { select: { id: true, name: true, email: true } },
      manager: { select: { id: true, name: true } },
      cycle: { select: { id: true, name: true } },
    },
  });

  // Audit log with reason
  await logAudit({
    userId: auth.userId,
    action: "update",
    entityType: "Evaluation",
    entityId: evaluationId,
    oldValues: { status: evaluation.status },
    newValues: { status: "RETURNED", reason: data.reason },
    request,
  });

  return successResponse(updated);
}

/**
 * GET /api/evaluations/summary/:employeeId/:cycleId - Get evaluation summary
 */
export async function getEvaluationSummaryHandler(
  request: NextRequest,
  { params }: { params: { employeeId: string; cycleId: string } }
) {
  const auth = await requireAuth();
  const { employeeId, cycleId } = params;

  // Check access - HR Admin, the employee, or their manager
  const isHrAdmin = hasRole(auth.role, "HR_ADMIN" as Role);
  const isSelf = auth.userId === employeeId;

  let isManager = false;
  if (!isHrAdmin && !isSelf) {
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      select: { managerId: true },
    });
    isManager = employee?.managerId === auth.userId;
  }

  if (!isHrAdmin && !isSelf && !isManager) {
    return errorResponse("FORBIDDEN", "Access denied", 403);
  }

  // Get all evaluations for this employee/cycle
  const evaluations = await prisma.evaluation.findMany({
    where: { employeeId, cycleId },
    include: {
      objective: { select: { id: true, title: true } },
      coreValue: { select: { id: true, name: true } },
    },
  });

  // Get cycle weights
  const cycle = await prisma.reviewCycle.findUnique({
    where: { id: cycleId },
    select: { weightsConfig: true, name: true },
  });

  if (!cycle) {
    return notFoundResponse("Cycle");
  }

  // Calculate scores
  const kpiEvaluations = evaluations.filter((e: { objective: unknown }) => e.objective);
  const coreValueEvaluations = evaluations.filter((e: { coreValue: unknown }) => e.coreValue);

  const kpiManagerRatings = kpiEvaluations
    .map((e: { managerRating: number | null }) => e.managerRating)
    .filter((r: number | null): r is number => r !== null);
  const coreValueManagerRatings = coreValueEvaluations
    .map((e: { managerRating: number | null }) => e.managerRating)
    .filter((r: number | null): r is number => r !== null);

  const weights = cycle.weightsConfig as { kpi: number; coreValues: number };
  const kpiScore = kpiManagerRatings.length > 0
    ? kpiManagerRatings.reduce((a: number, b: number) => a + b, 0) / kpiManagerRatings.length
    : null;
  const coreValuesScore = coreValueManagerRatings.length > 0
    ? coreValueManagerRatings.reduce((a: number, b: number) => a + b, 0) / coreValueManagerRatings.length
    : null;

  let finalScore: number | null = null;
  if (kpiScore !== null && coreValuesScore !== null) {
    finalScore = kpiScore * weights.kpi + coreValuesScore * weights.coreValues;
  } else if (kpiScore !== null) {
    finalScore = kpiScore;
  } else if (coreValuesScore !== null) {
    finalScore = coreValuesScore;
  }

  return successResponse({
    employee: { id: employeeId },
    cycle: { id: cycleId, name: cycle.name },
    kpiEvaluations: kpiEvaluations.map((e: {
      objective: { id: string; title: string };
      selfRating: number | null;
      managerRating: number | null;
    }) => ({
      objective: e.objective,
      selfRating: e.selfRating,
      managerRating: e.managerRating,
    })),
    coreValueEvaluations: coreValueEvaluations.map((e: {
      coreValue: { id: string; name: string };
      selfRating: number | null;
      managerRating: number | null;
    }) => ({
      coreValue: e.coreValue,
      selfRating: e.selfRating,
      managerRating: e.managerRating,
    })),
    scores: {
      kpiScore: kpiScore ? Math.round(kpiScore * 100) / 100 : null,
      coreValuesScore: coreValuesScore ? Math.round(coreValuesScore * 100) / 100 : null,
      finalScore: finalScore ? Math.round(finalScore * 100) / 100 : null,
    },
    overallStatus: evaluations.length > 0 ? evaluations[0].status : null,
  });
}

// ============================================================================
// Helper Functions
// ============================================================================

function getOverallSelfEvalStatus(
  evaluations: { status: string }[]
): EvaluationStatus {
  if (evaluations.length === 0) return "NOT_STARTED";

  const statuses = evaluations.map((e) => e.status);

  if (statuses.every((s) => s === "NOT_STARTED")) return "NOT_STARTED";
  if (statuses.some((s) => s === "SELF_IN_PROGRESS")) return "SELF_IN_PROGRESS";
  if (statuses.every((s) => ["SELF_SUBMITTED", "MANAGER_IN_PROGRESS", "COMPLETED"].includes(s))) {
    return "SELF_SUBMITTED";
  }
  return "SELF_IN_PROGRESS";
}

function getOverallManagerReviewStatus(
  evaluations: { status: string }[]
): EvaluationStatus {
  if (evaluations.length === 0) return "NOT_STARTED";

  const statuses = evaluations.map((e) => e.status);

  if (statuses.every((s) => s === "COMPLETED")) return "COMPLETED";
  if (statuses.some((s) => s === "MANAGER_IN_PROGRESS")) return "MANAGER_IN_PROGRESS";
  if (statuses.every((s) => ["SELF_SUBMITTED"].includes(s))) return "SELF_SUBMITTED";
  return "NOT_STARTED";
}

function getOverallStatus(evaluations: { status: string }[]): EvaluationStatus {
  if (evaluations.length === 0) return "NOT_STARTED";

  const statuses = evaluations.map((e) => e.status);

  if (statuses.every((s) => s === "COMPLETED")) return "COMPLETED";
  if (statuses.some((s) => s === "MANAGER_IN_PROGRESS")) return "MANAGER_IN_PROGRESS";
  if (statuses.some((s) => s === "SELF_SUBMITTED")) return "SELF_SUBMITTED";
  if (statuses.some((s) => s === "SELF_IN_PROGRESS")) return "SELF_IN_PROGRESS";
  return "NOT_STARTED";
}

// ============================================================================
// Historical Records Handlers (US10)
// ============================================================================

/**
 * Historical evaluation record with cycle information
 */
export interface HistoricalEvaluation {
  cycle: {
    id: string;
    name: string;
    type: string;
    startDate: Date;
    endDate: Date;
  };
  employee: {
    id: string;
    name: string;
    email: string;
    department: string | null;
  };
  evaluations: Array<{
    id: string;
    evaluationType: "KPI" | "CORE_VALUE";
    objective?: { id: string; title: string; category: string };
    coreValue?: { id: string; name: string };
    selfRating: number | null;
    managerRating: number | null;
    status: string;
    selfSubmittedAt: Date | null;
    managerReviewedAt: Date | null;
  }>;
  scores: {
    kpiScore: number | null;
    coreValuesScore: number | null;
    finalScore: number | null;
  };
  overallComments?: string | null;
  bonusRecommendation?: string | null;
  salaryAdjustment?: string | null;
}

/**
 * GET /api/evaluations/history/:employeeId - Get historical evaluations for an employee
 */
export async function getEvaluationHistoryHandler(
  request: NextRequest,
  { params }: { params: { employeeId: string } }
) {
  const auth = await requireAuth();
  const { employeeId } = params;

  // Check access - HR Admin, the employee themselves, or their manager
  const isHrAdmin = hasRole(auth.role, "HR_ADMIN" as Role);
  const isSelf = auth.userId === employeeId;

  let isManager = false;
  if (!isHrAdmin && !isSelf) {
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      select: { managerId: true },
    });
    isManager = employee?.managerId === auth.userId;
  }

  if (!isHrAdmin && !isSelf && !isManager) {
    return errorResponse("FORBIDDEN", "Access denied", 403);
  }

  // Get all completed cycles with evaluations for this employee
  const completedCycles = await prisma.reviewCycle.findMany({
    where: { status: "CLOSED" },
    orderBy: { endDate: "desc" },
    select: {
      id: true,
      name: true,
      type: true,
      startDate: true,
      endDate: true,
      weightsConfig: true,
    },
  });

  const history: HistoricalEvaluation[] = [];

  for (const cycle of completedCycles) {
    // Get evaluations for this employee/cycle
    const evaluations = await prisma.evaluation.findMany({
      where: {
        employeeId,
        cycleId: cycle.id,
        status: "COMPLETED",
      },
      include: {
        objective: { select: { id: true, title: true, category: true } },
        coreValue: { select: { id: true, name: true } },
      },
    });

    // Skip cycles with no completed evaluations
    if (evaluations.length === 0) continue;

    // Get employee info
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        name: true,
        email: true,
        department: { select: { name: true } },
      },
    });

    // Get evaluation summary if exists
    const summary = await prisma.evaluationSummary.findUnique({
      where: {
        employeeId_cycleId: { employeeId, cycleId: cycle.id },
      },
    });

    // Calculate scores
    const kpiEvals = evaluations.filter((e) => e.evaluationType === "KPI");
    const coreValueEvals = evaluations.filter((e) => e.evaluationType === "CORE_VALUE");

    const kpiRatings = kpiEvals
      .map((e) => e.managerRating)
      .filter((r): r is number => r !== null);
    const coreValueRatings = coreValueEvals
      .map((e) => e.managerRating)
      .filter((r): r is number => r !== null);

    const weights = cycle.weightsConfig as { kpi: number; coreValues: number };
    const kpiScore = kpiRatings.length > 0
      ? kpiRatings.reduce((a, b) => a + b, 0) / kpiRatings.length
      : null;
    const coreValuesScore = coreValueRatings.length > 0
      ? coreValueRatings.reduce((a, b) => a + b, 0) / coreValueRatings.length
      : null;

    let finalScore: number | null = null;
    if (kpiScore !== null && coreValuesScore !== null) {
      finalScore = kpiScore * weights.kpi + coreValuesScore * weights.coreValues;
    } else if (kpiScore !== null) {
      finalScore = kpiScore;
    } else if (coreValuesScore !== null) {
      finalScore = coreValuesScore;
    }

    history.push({
      cycle: {
        id: cycle.id,
        name: cycle.name,
        type: cycle.type,
        startDate: cycle.startDate,
        endDate: cycle.endDate,
      },
      employee: {
        id: employee!.id,
        name: employee!.name,
        email: employee!.email,
        department: employee!.department?.name ?? null,
      },
      evaluations: evaluations.map((e) => ({
        id: e.id,
        evaluationType: e.evaluationType as "KPI" | "CORE_VALUE",
        objective: e.objective
          ? {
              id: e.objective.id,
              title: e.objective.title,
              category: e.objective.category,
            }
          : undefined,
        coreValue: e.coreValue
          ? { id: e.coreValue.id, name: e.coreValue.name }
          : undefined,
        selfRating: e.selfRating,
        managerRating: e.managerRating,
        status: e.status,
        selfSubmittedAt: e.selfSubmittedAt,
        managerReviewedAt: e.managerReviewedAt,
      })),
      scores: {
        kpiScore: kpiScore ? Math.round(kpiScore * 100) / 100 : null,
        coreValuesScore: coreValuesScore
          ? Math.round(coreValuesScore * 100) / 100
          : null,
        finalScore: finalScore ? Math.round(finalScore * 100) / 100 : null,
      },
      overallComments: summary?.overallComments,
      bonusRecommendation: summary?.bonusRecommendation,
      salaryAdjustment: summary?.salaryAdjustment,
    });
  }

  // Audit log
  await logAudit({
    userId: auth.userId,
    action: "view",
    entityType: "Evaluation",
    entityId: `history_${employeeId}`,
    newValues: { employeeId, cyclesReturned: history.length },
    request,
  });

  return successResponse({
    employee: {
      id: employeeId,
      name: history[0]?.employee.name,
      email: history[0]?.employee.email,
      department: history[0]?.employee.department,
    },
    history,
    totalCycles: history.length,
  });
}

/**
 * GET /api/evaluations/history/:employeeId/:cycleId - Get historical evaluation detail
 */
export async function getHistoricalEvaluationDetailHandler(
  request: NextRequest,
  { params }: { params: { employeeId: string; cycleId: string } }
) {
  const auth = await requireAuth();
  const { employeeId, cycleId } = params;

  // Check access
  const isHrAdmin = hasRole(auth.role, "HR_ADMIN" as Role);
  const isSelf = auth.userId === employeeId;

  let isManager = false;
  if (!isHrAdmin && !isSelf) {
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      select: { managerId: true },
    });
    isManager = employee?.managerId === auth.userId;
  }

  if (!isHrAdmin && !isSelf && !isManager) {
    return errorResponse("FORBIDDEN", "Access denied", 403);
  }

  // Verify cycle is closed
  const cycle = await prisma.reviewCycle.findUnique({
    where: { id: cycleId },
    select: {
      id: true,
      name: true,
      type: true,
      startDate: true,
      endDate: true,
      status: true,
      weightsConfig: true,
    },
  });

  if (!cycle) {
    return notFoundResponse("Cycle");
  }

  // Get all completed evaluations for this employee/cycle
  const evaluations = await prisma.evaluation.findMany({
    where: {
      employeeId,
      cycleId,
      status: "COMPLETED",
    },
    include: {
      objective: {
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          rating1Desc: true,
          rating2Desc: true,
          rating3Desc: true,
          rating4Desc: true,
          rating5Desc: true,
        },
      },
      coreValue: {
        select: {
          id: true,
          name: true,
          description: true,
          rating1Desc: true,
          rating2Desc: true,
          rating3Desc: true,
          rating4Desc: true,
          rating5Desc: true,
        },
      },
    },
  });

  // Get employee and manager info
  const employee = await prisma.user.findUnique({
    where: { id: employeeId },
    select: {
      id: true,
      name: true,
      email: true,
      department: { select: { name: true } },
      manager: { select: { id: true, name: true } },
    },
  });

  // Get evaluation summary
  const summary = await prisma.evaluationSummary.findUnique({
    where: {
      employeeId_cycleId: { employeeId, cycleId },
    },
  });

  // Calculate scores
  const kpiEvals = evaluations.filter((e) => e.evaluationType === "KPI");
  const coreValueEvals = evaluations.filter(
    (e) => e.evaluationType === "CORE_VALUE"
  );

  const kpiRatings = kpiEvals
    .map((e) => e.managerRating)
    .filter((r): r is number => r !== null);
  const coreValueRatings = coreValueEvals
    .map((e) => e.managerRating)
    .filter((r): r is number => r !== null);

  const weights = cycle.weightsConfig as { kpi: number; coreValues: number };
  const kpiScore = kpiRatings.length > 0
    ? kpiRatings.reduce((a, b) => a + b, 0) / kpiRatings.length
    : null;
  const coreValuesScore = coreValueRatings.length > 0
    ? coreValueRatings.reduce((a, b) => a + b, 0) / coreValueRatings.length
    : null;

  let finalScore: number | null = null;
  if (kpiScore !== null && coreValuesScore !== null) {
    finalScore = kpiScore * weights.kpi + coreValuesScore * weights.coreValues;
  } else if (kpiScore !== null) {
    finalScore = kpiScore;
  } else if (coreValuesScore !== null) {
    finalScore = coreValuesScore;
  }

  // Audit log
  await logAudit({
    userId: auth.userId,
    action: "view",
    entityType: "Evaluation",
    entityId: `history_${employeeId}_${cycleId}`,
    newValues: { employeeId, cycleId },
    request,
  });

  return successResponse({
    cycle: {
      id: cycle.id,
      name: cycle.name,
      type: cycle.type,
      startDate: cycle.startDate,
      endDate: cycle.endDate,
      status: cycle.status,
    },
    employee: {
      id: employee!.id,
      name: employee!.name,
      email: employee!.email,
      department: employee!.department?.name ?? null,
    },
    manager: employee!.manager,
    evaluations: evaluations.map((e) => ({
      id: e.id,
      evaluationType: e.evaluationType as "KPI" | "CORE_VALUE",
      objective: e.objective
        ? {
            id: e.objective.id,
            title: e.objective.title,
            description: e.objective.description,
            category: e.objective.category,
            ratingCriteria: {
              1: e.objective.rating1Desc,
              2: e.objective.rating2Desc,
              3: e.objective.rating3Desc,
              4: e.objective.rating4Desc,
              5: e.objective.rating5Desc,
            },
          }
        : undefined,
      coreValue: e.coreValue
        ? {
            id: e.coreValue.id,
            name: e.coreValue.name,
            description: e.coreValue.description,
            ratingCriteria: {
              1: e.coreValue.rating1Desc,
              2: e.coreValue.rating2Desc,
              3: e.coreValue.rating3Desc,
              4: e.coreValue.rating4Desc,
              5: e.coreValue.rating5Desc,
            },
          }
        : undefined,
      selfRating: e.selfRating,
      selfComments: e.selfComments,
      managerRating: e.managerRating,
      managerFeedback: e.managerFeedback,
      selfSubmittedAt: e.selfSubmittedAt,
      managerReviewedAt: e.managerReviewedAt,
    })),
    scores: {
      kpiScore: kpiScore ? Math.round(kpiScore * 100) / 100 : null,
      coreValuesScore: coreValuesScore
        ? Math.round(coreValuesScore * 100) / 100
        : null,
      finalScore: finalScore ? Math.round(finalScore * 100) / 100 : null,
      weights,
    },
    summary: summary
      ? {
          overallComments: summary.overallComments,
          bonusRecommendation: summary.bonusRecommendation,
          salaryAdjustment: summary.salaryAdjustment,
          finalizedAt: summary.finalizedAt,
        }
      : null,
  });
}

/**
 * GET /api/evaluations/history/compare/:employeeId - Compare scores across cycles
 */
export async function compareEvaluationHistoryHandler(
  request: NextRequest,
  { params }: { params: { employeeId: string } }
) {
  const auth = await requireAuth();
  const { employeeId } = params;

  // Check access
  const isHrAdmin = hasRole(auth.role, "HR_ADMIN" as Role);
  const isSelf = auth.userId === employeeId;

  let isManager = false;
  if (!isHrAdmin && !isSelf) {
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      select: { managerId: true },
    });
    isManager = employee?.managerId === auth.userId;
  }

  if (!isHrAdmin && !isSelf && !isManager) {
    return errorResponse("FORBIDDEN", "Access denied", 403);
  }

  // Get all evaluation summaries for this employee
  const summaries = await prisma.evaluationSummary.findMany({
    where: { employeeId },
    include: {
      cycle: {
        select: {
          id: true,
          name: true,
          type: true,
          startDate: true,
          endDate: true,
        },
      },
    },
    orderBy: { cycle: { endDate: "desc" } },
  });

  const comparison = summaries.map((s) => ({
    cycle: {
      id: s.cycle.id,
      name: s.cycle.name,
      type: s.cycle.type,
      endDate: s.cycle.endDate,
    },
    scores: {
      kpiScore: s.kpiScore ? Number(s.kpiScore) : null,
      coreValuesScore: s.coreValuesScore ? Number(s.coreValuesScore) : null,
      finalScore: s.finalScore ? Number(s.finalScore) : null,
    },
  }));

  // Calculate trends
  const finalScores = comparison
    .map((c) => c.scores.finalScore)
    .filter((s): s is number => s !== null);

  let trend: "improving" | "declining" | "stable" | "insufficient_data" =
    "insufficient_data";
  if (finalScores.length >= 2) {
    const latest = finalScores[0];
    const previous = finalScores[1];
    const diff = latest - previous;
    if (diff > 0.2) trend = "improving";
    else if (diff < -0.2) trend = "declining";
    else trend = "stable";
  }

  return successResponse({
    employeeId,
    comparison,
    trend,
    averageScore:
      finalScores.length > 0
        ? Math.round(
            (finalScores.reduce((a, b) => a + b, 0) / finalScores.length) * 100
          ) / 100
        : null,
  });
}
