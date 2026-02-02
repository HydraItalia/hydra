import { redirect } from "next/navigation";
import { auth } from "../../../auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock, XCircle, ShieldOff } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { RefreshButton } from "./refresh-button";

export default async function PendingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  const { status, name, email } = session.user;

  // Already approved — send to dashboard
  if (status === "APPROVED") {
    redirect("/dashboard");
  }

  // Derive display state solely from session status (never from URL params)
  const isRejected = status === "REJECTED";
  const isSuspended = status === "SUSPENDED";

  return (
    <div className="w-full max-w-md space-y-4">
      <Card>
        <CardHeader className="text-center">
          {isRejected ? (
            <>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>Account Not Approved</CardTitle>
              <CardDescription>
                Your account application has been reviewed and was not approved.
              </CardDescription>
            </>
          ) : isSuspended ? (
            <>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <ShieldOff className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>Account Suspended</CardTitle>
              <CardDescription>
                Your account has been suspended. Please contact an
                administrator.
              </CardDescription>
            </>
          ) : (
            <>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Pending Approval</CardTitle>
              <CardDescription>
                Your account is awaiting review by an administrator.
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg border p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{name || "—"}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{email}</span>
            </div>
          </div>
          {!isRejected && !isSuspended && (
            <p className="text-sm text-muted-foreground text-center">
              You&apos;ll be able to access the dashboard once your account is
              approved.
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          {!isRejected && !isSuspended && <RefreshButton />}
          <SignOutButton variant="outline" className="w-full" />
        </CardFooter>
      </Card>
    </div>
  );
}
