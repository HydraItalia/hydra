import { describe, it, expect, beforeEach, vi } from "vitest";
import { fetchOrdersForClient, fetchOrderById } from "@/data/orders";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/auth";

// Mock dependencies
vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  currentUser: vi.fn(),
}));

describe("Order History - fetchOrdersForClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should throw error when user is not authenticated", async () => {
    vi.mocked(currentUser).mockResolvedValue(null);

    await expect(
      fetchOrdersForClient({ page: 1, pageSize: 20 })
    ).rejects.toThrow("Unauthorized");
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

    await expect(
      fetchOrdersForClient({ page: 1, pageSize: 20 })
    ).rejects.toThrow("Only CLIENT users can access orders");
  });

  it("should throw error when CLIENT user has no clientId", async () => {
    vi.mocked(currentUser).mockResolvedValue({
      id: "user1",
      email: "client@test.com",
      role: "CLIENT",
      clientId: null,
      name: "Client",
      agentCode: null,
      vendorId: null,
    });

    await expect(
      fetchOrdersForClient({ page: 1, pageSize: 20 })
    ).rejects.toThrow("User does not have an associated client");
  });

  it("should fetch orders for authenticated CLIENT user", async () => {
    vi.mocked(currentUser).mockResolvedValue({
      id: "user1",
      email: "client@test.com",
      role: "CLIENT",
      clientId: "client1",
      name: "Client",
      agentCode: null,
      vendorId: null,
    });

    const mockOrders = [
      {
        id: "order1",
        orderNumber: "HYD-20241114-1234",
        createdAt: new Date("2024-11-14T10:00:00Z"),
        status: "SUBMITTED",
        totalCents: 10000,
        _count: {
          items: 3,
        },
      },
      {
        id: "order2",
        orderNumber: "HYD-20241113-5678",
        createdAt: new Date("2024-11-13T15:30:00Z"),
        status: "CONFIRMED",
        totalCents: 25000,
        _count: {
          items: 5,
        },
      },
    ];

    vi.mocked(prisma.order.findMany).mockResolvedValue(mockOrders as any);
    vi.mocked(prisma.order.count).mockResolvedValue(2);

    const result = await fetchOrdersForClient({ page: 1, pageSize: 20 });

    // Verify correct query was made
    expect(prisma.order.findMany).toHaveBeenCalledWith({
      where: {
        clientId: "client1",
        deletedAt: null,
      },
      select: {
        id: true,
        orderNumber: true,
        createdAt: true,
        status: true,
        totalCents: true,
        _count: {
          select: {
            items: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
      skip: 0,
    });

    expect(prisma.order.count).toHaveBeenCalledWith({
      where: {
        clientId: "client1",
        deletedAt: null,
      },
    });

    // Verify result structure
    expect(result).toEqual({
      data: [
        {
          id: "order1",
          orderNumber: "HYD-20241114-1234",
          createdAt: "2024-11-14T10:00:00.000Z",
          status: "SUBMITTED",
          totalCents: 10000,
          itemCount: 3,
        },
        {
          id: "order2",
          orderNumber: "HYD-20241113-5678",
          createdAt: "2024-11-13T15:30:00.000Z",
          status: "CONFIRMED",
          totalCents: 25000,
          itemCount: 5,
        },
      ],
      total: 2,
      currentPage: 1,
      totalPages: 1,
      pageSize: 20,
    });
  });

  it("should handle pagination correctly", async () => {
    vi.mocked(currentUser).mockResolvedValue({
      id: "user1",
      email: "client@test.com",
      role: "CLIENT",
      clientId: "client1",
      name: "Client",
      agentCode: null,
      vendorId: null,
    });

    vi.mocked(prisma.order.findMany).mockResolvedValue([]);
    vi.mocked(prisma.order.count).mockResolvedValue(45);

    const result = await fetchOrdersForClient({ page: 2, pageSize: 20 });

    // Verify pagination offset
    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 20,
        skip: 20, // page 2 offset
      })
    );

    // Verify pagination metadata
    expect(result.currentPage).toBe(2);
    expect(result.totalPages).toBe(3); // 45 items / 20 per page = 3 pages
    expect(result.total).toBe(45);
  });

  it("should clamp page to minimum of 1", async () => {
    vi.mocked(currentUser).mockResolvedValue({
      id: "user1",
      email: "client@test.com",
      role: "CLIENT",
      clientId: "client1",
      name: "Client",
      agentCode: null,
      vendorId: null,
    });

    vi.mocked(prisma.order.findMany).mockResolvedValue([]);
    vi.mocked(prisma.order.count).mockResolvedValue(0);

    await fetchOrdersForClient({ page: -5, pageSize: 20 });

    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0, // Should use page 1
      })
    );
  });

  it("should clamp pageSize between 10 and 100", async () => {
    vi.mocked(currentUser).mockResolvedValue({
      id: "user1",
      email: "client@test.com",
      role: "CLIENT",
      clientId: "client1",
      name: "Client",
      agentCode: null,
      vendorId: null,
    });

    vi.mocked(prisma.order.findMany).mockResolvedValue([]);
    vi.mocked(prisma.order.count).mockResolvedValue(0);

    // Test minimum
    await fetchOrdersForClient({ page: 1, pageSize: 5 });
    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10 })
    );

    // Test maximum
    await fetchOrdersForClient({ page: 1, pageSize: 200 });
    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100 })
    );
  });

  it("should return empty data for CLIENT with no orders", async () => {
    vi.mocked(currentUser).mockResolvedValue({
      id: "user1",
      email: "client@test.com",
      role: "CLIENT",
      clientId: "client1",
      name: "Client",
      agentCode: null,
      vendorId: null,
    });

    vi.mocked(prisma.order.findMany).mockResolvedValue([]);
    vi.mocked(prisma.order.count).mockResolvedValue(0);

    const result = await fetchOrdersForClient({ page: 1, pageSize: 20 });

    expect(result).toEqual({
      data: [],
      total: 0,
      currentPage: 1,
      totalPages: 0,
      pageSize: 20,
    });
  });

  it("should only fetch orders for the authenticated CLIENT (authorization)", async () => {
    vi.mocked(currentUser).mockResolvedValue({
      id: "user1",
      email: "client@test.com",
      role: "CLIENT",
      clientId: "client1",
      name: "Client",
      agentCode: null,
      vendorId: null,
    });

    vi.mocked(prisma.order.findMany).mockResolvedValue([]);
    vi.mocked(prisma.order.count).mockResolvedValue(0);

    await fetchOrdersForClient({ page: 1, pageSize: 20 });

    // Verify where clause enforces clientId authorization
    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          clientId: "client1",
        }),
      })
    );
  });
});

