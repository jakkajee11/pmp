import { z } from 'zod';

// Core Value entity types
export const CoreValueStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

export const coreValueSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  nameTh: z.string().max(255).nullable(),
  description: z.string().min(1),
  rating1Desc: z.string().min(1),
  rating2Desc: z.string().min(1),
  rating3Desc: z.string().min(1),
  rating4Desc: z.string().min(1),
  rating5Desc: z.string().min(1),
  displayOrder: z.number().int().min(0),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const createCoreValueSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  nameTh: z.string().max(255).optional(),
  description: z.string().min(1, 'Description is required'),
  rating1Desc: z.string().min(1, 'Rating 1 description is required'),
  rating2Desc: z.string().min(1, 'Rating 2 description is required'),
  rating3Desc: z.string().min(1, 'Rating 3 description is required'),
  rating4Desc: z.string().min(1, 'Rating 4 description is required'),
  rating5Desc: z.string().min(1, 'Rating 5 description is required'),
  displayOrder: z.number().int().min(0).optional().default(0),
});

export const updateCoreValueSchema = createCoreValueSchema.partial();

export const coreValueListQuerySchema = z.object({
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  sortBy: z.enum(['name', 'displayOrder', 'createdAt']).optional().default('displayOrder'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

// Core Value Rating (for evaluations)
export const coreValueRatingSchema = z.object({
  coreValueId: z.string().uuid(),
  coreValueName: z.string(),
  rating: z.number().int().min(1).max(5).nullable(),
  rating1Desc: z.string(),
  rating2Desc: z.string(),
  rating3Desc: z.string(),
  rating4Desc: z.string(),
  rating5Desc: z.string(),
  comments: z.string().nullable(),
});

// Type exports
export type CoreValue = z.infer<typeof coreValueSchema>;
export type CreateCoreValueInput = z.infer<typeof createCoreValueSchema>;
export type UpdateCoreValueInput = z.infer<typeof updateCoreValueSchema>;
export type CoreValueListQuery = z.infer<typeof coreValueListQuerySchema>;
export type CoreValueRating = z.infer<typeof coreValueRatingSchema>;

// API Response types
export interface CoreValueListResponse {
  data: CoreValue[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CoreValueWithRatings extends CoreValue {
  ratings: CoreValueRating[];
}
