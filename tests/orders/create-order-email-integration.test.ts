import { describe, it, expect, beforeEach, vi } from "vitest";
import { createOrderFromCart } from "@/data/order";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/auth";
import { recalcCartPricesForUser } from "@/data/cart-recalc";
import * as emailModule from "@/lib/email";

// Mock dependencies
vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn(),
    cart: {
      findFirst: vi.fn(),
    },
    order: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  currentUser: vi.fn(),
}));

vi.mock("@/data/cart-recalc", () => ({
  recalcCartPricesForUser: vi.fn(),
}));

vi.mock("@/lib/email", () => ({
  buildOrderConfirmationEmail: vi.fn(),
  sendOrderConfirmationEmail: vi.fn(),
}));

describe("createOrderFromCart - Email Integration", () => {
  const mockUser = {
    id: "user1",
    email: "client@test.com",
    role: "CLIENT" as const,
    clientId: "client1",
    name: "Test Client",
    agentCode: null,
    vendorId: null,
  };

  const mockCart = {
    id: "cart1",
    clientId: "client1",
    createdByUserId: "user1",
    status: "ACTIVE" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [
      {
        id: "item1",
        cartId: "cart1",
        vendorProductId: "vp1",
        qty: 10,
        unitPriceCents: 450,
        createdAt: new Date(),
        updatedAt: new Date(),
        vendorProduct: {
          id: "vp1",
          vendorId: "vendor1",
          productId: "product1",
          vendorSku: "SKU-1",
          basePriceCents: 450,
          currency: "EUR",
          stockQty: 100,
          leadTimeDays: 1,
          minOrderQty: 1,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          product: {
            id: "product1",
            name: "Ghiaccio alimentare 10kg",
            categoryId: "cat1",
            description: null,
            unit: "BOX" as const,
            imageUrl: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
          },
          vendor: {
            id: "vendor1",
            name: "Ghiaccio Facile",
            region: "Sardegna",
            notes: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
          },
        },
      },
    ],
  };

  const mockCreatedOrder = {
    id: "order1",
    clientId: "client1",
    submitterUserId: "user1",
    orderNumber: "HYD-20251114-0001",
    status: "SUBMITTED" as const,
    totalCents: 4500,
    region: null,
    assignedAgentUserId: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockFullOrder = {
    ...mockCreatedOrder,
    items: [
      {
        id: "orderItem1",
        orderId: "order1",
        vendorProductId: "vp1",
        qty: 10,
        unitPriceCents: 450,
        lineTotalCents: 4500,
        productName: "Ghiaccio alimentare 10kg",
        vendorName: "Ghiaccio Facile",
        createdAt: new Date(),
        updatedAt: new Date(),
        vendorProduct: {
          product: {
            name: "Ghiaccio alimentare 10kg",
          },
          vendor: {
            name: "Ghiaccio Facile",
          },
        },
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    vi.mocked(currentUser).mockResolvedValue(mockUser);
    vi.mocked(recalcCartPricesForUser).mockResolvedValue([]);
    vi.mocked(prisma.cart.findFirst).mockResolvedValue(mockCart as any);
    vi.mocked(prisma.order.findFirst).mockResolvedValue(null);

    // Mock transaction to return the created order
    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
      return callback({
        order: {
          create: vi.fn().mockResolvedValue(mockCreatedOrder),
          findFirst: vi.fn().mockResolvedValue(null),
        },
        orderItem: {
          createMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
        cartItem: {
          deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
      });
    });

    // Mock findUnique to return full order with items
    vi.mocked(prisma.order.findUnique).mockResolvedValue(mockFullOrder as any);
  });

  it("should call buildOrderConfirmationEmail with correct payload", async () => {
    const buildEmailSpy = vi.mocked(emailModule.buildOrderConfirmationEmail);
    buildEmailSpy.mockReturnValue({
      to: mockUser.email!,
      subject: "Test Subject",
      text: "Test Text",
      html: "<p>Test HTML</p>",
    });

    await createOrderFromCart();

    expect(buildEmailSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        // orderNumber is randomly generated, so we just check it exists
        orderNumber: expect.stringMatching(/^HYD-\d{8}-\d{4}$/),
        createdAt: mockFullOrder.createdAt,
        totalCents: mockCreatedOrder.totalCents,
        clientEmail: mockUser.email,
        clientName: mockUser.name,
        items: [
          {
            productName: "Ghiaccio alimentare 10kg",
            vendorName: "Ghiaccio Facile",
            quantity: 10,
            priceCents: 450,
          },
        ],
      })
    );
  });

  it("should call sendOrderConfirmationEmail after order creation", async () => {
    const mockEmailPayload = {
      to: mockUser.email!,
      subject: "Conferma Ordine",
      text: "Test email",
      html: "<p>Test email</p>",
    };

    vi.mocked(emailModule.buildOrderConfirmationEmail).mockReturnValue(
      mockEmailPayload
    );
    const sendEmailSpy = vi.mocked(emailModule.sendOrderConfirmationEmail);

    await createOrderFromCart();

    expect(sendEmailSpy).toHaveBeenCalledWith(mockEmailPayload);
    expect(sendEmailSpy).toHaveBeenCalledTimes(1);
  });

  it("should create order successfully even if email sending fails", async () => {
    const mockEmailPayload = {
      to: mockUser.email!,
      subject: "Test",
      text: "Test",
      html: "<p>Test</p>",
    };

    vi.mocked(emailModule.buildOrderConfirmationEmail).mockReturnValue(
      mockEmailPayload
    );

    // Make email sending throw an error
    vi.mocked(emailModule.sendOrderConfirmationEmail).mockRejectedValue(
      new Error("Email service unavailable")
    );

    // Spy on console.error to verify error logging
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation();

    // Order creation should still succeed
    const result = await createOrderFromCart();

    expect(result.orderId).toBe(mockCreatedOrder.id);

    // Error should be logged
    expect(consoleErrorSpy).toHaveBeenCalled();
    const errorLog = consoleErrorSpy.mock.calls[0].join(" ");
    expect(errorLog).toContain("Failed to send order confirmation email");
    expect(errorLog).toContain(mockCreatedOrder.id);

    consoleErrorSpy.mockRestore();
  });

  it("should create order successfully even if buildOrderConfirmationEmail fails", async () => {
    // Make email building throw an error
    vi.mocked(emailModule.buildOrderConfirmationEmail).mockImplementation(() => {
      throw new Error("Email template error");
    });

    // Spy on console.error to verify error logging
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation();

    // Order creation should still succeed
    const result = await createOrderFromCart();

    expect(result.orderId).toBe(mockCreatedOrder.id);

    // Error should be logged
    expect(consoleErrorSpy).toHaveBeenCalled();
    const errorLog = consoleErrorSpy.mock.calls[0].join(" ");
    expect(errorLog).toContain("Failed to send order confirmation email");

    consoleErrorSpy.mockRestore();
  });

  it("should not call email functions if order is not found after creation", async () => {
    // Mock findUnique to return null (order not found)
    vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

    const buildEmailSpy = vi.mocked(emailModule.buildOrderConfirmationEmail);
    const sendEmailSpy = vi.mocked(emailModule.sendOrderConfirmationEmail);

    await createOrderFromCart();

    // Email functions should not be called if order is not found
    expect(buildEmailSpy).not.toHaveBeenCalled();
    expect(sendEmailSpy).not.toHaveBeenCalled();
  });

  it("should return orderId and orderNumber after successful creation", async () => {
    const mockEmailPayload = {
      to: mockUser.email!,
      subject: "Test",
      text: "Test",
      html: "<p>Test</p>",
    };

    vi.mocked(emailModule.buildOrderConfirmationEmail).mockReturnValue(
      mockEmailPayload
    );

    const result = await createOrderFromCart();

    expect(result).toEqual({
      orderId: mockCreatedOrder.id,
      // orderNumber is randomly generated, so we just check it matches the format
      orderNumber: expect.stringMatching(/^HYD-\d{8}-\d{4}$/),
    });
  });
});
