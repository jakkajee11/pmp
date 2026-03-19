/**
 * CSV Export API Route
 *
 * GET /api/reports/export/csv
 */

import { exportCsvHandler } from "@/features/reports";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return exportCsvHandler(request as never);
}
