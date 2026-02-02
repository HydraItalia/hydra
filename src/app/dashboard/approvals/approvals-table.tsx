"use client";

import { useRouter } from "next/navigation";
import type { PendingUserResult } from "@/data/approvals";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { UserStatus, Role } from "@prisma/client";

function statusBadgeVariant(
  status: UserStatus,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "APPROVED":
      return "default";
    case "PENDING":
      return "secondary";
    case "REJECTED":
      return "destructive";
    case "SUSPENDED":
      return "destructive";
    default:
      return "outline";
  }
}

function roleBadgeVariant(
  role: Role,
): "default" | "secondary" | "destructive" | "outline" {
  switch (role) {
    case "ADMIN":
      return "destructive";
    case "VENDOR":
      return "default";
    case "CLIENT":
      return "secondary";
    case "DRIVER":
      return "outline";
    case "AGENT":
      return "default";
    default:
      return "outline";
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getOnboardingSummary(data: any): string {
  if (!data) return "—";
  return data.businessName || data.fullName || "—";
}

export function ApprovalsTable({ users }: { users: PendingUserResult[] }) {
  const router = useRouter();

  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No users found matching the current filters.
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Business / Name</TableHead>
              <TableHead>Submitted</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow
                key={user.id}
                className="cursor-pointer"
                onClick={() => router.push(`/dashboard/approvals/${user.id}`)}
              >
                <TableCell className="font-medium">
                  {user.name || "—"}
                </TableCell>
                <TableCell className="text-muted-foreground max-w-[200px] truncate">
                  {user.email}
                </TableCell>
                <TableCell>
                  <Badge variant={roleBadgeVariant(user.role)}>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={statusBadgeVariant(user.status)}>
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {getOnboardingSummary(user.onboardingData)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(user.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 lg:hidden">
        {users.map((user) => (
          <Card
            key={user.id}
            className="cursor-pointer transition-colors hover:bg-muted/50"
            onClick={() => router.push(`/dashboard/approvals/${user.id}`)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="font-medium">{user.name || user.email}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="flex gap-1">
                  <Badge variant={roleBadgeVariant(user.role)}>
                    {user.role}
                  </Badge>
                  <Badge variant={statusBadgeVariant(user.status)}>
                    {user.status}
                  </Badge>
                </div>
              </div>
              <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                <span>{getOnboardingSummary(user.onboardingData)}</span>
                <span>{formatDate(user.createdAt)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
