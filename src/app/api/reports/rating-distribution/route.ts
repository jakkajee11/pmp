/**
 * Rating Distribution API Route
 *
 * GET /api/reports/rating-distribution
 */

import { getRatingDistributionHandler } from "../../../../features/reports";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return getRatingDistributionHandler(request as never);
}
