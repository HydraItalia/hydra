/**
 * Unit tests for admin-orders server actions
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateOrderStatus, cancelOrder } from "../admin-orders";
import { OrderStatus } from "@prisma/client";

// Mock dependencies
vi.mock("@/lib/auth", () => ({
  requireRole: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/audit", () => ({
  logAction: vi.fn(),
  AuditAction: {
    ORDER_STATUS_UPDATED: "ORDER_STATUS_UPDATED",
    ORDER_CANCELLED: "ORDER_CANCELLED",
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/audit";
import { revalidatePath } from "next/cache";

describe("updateOrderStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should successfully update order status for valid transition", async () => {
    // Mock requireRole to not throw
    vi.mocked(requireRole).mockResolvedValue({
      id: "admin-123",
      email: "admin@hydra.local",
      name: "Admin User",
      role: "ADMIN",
      vendorId: null,
      clientId: null,
      agentCode: null,
      driverId: null,
    });

    // Mock order fetch
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: "order-456",
      status: "SUBMITTED",
    } as any);

    // Mock order update
    vi.mocked(prisma.order.update).mockResolvedValue({} as any);

    const result = await updateOrderStatus("order-456", "CONFIRMED");

    expect(result).toEqual({ success: true });
    expect(requireRole).toHaveBeenCalledWith("ADMIN", "AGENT");
    expect(prisma.order.findUnique).toHaveBeenCalledWith({
      where: { id: "order-456" },
      select: {
        id: true,
        status: true,
      },
    });
    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: "order-456" },
      data: { status: "CONFIRMED" },
    });
    expect(logAction).toHaveBeenCalledWith({
      entityType: "Order",
      entityId: "order-456",
      action: "ORDER_STATUS_UPDATED",
      diff: { from: "SUBMITTED", to: "CONFIRMED" },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/orders");
  });

  it("should reject invalid transition", async () => {
    vi.mocked(requireRole).mockResolvedValue({
      id: "admin-123",
      email: "admin@hydra.local",
      name: "Admin User",
      role: "ADMIN",
      vendorId: null,
      clientId: null,
      agentCode: null,
      driverId: null,
    });

    // Mock order with SUBMITTED status
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: "order-456",
      status: "SUBMITTED",
    } as any);

    // Try to transition to DELIVERED (invalid from SUBMITTED)
    const result = await updateOrderStatus("order-456", "DELIVERED");

    expect(result).toEqual({
      success: false,
      error: "Cannot transition from SUBMITTED to DELIVERED",
    });
    expect(prisma.order.update).not.toHaveBeenCalled();
    expect(logAction).not.toHaveBeenCalled();
  });

  it("should reject update for non-existent order", async () => {
    vi.mocked(requireRole).mockResolvedValue({
      id: "admin-123",
      email: "admin@hydra.local",
      name: "Admin User",
      role: "ADMIN",
      vendorId: null,
      clientId: null,
      agentCode: null,
      driverId: null,
    });

    // Mock order not found
    vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

    const result = await updateOrderStatus("order-999", "CONFIRMED");

    expect(result).toEqual({ success: false, error: "Order not found" });
    expect(prisma.order.update).not.toHaveBeenCalled();
    expect(logAction).not.toHaveBeenCalled();
  });

  it("should handle database errors gracefully", async () => {
    vi.mocked(requireRole).mockResolvedValue({
      id: "admin-123",
      email: "admin@hydra.local",
      name: "Admin User",
      role: "ADMIN",
      vendorId: null,
      clientId: null,
      agentCode: null,
      driverId: null,
    });

    // Mock database error
    vi.mocked(prisma.order.findUnique).mockRejectedValue(
      new Error("Database connection failed")
    );

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const result = await updateOrderStatus("order-456", "CONFIRMED");

    expect(result).toEqual({
      success: false,
      error: "Database connection failed",
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error updating order status:",
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  it("should allow all valid transitions", async () => {
    vi.mocked(requireRole).mockResolvedValue({
      id: "admin-123",
      email: "admin@hydra.local",
      name: "Admin User",
      role: "ADMIN",
      vendorId: null,
      clientId: null,
      agentCode: null,
      driverId: null,
    });

    vi.mocked(prisma.order.update).mockResolvedValue({} as any);

    const validTransitions: Array<[OrderStatus, OrderStatus]> = [
      ["DRAFT", "SUBMITTED"],
      ["DRAFT", "CANCELED"],
      ["SUBMITTED", "CONFIRMED"],
      ["SUBMITTED", "CANCELED"],
      ["CONFIRMED", "FULFILLING"],
      ["CONFIRMED", "CANCELED"],
      ["FULFILLING", "DELIVERED"],
      ["FULFILLING", "CANCELED"],
    ];

    for (const [from, to] of validTransitions) {
      vi.clearAllMocks();

      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: "order-123",
        status: from,
      } as any);

      const result = await updateOrderStatus("order-123", to);

      expect(result).toEqual({ success: true });
    }
  });

  it("should reject transitions from terminal states", async () => {
    vi.mocked(requireRole).mockResolvedValue({
      id: "admin-123",
      email: "admin@hydra.local",
      name: "Admin User",
      role: "ADMIN",
      vendorId: null,
      clientId: null,
      agentCode: null,
      driverId: null,
    });

    // Test DELIVERED (terminal state)
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: "order-123",
      status: "DELIVERED",
    } as any);

    const result1 = await updateOrderStatus("order-123", "SUBMITTED");
    expect(result1.success).toBe(false);

    // Test CANCELED (terminal state)
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: "order-123",
      status: "CANCELED",
    } as any);

    const result2 = await updateOrderStatus("order-123", "SUBMITTED");
    expect(result2.success).toBe(false);
  });
});

describe("cancelOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should successfully cancel an order with reason", async () => {
    vi.mocked(requireRole).mockResolvedValue({
      id: "admin-123",
      email: "admin@hydra.local",
      name: "Admin User",
      role: "ADMIN",
      vendorId: null,
      clientId: null,
      agentCode: null,
      driverId: null,
    });

    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: "order-456",
      status: "SUBMITTED",
    } as any);

    vi.mocked(prisma.order.update).mockResolvedValue({} as any);

    const result = await cancelOrder("order-456", "Client requested");

    expect(result).toEqual({ success: true });
    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: "order-456" },
      data: { status: "CANCELED" },
    });
    expect(logAction).toHaveBeenCalledWith({
      entityType: "Order",
      entityId: "order-456",
      action: "ORDER_CANCELLED",
      diff: {
        from: "SUBMITTED",
        to: "CANCELED",
        reason: "Client requested",
      },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/orders");
  });

  it("should successfully cancel an order without reason", async () => {
    vi.mocked(requireRole).mockResolvedValue({
      id: "admin-123",
      email: "admin@hydra.local",
      name: "Admin User",
      role: "ADMIN",
      vendorId: null,
      clientId: null,
      agentCode: null,
      driverId: null,
    });

    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: "order-456",
      status: "CONFIRMED",
    } as any);

    vi.mocked(prisma.order.update).mockResolvedValue({} as any);

    const result = await cancelOrder("order-456");

    expect(result).toEqual({ success: true });
    expect(logAction).toHaveBeenCalledWith({
      entityType: "Order",
      entityId: "order-456",
      action: "ORDER_CANCELLED",
      diff: {
        from: "CONFIRMED",
        to: "CANCELED",
        reason: null,
      },
    });
  });

  it("should reject canceling already canceled order", async () => {
    vi.mocked(requireRole).mockResolvedValue({
      id: "admin-123",
      email: "admin@hydra.local",
      name: "Admin User",
      role: "ADMIN",
      vendorId: null,
      clientId: null,
      agentCode: null,
      driverId: null,
    });

    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: "order-456",
      status: "CANCELED",
    } as any);

    const result = await cancelOrder("order-456");

    expect(result).toEqual({
      success: false,
      error: "Order is already canceled",
    });
    expect(prisma.order.update).not.toHaveBeenCalled();
    expect(logAction).not.toHaveBeenCalled();
  });

  it("should reject canceling delivered order", async () => {
    vi.mocked(requireRole).mockResolvedValue({
      id: "admin-123",
      email: "admin@hydra.local",
      name: "Admin User",
      role: "ADMIN",
      vendorId: null,
      clientId: null,
      agentCode: null,
      driverId: null,
    });

    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: "order-456",
      status: "DELIVERED",
    } as any);

    const result = await cancelOrder("order-456");

    expect(result).toEqual({
      success: false,
      error: "Cannot cancel a delivered order",
    });
    expect(prisma.order.update).not.toHaveBeenCalled();
    expect(logAction).not.toHaveBeenCalled();
  });

  it("should reject canceling non-existent order", async () => {
    vi.mocked(requireRole).mockResolvedValue({
      id: "admin-123",
      email: "admin@hydra.local",
      name: "Admin User",
      role: "ADMIN",
      vendorId: null,
      clientId: null,
      agentCode: null,
      driverId: null,
    });

    vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

    const result = await cancelOrder("order-999");

    expect(result).toEqual({ success: false, error: "Order not found" });
    expect(prisma.order.update).not.toHaveBeenCalled();
    expect(logAction).not.toHaveBeenCalled();
  });

  it("should handle database errors gracefully", async () => {
    vi.mocked(requireRole).mockResolvedValue({
      id: "admin-123",
      email: "admin@hydra.local",
      name: "Admin User",
      role: "ADMIN",
      vendorId: null,
      clientId: null,
      agentCode: null,
      driverId: null,
    });

    vi.mocked(prisma.order.findUnique).mockRejectedValue(
      new Error("Database error")
    );

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const result = await cancelOrder("order-456");

    expect(result).toEqual({
      success: false,
      error: "Database error",
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error canceling order:",
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });
});
