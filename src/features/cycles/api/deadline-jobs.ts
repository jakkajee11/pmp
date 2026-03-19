/**
 * Deadline Job Scheduler
 *
 * Handles scheduled jobs for review cycle deadlines:
 * - Self-evaluation deadline reminders
 * - Manager review deadline reminders
 * - Deadline escalation notifications
 * - Cycle closure processing
 *
 * Professional Corporate style: Navy blue (#1e3a5f), slate gray accents.
 */

import { prisma } from "@/shared/lib/db";
import { logger } from "@/shared/lib/logger";
import { sendEmail, EmailTemplate } from "@/features/notifications/services/email";
import { sendTeamsNotification } from "@/features/notifications/services/teams";

// Job types
export type JobType =
  | "self_eval_reminder"
  | "self_eval_deadline"
  | "manager_review_reminder"
  | "manager_review_deadline"
  | "escalation"
  | "cycle_closure";

export interface ScheduledJob {
  id: string;
  type: JobType;
  cycleId: string;
  scheduledAt: Date;
  processedAt?: Date;
  status: "pending" | "processing" | "completed" | "failed";
  error?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

// In-memory job queue (for MVP; replace with proper job queue in production)
const jobQueue: Map<string, ScheduledJob> = new Map();
let schedulerInterval: NodeJS.Timeout | null = null;

/**
 * Start the deadline scheduler
 */
export function startScheduler(intervalMs: number = 60000): void {
  if (schedulerInterval) {
    logger.warn("Scheduler already running");
    return;
  }

  logger.info("Starting deadline scheduler", { intervalMs });

  // Process jobs every minute
  schedulerInterval = setInterval(async () => {
    try {
      await processPendingJobs();
    } catch (error) {
      logger.error("Scheduler processing error", { error });
    }
  }, intervalMs);

  // Initial scheduling
  scheduleUpcomingJobs().catch((error) => {
    logger.error("Failed to schedule upcoming jobs", { error });
  });
}

/**
 * Stop the deadline scheduler
 */
export function stopScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    logger.info("Deadline scheduler stopped");
  }
}

/**
 * Schedule jobs for all active cycles
 */
export async function scheduleUpcomingJobs(): Promise<void> {
  try {
    const activeCycles = await prisma.reviewCycle.findMany({
      where: {
        status: "ACTIVE",
      },
    });

    for (const cycle of activeCycles) {
      await scheduleCycleJobs(cycle.id);
    }

    logger.info("Scheduled jobs for active cycles", {
      cycleCount: activeCycles.length,
    });
  } catch (error) {
    logger.error("Failed to schedule upcoming jobs", { error });
    throw error;
  }
}

/**
 * Schedule jobs for a specific cycle
 */
export async function scheduleCycleJobs(cycleId: string): Promise<void> {
  const cycle = await prisma.reviewCycle.findUnique({
    where: { id: cycleId },
  });

  if (!cycle) {
    logger.warn("Cycle not found for job scheduling", { cycleId });
    return;
  }

  const now = new Date();

  // Self-evaluation deadline jobs
  if (cycle.selfEvalDeadline && new Date(cycle.selfEvalDeadline) > now) {
    const deadline = new Date(cycle.selfEvalDeadline);

    // 3 days before deadline
    const threeDaysBefore = new Date(deadline);
    threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);
    if (threeDaysBefore > now) {
      await createJob({
        type: "self_eval_reminder",
        cycleId,
        scheduledAt: threeDaysBefore,
        metadata: { daysRemaining: 3 },
      });
    }

    // 1 day before deadline
    const oneDayBefore = new Date(deadline);
    oneDayBefore.setDate(oneDayBefore.getDate() - 1);
    if (oneDayBefore > now) {
      await createJob({
        type: "self_eval_reminder",
        cycleId,
        scheduledAt: oneDayBefore,
        metadata: { daysRemaining: 1 },
      });
    }

    // On deadline day
    await createJob({
      type: "self_eval_deadline",
      cycleId,
      scheduledAt: deadline,
    });
  }

  // Manager review deadline jobs
  if (cycle.managerReviewDeadline && new Date(cycle.managerReviewDeadline) > now) {
    const deadline = new Date(cycle.managerReviewDeadline);

    // 3 days before deadline
    const threeDaysBefore = new Date(deadline);
    threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);
    if (threeDaysBefore > now) {
      await createJob({
        type: "manager_review_reminder",
        cycleId,
        scheduledAt: threeDaysBefore,
        metadata: { daysRemaining: 3 },
      });
    }

    // 1 day before deadline
    const oneDayBefore = new Date(deadline);
    oneDayBefore.setDate(oneDayBefore.getDate() - 1);
    if (oneDayBefore > now) {
      await createJob({
        type: "manager_review_reminder",
        cycleId,
        scheduledAt: oneDayBefore,
        metadata: { daysRemaining: 1 },
      });
    }

    // On deadline day
    await createJob({
      type: "manager_review_deadline",
      cycleId,
      scheduledAt: deadline,
    });
  }
}

