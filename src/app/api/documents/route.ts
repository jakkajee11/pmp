/**
 * Documents API Route
 *
 * Handles document listing.
 */

import { listDocumentsHandler } from "@/features/documents/api/handlers";

/**
 * GET /api/documents
 * List documents for an objective or employee
 */
export async function GET(request: Request) {
  return listDocumentsHandler(request);
}
