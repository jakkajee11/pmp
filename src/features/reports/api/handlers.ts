/**
 * Report API Handlers
 *
 * Handlers for reports and analytics endpoints.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/shared/lib/db";
import { auditLog, extractClientIp, extractUserAgent } from "@/shared/lib/audit";
import {
  successResponse,
  errorResponse,
  forbiddenResponse,
} from "@/shared/api/response";
import { hasRole, Role } from "@/shared/api/middleware";
import {
  CompletionReport,
  CompletionReportParams,
  RatingDistributionReport,
  RatingDistributionParams,
  DetailedReport,
  RatingDistribution,
  ScoreRange,
  SCORE_RANGE_DEFAULTS,
} from "../types";
import { exportToCsv } from "./csv-export";
import { generatePdf } from "./pdf-generator";

// ============================================================================
// Report Handlers
// ============================================================================

/**
 * GET /api/reports/completion - Get completion rate report
 * Access: HR_ADMIN, SENIOR_MANAGER
 */
export async function getCompletionReportHandler(request: NextRequest) {
  const auth = await getAuthContext(request);
  if (!auth) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  // Check permissions - HR Admin or Senior Manager only
  if (!hasRole(auth.role, "HR_ADMIN" as Role) && !hasRole(auth.role, "SENIOR_MANAGER" as Role)) {
    return forbiddenResponse("Access denied. HR Admin or Senior Manager role required.");
  }

  const { searchParams } = new URL(request.url);
  const cycleId = searchParams.get("cycleId");
  const departmentId = searchParams.get("departmentId");

  if (!cycleId) {
    return errorResponse("VALIDATION_ERROR", "cycleId is required", 400);
  }

  // Verify cycle exists
  const cycle = await prisma.reviewCycle.findUnique({
    where: { id: cycleId },
    select: { id: true, name: true },
  });

  if (!cycle) {
    return errorResponse("NOT_FOUND", "Cycle not found", 404);
  }

  // Build user filter
  const userWhere: Record<string, unknown> = { isActive: true };
  if (departmentId) {
    userWhere.departmentId = departmentId;
  }

  // Get all active employees (optionally filtered by department)
  const employees = await prisma.user.findMany({
    where: userWhere,
    select: {
      id: true,
      departmentId: true,
      department: { select: { id: true, name: true } },
    },
  });

  const employeeIds = employees.map((e) => e.id);

  // Get all evaluations for these employees in this cycle
  const evaluations = await prisma.evaluation.findMany({
    where: {
      employeeId: { in: employeeIds },
      cycleId,
    },
    select: {
      employeeId: true,
      status: true,
      selfSubmittedAt: true,
      managerReviewedAt: true,
    },
  });

  // Group evaluations by employee
  const evaluationsByEmployee = new Map<string, typeof evaluations>();
  for (const eval_ of evaluations) {
    const existing = evaluationsByEmployee.get(eval_.employeeId) || [];
    existing.push(eval_);
    evaluationsByEmployee.set(eval_.employeeId, existing);
  }

  // Calculate overall statistics
  let selfEvalCompleted = 0;
  let managerReviewCompleted = 0;
  const statusCounts = {
    notStarted: 0,
    selfInProgress: 0,
    selfSubmitted: 0,
    managerInProgress: 0,
    completed: 0,
  };

  for (const employeeId of employeeIds) {
    const employeeEvals = evaluationsByEmployee.get(employeeId) || [];

    if (employeeEvals.length === 0) {
      statusCounts.notStarted++;
      continue;
    }

    // Determine overall status for this employee
    const statuses = employeeEvals.map((e) => e.status);
    const overallStatus = getOverallEmployeeStatus(statuses);

    switch (overallStatus) {
      case "NOT_STARTED":
        statusCounts.notStarted++;
        break;
      case "SELF_IN_PROGRESS":
      case "RETURNED":
        statusCounts.selfInProgress++;
        break;
      case "SELF_SUBMITTED":
        statusCounts.selfSubmitted++;
        selfEvalCompleted++;
        break;
      case "MANAGER_IN_PROGRESS":
        statusCounts.managerInProgress++;
        selfEvalCompleted++;
        break;
      case "COMPLETED":
        statusCounts.completed++;
        selfEvalCompleted++;
        managerReviewCompleted++;
        break;
    }
  }

  // Calculate by department
  const departmentMap = new Map<string, { total: number; selfCompleted: number; managerCompleted: number }>();

  for (const employee of employees) {
    const deptId = employee.departmentId || "unassigned";
    const deptName = employee.department?.name || "Unassigned";

    if (!departmentMap.has(deptId)) {
      departmentMap.set(deptId, {
        total: 0,
        selfCompleted: 0,
        managerCompleted: 0,
      });
    }

    const deptStats = departmentMap.get(deptId)!;
    deptStats.total++;

    const employeeEvals = evaluationsByEmployee.get(employee.id) || [];
    if (employeeEvals.length > 0) {
      const statuses = employeeEvals.map((e) => e.status);
      const overallStatus = getOverallEmployeeStatus(statuses);

      if (["SELF_SUBMITTED", "MANAGER_IN_PROGRESS", "COMPLETED"].includes(overallStatus)) {
        deptStats.selfCompleted++;
      }
      if (overallStatus === "COMPLETED") {
        deptStats.managerCompleted++;
      }
    }
  }

  const byDepartment = Array.from(departmentMap.entries()).map(([deptId, stats]) => ({
    department: {
      id: deptId,
      name: employees.find((e) => e.departmentId === deptId)?.department?.name || "Unassigned",
    },
    total: stats.total,
    selfEvalCompleted: stats.selfCompleted,
    managerReviewCompleted: stats.managerCompleted,
  }));

  const report: CompletionReport = {
    cycle: { id: cycle.id, name: cycle.name },
    overall: {
      totalEmployees: employeeIds.length,
      selfEvalCompleted,
      selfEvalPercentage: employeeIds.length > 0
        ? Math.round((selfEvalCompleted / employeeIds.length) * 100 * 10) / 10
        : 0,
      managerReviewCompleted,
      managerReviewPercentage: employeeIds.length > 0
        ? Math.round((managerReviewCompleted / employeeIds.length) * 100 * 10) / 10
        : 0,
    },
    byDepartment,
    byStatus: {
      notStarted: statusCounts.notStarted,
      selfInProgress: statusCounts.selfInProgress,
      selfSubmitted: statusCounts.selfSubmitted,
      managerInProgress: statusCounts.managerInProgress,
      completed: statusCounts.completed,
    },
    generatedAt: new Date(),
  };

  // Audit log
  await auditLog({
    userId: auth.userId,
    action: "view",
    entityType: "Report",
    entityId: `completion_${cycleId}`,
    newValues: { reportType: "completion", cycleId, departmentId },
    ipAddress: extractClientIp(request.headers),
    userAgent: extractUserAgent(request.headers) ?? undefined,
  });

  return successResponse(report);
}