/**
 * Create a new scheduled job
 */
async function createJob(params: {
  type: JobType;
  cycleId: string;
  scheduledAt: Date;
  metadata?: Record<string, unknown>;
}): Promise<ScheduledJob> {
  const id = `${params.type}_${params.cycleId}_${params.scheduledAt.getTime()}`;

  // Check if job already exists
  if (jobQueue.has(id)) {
    return jobQueue.get(id)!;
  }

  const job: ScheduledJob = {
    id,
    type: params.type,
    cycleId: params.cycleId,
    scheduledAt: params.scheduledAt,
    status: "pending",
    metadata: params.metadata,
    createdAt: new Date(),
  };

  jobQueue.set(id, job);
  logger.debug("Job scheduled", { jobId: id, type: params.type });

  return job;
}

/**
 * Process pending jobs that are due
 */
async function processPendingJobs(): Promise<void> {
  const now = new Date();
  const pendingJobs = Array.from(jobQueue.values()).filter(
    (job) => job.status === "pending" && job.scheduledAt <= now
  );

  if (pendingJobs.length === 0) {
    return;
  }

  logger.info("Processing pending jobs", { count: pendingJobs.length });

  for (const job of pendingJobs) {
    await processJob(job);
  }
}

/**
 * Process a single job
 */
async function processJob(job: ScheduledJob): Promise<void> {
  try {
    // Update status to processing
    job.status = "processing";
    jobQueue.set(job.id, job);

    logger.info("Processing job", { jobId: job.id, type: job.type });

    switch (job.type) {
      case "self_eval_reminder":
        await processSelfEvalReminder(job);
        break;
      case "self_eval_deadline":
        await processSelfEvalDeadline(job);
        break;
      case "manager_review_reminder":
        await processManagerReviewReminder(job);
        break;
      case "manager_review_deadline":
        await processManagerReviewDeadline(job);
        break;
      case "escalation":
        await processEscalation(job);
        break;
      case "cycle_closure":
        await processCycleClosure(job);
        break;
      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }

    // Mark as completed
    job.status = "completed";
    job.processedAt = new Date();
    jobQueue.set(job.id, job);

    logger.info("Job completed", { jobId: job.id });
  } catch (error) {
    // Mark as failed
    job.status = "failed";
    job.error = error instanceof Error ? error.message : "Unknown error";
    job.processedAt = new Date();
    jobQueue.set(job.id, job);

    logger.error("Job failed", { jobId: job.id, error: job.error });
  }
}

/**
 * Process self-evaluation reminder
 */
