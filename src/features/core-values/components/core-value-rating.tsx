'use client';

import { useState } from 'react';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CoreValueRating } from '../types';

interface CoreValueRatingProps {
  coreValue: CoreValueRating;
  onRatingChange: (coreValueId: string, rating: number) => void;
  onCommentsChange: (coreValueId: string, comments: string) => void;
  readOnly?: boolean;
  showRatingDescriptions?: boolean;
}

const ratingLabels = [
  { value: 1, label: '1', color: 'bg-red-500' },
  { value: 2, label: '2', color: 'bg-orange-500' },
  { value: 3, label: '3', color: 'bg-yellow-500' },
  { value: 4, label: '4', color: 'bg-lime-500' },
  { value: 5, label: '5', color: 'bg-green-500' },
];

export function CoreValueRating({
  coreValue,
  onRatingChange,
  onCommentsChange,
  readOnly = false,
  showRatingDescriptions = true,
}: CoreValueRatingProps) {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  const getRatingDescription = (rating: number): string => {
    switch (rating) {
      case 1:
        return coreValue.rating1Desc;
      case 2:
        return coreValue.rating2Desc;
      case 3:
        return coreValue.rating3Desc;
      case 4:
        return coreValue.rating4Desc;
      case 5:
        return coreValue.rating5Desc;
      default:
        return '';
    }
  };

  const currentRating = hoveredRating ?? coreValue.rating;

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 p-4">
      {/* Core Value Name */}
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-[#1e3a5f]">{coreValue.coreValueName}</h4>
        {coreValue.rating && (
          <Badge
            variant="outline"
            className={cn(
              'border-slate-300',
              coreValue.rating >= 4 && 'border-green-500 text-green-700',
              coreValue.rating === 3 && 'border-yellow-500 text-yellow-700',
              coreValue.rating <= 2 && 'border-red-500 text-red-700'
            )}
          >
            Rating: {coreValue.rating}
          </Badge>
        )}
      </div>

      {/* Rating Selector */}
      <div className="space-y-2">
        <Label className="text-sm text-slate-600">Select Rating</Label>
        <div className="flex gap-2">
          {ratingLabels.map(({ value, label, color }) => (
            <button
              key={value}
              type="button"
              disabled={readOnly}
              onClick={() => !readOnly && onRatingChange(coreValue.coreValueId, value)}
              onMouseEnter={() => !readOnly && setHoveredRating(value)}
              onMouseLeave={() => setHoveredRating(null)}
              className={cn(
                'h-10 w-10 rounded-full font-medium transition-all',
                'flex items-center justify-center text-white',
                readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110',
                (coreValue.rating ?? 0) >= value || (hoveredRating ?? 0) >= value
                  ? color
                  : 'bg-slate-200 text-slate-500'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Rating Description */}
        {showRatingDescriptions && currentRating && (
          <div className="mt-2 rounded-md bg-slate-50 p-3 text-sm text-slate-700">
            <span className="font-medium">Rating {currentRating}:</span>{' '}
            {getRatingDescription(currentRating)}
          </div>
        )}
      </div>

      {/* Comments */}
      <div className="space-y-2">
        <Label htmlFor={`comments-${coreValue.coreValueId}`} className="text-sm text-slate-600">
          Comments (Optional)
        </Label>
        <Textarea
          id={`comments-${coreValue.coreValueId}`}
          value={coreValue.comments ?? ''}
          onChange={(e) => onCommentsChange(coreValue.coreValueId, e.target.value)}
          placeholder="Add any specific observations or feedback..."
          rows={3}
          disabled={readOnly}
          className={readOnly ? 'bg-slate-50' : ''}
        />
      </div>
    </div>
  );
}
