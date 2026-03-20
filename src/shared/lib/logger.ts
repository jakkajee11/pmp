/**
 * Pino Structured Logging Utility
 *
 * Provides structured logging with Pino for observability.
 * Logs are written to stdout in JSON format for production,
 * and pretty-printed in development.
 *
 * Constitution: IV. Observability & Auditability
 * - Structured logging with Pino
 * - No PII in logs
 */

import pino from "pino";

const isDevelopment = process.env.NODE_ENV === "development";

const transport = isDevelopment
  ? {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss",
        ignore: "pid,hostname",
      },
    }
  : undefined;

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info"),
  transport,
  formatters: {
    level: (label) => ({ level: label }),
  },
  serializers: {
    // Redact sensitive fields
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.headers['x-api-key']",
      "password",
      "token",
      "secret",
    ],
    censor: "[REDACTED]",
  },
});

export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

export interface LogContext {
  userId?: string;
  requestId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  [key: string]: unknown;
}

/**
 * Create a child logger with additional context
 */
export function createLogger(context: LogContext) {
  return logger.child(context);
}

/**
 * Log API request
 */
export function logRequest(
  method: string,
  path: string,
  statusCode: number,
  durationMs: number,
  context?: LogContext
) {
  logger.info(
    {
      method,
      path,
      statusCode,
      durationMs,
      ...context,
    },
    "API request completed"
  );
}

/**
 * Log error with context
 */
export function logError(error: Error, context?: LogContext) {
  logger.error(
    {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      ...context,
    },
    "Error occurred"
  );
}

export default logger;
