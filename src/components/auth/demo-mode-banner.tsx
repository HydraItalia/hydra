"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, User } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/hooks/use-user";

/**
 * Banner shown when demo mode is active
 * Displays current user and link to switch users
 */
export function DemoModeBanner() {
  const { user, role } = useUser();

  // Only show if demo mode is enabled (checked via environment variable)
  if (process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE !== "true") {
    return null;
  }

  return (
    <Alert className="rounded-none border-x-0 border-t-0 border-amber-500 bg-amber-500/10">
      <AlertTriangle className="h-4 w-4 text-amber-500" />
      <AlertDescription className="flex items-center justify-between text-amber-900 dark:text-amber-200">
        <div className="flex items-center gap-2">
          <span className="font-medium">Demo Mode Active</span>
          {user && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {user.name || "Unknown"} ({role || "No role"})
              </span>
            </>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          asChild
          className="border-amber-500 text-amber-900 dark:text-amber-200 hover:bg-amber-500/20"
        >
          <Link href="/demo-signin">Switch User</Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