async function processSelfEvalReminder(job: ScheduledJob): Promise<void> {
  const cycle = await prisma.reviewCycle.findUnique({
    where: { id: job.cycleId },
  });

  if (!cycle) return;

  // Find employees who haven't submitted self-evaluations
  const pendingEmployees = await prisma.evaluation.findMany({
    where: {
      cycleId: job.cycleId,
      status: { in: ["NOT_STARTED", "SELF_IN_PROGRESS"] },
    },
    include: {
      employee: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  const daysRemaining = (job.metadata?.daysRemaining as number) || 0;

  for (const evaluation of pendingEmployees) {
    if (!evaluation.employee.email) continue;

    try {
      await sendEmail({
        to: evaluation.employee.email,
        template: EmailTemplate.SELF_EVAL_REMINDER,
        data: {
          employeeName: evaluation.employee.name,
          cycleName: cycle.name,
          deadline: cycle.selfEvalDeadline?.toLocaleDateString() || "",
          daysRemaining,
          evaluationUrl: `${process.env.NEXTAUTH_URL}/evaluations`,
        },
      });

      logger.debug("Self-eval reminder sent", {
        employeeId: evaluation.employee.id,
        daysRemaining,
      });
    } catch (error) {
      logger.error("Failed to send self-eval reminder", {
        employeeId: evaluation.employee.id,
        error,
      });
    }
  }
}

/**
 * Process self-evaluation deadline (escalate overdue)
 */
async function processSelfEvalDeadline(job: ScheduledJob): Promise<void> {
  const cycle = await prisma.reviewCycle.findUnique({
    where: { id: job.cycleId },
  });

  if (!cycle) return;

  // Find overdue employees
  const overdueEmployees = await prisma.evaluation.findMany({
    where: {
      cycleId: job.cycleId,
      status: { in: ["NOT_STARTED", "SELF_IN_PROGRESS"] },
    },
    include: {
      employee: {
        select: { id: true, name: true, email: true, managerId: true },
      },
    },
  });

  // Create escalation jobs for each overdue employee
  for (const evaluation of overdueEmployees) {
    await createJob({
      type: "escalation",
      cycleId: job.cycleId,
      scheduledAt: new Date(),
      metadata: {
        evaluationId: evaluation.id,
        employeeId: evaluation.employee.id,
        managerId: evaluation.employee.managerId,
        escalationType: "self_eval_overdue",
      },
    });
  }

  logger.info("Created escalation jobs for overdue self-evaluations", {
    count: overdueEmployees.length,
  });
}

/**
 * Process manager review reminder
 */
async function processManagerReviewReminder(job: ScheduledJob): Promise<void> {
  const cycle = await prisma.reviewCycle.findUnique({
    where: { id: job.cycleId },
  });

  if (!cycle) return;

  // Find managers with pending reviews
  const pendingReviews = await prisma.evaluation.findMany({
    where: {
      cycleId: job.cycleId,
      status: { in: ["SELF_SUBMITTED", "MANAGER_IN_PROGRESS"] },
    },
    include: {
      manager: {
        select: { id: true, name: true, email: true },
      },
      employee: {
        select: { id: true, name: true },
      },
    },
  });

  // Group by manager
  const managerReviews = new Map<string, Array<{ employeeName: string }>>();

  for (const review of pendingReviews) {
    if (!review.manager?.email) continue;

    const managerReviews_ = managerReviews.get(review.manager.id) || [];
    managerReviews_.push({ employeeName: review.employee.name });
    managerReviews.set(review.manager.id, managerReviews_);
  }

  const daysRemaining = (job.metadata?.daysRemaining as number) || 0;

  // Send reminders to managers
  for (const [managerId, reviews] of managerReviews) {
    const manager = pendingReviews.find((r) => r.manager?.id === managerId)?.manager;
    if (!manager?.email) continue;

    try {
      await sendEmail({
        to: manager.email,
        template: EmailTemplate.MANAGER_REVIEW_REMINDER,
        data: {
          managerName: manager.name,
          cycleName: cycle.name,
          deadline: cycle.managerReviewDeadline?.toLocaleDateString() || "",
          daysRemaining,
          pendingCount: reviews.length,
          evaluationUrl: `${process.env.NEXTAUTH_URL}/evaluations`,
        },
      });

      logger.debug("Manager review reminder sent", {
        managerId,
        pendingCount: reviews.length,
      });
    } catch (error) {
      logger.error("Failed to send manager review reminder", {
        managerId,
        error,
      });
    }
  }
}

/**
 * Process manager review deadline
 */
async function processManagerReviewDeadline(job: ScheduledJob): Promise<void> {
  const cycle = await prisma.reviewCycle.findUnique({
    where: { id: job.cycleId },
  });

  if (!cycle) return;

  // Find overdue manager reviews
  const overdueReviews = await prisma.evaluation.findMany({
    where: {
      cycleId: job.cycleId,
      status: { in: ["SELF_SUBMITTED", "MANAGER_IN_PROGRESS"] },
    },
    include: {
      manager: {
        select: { id: true, name: true, email: true },
      },
      employee: {
        select: { id: true, name: true },
      },
    },
  });

  // Create escalation jobs
  for (const review of overdueReviews) {
    await createJob({
      type: "escalation",
      cycleId: job.cycleId,
      scheduledAt: new Date(),
      metadata: {
        evaluationId: review.id,
        managerId: review.manager?.id,
        escalationType: "manager_review_overdue",
      },
    });
  }

  logger.info("Created escalation jobs for overdue manager reviews", {
    count: overdueReviews.length,
  });
}

/**
 * Process escalation
 */
async function processEscalation(job: ScheduledJob): Promise<void> {
  const { escalationType, managerId } = (job.metadata || {}) as {
    escalationType?: string;
    managerId?: string;
  };

  // Notify HR about overdue items
  const hrAdmins = await prisma.user.findMany({
    where: {
      role: { in: ["HR_ADMIN", "SUPER_ADMIN"] },
    },
    select: { id: true, name: true, email: true },
  });

  for (const hr of hrAdmins) {
    if (!hr.email) continue;

    try {
      await sendEmail({
        to: hr.email,
        template: EmailTemplate.ESCALATION,
        data: {
          hrName: hr.name,
          escalationType,
          managerId,
          dashboardUrl: `${process.env.NEXTAUTH_URL}/reports`,
        },
      });

      // Also send Teams notification if configured
      await sendTeamsNotification({
        title: "Performance Review Escalation",
        message: `An escalation has been triggered for ${escalationType}. Please check the dashboard.`,
        urgency: "high",
      });

      logger.debug("Escalation notification sent", {
        hrId: hr.id,
        escalationType,
      });
    } catch (error) {
      logger.error("Failed to send escalation notification", {
        hrId: hr.id,
        error,
      });
    }
  }
}

/**
 * Process cycle closure
 */
async function processCycleClosure(job: ScheduledJob): Promise<void> {
  const cycle = await prisma.reviewCycle.findUnique({
    where: { id: job.cycleId },
  });

  if (!cycle) return;

  // Update cycle status
  await prisma.reviewCycle.update({
    where: { id: job.cycleId },
    data: { status: "CLOSED" },
  });

  // Send completion notifications
  const completedEvaluations = await prisma.evaluation.findMany({
    where: {
      cycleId: job.cycleId,
      status: "COMPLETED",
    },
    include: {
      employee: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  for (const evaluation of completedEvaluations) {
    if (!evaluation.employee.email) continue;

    try {
      await sendEmail({
        to: evaluation.employee.email,
        template: EmailTemplate.CYCLE_COMPLETE,
        data: {
          employeeName: evaluation.employee.name,
          cycleName: cycle.name,
          resultsUrl: `${process.env.NEXTAUTH_URL}/evaluations/history`,
        },
      });
    } catch (error) {
      logger.error("Failed to send cycle completion notification", {
        employeeId: evaluation.employee.id,
        error,
      });
    }
  }

  logger.info("Cycle closure processed", {
    cycleId: job.cycleId,
    completedCount: completedEvaluations.length,
  });
}

/**
 * Get scheduler status
 */
export function getSchedulerStatus(): {
  isRunning: boolean;
  pendingJobs: number;
  completedJobs: number;
  failedJobs: number;
} {
  const jobs = Array.from(jobQueue.values());

  return {
    isRunning: schedulerInterval !== null,
    pendingJobs: jobs.filter((j) => j.status === "pending").length,
    completedJobs: jobs.filter((j) => j.status === "completed").length,
    failedJobs: jobs.filter((j) => j.status === "failed").length,
  };
}

/**
 * Manually trigger job processing (for testing)
 */
export async function triggerJobProcessing(): Promise<void> {
  await processPendingJobs();
}

export default {
  startScheduler,
  stopScheduler,
  scheduleUpcomingJobs,
  scheduleCycleJobs,
  getSchedulerStatus,
  triggerJobProcessing,
};
