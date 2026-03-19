/**
 * OIDC Provider Configuration
 *
 * NextAuth.js configuration with OIDC provider support.
 * Includes mock Credentials provider for local development.
 */

import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { env } from "@/env";
import { prisma } from "@/shared/lib/db";
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
 * Mock users for local development
 * These users allow testing different roles without OIDC setup
 */
const MOCK_USERS: Record<string, { id: string; email: string; name: string; role: SessionUser["role"]; password: string }> = {
  "admin@pmp.local": {
    id: "mock-super-admin",
    email: "admin@pmp.local",
    name: "Super Admin",
    role: "SUPER_ADMIN",
    password: "password",
  },
  "hr@pmp.local": {
    id: "mock-hr-admin",
    email: "hr@pmp.local",
    name: "HR Admin",
    role: "HR_ADMIN",
    password: "password",
  },
  "manager@pmp.local": {
    id: "mock-line-manager",
    email: "manager@pmp.local",
    name: "Line Manager",
    role: "LINE_MANAGER",
    password: "password",
  },
  "employee@pmp.local": {
    id: "mock-employee",
    email: "employee@pmp.local",
    name: "Employee User",
    role: "EMPLOYEE",
    password: "password",
  },
};

/**
 * NextAuth configuration options
 */
export const authOptions: NextAuthOptions = {
  providers: [
    // Credentials Provider for Development (Mock Login)
    ...(process.env.NODE_ENV === "development"
      ? [
          CredentialsProvider({
            id: "credentials",
            name: "Development Login",
            credentials: {
              email: { label: "Email", type: "email", placeholder: "admin@pmp.local" },
              password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
              if (!credentials?.email || !credentials?.password) {
                return null;
              }

              const mockUser = MOCK_USERS[credentials.email];

              if (!mockUser || mockUser.password !== credentials.password) {
                return null;
              }

              return {
                id: mockUser.id,
                email: mockUser.email,
                name: mockUser.name,
                role: mockUser.role,
              };
            },
          }),
        ]
      : []),
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

      // Skip database check for mock users in development
      if (account?.provider === "credentials" && process.env.NODE_ENV === "development") {
        const mockUser = Object.values(MOCK_USERS).find((u) => u.email === user.email);
        if (mockUser) {
          return true;
        }
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
    async jwt({ token, user, account, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id ?? "";
      }

      // Handle mock users in development - both initial and subsequent calls
      if (process.env.NODE_ENV === "development" && token.email) {
        const mockUser = MOCK_USERS[token.email];
        if (mockUser) {
          token.id = mockUser.id;
          token.role = mockUser.role;
          token.language = "en";
          return token;
        }
      }

      // Update session (e.g., language preference change)
      if (trigger === "update" && session) {
        token.language = session.language;
      }

      // Fetch user data from database for role and other fields (only for non-mock users)
      if (token.email && !MOCK_USERS[token.email]) {
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
