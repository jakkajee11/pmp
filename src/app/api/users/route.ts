/**
 * Users API Route
 *
 * Handles user management endpoints.
 */

import { NextRequest } from "next/server";
import { withApiHandler } from "../../../shared/api/middleware";
import {
  getUsersHandler,
  createUserHandler,
} from "../../../features/users/api/handlers";

export const GET = withApiHandler(getUsersHandler);
export const POST = withApiHandler(createUserHandler);
