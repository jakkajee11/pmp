/**
 * Objective Card Component
 *
 * Displays objective information in a card format with status and actions.
 * Uses Professional Corporate design with navy blue accents.
 */

"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  ObjectiveCategory,
  ObjectiveListItem,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  EVALUATION_STATUS_COLORS,
  EVALUATION_STATUS_LABELS,
} from "../types";
import { MoreHorizontal, Edit, Copy, Trash2, FileText, Calendar, User } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface ObjectiveCardProps {
  objective: ObjectiveListItem;
  onEdit?: (id: string) => void;
  onCopy?: (id: string) => void;
  onDelete?: (id: string) => void;
  onView?: (id: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function ObjectiveCard({
  objective,
  onEdit,
  onCopy,
  onDelete,
  onView,
  canEdit = false,
  canDelete = false,
}: ObjectiveCardProps) {
  const categoryColor = CATEGORY_COLORS[objective.category];
  const statusColor = EVALUATION_STATUS_COLORS[objective.evaluationStatus as keyof typeof EVALUATION_STATUS_COLORS] || "bg-gray-100 text-gray-800";

  const handleClick = () => {
    onView?.(objective.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onView?.(objective.id);
    }
  };

  return (
    <Card
      className="border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View objective: ${objective.title}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold text-slate-900 line-clamp-2">
              {objective.title}
            </CardTitle>
          </div>
          {(canEdit || canDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                {canEdit && (
                  <DropdownMenuItem onClick={() => onEdit?.(objective.id)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onCopy?.(objective.id)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy to...
                </DropdownMenuItem>
                {canDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete?.(objective.id)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Description */}
        <p className="text-sm text-slate-600 line-clamp-2">{objective.description}</p>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className={cn("font-medium", categoryColor)}>
            {CATEGORY_LABELS[objective.category]}
          </Badge>
          <Badge variant="secondary" className={cn("font-medium", statusColor)}>
            {EVALUATION_STATUS_LABELS[objective.evaluationStatus as keyof typeof EVALUATION_STATUS_LABELS] || objective.evaluationStatus}
          </Badge>
        </div>

        {/* Meta Information */}
        <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1">
            <User className="h-3.5 w-3.5" />
            <span>{objective.assignedTo.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>{objective.timeline}</span>
          </div>
          {objective.keyResults && (
            <div className="flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              <span>Has KRs</span>
            </div>
          )}
        </div>

        {/* Cycle */}
        <div className="text-xs text-slate-400">
          Cycle: {objective.cycle.name}
        </div>
      </CardContent>
    </Card>
  );
}
