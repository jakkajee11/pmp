/**
 * Cycle Activate API Route
 *
 * Activates a review cycle.
 */

import { activateCycleHandler } from "@/features/cycles/api/handlers";
import { withApiHandler } from "@/shared/api/middleware";

export const POST = withApiHandler(activateCycleHandler);
