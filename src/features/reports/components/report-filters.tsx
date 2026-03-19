"use client";

/**
 * Report Filters Component
 *
 * Filter controls for reports with cycle and department selectors.
 * Professional Corporate style with navy blue primary colors.
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { ReportFilters as ReportFiltersType, FilterOption, ReportType } from "../types";

interface ReportFiltersProps {
  filters: ReportFiltersType;
  onFiltersChange: (filters: ReportFiltersType) => void;
  cycles: FilterOption[];
  departments: FilterOption[];
  onApply: () => void;
  onExport: (format: "csv" | "pdf") => void;
  isExporting?: boolean;
}

export function ReportFilters({
  filters,
  onFiltersChange,
  cycles,
  departments,
  onApply,
  onExport,
  isExporting = false,
}: ReportFiltersProps) {
  const [localFilters, setLocalFilters] = useState<ReportFiltersType>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleCycleChange = (value: string) => {
    setLocalFilters((prev) => ({ ...prev, cycleId: value }));
  };

  const handleDepartmentChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      departmentId: value === "all" ? null : value,
    }));
  };

  const handleReportTypeChange = (value: ReportType) => {
    setLocalFilters((prev) => ({ ...prev, reportType: value }));
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    onApply();
  };

  const hasChanges =
    localFilters.cycleId !== filters.cycleId ||
    localFilters.departmentId !== filters.departmentId ||
    localFilters.reportType !== filters.reportType;

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-4">
        <CardTitle className="text-[#1e3a5f] text-lg">Report Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cycle Selector */}
        <div className="space-y-2">
          <Label htmlFor="cycle" className="text-slate-700 font-medium">
            Review Cycle
          </Label>
          <Select value={localFilters.cycleId || ""} onValueChange={handleCycleChange}>
            <SelectTrigger id="cycle" className="border-slate-300 focus:border-[#1e3a5f] focus:ring-[#1e3a5f]">
              <SelectValue placeholder="Select a cycle" />
            </SelectTrigger>
            <SelectContent>
              {cycles.map((cycle) => (
                <SelectItem key={cycle.value} value={cycle.value}>
                  {cycle.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Department Selector */}
        <div className="space-y-2">
          <Label htmlFor="department" className="text-slate-700 font-medium">
            Department
          </Label>
          <Select
            value={localFilters.departmentId || "all"}
            onValueChange={handleDepartmentChange}
          >
            <SelectTrigger id="department" className="border-slate-300 focus:border-[#1e3a5f] focus:ring-[#1e3a5f]">
              <SelectValue placeholder="All departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.value} value={dept.value}>
                  {dept.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Report Type Selector */}
        <div className="space-y-2">
          <Label htmlFor="reportType" className="text-slate-700 font-medium">
            Report Type
          </Label>
          <Select
            value={localFilters.reportType}
            onValueChange={(v) => handleReportTypeChange(v as ReportType)}
          >
            <SelectTrigger id="reportType" className="border-slate-300 focus:border-[#1e3a5f] focus:ring-[#1e3a5f]">
              <SelectValue placeholder="Select report type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="completion">Completion Report</SelectItem>
              <SelectItem value="ratings">Rating Distribution</SelectItem>
              <SelectItem value="detailed">Detailed Report</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            onClick={handleApply}
            disabled={!localFilters.cycleId}
            className="flex-1 bg-[#1e3a5f] hover:bg-[#2d4a6f] text-white"
          >
            Generate Report
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onExport("csv")}
              disabled={!localFilters.cycleId || isExporting}
              className="flex-1 border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white"
            >
              {isExporting ? "Exporting..." : "CSV"}
            </Button>
            <Button
              variant="outline"
              onClick={() => onExport("pdf")}
              disabled={!localFilters.cycleId || isExporting}
              className="flex-1 border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white"
            >
              {isExporting ? "Exporting..." : "PDF"}
            </Button>
          </div>
        </div>

        {/* Change Indicator */}
        {hasChanges && (
          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
            You have unsaved changes. Click &quot;Generate Report&quot; to apply.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ReportFilters;
