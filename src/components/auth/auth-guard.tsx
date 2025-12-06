"use client";

import { useRequireAuth } from "@/hooks/use-require-auth";

type AuthGuardProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
};

/**
 * Component that protects routes/components requiring authentication
 * Shows fallback while loading, redirects to signin if not authenticated
 */
export function AuthGuard({
  children,
  fallback = <div>Loading...</div>,
  redirectTo,
}: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useRequireAuth(redirectTo);

  if (isLoading) {
    return <>{fallback}</>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
