// Notifications Feature - Public Exports
// This feature handles notifications and reminders for the performance review system

// Types
export type {
  Notification,
  CreateNotificationInput,
  UpdateNotificationInput,
  NotificationListQuery,
  NotificationListResponse,
  NotificationPreferences,
  NotificationQueueItem,
  NotificationServiceResult,
  NotificationTemplateContext,
  NotificationTypeValue,
  NotificationChannelValue,
  NotificationStatusValue,
} from './types';

export {
  NotificationType,
  NotificationChannel,
  NotificationStatus,
  notificationSchema,
  createNotificationSchema,
  updateNotificationSchema,
  notificationListQuerySchema,
  notificationPreferencesSchema,
} from './types';

// API - these functions can be used programmatically
export {
  createNotification,
  createNotifications,
  getUnreadCount,
} from './api/handlers';

export { notificationQueue } from './api/queue';

// Services
export { sendEmail, sendTemplatedEmail, generateEmailHtml } from './services/email';
export { sendSms, sendBulkSms } from './services/sms';
export {
  sendTeamsMessage,
  sendTeamsCard,
  buildActionCard,
  buildDeadlineCard,
} from './services/teams';

// Components
export { NotificationBell } from './components/notification-bell';
export { NotificationList, NotificationListPage } from './components/notification-list';
export { NotificationSettings } from './components/notification-settings';

// Hooks
export { useNotifications, useNotificationPreferences } from './hooks/use-notifications';
