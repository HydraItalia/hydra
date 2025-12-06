"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "./use-session";

/**
 * Hook that redirects to signin if user is not authenticated
 * Use this in pages/components that require authentication
 */
export function useRequireAuth(redirectTo: string = "/signin") {
  const { isAuthenticated, isLoading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  return { isAuthenticated, isLoading };
}
