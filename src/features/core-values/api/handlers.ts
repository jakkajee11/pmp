import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/lib/db';
import { auth } from '@/features/auth/api/session';
import {
  coreValueSchema,
  createCoreValueSchema,
  updateCoreValueSchema,
  coreValueListQuerySchema,
  type CoreValue,
  type CreateCoreValueInput,
  type UpdateCoreValueInput,
  type CoreValueListResponse,
} from '../types';
import { successResponse, errorResponse } from '@/shared/api/response';
import { requireRole } from '@/shared/api/middleware';

// API client for client-side usage
export const coreValueApi = {
  async list(query?: {
    isActive?: boolean;
    page?: number;
    limit?: number;
    sortBy?: 'name' | 'displayOrder' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
  }): Promise<CoreValueListResponse> {
    const params = new URLSearchParams();
    if (query?.isActive !== undefined) params.set('isActive', String(query.isActive));
    if (query?.page) params.set('page', String(query.page));
    if (query?.limit) params.set('limit', String(query.limit));
    if (query?.sortBy) params.set('sortBy', query.sortBy);
    if (query?.sortOrder) params.set('sortOrder', query.sortOrder);

    const response = await fetch(`/api/core-values?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch core values');
    return response.json();
  },

  async create(data: CreateCoreValueInput): Promise<CoreValue> {
    const response = await fetch('/api/core-values', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create core value');
    return response.json();
  },

  async update(id: string, data: UpdateCoreValueInput): Promise<CoreValue> {
    const response = await fetch(`/api/core-values/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update core value');
    return response.json();
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`/api/core-values/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete core value');
  },

  async get(id: string): Promise<CoreValue> {
    const response = await fetch(`/api/core-values/${id}`);
    if (!response.ok) throw new Error('Failed to fetch core value');
    return response.json();
  },
};

// GET /api/core-values - List core values
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return errorResponse('Unauthorized', 401);
    }

    const { searchParams } = new URL(request.url);
    const query = coreValueListQuerySchema.parse({
      isActive: searchParams.get('isActive') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    });

    const where = {
      ...(query.isActive !== undefined && { isActive: query.isActive }),
    };

    const [total, data] = await Promise.all([
      db.coreValue.count({ where }),
      db.coreValue.findMany({
        where,
        orderBy: { [query.sortBy]: query.sortOrder },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
    ]);

    const response: CoreValueListResponse = {
      data: data.map((cv) => coreValueSchema.parse(cv)),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };

    return successResponse(response);
  } catch (error) {
    console.error('Error fetching core values:', error);
    return errorResponse('Failed to fetch core values', 500);
  }
}

// POST /api/core-values - Create core value
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return errorResponse('Unauthorized', 401);
    }

    // Only HR Admin and Super Admin can create core values
    const roleCheck = requireRole(session.user, ['hr_admin', 'super_admin']);
    if (!roleCheck.allowed) {
      return errorResponse('Forbidden: Insufficient permissions', 403);
    }

    const body = await request.json();
    const data = createCoreValueSchema.parse(body);

    // Get the next display order if not specified
    let displayOrder = data.displayOrder;
    if (displayOrder === undefined) {
      const maxOrder = await db.coreValue.aggregate({
        _max: { displayOrder: true },
      });
      displayOrder = (maxOrder._max.displayOrder ?? -1) + 1;
    }

    const coreValue = await db.coreValue.create({
      data: {
        ...data,
        displayOrder,
        isActive: true,
      },
    });

    return successResponse(coreValueSchema.parse(coreValue), 201);
  } catch (error) {
    console.error('Error creating core value:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to create core value',
      400
    );
  }
}
