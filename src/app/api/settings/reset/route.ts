/**
 * Reset Settings API Route
 *
 * Re-exports handler from settings feature
 */

import { resetSettings } from '@/features/settings/api/handlers';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  return resetSettings(request);
}
