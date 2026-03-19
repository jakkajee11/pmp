/**
 * useFileUpload Hook
 *
 * Custom hook for managing file upload state and operations.
 */

import { useCallback, useState } from "react";
import {
  type DocumentListItem,
  type UploadingFile,
  type FileValidationResult,
  validateFile,
} from "../types";

export interface UseFileUploadOptions {
  objectiveId: string;
  onUploadComplete?: (document: DocumentListItem) => void;
  onUploadError?: (fileName: string, error: string) => void;
  onDeleteComplete?: (documentId: string) => void;
  onDeleteError?: (documentId: string, error: string) => void;
}

export interface UseFileUploadReturn {
  uploadingFiles: UploadingFile[];
  documents: DocumentListItem[];
  isUploading: boolean;
  error: string | null;
  uploadFile: (file: File) => Promise<void>;
  uploadFiles: (files: File[]) => Promise<void>;
  deleteDocument: (documentId: string) => Promise<void>;
  removeUploadingFile: (file: File) => void;
  clearError: () => void;
  refreshDocuments: () => Promise<void>;
}

export function useFileUpload(
  options: UseFileUploadOptions
): UseFileUploadReturn {
  const { objectiveId, onUploadComplete, onUploadError, onDeleteComplete, onDeleteError } =
    options;

  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const isUploading = uploadingFiles.some((f) => f.status === "uploading");

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const uploadFile = useCallback(
    async (file: File): Promise<void> => {
      // Validate file first
      const validation = validateFile(file);
      if (!validation.valid) {
        setError(validation.error || "Invalid file");
        onUploadError?.(file.name, validation.error || "Invalid file");
        return;
      }

      const fileId = `${Date.now()}-${file.name}`;

      // Add to uploading files
      setUploadingFiles((prev) => [
        ...prev,
        { file, status: "uploading", progress: 0 },
      ]);

      try {
        // Step 1: Get presigned upload URL
        const urlResponse = await fetch("/api/documents/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            objectiveId,
          }),
        });

        if (!urlResponse.ok) {
          const errorData = await urlResponse.json();
          throw new Error(errorData.error || "Failed to get upload URL");
        }

        const { uploadUrl, fileKey } = await urlResponse.json();

        // Update progress
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.file === file ? { ...f, progress: 30 } : f
          )
        );

        // Step 2: Upload to S3
        const uploadResponse = await fetch(uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": file.type,
          },
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload file to storage");
        }

        // Update progress
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.file === file ? { ...f, progress: 70 } : f
          )
        );

        // Step 3: Confirm upload
        const confirmResponse = await fetch("/api/documents/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            objectiveId,
            fileName: file.name,
            fileKey,
            fileSize: file.size,
            mimeType: file.type,
          }),
        });

        if (!confirmResponse.ok) {
          const errorData = await confirmResponse.json();
          throw new Error(errorData.error || "Failed to confirm upload");
        }

        const { id, fileName, fileSize, mimeType, uploadedAt } =
          await confirmResponse.json();

        // Create document list item
        const newDocument: DocumentListItem = {
          id,
          fileName,
          fileSize,
          mimeType,
          uploadedAt: new Date(uploadedAt),
        };

        // Mark as success
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.file === file
              ? { ...f, status: "success", progress: 100, documentId: id }
              : f
          )
        );

        // Add to documents list
        setDocuments((prev) => [newDocument, ...prev]);

        onUploadComplete?.(newDocument);

        // Remove from uploading files after a delay
        setTimeout(() => {
          setUploadingFiles((prev) => prev.filter((f) => f.file !== file));
        }, 2000);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Upload failed";

        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.file === file ? { ...f, status: "error", error: errorMessage } : f
          )
        );

        onUploadError?.(file.name, errorMessage);
      }
    },
    [objectiveId, onUploadComplete, onUploadError]
  );

  const uploadFiles = useCallback(
    async (files: File[]): Promise<void> => {
      for (const file of files) {
        await uploadFile(file);
      }
    },
    [uploadFile]
  );

  const deleteDocument = useCallback(
    async (documentId: string): Promise<void> => {
      try {
        const response = await fetch(`/api/documents/${documentId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to delete document");
        }

        // Remove from documents list
        setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
        onDeleteComplete?.(documentId);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Delete failed";
        onDeleteError?.(documentId, errorMessage);
        throw err;
      }
    },
    [onDeleteComplete, onDeleteError]
  );

  const removeUploadingFile = useCallback((file: File) => {
    setUploadingFiles((prev) => prev.filter((f) => f.file !== file));
  }, []);

  const refreshDocuments = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/documents?objectiveId=${objectiveId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch documents");
      }

      const { items } = await response.json();
      setDocuments(items);
    } catch (err) {
      console.error("Failed to refresh documents:", err);
    }
  }, [objectiveId]);

  return {
    uploadingFiles,
    documents,
    isUploading,
    error,
    uploadFile,
    uploadFiles,
    deleteDocument,
    removeUploadingFile,
    clearError,
    refreshDocuments,
  };
}
