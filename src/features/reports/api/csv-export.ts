/**
 * CSV Export Service
 *
 * Generates CSV exports for reports.
 */

import { prisma } from "../../../shared/lib/db";
import { ReportType } from "../types";

interface ExportParams {
  cycleId: string;
  reportType: ReportType;
  departmentId?: string;
}

/**
 * Export report data to CSV format
 */
export async function exportToCsv(params: ExportParams): Promise<string> {
  switch (params.reportType) {
    case "completion":
      return generateCompletionCsv(params);
    case "ratings":
      return generateRatingsCsv(params);
    case "detailed":
      return generateDetailedCsv(params);
    default:
      throw new Error(`Unknown report type: ${params.reportType}`);
  }
}

/**
 * Generate completion report CSV
 */
async function generateCompletionCsv(params: ExportParams): Promise<string> {
  const { cycleId, departmentId } = params;

  // Get cycle info
  const cycle = await prisma.reviewCycle.findUnique({
    where: { id: cycleId },
    select: { name: true },
  });

  // Build user filter
  const userWhere: Record<string, unknown> = { isActive: true };
  if (departmentId) {
    userWhere.departmentId = departmentId;
  }

  // Get employees with their evaluation status
  const employees = await prisma.user.findMany({
    where: userWhere,
    select: {
      id: true,
      name: true,
      email: true,
      department: { select: { name: true } },
      manager: { select: { name: true } },
    },
  });

  const employeeIds = employees.map((e) => e.id);

  // Get evaluations
  const evaluations = await prisma.evaluation.findMany({
    where: {
      employeeId: { in: employeeIds },
      cycleId,
    },
    select: {
      employeeId: true,
      evaluationType: true,
      status: true,
      selfRating: true,
      managerRating: true,
    },
  });

  // Group by employee
  const evalByEmployee = new Map<string, typeof evaluations>();
  for (const eval_ of evaluations) {
    const existing = evalByEmployee.get(eval_.employeeId) || [];
    existing.push(eval_);
    evalByEmployee.set(eval_.employeeId, existing);
  }

  // Build CSV rows
  const rows: string[][] = [];
  const headers = [
    "Employee Name",
    "Email",
    "Department",
    "Manager",
    "Total Objectives",
    "KPI Self-Eval Completed",
    "KPI Manager Review Completed",
    "Core Values Self-Eval Completed",
    "Core Values Manager Review Completed",
    "Overall Status",
  ];
  rows.push(headers);

  for (const employee of employees) {
    const empEvals = evalByEmployee.get(employee.id) || [];
    const kpiEvals = empEvals.filter((e) => e.evaluationType === "KPI");
    const cvEvals = empEvals.filter((e) => e.evaluationType === "CORE_VALUE");

    const kpiSelfCompleted = kpiEvals.filter((e) => e.selfRating !== null).length;
    const kpiManagerCompleted = kpiEvals.filter((e) => e.managerRating !== null).length;
    const cvSelfCompleted = cvEvals.filter((e) => e.selfRating !== null).length;
    const cvManagerCompleted = cvEvals.filter((e) => e.managerRating !== null).length;

    const overallStatus = getOverallStatus(empEvals.map((e) => e.status));

    rows.push([
      escapeCsvField(employee.name),
      escapeCsvField(employee.email),
      escapeCsvField(employee.department?.name || "Unassigned"),
      escapeCsvField(employee.manager?.name || "N/A"),
      String(kpiEvals.length + cvEvals.length),
      `${kpiSelfCompleted}/${kpiEvals.length}`,
      `${kpiManagerCompleted}/${kpiEvals.length}`,
      `${cvSelfCompleted}/${cvEvals.length}`,
      `${cvManagerCompleted}/${cvEvals.length}`,
      overallStatus,
    ]);
  }

  // Add summary row
  rows.push([]);
  rows.push(["Summary"]);
  rows.push(["Cycle", cycle?.name || "Unknown"]);
  rows.push(["Total Employees", String(employees.length)]);
  rows.push(["Generated At", new Date().toISOString()]);

  return rows.map((row) => row.join(",")).join("\n");
}

