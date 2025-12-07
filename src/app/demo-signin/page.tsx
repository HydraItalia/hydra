"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { DemoUserCard } from "@/components/auth/demo-user-card";
import { DEMO_USERS } from "@/lib/demo-mode";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Demo Signin Page
 * Allows one-click signin as any demo user for testing/demos
 * Only accessible when ENABLE_DEMO_MODE=true
 */
export default function DemoSigninPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDemoSignin = async (email: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await signIn("demo", {
        email,
        redirect: false,
      });

      if (result?.error) {
        setError("Failed to sign in. Please try again.");
        console.error("Demo signin error:", result.error);
      } else if (result?.ok) {
        // Redirect to dashboard
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error("Demo signin error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-2xl font-bold">H</span>
            </div>
            <h1 className="text-4xl font-bold">Hydra</h1>
          </div>
          <h2 className="text-2xl font-semibold mb-2">Demo Mode</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Select a user below to sign in instantly. Perfect for testing and
            demonstrations.
          </p>
        </div>

        {/* Warning Banner */}
        <Alert className="mb-6 max-w-2xl mx-auto border-amber-500/50 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-900 dark:text-amber-200">
            Demo Mode is enabled. This should only be used in development or
            demo environments. Disable ENABLE_DEMO_MODE in production.
          </AlertDescription>
        </Alert>

        {error && (
          <Alert variant="destructive" className="mb-6 max-w-2xl mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Demo User Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {DEMO_USERS.map((user) => (
            <DemoUserCard
              key={user.email}
              user={user}
              onClick={() => handleDemoSignin(user.email)}
              isLoading={isLoading}
            />
          ))}
        </div>

        {/* Alternative Signin Option */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Need to use a different account?
          </p>
          <Button variant="outline" asChild>
            <Link href="/signin">Sign in with Email</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
