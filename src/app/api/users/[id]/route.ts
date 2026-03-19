/**
 * User by ID API Route
 *
 * Handles individual user operations.
 */

import { NextRequest } from "next/server";
import { withApiHandler } from "../../../../shared/api/middleware";
import {
  getUserHandler,
  updateUserHandler,
  deleteUserHandler,
} from "../../../../features/users/api/handlers";

export const GET = withApiHandler(getUserHandler);
export const PUT = withApiHandler(updateUserHandler);
export const DELETE = withApiHandler(deleteUserHandler);
