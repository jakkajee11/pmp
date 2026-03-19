/**
 * Evaluations API Route
 *
 * Handles GET (list) operations for evaluations.
 */

import { NextRequest } from "next/server";
import {
  getEvaluationsHandler,
  getDashboardHandler,
} from "../../../../features/evaluations/api/handlers";

/**
 * GET /api/evaluations
 *
 * List evaluations with optional filters.
 *
 * Query params:
 * - cycleId: Filter by review cycle
 * - employeeId: Filter by employee (manager only)
 * - status: Filter by status
 * - type: Filter by evaluation type (KPI, CORE_VALUE)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const isDashboard = searchParams.has("dashboard");

  if (isDashboard) {
    return getDashboardHandler(request);
  }

  return getEvaluationsHandler(request);
}