/**
 * GET /api/reports/rating-distribution - Get rating distribution
 * Access: HR_ADMIN only
 */
export async function getRatingDistributionHandler(request: NextRequest) {
  const auth = await getAuthContext(request);
  if (!auth) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  // Check permissions - HR Admin only
  if (!hasRole(auth.role, "HR_ADMIN" as Role)) {
    return forbiddenResponse("Access denied. HR Admin role required.");
  }

  const { searchParams } = new URL(request.url);
  const cycleId = searchParams.get("cycleId");

  if (!cycleId) {
    return errorResponse("VALIDATION_ERROR", "cycleId is required", 400);
  }

  // Verify cycle exists
  const cycle = await prisma.reviewCycle.findUnique({
    where: { id: cycleId },
    select: { id: true, name: true, weightsConfig: true },
  });

  if (!cycle) {
    return errorResponse("NOT_FOUND", "Cycle not found", 404);
  }

  // Get all completed evaluations with manager ratings
  const evaluations = await prisma.evaluation.findMany({
    where: {
      cycleId,
      status: "COMPLETED",
      managerRating: { not: null },
    },
    select: {
      evaluationType: true,
      managerRating: true,
      employeeId: true,
    },
  });

  // Calculate KPI distribution
  const kpiEvals = evaluations.filter((e) => e.evaluationType === "KPI");
  const kpiDistribution: RatingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const eval_ of kpiEvals) {
    const rating = eval_.managerRating as number;
    kpiDistribution[rating as keyof RatingDistribution]++;
  }

  // Calculate Core Values distribution
  const coreValueEvals = evaluations.filter((e) => e.evaluationType === "CORE_VALUE");
  const coreValuesDistribution: RatingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const eval_ of coreValueEvals) {
    const rating = eval_.managerRating as number;
    coreValuesDistribution[rating as keyof RatingDistribution]++;
  }

  // Calculate final score distribution per employee
  const employeeScores = new Map<string, { kpiRatings: number[]; coreValueRatings: number[] }>();

  for (const eval_ of evaluations) {
    if (!employeeScores.has(eval_.employeeId)) {
      employeeScores.set(eval_.employeeId, { kpiRatings: [], coreValueRatings: [] });
    }

    const scores = employeeScores.get(eval_.employeeId)!;
    if (eval_.evaluationType === "KPI") {
      scores.kpiRatings.push(eval_.managerRating as number);
    } else {
      scores.coreValueRatings.push(eval_.managerRating as number);
    }
  }

  const weights = cycle.weightsConfig as { kpi: number; coreValues: number };
  const finalScores: number[] = [];

  for (const [, scores] of employeeScores) {
    if (scores.kpiRatings.length > 0 && scores.coreValueRatings.length > 0) {
      const kpiAvg = scores.kpiRatings.reduce((a, b) => a + b, 0) / scores.kpiRatings.length;
      const cvAvg = scores.coreValueRatings.reduce((a, b) => a + b, 0) / scores.coreValueRatings.length;
      const finalScore = kpiAvg * weights.kpi + cvAvg * weights.coreValues;
      finalScores.push(finalScore);
    }
  }

  // Create score ranges
  const scoreRanges: ScoreRange[] = SCORE_RANGE_DEFAULTS.map((range) => ({
    ...range,
    count: finalScores.filter((s) => s >= range.min && s < range.max + 0.01).length,
  }));

  const report: RatingDistributionReport = {
    cycle: { id: cycle.id, name: cycle.name },
    kpiDistribution,
    coreValuesDistribution,
    finalScoreDistribution: { ranges: scoreRanges },
    generatedAt: new Date(),
  };

  // Audit log
  await auditLog({
    userId: auth.userId,
    action: "view",
    entityType: "Report",
    entityId: `rating_distribution_${cycleId}`,
    newValues: { reportType: "ratingDistribution", cycleId },
    ipAddress: extractClientIp(request.headers),
    userAgent: extractUserAgent(request.headers) ?? undefined,
  });

  return successResponse(report);
}

