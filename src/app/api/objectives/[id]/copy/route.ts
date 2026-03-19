/**
 * Copy Objective API Route
 *
 * API endpoint for copying an objective to another employee/cycle.
 */

import { NextRequest } from "next/server";
import { copyObjectiveHandler } from "../../../../../features/objectives";

/**
 * POST /api/objectives/:id/copy
 * Copy objective to another employee/cycle
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return copyObjectiveHandler(request, { params });
}
