"use client";

/**
 * Weighted Score Configuration Component
 *
 * Configure KPI and Core Values weights for final score calculation.
 */

import React from "react";
import { Label } from "../../../shared/components/ui/label";
import { Slider } from "../../../shared/components/ui/slider";
import { WeightsConfig } from "../types";

interface WeightedScoreConfigProps {
  weightsConfig: WeightsConfig;
  onWeightsChange: (config: WeightsConfig) => void;
}

export function WeightedScoreConfig({
  weightsConfig,
  onWeightsChange,
}: WeightedScoreConfigProps) {
  const handleKpiChange = (value: number[]) => {
    const kpiWeight = value[0] / 100;
    onWeightsChange({
      kpi: Math.round(kpiWeight * 100) / 100,
      coreValues: Math.round((1 - kpiWeight) * 100) / 100,
    });
  };

  const kpiPercentage = Math.round(weightsConfig.kpi * 100);
  const coreValuesPercentage = Math.round(weightsConfig.coreValues * 100);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-navy-900">Weighted Score Configuration</h3>

      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>KPI Weight</Label>
            <span className="text-sm font-medium text-navy-900">{kpiPercentage}%</span>
          </div>
          <Slider
            min={0}
            max={100}
            step={5}
            value={[kpiPercentage]}
            onValueChange={handleKpiChange}
            className="w-full"
          />
          <p className="text-xs text-slate-500">
            Weight applied to performance objectives (KPIs) in the final score.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Core Values Weight</Label>
            <span className="text-sm font-medium text-navy-900">
              {coreValuesPercentage}%
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-slate-600 h-2 rounded-full transition-all"
              style={{ width: `${coreValuesPercentage}%` }}
            />
          </div>
          <p className="text-xs text-slate-500">
            Weight applied to core values assessment in the final score.
          </p>
        </div>

        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <h4 className="text-sm font-medium text-navy-900 mb-2">Final Score Formula</h4>
          <code className="text-sm text-slate-600">
            Final Score = (KPI Average × {kpiPercentage}%) + (Core Values Average × {coreValuesPercentage}%)
          </code>
        </div>
      </div>
    </div>
  );
}
