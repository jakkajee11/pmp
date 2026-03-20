import { NextRequest } from 'next/server';
import { prisma } from '@/shared/lib/db';
import { coreValueSchema, updateCoreValueSchema } from '../../types';
import { successResponse, errorResponse } from '@/shared/api/response';
import { requireAuth, requireAnyRole, Role } from '@/shared/api/middleware';

// GET /api/core-values/[id] - Get single core value
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();

    const { id } = await params;
    const coreValue = await prisma.coreValue.findUnique({
      where: { id },
    });

    if (!coreValue) {
      return errorResponse('NOT_FOUND', 'Core value not found', 404);
    }

    return successResponse(coreValueSchema.parse(coreValue));
  } catch (error) {
    console.error('Error fetching core value:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch core value', 500);
  }
}

// PATCH /api/core-values/[id] - Update core value
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAnyRole(['HR_ADMIN', 'SUPER_ADMIN'] as Role[]);

    const { id } = await params;
    const body = await request.json();
    const data = updateCoreValueSchema.parse(body);

    const coreValue = await prisma.coreValue.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    return successResponse(coreValueSchema.parse(coreValue));
  } catch (error) {
    console.error('Error updating core value:', error);
    return errorResponse(
      'VALIDATION_ERROR',
      error instanceof Error ? error.message : 'Failed to update core value',
      400
    );
  }
}

// DELETE /api/core-values/[id] - Delete core value
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAnyRole(['HR_ADMIN', 'SUPER_ADMIN'] as Role[]);

    const { id } = await params;

    // Check if core value is used in any evaluations
    const evaluationsCount = await prisma.coreValueRating.count({
      where: { coreValueId: id },
    });

    if (evaluationsCount > 0) {
      // Soft delete by deactivating instead
      await prisma.coreValue.update({
        where: { id },
        data: { isActive: false, updatedAt: new Date() },
      });
      return successResponse({
        message: 'Core value deactivated (used in existing evaluations)',
      });
    }

    await prisma.coreValue.delete({
      where: { id },
    });

    return successResponse({ message: 'Core value deleted successfully' });
  } catch (error) {
    console.error('Error deleting core value:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to delete core value', 500);
  }
}
