import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction, AuditAction } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    // Require ADMIN or AGENT role
    await requireRole("ADMIN", "AGENT");

    const { orderId } = await context.params;
    const body = await request.json();
    const { notes } = body;

    // Validate input
    if (typeof notes !== "string") {
      return NextResponse.json(
        { error: "Invalid notes format" },
        { status: 400 }
      );
    }

    // Fetch current order to get old notes
    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: { notes: true },
    });

    if (!currentOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Update notes
    await prisma.order.update({
      where: { id: orderId },
      data: { notes: notes.trim() || null },
    });

    // Log the notes update
    await logAction({
      entityType: "Order",
      entityId: orderId,
      action: AuditAction.ORDER_NOTES_UPDATED,
      diff: {
        field: "notes",
        from: currentOrder.notes,
        to: notes.trim() || null,
      },
    });

    // Revalidate the order detail page
    revalidatePath(`/dashboard/orders/${orderId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating order notes:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update notes",
      },
      { status: 500 }
    );
  }
}
