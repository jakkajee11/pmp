/**
 * Audit Logs Page
 *
 * Displays audit logs with filtering and pagination for compliance tracking.
 */

"use client";

import { useState } from "react";
import { AuditLogTable } from "@/features/audit-logs/components/audit-log-table";
import { AuditLogFilters } from "@/features/audit-logs/components/audit-log-filters";
import { ChangeDiff } from "@/features/audit-logs/components/change-diff";
import { useAuditLogs } from "@/features/audit-logs/hooks/use-audit-logs";
import { AuditLog } from "@/features/audit-logs/types";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Download, RefreshCcw } from "lucide-react";

export default function AuditLogsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">
            Complete audit trail of all system changes for compliance tracking
          </p>
        </div>
      </div>

      <AuditLogsContent />
    </div>
  );
}

// Client component to manage filters and logs state
function AuditLogsContent() {
  const {
    logs,
    pagination,
    filters,
    isLoading,
    error,
    setPage,
    setFilters,
    resetFilters,
    refresh,
  } = useAuditLogs();

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Handle row click
  const handleRowClick = (log: AuditLog) => {
    setSelectedLog(selectedLog?.id === log.id ? null : log);
  };

  // Handle export
  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.action) params.set("action", filters.action);
      if (filters.entityType) params.set("entityType", filters.entityType);
      if (filters.dateRange?.start) {
        params.set("startDate", filters.dateRange.start.toISOString());
      }
      if (filters.dateRange?.end) {
        params.set("endDate", filters.dateRange.end.toISOString());
      }
      params.set("format", "csv");

      const response = await fetch(`/api/audit-logs/export?${params.toString()}`);
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit_logs_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filters</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={refresh} disabled={isLoading}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport} disabled={isLoading}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <AuditLogFilters
            filters={filters}
            onFiltersChange={setFilters}
            onReset={resetFilters}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="p-6">
            <AuditLogTable
              logs={logs}
              onRowClick={handleRowClick}
              isLoading={isLoading}
              selectedId={selectedLog?.id}
            />
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-6 py-4">
              <div className="text-sm text-muted-foreground">
                Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total logs)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => setPage(1)}
                >
                  First
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => setPage(pagination.page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => setPage(pagination.page + 1)}
                >
                  Next
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => setPage(pagination.totalPages)}
                >
                  Last
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Log Detail */}
      {selectedLog && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Change Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Timestamp:</span>{" "}
                {new Date(selectedLog.createdAt).toLocaleString()}
              </div>
              <div>
                <span className="font-medium">User:</span>{" "}
                {selectedLog.user?.name ?? "System"}
              </div>
              <div>
                <span className="font-medium">Action:</span> {selectedLog.action}
              </div>
              <div>
                <span className="font-medium">Entity:</span> {selectedLog.entityType}
              </div>
              <div>
                <span className="font-medium">IP Address:</span> {selectedLog.ipAddress}
              </div>
              {selectedLog.userAgent && (
                <div className="col-span-2">
                  <span className="font-medium">User Agent:</span>{" "}
                  <span className="font-mono text-xs">{selectedLog.userAgent}</span>
                </div>
              )}
            </div>
            <ChangeDiff
              oldValues={selectedLog.oldValues}
              newValues={selectedLog.newValues}
              entityType={selectedLog.entityType}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

AuditLogsContent.displayName = "AuditLogsContent";
