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
      select: { id: true, status: true, driverId: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (user.status === "APPROVED") {
      return { success: false, error: "User is already approved" };
    }

    const now = new Date();

    // Use transaction to update both User and Driver (if applicable)
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
    });

    await logAction({
      entityType: "User",
      entityId: userId,
      action: AuditAction.USER_APPROVED,
      diff: {
        previousStatus: user.status,
        ...(user.driverId && { driverApproved: true }),
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
      select: { id: true, status: true, driverId: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (user.status === "REJECTED") {
      return { success: false, error: "User is already rejected" };
    }

    // Use transaction to update both User and Driver (if applicable)
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
    });

    await logAction({
      entityType: "User",
      entityId: userId,
      action: AuditAction.USER_REJECTED,
      diff: {
        previousStatus: user.status,
        reason: reason || null,
        ...(user.driverId && { driverRejected: true }),
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
      select: { id: true, status: true, driverId: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (user.status === "SUSPENDED") {
      return { success: false, error: "User is already suspended" };
    }

    const now = new Date();

    // Use transaction to update both User and Driver (if applicable)
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
    });

    await logAction({
      entityType: "User",
      entityId: userId,
      action: AuditAction.USER_SUSPENDED,
      diff: {
        previousStatus: user.status,
        reason: reason || null,
        ...(user.driverId && { driverSuspended: true }),
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
      select: { id: true, status: true, driverId: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (user.status === "APPROVED") {
      return { success: false, error: "User is already active" };
    }

    const now = new Date();

    // Use transaction to update both User and Driver (if applicable)
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
    });

    await logAction({
      entityType: "User",
      entityId: userId,
      action: AuditAction.USER_REACTIVATED,
      diff: {
        previousStatus: user.status,
        ...(user.driverId && { driverReactivated: true }),
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
