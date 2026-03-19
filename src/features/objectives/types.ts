/**
 * Objective Types
 *
 * Type definitions for objective assignment feature.
 */

import { z } from "zod";

// ============================================================================
// Objective Category Types
// ============================================================================

export type ObjectiveCategory = "DELIVERY" | "INNOVATION" | "QUALITY" | "CULTURE";

// ============================================================================
// Category Constants
// ============================================================================

export const OBJECTIVE_CATEGORIES = [
  "DELIVERY",
  "INNOVATION",
  "QUALITY",
  "CULTURE",
] as const;

export const CATEGORY_LABELS: Record<ObjectiveCategory, string> = {
  DELIVERY: "Delivery",
  INNOVATION: "Innovation",
  QUALITY: "Quality",
  CULTURE: "Culture",
};

export const CATEGORY_LABELS_TH: Record<ObjectiveCategory, string> = {
  DELIVERY: "การส่งมอบ",
  INNOVATION: "นวัตกรรม",
  QUALITY: "คุณภาพ",
  CULTURE: "วัฒนธรรม",
};

export const CATEGORY_DESCRIPTIONS: Record<ObjectiveCategory, string> = {
  DELIVERY: "Goals related to project delivery and timely completion",
  INNOVATION: "Goals focused on new ideas and creative solutions",
  QUALITY: "Goals centered on quality standards and improvements",
  CULTURE: "Goals aligned with company values and team culture",
};

export const CATEGORY_COLORS: Record<ObjectiveCategory, string> = {
  DELIVERY: "bg-blue-100 text-blue-800",
  INNOVATION: "bg-purple-100 text-purple-800",
  QUALITY: "bg-green-100 text-green-800",
  CULTURE: "bg-amber-100 text-amber-800",
};

// ============================================================================
// Evaluation Status Constants
// ============================================================================

export const EVALUATION_STATUS_COLORS: Record<string, string> = {
  not_started: "bg-gray-100 text-gray-800",
  self_in_progress: "bg-blue-100 text-blue-800",
  self_submitted: "bg-yellow-100 text-yellow-800",
  manager_in_progress: "bg-orange-100 text-orange-800",
  completed: "bg-green-100 text-green-800",
  returned: "bg-red-100 text-red-800",
};

export const EVALUATION_STATUS_LABELS: Record<string, string> = {
  not_started: "Not Started",
  self_in_progress: "Self Evaluation In Progress",
  self_submitted: "Self Evaluation Submitted",
  manager_in_progress: "Manager Review In Progress",
  completed: "Completed",
  returned: "Returned",
};

// ============================================================================
// Timeline Options
// ============================================================================

export const TIMELINE_OPTIONS = [
  "Q1",
  "Q2",
  "Q3",
  "Q4",
  "H1",
  "H2",
  "Full Year",
] as const;

export type TimelineOption = (typeof TIMELINE_OPTIONS)[number];

// ============================================================================
// Objective Types
// ============================================================================

/**
 * Rating criteria for each level (1-5)
 */
export interface RatingCriteria {
  rating1Desc: string;
  rating2Desc: string;
  rating3Desc: string;
  rating4Desc: string;
  rating5Desc: string;
}

/**
 * Objective entity type
 */
