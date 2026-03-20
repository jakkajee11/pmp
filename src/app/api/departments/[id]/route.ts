/**
 * Department by ID API Route
 *
 * Handles individual department operations.
 */

import { withApiHandler } from "@/shared/api/middleware";
import {
  updateDepartmentHandler,
  deleteDepartmentHandler,
} from "@/features/users/api/handlers";

export const PUT = withApiHandler(updateDepartmentHandler);
export const DELETE = withApiHandler(deleteDepartmentHandler);
