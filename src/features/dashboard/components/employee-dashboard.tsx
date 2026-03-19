/**
 * EmployeeDashboard Component
 *
 * Dashboard for employees to view their evaluation status, objectives, and history.
 * Style: Professional Corporate - Navy blue (#1e3a5f), slate gray accents
 * Design System: Trust & Authority pattern
 *
 * UI/UX Guidelines Applied:
 * - No emojis as icons (using Lucide icons)
 * - cursor-pointer on all clickable elements
 * - Smooth transitions (200ms)
 * - 4.5:1 contrast ratio minimum
 * - prefers-reduced-motion respected
 */

"use client";

import * as React from "react";
import Link from "next/link";
import {
  ChevronRight,
  Clock,
  FileText,
  Target,
  TrendingUp,
  Calendar,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Progress } from "@/shared/components/ui/progress";
import { EvaluationStatusBadge } from "@/features/evaluations/components/evaluation-status";
import type { EvaluationStatus } from "@/features/evaluations/types";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ObjectiveSummary {
  id: string;
  title: string;
  category: string;
  weight: number;
  selfRating?: number | null;
  managerRating?: number | null;
  status: "pending" | "self_completed" | "manager_completed";
}

export interface EmployeeDashboardProps {
  cycle: {
    id: string;
    name: string;
    status: string;
    selfEvalDeadline?: string;
    managerReviewDeadline?: string;
  };
  evaluation: {
    id: string;
    status: EvaluationStatus;
    selfSubmittedAt?: string;
    managerSubmittedAt?: string;
    finalScore?: number | null;
  } | null;
  objectives: ObjectiveSummary[];
  historicalEvaluations: Array<{
    id: string;
    cycleName: string;
    year: number;
    finalScore: number | null;
    status: string;
  }>;
  onStartSelfEval?: () => void;
  onViewHistory?: (evaluationId: string) => void;
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function EmployeeDashboard({
  cycle,
  evaluation,
  objectives,
  historicalEvaluations,
  onStartSelfEval,
  onViewHistory,
  className,
}: EmployeeDashboardProps) {
  const totalObjectives = objectives.length;
  const completedObjectives = objectives.filter(
    (o) => o.status === "self_completed" || o.status === "manager_completed"
  ).length;

  const canStartSelfEval =
    evaluation?.status === "NOT_STARTED" ||
    evaluation?.status === "SELF_IN_PROGRESS";

  const isSelfSubmitted =
    evaluation?.status === "SELF_SUBMITTED" ||
    evaluation?.status === "MANAGER_IN_PROGRESS" ||
    evaluation?.status === "COMPLETED";

  // Calculate average self-rating
  const ratedObjectives = objectives.filter((o) => o.selfRating !== null && o.selfRating !== undefined);
  const avgSelfRating = ratedObjectives.length > 0
    ? ratedObjectives.reduce((sum, o) => sum + (o.selfRating || 0), 0) / ratedObjectives.length
    : null;

  // Calculate completion percentage
  const completionPercentage = totalObjectives > 0
    ? Math.round((completedObjectives / totalObjectives) * 100)
    : 0;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header Section */}
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{cycle.name}</h1>
          <p className="text-sm text-slate-500 mt-1">Your Performance Review</p>
        </div>
        <div className="flex items-center gap-3">
          {evaluation && <EvaluationStatusBadge status={evaluation.status} />}
          {cycle.selfEvalDeadline && (
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              <Calendar className="h-4 w-4" aria-hidden="true" />
              <span>Deadline: {formatDate(cycle.selfEvalDeadline)}</span>
            </div>
          )}
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Objectives"
          value={totalObjectives}
          icon={<Target className="h-5 w-5" aria-hidden="true" />}
          color="slate"
        />
        <StatCard
          label="Completed"
          value={completedObjectives}
          icon={<CheckCircle2 className="h-5 w-5" aria-hidden="true" />}
          color="green"
        />
        <StatCard
          label="Avg Self-Rating"
          value={avgSelfRating !== null ? avgSelfRating.toFixed(1) : "—"}
          icon={<TrendingUp className="h-5 w-5" aria-hidden="true" />}
          color={avgSelfRating !== null ? "blue" : "slate"}
        />
        <StatCard
          label="Final Score"
          value={
            evaluation?.finalScore !== null && evaluation?.finalScore !== undefined
              ? evaluation.finalScore.toFixed(1)
              : "—"
          }
          icon={<FileText className="h-5 w-5" aria-hidden="true" />}
          color={evaluation?.finalScore !== null ? "navy" : "slate"}
          highlight={evaluation?.finalScore !== null}
        />
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Objectives Section */}
        <div className="space-y-4 lg:col-span-2">
          {/* Objectives Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-lg">Your Objectives</CardTitle>
                <CardDescription>Complete your self-evaluation for each objective</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">{completionPercentage}%</span>
                <Progress value={completionPercentage} className="w-24 h-2" aria-label="Completion progress" />
              </div>
            </CardHeader>
            <CardContent>
              {objectives.length === 0 ? (
                <EmptyState
                  title="No objectives assigned"
                  description="Your manager will assign objectives for this cycle."
                />
              ) : (
                <ul className="space-y-3" role="list">
                  {objectives.map((objective) => (
                    <ObjectiveItem key={objective.id} objective={objective} />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Action Section */}
          {canStartSelfEval && (
            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={onStartSelfEval}
                className="bg-[#1e3a5f] hover:bg-[#1e3a5f]/90 text-white min-w-[200px] cursor-pointer transition-colors duration-200"
              >
                {evaluation?.status === "SELF_IN_PROGRESS" ? (
                  <>
                    <PlayCircle className="mr-2 h-5 w-5" aria-hidden="true" />
                    Continue Self-Evaluation
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-5 w-5" aria-hidden="true" />
                    Start Self-Evaluation
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Waiting for Manager Banner */}
          {isSelfSubmitted && !evaluation?.managerSubmittedAt && (
            <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <Clock className="h-5 w-5 text-blue-600 flex-shrink-0" aria-hidden="true" />
              <div>
                <p className="font-medium text-blue-900">Self-Evaluation Submitted</p>
                <p className="text-sm text-blue-700">
                  Waiting for your manager to complete the review.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* History Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Evaluation History</CardTitle>
            </CardHeader>
            <CardContent>
              {historicalEvaluations.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No previous evaluations</p>
              ) : (
                <ul className="space-y-2" role="list">
                  {historicalEvaluations.slice(0, 5).map((hist) => (
                    <li key={hist.id}>
                      <button
                        onClick={() => onViewHistory?.(hist.id)}
                        className="w-full text-left rounded-lg border border-slate-200 p-3 transition-colors duration-200 hover:bg-slate-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:ring-offset-2"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-slate-900">{hist.cycleName}</p>
                            <p className="text-xs text-slate-500">{hist.year}</p>
                          </div>
                          <div className="text-right">
                            <p
                              className={cn(
                                "font-semibold",
                                hist.finalScore !== null ? "text-[#1e3a5f]" : "text-slate-400"
                              )}
                            >
                              {hist.finalScore !== null ? hist.finalScore.toFixed(1) : "—"}
                            </p>
                            <p className="text-xs text-slate-500">Final Score</p>
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Timeline Card */}
          {evaluation && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Review Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <EvaluationTimeline
                  status={evaluation.status}
                  selfSubmittedAt={evaluation.selfSubmittedAt}
                  managerSubmittedAt={evaluation.managerSubmittedAt}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: "slate" | "green" | "blue" | "navy";
  highlight?: boolean;
}

function StatCard({ label, value, icon, color, highlight }: StatCardProps) {
  const colorStyles = {
    slate: "bg-slate-50 border-slate-200",
    green: "bg-green-50 border-green-200",
    blue: "bg-blue-50 border-blue-200",
    navy: "bg-[#1e3a5f]/5 border-[#1e3a5f]/20",
  };

  const iconColorStyles = {
    slate: "text-slate-500",
    green: "text-green-600",
    blue: "text-blue-600",
    navy: "text-[#1e3a5f]",
  };

  const valueColorStyles = {
    slate: "text-slate-900",
    green: "text-green-700",
    blue: "text-blue-700",
    navy: "text-[#1e3a5f]",
  };

  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-all duration-200",
        colorStyles[color],
        highlight && "ring-2 ring-[#1e3a5f] ring-offset-2"
      )}
    >
      <div className="flex items-center justify-between">
        <span className={cn("text-sm font-medium text-slate-600", iconColorStyles[color])}>
          {icon}
        </span>
      </div>
      <p className={cn("mt-2 text-2xl font-bold", valueColorStyles[color])}>{value}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  );
}

function ObjectiveItem({ objective }: { objective: ObjectiveSummary }) {
  const statusConfig = {
    pending: { label: "Pending", className: "bg-slate-100 text-slate-600" },
    self_completed: { label: "Self Done", className: "bg-blue-100 text-blue-700" },
    manager_completed: { label: "Complete", className: "bg-green-100 text-green-700" },
  };

  const { label, className: badgeClass } = statusConfig[objective.status];

  return (
    <li className="flex items-center justify-between rounded-lg border border-slate-200 p-4 transition-colors duration-200 hover:bg-slate-50">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-slate-900 truncate">{objective.title}</p>
          <Badge variant="outline" className="text-xs">
            {objective.weight}%
          </Badge>
        </div>
        <p className="text-sm text-slate-500 mt-0.5">{objective.category}</p>
      </div>
      <div className="flex items-center gap-6 ml-4">
        <div className="text-center">
          <p className="text-xs text-slate-500">Self</p>
          <p
            className={cn(
              "font-semibold",
              objective.selfRating !== null ? "text-blue-600" : "text-slate-400"
            )}
          >
            {objective.selfRating !== null ? objective.selfRating.toFixed(1) : "—"}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500">Manager</p>
          <p
            className={cn(
              "font-semibold",
              objective.managerRating !== null ? "text-green-600" : "text-slate-400"
            )}
          >
            {objective.managerRating !== null ? objective.managerRating.toFixed(1) : "—"}
          </p>
        </div>
        <Badge className={cn("text-xs", badgeClass)}>{label}</Badge>
      </div>
    </li>
  );
}

interface EvaluationTimelineProps {
  status: EvaluationStatus;
  selfSubmittedAt?: string;
  managerSubmittedAt?: string;
}

function EvaluationTimeline({ status, selfSubmittedAt, managerSubmittedAt }: EvaluationTimelineProps) {
  const steps = [
    {
      label: "Objectives Assigned",
      completed: true,
      date: null,
    },
    {
      label: "Self-Evaluation",
      completed: status !== "NOT_STARTED",
      date: selfSubmittedAt,
    },
    {
      label: "Manager Review",
      completed: ["SELF_SUBMITTED", "MANAGER_IN_PROGRESS", "MANAGER_SUBMITTED", "COMPLETED"].includes(
        status
      ),
      date: managerSubmittedAt,
    },
    {
      label: "Completed",
      completed: status === "COMPLETED",
      date: managerSubmittedAt,
    },
  ];

  return (
    <ol className="relative">
      {steps.map((step, index) => (
        <li key={step.label} className="flex items-start gap-3 pb-4 last:pb-0">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "h-3 w-3 rounded-full border-2 transition-colors duration-200",
                step.completed ? "border-green-500 bg-green-500" : "border-slate-300 bg-white"
              )}
              aria-hidden="true"
            />
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "mt-1 h-6 w-0.5",
                  step.completed ? "bg-green-500" : "bg-slate-200"
                )}
                aria-hidden="true"
              />
            )}
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className={cn("text-sm font-medium", step.completed ? "text-slate-900" : "text-slate-500")}>
              {step.label}
            </p>
            {step.date && (
              <p className="text-xs text-slate-400">{formatDate(step.date)}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="text-center py-8">
      <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" aria-hidden="true" />
      <p className="text-slate-600 font-medium">{title}</p>
      <p className="text-sm text-slate-500 mt-1">{description}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SKELETON
// ═══════════════════════════════════════════════════════════════════════════════

export function EmployeeDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-6 w-40 rounded bg-slate-200" />
          <div className="h-4 w-60 rounded bg-slate-200 mt-1" />
        </div>
        <div className="h-6 w-24 rounded bg-slate-200" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-lg bg-slate-200" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 h-96 rounded-lg bg-slate-200" />
        <div className="h-64 rounded-lg bg-slate-200" />
      </div>
    </div>
  );
}
