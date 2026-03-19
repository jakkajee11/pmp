/**
 * Cycle API Routes (by ID)
 *
 * API routes for individual review cycle operations.
 */

import { NextRequest } from "next/server";
import {
  getCycleHandler,
  updateCycleHandler,
  deleteCycleHandler,
} from "../../../../../features/cycles/api/handlers";
import { withApiHandler } from "../../../../../shared/api/middleware";

export const GET = withApiHandler(getCycleHandler);
export const PUT = withApiHandler(updateCycleHandler);
export const DELETE = withApiHandler(deleteCycleHandler);
