/**
 * Document API Handlers
 *
 * Handles HTTP requests for document operations.
 */

import { prisma } from "@/shared/lib/db";
import { errorResponse, successResponse } from "@/shared/api/response";
import { requireAuth } from "@/shared/api/middleware";
import {
  type ConfirmUploadRequest,
  type ConfirmUploadResponse,
  type DocumentListParams,
  type DocumentListItem,
  type GetDownloadUrlResponse,
  type GetUploadUrlRequest,
  type GetUploadUrlResponse,
  ConfirmUploadSchema,
  DocumentIdSchema,
  DocumentListQuerySchema,
  GetUploadUrlSchema,
} from "../types";
import {
  deleteFileFromS3,
  generatePresignedDownloadUrl,
  generatePresignedUploadUrl,
  isS3Configured,
} from "./s3-service";

// ============================================================================
// Helper function for auth error handling
// ============================================================================

function handleAuthError(error: unknown): Response | null {
  if ((error as Error).message === "UNAUTHORIZED") {
    return errorResponse("Unauthorized", 401);
  }
  return null;
}

// Check if user has HR role
function isHRUser(role: string): boolean {
  return role === "SUPER_ADMIN" || role === "HR_ADMIN" || role === "HR_STAFF";
}

// ============================================================================
// Upload URL Generation
// ============================================================================

/**
 * Get presigned URL for file upload
 * POST /api/documents/upload-url
 */
export async function getUploadUrlHandler(
  request: Request
): Promise<Response> {
  try {
    const auth = await requireAuth();
    const userId = auth.userId;

    // Check S3 configuration
    if (!isS3Configured()) {
      return errorResponse("File upload is not configured", 503);
    }

    const body = (await request.json()) as GetUploadUrlRequest;
    const validated = GetUploadUrlSchema.safeParse(body);

    if (!validated.success) {
      return errorResponse(
        "Validation failed",
        400,
        validated.error.flatten().fieldErrors
      );
    }

    const { fileName, fileType, objectiveId } = validated.data;

    // Verify objective exists and belongs to user
    const objective = await prisma.objective.findFirst({
      where: {
        id: objectiveId,
        assignedTo: userId,
      },
      select: { id: true },
    });

    if (!objective) {
      return errorResponse("Objective not found or access denied", 404);
    }

    // Generate presigned URL
    const result = await generatePresignedUploadUrl(
      objectiveId,
      userId,
      fileName,
      fileType
    );

    const response: GetUploadUrlResponse = {
      uploadUrl: result.uploadUrl,
      fileKey: result.fileKey,
      expiresInSeconds: result.expiresInSeconds,
    };

    return successResponse(response);
  } catch (error) {
    const authError = handleAuthError(error);
    if (authError) return authError;
    console.error("Error generating upload URL:", error);
    return errorResponse("Failed to generate upload URL", 500);
  }
}

// ============================================================================
// Upload Confirmation
// ============================================================================

/**
 * Confirm file upload and create document record
 * POST /api/documents/confirm
 */
export async function confirmUploadHandler(
  request: Request
): Promise<Response> {
  try {
    const auth = await requireAuth();
    const userId = auth.userId;

    const body = (await request.json()) as ConfirmUploadRequest;
    const validated = ConfirmUploadSchema.safeParse(body);

    if (!validated.success) {
      return errorResponse(
        "Validation failed",
        400,
        validated.error.flatten().fieldErrors
      );
    }

    const { objectiveId, fileName, fileKey, fileSize, mimeType } =
      validated.data;

    // Verify objective exists and belongs to user
    const objective = await prisma.objective.findFirst({
      where: {
        id: objectiveId,
        assignedTo: userId,
      },
      select: { id: true },
    });

    if (!objective) {
      return errorResponse("Objective not found or access denied", 404);
    }

    // Create document record
    const document = await prisma.document.create({
      data: {
        objectiveId,
        employeeId: userId,
        fileName,
        fileKey,
        fileSize,
        mimeType,
      },
    });

    const response: ConfirmUploadResponse = {
      id: document.id,
      fileName: document.fileName,
      fileSize: document.fileSize,
      mimeType: document.mimeType,
      uploadedAt: document.uploadedAt,
    };

    return successResponse(response, 201);
  } catch (error) {
    const authError = handleAuthError(error);
    if (authError) return authError;
    console.error("Error confirming upload:", error);
    return errorResponse("Failed to confirm upload", 500);
  }
}

// ============================================================================
// Document Listing
// ============================================================================

/**
 * List documents
 * GET /api/documents
 */
