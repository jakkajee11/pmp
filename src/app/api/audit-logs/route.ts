// API Route: /api/audit-logs
// Re-exports from the audit-logs feature

import { getAuditLogsHandler, getAuditLogStatsHandler } from '@/features/audit-logs/api/handlers';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');

  // Route to stats if requested
  if (path === 'stats') {
    return getAuditLogStatsHandler(request);
  }

  return getAuditLogsHandler(request);
}
