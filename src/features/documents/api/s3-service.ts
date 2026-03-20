/**
 * S3 Service
 *
 * Handles S3 operations for document upload and download.
 */

import { env } from "@/env";
import {
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// ============================================================================
// S3 Client Configuration
// ============================================================================

let s3Client: S3Client | null = null;

/**
 * Get or create S3 client singleton
 */
function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: env.AWS_REGION || "ap-southeast-1",
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY || "",
      },
    });
  }
  return s3Client;
}

/**
 * Check if S3 is configured
 */
export function isS3Configured(): boolean {
  return Boolean(
    env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && env.S3_BUCKET_NAME
  );
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Presigned URL expiration time in seconds (15 minutes)
 */
const PRESIGNED_URL_EXPIRATION = 900;

/**
 * S3 key prefix for documents
 */
const DOCUMENT_KEY_PREFIX = "documents";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a unique S3 key for a document
 */
function generateFileKey(
  objectiveId: string,
  employeeId: string,
  fileName: string
): string {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `${DOCUMENT_KEY_PREFIX}/${objectiveId}/${employeeId}/${timestamp}-${sanitizedFileName}`;
}

// ============================================================================
// S3 Operations
// ============================================================================

export interface PresignedUploadUrlResult {
  uploadUrl: string;
  fileKey: string;
  expiresInSeconds: number;
}

/**
 * Generate a presigned URL for uploading a file to S3
 */
export async function generatePresignedUploadUrl(
  objectiveId: string,
  employeeId: string,
  fileName: string,
  contentType: string
): Promise<PresignedUploadUrlResult> {
  const client = getS3Client();
  const bucketName = env.S3_BUCKET_NAME;

  if (!bucketName) {
    throw new Error("S3 bucket name is not configured");
  }

  const fileKey = generateFileKey(objectiveId, employeeId, fileName);

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileKey,
    ContentType: contentType,
    Metadata: {
      "objective-id": objectiveId,
      "employee-id": employeeId,
      "original-filename": encodeURIComponent(fileName),
    },
  });

  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn: PRESIGNED_URL_EXPIRATION,
  });

  return {
    uploadUrl,
    fileKey,
    expiresInSeconds: PRESIGNED_URL_EXPIRATION,
  };
}

export interface PresignedDownloadUrlResult {
  downloadUrl: string;
  expiresInSeconds: number;
}

/**
 * Generate a presigned URL for downloading a file from S3
 */
export async function generatePresignedDownloadUrl(
  fileKey: string
): Promise<PresignedDownloadUrlResult> {
  const client = getS3Client();
  const bucketName = env.S3_BUCKET_NAME;

  if (!bucketName) {
    throw new Error("S3 bucket name is not configured");
  }

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: fileKey,
  });

  const downloadUrl = await getSignedUrl(client, command, {
    expiresIn: PRESIGNED_URL_EXPIRATION,
  });

  return {
    downloadUrl,
    expiresInSeconds: PRESIGNED_URL_EXPIRATION,
  };
}

/**
 * Delete a file from S3
 */
export async function deleteFileFromS3(fileKey: string): Promise<void> {
  const client = getS3Client();
  const bucketName = env.S3_BUCKET_NAME;

  if (!bucketName) {
    throw new Error("S3 bucket name is not configured");
  }

  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: fileKey,
  });

  await client.send(command);
}

/**
 * Verify that a file exists in S3 (by attempting to get metadata)
 * Note: This is a lightweight check that doesn't download the file
 */
export async function verifyFileExists(fileKey: string): Promise<boolean> {
  const client = getS3Client();
  const bucketName = env.S3_BUCKET_NAME;

  if (!bucketName) {
    throw new Error("S3 bucket name is not configured");
  }

  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      Range: "bytes=0-0", // Only fetch first byte to verify existence
    });

    await client.send(command);
    return true;
  } catch {
    return false;
  }
}
