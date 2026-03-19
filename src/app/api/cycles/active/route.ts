/**
 * Active Cycle API Route
 *
 * Returns the currently active review cycle.
 */

import { getActiveCycleHandler } from "@/features/cycles/api/handlers";
import { withApiHandler } from "@/shared/api/middleware";

export const GET = withApiHandler(getActiveCycleHandler);
