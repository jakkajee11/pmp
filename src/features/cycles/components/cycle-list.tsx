"use client";

/**
 * Cycle List Component
 *
 * Displays a list of review cycles with status and completion stats.
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../shared/components/ui/card";
import { Button } from "../../../shared/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../shared/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../shared/components/ui/dropdown-menu";
import { CycleStatusBadge } from "./cycle-status-badge";
import {
  ReviewCycleListItem,
  CycleStatus,
  CYCLE_TYPE_LABELS,
} from "../types";
import { MoreHorizontal, Plus, Play, XCircle, Pencil } from "lucide-react";

interface CycleListProps {
  cycles: ReviewCycleListItem[];
  onCreateCycle: () => void;
  onEditCycle: (cycle: ReviewCycleListItem) => void;
  onActivateCycle: (cycle: ReviewCycleListItem) => void;
  onCloseCycle: (cycle: ReviewCycleListItem) => void;
  onViewCycle: (cycle: ReviewCycleListItem) => void;
  isLoading?: boolean;
}

export function CycleList({
  cycles,
  onCreateCycle,
  onEditCycle,
  onActivateCycle,
  onCloseCycle,
  onViewCycle,
  isLoading = false,
}: CycleListProps) {
  const canActivate = (cycle: ReviewCycleListItem) => cycle.status === "DRAFT";
  const canClose = (cycle: ReviewCycleListItem) => cycle.status === "ACTIVE";
  const canEdit = (cycle: ReviewCycleListItem) => cycle.status === "DRAFT";

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatPercentage = (completed: number, total: number) => {
    if (total === 0) return "0%";
    return `${Math.round((completed / total) * 100)}%`;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-navy-900">Review Cycles</CardTitle>
        <Button
          onClick={onCreateCycle}
          className="bg-navy-700 hover:bg-navy-800"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Cycle
        </Button>
      </CardHeader>
      <CardContent>
        {cycles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 mb-4">No review cycles found.</p>
            <Button
              variant="outline"
              onClick={onCreateCycle}
              disabled={isLoading}
            >
              Create your first cycle
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Self-Eval Progress</TableHead>
                <TableHead>Manager Review Progress</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cycles.map((cycle) => (
                <TableRow
                  key={cycle.id}
                  className="cursor-pointer hover:bg-slate-50"
                  onClick={() => onViewCycle(cycle)}
                >
                  <TableCell className="font-medium">{cycle.name}</TableCell>
                  <TableCell>{CYCLE_TYPE_LABELS[cycle.type]}</TableCell>
                  <TableCell>
                    {formatDate(cycle.startDate)} - {formatDate(cycle.endDate)}
                  </TableCell>
                  <TableCell>
                    <CycleStatusBadge status={cycle.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{
                            width: formatPercentage(
                              cycle.completionStats.selfEvalCompleted,
                              cycle.completionStats.totalEmployees
                            ),
                          }}
                        />
                      </div>
                      <span className="text-sm text-slate-600">
                        {cycle.completionStats.selfEvalCompleted}/
                        {cycle.completionStats.totalEmployees}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: formatPercentage(
                              cycle.completionStats.managerReviewCompleted,
                              cycle.completionStats.totalEmployees
                            ),
                          }}
                        />
                      </div>
                      <span className="text-sm text-slate-600">
                        {cycle.completionStats.managerReviewCompleted}/
                        {cycle.completionStats.totalEmployees}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewCycle(cycle);
                          }}
                        >
                          View Details
                        </DropdownMenuItem>
                        {canEdit(cycle) && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditCycle(cycle);
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {canActivate(cycle) && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onActivateCycle(cycle);
                            }}
                          >
                            <Play className="mr-2 h-4 w-4" />
                            Activate
                          </DropdownMenuItem>
                        )}
                        {canClose(cycle) && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onCloseCycle(cycle);
                              }}
                              className="text-red-600"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Close Cycle
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
