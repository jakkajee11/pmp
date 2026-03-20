/**
 * HistoryDetail Component
 *
 * Displays detailed historical evaluation for a specific cycle.
 */

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Separator } from "@/shared/components/ui/separator";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Button } from "@/shared/components/ui/button";
import {
  ArrowLeft,
  Calendar,
  Download,
  User,
  Building,
  Trophy,
  Target,
  Heart,
  FileText,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export interface HistoricalEvaluationDetail {
  cycle: {
    id: string;
    name: string;
    type: string;
    startDate: Date | string;
    endDate: Date | string;
    status: string;
  };
  employee: {
    id: string;
    name: string;
    email: string;
    department: string | null;
  };
  manager?: {
    id: string;
    name: string;
  } | null;
  evaluations: Array<{
    id: string;
    evaluationType: "KPI" | "CORE_VALUE";
    objective?: {
      id: string;
      title: string;
      description: string;
      category: string;
      ratingCriteria: Record<number, string>;
    };
    coreValue?: {
      id: string;
      name: string;
      description: string;
      ratingCriteria: Record<number, string>;
    };
    selfRating: number | null;
    selfComments: string | null;
    managerRating: number | null;
    managerFeedback: string | null;
    selfSubmittedAt: Date | string | null;
    managerReviewedAt: Date | string | null;
  }>;
  scores: {
    kpiScore: number | null;
    coreValuesScore: number | null;
    finalScore: number | null;
    weights: { kpi: number; coreValues: number };
  };
  summary?: {
    overallComments: string | null;
    bonusRecommendation: string | null;
    salaryAdjustment: string | null;
    finalizedAt: Date | string | null;
  } | null;
}

export interface HistoryDetailProps {
  data: HistoricalEvaluationDetail | null;
  isLoading?: boolean;
  onBack?: () => void;
  onExportPdf?: () => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getRatingLabel(rating: number | null): string {
  if (rating === null) return "Not Rated";
  if (rating === 5) return "Exceeds Expectations";
  if (rating === 4) return "Above Expectations";
  if (rating === 3) return "Meets Expectations";
  if (rating === 2) return "Needs Improvement";
  return "Below Expectations";
}

function getRatingColor(rating: number | null): string {
  if (rating === null) return "bg-muted text-muted-foreground";
  if (rating >= 4) return "bg-green-100 text-green-700 border-green-200";
  if (rating >= 3) return "bg-yellow-100 text-yellow-700 border-yellow-200";
  if (rating >= 2) return "bg-orange-100 text-orange-700 border-orange-200";
  return "bg-red-100 text-red-700 border-red-200";
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

export function HistoryDetail({
  data,
  isLoading = false,
  onBack,
  onExportPdf,
}: HistoryDetailProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="flex min-h-[300px] flex-col items-center justify-center p-6">
          <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-medium">No Data Available</p>
          <p className="text-sm text-muted-foreground">
            Unable to load evaluation details.
          </p>
        </CardContent>
      </Card>
    );
  }

  const kpiEvaluations = data.evaluations.filter(
    (e) => e.evaluationType === "KPI"
  );
  const coreValueEvaluations = data.evaluations.filter(
    (e) => e.evaluationType === "CORE_VALUE"
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h2 className="text-xl font-semibold">{data.cycle.name}</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {formatDate(data.cycle.startDate)} -{" "}
                {formatDate(data.cycle.endDate)}
              </span>
            </div>
          </div>
        </div>
        {onExportPdf && (
          <Button variant="outline" onClick={onExportPdf}>
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        )}
      </div>

      {/* Employee Info */}
      <Card>
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Employee
                </p>
                <p className="font-semibold">{data.employee.name}</p>
                <p className="text-sm text-muted-foreground">
                  {data.employee.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Building className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Department
                </p>
                <p className="font-semibold">
                  {data.employee.department ?? "N/A"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Manager
                </p>
                <p className="font-semibold">{data.manager?.name ?? "N/A"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Performance Scores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">
                KPI Score ({Math.round(data.scores.weights.kpi * 100)}%)
              </p>
              <p
                className={`text-3xl font-bold ${getScoreColor(
                  data.scores.kpiScore
                )}`}
              >
                {data.scores.kpiScore?.toFixed(2) ?? "N/A"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">
                Core Values ({Math.round(data.scores.weights.coreValues * 100)}%)
              </p>
              <p
                className={`text-3xl font-bold ${getScoreColor(
                  data.scores.coreValuesScore
                )}`}
              >
                {data.scores.coreValuesScore?.toFixed(2) ?? "N/A"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">
                Final Score
              </p>
              <p
                className={`text-3xl font-bold ${getScoreColor(
                  data.scores.finalScore
                )}`}
              >
                {data.scores.finalScore?.toFixed(2) ?? "N/A"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Evaluations */}
      {kpiEvaluations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Objectives ({kpiEvaluations.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {kpiEvaluations.map((evaluation, index) => (
              <div key={evaluation.id}>
                {index > 0 && <Separator className="my-4" />}
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">
                        {evaluation.objective?.title}
                      </h4>
                      <Badge variant="outline" className="mt-1">
                        {evaluation.objective?.category}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Self</p>
                        <Badge
                          variant="outline"
                          className={getRatingColor(evaluation.selfRating)}
                        >
                          {evaluation.selfRating ?? "-"}
                        </Badge>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">
                          Manager
                        </p>
                        <Badge
                          variant="outline"
                          className={getRatingColor(
                            evaluation.managerRating
                          )}
                        >
                          {evaluation.managerRating ?? "-"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {evaluation.selfComments && (
                    <div className="rounded-md bg-muted/50 p-3">
                      <p className="text-xs font-medium text-muted-foreground">
                        Self Comments
                      </p>
                      <p className="text-sm">{evaluation.selfComments}</p>
                    </div>
                  )}
                  {evaluation.managerFeedback && (
                    <div className="rounded-md bg-muted/50 p-3">
                      <p className="text-xs font-medium text-muted-foreground">
                        Manager Feedback
                      </p>
                      <p className="text-sm">{evaluation.managerFeedback}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Core Values Evaluations */}
      {coreValueEvaluations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Core Values ({coreValueEvaluations.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {coreValueEvaluations.map((evaluation, index) => (
              <div key={evaluation.id}>
                {index > 0 && <Separator className="my-4" />}
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">
                      {evaluation.coreValue?.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {evaluation.coreValue?.description}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Self</p>
                      <Badge
                        variant="outline"
                        className={getRatingColor(evaluation.selfRating)}
                      >
                        {evaluation.selfRating ?? "-"}
                      </Badge>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Manager</p>
                      <Badge
                        variant="outline"
                        className={getRatingColor(evaluation.managerRating)}
                      >
                        {evaluation.managerRating ?? "-"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {data.summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Final Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.summary.overallComments && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Overall Comments
                </p>
                <p className="mt-1">{data.summary.overallComments}</p>
              </div>
            )}
            {data.summary.bonusRecommendation && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Bonus Recommendation
                </p>
                <p className="mt-1">{data.summary.bonusRecommendation}</p>
              </div>
            )}
            {data.summary.salaryAdjustment && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Salary Adjustment
                </p>
                <p className="mt-1">{data.summary.salaryAdjustment}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

HistoryDetail.displayName = "HistoryDetail";
