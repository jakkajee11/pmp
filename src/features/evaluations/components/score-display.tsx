/**
 * ScoreDisplay Component
 *
 * Displays calculated scores with visual representation.
 */

"use client";

import * as React from "react";
import { cn } from "@/shared/utils/cn";
import { CalculatedScores, RATING_LABELS } from "../types";

export interface ScoreDisplayProps {
  scores: CalculatedScores;
  weightsConfig?: { kpi: number; coreValues: number };
  showBreakdown?: boolean;
  className?: string;
}

export function ScoreDisplay({
  scores,
  weightsConfig = { kpi: 0.8, coreValues: 0.2 },
  showBreakdown = true,
  className,
}: ScoreDisplayProps) {
  const { kpiScore, coreValuesScore, finalScore } = scores;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Final Score */}
      <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-slate-50 rounded-lg border border-blue-100">
        <p className="text-sm text-slate-500 mb-1">Final Score</p>
        <div className="flex items-center justify-center gap-2">
          <span className="text-4xl font-bold text-blue-600">
            {finalScore !== null ? finalScore.toFixed(2) : "—"}
          </span>
          <span className="text-lg text-slate-400">/ 5.00</span>
        </div>
        {finalScore !== null && (
          <p className="mt-2 text-sm font-medium text-slate-600">
            {getScoreBandLabel(finalScore)}
          </p>
        )}
      </div>

      {/* Score Breakdown */}
      {showBreakdown && (
        <div className="grid grid-cols-2 gap-4">
          {/* KPI Score */}
          <div className="p-4 bg-white border border-slate-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">KPI Score</span>
              <span className="text-xs text-slate-500">
                {Math.round(weightsConfig.kpi * 100)}% weight
              </span>
            </div>
            <div className="flex items-end gap-1">
              <span className="text-2xl font-bold text-slate-900">
                {kpiScore !== null ? kpiScore.toFixed(2) : "—"}
              </span>
            </div>
            {kpiScore !== null && (
              <ScoreBar score={kpiScore} color="blue" />
            )}
          </div>

          {/* Core Values Score */}
          <div className="p-4 bg-white border border-slate-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Core Values</span>
              <span className="text-xs text-slate-500">
                {Math.round(weightsConfig.coreValues * 100)}% weight
              </span>
            </div>
            <div className="flex items-end gap-1">
              <span className="text-2xl font-bold text-slate-900">
                {coreValuesScore !== null ? coreValuesScore.toFixed(2) : "—"}
              </span>
            </div>
            {coreValuesScore !== null && (
              <ScoreBar score={coreValuesScore} color="purple" />
            )}
          </div>
        </div>
      )}

      {/* Score Legend */}
      <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-red-400" /> Below (1-2)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-yellow-400" /> Meets (3)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-green-400" /> Above (4-5)
        </span>
      </div>
    </div>
  );
}

export interface ScoreBarProps {
  score: number;
  color?: "blue" | "green" | "purple" | "gray";
  className?: string;
}

export function ScoreBar({ score, color = "blue", className }: ScoreBarProps) {
  const percentage = (score / 5) * 100;

  const colorClasses = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    purple: "bg-purple-500",
    gray: "bg-slate-400",
  };

  const getBarColor = () => {
    if (score >= 4) return "bg-green-500";
    if (score >= 3) return "bg-yellow-500";
    return "bg-red-400";
  };

  return (
    <div className={cn("w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-2", className)}>
      <div
        className={cn("h-full rounded-full transition-all duration-300", getBarColor())}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

export interface ScoreComparisonProps {
  selfRating: number | null;
  managerRating: number | null;
  label?: string;
  className?: string;
}

export function ScoreComparison({
  selfRating,
  managerRating,
  label,
  className,
}: ScoreComparisonProps) {
  const diff = selfRating !== null && managerRating !== null
    ? managerRating - selfRating
    : null;

  return (
    <div className={cn("flex items-center gap-4", className)}>
      {label && <span className="text-sm text-slate-600 flex-shrink-0">{label}</span>}
      <div className="flex items-center gap-2">
        <div className="text-center">
          <p className="text-xs text-slate-500">Self</p>
          <span className={cn(
            "text-lg font-semibold",
            selfRating === null ? "text-slate-300" : "text-slate-700"
          )}>
            {selfRating ?? "—"}
          </span>
        </div>
        <span className="text-slate-300">/</span>
        <div className="text-center">
          <p className="text-xs text-slate-500">Manager</p>
          <span className={cn(
            "text-lg font-semibold",
            managerRating === null ? "text-slate-300" : "text-slate-700"
          )}>
            {managerRating ?? "—"}
          </span>
        </div>
        {diff !== null && (
          <span className={cn(
            "text-xs px-2 py-0.5 rounded-full",
            diff > 0 && "bg-green-100 text-green-700",
            diff < 0 && "bg-red-100 text-red-700",
            diff === 0 && "bg-slate-100 text-slate-600"
          )}>
            {diff > 0 && `+${diff}`}
            {diff < 0 && diff}
            {diff === 0 && "="}
          </span>
        )}
      </div>
    </div>
  );
}

function getScoreBandLabel(score: number): string {
  if (score >= 4.5) return "Exceptional Performance";
  if (score >= 3.5) return "Above Expectations";
  if (score >= 2.5) return "Meets Expectations";
  if (score >= 1.5) return "Needs Improvement";
  return "Below Expectations";
}

export interface MiniScoreDisplayProps {
  score: number | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function MiniScoreDisplay({ score, size = "md", className }: MiniScoreDisplayProps) {
  const sizeClasses = {
    sm: "text-sm px-2 py-0.5",
    md: "text-base px-3 py-1",
    lg: "text-xl px-4 py-2",
  };

  const getBgColor = () => {
    if (score === null) return "bg-slate-100 text-slate-400";
    if (score >= 4) return "bg-green-100 text-green-700";
    if (score >= 3) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  return (
    <span className={cn(
      "inline-flex items-center font-semibold rounded-full",
      sizeClasses[size],
      getBgColor(),
      className
    )}>
      {score !== null ? score.toFixed(1) : "—"}
    </span>
  );
}
