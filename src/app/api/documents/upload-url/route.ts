/**
 * Document Upload URL Route
 *
 * Generates presigned URLs for file uploads.
 */

import { getUploadUrlHandler } from "@/features/documents/api/handlers";

/**
 * POST /api/documents/upload-url
 * Get presigned URL for file upload
 */
export async function POST(request: Request) {
  return getUploadUrlHandler(request);
}
