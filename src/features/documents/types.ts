/**
 * Document Types
 *
 * Type definitions for document upload feature.
 */

import { z } from "zod";

// ============================================================================
// File Type Constants
// ============================================================================

/**
 * Allowed file MIME types for document upload
 */
export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/gif",
] as const;

/**
 * Maximum file size in bytes (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * File type labels for display
 */
export const FILE_TYPE_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "application/msword": "Word",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word",
  "application/vnd.ms-excel": "Excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "Excel",
  "image/jpeg": "JPEG",
  "image/png": "PNG",
  "image/gif": "GIF",
};

// ============================================================================
// Document Entity Types
// ============================================================================

/**
 * Document entity type (matches Prisma schema)
 */
export interface Document {
  id: string;
  objectiveId: string;
  employeeId: string;
  fileName: string;
  fileKey: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
}

/**
 * Document with related data
 */
export interface DocumentWithRelations extends Document {
  objective: {
    id: string;
    title: string;
  };
  employee: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * Document list item for display
 */
export interface DocumentListItem {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
  uploadedBy?: {
    id: string;
    name: string;
  };
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Upload URL request
 */
export interface GetUploadUrlRequest {
  fileName: string;
  fileType: string;
  fileSize: number;
  objectiveId: string;
}

/**
 * Upload URL response
 */
export interface GetUploadUrlResponse {
  uploadUrl: string;
  fileKey: string;
  expiresInSeconds: number;
}

/**
 * Confirm upload request
 */
export interface ConfirmUploadRequest {
  objectiveId: string;
  fileName: string;
  fileKey: string;
  fileSize: number;
  mimeType: string;
}

/**
 * Confirm upload response
 */
export interface ConfirmUploadResponse {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
}

/**
 * Download URL response
 */
export interface GetDownloadUrlResponse {
  downloadUrl: string;
  fileName: string;
  expiresInSeconds: number;
}

/**
 * Document list params for API queries
 */
export interface DocumentListParams {
  objectiveId?: string;
  employeeId?: string;
}

// ============================================================================
// File Upload State Types
// ============================================================================

/**
 * File upload status
 */
export type UploadStatus = "idle" | "uploading" | "success" | "error";

/**
 * File being uploaded
 */
export interface UploadingFile {
  file: File;
  status: UploadStatus;
  progress: number;
  error?: string;
  documentId?: string;
}

/**
 * File validation result
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

export const AllowedMimeTypeSchema = z.enum([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/gif",
]);

export const GetUploadUrlSchema = z.object({
  fileName: z.string().min(1, "File name is required").max(255, "File name too long"),
  fileType: AllowedMimeTypeSchema,
  fileSize: z
    .number()
    .int()
    .positive("File size must be positive")
    .max(MAX_FILE_SIZE, `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`),
  objectiveId: z.string().uuid("Invalid objective ID format"),
});

export const ConfirmUploadSchema = z.object({
  objectiveId: z.string().uuid("Invalid objective ID format"),
  fileName: z.string().min(1, "File name is required").max(255, "File name too long"),
  fileKey: z.string().min(1, "File key is required").max(500, "File key too long"),
  fileSize: z
    .number()
    .int()
    .positive("File size must be positive")
    .max(MAX_FILE_SIZE, `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`),
  mimeType: AllowedMimeTypeSchema,
});

export const DocumentListQuerySchema = z.object({
  objectiveId: z.string().uuid().optional(),
  employeeId: z.string().uuid().optional(),
});

export const DocumentIdSchema = z.string().uuid("Invalid document ID format");

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Get file extension from filename
 */
export function getFileExtension(fileName: string): string {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.pop()?.toLowerCase() || "" : "";
}

/**
 * Validate file before upload
 */
export function validateFile(file: File): FileValidationResult {
  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    return {
      valid: false,
      error: `File type "${file.type}" is not allowed. Allowed types: PDF, Word, Excel, JPEG, PNG, GIF`,
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size (${formatFileSize(file.size)}) exceeds maximum allowed size (${formatFileSize(MAX_FILE_SIZE)})`,
    };
  }

  return { valid: true };
}

/**
 * Get file icon name based on mime type
 */
export function getFileIcon(mimeType: string): string {
  if (mimeType.includes("pdf")) return "file-text";
  if (mimeType.includes("word") || mimeType.includes("document")) return "file-text";
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return "file-spreadsheet";
  if (mimeType.includes("image")) return "image";
  return "file";
}