/**
 * Generate ratings distribution CSV
 */
async function generateRatingsCsv(params: ExportParams): Promise<string> {
  const { cycleId } = params;

  // Get cycle info
  const cycle = await prisma.reviewCycle.findUnique({
    where: { id: cycleId },
    select: { name: true, weightsConfig: true },
  });

  // Get all completed evaluations
  const evaluations = await prisma.evaluation.findMany({
    where: {
      cycleId,
      status: "COMPLETED",
      managerRating: { not: null },
    },
    select: {
      employeeId: true,
      evaluationType: true,
      managerRating: true,
      employee: {
        select: {
          name: true,
          email: true,
          department: { select: { name: true } },
        },
      },
      objective: { select: { title: true, category: true } },
      coreValue: { select: { name: true } },
    },
  });

  // Build CSV rows
  const rows: string[][] = [];
  const headers = [
    "Employee Name",
    "Email",
    "Department",
    "Evaluation Type",
    "Item Name",
    "Category",
    "Manager Rating",
  ];
  rows.push(headers);

  for (const eval_ of evaluations) {
    rows.push([
      escapeCsvField(eval_.employee.name),
      escapeCsvField(eval_.employee.email),
      escapeCsvField(eval_.employee.department?.name || "Unassigned"),
      eval_.evaluationType === "KPI" ? "KPI" : "Core Value",
      escapeCsvField(eval_.objective?.title || eval_.coreValue?.name || "N/A"),
      escapeCsvField(eval_.objective?.category || "N/A"),
      String(eval_.managerRating),
    ]);
  }

  // Add distribution summary
  rows.push([]);
  rows.push(["KPI Rating Distribution"]);
  const kpiRatings = evaluations.filter((e) => e.evaluationType === "KPI").map((e) => e.managerRating as number);
  rows.push(["Rating 1", String(kpiRatings.filter((r) => r === 1).length)]);
  rows.push(["Rating 2", String(kpiRatings.filter((r) => r === 2).length)]);
  rows.push(["Rating 3", String(kpiRatings.filter((r) => r === 3).length)]);
  rows.push(["Rating 4", String(kpiRatings.filter((r) => r === 4).length)]);
  rows.push(["Rating 5", String(kpiRatings.filter((r) => r === 5).length)]);

  rows.push([]);
  rows.push(["Core Values Rating Distribution"]);
  const cvRatings = evaluations.filter((e) => e.evaluationType === "CORE_VALUE").map((e) => e.managerRating as number);
  rows.push(["Rating 1", String(cvRatings.filter((r) => r === 1).length)]);
  rows.push(["Rating 2", String(cvRatings.filter((r) => r === 2).length)]);
  rows.push(["Rating 3", String(cvRatings.filter((r) => r === 3).length)]);
  rows.push(["Rating 4", String(cvRatings.filter((r) => r === 4).length)]);
  rows.push(["Rating 5", String(cvRatings.filter((r) => r === 5).length)]);

  rows.push([]);
  rows.push(["Cycle", cycle?.name || "Unknown"]);
  rows.push(["Generated At", new Date().toISOString()]);

  return rows.map((row) => row.join(",")).join("\n");
}

/**
 * Generate detailed report CSV
 */
