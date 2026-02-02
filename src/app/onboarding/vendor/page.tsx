import { redirect } from "next/navigation";
import { auth } from "../../../../auth";
import { VendorOnboardingForm } from "./vendor-onboarding-form";

export default async function VendorOnboardingPage() {
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
          Vendor Registration
        </h1>
        <p className="text-muted-foreground">
          Tell us about your business. This information will be reviewed by an
          administrator.
        </p>
      </div>
      <VendorOnboardingForm />
    </div>
  );
}
