import { NextRequest } from 'next/server';
import { prisma as db } from '@/shared/lib/db';
import { requireAuth, hasAnyRole, type Role } from '@/shared/api/middleware';
import {
  notificationSchema,
  createNotificationSchema,
  notificationListQuerySchema,
  type Notification,
  type CreateNotificationInput,
  type NotificationListResponse,
} from '../types';
import { successResponse, errorResponse, unauthorizedResponse } from '@/shared/api/response';
import { notificationQueue } from './queue';

// API client for client-side usage
export const notificationApi = {
  async list(query?: {
    type?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<NotificationListResponse> {
    const params = new URLSearchParams();
    if (query?.type) params.set('type', query.type);
    if (query?.status) params.set('status', query.status);
    if (query?.page) params.set('page', String(query.page));
    if (query?.limit) params.set('limit', String(query.limit));

    const response = await fetch(`/api/notifications?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch notifications');
    return response.json();
  },

  async create(data: CreateNotificationInput): Promise<Notification> {
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create notification');
    return response.json();
  },

  async markAsRead(id: string): Promise<Notification> {
    const response = await fetch(`/api/notifications/${id}/read`, {
      method: 'PATCH',
    });
    if (!response.ok) throw new Error('Failed to mark notification as read');
    return response.json();
  },

  async markAllAsRead(): Promise<void> {
    const response = await fetch('/api/notifications/read-all', {
      method: 'PATCH',
    });
    if (!response.ok) throw new Error('Failed to mark all notifications as read');
  },

  async getUnreadCount(): Promise<{ count: number }> {
    const response = await fetch('/api/notifications/unread-count');
    if (!response.ok) throw new Error('Failed to get unread count');
    return response.json();
  },
};

// GET /api/notifications - List notifications
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    const userId = auth.userId;
    const userRole = auth.role;

    const { searchParams } = new URL(request.url);
    const query = notificationListQuerySchema.parse({
      type: searchParams.get('type') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      channel: searchParams.get('channel') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    });

    // Regular users can only see their own notifications
    // HR/Admin can see all notifications
    const filterUserId = hasAnyRole(userRole, ['HR_ADMIN', 'SUPER_ADMIN', 'HR_STAFF'] as Role[])
      ? query.userId
      : userId;

    const where = {
      ...(filterUserId && { userId: filterUserId }),
      ...(query.type && { type: query.type }),
      ...(query.status && { status: query.status }),
      ...(query.channel && { channel: query.channel }),
    };

    const [total, data] = await Promise.all([
      db.notification.count({ where }),
      db.notification.findMany({
        where,
        orderBy: { [query.sortBy]: query.sortOrder },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
    ]);

    const response: NotificationListResponse = {
      data: data.map((n: { id: string; userId: string; type: string; channel: string; subject: string; message: string; status: string; sentAt: Date | null; retryCount: number; errorMessage: string | null; createdAt: Date }) => notificationSchema.parse(n)),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };

    return successResponse(response);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }
    console.error('Error fetching notifications:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch notifications', 500);
  }
}

// POST /api/notifications - Create notification
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();

    // Only HR Admin and Super Admin can create notifications directly
    if (!hasAnyRole(auth.role, ['HR_ADMIN', 'SUPER_ADMIN'] as Role[])) {
      return errorResponse('FORBIDDEN', 'Insufficient permissions', 403);
    }

    const body = await request.json();
    const data = createNotificationSchema.parse(body);

    // Create notification in database
    const notification = await db.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        channel: data.channel,
        subject: data.subject,
        message: data.message,
        status: 'pending',
        retryCount: 0,
      },
    });

    // Add to processing queue
    await notificationQueue.enqueue(notificationSchema.parse(notification));

    return successResponse(notificationSchema.parse(notification), 201);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }
    console.error('Error creating notification:', error);
    return errorResponse(
      'VALIDATION_ERROR',
      error instanceof Error ? error.message : 'Failed to create notification',
      400
    );
  }
}

// Helper function to create notification programmatically
export async function createNotification(
  input: CreateNotificationInput
): Promise<Notification> {
  const notification = await db.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      channel: input.channel,
      subject: input.subject,
      message: input.message,
      status: 'pending',
      retryCount: 0,
    },
  });

  const parsed = notificationSchema.parse(notification);
  await notificationQueue.enqueue(parsed);

  return parsed;
}

// Batch create notifications for multiple users
export async function createNotifications(
  inputs: CreateNotificationInput[]
): Promise<Notification[]> {
  await db.notification.createMany({
    data: inputs.map((input) => ({
      userId: input.userId,
      type: input.type,
      channel: input.channel,
      subject: input.subject,
      message: input.message,
      status: 'pending' as const,
      retryCount: 0,
    })),
    skipDuplicates: true,
  });

  // Fetch created notifications and enqueue them
  const created = await db.notification.findMany({
    where: {
      userId: { in: inputs.map((i) => i.userId) },
      status: 'pending',
    },
    orderBy: { createdAt: 'desc' },
    take: inputs.length,
  });

  const parsedNotifications = created.map((n: { id: string; userId: string; type: string; channel: string; subject: string; message: string; status: string; sentAt: Date | null; retryCount: number; errorMessage: string | null; createdAt: Date }) => notificationSchema.parse(n));
  for (const notification of parsedNotifications) {
    await notificationQueue.enqueue(notification);
  }

  return parsedNotifications;
}

// Get unread count for current user
export async function getUnreadCount(userId: string): Promise<number> {
  return db.notification.count({
    where: {
      userId,
      status: 'pending',
    },
  });
}
