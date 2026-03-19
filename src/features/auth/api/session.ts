/**
 * OIDC Provider Configuration
 *
 * NextAuth.js configuration with OIDC provider support.
 */

import { NextAuthOptions } from "next-auth";
import { env } from "../../../env";
import { prisma } from "../../../shared/lib/db";
import { SessionUser, OidcUser } from "../types";

// Extend NextAuth types
declare module "next-auth" {
  interface Session {
    user: SessionUser;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    departmentId?: string;
    managerId?: string;
    language: string;
    nameTh?: string;
  }
}

/**
 * NextAuth configuration options
 */
export const authOptions: NextAuthOptions = {
  providers: [
    // OIDC Provider (configured via environment variables)
    {
      id: "oidc",
      name: "Corporate SSO",
      type: "oauth",
      wellKnown: env.OIDC_ISSUER
        ? `${env.OIDC_ISSUER}/.well-known/openid-configuration`
        : undefined,
      authorization: {
        params: {
          scope: "openid email profile",
        },
      },
      clientId: env.OIDC_CLIENT_ID ?? "",
      clientSecret: env.OIDC_CLIENT_SECRET ?? "",
      idToken: true,
      checks: ["pkce", "state"],
      profile(profile: OidcUser) {
        return {
          id: profile.sub,
          email: profile.email,
          name: profile.name,
          image: profile.picture,
        };
      },
    },
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60, // Update session every hour
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) {
        return false;
      }

      // JIT Provisioning: Create or update user on first login
      try {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (!existingUser) {
          // Create new user with default role
          await prisma.user.create({
            data: {
              email: user.email,
              name: user.name ?? user.email.split("@")[0] ?? "Unknown",
              role: "EMPLOYEE",
              language: "en",
              isActive: true,
            },
          });
        } else if (!existingUser.isActive) {
          // Reject login for inactive users
          return false;
        }

        return true;
      } catch (error) {
        console.error("Error during sign in:", error);
        return false;
      }
    },
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id ?? "";
      }

      // Update session (e.g., language preference change)
      if (trigger === "update" && session) {
        token.language = session.language;
      }

      // Fetch user data from database for role and other fields
      if (token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: {
            id: true,
            role: true,
            departmentId: true,
            managerId: true,
            language: true,
            nameTh: true,
          },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.departmentId = dbUser.departmentId ?? undefined;
          token.managerId = dbUser.managerId ?? undefined;
          token.language = dbUser.language;
          token.nameTh = dbUser.nameTh ?? undefined;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user = {
          id: token.id,
          email: token.email ?? "",
          name: token.name ?? "",
          nameTh: token.nameTh,
          role: token.role as SessionUser["role"],
          departmentId: token.departmentId,
          managerId: token.managerId,
          language: token.language ?? "en",
          image: session.user.image,
        };
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      console.log(`User signed in: ${user.email}`);
    },
    async signOut({ token }) {
      console.log(`User signed out: ${token?.email}`);
    },
  },
  debug: process.env.NODE_ENV === "development",
};

export default authOptions;
