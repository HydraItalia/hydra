import { redirect } from "next/navigation";
import { auth } from "../../../../auth";
import { resolveDriverInvite, fetchApprovedVendors } from "@/data/vendors";
import { DriverOnboardingForm } from "./driver-onboarding-form";

type Props = {
  searchParams: Promise<{ invite?: string }>;
};

export default async function DriverOnboardingPage({ searchParams }: Props) {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  // Already has driver profile or is approved
  if (session.user.driverId || session.user.status === "APPROVED") {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const inviteToken = params.invite;

  // Resolve invite if present
  let inviteData: {
    vendorId: string;
    vendorName: string;
    inviteToken: string;
  } | null = null;

  if (inviteToken) {
    inviteData = await resolveDriverInvite(inviteToken);
  }

  // Fetch approved vendors for dropdown (only if no invite)
  const approvedVendors = !inviteData ? await fetchApprovedVendors() : [];

  return (
    <div className="w-full max-w-2xl space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Driver Registration
        </h1>
        <p className="text-muted-foreground">
          {inviteData
            ? `You've been invited by ${inviteData.vendorName}. Complete your registration below.`
            : "Provide your details to register as a delivery driver."}
        </p>
      </div>
      <DriverOnboardingForm
        userId={session.user.id}
        inviteData={inviteData}
        approvedVendors={approvedVendors}
      />
    </div>
  );
}
