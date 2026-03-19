/**
 * Session Provider Component
 *
 * Provides session context to client components.
 */

"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { ReactNode } from "react";

interface SessionProviderProps {
  children: ReactNode;
  /**
   * Refetch interval in seconds (default: 5 minutes)
   */
  refetchInterval?: number;
  /**
   * Refetch on window focus
   */
  refetchOnWindowFocus?: boolean;
}

export function SessionProvider({
  children,
  refetchInterval = 300, // 5 minutes
  refetchOnWindowFocus = true,
}: SessionProviderProps) {
  return (
    <NextAuthSessionProvider
      refetchInterval={refetchInterval}
      refetchOnWindowFocus={refetchOnWindowFocus}
    >
      {children}
    </NextAuthSessionProvider>
  );
}

export default SessionProvider;
