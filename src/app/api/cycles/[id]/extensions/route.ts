/**
 * Cycle Extensions API Route
 *
 * Grants deadline extensions for users.
 */

import { grantExtensionHandler } from "../../../../../../features/cycles/api/handlers";
import { withApiHandler } from "../../../../../../shared/api/middleware";

export const POST = withApiHandler(grantExtensionHandler);
