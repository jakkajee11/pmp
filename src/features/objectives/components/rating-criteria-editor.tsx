/**
 * Rating Criteria Editor Component
 *
 * Editor for the 5-point rating scale criteria.
 * Uses Professional Corporate design with navy blue accents.
 */

"use client";

import * as React from "react";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { cn } from "@/shared/lib/utils";

interface RatingCriteriaEditorProps {
  values: {
    rating1: string;
    rating2: string;
    rating3: string;
    rating4: string;
    rating5: string;
  };
  onChange: (rating: number, description: string) => void;
  disabled?: boolean;
}

const RATING_CONFIG = [
  { level: 1, label: "1 - Below Expectations", description: "Did not meet expectations", color: "bg-red-100 text-red-800 border-red-200" },
  { level: 2, label: "2 - Partially Met", description: "Partially met expectations", color: "bg-orange-100 text-orange-800 border-orange-200" },
  { level: 3, label: "3 - Met Expectations", description: "Met all expectations", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { level: 4, label: "4 - Exceeded", description: "Exceeded expectations", color: "bg-lime-100 text-lime-800 border-lime-200" },
  { level: 5, label: "5 - Outstanding", description: "Far exceeded expectations", color: "bg-green-100 text-green-800 border-green-200" },
];

export function RatingCriteriaEditor({
  values,
  onChange,
  disabled = false,
}: RatingCriteriaEditorProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Define the criteria for each rating level. This helps employees understand expectations
        and enables consistent evaluation.
      </p>

      <div className="space-y-4">
        {RATING_CONFIG.map((config) => {
          const value = values[`rating${config.level}` as keyof typeof values];
          const error = !value;

          return (
            <div key={config.level} className="space-y-2">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold border",
                    config.color
                  )}
                >
                  {config.level}
                </div>
                <Label
                  htmlFor={`rating-${config.level}`}
                  className="text-slate-700 font-medium"
                >
                  {config.label}
                </Label>
              </div>
              <Textarea
                id={`rating-${config.level}`}
                placeholder={`Describe what "${config.description}" looks like for this objective...`}
                value={value}
                onChange={(e) => onChange(config.level, e.target.value)}
                disabled={disabled}
                className={cn(
                  "min-h-[80px] ml-10 border-slate-300 focus:border-[#1e3a5f] focus:ring-[#1e3a5f]",
                  error && "border-red-300"
                )}
              />
            </div>
          );
        })}
      </div>

      {/* Rating Scale Legend */}
      <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <h4 className="text-sm font-medium text-slate-700 mb-2">Rating Scale Guide</h4>
        <div className="grid grid-cols-5 gap-2 text-xs">
          {RATING_CONFIG.map((config) => (
            <div
              key={config.level}
              className={cn("p-2 rounded text-center border", config.color)}
            >
              <div className="font-bold">{config.level}</div>
              <div className="mt-1">{config.description.split(" ")[0]}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
