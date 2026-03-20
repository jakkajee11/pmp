'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Notification, NotificationListQuery, NotificationPreferences } from '../types';
import { notificationApi } from '../api/handlers';

interface UseNotificationsOptions {
  autoFetch?: boolean;
  pollInterval?: number;
  initialLimit?: number;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  fetchNotifications: (query?: Partial<NotificationListQuery>) => Promise<void>;
  fetchMore: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const { autoFetch = true, pollInterval = 60000, initialLimit = 20 } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  const fetchNotifications = useCallback(async (query?: Partial<NotificationListQuery>) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await notificationApi.list({
        page: query?.page ?? 1,
        limit: query?.limit ?? initialLimit,
        ...query,
      });

      if (query?.page && query.page > 1) {
        setNotifications((prev) => [...prev, ...response.data]);
      } else {
        setNotifications(response.data);
      }

      setHasMore(response.pagination.page < response.pagination.totalPages);
      setPage(query?.page ?? 1);

      // Count unread (pending) notifications
      const unread = response.data.filter((n) => n.status === 'pending').length;
      setUnreadCount(unread);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setIsLoading(false);
    }
  }, [initialLimit]);

  const fetchMore = useCallback(async () => {
    if (hasMore && !isLoading) {
      await fetchNotifications({ page: page + 1 });
    }
  }, [hasMore, isLoading, page, fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: 'sent' as const } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, status: 'sent' as const }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);

  // Initial fetch
  useEffect(() => {
    if (autoFetch) {
      fetchNotifications();
    }
  }, [autoFetch, fetchNotifications]);

  // Polling for new notifications
  useEffect(() => {
    if (!pollInterval || pollInterval <= 0) return;

    const interval = setInterval(() => {
      fetchNotifications();
    }, pollInterval);

    return () => clearInterval(interval);
  }, [pollInterval, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    hasMore,
    fetchNotifications,
    fetchMore,
    markAsRead,
    markAllAsRead,
    refresh,
  };
}

// Hook for managing notification preferences
interface UseNotificationPreferencesReturn {
  preferences: NotificationPreferences | null;
  isLoading: boolean;
  error: string | null;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
}

export function useNotificationPreferences(
  userId: string
): UseNotificationPreferencesReturn {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/notifications/preferences?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch preferences');
      const data = await response.json();
      setPreferences(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch preferences');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const updatePreferences = useCallback(async (prefs: Partial<NotificationPreferences>) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...preferences, ...prefs, userId }),
      });

      if (!response.ok) throw new Error('Failed to update preferences');
      const data = await response.json();
      setPreferences(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preferences');
    } finally {
      setIsLoading(false);
    }
  }, [userId, preferences]);

  useEffect(() => {
    if (userId) {
      fetchPreferences();
    }
  }, [userId, fetchPreferences]);

  return {
    preferences,
    isLoading,
    error,
    updatePreferences,
  };
}
