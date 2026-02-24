import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DeliveryStatus } from "@prisma/client";
import { verifyMobileRequest } from "@/lib/mobile-auth";

export async function GET(req: NextRequest) {
  const payload = await verifyMobileRequest(req);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  // Look up the user's driverId via Prisma
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { driverId: true },
  });

  if (!user?.driverId) {
    return NextResponse.json([]);
  }

  // Date filter (only applied when explicitly requested)
  const dateFilter = dateParam
    ? (() => {
        const date = new Date(dateParam);
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        return { gte: startOfDay, lte: endOfDay };
      })()
    : undefined;

  try {
    const deliveries = await prisma.delivery.findMany({
      where: {
        driverId: user.driverId,
        ...(dateFilter ? { assignedAt: dateFilter } : {}),
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
