/**
 * CompletionChart Component
 *
 * Reusable chart component for displaying completion data with various visualization options.
 * Professional Corporate style: Navy blue (#1e3a5f), slate gray accents.
 */

"use client";

import * as React from "react";
import { cn } from "@/shared/lib/utils";

export interface ChartDataItem {
  label: string;
  value: number;
  color?: string;
  percentage?: number;
}

export interface CompletionChartProps {
  data: ChartDataItem[];
  title?: string;
  showLegend?: boolean;
  showPercentage?: boolean;
  layout?: "horizontal" | "vertical" | "stacked";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const DEFAULT_COLORS = [
  "#1e3a5f", // Navy (primary)
  "#3b82f6", // Blue
  "#22c55e", // Green
  "#f59e0b", // Yellow
  "#ef4444", // Red
  "#8b5cf6", // Purple
  "#06b6d4", // Cyan
  "#ec4899", // Pink
];

export function CompletionChart({
  data,
  title,
  showLegend = true,
  showPercentage = true,
  layout = "horizontal",
  size = "md",
  className,
}: CompletionChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const dataWithColors = data.map((item, index) => ({
    ...item,
    color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
    percentage: total > 0 ? (item.value / total) * 100 : 0,
  }));

  if (layout === "stacked") {
    return (
      <StackedChart
        data={dataWithColors}
        title={title}
        showLegend={showLegend}
        className={className}
      />
    );
  }

  if (layout === "vertical") {
    return (
      <VerticalChart
        data={dataWithColors}
        title={title}
        showLegend={showLegend}
        showPercentage={showPercentage}
        size={size}
        className={className}
      />
    );
  }

  return (
    <HorizontalChart
      data={dataWithColors}
      title={title}
      showLegend={showLegend}
      showPercentage={showPercentage}
      size={size}
      className={className}
    />
  );
}

interface ChartProps {
  data: Array<ChartDataItem & { color: string; percentage: number }>;
  title?: string;
  showLegend?: boolean;
  showPercentage?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function HorizontalChart({
  data,
  title,
  showLegend,
  showPercentage,
  size,
  className,
}: ChartProps) {
  const sizeClasses = {
    sm: { bar: "h-1.5", text: "text-xs", gap: "gap-2" },
    md: { bar: "h-2", text: "text-sm", gap: "gap-3" },
    lg: { bar: "h-3", text: "text-base", gap: "gap-4" },
  };

  const { bar, text, gap } = sizeClasses[size || "md"];

  return (
    <div className={cn("space-y-4", className)}>
      {title && (
        <h4 className="font-medium text-slate-900">{title}</h4>
      )}
      <div className={cn("space-y-3", gap)}>
        {data.map((item, index) => (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className={cn("text-slate-600", text)}>{item.label}</span>
              <span className={cn("font-medium text-slate-900", text)}>
                {item.value}
                {showPercentage && ` (${Math.round(item.percentage)}%)`}
              </span>
            </div>
            <div className={cn("w-full bg-slate-100 rounded-full overflow-hidden", bar)}>
              <div
                className={cn("h-full rounded-full transition-all duration-200", bar)}
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      {showLegend && <ChartLegend data={data} />}
    </div>
  );
}

function VerticalChart({
  data,
  title,
  showLegend,
  showPercentage,
  size,
  className,
}: ChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value));
  const sizeConfig = {
    sm: { bar: "w-6", text: "text-xs", gap: "gap-2" },
    md: { bar: "w-10", text: "text-sm", gap: "gap-3" },
    lg: { bar: "w-14", text: "text-base", gap: "gap-4" },
  };

  const { bar, text, gap } = sizeConfig[size || "md"];

  return (
    <div className={cn("space-y-4", className)}>
      {title && (
        <h4 className="font-medium text-slate-900">{title}</h4>
      )}
      <div className={cn("flex items-end justify-center", gap)} style={{ height: "160px" }}>
        {data.map((item, index) => {
          const heightPercent = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
          return (
            <div key={index} className="flex flex-col items-center gap-2">
              <div className="flex flex-col items-center">
                {showPercentage && (
                  <span className={cn("font-medium text-slate-700 mb-1", text)}>
                    {Math.round(item.percentage)}%
                  </span>
                )}
                <span className={cn("font-bold text-slate-900", text)}>
                  {item.value}
                </span>
              </div>
              <div className="relative h-32 bg-slate-100 rounded-t-lg overflow-hidden">
                <div
                  className={cn("absolute bottom-0 rounded-t-lg transition-all duration-200", bar)}
                  style={{
                    height: `${heightPercent}%`,
                    backgroundColor: item.color,
                    width: "100%",
                  }}
                />
              </div>
              <span className={cn("text-slate-600 mt-2 text-center", text)}>
                {item.label.length > 10 ? `${item.label.slice(0, 10)}...` : item.label}
              </span>
            </div>
          );
        })}
      </div>
      {showLegend && <ChartLegend data={data} />}
    </div>
  );
}

function StackedChart({
  data,
  title,
  showLegend,
  className,
}: Omit<ChartProps, "showPercentage" | "size">) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const filteredData = data.filter((item) => item.value > 0);

  return (
    <div className={cn("space-y-4", className)}>
      {title && (
        <h4 className="font-medium text-slate-900">{title}</h4>
      )}
      <div className="flex h-6 w-full rounded-full overflow-hidden border border-slate-200">
        {filteredData.map((item, index) => (
          <div
            key={index}
            className="h-full transition-all duration-200"
            style={{
              width: `${item.percentage}%`,
              backgroundColor: item.color,
            }}
            title={`${item.label}: ${item.value} (${Math.round(item.percentage)}%)`}
          />
        ))}
      </div>
      <div className="text-center">
        <span className="text-2xl font-bold text-[#1e3a5f]">{total}</span>
        <span className="text-sm text-slate-500 ml-2">Total</span>
      </div>
      {showLegend && <ChartLegend data={data} />}
    </div>
  );
}

function ChartLegend({
  data,
}: {
  data: Array<ChartDataItem & { color: string; percentage: number }>;
}) {
  return (
    <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-100">
      {data.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-sm text-slate-600">
            {item.label}: {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// Donut Chart Variant
export interface DonutChartProps {
  data: ChartDataItem[];
  title?: string;
  size?: number;
  strokeWidth?: number;
  showCenterValue?: boolean;
  centerLabel?: string;
  className?: string;
}

export function DonutChart({
  data,
  title,
  size = 120,
  strokeWidth = 20,
  showCenterValue = true,
  centerLabel,
  className,
}: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const dataWithColors = data.map((item, index) => ({
    ...item,
    color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
  }));

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let cumulativeOffset = 0;

  return (
    <div className={cn("space-y-4", className)}>
      {title && (
        <h4 className="font-medium text-slate-900 text-center">{title}</h4>
      )}
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />
          {/* Data segments */}
          {dataWithColors.map((item, index) => {
            const percentage = total > 0 ? item.value / total : 0;
            const segmentLength = circumference * percentage;
            const segment = (
              <circle
                key={index}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${segmentLength} ${circumference}`}
                strokeDashoffset={-cumulativeOffset}
                className="transition-all duration-500"
              />
            );
            cumulativeOffset += segmentLength;
            return segment;
          })}
        </svg>
        {showCenterValue && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-[#1e3a5f]">{total}</span>
            {centerLabel && (
              <span className="text-xs text-slate-500">{centerLabel}</span>
            )}
          </div>
        )}
      </div>
      <ChartLegend data={dataWithColors as Array<ChartDataItem & { color: string; percentage: number }>} />
    </div>
  );
}

export function CompletionChartSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-4 bg-slate-200 rounded w-24" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i}>
            <div className="flex justify-between mb-1">
              <div className="h-3 bg-slate-200 rounded w-20" />
              <div className="h-3 bg-slate-200 rounded w-12" />
            </div>
            <div className="h-2 bg-slate-200 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
