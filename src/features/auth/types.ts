/**
 * Authentication Types
 *
 * Type definitions for authentication and session management.
 */

import { UserRole } from "@/shared/types/common";

/**
 * User session data from OIDC provider
 */
export interface OidcUser {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  email_verified?: boolean;
}

/**
 * Session user type
 */
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  nameTh?: string;
  role: UserRole;
  departmentId?: string;
  managerId?: string;
  language: string;
  image?: string;
}

/**
 * Session type for NextAuth
 */
export interface Session {
  user: SessionUser;
  expires: string;
}

/**
 * JWT token payload
 */
export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
  departmentId?: string;
  managerId?: string;
  language: string;
  iat: number;
  exp: number;
}

/**
 * OIDC provider configuration
 */
export interface OidcConfig {
  issuer: string;
  clientId: string;
  clientSecret: string;
  authorizationEndpoint?: string;
  tokenEndpoint?: string;
  userinfoEndpoint?: string;
}

/**
 * Authentication state for client components
 */
export interface AuthState {
  user: SessionUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/**
 * Login credentials (for local development only)
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Permission check result
 */
export interface PermissionCheck {
  allowed: boolean;
  reason?: string;
}
