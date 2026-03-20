/**
 * Evaluation API Validators
 *
 * Request validation for evaluation endpoints.
 */

import { NextRequest } from "next/server";
import {
  EvaluationIdSchema,
  EvaluationListQuerySchema,
  UpdateSelfEvalSchema,
  SubmitSelfEvalSchema,
  UpdateManagerReviewSchema,
  ReturnEvaluationSchema,
  EvaluationListParams,
  UpdateSelfEvalRequest,
  SubmitSelfEvalRequest,
  UpdateManagerReviewRequest,
  ReturnEvaluationRequest,
} from "../types";
import { validationErrorResponse } from "@/shared/api/response";

/**
 * Validate evaluation ID parameter
 */
export function validateEvaluationId(id: string): string {
  const result = EvaluationIdSchema.safeParse(id);

  if (!result.success) {
    throw new Error(`Invalid evaluation ID: ${result.error.errors[0].message}`);
  }

  return result.data;
}

/**
 * Validate and parse evaluation list query parameters
 */
export function validateEvaluationListQuery(
  request: NextRequest
): EvaluationListParams {
  const { searchParams } = new URL(request.url);

  const params: Record<string, string | undefined> = {
    cycleId: searchParams.get("cycleId") ?? undefined,
    employeeId: searchParams.get("employeeId") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    type: searchParams.get("type") ?? undefined,
  };

  // Filter out undefined values
  const filteredParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== undefined)
  );

  const result = EvaluationListQuerySchema.safeParse(filteredParams);

  if (!result.success) {
    throw new Error(`Invalid query parameters: ${result.error.errors[0].message}`);
  }

  return result.data as EvaluationListParams;
}

/**
 * Validate update self-evaluation request
 */
export async function validateUpdateSelfEval(
  request: NextRequest
): Promise<UpdateSelfEvalRequest> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new Error("Invalid JSON body");
  }

  const result = UpdateSelfEvalSchema.safeParse(body);

  if (!result.success) {
    const error = result.error.errors[0];
    throw new Error(`${error.path.join(".")}: ${error.message}`);
  }

  return result.data;
}

/**
 * Validate submit self-evaluation request
 */
export async function validateSubmitSelfEval(
  request: NextRequest
): Promise<SubmitSelfEvalRequest> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new Error("Invalid JSON body");
  }

  const result = SubmitSelfEvalSchema.safeParse(body);

  if (!result.success) {
    const error = result.error.errors[0];
    throw new Error(`${error.path.join(".")}: ${error.message}`);
  }

  return result.data;
}

/**
 * Validate update manager review request
 */
export async function validateUpdateManagerReview(
  request: NextRequest
): Promise<UpdateManagerReviewRequest> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new Error("Invalid JSON body");
  }

  const result = UpdateManagerReviewSchema.safeParse(body);

  if (!result.success) {
    const error = result.error.errors[0];
    throw new Error(`${error.path.join(".")}: ${error.message}`);
  }

  return result.data;
}

/**
 * Validate return evaluation request
 */
export async function validateReturnEvaluation(
  request: NextRequest
): Promise<ReturnEvaluationRequest> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new Error("Invalid JSON body");
  }

  const result = ReturnEvaluationSchema.safeParse(body);

  if (!result.success) {
    const error = result.error.errors[0];
    throw new Error(`${error.path.join(".")}: ${error.message}`);
  }

  return result.data;
}

/**
 * Validation wrapper that catches errors and returns appropriate response
 */
export function withValidation<T>(
  validator: () => T,
  onValidationError: (message: string) => never
): T {
  try {
    return validator();
  } catch (error) {
    if (error instanceof Error) {
      onValidationError(error.message);
    }
    throw error;
  }
}
