/**
 * Organization Chart Flat API Route
 *
 * Returns flat nodes and edges for React Flow visualization.
 */

import { withApiHandler } from "@/shared/api/middleware";
import { getOrgChartFlatHandler } from "@/features/org-chart/api/handlers";

export const GET = withApiHandler(getOrgChartFlatHandler);
