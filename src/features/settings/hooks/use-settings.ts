/**
 * useSettings Hook
 *
 * React hook for managing user settings with SWR for caching and optimistic updates.
 *
 * Constitution: Implements US12 (Localization) settings state management
 */

'use client';

import useSWR from 'swr';
import { useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import type {
  UserSettings,
  UpdateUserSettingsInput,
  SupportedLocale,
} from '../types';

interface UseSettingsReturn {
  /** Current user settings */
  settings: UserSettings | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Update settings */
  updateSettings: (data: UpdateUserSettingsInput) => Promise<void>;
  /** Update language preference */
  updateLanguage: (locale: SupportedLocale) => Promise<void>;
  /** Reset settings to defaults */
  resetSettings: () => Promise<void>;
  /** Refetch settings from server */
  refresh: () => Promise<void>;
  /** Check if a mutation is in progress */
  isMutating: boolean;
}

/**
 * Fetcher for SWR
 */
async function fetcher(url: string): Promise<{ settings: UserSettings }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch settings');
  }
  return response.json();
}

/**
 * Hook for managing user settings
 */
export function useSettings(): UseSettingsReturn {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated' && !!session?.user;

  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR(
    isAuthenticated ? '/api/settings' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1 minute
    }
  );

  const settings = data?.settings ?? null;

  /**
   * Update settings
   */
  const updateSettings = useCallback(
    async (updateData: UpdateUserSettingsInput) => {
      if (!settings) return;

      // Optimistic update
      const optimisticData = {
        settings: {
          ...settings,
          ...updateData,
          updatedAt: new Date().toISOString(),
        },
      };

      await mutate(
        async () => {
          const response = await fetch('/api/settings', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update settings');
          }

          return response.json();
        },
        {
          optimisticData,
          rollbackOnError: true,
          revalidate: false,
        }
      );

      toast.success(
        settings.locale === 'th'
          ? 'บันทึกการตั้งค่าแล้ว'
          : 'Settings saved'
      );
    },
    [settings, mutate]
  );

  /**
   * Update language preference
   */
  const updateLanguage = useCallback(
    async (locale: SupportedLocale) => {
      if (!settings) return;

      // Optimistic update
      const optimisticData = {
        settings: {
          ...settings,
          locale,
          updatedAt: new Date().toISOString(),
        },
      };

      await mutate(
        async () => {
          const response = await fetch('/api/settings/language', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ locale }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update language');
          }

          return response.json();
        },
        {
          optimisticData,
          rollbackOnError: true,
          revalidate: false,
        }
      );

      // Show localized toast
      toast.success(
        locale === 'th'
          ? 'เปลี่ยนภาษาเป็นภาษาไทยแล้ว'
          : 'Language changed to English'
      );
    },
    [settings, mutate]
  );

  /**
   * Reset settings to defaults
   */
  const resetSettings = useCallback(async () => {
    await mutate(
      async () => {
        const response = await fetch('/api/settings/reset', {
          method: 'POST',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to reset settings');
        }

        return response.json();
      },
      {
        rollbackOnError: true,
        revalidate: true,
      }
    );

    toast.success(
      settings?.locale === 'th'
        ? 'รีเซ็ตการตั้งค่าแล้ว'
        : 'Settings reset to defaults'
    );
  }, [mutate, settings?.locale]);

  /**
   * Refresh settings from server
   */
  const refresh = useCallback(async () => {
    await mutate();
  }, [mutate]);

  return {
    settings,
    isLoading,
    error: error as Error | null,
    updateSettings,
    updateLanguage,
    resetSettings,
    refresh,
    isMutating: false, // SWR handles this internally
  };
}

export default useSettings;
