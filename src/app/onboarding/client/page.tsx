import { redirect } from "next/navigation";
import { auth } from "../../../../auth";
import { ClientOnboardingForm } from "./client-onboarding-form";

export default async function ClientOnboardingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  if (session.user.status === "APPROVED") {
    redirect("/dashboard");
  }

  return (
    <div className="w-full max-w-lg space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Client Registration
        </h1>
        <p className="text-muted-foreground">
          Tell us about your business. You can optionally request a link to a
          vendor.
        </p>
      </div>
      <ClientOnboardingForm />
    </div>
  );
}
