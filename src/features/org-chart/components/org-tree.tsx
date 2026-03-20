/**
 * Org Tree Component
 *
 * Interactive organization chart using React Flow.
 * Supports zooming, panning, and node selection.
 */

"use client";

import * as React from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  NodeTypes,
  MarkerType,
  useNodesState,
  useEdgesState,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { OrgNode, OrgNodeCompact } from "./org-node";
import { useOrgFlatData } from "../hooks/use-org-data";
import { OrgFlowNode, OrgFlowEdge } from "../types";
import { cn } from "@/shared/lib/utils";

// Register custom node types
const nodeTypes: NodeTypes = {
  orgNode: OrgNode,
  orgNodeCompact: OrgNodeCompact,
};

interface OrgTreeProps {
  rootUserId?: string;
  departmentId?: string;
  onNodeClick?: (userId: string) => void;
  className?: string;
}

export function OrgTree({
  rootUserId,
  departmentId,
  onNodeClick,
  className,
}: OrgTreeProps) {
  const [depth, setDepth] = React.useState(3);
  const [viewMode, setViewMode] = React.useState<"full" | "compact">("full");

  const { nodes: fetchedNodes, edges: fetchedEdges, isLoading, error } = useOrgFlatData({
    rootUserId,
    departmentId,
    depth,
  });

  const [nodes, setNodes, onNodesChange] = useNodesState(fetchedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(fetchedEdges);

  // Update nodes/edges when fetched data changes
  React.useEffect(() => {
    const mappedNodes = fetchedNodes.map((node) => ({
      ...node,
      type: viewMode === "compact" ? "orgNodeCompact" : "orgNode",
    }));
    setNodes(mappedNodes);
    setEdges(
      fetchedEdges.map((edge) => ({
        ...edge,
        markerEnd: { type: MarkerType.ArrowClosed, color: "#94a3b8" },
        style: { stroke: "#cbd5e1", strokeWidth: 2 },
      }))
    );
  }, [fetchedNodes, fetchedEdges, viewMode, setNodes, setEdges]);

  const handleNodeClick = React.useCallback(
    (_event: React.MouseEvent, node: { id: string }) => {
      onNodeClick?.(node.id);
    },
    [onNodeClick]
  );

  if (error) {
    return (
      <Card className={cn("w-full border-slate-200", className)}>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Failed to load organization chart</p>
            <p className="text-sm text-slate-500 mt-1">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full h-[600px] border-slate-200 shadow-sm", className)}>
      <CardHeader className="bg-slate-50 border-b border-slate-200 py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-slate-900">
            Organization Chart
          </CardTitle>
          <div className="flex items-center gap-3">
            {/* Depth Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Levels:</span>
              <Select value={String(depth)} onValueChange={(v) => setDepth(Number(v))}>
                <SelectTrigger className="w-20 h-8 border-slate-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">View:</span>
              <Select value={viewMode} onValueChange={(v: "full" | "compact") => setViewMode(v)}>
                <SelectTrigger className="w-24 h-8 border-slate-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full</SelectItem>
                  <SelectItem value="compact">Compact</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 h-[calc(100%-56px)]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-slate-500">Loading organization chart...</div>
          </div>
        ) : nodes.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-slate-500">No organization data available</div>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.2}
            maxZoom={2}
            defaultEdgeOptions={{
              type: "smoothstep",
              animated: false,
            }}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#e2e8f0" gap={20} />
            <Controls className="bg-white border border-slate-200 rounded-md shadow-sm" />
            <MiniMap
              nodeColor={(node) => {
                const roleColors: Record<string, string> = {
                  SUPER_ADMIN: "#dc2626",
                  HR_ADMIN: "#1e3a5f",
                  SENIOR_MANAGER: "#4f46e5",
                  LINE_MANAGER: "#059669",
                  EMPLOYEE: "#64748b",
                };
                return roleColors[node.data?.role] || "#64748b";
              }}
              maskColor="rgba(255, 255, 255, 0.8)"
              className="bg-white border border-slate-200 rounded-md"
            />
          </ReactFlow>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Simple tree view (non-ReactFlow version)
 */
export function OrgTreeSimple({
  data,
  onNodeClick,
  level = 0,
}: {
  data: any;
  onNodeClick?: (userId: string) => void;
  level?: number;
}) {
  if (!data) return null;

  return (
    <div className={cn("space-y-2", level > 0 && "ml-6 mt-2")}>
      <div
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors",
          level === 0 && "border-l-4 border-l-[#1e3a5f]"
        )}
        onClick={() => onNodeClick?.(data.id)}
      >
        <div className="flex-1">
          <p className="font-medium text-slate-900">{data.name}</p>
          {data.nameTh && <p className="text-sm text-slate-500">{data.nameTh}</p>}
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-600">{data.role.replace("_", " ")}</p>
          {data.department && <p className="text-xs text-slate-500">{data.department}</p>}
        </div>
      </div>
      {data.directReports?.length > 0 && (
        <div className="border-l-2 border-slate-200 ml-4 pl-2">
          {data.directReports.map((report: any) => (
            <OrgTreeSimple
              key={report.id}
              data={report}
              onNodeClick={onNodeClick}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
