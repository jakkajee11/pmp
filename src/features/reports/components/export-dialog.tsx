"use client";

/**
 * Export Dialog Component
 *
 * Modal dialog for exporting reports in various formats.
 * Professional Corporate style with navy blue primary colors.
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { ReportType, ExportFormat } from "../types";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (format: ExportFormat, reportType: ReportType) => Promise<void>;
  isExporting?: boolean;
  defaultReportType?: ReportType;
}

const REPORT_TYPES: Array<{ value: ReportType; label: string; description: string }> = [
  {
    value: "completion",
    label: "Completion Report",
    description: "Evaluation progress and completion rates by department",
  },
  {
    value: "ratings",
    label: "Rating Distribution",
    description: "Distribution of ratings across KPIs and core values",
  },
  {
    value: "detailed",
    label: "Detailed Report",
    description: "Individual employee evaluations with scores",
  },
];

export function ExportDialog({
  open,
  onOpenChange,
  onExport,
  isExporting = false,
  defaultReportType = "completion",
}: ExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("csv");
  const [selectedReportType, setSelectedReportType] = useState<ReportType>(defaultReportType);

  const handleExport = async () => {
    await onExport(selectedFormat, selectedReportType);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-[#1e3a5f]">Export Report</DialogTitle>
          <DialogDescription>
            Choose the report type and export format for your download.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Report Type Selection */}
          <div className="space-y-2">
            <Label className="text-slate-700 font-medium">Report Type</Label>
            <Select
              value={selectedReportType}
              onValueChange={(v) => setSelectedReportType(v as ReportType)}
            >
              <SelectTrigger className="border-slate-300 focus:border-[#1e3a5f] focus:ring-[#1e3a5f]">
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{type.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">
              {REPORT_TYPES.find((t) => t.value === selectedReportType)?.description}
            </p>
          </div>

          {/* Format Selection */}
          <div className="space-y-2">
            <Label className="text-slate-700 font-medium">Export Format</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedFormat("csv")}
                className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                  selectedFormat === "csv"
                    ? "border-[#1e3a5f] bg-[#1e3a5f]/5"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <svg
                  className={`w-8 h-8 mb-2 ${
                    selectedFormat === "csv" ? "text-[#1e3a5f]" : "text-slate-400"
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span
                  className={`font-medium ${
                    selectedFormat === "csv" ? "text-[#1e3a5f]" : "text-slate-600"
                  }`}
                >
                  CSV
                </span>
                <span className="text-xs text-slate-400">Spreadsheet format</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedFormat("pdf")}
                className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                  selectedFormat === "pdf"
                    ? "border-[#1e3a5f] bg-[#1e3a5f]/5"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <svg
                  className={`w-8 h-8 mb-2 ${
                    selectedFormat === "pdf" ? "text-[#1e3a5f]" : "text-slate-400"
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                <span
                  className={`font-medium ${
                    selectedFormat === "pdf" ? "text-[#1e3a5f]" : "text-slate-600"
                  }`}
                >
                  PDF
                </span>
                <span className="text-xs text-slate-400">Document format</span>
              </button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
            className="border-slate-300"
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="bg-[#1e3a5f] hover:bg-[#2d4a6f] text-white"
          >
            {isExporting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Exporting...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Export {selectedFormat.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ExportDialog;