export async function listDocumentsHandler(
  request: Request
): Promise<Response> {
  try {
    const auth = await requireAuth();
    const userId = auth.userId;
    const userRole = auth.role;

    const { searchParams } = new URL(request.url);
    const params: DocumentListParams = {
      objectiveId: searchParams.get("objectiveId") || undefined,
      employeeId: searchParams.get("employeeId") || undefined,
    };

    const validated = DocumentListQuerySchema.safeParse(params);
    if (!validated.success) {
      return errorResponse(
        "Invalid query parameters",
        400,
        validated.error.flatten().fieldErrors
      );
    }

    // Build where clause based on user role
    const where: { objectiveId?: string; employeeId?: string } = {};

    if (validated.data.objectiveId) {
      where.objectiveId = validated.data.objectiveId;
    }

    // Non-admin users can only see their own documents
    if (!isHRUser(userRole)) {
      where.employeeId = userId;
    } else if (validated.data.employeeId) {
      where.employeeId = validated.data.employeeId;
    }

    const documents = await prisma.document.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        uploadedAt: "desc",
      },
    });

    const items: DocumentListItem[] = documents.map((doc) => ({
      id: doc.id,
      fileName: doc.fileName,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      uploadedAt: doc.uploadedAt,
      uploadedBy: doc.employee,
    }));

    return successResponse({ items, total: items.length });
  } catch (error) {
    const authError = handleAuthError(error);
    if (authError) return authError;
    console.error("Error listing documents:", error);
    return errorResponse("Failed to list documents", 500);
  }
}

// ============================================================================
// Download URL Generation
// ============================================================================

/**
 * Get presigned URL for file download
 * GET /api/documents/:id/download
 */
export async function getDownloadUrlHandler(
  request: Request,
  documentId: string
): Promise<Response> {
  try {
    const auth = await requireAuth();
    const userId = auth.userId;
    const userRole = auth.role;

    if (!isS3Configured()) {
      return errorResponse("File download is not configured", 503);
    }

    const validated = DocumentIdSchema.safeParse(documentId);
    if (!validated.success) {
      return errorResponse("Invalid document ID", 400);
    }

    // Get document and verify access
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        objective: {
          select: {
            assignedTo: true,
          },
        },
      },
    });

    if (!document) {
      return errorResponse("Document not found", 404);
    }

    // Check access: owner, their manager, or HR
    const isOwner = document.employeeId === userId;
    const isHR = isHRUser(userRole);

    let isManager = false;
    if (!isOwner && !isHR) {
      // Check if user is the manager of the document owner
      const employee = await prisma.user.findUnique({
        where: { id: document.employeeId },
        select: { managerId: true },
      });
      isManager = employee?.managerId === userId;
    }

    if (!isOwner && !isHR && !isManager) {
      return errorResponse("Access denied", 403);
    }

    // Generate presigned download URL
    const result = await generatePresignedDownloadUrl(document.fileKey);

    const response: GetDownloadUrlResponse = {
      downloadUrl: result.downloadUrl,
      fileName: document.fileName,
      expiresInSeconds: result.expiresInSeconds,
    };

    return successResponse(response);
  } catch (error) {
    const authError = handleAuthError(error);
    if (authError) return authError;
    console.error("Error generating download URL:", error);
    return errorResponse("Failed to generate download URL", 500);
  }
}

// ============================================================================
// Document Deletion
// ============================================================================

/**
 * Delete a document
 * DELETE /api/documents/:id
 */
export async function deleteDocumentHandler(
  request: Request,
  documentId: string
): Promise<Response> {
  try {
    const auth = await requireAuth();
    const userId = auth.userId;

    const validated = DocumentIdSchema.safeParse(documentId);
    if (!validated.success) {
      return errorResponse("Invalid document ID", 400);
    }

    // Get document and verify ownership
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return errorResponse("Document not found", 404);
    }

    // Only the owner can delete
    if (document.employeeId !== userId) {
      return errorResponse("Access denied", 403);
    }

    // Delete from S3
    if (isS3Configured()) {
      try {
        await deleteFileFromS3(document.fileKey);
      } catch (s3Error) {
        console.error("Error deleting from S3:", s3Error);
        // Continue to delete from database even if S3 delete fails
      }
    }

    // Delete from database
    await prisma.document.delete({
      where: { id: documentId },
    });

    return successResponse({ message: "Document deleted successfully" });
  } catch (error) {
    const authError = handleAuthError(error);
    if (authError) return authError;
    console.error("Error deleting document:", error);
    return errorResponse("Failed to delete document", 500);
  }
}
