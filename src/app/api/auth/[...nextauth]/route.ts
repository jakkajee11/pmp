/**
 * NextAuth API Route
 *
 * Re-exports NextAuth handlers from the auth feature module.
 */

import NextAuth from "next-auth";
import { authOptions } from "@/features/auth/api/session";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
