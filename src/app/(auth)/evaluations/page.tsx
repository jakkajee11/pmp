/**
 * Evaluations Page
 *
 * Main page for self-evaluation and manager review workflows.
 */

"use client";

import * as React from "react";
import { use } from "react";
import {
  useDashboard,
  useEvaluationList,
  SelfEvalForm,
  SelfEvalFormSkeleton,
  EvaluationStatusBadge,
  RatingBadge,
  AutoSaveIndicator,
} from "../../../features/evaluations";
import { Button } from "../../../shared/components/ui/button";
import { cn } from "../../../shared/utils/cn";

interface EvaluationsPageProps {
  searchParams?: Promise<{
    cycleId?: string;
    evaluationId?: string;
  }>;
}

export default function EvaluationsPage({ searchParams }: EvaluationsPageProps) {
  const params = use(searchParams);
  const [selectedEvalId, setSelectedEvalId] = React.useState<string | null>(
    params?.evaluationId ?? null
  );

  const { dashboard, isLoading: dashboardLoading, fetchDashboard } = useDashboard(params?.cycleId);

  React.useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (dashboardLoading) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-6xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-1/4" />
          <div className="h-4 bg-slate-200 rounded w-1/2" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 bg-slate-200 rounded" />
            <div className="h-96 bg-slate-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  // Check if dashboard has team data (manager view) or objectives (employee view)
  const isManagerView = dashboard && "team" in dashboard;
  const isEmployeeView = dashboard && "objectives" in dashboard;

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          {isManagerView ? "Team Evaluations" : "Self Evaluation"}
        </h1>
        {dashboard?.cycle && (
          <p className="text-slate-500 mt-1">
            {dashboard.cycle.name} - {dashboard.cycle.status}
          </p>
        )}
      </div>

      {/* Manager Dashboard */}
      {isManagerView && (
        <ManagerDashboardView
          dashboard={dashboard as Extract<typeof dashboard, { team: unknown[] }>}
          onSelectEvaluation={setSelectedEvalId}
        />
      )}

      {/* Employee Dashboard */}
      {isEmployeeView && (
        <EmployeeDashboardView
          dashboard={dashboard as Extract<typeof dashboard, { objectives: unknown[] }>}
          selectedEvalId={selectedEvalId}
          onSelectEvaluation={setSelectedEvalId}
        />
      )}

      {/* No active cycle */}
      {!dashboard?.cycle && (
        <div className="text-center py-12">
          <svg
            className="w-16 h-16 mx-auto text-slate-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-slate-900">
            No Active Review Cycle
          </h3>
          <p className="mt-2 text-slate-500">
            There is no active review cycle at the moment. Please check back
            later or contact HR for more information.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Manager Dashboard View
 */
function ManagerDashboardView({
  dashboard,
  onSelectEvaluation,
}: {
  dashboard: { team: Array<{ id: string; name: string; selfEvalStatus: string; managerReviewStatus: string; overallStatus: string }> };
  onSelectEvaluation: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Team Size</p>
          <p className="text-2xl font-bold text-slate-900">{dashboard.team.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Pending Reviews</p>
          <p className="text-2xl font-bold text-blue-600">
            {dashboard.team.filter((t) => t.managerReviewStatus === "SELF_SUBMITTED").length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Completed</p>
          <p className="text-2xl font-bold text-green-600">
            {dashboard.team.filter((t) => t.overallStatus === "COMPLETED").length}
          </p>
        </div>
      </div>

      {/* Team List */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Employee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Self Eval
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Manager Review
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {dashboard.team.map((member) => (
              <tr key={member.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="font-medium text-slate-900">{member.name}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <EvaluationStatusBadge status={member.selfEvalStatus} size="sm" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <EvaluationStatusBadge status={member.managerReviewStatus} size="sm" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <EvaluationStatusBadge status={member.overallStatus} size="sm" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSelectEvaluation(member.id)}
                  >
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Employee Dashboard View
 */
function EmployeeDashboardView({
  dashboard,
  selectedEvalId,
  onSelectEvaluation,
}: {
  dashboard: {
    objectives: Array<{
      id: string;
      title: string;
      category: string;
      evaluationStatus: string;
      selfRating: number | null;
    }>;
    coreValues: Array<{
      id: string;
      name: string;
      evaluationStatus: string;
      selfRating: number | null;
    }>;
    selfEvalDeadline: string;
    canSubmit: boolean;
  };
  selectedEvalId: string | null;
  onSelectEvaluation: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Panel - Evaluation List */}
      <div className="lg:col-span-2 space-y-6">
        {/* Objectives Section */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900">KPI Objectives</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {dashboard.objectives.map((obj) => (
              <button
                key={obj.id}
                onClick={() => onSelectEvaluation(obj.id)}
                className={cn(
                  "w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50 transition-colors",
                  selectedEvalId === obj.id && "bg-blue-50"
                )}
              >
                <div>
                  <p className="font-medium text-slate-900">{obj.title}</p>
                  <p className="text-sm text-slate-500">{obj.category}</p>
                </div>
                <div className="flex items-center gap-3">
                  <RatingBadge rating={obj.selfRating} />
                  <EvaluationStatusBadge status={obj.evaluationStatus} size="sm" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Core Values Section */}
        {dashboard.coreValues.length > 0 && (
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
              <h2 className="font-semibold text-slate-900">Core Values</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {dashboard.coreValues.map((cv) => (
                <button
                  key={cv.id}
                  onClick={() => onSelectEvaluation(cv.id)}
                  className={cn(
                    "w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50 transition-colors",
                    selectedEvalId === cv.id && "bg-blue-50"
                  )}
                >
                  <p className="font-medium text-slate-900">{cv.name}</p>
                  <div className="flex items-center gap-3">
                    <RatingBadge rating={cv.selfRating} />
                    <EvaluationStatusBadge status={cv.evaluationStatus} size="sm" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Info & Actions */}
      <div className="space-y-4">
        {/* Deadline Card */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h3 className="text-sm font-medium text-slate-500">Self-Evaluation Deadline</h3>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {new Date(dashboard.selfEvalDeadline).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Submit Card */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h3 className="text-sm font-medium text-slate-500 mb-2">Ready to Submit?</h3>
          <p className="text-sm text-slate-600 mb-4">
            {dashboard.canSubmit
              ? "All evaluations are complete. You can submit now."
              : "Complete all evaluations to enable submission."}
          </p>
          <Button
            className="w-full"
            disabled={!dashboard.canSubmit}
          >
            Submit All Evaluations
          </Button>
        </div>
      </div>
    </div>
  );
}
