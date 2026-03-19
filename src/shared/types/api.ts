/**
 * API Response Types
 *
 * Type definitions for API request and response payloads.
 */

import { PaginationMeta } from "./common";

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

/**
 * API error structure
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * User API types
 */
export interface UserResponse {
  id: string;
  email: string;
  name: string;
  nameTh: string | null;
  role: string;
  managerId: string | null;
  departmentId: string | null;
  language: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  nameTh?: string;
  role: string;
  managerId?: string;
  departmentId?: string;
  language?: string;
}

export interface UpdateUserRequest {
  name?: string;
  nameTh?: string;
  role?: string;
  managerId?: string | null;
  departmentId?: string | null;
  language?: string;
  isActive?: boolean;
}

/**
 * Review Cycle API types
 */
export interface ReviewCycleResponse {
  id: string;
  name: string;
  type: string;
  startDate: string;
  endDate: string;
  selfEvalDeadline: string;
  managerReviewDeadline: string;
  gracePeriodDays: number;
  status: string;
  weightsConfig: { kpi: number; coreValues: number };
  createdAt: string;
  updatedAt: string;
}

export interface CreateCycleRequest {
  name: string;
  type: "MID_YEAR" | "YEAR_END";
  startDate: string;
  endDate: string;
  selfEvalDeadline: string;
  managerReviewDeadline: string;
  gracePeriodDays?: number;
  weightsConfig?: { kpi: number; coreValues: number };
}

export interface UpdateCycleRequest {
  name?: string;
  startDate?: string;
  endDate?: string;
  selfEvalDeadline?: string;
  managerReviewDeadline?: string;
  gracePeriodDays?: number;
  weightsConfig?: { kpi: number; coreValues: number };
}

/**
 * Objective API types
 */
export interface ObjectiveResponse {
  id: string;
  title: string;
  description: string;
  keyResults: string | null;
  category: string;
  timeline: string;
  rating1Desc: string;
  rating2Desc: string;
  rating3Desc: string;
  rating4Desc: string;
  rating5Desc: string;
  assignedTo: string;
  cycleId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateObjectiveRequest {
  title: string;
  description: string;
  keyResults?: string;
  category: string;
  timeline: string;
  rating1Desc: string;
  rating2Desc: string;
  rating3Desc: string;
  rating4Desc: string;
  rating5Desc: string;
  assignedTo: string;
  cycleId: string;
}

export interface BulkAssignObjectivesRequest {
  employeeIds: string[];
  objectives: Omit<CreateObjectiveRequest, "assignedTo">[];
}

/**
 * Evaluation API types
 */
export interface EvaluationResponse {
  id: string;
  employeeId: string;
  managerId: string;
  cycleId: string;
  objectiveId: string | null;
  coreValueId: string | null;
  evaluationType: string;
  selfRating: number | null;
  selfComments: string | null;
  selfSubmittedAt: string | null;
  managerRating: number | null;
  managerFeedback: string | null;
  managerReviewedAt: string | null;
  status: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface SelfEvaluationRequest {
  rating: number;
  comments?: string;
  version: number;
}

export interface ManagerReviewRequest {
  rating: number;
  feedback?: string;
  version: number;
}

export interface ReturnEvaluationRequest {
  reason: string;
}

/**
 * Department API types
 */
export interface DepartmentResponse {
  id: string;
  name: string;
  nameTh: string | null;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentRequest {
  name: string;
  nameTh?: string;
  parentId?: string;
}

/**
 * List query parameters
 */
export interface ListQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
}
