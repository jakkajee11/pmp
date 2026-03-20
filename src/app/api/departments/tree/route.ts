/**
 * Department Tree API Route
 *
 * Returns department hierarchy tree.
 */

import { withApiHandler } from "@/shared/api/middleware";
import { getDepartmentTreeHandler } from "@/features/users/api/handlers";

export const GET = withApiHandler(getDepartmentTreeHandler);
