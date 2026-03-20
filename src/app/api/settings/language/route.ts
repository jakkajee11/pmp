/**
 * Language Settings API Route
 *
 * Re-exports handler from settings feature
 */

import { updateLanguage } from '@/features/settings/api/handlers';
import { NextRequest } from 'next/server';

export async function PUT(request: NextRequest) {
  return updateLanguage(request);
}
