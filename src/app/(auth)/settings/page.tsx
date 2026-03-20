/**
 * Settings Page
 *
 * User preferences page for language, notifications, and display settings.
 *
 * UI/UX: Professional Corporate style with navy blue accents
 * Constitution: Implements US12 (Localization) - Settings management UI
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/features/auth/api/session';
import { prisma } from '@/shared/lib/db';
import { SettingsClient } from './client';

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  // Get user settings
  let settings = await prisma.userSettings.findUnique({
    where: { userId: session.user.id },
  });

  return <SettingsClient initialSettings={settings} />;
}
