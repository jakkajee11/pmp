/**
 * Settings Feature Types
 *
 * Types for user preferences including language, notifications, and display settings.
 *
 * Constitution: Supports localization (US12) and user preferences
 */

import { z } from 'zod';
import type { Locale } from '@/shared/lib/i18n';

// Available locales
export const SUPPORTED_LOCALES = ['en', 'th'] as const;
export type SupportedLocale = typeof SUPPORTED_LOCA[number];

// Theme options
export const ThemeOption = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;
export type ThemeOptionValue = typeof ThemeOption[keyof typeof ThemeOption];

// Date format preferences
export const DateFormatOption = {
  DD_MM_YYYY: 'DD/MM/YYYY',
  MM_DD_YYYY: 'MM/DD/YYYY',
  YYYY_MM_DD: 'YYYY-MM-DD',
} as const;
export type DateFormatOptionValue = typeof DateFormatOption[keyof typeof DateFormatOption];

// User settings schema
export const userSettingsSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  locale: z.enum(['en', 'th']).default('en'),
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  dateFormat: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']).default('DD/MM/YYYY'),
  timezone: z.string().default('Asia/Bangkok'),
  emailNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(false),
  teamsNotifications: z.boolean().default(true),
  reminderDaysBefore: z.number().int().min(1).max(14).default(3),
  autoSaveInterval: z.number().int().min(10).max(120).default(30),
  compactMode: z.boolean().default(false),
  showHelpTips: z.boolean().default(true),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// Update settings input schema
export const updateUserSettingsSchema = z.object({
  locale: z.enum(['en', 'th']).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  dateFormat: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']).optional(),
  timezone: z.string().optional(),
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  teamsNotifications: z.boolean().optional(),
  reminderDaysBefore: z.number().int().min(1).max(14).optional(),
  autoSaveInterval: z.number().int().min(10).max(120).optional(),
  compactMode: z.boolean().optional(),
  showHelpTips: z.boolean().optional(),
});

// Create settings input (usually auto-created with user)
export const createUserSettingsSchema = z.object({
  userId: z.string().uuid('User ID is required'),
  locale: z.enum(['en', 'th']).default('en'),
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  dateFormat: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']).default('DD/MM/YYYY'),
  timezone: z.string().default('Asia/Bangkok'),
});

// Language preference update
export const updateLanguageSchema = z.object({
  locale: z.enum(['en', 'th'], {
    required_error: 'Language is required',
    invalid_type_error: 'Language must be either en or th',
  }),
});

// Type exports
export type UserSettings = z.infer<typeof userSettingsSchema>;
export type UpdateUserSettingsInput = z.infer<typeof updateUserSettingsSchema>;
export type CreateUserSettingsInput = z.infer<typeof createUserSettingsSchema>;
export type UpdateLanguageInput = z.infer<typeof updateLanguageSchema>;

// Settings response types
export interface SettingsResponse {
  success: boolean;
  settings?: UserSettings;
  error?: string;
}

// Default settings for new users
export const DEFAULT_USER_SETTINGS: Omit<UserSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  locale: 'en',
  theme: 'system',
  dateFormat: 'DD/MM/YYYY',
  timezone: 'Asia/Bangkok',
  emailNotifications: true,
  smsNotifications: false,
  teamsNotifications: true,
  reminderDaysBefore: 3,
  autoSaveInterval: 30,
  compactMode: false,
  showHelpTips: true,
};

// Timezone options for Thailand/International users
export const TIMEZONE_OPTIONS = [
  { value: 'Asia/Bangkok', label: 'Bangkok (GMT+7)' },
  { value: 'UTC', label: 'UTC (GMT+0)' },
] as const;

export type TimezoneOption = typeof TIMEZONE_OPTIONS[number];
