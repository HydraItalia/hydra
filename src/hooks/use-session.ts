"use client";

import { useSession as useNextAuthSession } from "next-auth/react";

/**
 * Client-side hook to get the current session
 * Wraps NextAuth's useSession with type safety
 */
export function useSession() {
  const session = useNextAuthSession();

  return {
    session: session.data,
    status: session.status,
    isLoading: session.status === "loading",
    isAuthenticated: session.status === "authenticated",
    isUnauthenticated: session.status === "unauthenticated",
  };
}
