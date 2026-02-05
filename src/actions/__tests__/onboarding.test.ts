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
    vendorProfile: {
      create: vi.fn(),
    },
    vendorDocument: {
      createMany: vi.fn(),
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

  const validVendorInput = {
    legalName: "Pizzeria Roma S.r.l.",
    adminContact: {
      fullName: "Mario Rossi",
      role: "Owner",
      email: "info@roma.it",
      phone: "+39 06 1234567",
    },
    commercialContact: {
      fullName: "Luigi Verdi",
      role: "Sales",
      email: "sales@roma.it",
      phone: "+39 06 7654321",
    },
    dataProcessingConsent: true as const,
    marketingConsent: false,
    logoUsageConsent: false,
  };

  it("creates Vendor + VendorProfile + VendorUser + updates User for valid input", async () => {
    mockAuth("user-1");
    mockFreshUser();

    const result = await submitVendorOnboarding(validVendorInput);

    expect(result).toEqual({ success: true });
    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(prisma.vendor.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: "Pizzeria Roma S.r.l." }),
      }),
    );
    expect(prisma.vendorProfile.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          legalName: "Pizzeria Roma S.r.l.",
          dataProcessingConsent: true,
        }),
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
    const result = await submitVendorOnboarding(validVendorInput);
    expect(result).toEqual({ success: false, error: "Not authenticated" });
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("rejects duplicate submission (idempotency)", async () => {
    mockAuth("user-1");
    mockAlreadyOnboardedUser();
    const result = await submitVendorOnboarding(validVendorInput);
    expect(result).toEqual({
      success: false,
      error: "Onboarding already submitted",
    });
  });

  it("rejects empty legal name", async () => {
    mockAuth("user-1");
    mockFreshUser();
    const result = await submitVendorOnboarding({
      ...validVendorInput,
      legalName: "",
    });
    expect(result.success).toBe(false);
    expect("error" in result && result.error).toBeTruthy();
  });
});

// ─── Client Onboarding ───────────────────────────────────────────────────────

// Valid PRIVATE client input for tests
const validPrivateClientInput = {
  clientType: "PRIVATE" as const,
  fullName: "Mario Rossi",
  personalTaxCode: "RSSMRA80A01H501U",
  personalPhone: "+39 123 456 7890",
  personalEmail: "mario@example.com",
  residentialAddress: {
    street: "Via Roma 1",
    city: "Roma",
    province: "RM",
    postalCode: "00100",
    country: "Italy",
  },
  dataProcessingConsent: true as const,
  marketingConsent: false,
};

// Valid COMPANY client input for tests
const validCompanyClientInput = {
  clientType: "COMPANY" as const,
  legalName: "Acme Corp S.r.l.",
  vatNumber: "IT12345678901",
  registeredOfficeAddress: {
    street: "Via Milano 10",
    city: "Milano",
    province: "MI",
    postalCode: "20100",
    country: "Italy",
  },
  adminContact: {
    fullName: "Admin User",
    email: "admin@acme.it",
    phone: "+39 02 1234567",
  },
  dataProcessingConsent: true as const,
  marketingConsent: false,
};

describe("submitClientOnboarding (#159)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTransaction.mockImplementation(async (fn: any) => fn(prisma));
  });

  it("creates Client + ClientProfile + updates User for PRIVATE client", async () => {
    mockAuth("user-1");
    mockFreshUser();

    const result = await submitClientOnboarding(validPrivateClientInput);

    expect(result).toEqual({ success: true });
    expect(prisma.client.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: "Mario Rossi" }),
      }),
    );
    expect(prisma.clientProfile.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clientType: "PRIVATE",
          fullName: "Mario Rossi",
        }),
      }),
    );
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: "CLIENT", status: "PENDING" }),
      }),
    );
  });

  it("creates Client + ClientProfile + updates User for COMPANY client", async () => {
    mockAuth("user-1");
    mockFreshUser();

    const result = await submitClientOnboarding(validCompanyClientInput);

    expect(result).toEqual({ success: true });
    expect(prisma.client.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: "Acme Corp S.r.l." }),
      }),
    );
    expect(prisma.clientProfile.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clientType: "COMPANY",
          legalName: "Acme Corp S.r.l.",
        }),
      }),
    );
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: "CLIENT", status: "PENDING" }),
      }),
    );
  });

  it("rejects duplicate submission", async () => {
    mockAuth("user-1");
    mockAlreadyOnboardedUser();
    const result = await submitClientOnboarding(validPrivateClientInput);
    expect(result).toEqual({
      success: false,
      error: "Onboarding already submitted",
    });
  });

  it("rejects PRIVATE client without required fields", async () => {
    mockAuth("user-1");
    mockFreshUser();
    const result = await submitClientOnboarding({
      clientType: "PRIVATE",
      fullName: "", // missing required field
      dataProcessingConsent: true,
      marketingConsent: false,
    });
    expect(result.success).toBe(false);
  });

  it("rejects COMPANY client without required fields", async () => {
    mockAuth("user-1");
    mockFreshUser();
    const result = await submitClientOnboarding({
      clientType: "COMPANY",
      legalName: "", // missing required field
      dataProcessingConsent: true,
      marketingConsent: false,
    });
    expect(result.success).toBe(false);
  });
});

