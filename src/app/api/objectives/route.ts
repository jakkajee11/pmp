/**
 * Objectives API Route
 *
 * API endpoints for objective management.
 */

import { NextRequest } from "next/server";
import {
  getObjectivesHandler,
  createObjectiveHandler,
} from "@/features/objectives";

/**
 * GET /api/objectives
 * List objectives with optional filters
 */
export async function GET(request: NextRequest) {
  return getObjectivesHandler(request);
}

/**
 * POST /api/objectives
 * Create a new objective
 */
export async function POST(request: NextRequest) {
  return createObjectiveHandler(request);
}
