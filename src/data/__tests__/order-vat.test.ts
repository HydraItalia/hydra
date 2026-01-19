/**
 * Integration tests for order creation with VAT snapshotting (N1.3)
 *
 * Tests the createOrderFromCart function to verify:
 * - OrderItems have VAT snapshot fields populated
 * - SubOrder has VAT totals populated
 * - The invariant net + vat = gross holds
 * - Both priceIncludesVat=false (NET) and priceIncludesVat=true (GROSS) work correctly
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Deterministic ID counter for test stability
let idCounter = 0;
vi.mock("@paralleldrive/cuid2", () => ({
  createId: vi.fn(() => `test-id-${++idCounter}`),
}));

import { createOrderFromCart } from "../order";

// Mock dependencies
vi.mock("@/lib/auth", () => ({
  currentUser: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    cart: {
      findFirst: vi.fn(),
    },
    order: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    subOrder: {
      create: vi.fn(),
    },
    orderItem: {
      createMany: vi.fn(),
    },
    cartItem: {
      deleteMany: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
    },
    taxProfile: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/data/cart-recalc", () => ({
  recalcCartPricesForUser: vi.fn(),
}));

import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recalcCartPricesForUser } from "@/data/cart-recalc";

// Common mock user for all tests
const mockClientUser = {
  id: "user-123",
  email: "client@test.com",
  name: "Test Client",
  role: "CLIENT" as const,
  vendorId: null,
  clientId: "client-123",
  agentCode: null,
  driverId: null,
};

describe("createOrderFromCart with VAT", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    idCounter = 0; // Reset counter for each test
  });

  /**
   * Test case: NET pricing (priceIncludesVat = false)
   *
   * When vendor uses NET pricing:
   * - lineTotalCents is the NET amount
   * - VAT is computed on top: gross = net + vat
   * - OrderItem.netCents = lineTotalCents
   * - OrderItem.grossCents = lineTotalCents + vatAmountCents
   */
  it("should populate VAT fields for NET pricing (priceIncludesVat=false)", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockClientUser);
    vi.mocked(recalcCartPricesForUser).mockResolvedValue([]);

    // Mock cart with items - NET pricing vendor, 10% VAT category
    vi.mocked(prisma.cart.findFirst).mockResolvedValue({
      id: "cart-123",
      clientId: "client-123",
      status: "ACTIVE",
      CartItem: [
        {
          id: "cartitem-1",
          vendorProductId: "vp-1",
          qty: 2,
          unitPriceCents: 1000, // €10.00 net per unit
          VendorProduct: {
            Product: {
              id: "prod-1",
              name: "Test Product",
              taxProfileId: null, // Use category tax profile
              TaxProfile: null,
              ProductCategory: {
                taxProfileId: "tp-reduced-10",
                TaxProfile: {
                  id: "tp-reduced-10",
                  vatRateBps: 1000, // 10%
                },
              },
            },
            Vendor: {
              id: "vendor-1",
              name: "Test Vendor",
              priceIncludesVat: false, // NET pricing
            },
          },
        },
      ],
    } as any);

    // Capture what gets created
    let capturedOrderItems: any[] = [];
    let capturedSubOrder: any = null;

    // Mock transaction to execute callback
    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
      // Create mock transaction client
      const tx = {
        order: {
          findFirst: vi.fn().mockResolvedValue(null), // Order number unique
          create: vi.fn().mockResolvedValue({
            id: "order-123",
          }),
        },
        subOrder: {
          create: vi.fn().mockImplementation(({ data }) => {
            capturedSubOrder = data;
            return Promise.resolve({ id: data.id, vendorId: data.vendorId });
          }),
        },
        orderItem: {
          createMany: vi.fn().mockImplementation(({ data }) => {
            capturedOrderItems = data;
            return Promise.resolve({ count: data.length });
          }),
        },
        cartItem: {
          deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
      };

      return callback(tx);
    });

    // Execute
    const result = await createOrderFromCart();

    // Verify result
    expect(result.orderId).toBeDefined();

    // Verify OrderItem VAT fields
    // lineTotalCents = 2 * 1000 = 2000 (NET)
    // vatAmountCents = 2000 * 1000 / 10000 = 200
    // grossCents = 2000 + 200 = 2200
    expect(capturedOrderItems).toHaveLength(1);
    const orderItem = capturedOrderItems[0];

    expect(orderItem.lineTotalCents).toBe(2000);
    expect(orderItem.taxProfileId).toBe("tp-reduced-10");
    expect(orderItem.vatRateBps).toBe(1000);
    expect(orderItem.netCents).toBe(2000);
    expect(orderItem.vatAmountCents).toBe(200);
    expect(orderItem.grossCents).toBe(2200);

    // Verify invariant: net + vat = gross
    expect(orderItem.netCents + orderItem.vatAmountCents).toBe(
      orderItem.grossCents,
    );

    // Verify SubOrder VAT totals
    expect(capturedSubOrder.netTotalCents).toBe(2000);
    expect(capturedSubOrder.vatTotalCents).toBe(200);
    expect(capturedSubOrder.grossTotalCents).toBe(2200);

    // Verify SubOrder invariant
    expect(
      capturedSubOrder.netTotalCents + capturedSubOrder.vatTotalCents,
    ).toBe(capturedSubOrder.grossTotalCents);
  });

  /**
   * Test case: GROSS pricing (priceIncludesVat = true)
   *
   * When vendor uses GROSS pricing:
   * - lineTotalCents is the GROSS amount (VAT-inclusive)
   * - VAT is extracted: net = gross - vat
   * - OrderItem.grossCents = lineTotalCents
   * - OrderItem.netCents = lineTotalCents - vatAmountCents
   */
  it("should populate VAT fields for GROSS pricing (priceIncludesVat=true)", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockClientUser);
    vi.mocked(recalcCartPricesForUser).mockResolvedValue([]);

    // Mock cart with items - GROSS pricing vendor, 22% VAT
    vi.mocked(prisma.cart.findFirst).mockResolvedValue({
      id: "cart-123",
      clientId: "client-123",
      status: "ACTIVE",
      CartItem: [
        {
          id: "cartitem-1",
          vendorProductId: "vp-1",
          qty: 1,
          unitPriceCents: 1220, // €12.20 gross per unit (includes 22% VAT)
          VendorProduct: {
            Product: {
              id: "prod-1",
              name: "Test Product",
              taxProfileId: "tp-standard-22", // Product-level override
              TaxProfile: {
                id: "tp-standard-22",
                vatRateBps: 2200, // 22%
              },
              ProductCategory: {
                taxProfileId: "tp-reduced-10",
                TaxProfile: {
                  id: "tp-reduced-10",
                  vatRateBps: 1000,
                },
              },
            },
            Vendor: {
              id: "vendor-2",
              name: "Gross Vendor",
              priceIncludesVat: true, // GROSS pricing
            },
          },
        },
      ],
    } as any);

    // Capture what gets created
    let capturedOrderItems: any[] = [];
    let capturedSubOrder: any = null;

    // Mock transaction
    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
      const tx = {
        order: {
          findFirst: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({ id: "order-456" }),
        },
        subOrder: {
          create: vi.fn().mockImplementation(({ data }) => {
            capturedSubOrder = data;
            return Promise.resolve({ id: data.id, vendorId: data.vendorId });
          }),
        },
        orderItem: {
          createMany: vi.fn().mockImplementation(({ data }) => {
            capturedOrderItems = data;
            return Promise.resolve({ count: data.length });
          }),
        },
        cartItem: {
          deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
      };

      return callback(tx);
    });

    // Execute
    const result = await createOrderFromCart();

    // Verify result
    expect(result.orderId).toBeDefined();

    // Verify OrderItem VAT fields
    // lineTotalCents = 1 * 1220 = 1220 (GROSS)
    // netCents = 1220 * 10000 / 12200 = 1000
    // vatAmountCents = 1220 - 1000 = 220
    expect(capturedOrderItems).toHaveLength(1);
    const orderItem = capturedOrderItems[0];

    expect(orderItem.lineTotalCents).toBe(1220);
    expect(orderItem.taxProfileId).toBe("tp-standard-22");
    expect(orderItem.vatRateBps).toBe(2200);
    expect(orderItem.netCents).toBe(1000);
    expect(orderItem.vatAmountCents).toBe(220);
    expect(orderItem.grossCents).toBe(1220);

    // Verify invariant: net + vat = gross
    expect(orderItem.netCents + orderItem.vatAmountCents).toBe(
      orderItem.grossCents,
    );

    // Verify SubOrder VAT totals
    expect(capturedSubOrder.netTotalCents).toBe(1000);
    expect(capturedSubOrder.vatTotalCents).toBe(220);
    expect(capturedSubOrder.grossTotalCents).toBe(1220);

    // Verify SubOrder invariant
    expect(
      capturedSubOrder.netTotalCents + capturedSubOrder.vatTotalCents,
    ).toBe(capturedSubOrder.grossTotalCents);
  });

  /**
   * Test case: Multiple items with different VAT rates
   *
   * Verifies that:
   * - Each item gets the correct VAT computation
   * - SubOrder totals are correct sums
   * - Invariant holds for mixed rates
   */
  it("should handle multiple items with different VAT rates", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockClientUser);
    vi.mocked(recalcCartPricesForUser).mockResolvedValue([]);

    // Mock cart with multiple items - NET pricing
    vi.mocked(prisma.cart.findFirst).mockResolvedValue({
      id: "cart-123",
      clientId: "client-123",
      status: "ACTIVE",
      CartItem: [
        {
          id: "cartitem-1",
          vendorProductId: "vp-1",
          qty: 1,
          unitPriceCents: 1000, // €10.00 net
          VendorProduct: {
            Product: {
              id: "prod-1",
              name: "Standard Product",
              taxProfileId: "tp-standard-22",
              TaxProfile: {
                id: "tp-standard-22",
                vatRateBps: 2200, // 22%
              },
              ProductCategory: null,
            },
            Vendor: {
              id: "vendor-1",
              name: "Test Vendor",
              priceIncludesVat: false,
            },
          },
        },
        {
          id: "cartitem-2",
          vendorProductId: "vp-2",
          qty: 2,
          unitPriceCents: 500, // €5.00 net per unit
          VendorProduct: {
            Product: {
              id: "prod-2",
              name: "Reduced Product",
              taxProfileId: null,
              TaxProfile: null,
              ProductCategory: {
                taxProfileId: "tp-reduced-10",
                TaxProfile: {
                  id: "tp-reduced-10",
                  vatRateBps: 1000, // 10%
                },
              },
            },
            Vendor: {
              id: "vendor-1",
              name: "Test Vendor",
              priceIncludesVat: false,
            },
          },
        },
      ],
    } as any);

    let capturedOrderItems: any[] = [];
    let capturedSubOrder: any = null;

    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
      const tx = {
        order: {
          findFirst: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({ id: "order-789" }),
        },
        subOrder: {
          create: vi.fn().mockImplementation(({ data }) => {
            capturedSubOrder = data;
            return Promise.resolve({ id: data.id, vendorId: data.vendorId });
          }),
        },
        orderItem: {
          createMany: vi.fn().mockImplementation(({ data }) => {
            capturedOrderItems = data;
            return Promise.resolve({ count: data.length });
          }),
        },
        cartItem: {
          deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
        },
      };

      return callback(tx);
    });

    // Execute
    await createOrderFromCart();

    // Verify both items
    expect(capturedOrderItems).toHaveLength(2);

    // Item 1: 1000 net at 22% -> 220 VAT -> 1220 gross
    const item1 = capturedOrderItems.find((i) => i.vendorProductId === "vp-1");
    expect(item1).toBeDefined();
    expect(item1!.netCents).toBe(1000);
    expect(item1!.vatAmountCents).toBe(220);
    expect(item1!.grossCents).toBe(1220);
    expect(item1!.netCents + item1!.vatAmountCents).toBe(item1!.grossCents);

    // Item 2: 2*500=1000 net at 10% -> 100 VAT -> 1100 gross
    const item2 = capturedOrderItems.find((i) => i.vendorProductId === "vp-2");
    expect(item2).toBeDefined();
    expect(item2!.netCents).toBe(1000);
    expect(item2!.vatAmountCents).toBe(100);
    expect(item2!.grossCents).toBe(1100);
    expect(item2!.netCents + item2!.vatAmountCents).toBe(item2!.grossCents);

    // Verify SubOrder totals (sum of items)
    // netTotal = 1000 + 1000 = 2000
    // vatTotal = 220 + 100 = 320
    // grossTotal = 1220 + 1100 = 2320
    expect(capturedSubOrder.netTotalCents).toBe(2000);
    expect(capturedSubOrder.vatTotalCents).toBe(320);
    expect(capturedSubOrder.grossTotalCents).toBe(2320);

    // Verify SubOrder invariant
    expect(
      capturedSubOrder.netTotalCents + capturedSubOrder.vatTotalCents,
    ).toBe(capturedSubOrder.grossTotalCents);
  });

  /**
   * Test case: 0% VAT (exempt)
   *
   * Verifies that exempt products (0% VAT) work correctly:
   * - vatAmountCents = 0
   * - netCents = grossCents
   */
  it("should handle 0% VAT (exempt) correctly", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockClientUser);
    vi.mocked(recalcCartPricesForUser).mockResolvedValue([]);

    vi.mocked(prisma.cart.findFirst).mockResolvedValue({
      id: "cart-123",
      clientId: "client-123",
      status: "ACTIVE",
      CartItem: [
        {
          id: "cartitem-1",
          vendorProductId: "vp-1",
          qty: 1,
          unitPriceCents: 1000,
          VendorProduct: {
            Product: {
              id: "prod-1",
              name: "Exempt Product",
              taxProfileId: "tp-exempt-0",
              TaxProfile: {
                id: "tp-exempt-0",
                vatRateBps: 0, // 0% exempt
              },
              ProductCategory: null,
            },
            Vendor: {
              id: "vendor-1",
              name: "Test Vendor",
              priceIncludesVat: false,
            },
          },
        },
      ],
    } as any);

    let capturedOrderItems: any[] = [];
    let capturedSubOrder: any = null;

    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
      const tx = {
        order: {
          findFirst: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({ id: "order-exempt" }),
        },
        subOrder: {
          create: vi.fn().mockImplementation(({ data }) => {
            capturedSubOrder = data;
            return Promise.resolve({ id: data.id, vendorId: data.vendorId });
          }),
        },
        orderItem: {
          createMany: vi.fn().mockImplementation(({ data }) => {
            capturedOrderItems = data;
            return Promise.resolve({ count: data.length });
          }),
        },
        cartItem: {
          deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
      };

      return callback(tx);
    });

    await createOrderFromCart();

    const orderItem = capturedOrderItems[0];

    // 0% VAT: net = gross, vat = 0
    expect(orderItem.vatRateBps).toBe(0);
    expect(orderItem.vatAmountCents).toBe(0);
    expect(orderItem.netCents).toBe(1000);
    expect(orderItem.grossCents).toBe(1000);

    // Invariant still holds
    expect(orderItem.netCents + orderItem.vatAmountCents).toBe(
      orderItem.grossCents,
    );

    // SubOrder totals
    expect(capturedSubOrder.netTotalCents).toBe(1000);
    expect(capturedSubOrder.vatTotalCents).toBe(0);
    expect(capturedSubOrder.grossTotalCents).toBe(1000);
  });

  /**
   * Test case: Multiple vendors (multiple SubOrders)
   *
   * Verifies that each vendor gets its own SubOrder with correct VAT totals
   */
  it("should create separate SubOrders for different vendors with correct VAT", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockClientUser);
    vi.mocked(recalcCartPricesForUser).mockResolvedValue([]);

    // Two items from different vendors
    vi.mocked(prisma.cart.findFirst).mockResolvedValue({
      id: "cart-123",
      clientId: "client-123",
      status: "ACTIVE",
      CartItem: [
        {
          id: "cartitem-1",
          vendorProductId: "vp-1",
          qty: 1,
          unitPriceCents: 1000,
          VendorProduct: {
            Product: {
              id: "prod-1",
              name: "Product A",
              taxProfileId: null,
              TaxProfile: null,
              ProductCategory: {
                taxProfileId: "tp-reduced-10",
                TaxProfile: {
                  id: "tp-reduced-10",
                  vatRateBps: 1000,
                },
              },
            },
            Vendor: {
              id: "vendor-1",
              name: "Vendor One",
              priceIncludesVat: false,
            },
          },
        },
        {
          id: "cartitem-2",
          vendorProductId: "vp-2",
          qty: 1,
          unitPriceCents: 1220,
          VendorProduct: {
            Product: {
              id: "prod-2",
              name: "Product B",
              taxProfileId: "tp-standard-22",
              TaxProfile: {
                id: "tp-standard-22",
                vatRateBps: 2200,
              },
              ProductCategory: null,
            },
            Vendor: {
              id: "vendor-2",
              name: "Vendor Two",
              priceIncludesVat: true, // Different pricing mode
            },
          },
        },
      ],
    } as any);

    const capturedSubOrders: any[] = [];
    let capturedOrderItems: any[] = [];

    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
      const tx = {
        order: {
          findFirst: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({ id: "order-multi" }),
        },
        subOrder: {
          create: vi.fn().mockImplementation(({ data }) => {
            capturedSubOrders.push(data);
            return Promise.resolve({ id: data.id, vendorId: data.vendorId });
          }),
        },
        orderItem: {
          createMany: vi.fn().mockImplementation(({ data }) => {
            capturedOrderItems = data;
            return Promise.resolve({ count: data.length });
          }),
        },
        cartItem: {
          deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
        },
      };

      return callback(tx);
    });

    await createOrderFromCart();

    // Should create 2 SubOrders
    expect(capturedSubOrders).toHaveLength(2);

    // Vendor 1 (NET): 1000 net + 100 vat = 1100 gross
    const subOrder1 = capturedSubOrders.find((s) => s.vendorId === "vendor-1");
    expect(subOrder1).toBeDefined();
    expect(subOrder1!.netTotalCents).toBe(1000);
    expect(subOrder1!.vatTotalCents).toBe(100);
    expect(subOrder1!.grossTotalCents).toBe(1100);

    // Vendor 2 (GROSS): 1220 gross = 1000 net + 220 vat
    const subOrder2 = capturedSubOrders.find((s) => s.vendorId === "vendor-2");
    expect(subOrder2).toBeDefined();
    expect(subOrder2!.netTotalCents).toBe(1000);
    expect(subOrder2!.vatTotalCents).toBe(220);
    expect(subOrder2!.grossTotalCents).toBe(1220);

    // Both invariants hold
    expect(subOrder1!.netTotalCents + subOrder1!.vatTotalCents).toBe(
      subOrder1!.grossTotalCents,
    );
    expect(subOrder2!.netTotalCents + subOrder2!.vatTotalCents).toBe(
      subOrder2!.grossTotalCents,
    );
  });
});
