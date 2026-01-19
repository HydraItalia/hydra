import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  computeVatFromGross,
  computeVatFromNet,
  getEffectiveTaxProfile,
} from "../vat";
import { prisma } from "../prisma";

// Mock prisma
vi.mock("../prisma", () => ({
  prisma: {
    product: {
      findUnique: vi.fn(),
    },
    taxProfile: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

describe("VAT computation helpers", () => {
  describe("computeVatFromGross", () => {
    it("should compute 10% VAT from gross=1000 -> net=909, vat=91", () => {
      const result = computeVatFromGross(1000, 1000); // 10% = 1000 bps
      expect(result).toEqual({
        netCents: 909,
        vatCents: 91,
        grossCents: 1000,
      });
      // Invariant check
      expect(result.netCents + result.vatCents).toBe(result.grossCents);
    });

    it("should compute 22% VAT from gross=1220 -> net=1000, vat=220", () => {
      const result = computeVatFromGross(1220, 2200); // 22% = 2200 bps
      expect(result).toEqual({
        netCents: 1000,
        vatCents: 220,
        grossCents: 1220,
      });
      // Invariant check
      expect(result.netCents + result.vatCents).toBe(result.grossCents);
    });

    it("should compute 22% VAT from gross=100 -> net=82, vat=18", () => {
      const result = computeVatFromGross(100, 2200); // 22% = 2200 bps
      // 100 * 10000 / 12200 = 81.967... -> rounds to 82
      expect(result).toEqual({
        netCents: 82,
        vatCents: 18,
        grossCents: 100,
      });
      // Invariant check
      expect(result.netCents + result.vatCents).toBe(result.grossCents);
    });

    it("should compute 4% VAT from gross=1040 -> net=1000, vat=40", () => {
      const result = computeVatFromGross(1040, 400); // 4% = 400 bps
      expect(result).toEqual({
        netCents: 1000,
        vatCents: 40,
        grossCents: 1040,
      });
      // Invariant check
      expect(result.netCents + result.vatCents).toBe(result.grossCents);
    });

    it("should handle 0% VAT (exempt) -> vat=0, net=gross", () => {
      const result = computeVatFromGross(1000, 0);
      expect(result).toEqual({
        netCents: 1000,
        vatCents: 0,
        grossCents: 1000,
      });
      // Invariant check
      expect(result.netCents + result.vatCents).toBe(result.grossCents);
    });

    it("should handle zero gross amount", () => {
      const result = computeVatFromGross(0, 2200);
      expect(result).toEqual({
        netCents: 0,
        vatCents: 0,
        grossCents: 0,
      });
      // Invariant check
      expect(result.netCents + result.vatCents).toBe(result.grossCents);
    });

    it("should throw error for negative gross amount", () => {
      expect(() => computeVatFromGross(-100, 2200)).toThrow(
        "grossCents cannot be negative",
      );
    });

    it("should throw error for negative VAT rate", () => {
      expect(() => computeVatFromGross(1000, -100)).toThrow(
        "vatRateBps cannot be negative",
      );
    });

    it("should maintain invariant: net + vat = gross for various amounts", () => {
      const testCases = [
        { gross: 1, rate: 2200 },
        { gross: 99, rate: 2200 },
        { gross: 123, rate: 1000 },
        { gross: 9999, rate: 2200 },
        { gross: 10000, rate: 400 },
        { gross: 100000, rate: 2200 },
      ];

      for (const { gross, rate } of testCases) {
        const result = computeVatFromGross(gross, rate);
        expect(result.netCents + result.vatCents).toBe(result.grossCents);
      }
    });
  });

  describe("computeVatFromNet", () => {
    it("should compute 10% VAT from net=1000 -> vat=100, gross=1100", () => {
      const result = computeVatFromNet(1000, 1000); // 10% = 1000 bps
      expect(result).toEqual({
        netCents: 1000,
        vatCents: 100,
        grossCents: 1100,
      });
      // Invariant check
      expect(result.netCents + result.vatCents).toBe(result.grossCents);
    });

    it("should compute 22% VAT from net=1000 -> vat=220, gross=1220", () => {
      const result = computeVatFromNet(1000, 2200); // 22% = 2200 bps
      expect(result).toEqual({
        netCents: 1000,
        vatCents: 220,
        grossCents: 1220,
      });
      // Invariant check
      expect(result.netCents + result.vatCents).toBe(result.grossCents);
    });

    it("should compute 4% VAT from net=1000 -> vat=40, gross=1040", () => {
      const result = computeVatFromNet(1000, 400); // 4% = 400 bps
      expect(result).toEqual({
        netCents: 1000,
        vatCents: 40,
        grossCents: 1040,
      });
      // Invariant check
      expect(result.netCents + result.vatCents).toBe(result.grossCents);
    });

    it("should handle 0% VAT (exempt) -> vat=0, gross=net", () => {
      const result = computeVatFromNet(1000, 0);
      expect(result).toEqual({
        netCents: 1000,
        vatCents: 0,
        grossCents: 1000,
      });
      // Invariant check
      expect(result.netCents + result.vatCents).toBe(result.grossCents);
    });

    it("should handle zero net amount", () => {
      const result = computeVatFromNet(0, 2200);
      expect(result).toEqual({
        netCents: 0,
        vatCents: 0,
        grossCents: 0,
      });
      // Invariant check
      expect(result.netCents + result.vatCents).toBe(result.grossCents);
    });

    it("should throw error for negative net amount", () => {
      expect(() => computeVatFromNet(-100, 2200)).toThrow(
        "netCents cannot be negative",
      );
    });

    it("should throw error for negative VAT rate", () => {
      expect(() => computeVatFromNet(1000, -100)).toThrow(
        "vatRateBps cannot be negative",
      );
    });

    it("should round VAT correctly for odd amounts", () => {
      // 99 * 2200 / 10000 = 21.78 -> rounds to 22
      const result = computeVatFromNet(99, 2200);
      expect(result.vatCents).toBe(22);
      expect(result.grossCents).toBe(121);
      // Invariant check
      expect(result.netCents + result.vatCents).toBe(result.grossCents);
    });

    it("should maintain invariant: net + vat = gross for various amounts", () => {
      const testCases = [
        { net: 1, rate: 2200 },
        { net: 99, rate: 2200 },
        { net: 123, rate: 1000 },
        { net: 9999, rate: 2200 },
        { net: 10000, rate: 400 },
        { net: 100000, rate: 2200 },
      ];

      for (const { net, rate } of testCases) {
        const result = computeVatFromNet(net, rate);
        expect(result.netCents + result.vatCents).toBe(result.grossCents);
      }
    });
  });

  describe("getEffectiveTaxProfile", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("should return product-level tax profile when set", async () => {
      const result = await getEffectiveTaxProfile({
        product: {
          taxProfileId: "tp-product",
          TaxProfile: { id: "tp-product", vatRateBps: 2200 },
          ProductCategory: {
            taxProfileId: "tp-category",
            TaxProfile: { id: "tp-category", vatRateBps: 1000 },
          },
        },
      });

      expect(result).toEqual({
        taxProfileId: "tp-product",
        vatRateBps: 2200,
      });
    });

    it("should return category-level tax profile when product has none", async () => {
      const result = await getEffectiveTaxProfile({
        product: {
          taxProfileId: null,
          TaxProfile: null,
          ProductCategory: {
            taxProfileId: "tp-category",
            TaxProfile: { id: "tp-category", vatRateBps: 1000 },
          },
        },
      });

      expect(result).toEqual({
        taxProfileId: "tp-category",
        vatRateBps: 1000,
      });
    });

    it("should fetch from DB when productId is provided", async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        taxProfileId: "tp-product",
        TaxProfile: { id: "tp-product", vatRateBps: 2200 },
        ProductCategory: {
          taxProfileId: "tp-category",
          TaxProfile: { id: "tp-category", vatRateBps: 1000 },
        },
      } as any);

      const result = await getEffectiveTaxProfile({
        productId: "prod-123",
      });

      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: "prod-123" },
        select: {
          taxProfileId: true,
          TaxProfile: {
            select: { id: true, vatRateBps: true },
          },
          ProductCategory: {
            select: {
              taxProfileId: true,
              TaxProfile: {
                select: { id: true, vatRateBps: true },
              },
            },
          },
        },
      });

      expect(result).toEqual({
        taxProfileId: "tp-product",
        vatRateBps: 2200,
      });
    });

    it("should return global fallback when product and category have no profile", async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        taxProfileId: null,
        TaxProfile: null,
        ProductCategory: {
          taxProfileId: null,
          TaxProfile: null,
        },
      } as any);

      // Combined query returns isDefault profile
      vi.mocked(prisma.taxProfile.findFirst).mockResolvedValue({
        id: "tp-default",
        vatRateBps: 2200,
      } as any);

      const result = await getEffectiveTaxProfile({
        productId: "prod-123",
      });

      // Verify combined fallback query
      expect(prisma.taxProfile.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ isDefault: true }, { name: "reduced_10" }],
        },
        orderBy: {
          isDefault: "desc",
        },
        select: { id: true, vatRateBps: true },
      });

      expect(result).toEqual({
        taxProfileId: "tp-default",
        vatRateBps: 2200,
      });
    });

    it("should throw error when no profiles exist (fail fast)", async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        taxProfileId: null,
        TaxProfile: null,
        ProductCategory: {
          taxProfileId: null,
          TaxProfile: null,
        },
      } as any);

      vi.mocked(prisma.taxProfile.findFirst).mockResolvedValue(null);

      await expect(
        getEffectiveTaxProfile({ productId: "prod-123" }),
      ).rejects.toThrow("No TaxProfile found for product");
    });

    it("should use fallback when product not found in DB", async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

      vi.mocked(prisma.taxProfile.findFirst).mockResolvedValue({
        id: "tp-fallback",
        vatRateBps: 1000,
      } as any);

      const result = await getEffectiveTaxProfile({
        productId: "non-existent-product",
      });

      expect(result).toEqual({
        taxProfileId: "tp-fallback",
        vatRateBps: 1000,
      });
    });
  });
});
