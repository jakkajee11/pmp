import { NextRequest } from 'next/server';
import { db } from '@/shared/lib/db';
import { auth } from '@/features/auth/api/session';
import { coreValueSchema, updateCoreValueSchema } from '../types';
import { successResponse, errorResponse } from '@/shared/api/response';
import { requireRole } from '@/shared/api/middleware';

// GET /api/core-values/[id] - Get single core value
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return errorResponse('Unauthorized', 401);
    }

    const { id } = await params;
    const coreValue = await db.coreValue.findUnique({
      where: { id },
    });

    if (!coreValue) {
      return errorResponse('Core value not found', 404);
    }

    return successResponse(coreValueSchema.parse(coreValue));
  } catch (error) {
    console.error('Error fetching core value:', error);
    return errorResponse('Failed to fetch core value', 500);
  }
}

// PATCH /api/core-values/[id] - Update core value
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return errorResponse('Unauthorized', 401);
    }

    const roleCheck = requireRole(session.user, ['hr_admin', 'super_admin']);
    if (!roleCheck.allowed) {
      return errorResponse('Forbidden: Insufficient permissions', 403);
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateCoreValueSchema.parse(body);

    const coreValue = await db.coreValue.update({
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
    const session = await auth();
    if (!session?.user) {
      return errorResponse('Unauthorized', 401);
    }

    const roleCheck = requireRole(session.user, ['hr_admin', 'super_admin']);
    if (!roleCheck.allowed) {
      return errorResponse('Forbidden: Insufficient permissions', 403);
    }

    const { id } = await params;

    // Check if core value is used in any evaluations
    const evaluationsCount = await db.evaluation.count({
      where: { coreValueId: id },
    });

    if (evaluationsCount > 0) {
      // Soft delete by deactivating instead
      await db.coreValue.update({
        where: { id },
        data: { isActive: false, updatedAt: new Date() },
      });
      return successResponse({
        message: 'Core value deactivated (used in existing evaluations)',
      });
    }

    await db.coreValue.delete({
      where: { id },
    });

    return successResponse({ message: 'Core value deleted successfully' });
  } catch (error) {
    console.error('Error deleting core value:', error);
    return errorResponse('Failed to delete core value', 500);
  }
}
