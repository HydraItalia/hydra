/**
 * Unit tests for audit logging helper
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { logAction, logBulkActions, AuditAction } from "../audit";

// Mock dependencies
vi.mock("../prisma", () => ({
  prisma: {
    auditLog: {
      create: vi.fn(),
      createMany: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock("../auth", () => ({
  currentUser: vi.fn(),
}));

vi.mock("@paralleldrive/cuid2", () => ({
  createId: vi.fn(() => "test-id-123"),
}));

import { prisma } from "../prisma";
import { currentUser } from "../auth";

describe("AuditAction constants", () => {
  it("should have all required action types", () => {
    expect(AuditAction.ORDER_STATUS_UPDATED).toBe("ORDER_STATUS_UPDATED");
    expect(AuditAction.AGENT_ASSIGNED_TO_ORDER).toBe("AGENT_ASSIGNED_TO_ORDER");
    expect(AuditAction.DELIVERY_CREATED).toBe("DELIVERY_CREATED");
    expect(AuditAction.CLIENT_UPDATED).toBe("CLIENT_UPDATED");
    expect(AuditAction.VENDOR_UPDATED).toBe("VENDOR_UPDATED");
  });
});

describe("logAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create audit log with current user as actor", async () => {
    // Mock currentUser to return an ADMIN user
    vi.mocked(currentUser).mockResolvedValue({
      id: "user-123",
      email: "admin@hydra.local",
      name: "Admin User",
      role: "ADMIN",
      vendorId: null,
      clientId: null,
      agentCode: null,
      driverId: null,
    });

    await logAction({
      entityType: "Order",
      entityId: "order-456",
      action: AuditAction.ORDER_STATUS_UPDATED,
      diff: { from: "SUBMITTED", to: "CONFIRMED" },
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        id: "test-id-123",
        actorUserId: "user-123",
        entityType: "Order",
        entityId: "order-456",
        action: "ORDER_STATUS_UPDATED",
        diff: { from: "SUBMITTED", to: "CONFIRMED" },
      },
    });
  });

  it("should handle null user (no actor)", async () => {
    // Mock currentUser to return null (not logged in)
    vi.mocked(currentUser).mockResolvedValue(null);

    await logAction({
      entityType: "Order",
      entityId: "order-456",
      action: AuditAction.ORDER_CREATED,
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: "test-id-123",
        actorUserId: null,
        entityType: "Order",
        entityId: "order-456",
        action: "ORDER_CREATED",
        // diff will be Prisma.JsonNull when no diff provided
      }),
    });
  });

  it("should handle missing diff parameter", async () => {
    vi.mocked(currentUser).mockResolvedValue({
      id: "agent-789",
      email: "andrea@hydra.local",
      name: "Andrea",
      role: "AGENT",
      vendorId: null,
      clientId: null,
      agentCode: "ANDREA",
      driverId: null,
    });

    await logAction({
      entityType: "Client",
      entityId: "client-111",
      action: AuditAction.AGENT_ASSIGNED_TO_CLIENT,
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: "test-id-123",
        actorUserId: "agent-789",
        entityType: "Client",
        entityId: "client-111",
        action: "AGENT_ASSIGNED_TO_CLIENT",
        // diff will be Prisma.JsonNull when no diff provided
      }),
    });
  });

  it("should not throw on database errors", async () => {
    vi.mocked(currentUser).mockResolvedValue({
      id: "user-123",
      email: "admin@hydra.local",
      name: "Admin User",
      role: "ADMIN",
      vendorId: null,
      clientId: null,
      agentCode: null,
      driverId: null,
    });

    // Simulate database error
    vi.mocked(prisma.auditLog.create).mockRejectedValue(
      new Error("Database connection failed")
    );

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    // Should not throw
    await expect(
      logAction({
        entityType: "Order",
        entityId: "order-456",
        action: AuditAction.ORDER_STATUS_UPDATED,
        diff: { from: "SUBMITTED", to: "CONFIRMED" },
      })
    ).resolves.not.toThrow();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to create audit log:",
      expect.objectContaining({
        entityType: "Order",
        entityId: "order-456",
        action: "ORDER_STATUS_UPDATED",
        error: "Database connection failed",
      })
    );

    consoleErrorSpy.mockRestore();
  });

  it("should log agent assignment with agent details", async () => {
    vi.mocked(currentUser).mockResolvedValue({
      id: "admin-123",
      email: "admin@hydra.local",
      name: "Admin User",
      role: "ADMIN",
      vendorId: null,
      clientId: null,
      agentCode: null,
      driverId: null,
    });

    await logAction({
      entityType: "Order",
      entityId: "order-789",
      action: AuditAction.AGENT_ASSIGNED_TO_ORDER,
      diff: {
        agentUserId: "agent-456",
        agentName: "Andrea",
        agentCode: "ANDREA",
      },
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        id: "test-id-123",
        actorUserId: "admin-123",
        entityType: "Order",
        entityId: "order-789",
        action: "AGENT_ASSIGNED_TO_ORDER",
        diff: {
          agentUserId: "agent-456",
          agentName: "Andrea",
          agentCode: "ANDREA",
        },
      },
    });
  });
});

describe("logBulkActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create multiple audit logs in one transaction", async () => {
    vi.mocked(currentUser).mockResolvedValue({
      id: "admin-123",
      email: "admin@hydra.local",
      name: "Admin User",
      role: "ADMIN",
      vendorId: null,
      clientId: null,
      agentCode: null,
      driverId: null,
    });

    const actions = [
      {
        entityType: "Order",
        entityId: "order-1",
        action: AuditAction.AGENT_ASSIGNED_TO_ORDER,
        diff: { agentUserId: "agent-123" },
      },
      {
        entityType: "Order",
        entityId: "order-2",
        action: AuditAction.AGENT_ASSIGNED_TO_ORDER,
        diff: { agentUserId: "agent-123" },
      },
      {
        entityType: "Order",
        entityId: "order-3",
        action: AuditAction.AGENT_ASSIGNED_TO_ORDER,
        diff: { agentUserId: "agent-123" },
      },
    ];

    await logBulkActions(actions);

    expect(prisma.auditLog.createMany).toHaveBeenCalledWith({
      data: [
        {
          id: "test-id-123",
          actorUserId: "admin-123",
          entityType: "Order",
          entityId: "order-1",
          action: "AGENT_ASSIGNED_TO_ORDER",
          diff: { agentUserId: "agent-123" },
        },
        {
          id: "test-id-123",
          actorUserId: "admin-123",
          entityType: "Order",
          entityId: "order-2",
          action: "AGENT_ASSIGNED_TO_ORDER",
          diff: { agentUserId: "agent-123" },
        },
        {
          id: "test-id-123",
          actorUserId: "admin-123",
          entityType: "Order",
          entityId: "order-3",
          action: "AGENT_ASSIGNED_TO_ORDER",
          diff: { agentUserId: "agent-123" },
        },
      ],
    });
  });

  it("should not throw on bulk insert errors", async () => {
    vi.mocked(currentUser).mockResolvedValue({
      id: "admin-123",
      email: "admin@hydra.local",
      name: "Admin User",
      role: "ADMIN",
      vendorId: null,
      clientId: null,
      agentCode: null,
      driverId: null,
    });

    vi.mocked(prisma.auditLog.createMany).mockRejectedValue(
      new Error("Bulk insert failed")
    );

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await expect(
      logBulkActions([
        {
          entityType: "Order",
          entityId: "order-1",
          action: AuditAction.AGENT_ASSIGNED_TO_ORDER,
        },
      ])
    ).resolves.not.toThrow();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to create bulk audit logs:",
      expect.objectContaining({
        count: 1,
        error: "Bulk insert failed",
      })
    );

    consoleErrorSpy.mockRestore();
  });
});
