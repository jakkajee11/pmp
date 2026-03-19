/**
 * StatusSummary Component
 *
 * Displays summary statistics with visual cards.
 */

"use client";

import * as React from "react";
import { cn } from "../../../shared/utils/cn";

export interface StatCard {
  label: string;
  value: number | string;
  color?: "slate" | "blue" | "green" | "yellow" | "red" | "purple";
  highlight?: boolean;
  icon?: React.ReactNode;
}

export interface StatusSummaryProps {
  stats: StatCard[];
  className?: string;
}

export function StatusSummary({ stats, className }: StatusSummaryProps) {
  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", className)}>
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}

function StatCard({ label, value, color = "slate", highlight, icon }: StatCard) {
  const colorClasses = {
    slate: "bg-slate-50 border-slate-200 text-slate-900",
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    green: "bg-green-50 border-green-200 text-green-700",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
    red: "bg-red-50 border-red-200 text-red-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700",
  };

  const valueColorClasses = {
    slate: "text-slate-900",
    blue: "text-blue-600",
    green: "text-green-600",
    yellow: "text-yellow-600",
    red: "text-red-600",
    purple: "text-purple-600",
  };

  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-all",
        colorClasses[color],
        highlight && "ring-2 ring-blue-400 ring-offset-2"
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {icon && <span className="text-slate-400">{icon}</span>}
      </div>
      <p className={cn("mt-2 text-2xl font-bold", valueColorClasses[color])}>
        {value}
      </p>
    </div>
  );
}

export interface ProgressSummaryProps {
  title: string;
  completed: number;
  total: number;
  className?: string;
}

export function ProgressSummary({ title, completed, total, className }: ProgressSummaryProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">{title}</span>
        <span className="text-sm text-slate-500">
          {completed} / {total} ({percentage}%)
        </span>
      </div>
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            percentage >= 100 ? "bg-green-500" : percentage >= 50 ? "bg-blue-500" : "bg-yellow-500"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export interface CompletionChartProps {
  data: {
    label: string;
    value: number;
    color?: string;
  }[];
  className?: string;
}

export function CompletionChart({ data, className }: CompletionChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className={cn("space-y-3", className)}>
      {data.map((item, index) => {
        const percentage = total > 0 ? (item.value / total) * 100 : 0;
        return (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">{item.label}</span>
              <span className="font-medium text-slate-900">
                {item.value} ({Math.round(percentage)}%)
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: item.color || "#3b82f6",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
