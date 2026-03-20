/**
 * Departments API Route
 *
 * Handles department management endpoints.
 */

import { withApiHandler } from "@/shared/api/middleware";
import {
  getDepartmentsHandler,
  createDepartmentHandler,
} from "@/features/users/api/handlers";

export const GET = withApiHandler(getDepartmentsHandler);
export const POST = withApiHandler(createDepartmentHandler);
