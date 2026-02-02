/**
 * #159 — QA: Onboarding server action tests
 *
 * Tests all 4 onboarding form submissions (vendor, client, driver, agent)
 * for correctness, validation, and idempotency.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  submitVendorOnboarding,
  submitClientOnboarding,
  submitDriverOnboarding,
  submitAgentOnboarding,
} from "../onboarding";

// ─── Mocks ───────────────────────────────────────────────────────────────────

const { mockTransaction } = vi.hoisted(() => ({
  mockTransaction: vi.fn(),
}));

vi.mock("../../../auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    vendor: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    vendorUser: {
      create: vi.fn(),
    },
    client: {
      create: vi.fn(),
    },
    clientVendor: {
      create: vi.fn(),
    },
    driver: {
      create: vi.fn(),
    },
    $transaction: mockTransaction,
  },
}));

vi.mock("@/lib/audit", () => ({
  logAction: vi.fn(),
  AuditAction: {
    ONBOARDING_SUBMITTED: "ONBOARDING_SUBMITTED",
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@paralleldrive/cuid2", () => ({
  createId: vi.fn(() => "mock-cuid-123"),
}));

import { auth } from "../../../auth";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/audit";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mockAuth(userId: string | null) {
  vi.mocked(auth).mockResolvedValue(
    userId ? ({ user: { id: userId, email: "test@test.com" } } as any) : null,
  );
}

function mockFreshUser() {
  vi.mocked(prisma.user.findUnique).mockResolvedValue({
    status: "PENDING",
    role: "CLIENT",
    onboardingData: null,
  } as any);
}

function mockAlreadyOnboardedUser() {
  vi.mocked(prisma.user.findUnique).mockResolvedValue({
    status: "PENDING",
    role: "VENDOR",
    onboardingData: { businessName: "Already Done" },
  } as any);
}

// ─── Vendor Onboarding ───────────────────────────────────────────────────────

describe("submitVendorOnboarding (#159)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTransaction.mockImplementation(async (fn: any) => fn(prisma));
  });

  it("creates Vendor + VendorUser + updates User for valid input", async () => {
    mockAuth("user-1");
    mockFreshUser();

    const result = await submitVendorOnboarding({
      businessName: "Pizzeria Roma",
      contactEmail: "info@roma.it",
    });

    expect(result).toEqual({ success: true });
    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(prisma.vendor.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: "Pizzeria Roma" }),
      }),
    );
    expect(prisma.vendorUser.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: "OWNER" }),
      }),
    );
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: "VENDOR", status: "PENDING" }),
      }),
    );
    expect(logAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "ONBOARDING_SUBMITTED",
        diff: expect.objectContaining({ role: "VENDOR" }),
      }),
    );
  });

  it("rejects unauthenticated user", async () => {
    mockAuth(null);
    const result = await submitVendorOnboarding({ businessName: "Test" });
    expect(result).toEqual({ success: false, error: "Not authenticated" });
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("rejects duplicate submission (idempotency)", async () => {
    mockAuth("user-1");
    mockAlreadyOnboardedUser();
    const result = await submitVendorOnboarding({ businessName: "Test" });
    expect(result).toEqual({
      success: false,
      error: "Onboarding already submitted",
    });
  });

  it("rejects empty business name", async () => {
    mockAuth("user-1");
    mockFreshUser();
    const result = await submitVendorOnboarding({ businessName: "" });
    expect(result.success).toBe(false);
    expect("error" in result && result.error).toBeTruthy();
  });
});

// ─── Client Onboarding ───────────────────────────────────────────────────────

describe("submitClientOnboarding (#159)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTransaction.mockImplementation(async (fn: any) => fn(prisma));
  });

  it("creates Client + updates User for valid input", async () => {
    mockAuth("user-1");
    mockFreshUser();

    const result = await submitClientOnboarding({
      businessName: "Acme Corp",
      region: "Milano",
    });

    expect(result).toEqual({ success: true });
    expect(prisma.client.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: "Acme Corp" }),
      }),
    );
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: "CLIENT", status: "PENDING" }),
      }),
    );
  });

  it("creates ClientVendor link when vendor is found", async () => {
    mockAuth("user-1");
    mockFreshUser();
    vi.mocked(prisma.vendor.findFirst).mockResolvedValue({
      id: "vendor-99",
    } as any);

    const result = await submitClientOnboarding({
      businessName: "Acme Corp",
      vendorName: "Pizzeria Roma",
    });

    expect(result).toEqual({ success: true });
    expect(prisma.clientVendor.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          vendorId: "vendor-99",
          status: "PENDING",
        }),
      }),
    );
  });

  it("succeeds without ClientVendor when vendor not found", async () => {
    mockAuth("user-1");
    mockFreshUser();
    vi.mocked(prisma.vendor.findFirst).mockResolvedValue(null);

    const result = await submitClientOnboarding({
      businessName: "Acme Corp",
      vendorName: "Nonexistent Vendor",
    });

    expect(result).toEqual({ success: true });
    expect(prisma.clientVendor.create).not.toHaveBeenCalled();
  });

  it("rejects duplicate submission", async () => {
    mockAuth("user-1");
    mockAlreadyOnboardedUser();
    const result = await submitClientOnboarding({ businessName: "Test" });
    expect(result).toEqual({
      success: false,
      error: "Onboarding already submitted",
    });
  });

  it("rejects empty business name", async () => {
    mockAuth("user-1");
    mockFreshUser();
    const result = await submitClientOnboarding({ businessName: "" });
    expect(result.success).toBe(false);
  });
});

// ─── Driver Onboarding ───────────────────────────────────────────────────────

describe("submitDriverOnboarding (#159)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTransaction.mockImplementation(async (fn: any) => fn(prisma));
  });

  it("creates Driver + updates User for valid input", async () => {
    mockAuth("user-1");
    mockFreshUser();

    const result = await submitDriverOnboarding({
      fullName: "Marco Rossi",
      phone: "+39 123 456 7890",
      region: "Roma",
    });

    expect(result).toEqual({ success: true });
    expect(prisma.driver.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: "Marco Rossi" }),
      }),
    );
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: "DRIVER", status: "PENDING" }),
      }),
    );
    expect(logAction).toHaveBeenCalled();
  });

  it("rejects missing phone", async () => {
    mockAuth("user-1");
    mockFreshUser();
    const result = await submitDriverOnboarding({
      fullName: "Marco Rossi",
      phone: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing full name", async () => {
    mockAuth("user-1");
    mockFreshUser();
    const result = await submitDriverOnboarding({
      fullName: "",
      phone: "+39 123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects duplicate submission", async () => {
    mockAuth("user-1");
    mockAlreadyOnboardedUser();
    const result = await submitDriverOnboarding({
      fullName: "Test",
      phone: "123",
    });
    expect(result).toEqual({
      success: false,
      error: "Onboarding already submitted",
    });
  });
});

// ─── Agent Onboarding ────────────────────────────────────────────────────────

describe("submitAgentOnboarding (#159)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates User with agent role and generated agentCode", async () => {
    mockAuth("user-1");
    mockFreshUser();
    // First findUnique for idempotency check, subsequent for agent code uniqueness
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce({
        status: "PENDING",
        role: "CLIENT",
        onboardingData: null,
      } as any)
      .mockResolvedValueOnce(null); // agentCode not taken

    const result = await submitAgentOnboarding({
      fullName: "Andrea Bianchi",
      phone: "+39 333",
      region: "Napoli",
    });

    expect(result).toEqual({ success: true });
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          role: "AGENT",
          status: "PENDING",
          agentCode: "ANDREA", // First name uppercased
        }),
      }),
    );
    expect(logAction).toHaveBeenCalledWith(
      expect.objectContaining({
        diff: expect.objectContaining({ role: "AGENT", agentCode: "ANDREA" }),
      }),
    );
  });

  it("appends suffix when agentCode is taken", async () => {
    mockAuth("user-1");
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce({
        status: "PENDING",
        role: "CLIENT",
        onboardingData: null,
      } as any)
      .mockResolvedValueOnce({ id: "existing" } as any) // "ANDREA" is taken
      .mockResolvedValueOnce(null); // "ANDREA1234" is free

    const result = await submitAgentOnboarding({
      fullName: "Andrea Bianchi",
    });

    expect(result).toEqual({ success: true });
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          role: "AGENT",
          agentCode: expect.stringMatching(/^ANDREA\d{4}$/),
        }),
      }),
    );
  });

  it("rejects duplicate submission", async () => {
    mockAuth("user-1");
    mockAlreadyOnboardedUser();
    const result = await submitAgentOnboarding({ fullName: "Test" });
    expect(result).toEqual({
      success: false,
      error: "Onboarding already submitted",
    });
  });

  it("rejects empty full name", async () => {
    mockAuth("user-1");
    mockFreshUser();
    // Need to also mock the agentCode check
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      status: "PENDING",
      role: "CLIENT",
      onboardingData: null,
    } as any);

    const result = await submitAgentOnboarding({ fullName: "" });
    expect(result.success).toBe(false);
  });
});
