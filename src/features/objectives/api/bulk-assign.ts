/**
 * Bulk Assignment Logic
 *
 * Handles bulk objective assignment to multiple employees.
 */

import { prisma } from "../../../shared/lib/db";
import { BulkAssignRequest, BulkAssignResult } from "../types";

/**
 * Process bulk objective assignment
 *
 * @param data - Bulk assignment request with objective template and assignee list
 * @param managerId - ID of the manager creating the objectives
 * @returns Result with created, skipped, and error counts
 */
export async function processBulkAssign(
  data: BulkAssignRequest,
  managerId: string
): Promise<BulkAssignResult> {
  const result: BulkAssignResult = {
    created: 0,
    skipped: 0,
    errors: [],
    objectives: [],
  };

  // Get manager's direct reports
  const directReports = await prisma.user.findMany({
    where: {
      managerId,
      isActive: true,
    },
    select: { id: true },
  });

  const directReportIds = new Set(directReports.map((u: { id: string }) => u.id));

  // Verify cycle exists
  const cycle = await prisma.reviewCycle.findUnique({
    where: { id: data.cycleId },
    select: { id: true, status: true },
  });

  if (!cycle) {
    throw new Error("Review cycle not found");
  }

  // Process each assignee
  for (const userId of data.assignedTo) {
    try {
      // Check if user is a direct report
      if (!directReportIds.has(userId)) {
        result.errors.push({
          userId,
          error: "User is not a direct report",
        });
        continue;
      }

      // Check if user already has an objective with the same title in this cycle
      const existingObjective = await prisma.objective.findFirst({
        where: {
          assignedTo: userId,
          cycleId: data.cycleId,
          title: data.title,
        },
      });

      if (existingObjective) {
        result.skipped++;
        continue;
      }

      // Create the objective
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
          assignedTo: userId,
          cycleId: data.cycleId,
          createdBy: managerId,
        },
        select: {
          id: true,
          assignedTo: true,
          title: true,
        },
      });

      result.created++;
      result.objectives.push({
        id: objective.id,
        assignedTo: objective.assignedTo,
        title: objective.title,
      });
    } catch (error) {
      result.errors.push({
        userId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return result;
}

/**
 * Validate that all assignees are direct reports of the manager
 *
 * @param userIds - List of user IDs to validate
 * @param managerId - Manager's user ID
 * @returns Object with valid IDs and invalid IDs
 */
export async function validateDirectReports(
  userIds: string[],
  managerId: string
): Promise<{ valid: string[]; invalid: string[] }> {
  const directReports = await prisma.user.findMany({
    where: {
      id: { in: userIds },
      managerId,
      isActive: true,
    },
    select: { id: true },
  });

  const validIds = new Set(directReports.map((u: { id: string }) => u.id));
  const invalid = userIds.filter((id: string) => !validIds.has(id));

  return {
    valid: Array.from(validIds) as string[],
    invalid,
  };
}
