"use client";

/**
 * Reports Page
 *
 * Main reports dashboard with completion reports, rating distribution,
 * and export functionality.
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../shared/components/ui/card";
import { Button } from "../../../shared/components/ui/button";
import { Label } from "../../../shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../shared/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../shared/components/ui/dialog";
import { Badge } from "../../../shared/components/ui/badge";
import {
  useReports,
  CompletionReport as CompletionReportType,
  RatingDistributionReport,
  ReportFilters as ReportFiltersType,
  FilterOption,
  ExportFormat,
  ReportType,
  STATUS_COLORS,
  RATING_COLORS,
} from "../../../features/reports";

export default function ReportsPage() {
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<"completion" | "ratings">("completion");

  const {
    completionReport,
    ratingDistribution,
    isLoadingCompletion,
    isLoadingRatings,
    isExporting,
    completionError,
    ratingsError,
    exportError,
    filters,
    cycles,
    departments,
    fetchCompletionReport,
    fetchRatingDistribution,
    exportReport,
    setFilters,
    fetchFilterOptions,
  } = useReports();

  // Fetch filter options on mount
  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  // Fetch report data when filters change and apply is clicked
  const handleApplyFilters = () => {
    if (activeTab === "completion") {
      fetchCompletionReport();
    } else {
      fetchRatingDistribution();
    }
  };

  // Handle tab change
  const handleTabChange = (value: "completion" | "ratings") => {
    setActiveTab(value);
    setFilters({ ...filters, reportType: value });
  };

  // Handle export
  const handleExport = async (format: ExportFormat) => {
    await exportReport(format);
    setShowExportDialog(false);
  };

  const error = completionError || ratingsError || exportError;

  return (
    <div className="container mx-auto py-6 px-4 md:px-6 max-w-7xl">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#1e3a5f]">Reports & Analytics</h1>
        <p className="text-slate-500 mt-1">
          View evaluation progress, rating distributions, and export reports.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <Card className="border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-[#1e3a5f] text-lg">Report Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cycle Selector */}
              <div className="space-y-2">
                <Label className="text-slate-700 font-medium">Review Cycle</Label>
                <Select
                  value={filters.cycleId || ""}
                  onValueChange={(value) => setFilters({ ...filters, cycleId: value })}
                >
                  <SelectTrigger className="border-slate-300 focus:border-[#1e3a5f] focus:ring-[#1e3a5f]">
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
                <Label className="text-slate-700 font-medium">Department</Label>
                <Select
                  value={filters.departmentId || "all"}
                  onValueChange={(value) =>
                    setFilters({ ...filters, departmentId: value === "all" ? null : value })
                  }
                >
                  <SelectTrigger className="border-slate-300 focus:border-[#1e3a5f] focus:ring-[#1e3a5f]">
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

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-4">
                <Button
                  onClick={handleApplyFilters}
                  disabled={!filters.cycleId || isLoadingCompletion || isLoadingRatings}
                  className="bg-[#1e3a5f] hover:bg-[#2d4a6f] text-white"
                >
                  {isLoadingCompletion || isLoadingRatings ? "Loading..." : "Generate Report"}
                </Button>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFilters({ ...filters, reportType: activeTab });
                      setShowExportDialog(true);
                    }}
                    disabled={!filters.cycleId || isExporting}
                    className="flex-1 border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white"
                  >
                    Export
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report Content */}
        <div className="lg:col-span-3">
          {/* Tab Navigation */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={activeTab === "completion" ? "default" : "outline"}
              onClick={() => handleTabChange("completion")}
              className={
                activeTab === "completion"
                  ? "bg-[#1e3a5f] text-white"
                  : "border-[#1e3a5f] text-[#1e3a5f]"
              }
            >
              Completion Report
            </Button>
            <Button
              variant={activeTab === "ratings" ? "default" : "outline"}
              onClick={() => handleTabChange("ratings")}
              className={
                activeTab === "ratings"
                  ? "bg-[#1e3a5f] text-white"
                  : "border-[#1e3a5f] text-[#1e3a5f]"
              }
            >
              Rating Distribution
            </Button>
          </div>

          {/* Completion Report Tab */}
          {activeTab === "completion" && (
            <CompletionReportContent
              data={completionReport}
              isLoading={isLoadingCompletion}
            />
          )}

          {/* Rating Distribution Tab */}
          {activeTab === "ratings" && (
            <RatingDistributionContent
              data={ratingDistribution}
              isLoading={isLoadingRatings}
            />
          )}
        </div>
      </div>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-[#1e3a5f]">Export Report</DialogTitle>
            <DialogDescription>
              Choose the export format for your report.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 py-4">
            <Button
              variant="outline"
              onClick={() => handleExport("csv")}
              disabled={isExporting}
              className="h-20 flex-col border-slate-300 hover:border-[#1e3a5f] hover:text-[#1e3a5f]"
            >
              <span className="text-lg font-bold">CSV</span>
              <span className="text-xs text-slate-500">Spreadsheet format</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport("pdf")}
              disabled={isExporting}
              className="h-20 flex-col border-slate-300 hover:border-[#1e3a5f] hover:text-[#1e3a5f]"
            >
              <span className="text-lg font-bold">PDF</span>
              <span className="text-xs text-slate-500">Document format</span>
            </Button>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowExportDialog(false)}
              disabled={isExporting}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================================
