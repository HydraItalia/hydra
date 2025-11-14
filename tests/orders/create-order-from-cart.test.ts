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

describe("createOrderFromCart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    });

    await expect(createOrderFromCart()).rejects.toThrow(
      "Only CLIENT users can create orders"
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

    await expect(createOrderFromCart()).rejects.toThrow(
      "User does not have an associated client"
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
    });

    vi.mocked(recalcCartPricesForUser).mockResolvedValue([]);

    // Mock empty cart
    vi.mocked(prisma.cart.findFirst).mockResolvedValue({
      id: "cart1",
      clientId: "client1",
      createdByUserId: "user1",
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [],
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
    });

    vi.mocked(recalcCartPricesForUser).mockResolvedValue([]);

    // Mock no cart
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
    });

    vi.mocked(recalcCartPricesForUser).mockResolvedValue([]);

    // Mock cart with items
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
          qty: 2,
          unitPriceCents: 1000,
          createdAt: new Date(),
          updatedAt: new Date(),
          vendorProduct: {
            id: "vp1",
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
          qty: 3,
          unitPriceCents: 1500,
          createdAt: new Date(),
          updatedAt: new Date(),
          vendorProduct: {
            id: "vp2",
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

    const mockOrderCreate = vi.fn().mockResolvedValue({
      id: "order1",
      clientId: "client1",
      submitterUserId: "user1",
      orderNumber: "HYD-20241114-1234",
      status: "SUBMITTED",
      totalCents: 6500, // 2*1000 + 3*1500
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const mockOrderItemCreateMany = vi.fn();
    const mockCartItemDeleteMany = vi.fn();

    // Mock transaction
    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
      // Mock findFirst to return no existing order number
      const tx = {
        order: {
          findFirst: vi.fn().mockResolvedValue(null),
          create: mockOrderCreate,
        },
        orderItem: {
          createMany: mockOrderItemCreateMany,
        },
        cartItem: {
          deleteMany: mockCartItemDeleteMany,
        },
      };
      return callback(tx);
    });

    const result = await createOrderFromCart();

    // Verify order was created
    expect(mockOrderCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        clientId: "client1",
        submitterUserId: "user1",
        orderNumber: expect.stringMatching(/^HYD-\d{8}-\d{4}$/),
        status: "SUBMITTED",
        totalCents: 6500,
      }),
    });

    // Verify order items were created
    expect(mockOrderItemCreateMany).toHaveBeenCalledWith({
      data: [
        {
          orderId: "order1",
          vendorProductId: "vp1",
          qty: 2,
          unitPriceCents: 1000,
          lineTotalCents: 2000,
          productName: "Product 1",
          vendorName: "Vendor 1",
        },
        {
          orderId: "order1",
          vendorProductId: "vp2",
          qty: 3,
          unitPriceCents: 1500,
          lineTotalCents: 4500,
          productName: "Product 2",
          vendorName: "Vendor 2",
        },
      ],
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
    });

    vi.mocked(recalcCartPricesForUser).mockResolvedValue([]);

    // Mock cart with various quantities and prices
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
          unitPriceCents: 250,
          createdAt: new Date(),
          updatedAt: new Date(),
          vendorProduct: {
            id: "vp1",
            product: { name: "Product 1" },
            vendor: { name: "Vendor 1" },
          },
        },
        {
          id: "item2",
          cartId: "cart1",
          vendorProductId: "vp2",
          qty: 10,
          unitPriceCents: 500,
          createdAt: new Date(),
          updatedAt: new Date(),
          vendorProduct: {
            id: "vp2",
            product: { name: "Product 2" },
            vendor: { name: "Vendor 2" },
          },
        },
        {
          id: "item3",
          cartId: "cart1",
          vendorProductId: "vp3",
          qty: 1,
          unitPriceCents: 7500,
          createdAt: new Date(),
          updatedAt: new Date(),
          vendorProduct: {
            id: "vp3",
            product: { name: "Product 3" },
            vendor: { name: "Vendor 3" },
          },
        },
      ],
    } as any);

    const mockOrderCreate = vi.fn().mockResolvedValue({
      id: "order1",
      clientId: "client1",
      submitterUserId: "user1",
      orderNumber: "HYD-20241114-5678",
      status: "SUBMITTED",
      totalCents: 13750, // 5*250 + 10*500 + 1*7500
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Mock transaction
    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
      const tx = {
        order: {
          findFirst: vi.fn().mockResolvedValue(null),
          create: mockOrderCreate,
        },
        orderItem: {
          createMany: vi.fn(),
        },
        cartItem: {
          deleteMany: vi.fn(),
        },
      };
      return callback(tx);
    });

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
    });

    vi.mocked(recalcCartPricesForUser).mockResolvedValue([]);

    // Mock cart with null price (should treat as 0)
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
          qty: 2,
          unitPriceCents: null, // Null price
          createdAt: new Date(),
          updatedAt: new Date(),
          vendorProduct: {
            id: "vp1",
            product: { name: "Product 1" },
            vendor: { name: "Vendor 1" },
          },
        },
        {
          id: "item2",
          cartId: "cart1",
          vendorProductId: "vp2",
          qty: 3,
          unitPriceCents: 1000,
          createdAt: new Date(),
          updatedAt: new Date(),
          vendorProduct: {
            id: "vp2",
            product: { name: "Product 2" },
            vendor: { name: "Vendor 2" },
          },
        },
      ],
    } as any);

    const mockOrderCreate = vi.fn().mockResolvedValue({
      id: "order1",
      clientId: "client1",
      submitterUserId: "user1",
      orderNumber: "HYD-20241114-9999",
      status: "SUBMITTED",
      totalCents: 3000, // 0 + 3*1000
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const mockOrderItemCreateMany = vi.fn();

    // Mock transaction
    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
      const tx = {
        order: {
          findFirst: vi.fn().mockResolvedValue(null),
          create: mockOrderCreate,
        },
        orderItem: {
          createMany: mockOrderItemCreateMany,
        },
        cartItem: {
          deleteMany: vi.fn(),
        },
      };
      return callback(tx);
    });

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
      items: [
        {
          id: "item1",
          cartId: "cart1",
          vendorProductId: "vp1",
          qty: 2,
          unitPriceCents: 900, // After recalc
          createdAt: new Date(),
          updatedAt: new Date(),
          vendorProduct: {
            id: "vp1",
            product: { name: "Product 1" },
            vendor: { name: "Vendor 1" },
          },
        },
      ],
    } as any);

    const mockOrderCreate = vi.fn().mockResolvedValue({
      id: "order1",
      orderNumber: "HYD-20241114-1111",
      totalCents: 1800,
    });

    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
      const tx = {
        order: {
          findFirst: vi.fn().mockResolvedValue(null),
          create: mockOrderCreate,
        },
        orderItem: {
          createMany: vi.fn(),
        },
        cartItem: {
          deleteMany: vi.fn(),
        },
      };
      return callback(tx);
    });

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
