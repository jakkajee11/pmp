"use client";

/**
 * Rating Distribution Chart Component
 *
 * Displays rating distribution with visual bar charts.
 * Professional Corporate style with navy blue primary colors.
 */

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { RatingDistributionReport, RatingDistribution } from "../types";

interface RatingDistributionChartProps {
  data: RatingDistributionReport;
  isLoading?: boolean;
}

const RATING_COLORS = {
  1: "#EF4444", // Red
  2: "#F97316", // Orange
  3: "#F59E0B", // Yellow
  4: "#10B981", // Green
  5: "#3B82F6", // Blue
};

const RATING_LABELS: Record<number, string> = {
  1: "Below Expectations",
  2: "Needs Improvement",
  3: "Meets Expectations",
  4: "Above Expectations",
  5: "Exceeds Expectations",
};

export function RatingDistributionChart({ data, isLoading }: RatingDistributionChartProps) {
  const chartData = useMemo(() => {
    if (!data) return null;

    const kpiTotal = Object.values(data.kpiDistribution).reduce((a, b) => a + b, 0);
    const cvTotal = Object.values(data.coreValuesDistribution).reduce((a, b) => a + b, 0);
    const scoreTotal = data.finalScoreDistribution.ranges.reduce((sum, r) => sum + r.count, 0);

    return {
      kpiTotal,
      cvTotal,
      scoreTotal,
    };
  }, [data]);

  if (isLoading) {
    return (
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-[#1e3a5f]">Rating Distribution</CardTitle>
          <CardDescription>Loading distribution data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-slate-200 rounded"></div>
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
          <CardTitle className="text-[#1e3a5f]">Rating Distribution</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Rating Distribution */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-[#1e3a5f]">KPI Rating Distribution</CardTitle>
          <CardDescription>
            Manager ratings for KPI objectives ({chartData.kpiTotal} total ratings)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RatingBarChart distribution={data.kpiDistribution} total={chartData.kpiTotal} />
        </CardContent>
      </Card>

      {/* Core Values Rating Distribution */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-[#1e3a5f]">Core Values Rating Distribution</CardTitle>
          <CardDescription>
            Manager ratings for core values ({chartData.cvTotal} total ratings)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RatingBarChart distribution={data.coreValuesDistribution} total={chartData.cvTotal} />
        </CardContent>
      </Card>

      {/* Final Score Distribution */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-[#1e3a5f]">Final Score Distribution</CardTitle>
          <CardDescription>
            Weighted final scores ({chartData.scoreTotal} employees with completed evaluations)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScoreDistributionChart ranges={data.finalScoreDistribution.ranges} total={chartData.scoreTotal} />
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-xs text-slate-400 text-right">
        Generated: {data.generatedAt.toLocaleString()}
      </div>
    </div>
  );
}

// ============================================================================
// Sub-Components
// ============================================================================

interface RatingBarChartProps {
  distribution: RatingDistribution;
  total: number;
}

function RatingBarChart({ distribution, total }: RatingBarChartProps) {
  const maxValue = Math.max(...Object.values(distribution), 1);

  return (
    <div className="space-y-4">
      {/* Bar Chart */}
      <div className="flex items-end justify-between gap-4 h-40 px-4">
        {[1, 2, 3, 4, 5].map((rating) => {
          const count = distribution[rating as keyof RatingDistribution];
          const percentage = total > 0 ? (count / total) * 100 : 0;
          const height = (count / maxValue) * 100;

          return (
            <div key={rating} className="flex-1 flex flex-col items-center">
              <div className="w-full flex flex-col items-center justify-end h-32">
                <span className="text-sm font-semibold text-slate-700 mb-1">{count}</span>
                <div
                  className="w-full max-w-[60px] rounded-t-md transition-all duration-300 hover:opacity-80"
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
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-5 gap-2 mt-4">
        {[1, 2, 3, 4, 5].map((rating) => (
          <div key={rating} className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <div
                className="w-2 h-2 rounded-sm"
                style={{ backgroundColor: RATING_COLORS[rating] }}
              />
              <span className="text-xs text-slate-600 truncate">
                {RATING_LABELS[rating].split(" ")[0]}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ScoreDistributionChartProps {
  ranges: Array<{ min: number; max: number; count: number; label: string }>;
  total: number;
}

function ScoreDistributionChart({ ranges, total }: ScoreDistributionChartProps) {
  const maxValue = Math.max(...ranges.map((r) => r.count), 1);

  const getRangeColor = (min: number): string => {
    if (min >= 4.5) return "#10B981"; // Green - Excellent
    if (min >= 3.5) return "#3B82F6"; // Blue - Good
    if (min >= 2.5) return "#F59E0B"; // Yellow - Average
    if (min >= 1.5) return "#F97316"; // Orange - Below Average
    return "#EF4444"; // Red - Poor
  };

  return (
    <div className="space-y-4">
      {/* Bar Chart */}
      <div className="flex items-end justify-between gap-3 h-40 px-4">
        {ranges.map((range, index) => {
          const percentage = total > 0 ? (range.count / total) * 100 : 0;
          const height = (range.count / maxValue) * 100;

          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="w-full flex flex-col items-center justify-end h-32">
                <span className="text-sm font-semibold text-slate-700 mb-1">{range.count}</span>
                <div
                  className="w-full max-w-[50px] rounded-t-md transition-all duration-300 hover:opacity-80"
                  style={{
                    height: `${height}%`,
                    minHeight: range.count > 0 ? "8px" : "0",
                    backgroundColor: getRangeColor(range.min),
                  }}
                />
              </div>
              <div className="mt-2 text-center">
                <div className="text-sm font-medium text-slate-700">{range.label}</div>
                <div className="text-xs text-slate-500">{percentage.toFixed(1)}%</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {ranges.map((range, index) => (
          <div key={index} className="flex items-center gap-1">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: getRangeColor(range.min) }}
            />
            <span className="text-xs text-slate-600">{range.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RatingDistributionChart;
