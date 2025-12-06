"use client";

import { useSession } from "./use-session";

type Role = "ADMIN" | "AGENT" | "VENDOR" | "CLIENT" | "DRIVER";

/**
 * Client-side hook to get the current user with role information
 */
export function useUser() {
  const { session, status, isLoading, isAuthenticated } = useSession();

  const user = session?.user ?? null;

  return {
    user,
    role: user?.role as Role | undefined,
    isLoading,
    isAuthenticated,
    isAdmin: user?.role === "ADMIN",
    isAgent: user?.role === "AGENT",
    isVendor: user?.role === "VENDOR",
    isClient: user?.role === "CLIENT",
    isDriver: user?.role === "DRIVER",
    vendorId: user?.vendorId ?? null,
    clientId: user?.clientId ?? null,
    agentCode: user?.agentCode ?? null,
    driverId: user?.driverId ?? null,
  };
}
