/**
 * #160 — QA: Admin approval and linking action tests
 *
 * Tests approve/reject/suspend/reactivate user actions,
 * VendorUser and ClientVendor linking actions,
 * authorization checks, and audit logging.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  approveUser,
  rejectUser,
  suspendUser,
  reactivateUser,
} from "../admin-approvals";
import {
  linkVendorUser,
  unlinkVendorUser,
  updateVendorUserRole,
  createClientVendorLink,
  approveClientVendor,
  rejectClientVendor,
  removeClientVendorLink,
} from "../admin-linking";

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock("@/lib/auth", () => ({
  requireRole: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    vendor: {
      findUnique: vi.fn(),
    },
    client: {
      findUnique: vi.fn(),
    },
    vendorUser: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    clientVendor: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/audit", () => ({
  logAction: vi.fn(),
  AuditAction: {
    USER_APPROVED: "USER_APPROVED",
    USER_REJECTED: "USER_REJECTED",
    USER_SUSPENDED: "USER_SUSPENDED",
    USER_REACTIVATED: "USER_REACTIVATED",
    VENDOR_USER_LINKED: "VENDOR_USER_LINKED",
    VENDOR_USER_UNLINKED: "VENDOR_USER_UNLINKED",
    VENDOR_USER_ROLE_UPDATED: "VENDOR_USER_ROLE_UPDATED",
    CLIENT_VENDOR_CREATED: "CLIENT_VENDOR_CREATED",
    CLIENT_VENDOR_APPROVED: "CLIENT_VENDOR_APPROVED",
    CLIENT_VENDOR_REJECTED: "CLIENT_VENDOR_REJECTED",
    CLIENT_VENDOR_REMOVED: "CLIENT_VENDOR_REMOVED",
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/audit";
import { revalidatePath } from "next/cache";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const adminUser = {
  id: "admin-1",
  email: "admin@hydra.local",
  name: "Admin",
  role: "ADMIN" as const,
  status: "APPROVED" as const,
  vendorId: null,
  clientId: null,
  agentCode: null,
  driverId: null,
};

function mockAdmin() {
  vi.mocked(requireRole).mockResolvedValue(adminUser);
}

function mockNonAdmin() {
  vi.mocked(requireRole).mockRejectedValue(new Error("Unauthorized"));
}

// ─── User Approval Actions (#155) ────────────────────────────────────────────

describe("approveUser (#160)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("approves a PENDING user", async () => {
    mockAdmin();
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      status: "PENDING",
    } as any);

    const result = await approveUser("user-1");

    expect(result).toEqual({ success: true });
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-1" },
        data: expect.objectContaining({
          status: "APPROVED",
          approvedByUserId: "admin-1",
        }),
      }),
    );
    expect(logAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "USER_APPROVED",
        entityId: "user-1",
        diff: { previousStatus: "PENDING" },
      }),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/approvals");
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/approvals/user-1");
  });

  it("rejects if user is already APPROVED (idempotent guard)", async () => {
    mockAdmin();
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      status: "APPROVED",
    } as any);

    const result = await approveUser("user-1");
    expect(result).toEqual({
      success: false,
      error: "User is already approved",
    });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("returns error for non-existent user", async () => {
    mockAdmin();
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    const result = await approveUser("nonexistent");
    expect(result).toEqual({ success: false, error: "User not found" });
  });

  it("rejects non-ADMIN caller", async () => {
    mockNonAdmin();
    const result = await approveUser("user-1");
    expect(result.success).toBe(false);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
});

describe("rejectUser (#160)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a PENDING user with reason", async () => {
    mockAdmin();
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      status: "PENDING",
    } as any);

    const result = await rejectUser("user-1", "Incomplete documents");

    expect(result).toEqual({ success: true });
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: "REJECTED" },
      }),
    );
    expect(logAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "USER_REJECTED",
        diff: { previousStatus: "PENDING", reason: "Incomplete documents" },
      }),
    );
  });

  it("rejects if user is already REJECTED", async () => {
    mockAdmin();
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      status: "REJECTED",
    } as any);

    const result = await rejectUser("user-1");
    expect(result).toEqual({
      success: false,
      error: "User is already rejected",
    });
  });

  it("rejects non-ADMIN caller", async () => {
    mockNonAdmin();
    const result = await rejectUser("user-1");
    expect(result.success).toBe(false);
  });
});

describe("suspendUser (#160)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("suspends an APPROVED user", async () => {
    mockAdmin();
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      status: "APPROVED",
    } as any);

    const result = await suspendUser("user-1", "Violation of terms");

    expect(result).toEqual({ success: true });
    expect(logAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "USER_SUSPENDED",
        diff: { previousStatus: "APPROVED", reason: "Violation of terms" },
      }),
    );
  });

  it("rejects if user is already SUSPENDED", async () => {
    mockAdmin();
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      status: "SUSPENDED",
    } as any);

    const result = await suspendUser("user-1");
    expect(result).toEqual({
      success: false,
      error: "User is already suspended",
    });
  });
});

describe("reactivateUser (#160)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reactivates a SUSPENDED user", async () => {
    mockAdmin();
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      status: "SUSPENDED",
    } as any);

    const result = await reactivateUser("user-1");

    expect(result).toEqual({ success: true });
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "APPROVED",
          approvedByUserId: "admin-1",
        }),
      }),
    );
  });

  it("rejects if user is already APPROVED", async () => {
    mockAdmin();
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      status: "APPROVED",
    } as any);

    const result = await reactivateUser("user-1");
    expect(result).toEqual({
      success: false,
      error: "User is already active",
    });
  });
});

// ─── VendorUser Linking Actions (#156) ───────────────────────────────────────

describe("linkVendorUser (#160)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("links user to vendor with upsert", async () => {
    mockAdmin();
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
    } as any);
    vi.mocked(prisma.vendor.findUnique).mockResolvedValue({
      id: "vendor-1",
    } as any);

    const result = await linkVendorUser({
      userId: "user-1",
      vendorId: "vendor-1",
      role: "STAFF",
    });

    expect(result).toEqual({ success: true });
    expect(prisma.vendorUser.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { vendorId_userId: { vendorId: "vendor-1", userId: "user-1" } },
        create: { vendorId: "vendor-1", userId: "user-1", role: "STAFF" },
        update: { role: "STAFF" },
      }),
    );
    expect(logAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "VENDOR_USER_LINKED",
      }),
    );
  });

  it("returns error if user not found", async () => {
    mockAdmin();
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.vendor.findUnique).mockResolvedValue({ id: "v" } as any);

    const result = await linkVendorUser({
      userId: "bad",
      vendorId: "vendor-1",
      role: "OWNER",
    });
    expect(result).toEqual({ success: false, error: "User not found" });
  });

  it("returns error if vendor not found", async () => {
    mockAdmin();
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u" } as any);
    vi.mocked(prisma.vendor.findUnique).mockResolvedValue(null);

    const result = await linkVendorUser({
      userId: "user-1",
      vendorId: "bad",
      role: "OWNER",
    });
    expect(result).toEqual({ success: false, error: "Vendor not found" });
  });

  it("rejects non-ADMIN caller", async () => {
    mockNonAdmin();
    const result = await linkVendorUser({
      userId: "u",
      vendorId: "v",
      role: "OWNER",
    });
    expect(result.success).toBe(false);
  });
});

describe("unlinkVendorUser (#160)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes VendorUser link", async () => {
    mockAdmin();
    vi.mocked(prisma.vendorUser.deleteMany).mockResolvedValue({
      count: 1,
    } as any);

    const result = await unlinkVendorUser({
      userId: "user-1",
      vendorId: "vendor-1",
    });

    expect(result).toEqual({ success: true });
    expect(logAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: "VENDOR_USER_UNLINKED" }),
    );
  });

  it("succeeds idempotently when link does not exist", async () => {
    mockAdmin();
    vi.mocked(prisma.vendorUser.deleteMany).mockResolvedValue({
      count: 0,
    } as any);

    const result = await unlinkVendorUser({
      userId: "user-1",
      vendorId: "vendor-1",
    });

    expect(result).toEqual({ success: true });
    expect(logAction).not.toHaveBeenCalled(); // No audit for no-op
  });
});

describe("updateVendorUserRole (#160)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates role when link exists and role differs", async () => {
    mockAdmin();
    vi.mocked(prisma.vendorUser.findUnique).mockResolvedValue({
      role: "STAFF",
    } as any);

    const result = await updateVendorUserRole({
      userId: "user-1",
      vendorId: "vendor-1",
      role: "OWNER",
    });

    expect(result).toEqual({ success: true });
    expect(prisma.vendorUser.update).toHaveBeenCalled();
    expect(logAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "VENDOR_USER_ROLE_UPDATED",
        diff: expect.objectContaining({ from: "STAFF", to: "OWNER" }),
      }),
    );
  });

  it("is idempotent when role is already the target", async () => {
    mockAdmin();
    vi.mocked(prisma.vendorUser.findUnique).mockResolvedValue({
      role: "OWNER",
    } as any);

    const result = await updateVendorUserRole({
      userId: "user-1",
      vendorId: "vendor-1",
      role: "OWNER",
    });

    expect(result).toEqual({ success: true });
    expect(prisma.vendorUser.update).not.toHaveBeenCalled();
  });

  it("returns error when link not found", async () => {
    mockAdmin();
    vi.mocked(prisma.vendorUser.findUnique).mockResolvedValue(null);

    const result = await updateVendorUserRole({
      userId: "user-1",
      vendorId: "vendor-1",
      role: "AGENT",
    });

    expect(result).toEqual({
      success: false,
      error: "VendorUser link not found",
    });
  });
});

// ─── ClientVendor Linking Actions (#156) ─────────────────────────────────────

describe("createClientVendorLink (#160)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates PENDING link between client and vendor", async () => {
    mockAdmin();
    vi.mocked(prisma.client.findUnique).mockResolvedValue({ id: "c-1" } as any);
    vi.mocked(prisma.vendor.findUnique).mockResolvedValue({ id: "v-1" } as any);

    const result = await createClientVendorLink({
      clientId: "c-1",
      vendorId: "v-1",
    });

    expect(result).toEqual({ success: true });
    expect(prisma.clientVendor.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ status: "PENDING" }),
      }),
    );
    expect(logAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: "CLIENT_VENDOR_CREATED" }),
    );
  });

  it("returns error if client not found", async () => {
    mockAdmin();
    vi.mocked(prisma.client.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.vendor.findUnique).mockResolvedValue({ id: "v" } as any);

    const result = await createClientVendorLink({
      clientId: "bad",
      vendorId: "v-1",
    });
    expect(result).toEqual({ success: false, error: "Client not found" });
  });
});

describe("approveClientVendor (#160)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("approves a PENDING client-vendor link", async () => {
    mockAdmin();
    vi.mocked(prisma.clientVendor.findUnique).mockResolvedValue({
      id: "cv-1",
      status: "PENDING",
    } as any);

    const result = await approveClientVendor({
      clientId: "c-1",
      vendorId: "v-1",
    });

    expect(result).toEqual({ success: true });
    expect(prisma.clientVendor.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "APPROVED",
          approvedByUserId: "admin-1",
        }),
      }),
    );
    expect(logAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: "CLIENT_VENDOR_APPROVED" }),
    );
  });

  it("is idempotent when already APPROVED", async () => {
    mockAdmin();
    vi.mocked(prisma.clientVendor.findUnique).mockResolvedValue({
      id: "cv-1",
      status: "APPROVED",
    } as any);

    const result = await approveClientVendor({
      clientId: "c-1",
      vendorId: "v-1",
    });
    expect(result).toEqual({ success: true });
    expect(prisma.clientVendor.update).not.toHaveBeenCalled();
  });

  it("returns error when link not found", async () => {
    mockAdmin();
    vi.mocked(prisma.clientVendor.findUnique).mockResolvedValue(null);

    const result = await approveClientVendor({
      clientId: "bad",
      vendorId: "bad",
    });
    expect(result).toEqual({
      success: false,
      error: "Client-vendor link not found",
    });
  });
});

describe("rejectClientVendor (#160)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a PENDING client-vendor link", async () => {
    mockAdmin();
    vi.mocked(prisma.clientVendor.findUnique).mockResolvedValue({
      id: "cv-1",
      status: "PENDING",
    } as any);

    const result = await rejectClientVendor({
      clientId: "c-1",
      vendorId: "v-1",
    });

    expect(result).toEqual({ success: true });
    expect(logAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: "CLIENT_VENDOR_REJECTED" }),
    );
  });

  it("is idempotent when already REJECTED", async () => {
    mockAdmin();
    vi.mocked(prisma.clientVendor.findUnique).mockResolvedValue({
      id: "cv-1",
      status: "REJECTED",
    } as any);

    const result = await rejectClientVendor({
      clientId: "c-1",
      vendorId: "v-1",
    });
    expect(result).toEqual({ success: true });
    expect(prisma.clientVendor.update).not.toHaveBeenCalled();
  });
});

describe("removeClientVendorLink (#160)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("removes an existing link", async () => {
    mockAdmin();
    vi.mocked(prisma.clientVendor.deleteMany).mockResolvedValue({
      count: 1,
    } as any);

    const result = await removeClientVendorLink({
      clientId: "c-1",
      vendorId: "v-1",
    });

    expect(result).toEqual({ success: true });
    expect(logAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: "CLIENT_VENDOR_REMOVED" }),
    );
  });

  it("succeeds idempotently when link does not exist", async () => {
    mockAdmin();
    vi.mocked(prisma.clientVendor.deleteMany).mockResolvedValue({
      count: 0,
    } as any);

    const result = await removeClientVendorLink({
      clientId: "c-1",
      vendorId: "v-1",
    });

    expect(result).toEqual({ success: true });
    expect(logAction).not.toHaveBeenCalled();
  });
});