async function generateDetailedCsv(params: ExportParams): Promise<string> {
  const { cycleId, departmentId } = params;

  // Get cycle info
  const cycle = await prisma.reviewCycle.findUnique({
    where: { id: cycleId },
    select: { name: true, weightsConfig: true },
  });

  const weights = cycle?.weightsConfig as { kpi: number; coreValues: number } || { kpi: 0.8, coreValues: 0.2 };

  // Build user filter
  const userWhere: Record<string, unknown> = { isActive: true };
  if (departmentId) {
    userWhere.departmentId = departmentId;
  }

  // Get employees
  const employees = await prisma.user.findMany({
    where: userWhere,
    select: {
      id: true,
      name: true,
      email: true,
      department: { select: { name: true } },
      manager: { select: { name: true } },
    },
  });

  const employeeIds = employees.map((e) => e.id);

  // Get all evaluations
  const evaluations = await prisma.evaluation.findMany({
    where: {
      employeeId: { in: employeeIds },
      cycleId,
    },
    select: {
      employeeId: true,
      evaluationType: true,
      status: true,
      selfRating: true,
      managerRating: true,
      objective: { select: { id: true, title: true, category: true } },
      coreValue: { select: { id: true, name: true } },
    },
  });

  // Group by employee
  const evalByEmployee = new Map<string, typeof evaluations>();
  for (const eval_ of evaluations) {
    const existing = evalByEmployee.get(eval_.employeeId) || [];
    existing.push(eval_);
    evalByEmployee.set(eval_.employeeId, existing);
  }

  // Build CSV rows
  const rows: string[][] = [];
  const headers = [
    "Employee Name",
    "Email",
    "Department",
    "Manager",
    "Evaluation Type",
    "Item",
    "Category",
    "Self Rating",
    "Manager Rating",
    "Status",
  ];
  rows.push(headers);

  for (const employee of employees) {
    const empEvals = evalByEmployee.get(employee.id) || [];

    for (const eval_ of empEvals) {
      rows.push([
        escapeCsvField(employee.name),
        escapeCsvField(employee.email),
        escapeCsvField(employee.department?.name || "Unassigned"),
        escapeCsvField(employee.manager?.name || "N/A"),
        eval_.evaluationType === "KPI" ? "KPI" : "Core Value",
        escapeCsvField(eval_.objective?.title || eval_.coreValue?.name || "N/A"),
        escapeCsvField(eval_.objective?.category || "N/A"),
        eval_.selfRating !== null ? String(eval_.selfRating) : "N/A",
        eval_.managerRating !== null ? String(eval_.managerRating) : "N/A",
        eval_.status,
      ]);
    }

    // Add calculated scores row if employee has completed evaluations
    const kpiEvals = empEvals.filter((e) => e.evaluationType === "KPI" && e.managerRating !== null);
    const cvEvals = empEvals.filter((e) => e.evaluationType === "CORE_VALUE" && e.managerRating !== null);

    if (kpiEvals.length > 0 && cvEvals.length > 0) {
      const kpiAvg = kpiEvals.reduce((sum, e) => sum + (e.managerRating as number), 0) / kpiEvals.length;
      const cvAvg = cvEvals.reduce((sum, e) => sum + (e.managerRating as number), 0) / cvEvals.length;
      const finalScore = kpiAvg * weights.kpi + cvAvg * weights.coreValues;

      rows.push([
        escapeCsvField(employee.name),
        escapeCsvField(employee.email),
        escapeCsvField(employee.department?.name || "Unassigned"),
        escapeCsvField(employee.manager?.name || "N/A"),
        "CALCULATED SCORES",
        "",
        "",
        "",
        "",
        `KPI: ${kpiAvg.toFixed(2)}, Core Values: ${cvAvg.toFixed(2)}, Final: ${finalScore.toFixed(2)}`,
      ]);
    }

    // Add blank row between employees
    rows.push([]);
  }

  rows.push(["Cycle", cycle?.name || "Unknown"]);
  rows.push(["Generated At", new Date().toISOString()]);

  return rows.map((row) => row.join(",")).join("\n");
}

/**
 * Escape a field for CSV format
 */
function escapeCsvField(field: string): string {
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/**
 * Get overall status from list of statuses
 */
function getOverallStatus(statuses: string[]): string {
  if (statuses.length === 0) return "NOT_STARTED";
  if (statuses.every((s) => s === "NOT_STARTED")) return "NOT_STARTED";
  if (statuses.some((s) => s === "RETURNED")) return "RETURNED";
  if (statuses.some((s) => s === "SELF_IN_PROGRESS")) return "SELF_IN_PROGRESS";
  if (statuses.every((s) => s === "COMPLETED")) return "COMPLETED";
  if (statuses.some((s) => s === "MANAGER_IN_PROGRESS")) return "MANAGER_IN_PROGRESS";
  if (statuses.every((s) => ["SELF_SUBMITTED", "MANAGER_IN_PROGRESS", "COMPLETED"].includes(s))) {
    return "SELF_SUBMITTED";
  }
  return "IN_PROGRESS";
}
