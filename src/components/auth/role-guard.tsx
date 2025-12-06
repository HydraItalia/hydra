"use client";

import { useRequireRole } from "@/hooks/use-require-role";

type Role = "ADMIN" | "AGENT" | "VENDOR" | "CLIENT" | "DRIVER";

type RoleGuardProps = {
  roles: Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
};

/**
 * Component that shows content based on user roles
 * Redirects to unauthorized page if user doesn't have required role
 */
export function RoleGuard({
  roles,
  children,
  fallback = null,
  redirectTo,
}: RoleGuardProps) {
  const { hasRequiredRole, isLoading } = useRequireRole(roles, redirectTo);

  if (isLoading) {
    return <>{fallback}</>;
  }

  if (!hasRequiredRole) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
