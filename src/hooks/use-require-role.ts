"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "./use-user";

type Role = "ADMIN" | "AGENT" | "VENDOR" | "CLIENT" | "DRIVER";

/**
 * Hook that enforces role requirements
 * Redirects to unauthorized page if user doesn't have required role
 */
export function useRequireRole(
  allowedRoles: Role[],
  redirectTo: string = "/unauthorized"
) {
  const { user, role, isLoading } = useUser();
  const router = useRouter();

  const hasRequiredRole = role && allowedRoles.includes(role);

  useEffect(() => {
    if (!isLoading && user && !hasRequiredRole) {
      router.push(redirectTo);
    }
  }, [user, hasRequiredRole, isLoading, router, redirectTo]);

  return { hasRequiredRole, isLoading, role };
}
