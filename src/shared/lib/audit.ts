/**
 * Audit Logging Utility
 *
 * Provides comprehensive audit trail for all CRUD operations.
 * Records user actions with old/new values for compliance.
 *
 * Constitution: IV. Observability & Auditability
 * - 5-year audit log retention
 * - No PII in JSONB fields (use IDs only)
 * - Immutable audit records
 */

import { prisma } from "./db";
import { logger } from "./logger";

export type AuditAction = "create" | "update" | "delete" | "view";

export interface AuditEntry {
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress: string;
  userAgent?: string;
}

/**
 * Log an audit event to the database
 *
 * @param entry - Audit entry data
 * @throws Never throws - logs error and continues (non-blocking)
 */
export async function auditLog(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        oldValues: entry.oldValues ?? null,
        newValues: entry.newValues ?? null,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
      },
    });

    logger.debug({
      msg: "Audit log created",
      userId: entry.userId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
    });
  } catch (error) {
    // Audit logging should never block the main operation
    // Log the error but don't throw
    logger.error({
      msg: "Failed to create audit log",
      error: error instanceof Error ? error.message : "Unknown error",
      entry: {
        userId: entry.userId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
      },
    });
  }
}

/**
 * Sanitize entity data for audit logging
 * Removes sensitive fields and converts to plain object
 */
export function sanitizeForAudit(
  data: Record<string, unknown>
): Record<string, unknown> {
  const sensitiveFields = [
    "password",
    "token",
    "secret",
    "apiKey",
    "privateKey",
  ];

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
      sanitized[key] = "[REDACTED]";
    } else if (value instanceof Date) {
      sanitized[key] = value.toISOString();
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = JSON.parse(JSON.stringify(value));
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Extract client IP from request headers
 */
export function extractClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }

  const realIp = headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  return "unknown";
}

/**
 * Extract user agent from request headers
 */
export function extractUserAgent(headers: Headers): string | null {
  return headers.get("user-agent");
}

/**
 * Create audit context from request
 */
export function createAuditContext(
  userId: string,
  headers: Headers
): { userId: string; ipAddress: string; userAgent: string | null } {
  return {
    userId,
    ipAddress: extractClientIp(headers),
    userAgent: extractUserAgent(headers),
  };
}
