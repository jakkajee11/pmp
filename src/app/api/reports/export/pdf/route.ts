/**
 * PDF Export API Route
 *
 * GET /api/reports/export/pdf
 */

import { exportPdfHandler } from "@/features/reports";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return exportPdfHandler(request as never);
}
