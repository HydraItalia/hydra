"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

type SessionProviderProps = {
  children: React.ReactNode;
};

/**
 * Wraps the app with NextAuth SessionProvider
 * This makes session data available to all client components
 */
export function SessionProvider({ children }: SessionProviderProps) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
