"use client";

import { useSession } from "./use-session";

type Role = "ADMIN" | "AGENT" | "VENDOR" | "CLIENT" | "DRIVER";

/**
 * Type guard to validate role values at runtime
 */
function isRole(value: unknown): value is Role {
  return (
    typeof value === "string" &&
    ["ADMIN", "AGENT", "VENDOR", "CLIENT", "DRIVER"].includes(value)
  );
}

/**
 * Client-side hook to get the current user with role information
 */
export function useUser() {
  const { session, isLoading, isAuthenticated } = useSession();

  const user = session?.user ?? null;
  const role = user?.role && isRole(user.role) ? user.role : undefined;

  return {
    user,
    role,
    isLoading,
    isAuthenticated,
    isAdmin: role === "ADMIN",
    isAgent: role === "AGENT",
    isVendor: role === "VENDOR",
    isClient: role === "CLIENT",
    isDriver: role === "DRIVER",
    vendorId: user?.vendorId ?? null,
    clientId: user?.clientId ?? null,
    agentCode: user?.agentCode ?? null,
    driverId: user?.driverId ?? null,
  };
}
