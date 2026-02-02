import { redirect } from "next/navigation";
import { auth } from "../../../../auth";
import { DriverOnboardingForm } from "./driver-onboarding-form";

export default async function DriverOnboardingPage() {
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
          Driver Registration
        </h1>
        <p className="text-muted-foreground">
          Provide your details to register as a delivery driver.
        </p>
      </div>
      <DriverOnboardingForm />
    </div>
  );
}
