import { describe, it, expect, beforeEach, vi } from "vitest";
import { createOrderFromCart } from "@/data/order";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/auth";
import { recalcCartPricesForUser } from "@/data/cart-recalc";

// Mock dependencies
vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn(),
    cart: {
      findFirst: vi.fn(),
    },
    order: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  currentUser: vi.fn(),
}));

vi.mock("@/data/cart-recalc", () => ({
  recalcCartPricesForUser: vi.fn(),
}));

// Mock VAT helpers to return 0% VAT (simplifies these tests; order-vat.test.ts covers VAT)
vi.mock("@/lib/vat", () => ({
  getEffectiveTaxProfile: vi.fn().mockResolvedValue({
    taxProfileId: "tp-exempt-0",
    vatRateBps: 0,
  }),
  computeVatFromNet: vi.fn((amount: number) => ({
    netCents: amount,
    vatCents: 0,
    grossCents: amount,
  })),
  computeVatFromGross: vi.fn((amount: number) => ({
    netCents: amount,
    vatCents: 0,
    grossCents: amount,
  })),
}));

// Mock fees helpers to return 0% fee (simplifies these tests; order-vat.test.ts covers fees)
vi.mock("@/lib/fees", () => ({
  parseHydraFeeBps: vi.fn().mockReturnValue(0),
  computeHydraFeeCents: vi.fn().mockReturnValue(0),
  bpsToPercent: vi.fn().mockReturnValue(0),
}));

// Mock cuid2 for deterministic IDs
let idCounter = 0;
vi.mock("@paralleldrive/cuid2", () => ({
  createId: vi.fn(() => `test-id-${++idCounter}`),
}));

/** Helper to create a mock cart item with full PascalCase Prisma relations */
function mockCartItem(overrides: {
  id: string;
  vendorProductId: string;
  qty: number;
  unitPriceCents: number | null;
  productName: string;
  vendorId: string;
  vendorName: string;
}) {
  return {
    id: overrides.id,
    cartId: "cart1",
    vendorProductId: overrides.vendorProductId,
    qty: overrides.qty,
    unitPriceCents: overrides.unitPriceCents,
    createdAt: new Date(),
    updatedAt: new Date(),
    VendorProduct: {
      id: overrides.vendorProductId,
      Product: {
        id: `prod-${overrides.vendorProductId}`,
        name: overrides.productName,
        taxProfileId: null,
        TaxProfile: null,
        ProductCategory: null,
      },
      Vendor: {
        id: overrides.vendorId,
        name: overrides.vendorName,
        priceIncludesVat: false,
      },
    },
  };
}

/** Helper to create a mock transaction with subOrder support */
function mockTransaction(
  mockOrderCreate: ReturnType<typeof vi.fn>,
  extras?: {
    mockOrderItemCreateMany?: ReturnType<typeof vi.fn>;
    mockCartItemDeleteMany?: ReturnType<typeof vi.fn>;
  },
) {
  return async (callback: any) => {
    const tx = {
      order: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: mockOrderCreate,
      },
      subOrder: {
        create: vi
          .fn()
          .mockImplementation(({ data }) =>
            Promise.resolve({ id: data.id, vendorId: data.vendorId }),
          ),
      },
      orderItem: {
        createMany: extras?.mockOrderItemCreateMany ?? vi.fn(),
      },
      cartItem: {
        deleteMany: extras?.mockCartItemDeleteMany ?? vi.fn(),
      },
    };
    return callback(tx);
  };
}

