/**
 * HistoryList Component
 *
 * Displays a list of historical evaluations grouped by review cycle.
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  ChevronRight,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export interface HistoricalCycle {
  cycle: {
    id: string;
    name: string;
    type: string;
    startDate: Date | string;
    endDate: Date | string;
  };
  evaluations: Array<{
    id: string;
    evaluationType: "KPI" | "CORE_VALUE";
    objective?: { id: string; title: string; category: string };
    coreValue?: { id: string; name: string };
    selfRating: number | null;
    managerRating: number | null;
    status: string;
  }>;
  scores: {
    kpiScore: number | null;
    coreValuesScore: number | null;
    finalScore: number | null;
  };
}

export interface HistoryListProps {
  history: HistoricalCycle[];
  isLoading?: boolean;
  onViewDetail?: (cycleId: string) => void;
  trend?: "improving" | "declining" | "stable" | "insufficient_data";
  averageScore?: number | null;
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getTrendIcon(trend: string) {
  switch (trend) {
    case "improving":
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    case "declining":
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    case "stable":
      return <Minus className="h-4 w-4 text-yellow-500" />;
    default:
      return null;
  }
}

function getTrendLabel(trend: string): string {
  switch (trend) {
    case "improving":
      return "Improving";
    case "declining":
      return "Declining";
    case "stable":
      return "Stable";
    default:
      return "Insufficient Data";
  }
}

function getScoreColor(score: number | null): string {
  if (score === null) return "text-muted-foreground";
  if (score >= 4) return "text-green-600";
  if (score >= 3) return "text-yellow-600";
  if (score >= 2) return "text-orange-600";
  return "text-red-600";
}

// ============================================================================
// Component
// ============================================================================

export function HistoryList({
  history,
  isLoading = false,
  onViewDetail,
  trend = "insufficient_data",
  averageScore = null,
}: HistoryListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="flex min-h-[200px] flex-col items-center justify-center p-6">
          <Clock className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-medium">No Historical Records</p>
          <p className="text-sm text-muted-foreground">
            Completed evaluations will appear here after review cycles close.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Performance Trend
            </p>
            <div className="mt-1 flex items-center gap-2">
              {getTrendIcon(trend)}
              <span className="text-lg font-semibold">
                {getTrendLabel(trend)}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-muted-foreground">
              Average Score
            </p>
            <p className={`text-2xl font-bold ${getScoreColor(averageScore)}`}>
              {averageScore?.toFixed(2) ?? "N/A"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* History List */}
      <div className="space-y-4">
        {history.map((record) => (
          <Card key={record.cycle.id} className="overflow-hidden">
            <CardHeader className="bg-muted/50 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{record.cycle.name}</CardTitle>
                  <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {formatDate(record.cycle.startDate)} -{" "}
                      {formatDate(record.cycle.endDate)}
                    </span>
                  </div>
                </div>
                <Badge variant="outline">{record.cycle.type}</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-6 md:grid-cols-3">
                {/* KPI Score */}
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    KPI Score
                  </p>
                  <p
                    className={`text-2xl font-bold ${getScoreColor(
                      record.scores.kpiScore
                    )}`}
                  >
                    {record.scores.kpiScore?.toFixed(2) ?? "N/A"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {record.evaluations.filter(
                      (e) => e.evaluationType === "KPI"
                    ).length}{" "}
                    objectives
                  </p>
                </div>

                {/* Core Values Score */}
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Core Values Score
                  </p>
                  <p
                    className={`text-2xl font-bold ${getScoreColor(
                      record.scores.coreValuesScore
                    )}`}
                  >
                    {record.scores.coreValuesScore?.toFixed(2) ?? "N/A"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {record.evaluations.filter(
                      (e) => e.evaluationType === "CORE_VALUE"
                    ).length}{" "}
                    values
                  </p>
                </div>

                {/* Final Score */}
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Final Score
                  </p>
                  <p
                    className={`text-2xl font-bold ${getScoreColor(
                      record.scores.finalScore
                    )}`}
                  >
                    {record.scores.finalScore?.toFixed(2) ?? "N/A"}
                  </p>
                  {onViewDetail && (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0"
                      onClick={() => onViewDetail(record.cycle.id)}
                    >
                      View Details
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

HistoryList.displayName = "HistoryList";
