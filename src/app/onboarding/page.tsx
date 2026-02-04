import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "../../../auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Store, UtensilsCrossed, Truck, Briefcase } from "lucide-react";

const ROLES = [
  {
    key: "vendor",
    label: "Vendor",
    description:
      "Supply products to restaurants and businesses. Manage your catalog, pricing, and orders.",
    icon: Store,
  },
  {
    key: "client",
    label: "Client",
    description:
      "Order supplies from vendors for your restaurant or business. Browse catalogs and place orders.",
    icon: UtensilsCrossed,
  },
  {
    key: "driver",
    label: "Driver",
    description:
      "Deliver orders from vendors to clients. Manage your shifts, routes, and deliveries.",
    icon: Truck,
  },
  {
    key: "agent",
    label: "Agent",
    description:
      "Manage vendor and client relationships. Oversee orders, agreements, and operations.",
    icon: Briefcase,
  },
] as const;

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  if (session.user.status === "APPROVED") {
    redirect("/dashboard");
  }

  if (session.user.status === "PENDING") {
    redirect("/pending");
  }

  return (
    <div className="w-full max-w-2xl space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Welcome to Hydra</h1>
        <p className="text-muted-foreground">
          Select your role to get started. This determines your experience on
          the platform.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {ROLES.map((role) => (
          <Link key={role.key} href={`/onboarding/${role.key}`}>
            <Card className="h-full cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] active:scale-100">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <role.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{role.label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{role.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
