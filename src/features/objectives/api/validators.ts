/**
 * Objective API Validators
 *
 * Request validation functions for objective endpoints.
 */

import { NextRequest } from "next/server";
import {
  CreateObjectiveSchema,
  UpdateObjectiveSchema,
  ObjectiveListQuerySchema,
  BulkAssignSchema,
  CopyObjectiveSchema,
  ObjectiveIdSchema,
  ObjectiveListParams,
  CreateObjectiveRequest,
  UpdateObjectiveRequest,
  BulkAssignRequest,
  CopyObjectiveRequest,
} from "../types";
import { validationErrorResponse } from "../../../shared/api/response";

/**
 * Validate objective ID parameter
 */
export function validateObjectiveId(id: string): string {
  const result = ObjectiveIdSchema.safeParse(id);
  if (!result.success) {
    throw new Error("Invalid objective ID format");
  }
  return result.data;
}

/**
 * Validate objective list query parameters
 */
export function validateObjectiveListQuery(request: NextRequest): ObjectiveListParams {
  const { searchParams } = new URL(request.url);

  const params = {
    cycleId: searchParams.get("cycleId") || undefined,
    assignedTo: searchParams.get("assignedTo") || undefined,
    category: searchParams.get("category") || undefined,
    createdBy: searchParams.get("createdBy") || undefined,
  };

  const result = ObjectiveListQuerySchema.safeParse(params);
  if (!result.success) {
    throw new Error(`Invalid query parameters: ${result.error.message}`);
  }

  return result.data;
}

/**
 * Validate create objective request
 */
export async function validateCreateObjective(request: NextRequest): Promise<CreateObjectiveRequest> {
  const body = await request.json();
  const result = CreateObjectiveSchema.safeParse(body);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    throw new Error(`Validation failed: ${JSON.stringify(errors)}`);
  }

  return result.data;
}

/**
 * Validate update objective request
 */
export async function validateUpdateObjective(request: NextRequest): Promise<UpdateObjectiveRequest> {
  const body = await request.json();
  const result = UpdateObjectiveSchema.safeParse(body);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    throw new Error(`Validation failed: ${JSON.stringify(errors)}`);
  }

  return result.data;
}

/**
 * Validate bulk assignment request
 */
export async function validateBulkAssign(request: NextRequest): Promise<BulkAssignRequest> {
  const body = await request.json();
  const result = BulkAssignSchema.safeParse(body);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    throw new Error(`Validation failed: ${JSON.stringify(errors)}`);
  }

  return result.data;
}

/**
 * Validate copy objective request
 */
export async function validateCopyObjective(request: NextRequest): Promise<CopyObjectiveRequest> {
  const body = await request.json();
  const result = CopyObjectiveSchema.safeParse(body);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    throw new Error(`Validation failed: ${JSON.stringify(errors)}`);
  }

  return result.data;
}