describe("Order History - fetchOrderById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should throw error when user is not authenticated", async () => {
    vi.mocked(currentUser).mockResolvedValue(null);

    await expect(fetchOrderById("order1")).rejects.toThrow("Unauthorized");
  });

  it("should throw error when user is not CLIENT role", async () => {
    vi.mocked(currentUser).mockResolvedValue({
      id: "user1",
      email: "vendor@test.com",
      role: "VENDOR",
      clientId: null,
      vendorId: "vendor1",
      name: "Vendor",
      agentCode: null,
    });

    await expect(fetchOrderById("order1")).rejects.toThrow(
      "Only CLIENT users can access orders"
    );
  });

  it("should throw error when CLIENT user has no clientId", async () => {
    vi.mocked(currentUser).mockResolvedValue({
      id: "user1",
      email: "client@test.com",
      role: "CLIENT",
      clientId: null,
      name: "Client",
      agentCode: null,
      vendorId: null,
    });

    await expect(fetchOrderById("order1")).rejects.toThrow(
      "User does not have an associated client"
    );
  });

  it("should throw error when order is not found", async () => {
    vi.mocked(currentUser).mockResolvedValue({
      id: "user1",
      email: "client@test.com",
      role: "CLIENT",
      clientId: "client1",
      name: "Client",
      agentCode: null,
      vendorId: null,
    });

    vi.mocked(prisma.order.findFirst).mockResolvedValue(null);

    await expect(fetchOrderById("nonexistent")).rejects.toThrow(
      "Order not found"
    );
  });

  it("should fetch order with items for authorized CLIENT", async () => {
    vi.mocked(currentUser).mockResolvedValue({
      id: "user1",
      email: "client@test.com",
      role: "CLIENT",
      clientId: "client1",
      name: "Client",
      agentCode: null,
      vendorId: null,
    });

    const mockOrderFromDb = {
      id: "order1",
      orderNumber: "HYD-20241114-1234",
      createdAt: new Date("2024-11-14T10:00:00Z"),
      status: "SUBMITTED",
      totalCents: 10000,
      clientId: "client1",
      items: [
        {
          id: "item1",
          productName: "Pasta",
          vendorName: "Italian Imports",
          qty: 5,
          unitPriceCents: 1000,
          lineTotalCents: 5000,
        },
        {
          id: "item2",
          productName: "Olive Oil",
          vendorName: "Italian Imports",
          qty: 2,
          unitPriceCents: 2500,
          lineTotalCents: 5000,
        },
      ],
    };

    vi.mocked(prisma.order.findFirst).mockResolvedValue(mockOrderFromDb as any);

    const result = await fetchOrderById("order1");

    const expectedResult = {
      ...mockOrderFromDb,
      createdAt: "2024-11-14T10:00:00.000Z",
    };

    // Verify authorization in query
    expect(prisma.order.findFirst).toHaveBeenCalledWith({
      where: {
        id: "order1",
        clientId: "client1", // Must match user's clientId
        deletedAt: null,
      },
      select: {
        id: true,
        orderNumber: true,
        createdAt: true,
        status: true,
        totalCents: true,
        clientId: true,
        items: {
          select: {
            id: true,
            productName: true,
            vendorName: true,
            qty: true,
            unitPriceCents: true,
            lineTotalCents: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    // Verify result
    expect(result).toEqual(expectedResult);
  });

  it("should enforce authorization - CLIENT cannot view other CLIENT's orders", async () => {
    vi.mocked(currentUser).mockResolvedValue({
      id: "user1",
      email: "client1@test.com",
      role: "CLIENT",
      clientId: "client1",
      name: "Client 1",
      agentCode: null,
      vendorId: null,
    });

    // Order belongs to client2, not client1
    vi.mocked(prisma.order.findFirst).mockResolvedValue(null);

    await expect(fetchOrderById("order-belongs-to-client2")).rejects.toThrow(
      "Order not found"
    );

    // Verify where clause includes clientId filter
    expect(prisma.order.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          clientId: "client1", // Only their own orders
        }),
      })
    );
  });

  it("should include all order items with correct formatting", async () => {
    vi.mocked(currentUser).mockResolvedValue({
      id: "user1",
      email: "client@test.com",
      role: "CLIENT",
      clientId: "client1",
      name: "Client",
      agentCode: null,
      vendorId: null,
    });

    const mockOrder = {
      id: "order1",
      orderNumber: "HYD-20241114-1234",
      createdAt: new Date("2024-11-14T10:00:00Z"),
      status: "DELIVERED",
      totalCents: 15000,
      clientId: "client1",
      items: [
        {
          id: "item1",
          productName: "Product A",
          vendorName: "Vendor A",
          qty: 3,
          unitPriceCents: 2000,
          lineTotalCents: 6000,
        },
        {
          id: "item2",
          productName: "Product B",
          vendorName: "Vendor B",
          qty: 1,
          unitPriceCents: 9000,
          lineTotalCents: 9000,
        },
      ],
    };

    vi.mocked(prisma.order.findFirst).mockResolvedValue(mockOrder as any);

    const result = await fetchOrderById("order1");

    // Verify item totals are correct
    expect(result.items[0].lineTotalCents).toBe(6000);
    expect(result.items[1].lineTotalCents).toBe(9000);
    expect(result.totalCents).toBe(15000);

    // Verify all item fields are present
    expect(result.items[0]).toHaveProperty("productName");
    expect(result.items[0]).toHaveProperty("vendorName");
    expect(result.items[0]).toHaveProperty("qty");
    expect(result.items[0]).toHaveProperty("unitPriceCents");
    expect(result.items[0]).toHaveProperty("lineTotalCents");
  });

  it("should return items ordered by creation time", async () => {
    vi.mocked(currentUser).mockResolvedValue({
      id: "user1",
      email: "client@test.com",
      role: "CLIENT",
      clientId: "client1",
      name: "Client",
      agentCode: null,
      vendorId: null,
    });

    vi.mocked(prisma.order.findFirst).mockResolvedValue({
      id: "order1",
      orderNumber: "HYD-20241114-1234",
      createdAt: new Date(),
      status: "SUBMITTED",
      totalCents: 10000,
      clientId: "client1",
      items: [],
    } as any);

    await fetchOrderById("order1");

    // Verify items are ordered by createdAt asc
    expect(prisma.order.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          items: expect.objectContaining({
            orderBy: {
              createdAt: "asc",
            },
          }),
        }),
      })
    );
  });
});