// ─── Driver Onboarding ───────────────────────────────────────────────────────

// Valid driver onboarding data for tests (raw input, before transforms)
const validDriverData: Parameters<typeof submitDriverOnboarding>[0] = {
  fullName: "Marco Rossi",
  birthDate: "1985-03-15",
  birthPlace: "Roma",
  taxCode: "RSSMRC85C15H501X",
  nationality: "Italiana",
  residentialAddress: {
    street: "Via Roma 123",
    city: "Roma",
    province: "RM",
    postalCode: "00100",
    country: "Italia",
  },
  phone: "+393334567890",
  email: "marco.rossi@example.com",
  idDocumentType: "ID_CARD",
  idDocumentNumber: "CA12345AB",
  idDocumentExpiry: "2030-01-01",
  idDocumentIssuer: "Comune di Roma",
  licenses: [
    {
      type: "C",
      number: "AB123456",
      issueDate: "2020-01-01",
      expiryDate: "2030-01-01",
      issuingAuthority: "Motorizzazione Roma",
      isCertification: false,
    },
  ],
  documents: [
    { type: "ID_DOCUMENT", label: "Carta d'identita" },
    { type: "DRIVING_LICENSE", label: "Patente" },
    { type: "SIGNED_GDPR_FORM", label: "Privacy" },
  ],
  vendorId: "vendor-1",
  dataProcessingConsent: true,
  operationalCommsConsent: false,
  geolocationConsent: false,
  imageUsageConsent: false,
};

describe("submitDriverOnboarding (#159)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTransaction.mockImplementation(async (fn: any) => fn(prisma));
    // Mock driver taxCode uniqueness check
    vi.mocked(prisma.driver.findUnique).mockResolvedValue(null);
    // Mock vendor exists check
    vi.mocked(prisma.vendor.findUnique).mockResolvedValue({
      id: "vendor-1",
      name: "Test Vendor",
    } as any);
  });

  it("creates Driver + DriverProfile + DriverLicense + DriverDocument + DriverCompanyLink for valid input", async () => {
    mockAuth("user-1");
    mockFreshUser();

    const result = await submitDriverOnboarding(validDriverData);

    expect(result).toEqual({ success: true });
    expect(prisma.driver.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "Marco Rossi",
          taxCode: "RSSMRC85C15H501X",
          onboardingStatus: "PENDING",
        }),
      }),
    );
    expect(prisma.driverProfile.create).toHaveBeenCalled();
    expect(prisma.driverLicense.createMany).toHaveBeenCalled();
    expect(prisma.driverDocument.createMany).toHaveBeenCalled();
    expect(prisma.driverCompanyLink.create).toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: "DRIVER", status: "PENDING" }),
      }),
    );
    expect(logAction).toHaveBeenCalled();
  });

  it("rejects invalid tax code format", async () => {
    mockAuth("user-1");
    mockFreshUser();
    const result = await submitDriverOnboarding({
      ...validDriverData,
      taxCode: "INVALID",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing licenses", async () => {
    mockAuth("user-1");
    mockFreshUser();
    const result = await submitDriverOnboarding({
      ...validDriverData,
      licenses: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects duplicate submission", async () => {
    mockAuth("user-1");
    mockAlreadyOnboardedUser();
    const result = await submitDriverOnboarding(validDriverData);
    expect(result).toEqual({
      success: false,
      error: "Onboarding already submitted",
    });
  });

  it("rejects duplicate tax code", async () => {
    mockAuth("user-1");
    mockFreshUser();
    // Mock existing driver with same taxCode
    vi.mocked(prisma.driver.findUnique).mockResolvedValue({
      id: "existing-driver",
    } as any);

    const result = await submitDriverOnboarding(validDriverData);
    expect(result).toEqual({
      success: false,
      error: "Tax code already registered",
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
