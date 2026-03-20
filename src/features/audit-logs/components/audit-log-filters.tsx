/**
 * AuditLogFilters Component
 *
 * Provides filtering UI for audit logs with date range, user, action, and entity type filters.
 */

"use client";

import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import {
  AuditLogFilters as AuditLogFiltersType,
  AuditAction,
  AuditEntityType,
  useAuditFilterOptions,
} from "../hooks/use-audit-logs";
import { Filter, X, RotateCcw } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface AuditLogFiltersProps {
  filters: AuditLogFiltersType;
  onFiltersChange: (filters: Partial<AuditLogFiltersType>) => void;
  onReset: () => void;
  isLoading?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function AuditLogFilters({
  filters,
  onFiltersChange,
  onReset,
  isLoading = false,
}: AuditLogFiltersProps) {
  const [localIpAddress, setLocalIpAddress] = useState(filters.ipAddress ?? "");
  const { actionOptions, entityTypeOptions } = useAuditFilterOptions();

  const hasActiveFilters =
    filters.userId !== null ||
    filters.action !== null ||
    filters.entityType !== null ||
    filters.entityId !== null ||
    filters.dateRange !== null ||
    filters.ipAddress !== null;

  const handleIpAddressChange = (value: string) => {
    setLocalIpAddress(value);
    // Debounce the filter update
    if (value === "") {
      onFiltersChange({ ipAddress: null });
    }
  };

  const handleIpAddressBlur = () => {
    if (localIpAddress !== filters.ipAddress) {
      onFiltersChange({ ipAddress: localIpAddress || null });
    }
  };

  const handleDateChange = (
    type: "start" | "end",
    value: string
  ) => {
    const currentDateRange = filters.dateRange ?? { start: null, end: null };
    const date = value ? new Date(value) : null;

    onFiltersChange({
      dateRange: {
        ...currentDateRange,
        [type]: date,
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Action Filter */}
        <div className="w-[150px]">
          <Label htmlFor="action-filter" className="sr-only">
            Action
          </Label>
          <Select
            value={filters.action ?? "all"}
            onValueChange={(value) =>
              onFiltersChange({
                action: value === "all" ? null : (value as AuditAction),
              })
            }
            disabled={isLoading}
          >
            <SelectTrigger id="action-filter">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {actionOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Entity Type Filter */}
        <div className="w-[170px]">
          <Label htmlFor="entity-filter" className="sr-only">
            Entity Type
          </Label>
          <Select
            value={filters.entityType ?? "all"}
            onValueChange={(value) =>
              onFiltersChange({
                entityType:
                  value === "all" ? null : (value as AuditEntityType),
              })
            }
            disabled={isLoading}
          >
            <SelectTrigger id="entity-filter">
              <SelectValue placeholder="All Entities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              {entityTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Range Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[180px]" disabled={isLoading}>
              <Filter className="mr-2 h-4 w-4" />
              {filters.dateRange?.start || filters.dateRange?.end
                ? "Date Range..."
                : "Date Range"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-4">
              <h4 className="font-medium">Filter by Date</h4>
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={
                    filters.dateRange?.start
                      ? filters.dateRange.start.toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) => handleDateChange("start", e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={
                    filters.dateRange?.end
                      ? filters.dateRange.end.toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) => handleDateChange("end", e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => onFiltersChange({ dateRange: null })}
                disabled={isLoading}
              >
                Clear Dates
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* IP Address Filter */}
        <div className="w-[180px]">
          <Input
            placeholder="IP Address"
            value={localIpAddress}
            onChange={(e) => handleIpAddressChange(e.target.value)}
            onBlur={handleIpAddressBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleIpAddressBlur();
              }
            }}
            disabled={isLoading}
          />
        </div>

        {/* Reset Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            disabled={isLoading}
            className="text-muted-foreground"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.action && (
            <FilterChip
              label={`Action: ${filters.action}`}
              onRemove={() => onFiltersChange({ action: null })}
            />
          )}
          {filters.entityType && (
            <FilterChip
              label={`Entity: ${filters.entityType}`}
              onRemove={() => onFiltersChange({ entityType: null })}
            />
          )}
          {filters.dateRange?.start && (
            <FilterChip
              label={`From: ${filters.dateRange.start.toLocaleDateString()}`}
              onRemove={() =>
                onFiltersChange({
                  dateRange: { ...filters.dateRange!, start: null },
                })
              }
            />
          )}
          {filters.dateRange?.end && (
            <FilterChip
              label={`To: ${filters.dateRange.end.toLocaleDateString()}`}
              onRemove={() =>
                onFiltersChange({
                  dateRange: { ...filters.dateRange!, end: null },
                })
              }
            />
          )}
          {filters.ipAddress && (
            <FilterChip
              label={`IP: ${filters.ipAddress}`}
              onRemove={() => {
                setLocalIpAddress("");
                onFiltersChange({ ipAddress: null });
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Filter Chip Component
// ============================================================================

function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
      {label}
      <button
        onClick={onRemove}
        className="ml-1 rounded-full hover:bg-primary/20"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

AuditLogFilters.displayName = "AuditLogFilters";
