import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Auth Debug | Hydra",
  description: "Authentication debugging page",
};

/**
 * Helper to get badge color for user roles
 */
const getRoleBadgeColor = (role: string): string => {
  switch (role) {
    case "ADMIN":
      return "bg-purple-600 hover:bg-purple-700";
    case "AGENT":
      return "bg-blue-600 hover:bg-blue-700";
    case "VENDOR":
      return "bg-green-600 hover:bg-green-700";
    case "CLIENT":
      return "bg-orange-600 hover:bg-orange-700";
    default:
      return "bg-gray-600 hover:bg-gray-700";
  }
};

/**
 * Helper component to render role-specific warning cards
 */
const RoleWarningCard = ({
  condition,
  message,
}: {
  condition: boolean;
  message: string;
}) => {
  if (!condition) return null;
  return (
    <Card className="border-yellow-600">
      <CardHeader>
        <CardTitle className="text-yellow-600">Warning</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{message}</p>
      </CardContent>
    </Card>
  );
};

/**
 * Auth Debug Page
 *
 * Internal debugging page to inspect current user session data.
 * Accessible at /dashboard/debug/auth
 *
 * SECURITY NOTE: This page exposes sensitive user data (IDs, email, role).
 * Currently accessible to all authenticated users for debugging their own sessions.
 * In production, restrict access to ADMIN role only by uncommenting the role check below.
 *
 * Shows:
 * - User ID
 * - Email
 * - Role
 * - Client ID (if CLIENT role)
 * - Vendor ID (if VENDOR role)
 * - Agent Code (if AGENT role)
 */
export default async function AuthDebugPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/signin");
  }

  // PRODUCTION: Uncomment to restrict debug page to admins only
  // if (user.role !== "ADMIN") {
  //   redirect("/dashboard");
  // }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Auth Debug"
        subtitle="Session and authentication debugging information"
      />

      <Card>
        <CardHeader>
          <CardTitle>Current User Session</CardTitle>
          <CardDescription>
            This page shows your current authentication session data. Use this
            for debugging auth issues.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* User ID */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                User ID
              </p>
              <p className="text-sm font-mono">{user.id}</p>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-sm font-mono">{user.email}</p>
            </div>

            {/* Name */}
            {user.name && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Name
                </p>
                <p className="text-sm">{user.name}</p>
              </div>
            )}

            {/* Role */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Role</p>
              <div>
                <Badge className={getRoleBadgeColor(user.role)}>
                  {user.role}
                </Badge>
              </div>
            </div>

            {/* Client ID */}
            {user.clientId && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Client ID
                </p>
                <p className="text-sm font-mono">{user.clientId}</p>
              </div>
            )}

            {/* Vendor ID */}
            {user.vendorId && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Vendor ID
                </p>
                <p className="text-sm font-mono">{user.vendorId}</p>
              </div>
            )}

            {/* Agent Code */}
            {user.agentCode && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Agent Code
                </p>
                <p className="text-sm font-mono">{user.agentCode}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Role-specific warnings */}
      <RoleWarningCard
        condition={user.role === "CLIENT" && !user.clientId}
        message="You are a CLIENT user but do not have a clientId assigned. This may cause issues with CLIENT-only features."
      />
      <RoleWarningCard
        condition={user.role === "VENDOR" && !user.vendorId}
        message="You are a VENDOR user but do not have a vendorId assigned. This may cause issues with VENDOR-only features."
      />
      <RoleWarningCard
        condition={user.role === "AGENT" && !user.agentCode}
        message="You are an AGENT user but do not have an agentCode assigned. This may cause issues with AGENT-only features."
      />
    </div>
  );
}
