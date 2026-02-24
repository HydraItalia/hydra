import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMobileRequest } from "@/lib/mobile-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const payload = await verifyMobileRequest(req);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Look up the user's driverId via Prisma
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { driverId: true },
  });

  if (!user?.driverId) {
    return NextResponse.json(
      { error: "Driver not found" },
      { status: 404 },
    );
  }

  try {
    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: {
        Order: {
          select: {
            orderNumber: true,
            deliveryAddress: true,
            totalCents: true,
            notes: true,
            Client: {
              select: {
                name: true,
                shortAddress: true,
                fullAddress: true,
                phone: true,
              },
            },
            OrderItem: {
              select: {
                productName: true,
                qty: true,
                vendorName: true,
              },
            },
          },
        },
        SubOrder: {
          select: {
            subOrderNumber: true,
            subTotalCents: true,
            vendorNotes: true,
            Vendor: { select: { name: true } },
            Order: {
              select: {
                orderNumber: true,
                deliveryAddress: true,
                notes: true,
                Client: {
                  select: {
                    name: true,
                    shortAddress: true,
                    fullAddress: true,
                    phone: true,
                  },
                },
              },
            },
            OrderItem: {
              select: {
                productName: true,
                qty: true,
                vendorName: true,
              },
            },
          },
        },
      },
    });

    if (!delivery) {
      return NextResponse.json(
        { error: "Delivery not found" },
        { status: 404 },
      );
    }

    // Verify it belongs to the authenticated driver
    if (delivery.driverId !== user.driverId) {
      return NextResponse.json(
        { error: "Delivery not found" },
        { status: 404 },
      );
    }

    const order = delivery.Order ?? delivery.SubOrder?.Order;
    const items =
      delivery.Order?.OrderItem ?? delivery.SubOrder?.OrderItem ?? [];
    const totalCents =
      delivery.Order?.totalCents ?? delivery.SubOrder?.subTotalCents ?? null;

    const detail = {
      id: delivery.id,
      orderNumber:
        delivery.Order?.orderNumber ?? delivery.SubOrder?.subOrderNumber ?? "",
      clientName: order?.Client.name ?? "",
      addressLine1: order?.deliveryAddress ?? order?.Client.shortAddress ?? "",
      fullAddress: order?.Client.fullAddress ?? "",
      phone: order?.Client.phone ?? "",
      scheduledFor: delivery.assignedAt.toISOString(),
      status: delivery.status,
      notes:
        delivery.notes ??
        delivery.Order?.notes ??
        delivery.SubOrder?.vendorNotes ??
        "",
      items: items.map((item) => ({
        name: item.productName,
        qty: item.qty,
        vendorName: item.vendorName,
      })),
      totalCents,
      vendorName: delivery.SubOrder?.Vendor?.name ?? null,
      pickedUpAt: delivery.pickedUpAt?.toISOString() ?? null,
      inTransitAt: delivery.inTransitAt?.toISOString() ?? null,
      deliveredAt: delivery.deliveredAt?.toISOString() ?? null,
      exceptionAt: delivery.exceptionAt?.toISOString() ?? null,
      exceptionReason: delivery.exceptionReason ?? null,
    };

    return NextResponse.json(detail);
  } catch (error) {
    console.error("Mobile delivery detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch delivery" },
      { status: 500 },
    );
  }
}
