/**
 * Organization Chart Page
 *
 * Displays interactive organization hierarchy visualization.
 */

"use client";

import * as React from "react";
import { OrgTree } from "../../../features/org-chart/components/org-tree";
import { useOrgData } from "../../../features/org-chart/hooks/use-org-data";
import { Card, CardContent, CardHeader, CardTitle } from "../../../shared/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../shared/components/ui/select";

export default function OrgChartPage() {
  const [selectedDepartment, setSelectedDepartment] = React.useState<string>("all");

  // Mock departments (would be fetched in real app)
  const departments = [
    { id: "all", name: "All Departments" },
    { id: "1", name: "Engineering" },
    { id: "2", name: "Human Resources" },
    { id: "3", name: "Marketing" },
    { id: "4", name: "Sales" },
  ];

  const handleNodeClick = (userId: string) => {
    console.log("Clicked user:", userId);
    // Could navigate to user detail or show modal
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Organization Chart</h1>
          <p className="text-slate-600 mt-1">
            Visualize the organizational hierarchy and reporting structure
          </p>
        </div>

        {/* Department Filter */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600">Department:</span>
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-48 border-slate-300">
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Org Chart */}
      <OrgTree
        departmentId={selectedDepartment === "all" ? undefined : selectedDepartment}
        onNodeClick={handleNodeClick}
        className="h-[700px]"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">--</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Departments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">{departments.length - 1}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Managers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">--</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Avg Team Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">--</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
