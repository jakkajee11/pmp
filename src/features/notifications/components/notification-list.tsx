'use client';

import {
  Clock,
  CheckCircle,
  AlertCircle,
  Bell,
  Calendar,
  MessageSquare,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { Notification, NotificationTypeValue } from '../types';

// Format relative time manually to avoid date-fns dependency
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

interface NotificationListProps {
  notifications: Notification[];
  onNotificationClick?: (id: string) => void;
  className?: string;
}

// Get icon based on notification type
function getNotificationIcon(type: NotificationTypeValue) {
  switch (type) {
    case 'cycle_start':
      return <Calendar className="h-4 w-4 text-blue-500" />;
    case 'deadline_reminder':
      return <Clock className="h-4 w-4 text-orange-500" />;
    case 'submission_confirm':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'feedback_available':
      return <MessageSquare className="h-4 w-4 text-purple-500" />;
    case 'escalation':
      return <TrendingUp className="h-4 w-4 text-red-500" />;
    default:
      return <Bell className="h-4 w-4 text-gray-500" />;
  }
}

// Get notification type label
function getTypeLabel(type: NotificationTypeValue): string {
  switch (type) {
    case 'cycle_start':
      return 'Review Cycle';
    case 'deadline_reminder':
      return 'Deadline';
    case 'submission_confirm':
      return 'Confirmation';
    case 'feedback_available':
      return 'Feedback';
    case 'escalation':
      return 'Escalation';
    default:
      return 'Notification';
  }
}

// Get status indicator
function getStatusIndicator(status: string) {
  switch (status) {
    case 'pending':
      return <div className="h-2 w-2 rounded-full bg-blue-500" />;
    case 'sent':
      return <CheckCircle className="h-3 w-3 text-green-500" />;
    case 'failed':
      return <AlertCircle className="h-3 w-3 text-red-500" />;
    default:
      return null;
  }
}

export function NotificationList({
  notifications,
  onNotificationClick,
  className,
}: NotificationListProps) {
  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Bell className="h-8 w-8 mb-2 opacity-50" />
        <p className="text-sm">No notifications</p>
      </div>
    );
  }

  return (
    <div className={cn('divide-y', className)}>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          onClick={() => onNotificationClick?.(notification.id)}
          className={cn(
            'flex gap-3 p-4 cursor-pointer transition-colors',
            'hover:bg-muted/50',
            notification.status === 'pending' && 'bg-blue-50/50'
          )}
        >
          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5">
            {getNotificationIcon(notification.type)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-[#1e3a5f] line-clamp-1">
                {notification.subject}
              </p>
              {notification.status === 'pending' && (
                <div className="flex-shrink-0">{getStatusIndicator(notification.status)}</div>
              )}
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
              {notification.message}
            </p>

            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-muted-foreground">
                {getTypeLabel(notification.type)}
              </span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(new Date(notification.createdAt))}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Full page notification list with filters
interface NotificationListPageProps {
  notifications: Notification[];
  isLoading?: boolean;
  onNotificationClick?: (id: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export function NotificationListPage({
  notifications,
  isLoading = false,
  onNotificationClick,
  onLoadMore,
  hasMore = false,
}: NotificationListPageProps) {
  return (
    <div className="space-y-4">
      <NotificationList
        notifications={notifications}
        onNotificationClick={onNotificationClick}
      />

      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1e3a5f] border-t-transparent" />
        </div>
      )}

      {hasMore && !isLoading && onLoadMore && (
        <div className="flex justify-center py-4">
          <button
            onClick={onLoadMore}
            className="text-sm text-[#1e3a5f] hover:underline"
          >
            Load more notifications
          </button>
        </div>
      )}
    </div>
  );
}
