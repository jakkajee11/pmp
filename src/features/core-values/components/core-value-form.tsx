'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Switch } from '@/shared/components/ui/switch';
import {
  createCoreValueSchema,
  type CreateCoreValueInput,
  type CoreValue,
} from '../types';

interface CoreValueFormProps {
  initialData?: CoreValue | null;
  onSubmit: (data: CreateCoreValueInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const ratingFields = [
  { key: 'rating1Desc', label: 'Rating 1 - Needs Improvement' },
  { key: 'rating2Desc', label: 'Rating 2 - Below Expectations' },
  { key: 'rating3Desc', label: 'Rating 3 - Meets Expectations' },
  { key: 'rating4Desc', label: 'Rating 4 - Above Expectations' },
  { key: 'rating5Desc', label: 'Rating 5 - Exceeds Expectations' },
] as const;

export function CoreValueForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: CoreValueFormProps) {
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<CreateCoreValueInput>({
    resolver: zodResolver(createCoreValueSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      nameTh: initialData?.nameTh ?? '',
      description: initialData?.description ?? '',
      rating1Desc: initialData?.rating1Desc ?? '',
      rating2Desc: initialData?.rating2Desc ?? '',
      rating3Desc: initialData?.rating3Desc ?? '',
      rating4Desc: initialData?.rating4Desc ?? '',
      rating5Desc: initialData?.rating5Desc ?? '',
      displayOrder: initialData?.displayOrder ?? 0,
    },
  });

  const handleFormSubmit = async (data: CreateCoreValueInput) => {
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-[#1e3a5f]">
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name (English) *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="e.g., Integrity"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nameTh">Name (Thai)</Label>
              <Input
                id="nameTh"
                {...register('nameTh')}
                placeholder="e.g., ความซื่อสัตย์"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Describe what this core value means..."
              rows={3}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="displayOrder">Display Order</Label>
              <Input
                id="displayOrder"
                type="number"
                {...register('displayOrder', { valueAsNumber: true })}
                min={0}
              />
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
                id="isActive"
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rating Descriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-[#1e3a5f]">
            Rating Descriptions
          </CardTitle>
          <p className="text-sm text-slate-600">
            Define what each rating level means for this core value.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {ratingFields.map(({ key, label }) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key}>{label} *</Label>
              <Textarea
                id={key}
                {...register(key)}
                placeholder={`Describe behavior for ${label.toLowerCase()}...`}
                rows={2}
                className={errors[key] ? 'border-red-500' : ''}
              />
              {errors[key] && (
                <p className="text-sm text-red-500">{errors[key]?.message}</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="bg-[#1e3a5f] hover:bg-[#2d4a6f]"
        >
          {isSubmitting ? 'Saving...' : initialData ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