describe("createOrderFromCart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    idCounter = 0;
  });

  it("should throw error when user is not authenticated", async () => {
    vi.mocked(currentUser).mockResolvedValue(null);

    await expect(createOrderFromCart()).rejects.toThrow("Unauthorized");
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
      driverId: null,
      status: "APPROVED",
    });

    await expect(createOrderFromCart()).rejects.toThrow(
      "Only CLIENT users can create orders",
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
      driverId: null,
      status: "APPROVED",
    });

    await expect(createOrderFromCart()).rejects.toThrow(
      "User does not have an associated client",
    );
  });

  it("should throw error when cart is empty", async () => {
    vi.mocked(currentUser).mockResolvedValue({
      id: "user1",
      email: "client@test.com",
      role: "CLIENT",
      clientId: "client1",
      name: "Client",
      agentCode: null,
      vendorId: null,
      driverId: null,
      status: "APPROVED",
    });

    vi.mocked(recalcCartPricesForUser).mockResolvedValue([]);

    vi.mocked(prisma.cart.findFirst).mockResolvedValue({
      id: "cart1",
      clientId: "client1",
      createdByUserId: "user1",
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
      CartItem: [],
    } as any);

    await expect(createOrderFromCart()).rejects.toThrow("Cart is empty");
  });

  it("should throw error when no cart exists", async () => {
    vi.mocked(currentUser).mockResolvedValue({
      id: "user1",
      email: "client@test.com",
      role: "CLIENT",
      clientId: "client1",
      name: "Client",
      agentCode: null,
      vendorId: null,
      driverId: null,
      status: "APPROVED",
    });

    vi.mocked(recalcCartPricesForUser).mockResolvedValue([]);

    vi.mocked(prisma.cart.findFirst).mockResolvedValue(null);

    await expect(createOrderFromCart()).rejects.toThrow("Cart is empty");
  });

  it("should create order with correct data", async () => {
    vi.mocked(currentUser).mockResolvedValue({
      id: "user1",
      email: "client@test.com",
      role: "CLIENT",
      clientId: "client1",
      name: "Client",
      agentCode: null,
      vendorId: null,
      driverId: null,
      status: "APPROVED",
    });

    vi.mocked(recalcCartPricesForUser).mockResolvedValue([]);

    vi.mocked(prisma.cart.findFirst).mockResolvedValue({
      id: "cart1",
      clientId: "client1",
      createdByUserId: "user1",
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
      CartItem: [
        mockCartItem({
          id: "item1",
          vendorProductId: "vp1",
          qty: 2,
          unitPriceCents: 1000,
          productName: "Product 1",
          vendorId: "vendor1",
          vendorName: "Vendor 1",
        }),
        mockCartItem({
          id: "item2",
          vendorProductId: "vp2",
          qty: 3,
          unitPriceCents: 1500,
          productName: "Product 2",
          vendorId: "vendor2",
          vendorName: "Vendor 2",
        }),
      ],
    } as any);

    const mockOrderCreate = vi.fn().mockResolvedValue({
      id: "order1",
      clientId: "client1",
      submitterUserId: "user1",
      orderNumber: "HYD-20241114-1234",
      status: "SUBMITTED",
      totalCents: 6500,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const mockOrderItemCreateMany = vi.fn();
    const mockCartItemDeleteMany = vi.fn();

    vi.mocked(prisma.$transaction).mockImplementation(
      mockTransaction(mockOrderCreate, {
        mockOrderItemCreateMany,
        mockCartItemDeleteMany,
      }),
    );

    const result = await createOrderFromCart();

    // Verify order was created with correct total
    expect(mockOrderCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        clientId: "client1",
        submitterUserId: "user1",
        orderNumber: expect.stringMatching(/^HYD-\d{8}-\d{4}$/),
        status: "SUBMITTED",
        totalCents: 6500,
      }),
    });

    // Verify order items were created (now includes VAT snapshot fields)
    expect(mockOrderItemCreateMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          orderId: "order1",
          vendorProductId: "vp1",
          qty: 2,
          unitPriceCents: 1000,
          lineTotalCents: 2000,
          productName: "Product 1",
          vendorName: "Vendor 1",
        }),
        expect.objectContaining({
          orderId: "order1",
          vendorProductId: "vp2",
          qty: 3,
          unitPriceCents: 1500,
          lineTotalCents: 4500,
          productName: "Product 2",
          vendorName: "Vendor 2",
        }),
      ]),
    });

    // Verify cart was cleared
    expect(mockCartItemDeleteMany).toHaveBeenCalledWith({
      where: {
        cartId: "cart1",
      },
    });

    // Verify result
    expect(result).toEqual({ orderId: "order1" });

    // Verify recalcCartPricesForUser was called
    expect(recalcCartPricesForUser).toHaveBeenCalled();
  });

  it("should correctly calculate total with multiple items", async () => {
    vi.mocked(currentUser).mockResolvedValue({
      id: "user1",
      email: "client@test.com",
      role: "CLIENT",
      clientId: "client1",
      name: "Client",
      agentCode: null,
      vendorId: null,
      driverId: null,
      status: "APPROVED",
    });

    vi.mocked(recalcCartPricesForUser).mockResolvedValue([]);

    vi.mocked(prisma.cart.findFirst).mockResolvedValue({
      id: "cart1",
      clientId: "client1",
      createdByUserId: "user1",
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
      CartItem: [
        mockCartItem({
          id: "item1",
          vendorProductId: "vp1",
          qty: 5,
          unitPriceCents: 250,
          productName: "Product 1",
          vendorId: "vendor1",
          vendorName: "Vendor 1",
        }),
        mockCartItem({
          id: "item2",
          vendorProductId: "vp2",
          qty: 10,
          unitPriceCents: 500,
          productName: "Product 2",
          vendorId: "vendor2",
          vendorName: "Vendor 2",
        }),
        mockCartItem({
          id: "item3",
          vendorProductId: "vp3",
          qty: 1,
          unitPriceCents: 7500,
          productName: "Product 3",
          vendorId: "vendor3",
          vendorName: "Vendor 3",
        }),
      ],
    } as any);

    const mockOrderCreate = vi.fn().mockResolvedValue({
      id: "order1",
      clientId: "client1",
      submitterUserId: "user1",
      orderNumber: "HYD-20241114-5678",
      status: "SUBMITTED",
      totalCents: 13750,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(prisma.$transaction).mockImplementation(
      mockTransaction(mockOrderCreate),
    );

    await createOrderFromCart();

    // Verify total calculation: 5*250 + 10*500 + 1*7500 = 1250 + 5000 + 7500 = 13750
    expect(mockOrderCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        totalCents: 13750,
      }),
    });
  });

  it("should handle null prices gracefully", async () => {
    vi.mocked(currentUser).mockResolvedValue({
      id: "user1",
      email: "client@test.com",
      role: "CLIENT",
      clientId: "client1",
      name: "Client",
      agentCode: null,
      vendorId: null,
      driverId: null,
      status: "APPROVED",
    });

    vi.mocked(recalcCartPricesForUser).mockResolvedValue([]);

    vi.mocked(prisma.cart.findFirst).mockResolvedValue({
      id: "cart1",
      clientId: "client1",
      createdByUserId: "user1",
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
      CartItem: [
        mockCartItem({
          id: "item1",
          vendorProductId: "vp1",
          qty: 2,
          unitPriceCents: null as any,
          productName: "Product 1",
          vendorId: "vendor1",
          vendorName: "Vendor 1",
        }),
        mockCartItem({
          id: "item2",
          vendorProductId: "vp2",
          qty: 3,
          unitPriceCents: 1000,
          productName: "Product 2",
          vendorId: "vendor2",
          vendorName: "Vendor 2",
        }),
      ],
    } as any);

    const mockOrderCreate = vi.fn().mockResolvedValue({
      id: "order1",
      clientId: "client1",
      submitterUserId: "user1",
      orderNumber: "HYD-20241114-9999",
      status: "SUBMITTED",
      totalCents: 3000,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const mockOrderItemCreateMany = vi.fn();

    vi.mocked(prisma.$transaction).mockImplementation(
      mockTransaction(mockOrderCreate, { mockOrderItemCreateMany }),
    );

    await createOrderFromCart();

    // Verify total treats null as 0
    expect(mockOrderCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        totalCents: 3000,
      }),
    });

    // Verify order items use 0 for null prices
    expect(mockOrderItemCreateMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          unitPriceCents: 0,
          lineTotalCents: 0,
        }),
      ]),
    });
  });

  it("should call recalcCartPricesForUser and use recalculated prices", async () => {
    vi.mocked(currentUser).mockResolvedValue({
      id: "user1",
      email: "client@test.com",
      role: "CLIENT",
      clientId: "client1",
      name: "Client",
      agentCode: null,
      vendorId: null,
      driverId: null,
      status: "APPROVED",
    });

    vi.mocked(recalcCartPricesForUser).mockResolvedValue([
      {
        itemId: "item1",
        oldPriceCents: 1000,
        newPriceCents: 900,
      },
    ]);

    vi.mocked(prisma.cart.findFirst).mockResolvedValue({
      id: "cart1",
      clientId: "client1",
      createdByUserId: "user1",
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
      CartItem: [
        mockCartItem({
          id: "item1",
          vendorProductId: "vp1",
          qty: 2,
          unitPriceCents: 900,
          productName: "Product 1",
          vendorId: "vendor1",
          vendorName: "Vendor 1",
        }),
      ],
    } as any);

    const mockOrderCreate = vi.fn().mockResolvedValue({
      id: "order1",
      orderNumber: "HYD-20241114-1111",
      totalCents: 1800,
    });

    vi.mocked(prisma.$transaction).mockImplementation(
      mockTransaction(mockOrderCreate),
    );

    await createOrderFromCart();

    // Verify recalc was called
    expect(recalcCartPricesForUser).toHaveBeenCalled();

    // Verify order total uses recalculated price
    expect(mockOrderCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        totalCents: 1800, // 2 * 900 (recalculated price)
      }),
    });
  });
});
