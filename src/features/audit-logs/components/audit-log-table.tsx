/**
 * AuditLogTable Component
 *
 * Displays audit logs in a table format with sorting and pagination.
 */

"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  AuditLog,
  AuditAction,
  AuditEntityType,
  ACTION_LABELS,
  ACTION_COLORS,
  ENTITY_TYPE_LABELS,
} from "../types";

// ============================================================================
// Types
// ============================================================================

interface AuditLogTableProps {
  logs: AuditLog[];
  isLoading?: boolean;
  onRowClick?: (log: AuditLog) => void;
  selectedId?: string | null;
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(date));
}

function getActionBadgeVariant(action: AuditAction): "default" | "secondary" | "destructive" | "outline" {
  switch (action) {
    case "create":
      return "default";
    case "update":
      return "secondary";
    case "delete":
      return "destructive";
    case "view":
      return "outline";
    default:
      return "default";
  }
}

// ============================================================================
// Component
// ============================================================================

export function AuditLogTable({
  logs,
  isLoading = false,
  onRowClick,
  selectedId,
}: AuditLogTableProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Timestamp</TableHead>
              <TableHead className="w-[150px]">User</TableHead>
              <TableHead className="w-[100px]">Action</TableHead>
              <TableHead className="w-[130px]">Entity</TableHead>
              <TableHead>Entity ID</TableHead>
              <TableHead className="w-[130px]">IP Address</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                </TableCell>
                <TableCell>
                  <div className="h-5 w-16 animate-pulse rounded bg-muted" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-md border border-dashed">
        <p className="text-muted-foreground">No audit logs found</p>
        <p className="text-sm text-muted-foreground">
          Try adjusting your filters or check back later
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Timestamp</TableHead>
            <TableHead className="w-[150px]">User</TableHead>
            <TableHead className="w-[100px]">Action</TableHead>
            <TableHead className="w-[130px]">Entity</TableHead>
            <TableHead>Entity ID</TableHead>
            <TableHead className="w-[130px]">IP Address</TableHead>
            {onRowClick && <TableHead className="w-[80px]">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => {
            const isSelected = selectedId === log.id;
            const isHovered = hoveredId === log.id;

            return (
              <TableRow
                key={log.id}
                className={`
                  ${onRowClick ? "cursor-pointer" : ""}
                  ${isSelected ? "bg-primary/5" : ""}
                  ${isHovered && !isSelected ? "bg-muted/50" : ""}
                `}
                onMouseEnter={() => setHoveredId(log.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onRowClick?.(log)}
              >
                <TableCell className="font-mono text-xs">
                  {formatDate(log.createdAt)}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {log.user?.name ?? "System"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {log.user?.email ?? "N/A"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={getActionBadgeVariant(log.action)}
                    style={{
                      backgroundColor:
                        log.action !== "view"
                          ? ACTION_COLORS[log.action] + "20"
                          : undefined,
                      borderColor: ACTION_COLORS[log.action],
                      color: ACTION_COLORS[log.action],
                    }}
                  >
                    {ACTION_LABELS[log.action]}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {ENTITY_TYPE_LABELS[log.entityType as AuditEntityType] ??
                    log.entityType}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  <span className="max-w-[200px] truncate" title={log.entityId}>
                    {log.entityId.length > 36
                      ? `${log.entityId.slice(0, 36)}...`
                      : log.entityId}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {log.ipAddress}
                </TableCell>
                {onRowClick && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRowClick(log);
                      }}
                    >
                      View
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

AuditLogTable.displayName = "AuditLogTable";
