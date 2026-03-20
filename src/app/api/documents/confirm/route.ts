/**
 * Document Upload Confirmation Route
 *
 * Confirms file upload and creates document record.
 */

import { confirmUploadHandler } from "@/features/documents/api/handlers";

/**
 * POST /api/documents/confirm
 * Confirm file upload and create document record
 */
export async function POST(request: Request) {
  return confirmUploadHandler(request);
}