// Sub-Components
// ============================================================================

interface CompletionReportContentProps {
  data: CompletionReportType | null;
  isLoading: boolean;
}

function CompletionReportContent({ data, isLoading }: CompletionReportContentProps) {
  if (isLoading) {
    return (
      <Card className="border-slate-200">
        <CardContent className="py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded w-1/2"></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="h-24 bg-slate-200 rounded"></div>
              <div className="h-24 bg-slate-200 rounded"></div>
              <div className="h-24 bg-slate-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-[#1e3a5f]">Completion Report</CardTitle>
          <CardDescription>
            Select a review cycle and click &quot;Generate Report&quot; to view completion data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <p className="text-lg font-medium">No data to display</p>
            <p className="text-sm">Select a cycle and generate the report</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusBars = [
    { label: "Not Started", value: data.byStatus.notStarted, color: STATUS_COLORS.notStarted },
    { label: "Self In Progress", value: data.byStatus.selfInProgress, color: STATUS_COLORS.selfInProgress },
    { label: "Self Submitted", value: data.byStatus.selfSubmitted, color: STATUS_COLORS.selfSubmitted },
    { label: "Manager Review", value: data.byStatus.managerInProgress, color: STATUS_COLORS.managerInProgress },
    { label: "Completed", value: data.byStatus.completed, color: STATUS_COLORS.completed },
  ];

  const total = statusBars.reduce((sum, bar) => sum + bar.value, 0);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200 bg-gradient-to-br from-[#1e3a5f] to-[#2d4a6f] text-white">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl font-bold">{data.overall.totalEmployees}</div>
              <div className="text-sm text-slate-200 mt-1">Total Employees</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-[#1e3a5f]">
                {data.overall.selfEvalPercentage}%
              </div>
              <div className="text-sm text-slate-500 mt-1">Self-Evaluation Complete</div>
              <div className="text-xs text-slate-400 mt-1">
                {data.overall.selfEvalCompleted} of {data.overall.totalEmployees}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-[#1e3a5f]">
                {data.overall.managerReviewPercentage}%
              </div>
              <div className="text-sm text-slate-500 mt-1">Manager Review Complete</div>
              <div className="text-xs text-slate-400 mt-1">
                {data.overall.managerReviewCompleted} of {data.overall.totalEmployees}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-[#1e3a5f]">Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Horizontal Bar Chart */}
          <div className="mb-6">
            <div className="flex h-8 rounded-lg overflow-hidden">
              {statusBars.map((bar, index) => {
                const percentage = total > 0 ? (bar.value / total) * 100 : 0;
                return (
                  <div
                    key={index}
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: bar.color,
                    }}
                    className="transition-all duration-300 hover:opacity-80"
                    title={`${bar.label}: ${bar.value} (${percentage.toFixed(1)}%)`}
                  />
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {statusBars.map((bar, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: bar.color }} />
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-700">{bar.label}</div>
                  <div className="text-xs text-slate-500">{bar.value} employees</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Department Breakdown */}
      {data.byDepartment.length > 0 && (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-[#1e3a5f]">Progress by Department</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#1e3a5f]">
                      Department
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-[#1e3a5f]">
                      Total
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-[#1e3a5f]">
                      Self-Eval
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-[#1e3a5f]">
                      Manager Review
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#1e3a5f]">
                      Progress
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.byDepartment.map((dept, index) => {
                    const managerPct =
                      dept.total > 0 ? (dept.managerReviewCompleted / dept.total) * 100 : 0;

                    return (
                      <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 text-sm text-slate-700">{dept.department.name}</td>
                        <td className="py-3 px-4 text-sm text-center text-slate-600">{dept.total}</td>
                        <td className="py-3 px-4 text-sm text-center">
                          <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                            {dept.selfEvalCompleted}/{dept.total}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-center">
                          <Badge variant="secondary" className="bg-green-50 text-green-700">
                            {dept.managerReviewCompleted}/{dept.total}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#1e3a5f] to-[#3b82f6] rounded-full transition-all duration-300"
                                style={{ width: `${managerPct}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-500 w-12 text-right">
                              {managerPct.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <div className="text-xs text-slate-400 text-right">
        Generated: {data.generatedAt.toLocaleString()}
      </div>
    </div>
  );
}

interface RatingDistributionContentProps {
  data: RatingDistributionReport | null;
  isLoading: boolean;
}

function RatingDistributionContent({ data, isLoading }: RatingDistributionContentProps) {
  if (isLoading) {
    return (
      <Card className="border-slate-200">
        <CardContent className="py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded w-1/2"></div>
            <div className="h-48 bg-slate-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-[#1e3a5f]">Rating Distribution</CardTitle>
          <CardDescription>
            Select a review cycle and click &quot;Generate Report&quot; to view rating distributions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
              />
            </svg>
            <p className="text-lg font-medium">No data to display</p>
            <p className="text-sm">Select a cycle and generate the report</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const kpiTotal = Object.values(data.kpiDistribution).reduce((a, b) => a + b, 0);
  const cvTotal = Object.values(data.coreValuesDistribution).reduce((a, b) => a + b, 0);
  const maxKpi = Math.max(...Object.values(data.kpiDistribution), 1);
  const maxCv = Math.max(...Object.values(data.coreValuesDistribution), 1);

  const RATING_LABELS: Record<number, string> = {
    1: "Below",
    2: "Needs Imp.",
    3: "Meets",
    4: "Above",
    5: "Exceeds",
  };

  return (
    <div className="space-y-6">
      {/* KPI Distribution */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-[#1e3a5f]">KPI Rating Distribution</CardTitle>
          <CardDescription>Manager ratings for KPI objectives ({kpiTotal} total ratings)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-4 h-40 px-4">
            {[1, 2, 3, 4, 5].map((rating) => {
              const count = data.kpiDistribution[rating as keyof typeof data.kpiDistribution];
              const percentage = kpiTotal > 0 ? (count / kpiTotal) * 100 : 0;
              const height = (count / maxKpi) * 100;

              return (
                <div key={rating} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col items-center justify-end h-32">
                    <span className="text-sm font-semibold text-slate-700 mb-1">{count}</span>
                    <div
                      className="w-full max-w-[60px] rounded-t-md transition-all duration-300"
                      style={{
                        height: `${height}%`,
                        minHeight: count > 0 ? "8px" : "0",
                        backgroundColor: RATING_COLORS[rating],
                      }}
                    />
                  </div>
                  <div className="mt-2 text-center">
                    <div className="text-lg font-bold text-slate-700">{rating}</div>
                    <div className="text-xs text-slate-500">{percentage.toFixed(1)}%</div>
                    <div className="text-xs text-slate-400">{RATING_LABELS[rating]}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Core Values Distribution */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-[#1e3a5f]">Core Values Rating Distribution</CardTitle>
          <CardDescription>
            Manager ratings for core values ({cvTotal} total ratings)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-4 h-40 px-4">
            {[1, 2, 3, 4, 5].map((rating) => {
              const count = data.coreValuesDistribution[rating as keyof typeof data.coreValuesDistribution];
              const percentage = cvTotal > 0 ? (count / cvTotal) * 100 : 0;
              const height = (count / maxCv) * 100;

              return (
                <div key={rating} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col items-center justify-end h-32">
                    <span className="text-sm font-semibold text-slate-700 mb-1">{count}</span>
                    <div
                      className="w-full max-w-[60px] rounded-t-md transition-all duration-300"
                      style={{
                        height: `${height}%`,
                        minHeight: count > 0 ? "8px" : "0",
                        backgroundColor: RATING_COLORS[rating],
                      }}
                    />
                  </div>
                  <div className="mt-2 text-center">
                    <div className="text-lg font-bold text-slate-700">{rating}</div>
                    <div className="text-xs text-slate-500">{percentage.toFixed(1)}%</div>
                    <div className="text-xs text-slate-400">{RATING_LABELS[rating]}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-xs text-slate-400 text-right">
        Generated: {data.generatedAt.toLocaleString()}
      </div>
    </div>
  );
}
