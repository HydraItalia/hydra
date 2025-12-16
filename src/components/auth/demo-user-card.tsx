"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DemoUser } from "@/lib/demo-mode";
import {
  User,
  Store,
  Users,
  ShoppingCart,
  Truck,
  Shield,
  Loader2,
} from "lucide-react";

type DemoUserCardProps = {
  user: DemoUser;
  onClick: () => void;
  isLoading?: boolean;
};

/**
 * Card component for selecting a demo user
 */
export function DemoUserCard({ user, onClick, isLoading }: DemoUserCardProps) {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN":
        return Shield;
      case "AGENT":
        return Users;
      case "VENDOR":
        return Store;
      case "CLIENT":
        return ShoppingCart;
      case "DRIVER":
        return Truck;
      default:
        return User;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
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

  const Icon = getRoleIcon(user.role);
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-lg hover:scale-105 active:scale-100 ${
        isLoading ? "opacity-75 pointer-events-none" : ""
      }`}
      onClick={isLoading ? undefined : onClick}
    >
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="text-lg">
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                initials
              )}
            </AvatarFallback>
          </Avatar>
          <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
        </div>
        <div>
          <CardTitle className="flex items-center gap-2">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Icon className="h-4 w-4" />
            )}
            {user.name}
          </CardTitle>
          <CardDescription className="text-xs mt-1">
            {isLoading ? "Signing in..." : user.email}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {isLoading ? "Please wait..." : user.description}
        </p>
      </CardContent>
    </Card>
  );
}
