import { z } from 'zod';

// Notification types from data model
export const NotificationType = {
  CYCLE_START: 'cycle_start',
  DEADLINE_REMINDER: 'deadline_reminder',
  SUBMISSION_CONFIRM: 'submission_confirm',
  FEEDBACK_AVAILABLE: 'feedback_available',
  ESCALATION: 'escalation',
} as const;

export const NotificationChannel = {
  EMAIL: 'email',
  SMS: 'sms',
  TEAMS: 'teams',
} as const;

export const NotificationStatus = {
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed',
} as const;

// Notification entity schema
export const notificationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.enum([
    'cycle_start',
    'deadline_reminder',
    'submission_confirm',
    'feedback_available',
    'escalation',
  ]),
  channel: z.enum(['email', 'sms', 'teams']),
  subject: z.string().min(1).max(500),
  message: z.string().min(1),
  status: z.enum(['pending', 'sent', 'failed']),
  sentAt: z.coerce.date().nullable(),
  retryCount: z.number().int().min(0).default(0),
  errorMessage: z.string().nullable(),
  createdAt: z.coerce.date(),
});

// Create notification input
export const createNotificationSchema = z.object({
  userId: z.string().uuid('User ID is required'),
  type: z.enum([
    'cycle_start',
    'deadline_reminder',
    'submission_confirm',
    'feedback_available',
    'escalation',
  ]),
  channel: z.enum(['email', 'sms', 'teams']),
  subject: z.string().min(1, 'Subject is required').max(500),
  message: z.string().min(1, 'Message is required'),
});

// Update notification input (for retry/status updates)
export const updateNotificationSchema = z.object({
  status: z.enum(['pending', 'sent', 'failed']).optional(),
  sentAt: z.coerce.date().nullable().optional(),
  retryCount: z.number().int().min(0).optional(),
  errorMessage: z.string().nullable().optional(),
});

// List query schema
export const notificationListQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  type: z.enum([
    'cycle_start',
    'deadline_reminder',
    'submission_confirm',
    'feedback_available',
    'escalation',
  ]).optional(),
  status: z.enum(['pending', 'sent', 'failed']).optional(),
  channel: z.enum(['email', 'sms', 'teams']).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z.enum(['createdAt', 'sentAt', 'status']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Notification preferences schema
export const notificationPreferencesSchema = z.object({
  userId: z.string().uuid(),
  emailEnabled: z.boolean().default(true),
  smsEnabled: z.boolean().default(false),
  teamsEnabled: z.boolean().default(true),
  cycleStartNotifications: z.boolean().default(true),
  deadlineReminders: z.boolean().default(true),
  submissionConfirmations: z.boolean().default(true),
  feedbackNotifications: z.boolean().default(true),
  reminderDaysBefore: z.number().int().min(1).max(14).default(3),
});

// Extended preferences with all UI fields
export const fullNotificationPreferencesSchema = notificationPreferencesSchema.extend({
  emailEnabled: z.boolean().default(true),
  smsEnabled: z.boolean().default(false),
  teamsEnabled: z.boolean().default(true),
  cycleStartNotifications: z.boolean().default(true),
  deadlineReminders: z.boolean().default(true),
  submissionConfirmations: z.boolean().default(true),
  feedbackNotifications: z.boolean().default(true),
  reminderDaysBefore: z.number().int().min(1).max(14).default(3),
});

// Queue item for in-memory processing
export const notificationQueueItemSchema = z.object({
  id: z.string().uuid(),
  notification: notificationSchema,
  attempts: z.number().int().min(0),
  nextRetryAt: z.coerce.date(),
  priority: z.enum(['high', 'normal', 'low']).default('normal'),
});

// Type exports
export type Notification = z.infer<typeof notificationSchema>;
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type UpdateNotificationInput = z.infer<typeof updateNotificationSchema>;
export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>;
export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;
export type NotificationQueueItem = z.infer<typeof notificationQueueItemSchema>;
export type NotificationTypeValue = typeof NotificationType[keyof typeof NotificationType];
export type NotificationChannelValue = typeof NotificationChannel[keyof typeof NotificationChannel];
export type NotificationStatusValue = typeof NotificationStatus[keyof typeof NotificationStatus];

// API Response types
export interface NotificationListResponse {
  data: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Service result type
export interface NotificationServiceResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Template context for notification generation
export interface NotificationTemplateContext {
  recipientName: string;
  cycleName?: string;
  deadline?: string;
  feedbackType?: string;
  managerName?: string;
  employeeName?: string;
  additionalInfo?: Record<string, string>;
}
