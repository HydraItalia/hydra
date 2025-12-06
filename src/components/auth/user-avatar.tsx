"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUser } from "@/hooks/use-user";

type UserAvatarProps = {
  className?: string;
  showName?: boolean;
};

/**
 * Component that displays user avatar and optional name
 */
export function UserAvatar({ className, showName = false }: UserAvatarProps) {
  const { user } = useUser();

  if (!user) {
    return null;
  }

  const initials = user.name
    ? user.name
        .split(" ")
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
