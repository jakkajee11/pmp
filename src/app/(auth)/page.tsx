/**
 * Dashboard Page
 *
 * Role-based dashboard entry point that shows different views for
 * employees, managers, and HR administrators.
 */

"use client";

import * as React from "react";
import Link from "next/link";
import { useSession } from "../../features/auth/hooks/use-session";
import {
  useDashboardData,
  ManagerDashboard,
  ManagerDashboardSkeleton,
  StatusSummary,
} from "../../features/dashboard";
import { EvaluationStatusBadge } from "../../features/evaluations";
import { Button } from "../../shared/components/ui/button";
import { cn } from "../../shared/utils/cn";

export default function DashboardPage() {
  const { user, isLoading: sessionLoading } = useSession();
  const { data, isLoading: dashboardLoading, error, isManager, refresh } = useDashboardData();

  const isLoading = sessionLoading || dashboardLoading;

  if (isLoading) {
    return <DashboardSkeleton isManager={isManager} />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={refresh}>Retry</Button>
      </div>
    );
  }

  // Manager View
  if (isManager && data?.team) {
    return (
      <ManagerDashboard
        cycle={data.cycle!}
        team={data.team}
        pendingReviews={data.pendingReviews || 0}
        completedReviews={data.completedReviews || 0}
        onSelectMember={(memberId) => {
          window.location.href = `/evaluations?employeeId=${memberId}`;
        }}
      />
    );
  }

  // Employee View
  return (
    <EmployeeDashboardView
      data={data}
      userRole={session?.user?.role}
    />
  );
}

function EmployeeDashboardView({
  data,
  userRole,
}: {
  data: any;
  userRole?: string;
}) {
  if (!data?.cycle) {
    return (
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
    );
  }

  const objectives = data.objectives || [];
  const coreValues = data.coreValues || [];
  const totalItems = objectives.length + coreValues.length;
  const completedItems = [...objectives, ...coreValues].filter(
    (item: any) => item.evaluationStatus === "COMPLETED"
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Dashboard</h1>
          <p className="text-slate-500 mt-1">
            {data.cycle.name} - {data.cycle.status}
          </p>
        </div>
        <Link href="/evaluations">
          <Button>Go to Evaluations</Button>
        </Link>
      </div>

      {/* Progress Summary */}
      <StatusSummary
        stats={[
          {
            label: "Total Items",
            value: totalItems,
            color: "slate",
          },
          {
            label: "Completed",
            value: completedItems,
            color: "green",
          },
          {
            label: "Remaining",
            value: totalItems - completedItems,
            color: "blue",
          },
          {
            label: "Can Submit",
            value: data.canSubmit ? "Yes" : "No",
            color: data.canSubmit ? "green" : "yellow",
          },
        ]}
      />

      {/* Deadline Warning */}
      {data.selfEvalDeadline && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm font-medium text-blue-800">
              Self-Evaluation Deadline:{" "}
              {new Date(data.selfEvalDeadline).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      )}

      {/* Objectives Section */}
      {objectives.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900">KPI Objectives</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {objectives.slice(0, 5).map((obj: any) => (
              <div
                key={obj.id}
                className="px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-slate-900">{obj.title}</p>
                  <p className="text-sm text-slate-500">{obj.category}</p>
                </div>
                <EvaluationStatusBadge status={obj.evaluationStatus} size="sm" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/evaluations"
          className="p-4 bg-white rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all"
        >
          <h3 className="font-medium text-slate-900">Complete Evaluations</h3>
          <p className="text-sm text-slate-500 mt-1">
            Review and rate your objectives and core values
          </p>
        </Link>
        <Link
          href="/objectives"
          className="p-4 bg-white rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all"
        >
          <h3 className="font-medium text-slate-900">View Objectives</h3>
          <p className="text-sm text-slate-500 mt-1">
            See your assigned objectives for this cycle
          </p>
        </Link>
      </div>
    </div>
  );
}

function DashboardSkeleton({ isManager }: { isManager: boolean }) {
  if (isManager) {
    return <ManagerDashboardSkeleton />;
  }

  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 bg-slate-200 rounded w-40" />
          <div className="h-4 bg-slate-200 rounded w-60 mt-1" />
        </div>
        <div className="h-10 bg-slate-200 rounded w-36" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-slate-200 rounded-lg" />
        ))}
      </div>
      <div className="h-16 bg-slate-200 rounded-lg" />
      <div className="h-64 bg-slate-200 rounded-lg" />
    </div>
  );
}
