/**
 * Cycle Close API Route
 *
 * Closes a review cycle.
 */

import { closeCycleHandler } from "../../../../../../features/cycles/api/handlers";
import { withApiHandler } from "../../../../../../shared/api/middleware";

export const POST = withApiHandler(closeCycleHandler);