export interface Objective extends RatingCriteria {
  id: string;
  title: string;
  description: string;
  keyResults?: string;
  category: ObjectiveCategory;
  timeline: string;
  assignedTo: string;
  cycleId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Objective with related data
 */
export interface ObjectiveWithRelations extends Objective {
  employee: {
    id: string;
    name: string;
    email: string;
  };
  cycle: {
    id: string;
    name: string;
    type: string;
  };
  creator: {
    id: string;
    name: string;
  };
  documents?: Array<{
    id: string;
    fileName: string;
    fileSize: number;
    uploadedAt: Date;
  }>;
  evaluation?: {
    selfRating: number | null;
    selfComments: string | null;
    managerRating: number | null;
    managerFeedback: string | null;
    status: string;
  };
}

/**
 * Objective list item for display
 */
export interface ObjectiveListItem {
  id: string;
  title: string;
  description: string;
  keyResults?: string;
  category: ObjectiveCategory;
  timeline: string;
  assignedTo: {
    id: string;
    name: string;
  };
  cycle: {
    id: string;
    name: string;
  };
  evaluationStatus: string;
  createdAt: string;
}

/**
 * Objective list params for API queries
 */
export interface ObjectiveListParams {
  cycleId?: string;
  assignedTo?: string;
  category?: ObjectiveCategory;
  createdBy?: string;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Create objective request
 */
export interface CreateObjectiveRequest extends RatingCriteria {
  title: string;
  description: string;
  keyResults?: string;
  category: ObjectiveCategory;
  timeline: string;
  assignedTo: string;
  cycleId: string;
}

/**
 * Update objective request (before evaluation starts)
 */
export interface UpdateObjectiveRequest {
  title?: string;
  description?: string;
  keyResults?: string;
  category?: ObjectiveCategory;
  timeline?: string;
  rating1Desc?: string;
  rating2Desc?: string;
  rating3Desc?: string;
  rating4Desc?: string;
  rating5Desc?: string;
}

/**
 * Bulk assignment request
 */
export interface BulkAssignRequest extends RatingCriteria {
  title: string;
  description: string;
  keyResults?: string;
  category: ObjectiveCategory;
  timeline: string;
  cycleId: string;
  assignedTo: string[]; // Array of user IDs (direct reports)
}

/**
 * Bulk assignment result
 */
export interface BulkAssignResult {
  created: number;
  skipped: number;
  errors: Array<{
    userId: string;
    error: string;
  }>;
  objectives: Array<{
    id: string;
    assignedTo: string;
    title: string;
  }>;
}

/**
 * Copy objective request
 */
export interface CopyObjectiveRequest {
  sourceObjectiveId: string;
  assignedTo: string;
  cycleId: string;
}

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

export const ObjectiveCategorySchema = z.enum([
  "DELIVERY",
  "INNOVATION",
  "QUALITY",
  "CULTURE",
]);

export const TimelineSchema = z
  .string()
  .min(1, "Timeline is required")
  .max(100, "Timeline too long");

export const RatingCriteriaSchema = z.object({
  rating1Desc: z.string().min(1, "Rating 1 description is required"),
  rating2Desc: z.string().min(1, "Rating 2 description is required"),
  rating3Desc: z.string().min(1, "Rating 3 description is required"),
  rating4Desc: z.string().min(1, "Rating 4 description is required"),
  rating5Desc: z.string().min(1, "Rating 5 description is required"),
});

export const CreateObjectiveSchema = z.object({
  title: z.string().min(1, "Title is required").max(500, "Title too long"),
  description: z.string().min(1, "Description is required"),
  keyResults: z.string().optional(),
  category: ObjectiveCategorySchema,
  timeline: TimelineSchema,
  assignedTo: z.string().uuid("Invalid employee ID format"),
  cycleId: z.string().uuid("Invalid cycle ID format"),
  ...RatingCriteriaSchema.shape,
});

export const UpdateObjectiveSchema = z.object({
  title: z.string().min(1, "Title is required").max(500, "Title too long").optional(),
  description: z.string().min(1, "Description is required").optional(),
  keyResults: z.string().optional(),
  category: ObjectiveCategorySchema.optional(),
  timeline: TimelineSchema.optional(),
  rating1Desc: z.string().min(1, "Rating 1 description is required").optional(),
  rating2Desc: z.string().min(1, "Rating 2 description is required").optional(),
  rating3Desc: z.string().min(1, "Rating 3 description is required").optional(),
  rating4Desc: z.string().min(1, "Rating 4 description is required").optional(),
  rating5Desc: z.string().min(1, "Rating 5 description is required").optional(),
});

export const ObjectiveListQuerySchema = z.object({
  cycleId: z.string().uuid().optional(),
  assignedTo: z.string().uuid().optional(),
  category: ObjectiveCategorySchema.optional(),
  createdBy: z.string().uuid().optional(),
});

export const BulkAssignSchema = z.object({
  title: z.string().min(1, "Title is required").max(500, "Title too long"),
  description: z.string().min(1, "Description is required"),
  keyResults: z.string().optional(),
  category: ObjectiveCategorySchema,
  timeline: TimelineSchema,
  cycleId: z.string().uuid("Invalid cycle ID format"),
  assignedTo: z
    .array(z.string().uuid("Invalid employee ID format"))
    .min(1, "At least one employee is required")
    .max(50, "Cannot assign to more than 50 employees at once"),
  ...RatingCriteriaSchema.shape,
});

export const CopyObjectiveSchema = z.object({
  sourceObjectiveId: z.string().uuid("Invalid objective ID format"),
  assignedTo: z.string().uuid("Invalid employee ID format"),
  cycleId: z.string().uuid("Invalid cycle ID format"),
});

export const ObjectiveIdSchema = z.string().uuid("Invalid objective ID format");
