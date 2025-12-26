import { auth } from "../../auth";
import { redirect } from "next/navigation";

type Role = "ADMIN" | "AGENT" | "VENDOR" | "CLIENT" | "DRIVER";

/**
 * Get the current authenticated user
 * Returns null if not authenticated
 */
export async function currentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/**
 * Require authentication and optionally check roles
 * Redirects to signin if not authenticated or not authorized
 */
export async function requireRole(...allowedRoles: Role[]) {
  const user = await currentUser();

  if (!user) {
    redirect("/signin");
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    redirect("/unauthorized");
  }

  return user;
}

/**
 * Check if user can manage a specific vendor
 * Admin: all vendors
 * Agent: assigned vendors only
 * Vendor: their own vendor only
 */
export async function canManageVendor(
  user: Awaited<ReturnType<typeof currentUser>>,
  vendorId: string
): Promise<boolean> {
  if (!user) return false;

  // Admin can manage all vendors
  if (user.role === "ADMIN") return true;

  // Vendor can only manage their own
  if (user.role === "VENDOR" && user.vendorId === vendorId) return true;

  // Agent: check assignment (would need to query AgentVendor)
  if (user.role === "AGENT") {
    try {
      const { prisma } = await import("./prisma");
      const assignment = await prisma.agentVendor.findUnique({
        where: {
          userId_vendorId: {
            userId: user.id,
            vendorId,
          },
        },
      });
      return !!assignment;
    } catch (error) {
      console.error("Error checking vendor permissions:", error);
      return false;
    }
  }

  return false;
}

/**
 * Check if user can manage a specific client
 * Admin: all clients
 * Agent: assigned clients only
 * Client: their own client only
 */
export async function canManageClient(
  user: Awaited<ReturnType<typeof currentUser>>,
  clientId: string
): Promise<boolean> {
  if (!user) return false;

  // Admin can manage all clients
  if (user.role === "ADMIN") return true;

  // Client can only manage their own
  if (user.role === "CLIENT" && user.clientId === clientId) return true;

  // Agent: check assignment
  if (user.role === "AGENT") {
    try {
      const { prisma } = await import("./prisma");
      const assignment = await prisma.agentClient.findUnique({
        where: {
          userId_clientId: {
            userId: user.id,
            clientId,
          },
        },
      });
      return !!assignment;
    } catch (error) {
      console.error("Error checking client permissions:", error);
      return false;
    }
  }

  return false;
}

/**
 * Check if user can manage a specific delivery
 * Admin: all deliveries
 * Agent: deliveries for their assigned orders only
 * Driver: their own deliveries only
 */
export async function canManageDelivery(
  user: Awaited<ReturnType<typeof currentUser>>,
  deliveryId: string
): Promise<boolean> {
  if (!user) return false;

  // Admin can manage all deliveries
  if (user.role === "ADMIN") return true;

  // Agent: check if delivery is for one of their assigned orders
  if (user.role === "AGENT") {
    try {
      const { prisma } = await import("./prisma");
      const delivery = await prisma.delivery.findUnique({
        where: { id: deliveryId },
        select: {
          Order: {
            select: {
              assignedAgentUserId: true,
            },
          },
        },
      });
      return delivery?.Order?.assignedAgentUserId === user.id;
    } catch (error) {
      console.error("Error checking delivery permissions:", error);
      return false;
    }
  }

  // Driver can only manage their own deliveries
  if (user.role === "DRIVER" && user.driverId) {
    try {
      const { prisma } = await import("./prisma");
      const delivery = await prisma.delivery.findUnique({
        where: { id: deliveryId },
        select: { driverId: true },
      });
      return delivery?.driverId === user.driverId;
    } catch (error) {
      console.error("Error checking delivery permissions:", error);
      return false;
    }
  }

  return false;
}
