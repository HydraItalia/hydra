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
  type AgentOnboardingInput,
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
      findUnique: vi.fn(),
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
    clientProfile: {
      create: vi.fn(),
    },
    clientDocument: {
      createMany: vi.fn(),
    },
    clientVendor: {
      create: vi.fn(),
    },
    driver: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    driverProfile: {
      create: vi.fn(),
    },
    driverLicense: {
      createMany: vi.fn(),
    },
    driverDocument: {
      createMany: vi.fn(),
    },
    driverCompanyLink: {
      create: vi.fn(),
    },
    driverInvite: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    agent: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    agentProfile: {
      create: vi.fn(),
    },
    agentDocument: {
      createMany: vi.fn(),
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
    // Mock vendor exists check (uses findFirst with status filter)
    vi.mocked(prisma.vendor.findFirst).mockResolvedValue({
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

// Valid agent data for testing
const validAgentData: AgentOnboardingInput = {
  // Dati Anagrafici
  fullName: "Andrea Bianchi",
  birthDate: "1985-03-15",
  birthPlace: "Milano",
  taxCode: "BNCNDR85C15F205X",
  nationality: "Italiana",
  residentialAddress: {
    street: "Via Roma 1",
    city: "Milano",
    province: "MI",
    postalCode: "20100",
    country: "Italia",
  },
  phone: "+393331234567",
  email: "andrea@example.com",
  pecEmail: "andrea@pec.it",
  // Dati Professionali
  agentType: "MONOMANDATARIO",
  chamberRegistrationNumber: "MI-123456",
  chamberRegistrationDate: "2020-01-15",
  chamberName: "CCIAA Milano",
  professionalAssociations: "FNAARC",
  coveredTerritories: ["Lombardia", "Piemonte"],
  sectors: ["Food & Beverage", "HORECA"],
  // Dati Fiscali
  vatNumber: "IT12345678901",
  taxRegime: "ORDINARIO",
  atecoCode: "46.19.01",
  sdiRecipientCode: "ABC1234",
  invoicingPecEmail: "fatture@pec.it",
  enasarcoNumber: "EN-789012",
  enasarcoRegistrationDate: "2020-02-01",
  // Dati Bancari
  bankAccountHolder: "Andrea Bianchi",
  iban: "IT60X0542811101000000123456",
  bankNameBranch: "Banca Intesa - Milano Centro",
  preferredPaymentMethod: "BANK_TRANSFER",
  commissionNotes: "",
  // Documenti
  documents: [
    { type: "ID_DOCUMENT", label: "Carta d'identità" },
    { type: "TAX_CODE_CARD", label: "Codice fiscale" },
  ],
  // Consensi
  dataProcessingConsent: true,
  operationalCommsConsent: true,
  commercialImageConsent: false,
};

describe("submitAgentOnboarding (#159)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: agent taxCode not taken
    vi.mocked(prisma.agent.findUnique).mockResolvedValue(null);
    // Default: transaction executes callback
    mockTransaction.mockImplementation((cb: any) => cb(prisma));
  });

  it("creates Agent, AgentProfile, AgentDocument and updates User", async () => {
    mockAuth("user-1");
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      status: "ONBOARDING",
      role: "CLIENT",
      onboardingData: null,
      agentId: null,
      agentCode: null,
    } as any);
    // Agent code uniqueness checks
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
    vi.mocked(prisma.agent.findUnique).mockResolvedValueOnce(null);
    // Agent creation in transaction
    vi.mocked(prisma.agent.create).mockResolvedValue({ id: "agent-1" } as any);

    const result = await submitAgentOnboarding(validAgentData);

    expect(result).toEqual({ success: true });
    expect(mockTransaction).toHaveBeenCalled();
    expect(logAction).toHaveBeenCalledWith(
      expect.objectContaining({
        diff: expect.objectContaining({
          role: "AGENT",
          agentType: "MONOMANDATARIO",
          documentCount: 2,
          territoriesCount: 2,
          sectorsCount: 2,
        }),
      }),
    );
  });

  it("rejects duplicate taxCode", async () => {
    mockAuth("user-1");
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      status: "ONBOARDING",
      role: "CLIENT",
      onboardingData: null,
      agentId: null,
      agentCode: null,
    } as any);
    // taxCode already exists
    vi.mocked(prisma.agent.findUnique).mockResolvedValueOnce({
      id: "existing-agent",
    } as any);

    const result = await submitAgentOnboarding(validAgentData);
    expect(result).toEqual({
      success: false,
      error: "Codice fiscale già registrato",
    });
  });

  it("rejects duplicate submission (agentId already set)", async () => {
    mockAuth("user-1");
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      status: "PENDING",
      role: "AGENT",
      onboardingData: { some: "data" },
      agentId: "existing-agent-id",
      agentCode: "ANDREA",
    } as any);

    const result = await submitAgentOnboarding(validAgentData);
    expect(result).toEqual({
      success: false,
      error: "Onboarding already submitted",
    });
  });

  it("rejects invalid taxCode format", async () => {
    mockAuth("user-1");
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      status: "ONBOARDING",
      role: "CLIENT",
      onboardingData: null,
      agentId: null,
      agentCode: null,
    } as any);

    const result = await submitAgentOnboarding({
      ...validAgentData,
      taxCode: "INVALID",
    });
    expect(result.success).toBe(false);
    expect(result).toHaveProperty("error");
  });

  it("rejects invalid IBAN format", async () => {
    mockAuth("user-1");
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      status: "ONBOARDING",
      role: "CLIENT",
      onboardingData: null,
      agentId: null,
      agentCode: null,
    } as any);

    const result = await submitAgentOnboarding({
      ...validAgentData,
      iban: "INVALID_IBAN",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty territories", async () => {
    mockAuth("user-1");
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      status: "ONBOARDING",
      role: "CLIENT",
      onboardingData: null,
      agentId: null,
      agentCode: null,
    } as any);

    const result = await submitAgentOnboarding({
      ...validAgentData,
      coveredTerritories: [],
    });
    expect(result.success).toBe(false);
  });
});
