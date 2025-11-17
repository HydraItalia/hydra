import { describe, it, expect, beforeEach, vi } from "vitest";
import { validateCartForCurrentUser } from "@/data/cart-validation";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/auth";

// Mock dependencies
vi.mock("@/lib/prisma", () => ({
  prisma: {
    cart: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  currentUser: vi.fn(),
}));

describe("validateCartForCurrentUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Authentication and Authorization", () => {
    it("should throw error when user is not authenticated", async () => {
      vi.mocked(currentUser).mockResolvedValue(null);

      await expect(validateCartForCurrentUser()).rejects.toThrow(
        "Unauthorized: User not authenticated"
      );
    });

    it("should throw error when user is not CLIENT role", async () => {
      vi.mocked(currentUser).mockResolvedValue({
        id: "user1",
        email: "agent@test.com",
        role: "AGENT",
        clientId: null,
        name: "Agent",
        agentCode: "AGENT1",
        vendorId: null,
      });

      await expect(validateCartForCurrentUser()).rejects.toThrow(
        "Unauthorized: Only CLIENT users can validate carts for checkout"
      );
    });

    it("should throw error when user has no clientId", async () => {
      vi.mocked(currentUser).mockResolvedValue({
        id: "user1",
        email: "client@test.com",
        role: "CLIENT",
        clientId: null,
        name: "Client",
        agentCode: null,
        vendorId: null,
      });

      await expect(validateCartForCurrentUser()).rejects.toThrow(
        "Unauthorized: User does not have an associated client account"
      );
    });
  });

  describe("Empty Cart Handling", () => {
    it("should return ok=true when cart is empty", async () => {
      vi.mocked(currentUser).mockResolvedValue({
        id: "user1",
        email: "client@test.com",
        role: "CLIENT",
        clientId: "client1",
        name: "Client",
        agentCode: null,
        vendorId: null,
      });

      vi.mocked(prisma.cart.findFirst).mockResolvedValue({
        id: "cart1",
        clientId: "client1",
        createdByUserId: "user1",
        status: "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [],
      } as any);

      const result = await validateCartForCurrentUser();

      expect(result).toEqual({
        ok: true,
        issues: [],
      });
    });

    it("should return ok=true when no cart exists", async () => {
      vi.mocked(currentUser).mockResolvedValue({
        id: "user1",
        email: "client@test.com",
        role: "CLIENT",
        clientId: "client1",
        name: "Client",
        agentCode: null,
        vendorId: null,
      });

      vi.mocked(prisma.cart.findFirst).mockResolvedValue(null);

      const result = await validateCartForCurrentUser();

      expect(result).toEqual({
        ok: true,
        issues: [],
      });
    });
  });

  describe("Stock Validation", () => {
    it("should return OUT_OF_STOCK error when stockQty is 0", async () => {
      vi.mocked(currentUser).mockResolvedValue({
        id: "user1",
        email: "client@test.com",
        role: "CLIENT",
        clientId: "client1",
        name: "Client",
        agentCode: null,
        vendorId: null,
      });

      vi.mocked(prisma.cart.findFirst).mockResolvedValue({
        id: "cart1",
        clientId: "client1",
        createdByUserId: "user1",
        status: "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [
          {
            id: "item1",
            cartId: "cart1",
            vendorProductId: "vp1",
            qty: 5,
            unitPriceCents: 1000,
            createdAt: new Date(),
            updatedAt: new Date(),
            vendorProduct: {
              id: "vp1",
              stockQty: 0,
              isActive: true,
              product: {
                name: "Test Product",
              },
              vendor: {
                name: "Test Vendor",
              },
            },
          },
        ],
      } as any);

      const result = await validateCartForCurrentUser();

      expect(result.ok).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]).toMatchObject({
        cartItemId: "item1",
        vendorProductId: "vp1",
        severity: "error",
        code: "OUT_OF_STOCK",
        message: "Test Product from Test Vendor is out of stock.",
        quantityRequested: 5,
        quantityAvailable: 0,
        productName: "Test Product",
        vendorName: "Test Vendor",
      });
    });

    it("should return OUT_OF_STOCK error when stockQty is negative", async () => {
      vi.mocked(currentUser).mockResolvedValue({
        id: "user1",
        email: "client@test.com",
        role: "CLIENT",
        clientId: "client1",
        name: "Client",
        agentCode: null,
        vendorId: null,
      });

      vi.mocked(prisma.cart.findFirst).mockResolvedValue({
        id: "cart1",
        clientId: "client1",
        createdByUserId: "user1",
        status: "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [
          {
            id: "item1",
            cartId: "cart1",
            vendorProductId: "vp1",
            qty: 5,
            unitPriceCents: 1000,
            createdAt: new Date(),
            updatedAt: new Date(),
            vendorProduct: {
              id: "vp1",
              stockQty: -1,
              isActive: true,
              product: {
                name: "Test Product",
              },
              vendor: {
                name: "Test Vendor",
              },
            },
          },
        ],
      } as any);

      const result = await validateCartForCurrentUser();

      expect(result.ok).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].code).toBe("OUT_OF_STOCK");
    });

    it("should return INSUFFICIENT_STOCK error when stockQty < quantityRequested", async () => {
      vi.mocked(currentUser).mockResolvedValue({
        id: "user1",
        email: "client@test.com",
        role: "CLIENT",
        clientId: "client1",
        name: "Client",
        agentCode: null,
        vendorId: null,
      });

      vi.mocked(prisma.cart.findFirst).mockResolvedValue({
        id: "cart1",
        clientId: "client1",
        createdByUserId: "user1",
        status: "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [
          {
            id: "item1",
            cartId: "cart1",
            vendorProductId: "vp1",
            qty: 10,
            unitPriceCents: 1000,
            createdAt: new Date(),
            updatedAt: new Date(),
            vendorProduct: {
              id: "vp1",
              stockQty: 5,
              isActive: true,
              product: {
                name: "Test Product",
              },
              vendor: {
                name: "Test Vendor",
              },
            },
          },
        ],
      } as any);

      const result = await validateCartForCurrentUser();

      expect(result.ok).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]).toMatchObject({
        cartItemId: "item1",
        vendorProductId: "vp1",
        severity: "error",
        code: "INSUFFICIENT_STOCK",
        message: "Only 5 units of Test Product from Test Vendor are available.",
        quantityRequested: 10,
        quantityAvailable: 5,
        productName: "Test Product",
        vendorName: "Test Vendor",
      });
    });

    it("should not return stock errors when stockQty is null", async () => {
      vi.mocked(currentUser).mockResolvedValue({
        id: "user1",
        email: "client@test.com",
        role: "CLIENT",
        clientId: "client1",
        name: "Client",
        agentCode: null,
        vendorId: null,
      });

      vi.mocked(prisma.cart.findFirst).mockResolvedValue({
        id: "cart1",
        clientId: "client1",
        createdByUserId: "user1",
        status: "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [
          {
            id: "item1",
            cartId: "cart1",
            vendorProductId: "vp1",
            qty: 100,
            unitPriceCents: 1000,
            createdAt: new Date(),
            updatedAt: new Date(),
            vendorProduct: {
              id: "vp1",
              stockQty: null,
              isActive: true,
              product: {
                name: "Test Product",
              },
              vendor: {
                name: "Test Vendor",
              },
            },
          },
        ],
      } as any);

      const result = await validateCartForCurrentUser();

      expect(result.ok).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it("should pass validation when stockQty >= quantityRequested", async () => {
      vi.mocked(currentUser).mockResolvedValue({
        id: "user1",
        email: "client@test.com",
        role: "CLIENT",
        clientId: "client1",
        name: "Client",
        agentCode: null,
        vendorId: null,
      });

      vi.mocked(prisma.cart.findFirst).mockResolvedValue({
        id: "cart1",
        clientId: "client1",
        createdByUserId: "user1",
        status: "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [
          {
            id: "item1",
            cartId: "cart1",
            vendorProductId: "vp1",
            qty: 5,
            unitPriceCents: 1000,
            createdAt: new Date(),
            updatedAt: new Date(),
            vendorProduct: {
              id: "vp1",
              stockQty: 10,
              isActive: true,
              product: {
                name: "Test Product",
              },
              vendor: {
                name: "Test Vendor",
              },
            },
          },
        ],
      } as any);

      const result = await validateCartForCurrentUser();

      expect(result.ok).toBe(true);
      expect(result.issues).toHaveLength(0);
    });
  });

  describe("Quantity Validation", () => {
    it("should return INVALID_QUANTITY error when qty is 0", async () => {
      vi.mocked(currentUser).mockResolvedValue({
        id: "user1",
        email: "client@test.com",
        role: "CLIENT",
        clientId: "client1",
        name: "Client",
        agentCode: null,
        vendorId: null,
      });

      vi.mocked(prisma.cart.findFirst).mockResolvedValue({
        id: "cart1",
        clientId: "client1",
        createdByUserId: "user1",
        status: "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [
          {
            id: "item1",
            cartId: "cart1",
            vendorProductId: "vp1",
            qty: 0,
            unitPriceCents: 1000,
            createdAt: new Date(),
            updatedAt: new Date(),
            vendorProduct: {
              id: "vp1",
              stockQty: 100,
              isActive: true,
              product: {
                name: "Test Product",
              },
              vendor: {
                name: "Test Vendor",
              },
            },
          },
        ],
      } as any);

      const result = await validateCartForCurrentUser();

      expect(result.ok).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]).toMatchObject({
        cartItemId: "item1",
        severity: "error",
        code: "INVALID_QUANTITY",
        message: "Invalid quantity in cart. Please remove this item and re-add it.",
        quantityRequested: 0,
      });
    });

    it("should return INVALID_QUANTITY error when qty is negative", async () => {
      vi.mocked(currentUser).mockResolvedValue({
        id: "user1",
        email: "client@test.com",
        role: "CLIENT",
        clientId: "client1",
        name: "Client",
        agentCode: null,
        vendorId: null,
      });

      vi.mocked(prisma.cart.findFirst).mockResolvedValue({
        id: "cart1",
        clientId: "client1",
        createdByUserId: "user1",
        status: "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [
          {
            id: "item1",
            cartId: "cart1",
            vendorProductId: "vp1",
            qty: -5,
            unitPriceCents: 1000,
            createdAt: new Date(),
            updatedAt: new Date(),
            vendorProduct: {
              id: "vp1",
              stockQty: 100,
              isActive: true,
              product: {
                name: "Test Product",
              },
              vendor: {
                name: "Test Vendor",
              },
            },
          },
        ],
      } as any);

      const result = await validateCartForCurrentUser();

      expect(result.ok).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].code).toBe("INVALID_QUANTITY");
    });
  });

  describe("Product Availability Validation", () => {
    it("should return UNKNOWN_PRODUCT error when vendorProduct is null", async () => {
      vi.mocked(currentUser).mockResolvedValue({
        id: "user1",
        email: "client@test.com",
        role: "CLIENT",
        clientId: "client1",
        name: "Client",
        agentCode: null,
        vendorId: null,
      });

      vi.mocked(prisma.cart.findFirst).mockResolvedValue({
        id: "cart1",
        clientId: "client1",
        createdByUserId: "user1",
        status: "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [
          {
            id: "item1",
            cartId: "cart1",
            vendorProductId: "vp1",
            qty: 5,
            unitPriceCents: 1000,
            createdAt: new Date(),
            updatedAt: new Date(),
            vendorProduct: null,
          },
        ],
      } as any);

      const result = await validateCartForCurrentUser();

      expect(result.ok).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]).toMatchObject({
        cartItemId: "item1",
        vendorProductId: "vp1",
        severity: "error",
        code: "UNKNOWN_PRODUCT",
        message: "This product is no longer available in the catalog.",
        quantityRequested: 5,
      });
    });

    it("should return VENDOR_MISSING error when vendor is null", async () => {
      vi.mocked(currentUser).mockResolvedValue({
        id: "user1",
        email: "client@test.com",
        role: "CLIENT",
        clientId: "client1",
        name: "Client",
        agentCode: null,
        vendorId: null,
      });

      vi.mocked(prisma.cart.findFirst).mockResolvedValue({
        id: "cart1",
        clientId: "client1",
        createdByUserId: "user1",
        status: "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [
          {
            id: "item1",
            cartId: "cart1",
            vendorProductId: "vp1",
            qty: 5,
            unitPriceCents: 1000,
            createdAt: new Date(),
            updatedAt: new Date(),
            vendorProduct: {
              id: "vp1",
              stockQty: 10,
              isActive: true,
              product: {
                name: "Test Product",
              },
              vendor: null,
            },
          },
        ],
      } as any);

      const result = await validateCartForCurrentUser();

      expect(result.ok).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]).toMatchObject({
        cartItemId: "item1",
        vendorProductId: "vp1",
        severity: "error",
        code: "VENDOR_MISSING",
        message: "The vendor for Test Product is no longer available.",
        quantityRequested: 5,
        productName: "Test Product",
      });
    });
  });

  describe("Vendor Active Status Validation", () => {
    it("should return VENDOR_INACTIVE warning when isActive is false", async () => {
      vi.mocked(currentUser).mockResolvedValue({
        id: "user1",
        email: "client@test.com",
        role: "CLIENT",
        clientId: "client1",
        name: "Client",
        agentCode: null,
        vendorId: null,
      });

      vi.mocked(prisma.cart.findFirst).mockResolvedValue({
        id: "cart1",
        clientId: "client1",
        createdByUserId: "user1",
        status: "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [
          {
            id: "item1",
            cartId: "cart1",
            vendorProductId: "vp1",
            qty: 5,
            unitPriceCents: 1000,
            createdAt: new Date(),
            updatedAt: new Date(),
            vendorProduct: {
              id: "vp1",
              stockQty: 10,
              isActive: false,
              product: {
                name: "Test Product",
              },
              vendor: {
                name: "Test Vendor",
              },
            },
          },
        ],
      } as any);

      const result = await validateCartForCurrentUser();

      // Should have warning but ok=true (warnings don't block)
      expect(result.ok).toBe(true);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]).toMatchObject({
        cartItemId: "item1",
        vendorProductId: "vp1",
        severity: "warning",
        code: "VENDOR_INACTIVE",
        message: "Test Product from Test Vendor is currently inactive.",
        quantityRequested: 5,
        productName: "Test Product",
        vendorName: "Test Vendor",
      });
    });
  });

  describe("Multiple Issues", () => {
    it("should return multiple errors for different items", async () => {
      vi.mocked(currentUser).mockResolvedValue({
        id: "user1",
        email: "client@test.com",
        role: "CLIENT",
        clientId: "client1",
        name: "Client",
        agentCode: null,
        vendorId: null,
      });

      vi.mocked(prisma.cart.findFirst).mockResolvedValue({
        id: "cart1",
        clientId: "client1",
        createdByUserId: "user1",
        status: "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [
          {
            id: "item1",
            cartId: "cart1",
            vendorProductId: "vp1",
            qty: 5,
            unitPriceCents: 1000,
            createdAt: new Date(),
            updatedAt: new Date(),
            vendorProduct: {
              id: "vp1",
              stockQty: 0,
              isActive: true,
              product: {
                name: "Product 1",
              },
              vendor: {
                name: "Vendor 1",
              },
            },
          },
          {
            id: "item2",
            cartId: "cart1",
            vendorProductId: "vp2",
            qty: 10,
            unitPriceCents: 2000,
            createdAt: new Date(),
            updatedAt: new Date(),
            vendorProduct: {
              id: "vp2",
              stockQty: 5,
              isActive: true,
              product: {
                name: "Product 2",
              },
              vendor: {
                name: "Vendor 2",
              },
            },
          },
        ],
      } as any);

      const result = await validateCartForCurrentUser();

      expect(result.ok).toBe(false);
      expect(result.issues).toHaveLength(2);
      expect(result.issues[0].code).toBe("OUT_OF_STOCK");
      expect(result.issues[1].code).toBe("INSUFFICIENT_STOCK");
    });

    it("should be ok=true when only warnings exist", async () => {
      vi.mocked(currentUser).mockResolvedValue({
        id: "user1",
        email: "client@test.com",
        role: "CLIENT",
        clientId: "client1",
        name: "Client",
        agentCode: null,
        vendorId: null,
      });

      vi.mocked(prisma.cart.findFirst).mockResolvedValue({
        id: "cart1",
        clientId: "client1",
        createdByUserId: "user1",
        status: "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [
          {
            id: "item1",
            cartId: "cart1",
            vendorProductId: "vp1",
            qty: 5,
            unitPriceCents: 1000,
            createdAt: new Date(),
            updatedAt: new Date(),
            vendorProduct: {
              id: "vp1",
              stockQty: 100,
              isActive: false, // Only a warning
              product: {
                name: "Test Product",
              },
              vendor: {
                name: "Test Vendor",
              },
            },
          },
        ],
      } as any);

      const result = await validateCartForCurrentUser();

      expect(result.ok).toBe(true);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].severity).toBe("warning");
    });
  });
});
