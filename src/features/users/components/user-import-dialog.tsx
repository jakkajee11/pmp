/**
 * User Import Dialog Component
 *
 * Dialog for bulk importing users via CSV file.
 * Includes template download and validation feedback.
 */

"use client";

import * as React from "react";
import { Upload, Download, FileText, AlertCircle, CheckCircle, X } from "lucide-react";
import { Button } from "../../../shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../shared/components/ui/dialog";
import { Separator } from "../../../shared/components/ui/separator";
import { BulkImportResult } from "../types";
import { cn } from "../../../shared/lib/utils";

interface UserImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (file: File) => Promise<BulkImportResult>;
  onDownloadTemplate: () => void;
}

export function UserImportDialog({
  open,
  onOpenChange,
  onImport,
  onDownloadTemplate,
}: UserImportDialogProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [result, setResult] = React.useState<BulkImportResult | null>(null);
  const [dragActive, setDragActive] = React.useState(false);

  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.name.endsWith(".csv")) {
      alert("Please select a CSV file");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    setFile(selectedFile);
    setResult(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      const importResult = await onImport(file);
      setResult(importResult);
    } catch (error) {
      console.error("Import failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    onOpenChange(false);
  };

  const handleBrowseClick = () => {
    inputRef.current?.click();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg border-slate-200">
        <DialogHeader className="bg-slate-50 border-b border-slate-200 -mx-6 -mt-6 px-6 py-4">
          <DialogTitle className="text-lg font-semibold text-slate-900">
            Import Users
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Upload a CSV file to bulk import user accounts.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Template Download */}
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={onDownloadTemplate}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Download CSV Template
            </Button>
            <p className="text-xs text-slate-500 mt-2">
              Download the template to see the required format
            </p>
          </div>

          <Separator className="bg-slate-200 mb-6" />

          {/* File Upload Area */}
          {!result ? (
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                dragActive
                  ? "border-[#1e3a5f] bg-blue-50"
                  : "border-slate-300 hover:border-slate-400"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".csv"
                onChange={handleInputChange}
                className="hidden"
              />

              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="h-8 w-8 text-[#1e3a5f]" />
                  <div className="text-left">
                    <p className="font-medium text-slate-900">{file.name}</p>
                    <p className="text-sm text-slate-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFile(null)}
                    className="ml-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="h-10 w-10 mx-auto text-slate-400 mb-4" />
                  <p className="text-slate-700 font-medium mb-2">
                    Drag and drop your CSV file here
                  </p>
                  <p className="text-sm text-slate-500 mb-4">or</p>
                  <Button
                    variant="outline"
                    onClick={handleBrowseClick}
                    className="border-slate-300"
                  >
                    Browse Files
                  </Button>
                </>
              )}
            </div>
          ) : (
            /* Import Result */
            <div className="space-y-4">
              {result.imported > 0 && (
                <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-emerald-800">
                      Successfully imported {result.imported} user(s)
                    </p>
                  </div>
                </div>
              )}

              {result.skipped > 0 && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800">
                      Skipped {result.skipped} existing user(s)
                    </p>
                    <p className="text-sm text-amber-700 mt-1">
                      Users with matching emails were not imported.
                    </p>
                  </div>
                </div>
              )}

              {result.errors.length > 0 && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-red-800">
                      {result.errors.length} row(s) had errors
                    </p>
                    <ul className="mt-2 text-sm text-red-700 space-y-1 max-h-32 overflow-y-auto">
                      {result.errors.slice(0, 5).map((error, i) => (
                        <li key={i}>
                          Row {error.row}: {error.error}
                        </li>
                      ))}
                      {result.errors.length > 5 && (
                        <li>...and {result.errors.length - 5} more errors</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="bg-slate-50 border-t border-slate-200 -mx-6 -mb-6 px-6 py-4">
          <Button
            variant="outline"
            onClick={handleClose}
            className="border-slate-300 text-slate-700"
          >
            {result ? "Close" : "Cancel"}
          </Button>
          {!result && (
            <Button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="bg-[#1e3a5f] hover:bg-[#152d4a] text-white"
            >
              {isUploading ? "Importing..." : "Import Users"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
