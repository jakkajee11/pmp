"use client";

/**
 * Cycle Form Component
 *
 * Form for creating and editing review cycles.
 */

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { CreateCycleRequest, CycleType, CYCLE_TYPE_LABELS } from "../types";
import { DeadlineConfig } from "./deadline-config";
import { WeightedScoreConfig } from "./weighted-score-config";

interface CycleFormProps {
  initialData?: Partial<CreateCycleRequest>;
  onSubmit: (data: CreateCycleRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  mode: "create" | "edit";
}

interface FormData {
  name: string;
  type: CycleType;
  startDate: string;
  endDate: string;
  selfEvalDeadline: string;
  managerReviewDeadline: string;
  gracePeriodDays: number;
  weightsConfig: {
    kpi: number;
    coreValues: number;
  };
}

export function CycleForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  mode,
}: CycleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(createCycleSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      type: initialData?.type ?? "MID_YEAR",
      startDate: initialData?.startDate ?? "",
      endDate: initialData?.endDate ?? "",
      selfEvalDeadline: initialData?.selfEvalDeadline ?? "",
      managerReviewDeadline: initialData?.managerReviewDeadline ?? "",
      gracePeriodDays: initialData?.gracePeriodDays ?? 0,
      weightsConfig: initialData?.weightsConfig ?? { kpi: 0.8, coreValues: 0.2 },
    },
  });

  const watchType = watch("type");
  const watchStartDate = watch("startDate");
  const watchEndDate = watch("endDate");
  const watchWeightsConfig = watch("weightsConfig");

  const onFormSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data as CreateCycleRequest);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-navy-900">
          {mode === "create" ? "Create Review Cycle" : "Edit Review Cycle"}
        </CardTitle>
        <CardDescription className="text-slate-600">
          {mode === "create"
            ? "Set up a new performance review cycle for your organization."
            : "Modify the review cycle details. Only draft cycles can be edited."}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onFormSubmit)}>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-navy-900">Basic Information</h3>

            <div className="space-y-2">
              <Label htmlFor="name">Cycle Name</Label>
              <Input
                id="name"
                placeholder="e.g., Mid-Year Review 2026"
                {...register("name")}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Cycle Type</Label>
              <Select
                value={watchType}
                onValueChange={(value: CycleType) => setValue("type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select cycle type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MID_YEAR">{CYCLE_TYPE_LABELS.MID_YEAR}</SelectItem>
                  <SelectItem value="YEAR_END">{CYCLE_TYPE_LABELS.YEAR_END}</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-red-500">{errors.type.message}</p>
              )}
            </div>
          </div>

          {/* Cycle Period */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-navy-900">Cycle Period</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  {...register("startDate")}
                  className={errors.startDate ? "border-red-500" : ""}
                />
                {errors.startDate && (
                  <p className="text-sm text-red-500">{errors.startDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  {...register("endDate")}
                  className={errors.endDate ? "border-red-500" : ""}
                />
                {errors.endDate && (
                  <p className="text-sm text-red-500">{errors.endDate.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Deadline Configuration */}
          <DeadlineConfig
            selfEvalDeadline={watch("selfEvalDeadline")}
            managerReviewDeadline={watch("managerReviewDeadline")}
            gracePeriodDays={watch("gracePeriodDays")}
            onSelfEvalDeadlineChange={(value) => setValue("selfEvalDeadline", value)}
            onManagerReviewDeadlineChange={(value) =>
              setValue("managerReviewDeadline", value)
            }
            onGracePeriodDaysChange={(value) => setValue("gracePeriodDays", value)}
            errors={{
              selfEvalDeadline: errors.selfEvalDeadline?.message,
              managerReviewDeadline: errors.managerReviewDeadline?.message,
            }}
          />

          {/* Weighted Score Configuration */}
          <WeightedScoreConfig
            weightsConfig={watchWeightsConfig}
            onWeightsChange={(config) => setValue("weightsConfig", config)}
          />
        </CardContent>

        <CardFooter className="flex justify-end space-x-4 border-t pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting || isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="bg-navy-700 hover:bg-navy-800"
          >
            {isSubmitting || isLoading
              ? "Saving..."
              : mode === "create"
                ? "Create Cycle"
                : "Save Changes"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

// Import schema at the bottom to avoid circular dependencies
import { CreateCycleSchema as createCycleSchema } from "../types";
