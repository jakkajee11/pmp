/**
 * Users Import API Route
 *
 * Handles bulk user import via CSV.
 */

import { withApiHandler } from "../../../../shared/api/middleware";
import { bulkImportUsersHandler } from "../../../../features/users/api/handlers";

export const POST = withApiHandler(bulkImportUsersHandler);
