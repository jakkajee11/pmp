/**
 * Completion Report API Route
 *
 * GET /api/reports/completion
 */

import { getCompletionReportHandler } from "@/features/reports";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return getCompletionReportHandler(request as never);
}
