/**
 * User Form Component
 *
 * Form for creating and editing user accounts.
 * Uses Professional Corporate design with navy blue accents.
 */

"use client";

import * as React from "react";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Separator } from "@/shared/components/ui/separator";
import {
  UserRole,
  CreateUserRequest,
  USER_ROLES,
  ROLE_LABELS,
  ROLE_LABELS_TH,
} from "../types";
import { cn } from "@/shared/lib/utils";

interface UserFormProps {
  mode: "create" | "edit";
  initialData?: {
    id: string;
    email: string;
    name: string;
    nameTh?: string;
    role: UserRole;
    managerId?: string;
    departmentId?: string;
  };
  managers: Array<{ id: string; name: string; email: string }>;
  departments: Array<{ id: string; name: string }>;
  onSubmit: (data: CreateUserRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface FormData {
  email: string;
  name: string;
  nameTh: string;
  role: UserRole;
  managerId: string;
  departmentId: string;
}

export function UserForm({
  mode,
  initialData,
  managers,
  departments,
  onSubmit,
  onCancel,
  isLoading = false,
}: UserFormProps) {
  const [formData, setFormData] = React.useState<FormData>({
    email: initialData?.email ?? "",
    name: initialData?.name ?? "",
    nameTh: initialData?.nameTh ?? "",
    role: initialData?.role ?? "EMPLOYEE",
    managerId: initialData?.managerId ?? "",
    departmentId: initialData?.departmentId ?? "",
  });
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (mode === "create") {
      if (!formData.email) {
        newErrors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Invalid email format";
      }
    }

    if (!formData.name) {
      newErrors.name = "Name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        email: formData.email,
        name: formData.name,
        nameTh: formData.nameTh || undefined,
        role: formData.role,
        managerId: formData.managerId || undefined,
        departmentId: formData.departmentId || undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl border-slate-200 shadow-sm">
      <CardHeader className="bg-slate-50 border-b border-slate-200">
        <CardTitle className="text-lg font-semibold text-slate-900">
          {mode === "create" ? "Create New User" : "Edit User"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field (only in create mode) */}
          {mode === "create" && (
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-medium">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="user@company.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={cn(
                  "border-slate-300 focus:border-[#1e3a5f] focus:ring-[#1e3a5f]",
                  errors.email && "border-red-500"
                )}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email}</p>
              )}
            </div>
          )}

          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-700 font-medium">
                Name (English) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className={cn(
                  "border-slate-300 focus:border-[#1e3a5f] focus:ring-[#1e3a5f]",
                  errors.name && "border-red-500"
                )}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nameTh" className="text-slate-700 font-medium">
                Name (Thai)
              </Label>
              <Input
                id="nameTh"
                placeholder="ชื่อภาษาไทย"
                value={formData.nameTh}
                onChange={(e) => handleInputChange("nameTh", e.target.value)}
                className={cn(
                  "border-slate-300 focus:border-[#1e3a5f] focus:ring-[#1e3a5f]",
                  errors.nameTh && "border-red-500"
                )}
                disabled={isLoading}
              />
              {errors.nameTh && (
                <p className="text-sm text-red-600">{errors.nameTh}</p>
              )}
            </div>
          </div>

          <Separator className="bg-slate-200" />

          {/* Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="role" className="text-slate-700 font-medium">
              Role <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.role}
              onValueChange={(value) => handleInputChange("role", value as UserRole)}
              disabled={isLoading}
            >
              <SelectTrigger className="border-slate-300 focus:border-[#1e3a5f] focus:ring-[#1e3a5f]">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {USER_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    <div className="flex flex-col">
                      <span>{ROLE_LABELS[role]}</span>
                      <span className="text-xs text-slate-500">{ROLE_LABELS_TH[role]}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-red-600">{errors.role}</p>
            )}
          </div>

          {/* Manager Selection */}
          <div className="space-y-2">
            <Label htmlFor="managerId" className="text-slate-700 font-medium">
              Direct Manager
            </Label>
            <Select
              value={formData.managerId || "__none__"}
              onValueChange={(value) =>
                handleInputChange("managerId", value === "__none__" ? "" : value)
              }
              disabled={isLoading}
            >
              <SelectTrigger className="border-slate-300 focus:border-[#1e3a5f] focus:ring-[#1e3a5f]">
                <SelectValue placeholder="Select manager (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">
                  <span className="text-slate-500">No manager assigned</span>
                </SelectItem>
                {managers
                  .filter((m) => m.id !== initialData?.id)
                  .map((manager) => (
                    <SelectItem key={manager.id} value={manager.id}>
                      <div className="flex flex-col">
                        <span>{manager.name}</span>
                        <span className="text-xs text-slate-500">{manager.email}</span>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {errors.managerId && (
              <p className="text-sm text-red-600">{errors.managerId}</p>
            )}
          </div>

          {/* Department Selection */}
          <div className="space-y-2">
            <Label htmlFor="departmentId" className="text-slate-700 font-medium">
              Department
            </Label>
            <Select
              value={formData.departmentId || "__none__"}
              onValueChange={(value) =>
                handleInputChange("departmentId", value === "__none__" ? "" : value)
              }
              disabled={isLoading}
            >
              <SelectTrigger className="border-slate-300 focus:border-[#1e3a5f] focus:ring-[#1e3a5f]">
                <SelectValue placeholder="Select department (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">
                  <span className="text-slate-500">No department assigned</span>
                </SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.departmentId && (
              <p className="text-sm text-red-600">{errors.departmentId}</p>
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
                ? "Create User"
                : "Save Changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