/**
 * GET /api/reports/export/csv - Export report as CSV
 */
export async function exportCsvHandler(request: NextRequest) {
  const auth = await getAuthContext(request);
  if (!auth) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  if (!hasRole(auth.role, "HR_ADMIN" as Role)) {
    return forbiddenResponse("Access denied. HR Admin role required.");
  }

  const { searchParams } = new URL(request.url);
  const cycleId = searchParams.get("cycleId");
  const reportType = searchParams.get("reportType") as "completion" | "ratings" | "detailed";
  const departmentId = searchParams.get("departmentId");

  if (!cycleId || !reportType) {
    return errorResponse("VALIDATION_ERROR", "cycleId and reportType are required", 400);
  }

  const csvContent = await exportToCsv({
    cycleId,
    reportType,
    departmentId: departmentId || undefined,
  });

  // Audit log
  await auditLog({
    userId: auth.userId,
    action: "view",
    entityType: "Report",
    entityId: `export_csv_${cycleId}`,
    newValues: { reportType, cycleId, departmentId, format: "csv" },
    ipAddress: extractClientIp(request.headers),
    userAgent: extractUserAgent(request.headers) ?? undefined,
  });

  return new Response(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${reportType}_report_${cycleId}.csv"`,
    },
  });
}

/**
 * GET /api/reports/export/pdf - Export report as PDF
 */
export async function exportPdfHandler(request: NextRequest) {
  const auth = await getAuthContext(request);
  if (!auth) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  if (!hasRole(auth.role, "HR_ADMIN" as Role)) {
    return forbiddenResponse("Access denied. HR Admin role required.");
  }

  const { searchParams } = new URL(request.url);
  const cycleId = searchParams.get("cycleId");
  const reportType = searchParams.get("reportType") as "completion" | "ratings" | "detailed";
  const departmentId = searchParams.get("departmentId");

  if (!cycleId || !reportType) {
    return errorResponse("VALIDATION_ERROR", "cycleId and reportType are required", 400);
  }

  const pdfBuffer = await generatePdf({
    cycleId,
    reportType,
    departmentId: departmentId || undefined,
  });

  // Audit log
  await auditLog({
    userId: auth.userId,
    action: "view",
    entityType: "Report",
    entityId: `export_pdf_${cycleId}`,
    newValues: { reportType, cycleId, departmentId, format: "pdf" },
    ipAddress: extractClientIp(request.headers),
    userAgent: extractUserAgent(request.headers) ?? undefined,
  });

  return new Response(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${reportType}_report_${cycleId}.pdf"`,
    },
  });
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get authentication context from request
 */
async function getAuthContext(request: NextRequest): Promise<{
  userId: string;
  role: string;
} | null> {
  // Import auth from shared middleware
  const { getSessionUser } = await import("../../../shared/api/middleware");
  return getSessionUser(request);
}

/**
 * Determine overall status for an employee based on their evaluation statuses
 */
function getOverallEmployeeStatus(statuses: string[]): string {
  if (statuses.length === 0) return "NOT_STARTED";

  if (statuses.every((s) => s === "NOT_STARTED")) return "NOT_STARTED";
  if (statuses.some((s) => s === "RETURNED")) return "RETURNED";
  if (statuses.some((s) => s === "SELF_IN_PROGRESS")) return "SELF_IN_PROGRESS";
  if (statuses.every((s) => ["SELF_SUBMITTED", "MANAGER_IN_PROGRESS", "COMPLETED"].includes(s))) {
    if (statuses.every((s) => s === "COMPLETED")) return "COMPLETED";
    if (statuses.some((s) => s === "MANAGER_IN_PROGRESS")) return "MANAGER_IN_PROGRESS";
    return "SELF_SUBMITTED";
  }

  return "SELF_IN_PROGRESS";
}
