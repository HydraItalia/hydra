import { redirect } from "next/navigation";
import { auth } from "../../../../auth";
import { AgentOnboardingForm } from "./agent-onboarding-form";

export default async function AgentOnboardingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  // Already has agent profile or is approved
  if (session.user.agentCode || session.user.status === "APPROVED") {
    redirect("/dashboard");
  }

  return (
    <div className="w-full max-w-2xl space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Registrazione Agente
        </h1>
        <p className="text-muted-foreground">
          Compila il modulo per registrarti come Agente di Commercio.
        </p>
      </div>
      <AgentOnboardingForm userId={session.user.id} />
    </div>
  );
}
