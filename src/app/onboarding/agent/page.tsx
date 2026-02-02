import { redirect } from "next/navigation";
import { auth } from "../../../../auth";
import { AgentOnboardingForm } from "./agent-onboarding-form";

export default async function AgentOnboardingPage() {
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
          Agent Registration
        </h1>
        <p className="text-muted-foreground">
          Register as an agent to manage vendor and client relationships.
        </p>
      </div>
      <AgentOnboardingForm />
    </div>
  );
}
