/**
 * Objective Form Component
 *
 * Form for creating and editing objectives.
 * Uses Professional Corporate design with navy blue accents.
 */

"use client";

import * as React from "react";
import { Input } from "../../../shared/components/ui/input";
import { Label } from "../../../shared/components/ui/label";
import { Button } from "../../../shared/components/ui/button";
import { Textarea } from "../../../shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../shared/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "../../../shared/components/ui/card";
import { Separator } from "../../../shared/components/ui/separator";
import {
  ObjectiveCategory,
  CreateObjectiveRequest,
  OBJECTIVE_CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_LABELS_TH,
  TIMELINE_OPTIONS,
} from "../types";
import { RatingCriteriaEditor } from "./rating-criteria-editor";
import { cn } from "../../../shared/lib/utils";

interface ObjectiveFormProps {
  mode: "create" | "edit";
  initialData?: {
    id: string;
    title: string;
    description: string;
    keyResults?: string;
    category: ObjectiveCategory;
    timeline: string;
    rating1Desc: string;
    rating2Desc: string;
    rating3Desc: string;
    rating4Desc: string;
    rating5Desc: string;
  };
  assignees: Array<{ id: string; name: string; email: string }>;
  cycles: Array<{ id: string; name: string; status: string }>;
  onSubmit: (data: CreateObjectiveRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface FormData {
  title: string;
  description: string;
  keyResults: string;
  category: ObjectiveCategory;
  timeline: string;
  assignedTo: string;
  cycleId: string;
  rating1Desc: string;
  rating2Desc: string;
  rating3Desc: string;
  rating4Desc: string;
  rating5Desc: string;
}

export function ObjectiveForm({
  mode,
  initialData,
  assignees,
  cycles,
  onSubmit,
  onCancel,
  isLoading = false,
}: ObjectiveFormProps) {
  const [formData, setFormData] = React.useState<FormData>({
    title: initialData?.title ?? "",
    description: initialData?.description ?? "",
    keyResults: initialData?.keyResults ?? "",
    category: initialData?.category ?? "DELIVERY",
    timeline: initialData?.timeline ?? "",
    assignedTo: "",
    cycleId: "",
    rating1Desc: initialData?.rating1Desc ?? "",
    rating2Desc: initialData?.rating2Desc ?? "",
    rating3Desc: initialData?.rating3Desc ?? "",
    rating4Desc: initialData?.rating4Desc ?? "",
    rating5Desc: initialData?.rating5Desc ?? "",
  });
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleRatingChange = (rating: number, description: string) => {
    setFormData((prev) => ({ ...prev, [`rating${rating}Desc` as keyof FormData]: description }));
    setErrors((prev) => ({ ...prev, [`rating${rating}Desc` as keyof FormData]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.title) {
      newErrors.title = "Title is required";
    } else if (formData.title.length > 500) {
      newErrors.title = "Title must be less than 500 characters";
    }

    if (!formData.description) {
      newErrors.description = "Description is required";
    }

    if (!formData.timeline) {
      newErrors.timeline = "Timeline is required";
    }

    if (mode === "create") {
      if (!formData.assignedTo) {
        newErrors.assignedTo = "Employee is required";
      }
      if (!formData.cycleId) {
        newErrors.cycleId = "Review cycle is required";
      }
    }

    if (!formData.rating1Desc) newErrors.rating1Desc = "Rating 1 description is required";
    if (!formData.rating2Desc) newErrors.rating2Desc = "Rating 2 description is required";
    if (!formData.rating3Desc) newErrors.rating3Desc = "Rating 3 description is required";
    if (!formData.rating4Desc) newErrors.rating4Desc = "Rating 4 description is required";
    if (!formData.rating5Desc) newErrors.rating5Desc = "Rating 5 description is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: formData.title,
        description: formData.description,
        keyResults: formData.keyResults || undefined,
        category: formData.category,
        timeline: formData.timeline,
        assignedTo: formData.assignedTo,
        cycleId: formData.cycleId,
        rating1Desc: formData.rating1Desc,
        rating2Desc: formData.rating2Desc,
        rating3Desc: formData.rating3Desc,
        rating4Desc: formData.rating4Desc,
        rating5Desc: formData.rating5Desc,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeCycles = cycles.filter((c) => c.status === "ACTIVE" || c.status === "DRAFT");

  return (
    <Card className="w-full max-w-4xl border-slate-200 shadow-sm">
      <CardHeader className="bg-slate-50 border-b border-slate-200">
        <CardTitle className="text-lg font-semibold text-slate-900">
          {mode === "create" ? "Create New Objective" : "Edit Objective"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-slate-700 font-medium">
              Objective Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g., Complete project deliverable"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              className={cn(
                "border-slate-300 focus:border-[#1e3a5f] focus:ring-[#1e3a5f]",
                errors.title && "border-red-500"
              )}
              disabled={isLoading}
            />
            {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-slate-700 font-medium">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Describe the objective in detail..."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className={cn(
                "min-h-[100px] border-slate-300 focus:border-[#1e3a5f] focus:ring-[#1e3a5f]",
                errors.description && "border-red-500"
              )}
              disabled={isLoading}
            />
            {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
          </div>

          {/* Key Results */}
          <div className="space-y-2">
            <Label htmlFor="keyResults" className="text-slate-700 font-medium">
              Key Results / Success Criteria
            </Label>
            <Textarea
              id="keyResults"
              placeholder="Define measurable outcomes..."
              value={formData.keyResults}
              onChange={(e) => handleInputChange("keyResults", e.target.value)}
              className="min-h-[80px] border-slate-300 focus:border-[#1e3a5f] focus:ring-[#1e3a5f]"
              disabled={isLoading}
            />
          </div>

          <Separator className="bg-slate-200" />

          {/* Category and Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category" className="text-slate-700 font-medium">
                Category <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange("category", value as ObjectiveCategory)}
                disabled={isLoading}
              >
                <SelectTrigger className="border-slate-300 focus:border-[#1e3a5f] focus:ring-[#1e3a5f]">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {OBJECTIVE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      <div className="flex flex-col">
                        <span>{CATEGORY_LABELS[category]}</span>
                        <span className="text-xs text-slate-500">{CATEGORY_LABELS_TH[category]}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-sm text-red-600">{errors.category}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeline" className="text-slate-700 font-medium">
                Timeline <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.timeline}
                onValueChange={(value) => handleInputChange("timeline", value)}
                disabled={isLoading}
              >
                <SelectTrigger className="border-slate-300 focus:border-[#1e3a5f] focus:ring-[#1e3a5f]">
                  <SelectValue placeholder="Select timeline" />
                </SelectTrigger>
                <SelectContent>
                  {TIMELINE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.timeline && <p className="text-sm text-red-600">{errors.timeline}</p>}
            </div>
          </div>

          {/* Assignee and Cycle (create mode only) */}
          {mode === "create" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assignedTo" className="text-slate-700 font-medium">
                  Assign to Employee <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.assignedTo}
                  onValueChange={(value) => handleInputChange("assignedTo", value)}
                  disabled={isLoading}
                >
                  <SelectTrigger className="border-slate-300 focus:border-[#1e3a5f] focus:ring-[#1e3a5f]">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {assignees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        <div className="flex flex-col">
                          <span>{employee.name}</span>
                          <span className="text-xs text-slate-500">{employee.email}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.assignedTo && <p className="text-sm text-red-600">{errors.assignedTo}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cycleId" className="text-slate-700 font-medium">
                  Review Cycle <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.cycleId}
                  onValueChange={(value) => handleInputChange("cycleId", value)}
                  disabled={isLoading}
                >
                  <SelectTrigger className="border-slate-300 focus:border-[#1e3a5f] focus:ring-[#1e3a5f]">
                    <SelectValue placeholder="Select review cycle" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeCycles.map((cycle) => (
                      <SelectItem key={cycle.id} value={cycle.id}>
                        {cycle.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.cycleId && <p className="text-sm text-red-600">{errors.cycleId}</p>}
              </div>
            </div>
          )}

          <Separator className="bg-slate-200" />

          {/* Rating Criteria */}
          <div className="space-y-4">
            <Label className="text-slate-700 font-medium text-base">
              Rating Criteria <span className="text-red-500">*</span>
            </Label>
            <RatingCriteriaEditor
              values={{
                rating1: formData.rating1Desc,
                rating2: formData.rating2Desc,
                rating3: formData.rating3Desc,
                rating4: formData.rating4Desc,
                rating5: formData.rating5Desc,
              }}
              onChange={handleRatingChange}
              disabled={isLoading}
            />
            {(errors.rating1Desc || errors.rating2Desc || errors.rating3Desc ||
              errors.rating4Desc || errors.rating5Desc) && (
              <p className="text-sm text-red-600">All rating descriptions are required</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading || isSubmitting}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || isSubmitting}
              className="bg-[#1e3a5f] hover:bg-[#152d4a] text-white"
            >
              {isSubmitting
                ? "Saving..."
                : mode === "create"
                ? "Create Objective"
                : "Save Changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
