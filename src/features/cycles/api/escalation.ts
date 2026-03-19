/**
 * Escalation Logic for Overdue Reviews
 *
 * Handles escalation workflows when reviews become overdue:
 * - Self-evaluation overdue escalation
 * - Manager review overdue escalation
 * - Multi-level escalation (manager → senior manager → HR)
 * - Escalation tracking and audit logging
 *
 * Professional Corporate style: Navy blue (#1e3a5f), slate gray accents.
 */

import { prisma } from "@/shared/lib/db";
import { logger } from "@/shared/lib/logger";
import { auditLog } from "@/shared/lib/audit";
import { sendEmail, EmailTemplate } from "@/features/notifications/services/email";
import { sendTeamsNotification } from "@/features/notifications/services/teams";
import { sendSMS } from "@/features/notifications/services/sms";

// Escalation levels
export type EscalationLevel = 1 | 2 | 3;

export type EscalationType =
  | "self_eval_overdue"
  | "manager_review_overdue"
  | "cycle_deadline_missed";

export interface EscalationRecord {
  id: string;
  type: EscalationType;
  level: EscalationLevel;
  evaluationId: string;
  cycleId: string;
  employeeId: string;
  managerId?: string;
  seniorManagerId?: string;
  escalatedTo: string;
  escalatedBy: string;
  reason: string;
  actionTaken?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Escalation configuration
const ESCALATION_CONFIG = {
  self_eval_overdue: {
    level1: {
      delayDays: 0,
      notify: ["employee", "manager"],
      action: "reminder",
    },
    level2: {
      delayDays: 2,
      notify: ["manager", "senior_manager"],
      action: "manager_notification",
    },
    level3: {
      delayDays: 5,
      notify: ["hr"],
      action: "hr_escalation",
    },
  },
  manager_review_overdue: {
    level1: {
      delayDays: 0,
      notify: ["manager"],
      action: "reminder",
    },
    level2: {
      delayDays: 3,
      notify: ["senior_manager"],
      action: "senior_escalation",
    },
    level3: {
      delayDays: 7,
      notify: ["hr"],
      action: "hr_escalation",
    },
  },
};

/**
 * Process escalations for a cycle
 */
export async function processEscalations(cycleId: string): Promise<{
  processed: number;
  escalated: number;
  resolved: number;
}> {
  const result = { processed: 0, escalated: 0, resolved: 0 };

  // Get all pending escalations for the cycle
  const pendingEscalations = await getPendingEscalations(cycleId);

  for (const escalation of pendingEscalations) {
    result.processed++;

    const nextLevel = getNextEscalationLevel(escalation);

    if (nextLevel) {
      await executeEscalation(escalation, nextLevel);
      result.escalated++;
    }
  }

  // Check for new overdue items that need initial escalation
  const overdueItems = await findOverdueItems(cycleId);

  for (const item of overdueItems) {
    await createInitialEscalation(item);
    result.escalated++;
  }

  return result;
}

/**
 * Get pending escalations that need processing
 */
async function getPendingEscalations(cycleId: string): Promise<EscalationRecord[]> {
  // In a real implementation, this would query from database
  // For now, return empty array as escalations are stored in memory
  return [];
}

/**
 * Find overdue items that need initial escalation
 */
async function findOverdueItems(cycleId: string): Promise<
  Array<{
    type: EscalationType;
    evaluationId: string;
    employeeId: string;
    managerId?: string;
    seniorManagerId?: string;
    daysOverdue: number;
  }>
> {
  const cycle = await prisma.reviewCycle.findUnique({
    where: { id: cycleId },
  });

  if (!cycle) return [];

  const now = new Date();
  const overdueItems: Array<{
    type: EscalationType;
    evaluationId: string;
    employeeId: string;
    managerId?: string;
    seniorManagerId?: string;
    daysOverdue: number;
  }> = [];

  // Check for overdue self-evaluations
  if (cycle.selfEvalDeadline && new Date(cycle.selfEvalDeadline) < now) {
    const overdueEvals = await prisma.evaluation.findMany({
      where: {
        cycleId,
        status: { in: ["NOT_STARTED", "SELF_IN_PROGRESS"] },
      },
      include: {
        employee: {
          select: { id: true, managerId: true },
        },
      },
    });

    for (const eval_ of overdueEvals) {
      const daysOverdue = Math.floor(
        (now.getTime() - new Date(cycle.selfEvalDeadline).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Get senior manager
      let seniorManagerId: string | undefined;
      if (eval_.employee.managerId) {
        const manager = await prisma.user.findUnique({
          where: { id: eval_.employee.managerId },
          select: { managerId: true },
        });
        seniorManagerId = manager?.managerId || undefined;
      }

      overdueItems.push({
        type: "self_eval_overdue",
        evaluationId: eval_.id,
        employeeId: eval_.employeeId,
        managerId: eval_.employee.managerId || undefined,
        seniorManagerId,
        daysOverdue,
      });
    }
  }

  // Check for overdue manager reviews
  if (cycle.managerReviewDeadline && new Date(cycle.managerReviewDeadline) < now) {
    const overdueReviews = await prisma.evaluation.findMany({
      where: {
        cycleId,
        status: { in: ["SELF_SUBMITTED", "MANAGER_IN_PROGRESS"] },
      },
      include: {
        manager: {
          select: { id: true, managerId: true },
        },
      },
    });

    for (const review of overdueReviews) {
      const daysOverdue = Math.floor(
        (now.getTime() - new Date(cycle.managerReviewDeadline).getTime()) / (1000 * 60 * 60 * 24)
      );

      overdueItems.push({
        type: "manager_review_overdue",
        evaluationId: review.id,
        employeeId: review.employeeId,
        managerId: review.managerId || undefined,
        seniorManagerId: review.manager?.managerId || undefined,
        daysOverdue,
      });
    }
  }

  return overdueItems;
}

/**
 * Get next escalation level based on current state
 */
function getNextEscalationLevel(escalation: EscalationRecord): EscalationLevel | null {
  if (escalation.level >= 3) return null;

  const config = ESCALATION_CONFIG[escalation.type];
  const currentConfig = config[`level${escalation.level}` as keyof typeof config];
  const nextConfig = config[`level${escalation.level + 1}` as keyof typeof config];

  if (!nextConfig) return null;

  const daysSinceEscalation = Math.floor(
    (Date.now() - escalation.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceEscalation >= nextConfig.delayDays) {
    return (escalation.level + 1) as EscalationLevel;
  }

  return null;
}

/**
 * Create initial escalation for an overdue item
 */
async function createInitialEscalation(item: {
  type: EscalationType;
  evaluationId: string;
  employeeId: string;
  managerId?: string;
  seniorManagerId?: string;
  daysOverdue: number;
}): Promise<void> {
  const cycle = await prisma.evaluation.findUnique({
    where: { id: item.evaluationId },
    select: { cycleId: true },
  });

  if (!cycle) return;

  const escalation: EscalationRecord = {
    id: `esc_${Date.now()}_${item.evaluationId}`,
    type: item.type,
    level: 1,
    evaluationId: item.evaluationId,
    cycleId: cycle.cycleId,
    employeeId: item.employeeId,
    managerId: item.managerId,
    seniorManagerId: item.seniorManagerId,
    escalatedTo: item.managerId || "hr",
    escalatedBy: "system",
    reason: `${item.type.replace(/_/g, " ")} by ${item.daysOverdue} days`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await executeEscalation(escalation, 1);

  // Audit log
  await auditLog({
    action: "ESCALATION_CREATED",
    entityType: "Evaluation",
    entityId: item.evaluationId,
    details: {
      escalationType: item.type,
      level: 1,
      daysOverdue: item.daysOverdue,
    },
  });

  logger.info("Initial escalation created", {
    escalationId: escalation.id,
    type: item.type,
    employeeId: item.employeeId,
  });
}

/**
 * Execute escalation actions
 */
async function executeEscalation(
  escalation: EscalationRecord,
  level: EscalationLevel
): Promise<void> {
  const config = ESCALATION_CONFIG[escalation.type];
  const levelConfig = config[`level${level}` as keyof typeof config];

  if (!levelConfig) return;

  // Get users to notify
  const users = await getUsersToNotify(escalation, levelConfig.notify);

  // Send notifications
  for (const user of users) {
    if (!user.email) continue;

    try {
      await sendEmail({
        to: user.email,
        template: EmailTemplate.ESCALATION,
        data: {
          recipientName: user.name,
          escalationType: escalation.type.replace(/_/g, " "),
          level,
          employeeName: await getEmployeeName(escalation.employeeId),
          action: levelConfig.action,
          dashboardUrl: `${process.env.NEXTAUTH_URL}/evaluations`,
        },
      });

      logger.debug("Escalation email sent", {
        userId: user.id,
        level,
        type: escalation.type,
      });
    } catch (error) {
      logger.error("Failed to send escalation email", {
        userId: user.id,
        error,
      });
    }
  }

  // Send Teams notification for higher levels
  if (level >= 2) {
    try {
      await sendTeamsNotification({
        title: `Performance Review Escalation - Level ${level}`,
        message: `An escalation has been triggered for ${escalation.type.replace(/_/g, " ")}. Immediate attention required.`,
        urgency: level === 3 ? "high" : "medium",
      });
    } catch (error) {
      logger.error("Failed to send Teams notification", { error });
    }
  }

  // Send SMS for level 3
  if (level === 3) {
    const hrAdmins = await prisma.user.findMany({
      where: { role: { in: ["HR_ADMIN", "SUPER_ADMIN"] } },
      select: { id: true, phone: true },
    });

    for (const hr of hrAdmins) {
      if (!hr.phone) continue;

      try {
        await sendSMS({
          to: hr.phone,
          message: `URGENT: Performance Review escalation Level 3. Check dashboard immediately.`,
        });
      } catch (error) {
        logger.error("Failed to send escalation SMS", { error });
      }
    }
  }

  // Update escalation record
  escalation.level = level;
  escalation.updatedAt = new Date();
  escalation.actionTaken = levelConfig.action;

  logger.info("Escalation executed", {
    escalationId: escalation.id,
    level,
    action: levelConfig.action,
  });
}

/**
 * Get users to notify based on notification targets
 */
async function getUsersToNotify(
  escalation: EscalationRecord,
  targets: string[]
): Promise<Array<{ id: string; name: string; email: string | null }>> {
  const users: Array<{ id: string; name: string; email: string | null }> = [];

  for (const target of targets) {
    switch (target) {
      case "employee":
        const employee = await prisma.user.findUnique({
          where: { id: escalation.employeeId },
          select: { id: true, name: true, email: true },
        });
        if (employee) users.push(employee);
        break;

      case "manager":
        if (escalation.managerId) {
          const manager = await prisma.user.findUnique({
            where: { id: escalation.managerId },
            select: { id: true, name: true, email: true },
          });
          if (manager) users.push(manager);
        }
        break;

      case "senior_manager":
        if (escalation.seniorManagerId) {
          const seniorManager = await prisma.user.findUnique({
            where: { id: escalation.seniorManagerId },
            select: { id: true, name: true, email: true },
          });
          if (seniorManager) users.push(seniorManager);
        }
        break;

      case "hr":
        const hrAdmins = await prisma.user.findMany({
          where: { role: { in: ["HR_ADMIN", "SUPER_ADMIN"] } },
          select: { id: true, name: true, email: true },
        });
        users.push(...hrAdmins);
        break;
    }
  }

  return users;
}

/**
 * Get employee name by ID
 */
async function getEmployeeName(employeeId: string): Promise<string> {
  const employee = await prisma.user.findUnique({
    where: { id: employeeId },
    select: { name: true },
  });
  return employee?.name || "Unknown Employee";
}

/**
 * Resolve an escalation
 */
export async function resolveEscalation(
  escalationId: string,
  resolvedBy: string,
  resolution: string
): Promise<void> {
  // In a real implementation, update the escalation record in database

  await auditLog({
    action: "ESCALATION_RESOLVED",
    entityType: "Escalation",
    entityId: escalationId,
    userId: resolvedBy,
    details: {
      resolution,
    },
  });

  logger.info("Escalation resolved", {
    escalationId,
    resolvedBy,
    resolution,
  });
}

/**
 * Get escalation statistics for a cycle
 */
export async function getEscalationStats(cycleId: string): Promise<{
  totalEscalations: number;
  byLevel: Record<string, number>;
  byType: Record<string, number>;
  unresolved: number;
}> {
  // In a real implementation, query from database
  // Return mock data for now
  return {
    totalEscalations: 0,
    byLevel: { level1: 0, level2: 0, level3: 0 },
    byType: { self_eval_overdue: 0, manager_review_overdue: 0 },
    unresolved: 0,
  };
}

export default {
  processEscalations,
  resolveEscalation,
  getEscalationStats,
};
