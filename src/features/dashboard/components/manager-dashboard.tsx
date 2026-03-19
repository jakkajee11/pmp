/**
 * ManagerDashboard Component
 *
 * Dashboard for managers to view their team's evaluation status.
 */

"use client";

import * as React from "react";
import { cn } from "@/shared/utils/cn";
import { Button } from "@/shared/components/ui/button";
import { EvaluationStatusBadge } from "../../evaluations/components/evaluation-status";
import { StatusSummary } from "./status-summary";
import { EvaluationStatus } from "../../evaluations/types";

export interface TeamMember {
  id: string;
  name: string;
  email?: string;
  selfEvalStatus: EvaluationStatus;
  managerReviewStatus: EvaluationStatus;
  overallStatus: EvaluationStatus;
  selfRating?: number | null;
  managerRating?: number | null;
}

export interface ManagerDashboardProps {
  cycle: {
    id: string;
    name: string;
    status: string;
  };
  team: TeamMember[];
  pendingReviews: number;
  completedReviews: number;
  onSelectMember?: (memberId: string) => void;
  className?: string;
}

export function ManagerDashboard({
  cycle,
  team,
  pendingReviews,
  completedReviews,
  onSelectMember,
  className,
}: ManagerDashboardProps) {
  const totalTeam = team.length;
  const inProgress = team.filter(m =>
    m.overallStatus === "SELF_IN_PROGRESS" || m.overallStatus === "MANAGER_IN_PROGRESS"
  ).length;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Cycle Info */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{cycle.name}</h2>
          <p className="text-sm text-slate-500">Team Performance Review</p>
        </div>
        <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-700 rounded-full">
          {cycle.status}
        </span>
      </div>

      {/* Status Summary */}
      <StatusSummary
        stats={[
          { label: "Team Size", value: totalTeam, color: "slate" },
          { label: "Pending Reviews", value: pendingReviews, color: "blue", highlight: true },
          { label: "In Progress", value: inProgress, color: "yellow" },
          { label: "Completed", value: completedReviews, color: "green" },
        ]}
      />

      {/* Team Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
          <h3 className="font-medium text-slate-900">Team Members</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Self Evaluation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Manager Review
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Overall Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {team.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-medium text-slate-600">
                        {member.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-slate-900">{member.name}</p>
                        {member.email && (
                          <p className="text-xs text-slate-500">{member.email}</p>
                        )}
                      </div>
                    </div>
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
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSelectMember?.(member.id)}
                    >
                      {member.managerReviewStatus === "SELF_SUBMITTED" ? "Review" : "View"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {team.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            No team members found
          </div>
        )}
      </div>
    </div>
  );
}

export function ManagerDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-6 bg-slate-200 rounded w-40" />
          <div className="h-4 bg-slate-200 rounded w-60 mt-1" />
        </div>
        <div className="h-6 bg-slate-200 rounded w-20" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-slate-200 rounded-lg" />
        ))}
      </div>
      <div className="h-96 bg-slate-200 rounded-lg" />
    </div>
  );
}
