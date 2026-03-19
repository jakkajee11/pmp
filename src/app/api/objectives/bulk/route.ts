/**
 * Bulk Objectives API Route
 *
 * API endpoint for bulk assigning objectives.
 */

import { NextRequest } from "next/server";
import { bulkAssignObjectivesHandler } from "../../../../features/objectives";

/**
 * POST /api/objectives/bulk
 * Bulk assign objectives to multiple employees
 */
export async function POST(request: NextRequest) {
  return bulkAssignObjectivesHandler(request);
}
