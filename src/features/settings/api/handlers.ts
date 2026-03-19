/**
 * Settings API Handlers
 *
 * CRUD operations for user settings including language preferences.
 *
 * Constitution: Implements US12 (Localization) settings management
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/db';
import { errorResponse, successResponse } from '@/shared/api/response';
import { withAuth, withRBAC } from '@/shared/api/middleware';
import { auditLog } from '@/shared/lib/audit';
import {
  userSettingsSchema,
  updateUserSettingsSchema,
  updateLanguageSchema,
  type UserSettings,
  type UpdateUserSettingsInput,
  DEFAULT_USER_SETTINGS,
} from '../types';

/**
 * GET /api/settings
 * Get current user's settings
 */
export async function getSettings(request: NextRequest): Promise<NextResponse> {
  return withAuth(request, async (session) => {
    try {
      const userId = session.user.id;

      let settings = await prisma.userSettings.findUnique({
        where: { userId },
      });

      // Create default settings if not exists
      if (!settings) {
        settings = await prisma.userSettings.create({
          data: {
            userId,
            ...DEFAULT_USER_SETTINGS,
          },
        });
      }

      return successResponse({ settings });
    } catch (error) {
      console.error('Error fetching settings:', error);
      return errorResponse('Failed to fetch settings', 500);
    }
  });
}

/**
 * PATCH /api/settings
 * Update current user's settings
 */
export async function updateSettings(request: NextRequest): Promise<NextResponse> {
  return withAuth(request, async (session) => {
    try {
      const userId = session.user.id;
      const body = await request.json();

      // Validate input
      const validationResult = updateUserSettingsSchema.safeParse(body);
      if (!validationResult.success) {
        return errorResponse(
          'Invalid settings data',
          400,
          validationResult.error.flatten().fieldErrors
        );
      }

      const updateData = validationResult.data as UpdateUserSettingsInput;

      // Check if settings exist
      let existingSettings = await prisma.userSettings.findUnique({
        where: { userId },
      });

      // Create if doesn't exist
      if (!existingSettings) {
        existingSettings = await prisma.userSettings.create({
          data: {
            userId,
            ...DEFAULT_USER_SETTINGS,
            ...updateData,
          },
        });

        await auditLog({
          action: 'settings_created',
          entityType: 'UserSettings',
          entityId: existingSettings.id,
          userId,
          oldValue: null,
          newValue: existingSettings,
        });

        return successResponse({ settings: existingSettings });
      }

      // Update existing settings
      const updatedSettings = await prisma.userSettings.update({
        where: { userId },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
      });

      // Audit log
      await auditLog({
        action: 'settings_updated',
        entityType: 'UserSettings',
        entityId: updatedSettings.id,
        userId,
        oldValue: existingSettings,
        newValue: updatedSettings,
      });

      return successResponse({ settings: updatedSettings });
    } catch (error) {
      console.error('Error updating settings:', error);
      return errorResponse('Failed to update settings', 500);
    }
  });
}

/**
 * PUT /api/settings/language
 * Update user's language preference
 */
export async function updateLanguage(request: NextRequest): Promise<NextResponse> {
  return withAuth(request, async (session) => {
    try {
      const userId = session.user.id;
      const body = await request.json();

      // Validate input
      const validationResult = updateLanguageSchema.safeParse(body);
      if (!validationResult.success) {
        return errorResponse(
          'Invalid language selection',
          400,
          validationResult.error.flatten().fieldErrors
        );
      }

      const { locale } = validationResult.data;

      // Upsert settings with new locale
      const settings = await prisma.userSettings.upsert({
        where: { userId },
        create: {
          userId,
          ...DEFAULT_USER_SETTINGS,
          locale,
        },
        update: {
          locale,
          updatedAt: new Date(),
        },
      });

      // Audit log
      await auditLog({
        action: 'language_changed',
        entityType: 'UserSettings',
        entityId: settings.id,
        userId,
        oldValue: { locale: settings.locale },
        newValue: { locale },
      });

      return successResponse({
        settings,
        message: locale === 'th' ? 'เปลี่ยนภาษาเป็นภาษาไทยแล้ว' : 'Language changed to English',
      });
    } catch (error) {
      console.error('Error updating language:', error);
      return errorResponse('Failed to update language', 500);
    }
  });
}

/**
 * POST /api/settings/reset
 * Reset settings to defaults
 */
export async function resetSettings(request: NextRequest): Promise<NextResponse> {
  return withAuth(request, async (session) => {
    try {
      const userId = session.user.id;

      const settings = await prisma.userSettings.upsert({
        where: { userId },
        create: {
          userId,
          ...DEFAULT_USER_SETTINGS,
        },
        update: {
          ...DEFAULT_USER_SETTINGS,
          updatedAt: new Date(),
        },
      });

      // Audit log
      await auditLog({
        action: 'settings_reset',
        entityType: 'UserSettings',
        entityId: settings.id,
        userId,
        oldValue: null,
        newValue: settings,
      });

      return successResponse({
        settings,
        message: 'Settings reset to defaults',
      });
    } catch (error) {
      console.error('Error resetting settings:', error);
      return errorResponse('Failed to reset settings', 500);
    }
  });
}
