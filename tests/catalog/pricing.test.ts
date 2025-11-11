import { describe, it, expect, vi, beforeEach } from "vitest";
import { getEffectivePriceCents, calculateLineTotal } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    vendorProduct: {
      findUnique: vi.fn(),
    },
    agreement: {
      findFirst: vi.fn(),
    },
  },
}));

describe("Pricing Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getEffectivePriceCents", () => {
    const clientId = "client-123";
    const vendorProductId = "vp-123";
    const vendorId = "vendor-123";
    const basePriceCents = 1000;

    it("should return base price when no agreement exists", async () => {
      vi.mocked(prisma.vendorProduct.findUnique).mockResolvedValue({
        id: vendorProductId,
        basePriceCents,
        vendorId,
      } as any);

      vi.mocked(prisma.agreement.findFirst).mockResolvedValue(null);

      const price = await getEffectivePriceCents({ clientId, vendorProductId });
      expect(price).toBe(basePriceCents);
    });

    it("should throw error when vendor product not found", async () => {
      vi.mocked(prisma.vendorProduct.findUnique).mockResolvedValue(null);

      await expect(
        getEffectivePriceCents({ clientId, vendorProductId })
      ).rejects.toThrow("VendorProduct vp-123 not found");
    });

    it("should return base price with BASE mode agreement", async () => {
      vi.mocked(prisma.vendorProduct.findUnique).mockResolvedValue({
        id: vendorProductId,
        basePriceCents,
        vendorId,
      } as any);

      vi.mocked(prisma.agreement.findFirst).mockResolvedValue({
        id: "agreement-123",
        priceMode: "BASE",
        clientId,
        vendorId,
      } as any);

      const price = await getEffectivePriceCents({ clientId, vendorProductId });
      expect(price).toBe(basePriceCents);
    });

    it("should apply 10% discount with DISCOUNT mode", async () => {
      vi.mocked(prisma.vendorProduct.findUnique).mockResolvedValue({
        id: vendorProductId,
        basePriceCents,
        vendorId,
      } as any);

      vi.mocked(prisma.agreement.findFirst).mockResolvedValue({
        id: "agreement-123",
        priceMode: "DISCOUNT",
        discountPct: 0.1, // 10%
        clientId,
        vendorId,
      } as any);

      const price = await getEffectivePriceCents({ clientId, vendorProductId });
      expect(price).toBe(900); // 1000 - 10%
    });

    it("should apply 25% discount with DISCOUNT mode", async () => {
      vi.mocked(prisma.vendorProduct.findUnique).mockResolvedValue({
        id: vendorProductId,
        basePriceCents: 2000,
        vendorId,
      } as any);

      vi.mocked(prisma.agreement.findFirst).mockResolvedValue({
        id: "agreement-123",
        priceMode: "DISCOUNT",
        discountPct: 0.25, // 25%
        clientId,
        vendorId,
      } as any);

      const price = await getEffectivePriceCents({ clientId, vendorProductId });
      expect(price).toBe(1500); // 2000 - 25%
    });

    it("should throw error when DISCOUNT mode has no discountPct", async () => {
      vi.mocked(prisma.vendorProduct.findUnique).mockResolvedValue({
        id: vendorProductId,
        basePriceCents,
        vendorId,
      } as any);

      vi.mocked(prisma.agreement.findFirst).mockResolvedValue({
        id: "agreement-123",
        priceMode: "DISCOUNT",
        discountPct: null,
        clientId,
        vendorId,
      } as any);

      await expect(
        getEffectivePriceCents({ clientId, vendorProductId })
      ).rejects.toThrow("DISCOUNT mode but no discountPct");
    });

    it("should throw error when DISCOUNT has invalid percentage (negative)", async () => {
      vi.mocked(prisma.vendorProduct.findUnique).mockResolvedValue({
        id: vendorProductId,
        basePriceCents,
        vendorId,
      } as any);

      vi.mocked(prisma.agreement.findFirst).mockResolvedValue({
        id: "agreement-123",
        priceMode: "DISCOUNT",
        discountPct: -0.1,
        clientId,
        vendorId,
      } as any);

      await expect(
        getEffectivePriceCents({ clientId, vendorProductId })
      ).rejects.toThrow("invalid discountPct");
    });

    it("should throw error when DISCOUNT has invalid percentage (>50%)", async () => {
      vi.mocked(prisma.vendorProduct.findUnique).mockResolvedValue({
        id: vendorProductId,
        basePriceCents,
        vendorId,
      } as any);

      vi.mocked(prisma.agreement.findFirst).mockResolvedValue({
        id: "agreement-123",
        priceMode: "DISCOUNT",
        discountPct: 0.6, // 60%
        clientId,
        vendorId,
      } as any);

      await expect(
        getEffectivePriceCents({ clientId, vendorProductId })
      ).rejects.toThrow("invalid discountPct");
    });

    it("should use override price with OVERRIDE mode", async () => {
      vi.mocked(prisma.vendorProduct.findUnique).mockResolvedValue({
        id: vendorProductId,
        basePriceCents,
        vendorId,
      } as any);

      vi.mocked(prisma.agreement.findFirst).mockResolvedValue({
        id: "agreement-123",
        priceMode: "OVERRIDE",
        overridePriceCents: 750,
        clientId,
        vendorId,
      } as any);

      const price = await getEffectivePriceCents({ clientId, vendorProductId });
      expect(price).toBe(750);
    });

    it("should throw error when OVERRIDE mode has no overridePriceCents", async () => {
      vi.mocked(prisma.vendorProduct.findUnique).mockResolvedValue({
        id: vendorProductId,
        basePriceCents,
        vendorId,
      } as any);

      vi.mocked(prisma.agreement.findFirst).mockResolvedValue({
        id: "agreement-123",
        priceMode: "OVERRIDE",
        overridePriceCents: null,
        clientId,
        vendorId,
      } as any);

      await expect(
        getEffectivePriceCents({ clientId, vendorProductId })
      ).rejects.toThrow("OVERRIDE mode but no overridePriceCents");
    });

    it("should throw error when OVERRIDE price is zero", async () => {
      vi.mocked(prisma.vendorProduct.findUnique).mockResolvedValue({
        id: vendorProductId,
        basePriceCents,
        vendorId,
      } as any);

      vi.mocked(prisma.agreement.findFirst).mockResolvedValue({
        id: "agreement-123",
        priceMode: "OVERRIDE",
        overridePriceCents: 0,
        clientId,
        vendorId,
      } as any);

      await expect(
        getEffectivePriceCents({ clientId, vendorProductId })
      ).rejects.toThrow("invalid overridePriceCents");
    });

    it("should throw error when OVERRIDE price is negative", async () => {
      vi.mocked(prisma.vendorProduct.findUnique).mockResolvedValue({
        id: vendorProductId,
        basePriceCents,
        vendorId,
      } as any);

      vi.mocked(prisma.agreement.findFirst).mockResolvedValue({
        id: "agreement-123",
        priceMode: "OVERRIDE",
        overridePriceCents: -100,
        clientId,
        vendorId,
      } as any);

      await expect(
        getEffectivePriceCents({ clientId, vendorProductId })
      ).rejects.toThrow("invalid overridePriceCents");
    });

    it("should round discount calculations correctly", async () => {
      vi.mocked(prisma.vendorProduct.findUnique).mockResolvedValue({
        id: vendorProductId,
        basePriceCents: 333, // Price that doesn't divide evenly
        vendorId,
      } as any);

      vi.mocked(prisma.agreement.findFirst).mockResolvedValue({
        id: "agreement-123",
        priceMode: "DISCOUNT",
        discountPct: 0.15, // 15%
        clientId,
        vendorId,
      } as any);

      const price = await getEffectivePriceCents({ clientId, vendorProductId });
      expect(price).toBe(283); // Math.round(333 * 0.85) = 283
    });
  });

  describe("calculateLineTotal", () => {
    it("should calculate line total correctly", () => {
      const qty = 5;
      const unitPriceCents = 1000;
      const total = calculateLineTotal(qty, unitPriceCents);
      expect(total).toBe(5000);
    });

    it("should handle zero quantity", () => {
      const total = calculateLineTotal(0, 1000);
      expect(total).toBe(0);
    });

    it("should handle zero price", () => {
      const total = calculateLineTotal(5, 0);
      expect(total).toBe(0);
    });

    it("should throw error for negative quantity", () => {
      expect(() => calculateLineTotal(-1, 1000)).toThrow(
        "Quantity cannot be negative"
      );
    });

    it("should throw error for negative price", () => {
      expect(() => calculateLineTotal(5, -100)).toThrow(
        "Unit price cannot be negative"
      );
    });

    it("should handle large quantities", () => {
      const qty = 1000;
      const unitPriceCents = 2500;
      const total = calculateLineTotal(qty, unitPriceCents);
      expect(total).toBe(2500000);
    });

    it("should handle fractional quantities (for weight-based units)", () => {
      const qty = 2.5;
      const unitPriceCents = 1000;
      const total = calculateLineTotal(qty, unitPriceCents);
      expect(total).toBe(2500);
    });
  });
});
