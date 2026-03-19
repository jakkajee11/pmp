/**
 * Organization Chart API Route
 *
 * Returns organization hierarchy data.
 */

import { withApiHandler } from "../../../shared/api/middleware";
import { getOrgChartHandler } from "../../../features/org-chart/api/handlers";

export const GET = withApiHandler(getOrgChartHandler);
