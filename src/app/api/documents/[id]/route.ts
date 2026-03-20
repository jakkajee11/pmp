/**
 * Individual Document API Route
 *
 * Handles document download and delete operations.
 */

import {
  getDownloadUrlHandler,
  deleteDocumentHandler,
} from "@/features/documents/api/handlers";

/**
 * GET /api/documents/:id/download
 * Get presigned URL for file download
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return getDownloadUrlHandler(request, id);
}

/**
 * DELETE /api/documents/:id
 * Delete a document
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return deleteDocumentHandler(request, id);
}
