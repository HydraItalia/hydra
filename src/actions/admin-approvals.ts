"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logAction, AuditAction } from "@/lib/audit";
import { revalidatePath } from "next/cache";

type ActionResult = { success: true } | { success: false; error: string };

export async function approveUser(userId: string): Promise<ActionResult> {
  try {
    const admin = await requireRole("ADMIN");

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true, driverId: true, agentId: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (user.status === "APPROVED") {
      return { success: false, error: "User is already approved" };
    }

    const now = new Date();

    // Use transaction to update User, Driver, and Agent (if applicable)
    await prisma.$transaction(async (tx) => {
      // Update user status
      await tx.user.update({
        where: { id: userId },
        data: {
          status: "APPROVED",
          approvedAt: now,
          approvedByUserId: admin.id,
        },
      });

      // If user has a linked driver, also update driver onboarding status
      if (user.driverId) {
        await tx.driver.update({
          where: { id: user.driverId },
          data: {
            onboardingStatus: "APPROVED",
            approvedAt: now,
          },
        });
      }

      // If user has a linked agent, also update agent status
      if (user.agentId) {
        await tx.agent.update({
          where: { id: user.agentId },
          data: {
            status: "ACTIVE",
            approvedAt: now,
          },
        });
      }
    });

    await logAction({
      entityType: "User",
      entityId: userId,
      action: AuditAction.USER_APPROVED,
      diff: {
        previousStatus: user.status,
        ...(user.driverId && { driverApproved: true }),
        ...(user.agentId && { agentApproved: true }),
      },
    });

    revalidatePath("/dashboard/approvals");
    revalidatePath(`/dashboard/approvals/${userId}`);

    return { success: true };
  } catch (error) {
    console.error("Error approving user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to approve user",
    };
  }
}

export async function rejectUser(
  userId: string,
  reason?: string,
): Promise<ActionResult> {
  try {
    await requireRole("ADMIN");

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true, driverId: true, agentId: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (user.status === "REJECTED") {
      return { success: false, error: "User is already rejected" };
    }

    // Use transaction to update User, Driver, and Agent (if applicable)
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { status: "REJECTED" },
      });

      // If user has a linked driver, also update driver onboarding status
      if (user.driverId) {
        await tx.driver.update({
          where: { id: user.driverId },
          data: {
            onboardingStatus: "REJECTED",
          },
        });
      }

      // If user has a linked agent, also update agent status
      if (user.agentId) {
        await tx.agent.update({
          where: { id: user.agentId },
          data: {
            status: "REJECTED",
          },
        });
      }
    });

    await logAction({
      entityType: "User",
      entityId: userId,
      action: AuditAction.USER_REJECTED,
      diff: {
        previousStatus: user.status,
        reason: reason || null,
        ...(user.driverId && { driverRejected: true }),
        ...(user.agentId && { agentRejected: true }),
      },
    });

    revalidatePath("/dashboard/approvals");
    revalidatePath(`/dashboard/approvals/${userId}`);

    return { success: true };
  } catch (error) {
    console.error("Error rejecting user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reject user",
    };
  }
}

export async function suspendUser(
  userId: string,
  reason?: string,
): Promise<ActionResult> {
  try {
    await requireRole("ADMIN");

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true, driverId: true, agentId: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (user.status === "SUSPENDED") {
      return { success: false, error: "User is already suspended" };
    }

    const now = new Date();

    // Use transaction to update User, Driver, and Agent (if applicable)
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { status: "SUSPENDED" },
      });

      // If user has a linked driver, also update driver status
      if (user.driverId) {
        await tx.driver.update({
          where: { id: user.driverId },
          data: {
            onboardingStatus: "SUSPENDED",
            suspendedAt: now,
            suspendedReason: reason || null,
          },
        });
      }

      // If user has a linked agent, also update agent status
      if (user.agentId) {
        await tx.agent.update({
          where: { id: user.agentId },
          data: {
            status: "SUSPENDED",
            suspendedAt: now,
            suspendedReason: reason || null,
          },
        });
      }
    });

    await logAction({
      entityType: "User",
      entityId: userId,
      action: AuditAction.USER_SUSPENDED,
      diff: {
        previousStatus: user.status,
        reason: reason || null,
        ...(user.driverId && { driverSuspended: true }),
        ...(user.agentId && { agentSuspended: true }),
      },
    });

    revalidatePath("/dashboard/approvals");
    revalidatePath(`/dashboard/approvals/${userId}`);

    return { success: true };
  } catch (error) {
    console.error("Error suspending user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to suspend user",
    };
  }
}

export async function reactivateUser(userId: string): Promise<ActionResult> {
  try {
    const admin = await requireRole("ADMIN");

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true, driverId: true, agentId: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (user.status === "APPROVED") {
      return { success: false, error: "User is already active" };
    }

    const now = new Date();

    // Use transaction to update User, Driver, and Agent (if applicable)
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          status: "APPROVED",
          approvedAt: now,
          approvedByUserId: admin.id,
        },
      });

      // If user has a linked driver, also reactivate driver
      if (user.driverId) {
        await tx.driver.update({
          where: { id: user.driverId },
          data: {
            onboardingStatus: "APPROVED",
            approvedAt: now,
            suspendedAt: null,
            suspendedReason: null,
          },
        });
      }

      // If user has a linked agent, also reactivate agent
      if (user.agentId) {
        await tx.agent.update({
          where: { id: user.agentId },
          data: {
            status: "ACTIVE",
            approvedAt: now,
            suspendedAt: null,
            suspendedReason: null,
          },
        });
      }
    });

    await logAction({
      entityType: "User",
      entityId: userId,
      action: AuditAction.USER_REACTIVATED,
      diff: {
        previousStatus: user.status,
        ...(user.driverId && { driverReactivated: true }),
        ...(user.agentId && { agentReactivated: true }),
      },
    });

    revalidatePath("/dashboard/approvals");
    revalidatePath(`/dashboard/approvals/${userId}`);

    return { success: true };
  } catch (error) {
    console.error("Error reactivating user:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to reactivate user",
    };
  }
}
