/**
 * useSession Hook
 *
 * Custom hook for accessing session data in client components.
 */

"use client";

import { useSession as useNextAuthSession } from "next-auth/react";
import { SessionUser, AuthState } from "../types";

interface UseSessionReturn extends AuthState {
  update: (data: Partial<SessionUser>) => Promise<void>;
  status: "authenticated" | "loading" | "unauthenticated";
}

/**
 * Hook to access session data
 */
export function useSession(): UseSessionReturn {
  const { data: session, status, update } = useNextAuthSession();

  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";
  const user = session?.user ?? null;

  const updateSession = async (data: Partial<SessionUser>) => {
    await update(data);
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    status,
    update: updateSession,
  };
}

/**
 * Hook to require authentication
 * Redirects to sign in if not authenticated
 */
export function useRequireAuth(): SessionUser {
  const { user, isAuthenticated, status } = useSession();

  if (status === "loading") {
    // Return a loading state user object
    return {
      id: "",
      email: "",
      name: "",
      role: "EMPLOYEE",
      language: "en",
    };
  }

  if (!isAuthenticated || !user) {
    // In a real app, this would redirect to sign in
    throw new Error("Authentication required");
  }

  return user;
}

/**
 * Hook to check if user has a specific role
 */
export function useHasRole(requiredRole: string): boolean {
  const { user, isAuthenticated } = useSession();

  if (!isAuthenticated || !user) {
    return false;
  }

  const roleHierarchy: Record<string, number> = {
    SUPER_ADMIN: 100,
    HR_ADMIN: 80,
    HR_STAFF: 60,
    SENIOR_MANAGER: 40,
    LINE_MANAGER: 20,
    EMPLOYEE: 10,
  };

  const userLevel = roleHierarchy[user.role] ?? 0;
  const requiredLevel = roleHierarchy[requiredRole] ?? 0;

  return userLevel >= requiredLevel;
}

/**
 * Hook to check if user has any of the specified roles
 */
export function useHasAnyRole(roles: string[]): boolean {
  const { user, isAuthenticated } = useSession();

  if (!isAuthenticated || !user) {
    return false;
  }

  return roles.includes(user.role);
}

export default useSession;
