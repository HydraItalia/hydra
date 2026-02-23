import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DeliveryStatus } from "@prisma/client";

// Phase 2: No auth — hardcoded demo driver
const DEMO_DRIVER_EMAIL = "driver.marco@hydra.local";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date");
  const statusParam = searchParams.get("status");

  // Validate status if provided
  if (
    statusParam &&
    !Object.values(DeliveryStatus).includes(statusParam as DeliveryStatus)
  ) {
    return NextResponse.json(
      {
        error: `Invalid status. Valid values: ${Object.values(DeliveryStatus).join(", ")}`,
      },
      { status: 400 },
    );
  }

  // Resolve demo driver
  const user = await prisma.user.findUnique({
    where: { email: DEMO_DRIVER_EMAIL },
    select: { driverId: true },
  });

  if (!user?.driverId) {
    // No demo driver seeded yet — return empty list so the app works gracefully
    return NextResponse.json([]);
  }

  // Date range (default: today)
  const date = dateParam ? new Date(dateParam) : new Date();
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  try {
    const deliveries = await prisma.delivery.findMany({
      where: {
        driverId: user.driverId,
        assignedAt: { gte: startOfDay, lte: endOfDay },
        ...(statusParam ? { status: statusParam as DeliveryStatus } : {}),
      },
      include: {
        Order: {
          select: {
            orderNumber: true,
            deliveryAddress: true,
            Client: { select: { name: true, shortAddress: true } },
            _count: { select: { OrderItem: true } },
          },
        },
        SubOrder: {
          select: {
            subOrderNumber: true,
            Order: {
              select: {
                orderNumber: true,
                deliveryAddress: true,
                Client: { select: { name: true, shortAddress: true } },
              },
            },
            _count: { select: { OrderItem: true } },
          },
        },
      },
      orderBy: { routeSequence: "asc" },
    });

    const summaries = deliveries.map((d) => {
      const order = d.Order ?? d.SubOrder?.Order;
      const itemCount =
        d.Order?._count.OrderItem ?? d.SubOrder?._count.OrderItem ?? 0;

      return {
        id: d.id,
        orderNumber: d.Order?.orderNumber ?? d.SubOrder?.subOrderNumber ?? "",
        clientName: order?.Client.name ?? "",
        addressLine1:
          order?.deliveryAddress ?? order?.Client.shortAddress ?? "",
        scheduledFor: d.assignedAt.toISOString(),
        status: d.status,
        itemCount,
      };
    });

    return NextResponse.json(summaries);
  } catch (error) {
    console.error("Mobile deliveries list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch deliveries" },
      { status: 500 },
    );
  }
}
