/**
 * Settings API Routes
 *
 * Re-exports handlers from settings feature
 */

import { getSettings, updateSettings } from '@/features/settings/api/handlers';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  return getSettings(request);
}

export async function PATCH(request: NextRequest) {
  return updateSettings(request);
}
