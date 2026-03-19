/**
 * Cycle API Validators
 *
 * Request validation for review cycle endpoints.
 */

import { NextRequest } from "next/server";
import {
  CreateCycleSchema,
  UpdateCycleSchema,
  CycleListQuerySchema,
  DeadlineExtensionSchema,
  CycleIdSchema,
  CreateCycleRequest,
  UpdateCycleRequest,
  CycleListParams,
  DeadlineExtensionRequest,
} from "../types";
import { z } from "zod";

/**
 * Validate create cycle request body
 */
export async function validateCreateCycle(request: NextRequest): Promise<CreateCycleRequest> {
  try {
    const body = await request.json();
    const result = CreateCycleSchema.parse(body);

    // Convert dates back to ISO strings for the handler
    return {
      name: result.name,
      type: result.type,
      startDate: result.startDate instanceof Date ? result.startDate.toISOString() : result.startDate,
      endDate: result.endDate instanceof Date ? result.endDate.toISOString() : result.endDate,
      selfEvalDeadline: result.selfEvalDeadline instanceof Date ? result.selfEvalDeadline.toISOString() : result.selfEvalDeadline,
      managerReviewDeadline: result.managerReviewDeadline instanceof Date ? result.managerReviewDeadline.toISOString() : result.managerReviewDeadline,
      gracePeriodDays: result.gracePeriodDays,
      weightsConfig: result.weightsConfig,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = new Error(
        JSON.stringify({
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: error.errors.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        })
      );
      (validationError as any).isValidationError = true;
      throw validationError;
    }
    throw error;
  }
}

/**
 * Validate update cycle request body
 */
export async function validateUpdateCycle(request: NextRequest): Promise<UpdateCycleRequest> {
  try {
    const body = await request.json();
    const result = UpdateCycleSchema.parse(body);

    // Convert dates back to ISO strings for the handler
    const updateData: UpdateCycleRequest = {};

    if (result.name !== undefined) updateData.name = result.name;
    if (result.type !== undefined) updateData.type = result.type;
    if (result.startDate !== undefined) {
      updateData.startDate = result.startDate instanceof Date ? result.startDate.toISOString() : result.startDate;
    }
    if (result.endDate !== undefined) {
      updateData.endDate = result.endDate instanceof Date ? result.endDate.toISOString() : result.endDate;
    }
    if (result.selfEvalDeadline !== undefined) {
      updateData.selfEvalDeadline = result.selfEvalDeadline instanceof Date ? result.selfEvalDeadline.toISOString() : result.selfEvalDeadline;
    }
    if (result.managerReviewDeadline !== undefined) {
      updateData.managerReviewDeadline = result.managerReviewDeadline instanceof Date ? result.managerReviewDeadline.toISOString() : result.managerReviewDeadline;
    }
    if (result.gracePeriodDays !== undefined) updateData.gracePeriodDays = result.gracePeriodDays;
    if (result.weightsConfig !== undefined) updateData.weightsConfig = result.weightsConfig;

    return updateData;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = new Error(
        JSON.stringify({
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: error.errors.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        })
      );
      (validationError as any).isValidationError = true;
      throw validationError;
    }
    throw error;
  }
}

/**
 * Validate cycle list query parameters
 */
export function validateCycleListQuery(request: NextRequest): CycleListParams {
  const { searchParams } = new URL(request.url);
  const params = {
    status: searchParams.get("status") ?? undefined,
    type: searchParams.get("type") ?? undefined,
  };

  try {
    return CycleListQuerySchema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        JSON.stringify({
          code: "VALIDATION_ERROR",
          message: "Invalid query parameters",
          details: error.errors,
        })
      );
    }
    throw error;
  }
}

/**
 * Validate cycle ID parameter
 */
export function validateCycleId(id: string): string {
  try {
    return CycleIdSchema.parse(id);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        JSON.stringify({
          code: "VALIDATION_ERROR",
          message: "Invalid cycle ID format",
          details: { id },
        })
      );
    }
    throw error;
  }
}

/**
 * Validate deadline extension request
 */
export async function validateDeadlineExtension(request: NextRequest): Promise<DeadlineExtensionRequest> {
  try {
    const body = await request.json();
    const result = DeadlineExtensionSchema.parse(body);

    return {
      userIds: result.userIds,
      extensionType: result.extensionType,
      newDeadline: result.newDeadline instanceof Date ? result.newDeadline.toISOString() : result.newDeadline,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        JSON.stringify({
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: error.errors,
        })
      );
    }
    throw error;
  }
}

/**
 * Validate activate cycle preconditions
 */
export function validateActivatePreconditions(
  cycle: { status: string; startDate: Date },
  hasActiveCycle: boolean
): { valid: boolean; error?: string } {
  // Check if cycle is in draft status
  if (cycle.status !== "DRAFT") {
    return { valid: false, error: "Cycle must be in draft status to activate" };
  }

  // Check if there's already an active cycle
  if (hasActiveCycle) {
    return { valid: false, error: "Cannot activate cycle: another cycle is already active" };
  }

  // Check if start date has been reached
  const now = new Date();
  const startDate = new Date(cycle.startDate);
  startDate.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  // Allow activation if start date is today or in the past
  if (startDate > now) {
    return { valid: false, error: "Start date has not been reached yet" };
  }

  return { valid: true };
}

/**
 * Validate close cycle preconditions
 */
export function validateClosePreconditions(
  cycle: { status: string; endDate: Date }
): { valid: boolean; error?: string } {
  // Check if cycle is active
  if (cycle.status !== "ACTIVE") {
    return { valid: false, error: "Cycle must be in active status to close" };
  }

  return { valid: true };
}
