"use client";

/**
 * FileUpload Component
 *
 * Drag-and-drop file upload component with progress indication.
 */

import { useCallback, useState } from "react";
import { Upload, X, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";
import {
  type UploadingFile,
  type FileValidationResult,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  formatFileSize,
  validateFile,
} from "../types";

export interface FileUploadProps {
  objectiveId: string;
  onUploadComplete?: (documentId: string, fileName: string) => void;
  onUploadError?: (fileName: string, error: string) => void;
  disabled?: boolean;
  maxFiles?: number;
  className?: string;
}

export function FileUpload({
  objectiveId,
  onUploadComplete,
  onUploadError,
  disabled = false,
  maxFiles = 5,
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const uploadFile = async (file: File): Promise<void> => {
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

      const { id } = await confirmResponse.json();

      // Mark as success
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.file === file
            ? { ...f, status: "success", progress: 100, documentId: id }
            : f
        )
      );

      onUploadComplete?.(id, file.name);
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
  };

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      setError(null);

      const fileArray = Array.from(files);

      // Check max files
      const currentCount = uploadingFiles.filter(
        (f) => f.status === "uploading"
      ).length;
      if (currentCount + fileArray.length > maxFiles) {
        setError(`Maximum ${maxFiles} files allowed`);
        return;
      }

      // Validate files
      const validFiles: File[] = [];
      for (const file of fileArray) {
        const validation = validateFile(file);
        if (!validation.valid) {
          setError(validation.error || "Invalid file");
          continue;
        }
        validFiles.push(file);
      }

      // Upload valid files
      for (const file of validFiles) {
        await uploadFile(file);
      }
    },
    [objectiveId, maxFiles, uploadingFiles, onUploadComplete, onUploadError]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        processFiles(files);
      }
    },
    [disabled, processFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        processFiles(files);
      }
      // Reset input
      e.target.value = "";
    },
    [processFiles]
  );

  const removeFile = useCallback((file: File) => {
    setUploadingFiles((prev) => prev.filter((f) => f.file !== file));
  }, []);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm font-medium mb-1">
          Drag and drop files here, or click to browse
        </p>
        <p className="text-xs text-muted-foreground mb-3">
          PDF, Word, Excel, or images up to {formatFileSize(MAX_FILE_SIZE)}
        </p>
        <input
          type="file"
          multiple
          accept={ALLOWED_MIME_TYPES.join(",")}
          onChange={handleFileSelect}
          disabled={disabled}
          className="hidden"
          id="file-upload-input"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => document.getElementById("file-upload-input")?.click()}
        >
          Browse Files
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Uploading Files List */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((uploadingFile, index) => (
            <div
              key={`${uploadingFile.file.name}-${index}`}
              className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
            >
              <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {uploadingFile.file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(uploadingFile.file.size)}
                </p>
                {uploadingFile.status === "uploading" && (
                  <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${uploadingFile.progress}%` }}
                    />
                  </div>
                )}
                {uploadingFile.status === "error" && (
                  <p className="text-xs text-destructive mt-1">
                    {uploadingFile.error}
                  </p>
                )}
              </div>
              <div className="shrink-0">
                {uploadingFile.status === "success" && (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                )}
                {uploadingFile.status === "error" && (
                  <button
                    type="button"
                    onClick={() => removeFile(uploadingFile.file)}
                    className="p-1 hover:bg-muted rounded"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
                {uploadingFile.status === "uploading" && (
                  <span className="text-xs text-muted-foreground">
                    {uploadingFile.progress}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
