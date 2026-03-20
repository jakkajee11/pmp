/**
 * HRDashboard Component
 *
 * Dashboard for HR administrators to monitor overall review progress,
 * completion rates, and manage the review cycle.
 *
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
  AlertTriangle,
  FileText,
  Clock,
  CheckCircle2,
  Send,
  FileSearch,
  ChevronRight,
  Users,
  Building2,
  Info,
  AlertCircle,
  Settings,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { StatusSummary, ProgressSummary } from "./status-summary";

export interface DepartmentStats {
  id: string;
  name: string;
  totalEmployees: number;
  completedSelfEval: number;
  completedManagerReview: number;
  completionRate: number;
}

export interface CycleProgress {
  cycleId: string;
  cycleName: string;
  status: "draft" | "active" | "closed";
  totalEmployees: number;
  notStarted: number;
  selfEvalInProgress: number;
  selfSubmitted: number;
  managerInProgress: number;
  completed: number;
  deadline: string;
}

export interface HRDashboardProps {
  activeCycle: CycleProgress | null;
  departmentStats: DepartmentStats[];
  recentActivity: Array<{
    id: string;
    type: "submission" | "review" | "deadline" | "escalation";
    message: string;
    timestamp: string;
    userId?: string;
    userName?: string;
  }>;
  alerts: Array<{
    id: string;
    type: "warning" | "error" | "info";
    message: string;
    count?: number;
  }>;
  onViewCycle?: (cycleId: string) => void;
  onViewDepartment?: (departmentId: string) => void;
  onViewAllReports?: () => void;
  className?: string;
}

export function HRDashboard({
  activeCycle,
  departmentStats,
  recentActivity,
  alerts,
  onViewCycle,
  onViewDepartment,
  onViewAllReports,
  className,
}: HRDashboardProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">HR Dashboard</h2>
          <p className="text-sm text-slate-500">Performance Review Overview</p>
        </div>
        <div className="flex items-center gap-3">
          {activeCycle && (
            <Badge
              variant={activeCycle.status === "active" ? "default" : "secondary"}
              className={activeCycle.status === "active" ? "bg-green-600" : ""}
            >
              {activeCycle.cycleName}
            </Badge>
          )}
          <Button
            variant="outline"
            onClick={onViewAllReports}
            className="cursor-pointer transition-colors duration-200"
          >
            View Reports
          </Button>
        </div>
      </div>

      {/* Alerts Banner */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <AlertBanner key={alert.id} alert={alert} />
          ))}
        </div>
      )}

      {/* Main Stats */}
      {activeCycle && (
        <StatusSummary
          stats={[
            {
              label: "Total Employees",
              value: activeCycle.totalEmployees,
              color: "slate",
            },
            {
              label: "Not Started",
              value: activeCycle.notStarted,
              color: activeCycle.notStarted > 0 ? "red" : "slate",
              highlight: activeCycle.notStarted > activeCycle.totalEmployees * 0.1,
            },
            {
              label: "In Progress",
              value: activeCycle.selfEvalInProgress + activeCycle.managerInProgress,
              color: "yellow",
            },
            {
              label: "Completed",
              value: activeCycle.completed,
              color: "green",
            },
          ]}
        />
      )}

      {/* Progress Overview */}
      {activeCycle && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Review Progress</CardTitle>
            <CardDescription>
              Overall completion status for {activeCycle.cycleName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ProgressSummary
                title="Self-Evaluations"
                completed={activeCycle.selfSubmitted + activeCycle.completed}
                total={activeCycle.totalEmployees}
              />
              <ProgressSummary
                title="Manager Reviews"
                completed={activeCycle.completed}
                total={activeCycle.totalEmployees}
              />
              <div className="pt-4 border-t border-slate-200">
                <OverallCompletionChart
                  data={[
                    { label: "Not Started", value: activeCycle.notStarted, color: "#ef4444" },
                    { label: "Self In Progress", value: activeCycle.selfEvalInProgress, color: "#f59e0b" },
                    { label: "Self Submitted", value: activeCycle.selfSubmitted, color: "#3b82f6" },
                    { label: "Manager Review", value: activeCycle.managerInProgress, color: "#8b5cf6" },
                    { label: "Completed", value: activeCycle.completed, color: "#22c55e" },
                  ]}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Department Progress</CardTitle>
            <CardDescription>
              Completion rates by department
            </CardDescription>
          </CardHeader>
          <CardContent>
            {departmentStats.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">
                No department data available
              </p>
            ) : (
              <div className="space-y-3">
                {departmentStats.map((dept) => (
                  <button
                    key={dept.id}
                    onClick={() => onViewDepartment?.(dept.id)}
                    className="w-full text-left p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:ring-offset-2"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-slate-900">{dept.name}</span>
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          dept.completionRate >= 80
                            ? "text-green-600"
                            : dept.completionRate >= 50
                            ? "text-yellow-600"
                            : "text-red-600"
                        )}
                      >
                        {dept.completionRate}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          dept.completionRate >= 80
                            ? "bg-green-500"
                            : dept.completionRate >= 50
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        )}
                        style={{ width: `${dept.completionRate}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-slate-500">
                      <span>{dept.completedManagerReview} / {dept.totalEmployees} completed</span>
                      <span>{dept.totalEmployees} employees</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <CardDescription>
              Latest review activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">
                No recent activity
              </p>
            ) : (
              <div className="space-y-3">
                {recentActivity.slice(0, 8).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors duration-200"
                  >
                    <ActivityIcon type={activity.type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700">{activity.message}</p>
                      {activity.userName && (
                        <p className="text-xs text-slate-500">by {activity.userName}</p>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      {formatRelativeTime(activity.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => activeCycle && onViewCycle?.(activeCycle.cycleId)}
              disabled={!activeCycle}
              className="cursor-pointer transition-colors duration-200"
            >
              <Building2 className="mr-2 h-4 w-4" aria-hidden="true" />
              Manage Cycle
            </Button>
            <Button
              variant="outline"
              onClick={onViewAllReports}
              className="cursor-pointer transition-colors duration-200"
            >
              <FileSearch className="mr-2 h-4 w-4" aria-hidden="true" />
              Export Reports
            </Button>
            <Button
              variant="outline"
              className="cursor-pointer transition-colors duration-200"
            >
              <Send className="mr-2 h-4 w-4" aria-hidden="true" />
              Send Reminders
            </Button>
            <Button
              variant="outline"
              className="cursor-pointer transition-colors duration-200"
            >
              <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
              View Audit Logs
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AlertBanner({ alert }: { alert: HRDashboardProps["alerts"][0] }) {
  const config = {
    warning: {
      bg: "bg-yellow-50 border-yellow-200",
      text: "text-yellow-800",
      icon: AlertTriangle,
      iconColor: "text-yellow-600",
    },
    error: {
      bg: "bg-red-50 border-red-200",
      text: "text-red-800",
      icon: AlertCircle,
      iconColor: "text-red-600",
    },
    info: {
      bg: "bg-blue-50 border-blue-200",
      text: "text-blue-800",
      icon: Info,
      iconColor: "text-blue-600",
    },
  };

  const { bg, text, icon: Icon, iconColor } = config[alert.type];

  return (
    <div
      className={cn("flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors duration-200", bg)}
      role="alert"
    >
      <Icon className={cn("h-5 w-5 flex-shrink-0", iconColor)} aria-hidden="true" />
      <p className={cn("text-sm font-medium", text)}>{alert.message}</p>
      {alert.count !== undefined && (
        <Badge variant="secondary" className={text}>
          {alert.count}
        </Badge>
      )}
    </div>
  );
}

function ActivityIcon({ type }: { type: HRDashboardProps["recentActivity"][0]["type"] }) {
  const iconConfig = {
    submission: { icon: FileText, color: "text-blue-600", bg: "bg-blue-100" },
    review: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100" },
    deadline: { icon: Clock, color: "text-orange-600", bg: "bg-orange-100" },
    escalation: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-100" },
  };

  const { icon: Icon, color, bg } = iconConfig[type];

  return (
    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", bg)}>
      <Icon className={cn("h-4 w-4", color)} aria-hidden="true" />
    </div>
  );
}

interface OverallCompletionChartProps {
  data: Array<{ label: string; value: number; color: string }>;
}

function OverallCompletionChart({ data }: OverallCompletionChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const filteredData = data.filter((item) => item.value > 0);

  if (total === 0) {
    return (
      <p className="text-sm text-slate-500 text-center py-4">
        No data to display
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {/* Horizontal bar */}
      <div className="flex h-4 w-full rounded-full overflow-hidden">
        {filteredData.map((item, index) => {
          const percentage = (item.value / total) * 100;
          return (
            <div
              key={index}
              className="h-full transition-all duration-300"
              style={{
                width: `${percentage}%`,
                backgroundColor: item.color,
              }}
            />
          );
        })}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {filteredData.map((item, index) => (
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
    </div>
  );
}

function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function HRDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-6 bg-slate-200 rounded w-32" />
          <div className="h-4 bg-slate-200 rounded w-48 mt-1" />
        </div>
        <div className="h-8 bg-slate-200 rounded w-28" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-slate-200 rounded-lg" />
        ))}
      </div>
      <div className="h-48 bg-slate-200 rounded-lg" />
      <div className="grid grid-cols-2 gap-6">
        <div className="h-80 bg-slate-200 rounded-lg" />
        <div className="h-80 bg-slate-200 rounded-lg" />
      </div>
    </div>
  );
}
