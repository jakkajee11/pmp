"use client";

/**
 * Deadline Configuration Component
 *
 * Configure self-evaluation and manager review deadlines.
 */

import React from "react";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Slider } from "@/shared/components/ui/slider";

interface DeadlineConfigProps {
  selfEvalDeadline: string;
  managerReviewDeadline: string;
  gracePeriodDays: number;
  onSelfEvalDeadlineChange: (value: string) => void;
  onManagerReviewDeadlineChange: (value: string) => void;
  onGracePeriodDaysChange: (value: number) => void;
  errors?: {
    selfEvalDeadline?: string;
    managerReviewDeadline?: string;
  };
}

export function DeadlineConfig({
  selfEvalDeadline,
  managerReviewDeadline,
  gracePeriodDays,
  onSelfEvalDeadlineChange,
  onManagerReviewDeadlineChange,
  onGracePeriodDaysChange,
  errors,
}: DeadlineConfigProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-navy-900">Deadline Configuration</h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="selfEvalDeadline">Self-Evaluation Deadline</Label>
          <Input
            id="selfEvalDeadline"
            type="date"
            value={selfEvalDeadline}
            onChange={(e) => onSelfEvalDeadlineChange(e.target.value)}
            className={errors?.selfEvalDeadline ? "border-red-500" : ""}
          />
          {errors?.selfEvalDeadline && (
            <p className="text-sm text-red-500">{errors.selfEvalDeadline}</p>
          )}
          <p className="text-xs text-slate-500">
            Employees must complete self-evaluations by this date.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="managerReviewDeadline">Manager Review Deadline</Label>
          <Input
            id="managerReviewDeadline"
            type="date"
            value={managerReviewDeadline}
            onChange={(e) => onManagerReviewDeadlineChange(e.target.value)}
            className={errors?.managerReviewDeadline ? "border-red-500" : ""}
          />
          {errors?.managerReviewDeadline && (
            <p className="text-sm text-red-500">{errors.managerReviewDeadline}</p>
          )}
          <p className="text-xs text-slate-500">
            Managers must complete reviews by this date.
          </p>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="gracePeriod">Grace Period</Label>
          <span className="text-sm font-medium text-navy-900">
            {gracePeriodDays} days
          </span>
        </div>
        <Slider
          id="gracePeriod"
          min={0}
          max={30}
          step={1}
          value={[gracePeriodDays]}
          onValueChange={(value) => onGracePeriodDaysChange(value[0])}
          className="w-full"
        />
        <p className="text-xs text-slate-500">
          Additional days after the deadline for late submissions. Employees and
          managers can still submit during the grace period.
        </p>
      </div>
    </div>
  );
}
