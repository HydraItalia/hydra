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
      select: { id: true, status: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (user.status === "APPROVED") {
      return { success: false, error: "User is already approved" };
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        approvedByUserId: admin.id,
      },
    });

    await logAction({
      entityType: "User",
      entityId: userId,
      action: AuditAction.USER_APPROVED,
      diff: { previousStatus: user.status },
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
      select: { id: true, status: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (user.status === "REJECTED") {
      return { success: false, error: "User is already rejected" };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { status: "REJECTED" },
    });

    await logAction({
      entityType: "User",
      entityId: userId,
      action: AuditAction.USER_REJECTED,
      diff: { previousStatus: user.status, reason: reason || null },
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
      select: { id: true, status: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (user.status === "SUSPENDED") {
      return { success: false, error: "User is already suspended" };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { status: "SUSPENDED" },
    });

    await logAction({
      entityType: "User",
      entityId: userId,
      action: AuditAction.USER_SUSPENDED,
      diff: { previousStatus: user.status, reason: reason || null },
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
      select: { id: true, status: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (user.status === "APPROVED") {
      return { success: false, error: "User is already active" };
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        approvedByUserId: admin.id,
      },
    });

    await logAction({
      entityType: "User",
      entityId: userId,
      action: AuditAction.USER_REACTIVATED,
      diff: { previousStatus: user.status },
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
