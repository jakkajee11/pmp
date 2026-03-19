/**
 * ChangeDiff Component
 *
 * Displays the difference between old and new values in an audit log entry.
 */

"use client";

import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/components/ui/collapsible";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { ChevronDown, ChevronRight, Plus, Minus, ArrowRight } from "lucide-react";
import { ChangeDiff as ChangeDiffType } from "../types";

// ============================================================================
// Types
// ============================================================================

interface ChangeDiffProps {
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  entityType?: string;
}

interface DiffRowProps {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  type: "added" | "removed" | "modified";
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "null";
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

function isSensitiveField(field: string): boolean {
  const sensitivePatterns = [
    /password/i,
    /token/i,
    /secret/i,
    /api[-_]?key/i,
    /private[-_]?key/i,
    /credential/i,
  ];
  return sensitivePatterns.some((pattern) => pattern.test(field));
}

function calculateDiffs(
  oldValues: Record<string, unknown> | null,
  newValues: Record<string, unknown> | null
): ChangeDiffType[] {
  const diffs: ChangeDiffType[] = [];
  const allKeys = new Set([
    ...Object.keys(oldValues ?? {}),
    ...Object.keys(newValues ?? {}),
  ]);

  for (const field of allKeys) {
    const oldValue = oldValues?.[field];
    const newValue = newValues?.[field];

    // Skip null-to-null comparisons
    if (oldValue === undefined && newValue === undefined) {
      continue;
    }

    if (oldValue === undefined || oldValue === null) {
      diffs.push({ field, oldValue: null, newValue, type: "added" });
    } else if (newValue === undefined || newValue === null) {
      diffs.push({ field, oldValue, newValue: null, type: "removed" });
    } else if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      diffs.push({ field, oldValue, newValue, type: "modified" });
    }
  }

  return diffs.sort((a, b) => a.field.localeCompare(b.field));
}

// ============================================================================
// Diff Row Component
// ============================================================================

function DiffRow({ field, oldValue, newValue, type }: DiffRowProps) {
  const sensitive = isSensitiveField(field);
  const displayValue = sensitive ? "[REDACTED]" : formatValue;

  return (
    <div className="grid grid-cols-[1fr,auto,1fr] items-start gap-2 py-2 text-sm">
      {/* Field Name */}
      <div className="flex items-center gap-2">
        {type === "added" && <Plus className="h-4 w-4 text-green-500" />}
        {type === "removed" && <Minus className="h-4 w-4 text-red-500" />}
        {type === "modified" && (
          <ArrowRight className="h-4 w-4 text-blue-500" />
        )}
        <span className="font-medium">{field}</span>
      </div>

      {/* Arrow */}
      <div className="flex justify-center">
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Values */}
      <div className="space-y-1">
        {type === "added" && (
          <div className="rounded bg-green-500/10 p-2 font-mono text-xs text-green-700">
            <Badge variant="outline" className="mb-1 text-xs">
              New
            </Badge>
            <pre className="whitespace-pre-wrap">
              {sensitive ? "[REDACTED]" : formatValue(newValue)}
            </pre>
          </div>
        )}

        {type === "removed" && (
          <div className="rounded bg-red-500/10 p-2 font-mono text-xs text-red-700">
            <Badge variant="outline" className="mb-1 text-xs">
              Removed
            </Badge>
            <pre className="whitespace-pre-wrap">
              {sensitive ? "[REDACTED]" : formatValue(oldValue)}
            </pre>
          </div>
        )}

        {type === "modified" && (
          <div className="space-y-1">
            <div className="rounded bg-red-500/10 p-2 font-mono text-xs text-red-700">
              <Badge variant="outline" className="mb-1 text-xs">
                Old
              </Badge>
              <pre className="whitespace-pre-wrap">
                {sensitive ? "[REDACTED]" : formatValue(oldValue)}
              </pre>
            </div>
            <div className="rounded bg-green-500/10 p-2 font-mono text-xs text-green-700">
              <Badge variant="outline" className="mb-1 text-xs">
                New
              </Badge>
              <pre className="whitespace-pre-wrap">
                {sensitive ? "[REDACTED]" : formatValue(newValue)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ChangeDiff({ oldValues, newValues, entityType }: ChangeDiffProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Calculate differences
  const diffs = calculateDiffs(oldValues, newValues);

  // Check if there are any changes
  const hasChanges = diffs.length > 0;

  // Special case: view action (no changes)
  if (!oldValues && !newValues) {
    return (
      <div className="rounded-md border bg-muted/50 p-4 text-center text-sm text-muted-foreground">
        No data changes recorded for this action
      </div>
    );
  }

  // No changes but values exist
  if (!hasChanges && (oldValues || newValues)) {
    return (
      <div className="space-y-3">
        <div className="text-sm font-medium">Recorded Values</div>
        <div className="rounded-md bg-muted/50 p-4">
          <pre className="whitespace-pre-wrap text-xs">
            {JSON.stringify(newValues ?? oldValues, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between"
        >
          <span className="flex items-center gap-2">
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <span>
              {hasChanges
                ? `${diffs.length} field${diffs.length === 1 ? "" : "s"} changed`
                : "View details"}
            </span>
          </span>
          {entityType && (
            <Badge variant="outline" className="ml-2">
              {entityType}
            </Badge>
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 space-y-1 divide-y rounded-md border p-4">
          {diffs.map((diff) => (
            <DiffRow
              key={diff.field}
              field={diff.field}
              oldValue={diff.oldValue}
              newValue={diff.newValue}
              type={diff.type}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

ChangeDiff.displayName = "ChangeDiff";
