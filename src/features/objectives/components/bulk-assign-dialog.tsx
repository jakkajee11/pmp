/**
 * Bulk Assign Dialog Component
 *
 * Dialog for bulk assigning objectives to multiple employees.
 * Uses Professional Corporate design with navy blue accents.
 */

"use client";

import * as React from "react";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Badge } from "@/shared/components/ui/badge";
import {
  BulkAssignRequest,
  ObjectiveCategory,
  OBJECTIVE_CATEGORIES,
  CATEGORY_LABELS,
  TIMELINE_OPTIONS,
} from "../types";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { RatingCriteriaEditor } from "./rating-criteria-editor";
import { cn } from "@/shared/lib/utils";
import { Search, User, Check } from "lucide-react";

interface Employee {
  id: string;
  name: string;
  email: string;
  department?: string;
}

interface BulkAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  cycles: Array<{ id: string; name: string; status: string }>;
  onSubmit: (data: BulkAssignRequest) => Promise<void>;
  isLoading?: boolean;
}

interface FormData {
  title: string;
  description: string;
  keyResults: string;
  category: ObjectiveCategory;
  timeline: string;
  cycleId: string;
  selectedEmployees: string[];
  rating1Desc: string;
  rating2Desc: string;
  rating3Desc: string;
  rating4Desc: string;
  rating5Desc: string;
}

