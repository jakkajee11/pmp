/**
 * Documents Feature
 *
 * File upload and document management for objectives.
 */

// Types
export type {
  Document,
  DocumentWithRelations,
  DocumentListItem,
  DocumentListParams,
  GetUploadUrlRequest,
  GetUploadUrlResponse,
  ConfirmUploadRequest,
  ConfirmUploadResponse,
  GetDownloadUrlResponse,
  UploadingFile,
  UploadStatus,
  FileValidationResult,
} from "./types";

export {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  FILE_TYPE_LABELS,
  formatFileSize,
  getFileExtension,
  validateFile,
  getFileIcon,
  GetUploadUrlSchema,
  ConfirmUploadSchema,
  DocumentListQuerySchema,
  DocumentIdSchema,
} from "./types";

// Components
export { FileUpload, type FileUploadProps } from "./components/file-upload";
export { FileList, type FileListProps } from "./components/file-list";

// Hooks
export {
  useFileUpload,
  type UseFileUploadOptions,
  type UseFileUploadReturn,
} from "./hooks/use-file-upload";
