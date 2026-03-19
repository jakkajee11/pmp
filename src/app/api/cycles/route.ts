/**
 * Cycles API Routes
 *
 * API routes for review cycle management.
 */

import { NextRequest } from "next/server";
import {
  getCyclesHandler,
  createCycleHandler,
} from "../../../../features/cycles/api/handlers";
import { withApiHandler } from "../../../../shared/api/middleware";

export const GET = withApiHandler(getCyclesHandler);
export const POST = withApiHandler(createCycleHandler);