export function BulkAssignDialog({
  open,
  onOpenChange,
  employees,
  cycles,
  onSubmit,
  isLoading = false,
}: BulkAssignDialogProps) {
  const [step, setStep] = React.useState(1);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [formData, setFormData] = React.useState<FormData>({
    title: "",
    description: "",
    keyResults: "",
    category: "DELIVERY",
    timeline: "",
    cycleId: "",
    selectedEmployees: [],
    rating1Desc: "",
    rating2Desc: "",
    rating3Desc: "",
    rating4Desc: "",
    rating5Desc: "",
  });
  const [errors, setErrors] = React.useState<Partial<Record<string, string>>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const activeCycles = cycles.filter((c) => c.status === "ACTIVE" || c.status === "DRAFT");

  const filteredEmployees = React.useMemo(() => {
    if (!searchQuery) return employees;
    const query = searchQuery.toLowerCase();
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(query) ||
        e.email.toLowerCase().includes(query) ||
        e.department?.toLowerCase().includes(query)
    );
  }, [employees, searchQuery]);

  const handleInputChange = (field: keyof FormData, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleRatingChange = (rating: number, description: string) => {
    setFormData((prev) => ({ ...prev, [`rating${rating}Desc` as keyof FormData]: description }));
  };

  const toggleEmployee = (employeeId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedEmployees: prev.selectedEmployees.includes(employeeId)
        ? prev.selectedEmployees.filter((id) => id !== employeeId)
        : [...prev.selectedEmployees, employeeId],
    }));
  };

  const toggleAll = () => {
    if (formData.selectedEmployees.length === filteredEmployees.length) {
      setFormData((prev) => ({ ...prev, selectedEmployees: [] }));
    } else {
      setFormData((prev) => ({
        ...prev,
        selectedEmployees: filteredEmployees.map((e) => e.id),
      }));
    }
  };

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Partial<Record<string, string>> = {};

    if (currentStep === 1) {
      if (!formData.title) newErrors.title = "Title is required";
      if (!formData.description) newErrors.description = "Description is required";
      if (!formData.timeline) newErrors.timeline = "Timeline is required";
      if (!formData.cycleId) newErrors.cycleId = "Review cycle is required";
      if (!formData.rating1Desc) newErrors.rating1Desc = "Required";
      if (!formData.rating2Desc) newErrors.rating2Desc = "Required";
      if (!formData.rating3Desc) newErrors.rating3Desc = "Required";
      if (!formData.rating4Desc) newErrors.rating4Desc = "Required";
      if (!formData.rating5Desc) newErrors.rating5Desc = "Required";
    }

    if (currentStep === 2) {
      if (formData.selectedEmployees.length === 0) {
        newErrors.selectedEmployees = "Select at least one employee";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: formData.title,
        description: formData.description,
        keyResults: formData.keyResults || undefined,
        category: formData.category,
        timeline: formData.timeline,
        cycleId: formData.cycleId,
        assignedTo: formData.selectedEmployees,
        rating1Desc: formData.rating1Desc,
        rating2Desc: formData.rating2Desc,
        rating3Desc: formData.rating3Desc,
        rating4Desc: formData.rating4Desc,
        rating5Desc: formData.rating5Desc,
      });

      // Reset form
      setFormData({
        title: "",
        description: "",
        keyResults: "",
        category: "DELIVERY",
        timeline: "",
        cycleId: "",
        selectedEmployees: [],
        rating1Desc: "",
        rating2Desc: "",
        rating3Desc: "",
        rating4Desc: "",
        rating5Desc: "",
      });
      setStep(1);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
      setStep(1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-slate-900">
            Bulk Assign Objective
          </DialogTitle>
          <DialogDescription>
            Create an objective and assign it to multiple employees at once.
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 py-4 border-b border-slate-200">
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
              step >= 1 ? "bg-[#1e3a5f] text-white" : "bg-slate-100 text-slate-500"
            )}
          >
            1. Define Objective
          </div>
          <div className="h-px flex-1 bg-slate-200" />
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
              step >= 2 ? "bg-[#1e3a5f] text-white" : "bg-slate-100 text-slate-500"
            )}
          >
            2. Select Employees
          </div>
          <div className="h-px flex-1 bg-slate-200" />
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
              step >= 3 ? "bg-[#1e3a5f] text-white" : "bg-slate-100 text-slate-500"
            )}
          >
            3. Review
          </div>
        </div>

        <ScrollArea className="flex-1 -mx-6 px-6">
          {/* Step 1: Define Objective */}
          {step === 1 && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-slate-700 font-medium">
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Complete annual compliance training"
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

              <div className="space-y-2">
                <Label htmlFor="description" className="text-slate-700 font-medium">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe the objective..."
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleInputChange("category", value as ObjectiveCategory)}
                  >
                    <SelectTrigger className="border-slate-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OBJECTIVE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {CATEGORY_LABELS[cat]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">
                    Timeline <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.timeline}
                    onValueChange={(value) => handleInputChange("timeline", value)}
                  >
                    <SelectTrigger className={cn("border-slate-300", errors.timeline && "border-red-500")}>
                      <SelectValue placeholder="Select timeline" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMELINE_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 font-medium">
                  Review Cycle <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.cycleId}
                  onValueChange={(value) => handleInputChange("cycleId", value)}
                >
                  <SelectTrigger className={cn("border-slate-300", errors.cycleId && "border-red-500")}>
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
              </div>

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
            </div>
          )}

          {/* Step 2: Select Employees */}
          {step === 2 && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search employees..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-slate-300"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={toggleAll}>
                  {formData.selectedEmployees.length === filteredEmployees.length
                    ? "Deselect All"
                    : "Select All"}
                </Button>
              </div>

              {errors.selectedEmployees && (
                <p className="text-sm text-red-600">{errors.selectedEmployees}</p>
              )}

              <div className="border rounded-lg divide-y">
                {filteredEmployees.map((employee) => {
                  const isSelected = formData.selectedEmployees.includes(employee.id);
                  return (
                    <div
                      key={employee.id}
                      className={cn(
                        "flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 transition-colors",
                        isSelected && "bg-slate-50"
                      )}
                      onClick={() => toggleEmployee(employee.id)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleEmployee(employee.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900">{employee.name}</div>
                        <div className="text-sm text-slate-500">{employee.email}</div>
                      </div>
                      {employee.department && (
                        <Badge variant="secondary" className="text-xs">
                          {employee.department}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="text-sm text-slate-500">
                {formData.selectedEmployees.length} of {employees.length} employees selected
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-4 py-4">
              <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-slate-900">{formData.title}</h4>
                <p className="text-sm text-slate-600">{formData.description}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{CATEGORY_LABELS[formData.category]}</Badge>
                  <Badge variant="outline">{formData.timeline}</Badge>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-slate-700">Selected Employees</h4>
                <div className="flex flex-wrap gap-2">
                  {formData.selectedEmployees.map((id) => {
                    const employee = employees.find((e) => e.id === id);
                    return employee ? (
                      <Badge key={id} variant="secondary" className="gap-1">
                        <User className="h-3 w-3" />
                        {employee.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                This will create {formData.selectedEmployees.length} objective(s). Employees who
                already have an objective with this title in the selected cycle will be skipped.
              </div>
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="border-t pt-4">
          {step > 1 && (
            <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
              Back
            </Button>
          )}
          {step < 3 ? (
            <Button onClick={handleNext} className="bg-[#1e3a5f] hover:bg-[#152d4a]">
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-[#1e3a5f] hover:bg-[#152d4a]">
              {isSubmitting ? "Creating..." : `Create ${formData.selectedEmployees.length} Objectives`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
