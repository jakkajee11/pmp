/**
 * Objectives Page Content
 *
 * Client component for viewing and managing objectives.
 * Uses Professional Corporate design with navy blue accents.
 */

"use client";

import * as React from "react";
import { Button } from "../../../shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../shared/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../shared/components/ui/select";
import { Skeleton } from "../../../shared/components/ui/skeleton";
import { Plus, Filter } from "lucide-react";
import {
  useObjectives,
  useObjectiveMutations,
  OBJECTIVE_CATEGORIES,
  CATEGORY_LABELS,
} from "../../../features/objectives";

export function ObjectivesPageContent() {
  const [selectedCategory, setSelectedCategory] = React.useState<string>("");
  const [selectedCycle, setSelectedCycle] = React.useState<string>("");
  const [showCreateForm, setShowCreateForm] = React.useState(false);

  const { objectives, isLoading, error, refetch } = useObjectives({
    filters: {
      category: selectedCategory as any || undefined,
      cycleId: selectedCycle || undefined,
    },
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Objectives</h1>
          <p className="text-slate-500 mt-1">
            Manage performance objectives for your team
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-[#1e3a5f] hover:bg-[#152d4a]"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Objective
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="w-48">
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="border-slate-300">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Categories</SelectItem>
                  {OBJECTIVE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-48">
              <Select
                value={selectedCycle}
                onValueChange={setSelectedCycle}
              >
                <SelectTrigger className="border-slate-300">
                  <SelectValue placeholder="All Cycles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Cycles</SelectItem>
                  {/* Cycles would be loaded dynamically */}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedCategory("");
                setSelectedCycle("");
              }}
              className="border-slate-300"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Objectives List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="border-slate-200">
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <p className="text-red-600">{error.message}</p>
            <Button variant="outline" onClick={refetch} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : objectives.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="p-12 text-center">
            <p className="text-slate-500 mb-4">No objectives found</p>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-[#1e3a5f] hover:bg-[#152d4a]"
            >
              Create your first objective
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Objective cards would be rendered here */}
          {objectives.map((objective) => (
            <Card key={objective.id} className="border-slate-200 hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <h3 className="font-medium text-slate-900 line-clamp-2">
                  {objective.title}
                </h3>
                <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                  {objective.description}
                </p>
                <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
                  <span>{CATEGORY_LABELS[objective.category as keyof typeof CATEGORY_LABELS]}</span>
                  <span>•</span>
                  <span>{objective.timeline}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
