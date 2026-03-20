/**
 * Org Node Component
 *
 * Individual node in the organization chart.
 * Uses Professional Corporate design with role-based styling.
 */

"use client";

import * as React from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Mail, Users } from "lucide-react";
import { Card } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { RoleBadgeCompact } from "../../users/components/role-badge";
import { OrgFlowNode } from "../types";
import { cn } from "@/shared/lib/utils";

export function OrgNode({ data }: NodeProps<OrgFlowNode["data"]>) {
  const { name, nameTh, role, department, email, directReportsCount } = data;

  return (
    <Card className="min-w-[200px] max-w-[280px] border-slate-200 shadow-md hover:shadow-lg transition-shadow">
      {/* Top Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-slate-300 border-2 border-white"
      />

      <div className="p-4">
        {/* Header with Role Badge */}
        <div className="flex items-center justify-between mb-2">
          <RoleBadgeCompact role={role} />
        </div>

        {/* Name */}
        <div className="mb-2">
          <h3 className="font-semibold text-slate-900 text-sm">{name}</h3>
          {nameTh && (
            <p className="text-xs text-slate-500 mt-0.5">{nameTh}</p>
          )}
        </div>

        {/* Department */}
        {department && (
          <p className="text-xs text-slate-600 mb-2">{department}</p>
        )}

        {/* Email */}
        <div className="flex items-center text-xs text-slate-500">
          <Mail className="h-3 w-3 mr-1" />
          <span className="truncate">{email}</span>
        </div>

        {/* Direct Reports Count */}
        {directReportsCount > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-100">
            <Badge
              variant="secondary"
              className="bg-slate-100 text-slate-600 text-xs"
            >
              <Users className="h-3 w-3 mr-1" />
              {directReportsCount} direct report{directReportsCount !== 1 ? "s" : ""}
            </Badge>
          </div>
        )}
      </div>

      {/* Bottom Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-[#1e3a5f] border-2 border-white"
      />
    </Card>
  );
}

/**
 * Compact Org Node for dense views
 */
export function OrgNodeCompact({ data }: NodeProps<OrgFlowNode["data"]>) {
  const { name, role, directReportsCount } = data;

  return (
    <div className="bg-white border border-slate-200 rounded-md px-3 py-2 shadow-sm hover:shadow transition-shadow min-w-[140px]">
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 bg-slate-300"
      />

      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-slate-900 truncate">{name}</p>
          <p className="text-xs text-slate-500">{role.replace("_", " ")}</p>
        </div>
        {directReportsCount > 0 && (
          <Badge variant="outline" className="text-xs">
            {directReportsCount}
          </Badge>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2 bg-[#1e3a5f]"
      />
    </div>
  );
}
