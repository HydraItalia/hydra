"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUser } from "@/hooks/use-user";
import { useEffect, useState } from "react";

type UserAvatarProps = {
  className?: string;
  showName?: boolean;
};

/**
 * Component that displays user avatar and optional name
 */
export function UserAvatar({ className, showName = false }: UserAvatarProps) {
  const [mounted, setMounted] = useState(false);
  const { user } = useUser();

  // Only render on client side to avoid SSR session issues
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !user) {
    return null;
  }

  const initials = user.name
    ? user.name
        .trim()
        .split(/\s+/)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email
    ? user.email[0].toUpperCase()
    : "U";

  return (
    <div className="flex items-center gap-2">
      <Avatar className={className}>
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      {showName && (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{user.name || user.email}</span>
        </div>
      )}
    </div>
  );
}
