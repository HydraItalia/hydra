"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

type SignOutButtonProps = {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  children?: React.ReactNode;
  className?: string;
};

/**
 * Button component that signs out the current user
 */
export function SignOutButton({
  variant = "ghost",
  size = "default",
  children,
  className,
}: SignOutButtonProps) {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/signin" });
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSignOut}
      className={className}
    >
      {children || (
        <>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </>
      )}
    </Button>
  );
}
