"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/auth/user-avatar";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { useUser } from "@/hooks/use-user";
import { Settings, User, Building2, Truck } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

/**
 * User menu dropdown component for the header
 * Shows user info, role, and navigation options
 */
export function UserMenu() {
  const [mounted, setMounted] = useState(false);
  const { user, role, vendorId, clientId, driverId } = useUser();

  // Only render on client side to avoid SSR session issues
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !user) {
    return null;
  }

  const getRoleBadgeVariant = (userRole: string) => {
    switch (userRole) {
      case "ADMIN":
        return "destructive";
      case "AGENT":
        return "default";
      case "VENDOR":
        return "secondary";
      case "CLIENT":
        return "outline";
      case "DRIVER":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary rounded-full"
          aria-label="Open user menu"
        >
          <UserAvatar />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user.name || "User"}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
            {role && (
              <Badge variant={getRoleBadgeVariant(role)} className="w-fit mt-1">
                {role}
              </Badge>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {vendorId && (
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/vendors/${vendorId}`}>
              <Building2 className="mr-2 h-4 w-4" />
              My Vendor
            </Link>
          </DropdownMenuItem>
        )}

        {clientId && (
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/clients/${clientId}`}>
              <User className="mr-2 h-4 w-4" />
              My Profile
            </Link>
          </DropdownMenuItem>
        )}

        {driverId && (
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/drivers/${driverId}`}>
              <Truck className="mr-2 h-4 w-4" />
              My Deliveries
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <SignOutButton
            variant="ghost"
            size="sm"
            className="w-full justify-start"
          />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
