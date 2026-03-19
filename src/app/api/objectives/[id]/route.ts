/**
 * Objective by ID API Route
 *
 * API endpoints for individual objective operations.
 */

import { NextRequest } from "next/server";
import {
  getObjectiveHandler,
  updateObjectiveHandler,
  deleteObjectiveHandler,
} from "../../../../features/objectives";

/**
 * GET /api/objectives/:id
 * Get objective by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return getObjectiveHandler(request, { params });
}

/**
 * PUT /api/objectives/:id
 * Update objective
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return updateObjectiveHandler(request, { params });
}

/**
 * DELETE /api/objectives/:id
 * Delete objective
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return deleteObjectiveHandler(request, { params });
}
