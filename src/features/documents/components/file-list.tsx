"use client";

/**
 * FileList Component
 *
 * Displays a list of uploaded documents with download and delete actions.
 */

import { useCallback, useState } from "react";
import {
  FileText,
  Download,
  Trash2,
  FileSpreadsheet,
  Image,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";
import {
  type DocumentListItem,
  formatFileSize,
  getFileIcon,
} from "../types";

export interface FileListProps {
  documents: DocumentListItem[];
  onDelete?: (documentId: string) => Promise<void>;
  onDownload?: (documentId: string, fileName: string) => Promise<void>;
  readOnly?: boolean;
  className?: string;
}

export function FileList({
  documents,
  onDelete,
  onDownload,
  readOnly = false,
  className,
}: FileListProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDownload = useCallback(
    async (doc: DocumentListItem) => {
      if (downloadingId) return;

      setDownloadingId(doc.id);
      try {
        // Get download URL from API
        const response = await fetch(`/api/documents/${doc.id}/download`);

        if (!response.ok) {
          throw new Error("Failed to get download URL");
        }

        const { downloadUrl, fileName } = await response.json();

        // Open download URL in new tab (browser will handle download)
        window.open(downloadUrl, "_blank");

        onDownload?.(doc.id, fileName);
      } catch (error) {
        console.error("Download failed:", error);
      } finally {
        setDownloadingId(null);
      }
    },
    [downloadingId, onDownload]
  );

  const handleDelete = useCallback(
    async (doc: DocumentListItem) => {
      if (!onDelete || deletingId) return;

      if (!confirm(`Are you sure you want to delete "${doc.fileName}"?`)) {
        return;
      }

      setDeletingId(doc.id);
      try {
        await onDelete(doc.id);
      } catch (error) {
        console.error("Delete failed:", error);
      } finally {
        setDeletingId(null);
      }
    },
    [onDelete, deletingId]
  );

  const getFileIconComponent = (mimeType: string) => {
    const iconName = getFileIcon(mimeType);
    switch (iconName) {
      case "file-spreadsheet":
        return FileSpreadsheet;
      case "image":
        return Image;
      default:
        return FileText;
    }
  };

  if (documents.length === 0) {
    return (
      <div
        className={cn(
          "text-center py-6 text-muted-foreground text-sm",
          className
        )}
      >
        No documents uploaded yet
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {documents.map((doc) => {
        const Icon = getFileIconComponent(doc.mimeType);
        const isDownloading = downloadingId === doc.id;
        const isDeleting = deletingId === doc.id;

        return (
          <div
            key={doc.id}
            className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <Icon className="w-5 h-5 text-muted-foreground shrink-0" />

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{doc.fileName}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{formatFileSize(doc.fileSize)}</span>
                <span>•</span>
                <span>
                  Uploaded{" "}
                  {new Date(doc.uploadedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                {doc.uploadedBy && (
                  <>
                    <span>•</span>
                    <span>by {doc.uploadedBy.name}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleDownload(doc)}
                disabled={isDownloading || isDeleting}
                className="h-8 px-2"
                title="Download"
              >
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
              </Button>

              {!readOnly && onDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(doc)}
                  disabled={isDownloading || isDeleting}
                  className="h-8 px-2 text-destructive hover:text-destructive"
                  title="Delete"
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
