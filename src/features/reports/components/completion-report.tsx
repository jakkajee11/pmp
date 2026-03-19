"use client";

/**
 * Completion Report Component
 *
 * Displays evaluation completion rates with charts and statistics.
 * Professional Corporate style with navy blue primary colors.
 */

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../shared/components/ui/card";
import { Badge } from "../../../shared/components/ui/badge";
import { CompletionReport as CompletionReportType } from "../types";

interface CompletionReportProps {
  data: CompletionReportType;
  isLoading?: boolean;
}

export function CompletionReport({ data, isLoading }: CompletionReportProps) {
  const chartData = useMemo(() => {
    if (!data) return null;

    const { byStatus } = data;
    const total = Object.values(byStatus).reduce((a, b) => a + b, 0);

    return {
      statusBars: [
        { label: "Not Started", value: byStatus.notStarted, color: "#9CA3AF", percentage: (byStatus.notStarted / total) * 100 },
        { label: "Self In Progress", value: byStatus.selfInProgress, color: "#3B82F6", percentage: (byStatus.selfInProgress / total) * 100 },
        { label: "Self Submitted", value: byStatus.selfSubmitted, color: "#F59E0B", percentage: (byStatus.selfSubmitted / total) * 100 },
        { label: "Manager Review", value: byStatus.managerInProgress, color: "#F97316", percentage: (byStatus.managerInProgress / total) * 100 },
        { label: "Completed", value: byStatus.completed, color: "#10B981", percentage: (byStatus.completed / total) * 100 },
      ],
    };
  }, [data]);

  if (isLoading) {
    return (
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-[#1e3a5f]">Completion Report</CardTitle>
          <CardDescription>Loading report data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            <div className="h-32 bg-slate-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || !chartData) {
    return (
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-[#1e3a5f]">Completion Report</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

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
              <div className="text-4xl font-bold text-[#1e3a5f]">{data.overall.selfEvalPercentage}%</div>
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
              <div className="text-4xl font-bold text-[#1e3a5f]">{data.overall.managerReviewPercentage}%</div>
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
          <CardDescription>Distribution of evaluation statuses across all employees</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Horizontal Bar Chart */}
          <div className="mb-6">
            <div className="flex h-8 rounded-lg overflow-hidden">
              {chartData.statusBars.map((bar, index) => (
                <div
                  key={index}
                  style={{
                    width: `${bar.percentage}%`,
                    backgroundColor: bar.color,
                  }}
                  className="transition-all duration-300 hover:opacity-80"
                  title={`${bar.label}: ${bar.value} (${bar.percentage.toFixed(1)}%)`}
                />
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {chartData.statusBars.map((bar, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: bar.color }}
                />
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
            <CardDescription>Completion rates broken down by department</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#1e3a5f]">Department</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-[#1e3a5f]">Total</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-[#1e3a5f]">Self-Eval</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-[#1e3a5f]">Manager Review</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#1e3a5f]">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byDepartment.map((dept, index) => {
                    const selfEvalPct = dept.total > 0 ? (dept.selfEvalCompleted / dept.total) * 100 : 0;
                    const managerPct = dept.total > 0 ? (dept.managerReviewCompleted / dept.total) * 100 : 0;

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

export default CompletionReport;
